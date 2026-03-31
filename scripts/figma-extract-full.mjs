/**
 * Figma Extractor v3 — Extract everything from the file endpoint directly
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN || '';
const FILE_KEY = 'JbK4p9yyXBjhu7B7VOIBhd';
const OUTPUT_DIR = join(process.cwd(), 'scripts', 'figma-data');

const headers = { 'X-Figma-Token': FIGMA_TOKEN };

async function figmaGet(endpoint) {
  const res = await fetch(`https://api.figma.com/v1${endpoint}`, { headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

function rgbaToHex(r, g, b, a) {
  const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  return { hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`, opacity: a !== undefined ? Math.round(a * 100) : 100 };
}

function extractStyleValue(node) {
  const result = { id: node.id, name: node.name, type: node.type };
  
  if (node.fills && node.fills.length > 0) {
    result.fills = node.fills.filter(f => f.visible !== false).map(f => {
      if (f.type === 'SOLID') {
        const { hex, opacity } = rgbaToHex(f.color.r, f.color.g, f.color.b, f.opacity ?? f.color.a);
        return { type: 'SOLID', hex, opacity };
      }
      return { type: f.type };
    });
  }
  
  if (node.style) {
    result.typography = {
      fontFamily: node.style.fontFamily,
      fontWeight: node.style.fontWeight,
      fontSize: node.style.fontSize,
      lineHeightPx: node.style.lineHeightPx,
      lineHeightUnit: node.style.lineHeightUnit,
      letterSpacing: node.style.letterSpacing,
    };
  }
  
  if (node.effects && node.effects.length > 0) {
    result.effects = node.effects.filter(e => e.visible !== false).map(e => {
      const eff = { type: e.type };
      if (e.color) { eff.color = rgbaToHex(e.color.r, e.color.g, e.color.b, e.color.a).hex; }
      if (e.offset) eff.offset = e.offset;
      if (e.radius !== undefined) eff.blur = e.radius;
      if (e.spread !== undefined) eff.spread = e.spread;
      return eff;
    });
  }
  
  return result;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // Get full file with depth=2 for overview
  console.log('📄 Fetching file overview (depth=2)...');
  const fileData = await figmaGet(`/files/${FILE_KEY}?depth=2`);
  
  // ── 1. Save pages list ──
  const pages = fileData.document.children.map(page => ({
    id: page.id,
    name: page.name,
    frames: (page.children || []).map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      width: f.absoluteBoundingBox ? Math.round(f.absoluteBoundingBox.width) : null,
      height: f.absoluteBoundingBox ? Math.round(f.absoluteBoundingBox.height) : null,
    })),
  }));
  writeFileSync(join(OUTPUT_DIR, 'pages.json'), JSON.stringify(pages, null, 2));
  console.log('✅ pages.json');
  
  // ── 2. Extract shared styles from file metadata ──
  const styleMap = {};
  if (fileData.styles) {
    for (const [id, style] of Object.entries(fileData.styles)) {
      styleMap[id] = { ...style, nodeId: id };
    }
  }
  
  // Now get the actual values for those styles by fetching their nodes
  const styleNodeIds = Object.keys(styleMap);
  console.log(`🎨 Found ${styleNodeIds.length} shared styles. Fetching values...`);
  
  if (styleNodeIds.length > 0) {
    const chunks = [];
    for (let i = 0; i < styleNodeIds.length; i += 15) {
      chunks.push(styleNodeIds.slice(i, i + 15));
    }
    
    const resolvedStyles = [];
    for (const chunk of chunks) {
      const nodeData = await figmaGet(`/files/${FILE_KEY}/nodes?ids=${chunk.join(',')}`);
      for (const [id, wrapper] of Object.entries(nodeData.nodes)) {
        if (!wrapper.document) continue;
        const node = wrapper.document;
        const meta = styleMap[id];
        const resolved = {
          id,
          name: meta.name,
          styleType: meta.styleType,
          ...extractStyleValue(node),
        };
        resolvedStyles.push(resolved);
      }
    }
    
    writeFileSync(join(OUTPUT_DIR, 'styles.json'), JSON.stringify(resolvedStyles, null, 2));
    console.log(`✅ styles.json (${resolvedStyles.length} styles resolved)`);
    
    // Print summary
    console.log('\n═══ COLOR PALETTE ═══');
    for (const s of resolvedStyles.filter(s => s.styleType === 'FILL')) {
      const fill = s.fills?.[0];
      if (fill) {
        console.log(`  ${s.name.padEnd(18)} → ${fill.hex}${fill.opacity < 100 ? ` (${fill.opacity}%)` : ''}`);
      }
    }
    
    console.log('\n═══ TYPOGRAPHY ═══');
    for (const s of resolvedStyles.filter(s => s.styleType === 'TEXT')) {
      const t = s.typography;
      if (t) {
        console.log(`  ${s.name.padEnd(28)} → ${t.fontFamily} ${t.fontWeight} ${t.fontSize}px / ${t.lineHeightPx ? Math.round(t.lineHeightPx) + 'px' : 'auto'}`);
      }
    }
    
    console.log('\n═══ EFFECTS ═══');
    for (const s of resolvedStyles.filter(s => s.styleType === 'EFFECT')) {
      for (const e of (s.effects || [])) {
        console.log(`  ${s.name.padEnd(18)} → ${e.type} x:${e.offset?.x} y:${e.offset?.y} blur:${e.blur} spread:${e.spread} ${e.color}`);
      }
    }
  }
  
  // ── 3. Components & Component Sets ──
  const components = [];
  if (fileData.components) {
    for (const [id, comp] of Object.entries(fileData.components)) {
      components.push({ id, name: comp.name, description: comp.description, key: comp.key });
    }
  }
  const componentSets = [];
  if (fileData.componentSets) {
    for (const [id, set] of Object.entries(fileData.componentSets)) {
      componentSets.push({ id, name: set.name, description: set.description, key: set.key });
    }
  }
  writeFileSync(join(OUTPUT_DIR, 'components.json'), JSON.stringify({ components, componentSets }, null, 2));
  console.log(`\n✅ components.json (${components.length} components, ${componentSets.length} sets)`);
  
  // ── 4. Extract each page details individually ──
  console.log('\n📑 Extracting each page with full details...');
  for (const page of pages) {
    const safeName = page.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    console.log(`   Extracting "${page.name}"...`);
    try {
      const nodeData = await figmaGet(`/files/${FILE_KEY}/nodes?ids=${page.id}`);
      const pageNode = nodeData.nodes[page.id]?.document;
      if (pageNode) {
        const flattened = flattenNode(pageNode, 0);
        writeFileSync(join(OUTPUT_DIR, `page_${safeName}.json`), JSON.stringify(flattened, null, 2));
        console.log(`   ✅ page_${safeName}.json`);
      }
    } catch (err) {
      console.log(`   ⚠️ Failed: ${err.message}`);
    }
  }
  
  // ── 5. Print full page overview ──
  console.log('\n═══ ALL PAGES & FRAMES ═══\n');
  for (const page of pages) {
    console.log(`📑 ${page.name} (${page.id})`);
    for (const frame of page.frames) {
      console.log(`   ├── ${frame.name} | ${frame.width}×${frame.height} | id: ${frame.id}`);
    }
    console.log('');
  }
  
  console.log(`\n✅ All data saved to: ${OUTPUT_DIR}`);
}

function flattenNode(node, depth) {
  const result = {
    id: node.id,
    name: node.name,
    type: node.type,
  };
  
  if (node.absoluteBoundingBox) {
    const bb = node.absoluteBoundingBox;
    result.bounds = { x: Math.round(bb.x), y: Math.round(bb.y), w: Math.round(bb.width), h: Math.round(bb.height) };
  }
  
  if (node.layoutMode) {
    result.layout = {
      mode: node.layoutMode,
      gap: node.itemSpacing ?? 0,
      pad: [node.paddingTop??0, node.paddingRight??0, node.paddingBottom??0, node.paddingLeft??0],
      mainAlign: node.primaryAxisAlignItems,
      crossAlign: node.counterAxisAlignItems,
      hSize: node.layoutSizingHorizontal,
      vSize: node.layoutSizingVertical,
    };
  }
  
  if (node.fills?.length > 0) {
    result.fills = node.fills.filter(f => f.visible !== false).map(f => {
      if (f.type === 'SOLID') {
        const { hex, opacity } = rgbaToHex(f.color.r, f.color.g, f.color.b, f.opacity ?? f.color.a);
        return { t: 'SOLID', hex, op: opacity };
      }
      if (f.type === 'GRADIENT_LINEAR') {
        return { t: 'GRADIENT', stops: f.gradientStops?.map(s => ({ c: rgbaToHex(s.color.r,s.color.g,s.color.b,s.color.a).hex, p: Math.round(s.position*100) })) };
      }
      if (f.type === 'IMAGE') return { t: 'IMAGE', ref: f.imageRef };
      return { t: f.type };
    });
  }
  
  if (node.strokes?.length > 0) {
    result.strokes = node.strokes.filter(s => s.visible !== false).map(s => {
      if (s.type === 'SOLID') {
        return { hex: rgbaToHex(s.color.r,s.color.g,s.color.b,s.opacity??s.color.a).hex, weight: node.strokeWeight };
      }
      return { t: s.type };
    });
  }
  
  if (node.effects?.length > 0) {
    result.effects = node.effects.filter(e => e.visible !== false).map(e => {
      const r = { type: e.type };
      if (e.color) r.color = rgbaToHex(e.color.r,e.color.g,e.color.b,e.color.a).hex;
      if (e.offset) r.off = e.offset;
      if (e.radius !== undefined) r.blur = e.radius;
      if (e.spread !== undefined) r.spread = e.spread;
      return r;
    });
  }
  
  if (node.cornerRadius) result.radius = node.cornerRadius;
  else if (node.rectangleCornerRadii) result.radius = node.rectangleCornerRadii;
  
  if (node.style) {
    result.typo = {
      font: node.style.fontFamily,
      weight: node.style.fontWeight,
      size: node.style.fontSize,
      lh: node.style.lineHeightPx ? Math.round(node.style.lineHeightPx * 100) / 100 : null,
      ls: node.style.letterSpacing,
      align: node.style.textAlignHorizontal,
    };
  }
  
  if (node.characters) result.text = node.characters;
  if (node.opacity !== undefined && node.opacity < 1) result.opacity = node.opacity;
  if (node.styles) result.styleRefs = node.styles;
  if (node.visible === false) result.visible = false;
  
  if (node.children && depth < 10) {
    result.children = node.children.map(c => flattenNode(c, depth + 1));
  } else if (node.children) {
    result.childCount = node.children.length;
  }
  
  return result;
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
