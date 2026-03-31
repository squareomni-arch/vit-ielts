/**
 * Figma Design Token Extractor
 * Extracts design specs from Figma file via REST API
 */

const FIGMA_TOKEN = process.env.FIGMA_TOKEN || '';
const FILE_KEY = 'JbK4p9yyXBjhu7B7VOIBhd';

const headers = { 'X-Figma-Token': FIGMA_TOKEN };

async function figmaGet(endpoint) {
  const url = `https://api.figma.com/v1${endpoint}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Figma API error: ${res.status} ${res.statusText} - ${url}`);
  }
  return res.json();
}

// ── Step 1: Get file structure (pages & top-level frames) ──
async function getFileStructure() {
  console.log('📄 Fetching file structure...\n');
  const data = await figmaGet(`/files/${FILE_KEY}?depth=2`);
  
  console.log(`File: ${data.name}`);
  console.log(`Last Modified: ${data.lastModified}`);
  console.log(`Version: ${data.version}\n`);
  
  // List all pages and their top-level children
  const pages = data.document.children;
  console.log(`═══ PAGES (${pages.length}) ═══\n`);
  
  for (const page of pages) {
    console.log(`📑 Page: "${page.name}" (id: ${page.id})`);
    if (page.children) {
      for (const child of page.children) {
        const size = child.absoluteBoundingBox 
          ? `${Math.round(child.absoluteBoundingBox.width)}×${Math.round(child.absoluteBoundingBox.height)}`
          : 'N/A';
        console.log(`   ├── ${child.type}: "${child.name}" (id: ${child.id}) [${size}]`);
      }
    }
    console.log('');
  }
  
  // List components
  if (data.components && Object.keys(data.components).length > 0) {
    console.log(`═══ COMPONENTS (${Object.keys(data.components).length}) ═══\n`);
    for (const [id, comp] of Object.entries(data.components)) {
      console.log(`   🧩 "${comp.name}" (id: ${id}) ${comp.description ? `— ${comp.description}` : ''}`);
    }
    console.log('');
  }
  
  // List component sets
  if (data.componentSets && Object.keys(data.componentSets).length > 0) {
    console.log(`═══ COMPONENT SETS (${Object.keys(data.componentSets).length}) ═══\n`);
    for (const [id, set] of Object.entries(data.componentSets)) {
      console.log(`   📦 "${set.name}" (id: ${id}) ${set.description ? `— ${set.description}` : ''}`);
    }
    console.log('');
  }
  
  // List styles
  if (data.styles && Object.keys(data.styles).length > 0) {
    console.log(`═══ STYLES (${Object.keys(data.styles).length}) ═══\n`);
    for (const [id, style] of Object.entries(data.styles)) {
      console.log(`   🎨 [${style.styleType}] "${style.name}" (id: ${id})`);
    }
  }
  
  return data;
}

// ── Step 2: Extract design tokens from a specific node ──
async function extractNodeDetails(nodeId) {
  console.log(`\n═══ NODE DETAILS: ${nodeId} ═══\n`);
  const data = await figmaGet(`/files/${FILE_KEY}/nodes?ids=${nodeId}`);
  
  const node = data.nodes[nodeId]?.document;
  if (!node) {
    console.log('Node not found!');
    return;
  }

  printNodeTree(node, 0);
}

function rgbaToHex(r, g, b, a) {
  const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (a !== undefined && a < 1) {
    return `${hex} (opacity: ${Math.round(a * 100)}%)`;
  }
  return hex;
}

function extractFills(fills) {
  if (!fills || fills.length === 0) return 'none';
  return fills.map(f => {
    if (f.type === 'SOLID') {
      return `SOLID ${rgbaToHex(f.color.r, f.color.g, f.color.b, f.opacity ?? f.color.a)}`;
    }
    if (f.type === 'GRADIENT_LINEAR' || f.type === 'GRADIENT_RADIAL') {
      const stops = f.gradientStops?.map(s => 
        `${rgbaToHex(s.color.r, s.color.g, s.color.b, s.color.a)} at ${Math.round(s.position * 100)}%`
      ).join(', ');
      return `${f.type}: ${stops}`;
    }
    if (f.type === 'IMAGE') {
      return `IMAGE (ref: ${f.imageRef})`;
    }
    return f.type;
  }).join(' | ');
}

function extractStrokes(strokes) {
  if (!strokes || strokes.length === 0) return null;
  return strokes.map(s => {
    if (s.type === 'SOLID') {
      return `SOLID ${rgbaToHex(s.color.r, s.color.g, s.color.b, s.opacity ?? s.color.a)}`;
    }
    return s.type;
  }).join(' | ');
}

function extractEffects(effects) {
  if (!effects || effects.length === 0) return null;
  return effects.map(e => {
    if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') {
      const c = e.color;
      return `${e.type}: offset(${e.offset?.x ?? 0}, ${e.offset?.y ?? 0}) blur(${e.radius}) spread(${e.spread ?? 0}) ${rgbaToHex(c.r, c.g, c.b, c.a)}`;
    }
    if (e.type === 'LAYER_BLUR' || e.type === 'BACKGROUND_BLUR') {
      return `${e.type}: radius(${e.radius})`;
    }
    return e.type;
  }).join(' | ');
}

function printNodeTree(node, depth) {
  const indent = '  '.repeat(depth);
  const bb = node.absoluteBoundingBox;
  const size = bb ? `${Math.round(bb.width)}×${Math.round(bb.height)}` : '';
  
  // Basic info
  console.log(`${indent}┌─ ${node.type}: "${node.name}" (id: ${node.id}) ${size ? `[${size}]` : ''}`);
  
  // Layout properties
  if (node.layoutMode) {
    const gap = node.itemSpacing ?? 0;
    const padT = node.paddingTop ?? 0;
    const padR = node.paddingRight ?? 0;
    const padB = node.paddingBottom ?? 0;
    const padL = node.paddingLeft ?? 0;
    console.log(`${indent}│  Layout: ${node.layoutMode} | gap: ${gap}px | padding: ${padT} ${padR} ${padB} ${padL}`);
    if (node.primaryAxisAlignItems) console.log(`${indent}│  Align: primary=${node.primaryAxisAlignItems} counter=${node.counterAxisAlignItems}`);
    if (node.layoutSizingHorizontal) console.log(`${indent}│  Sizing: h=${node.layoutSizingHorizontal} v=${node.layoutSizingVertical}`);
  }
  
  // Visual properties
  const fills = extractFills(node.fills);
  if (fills !== 'none') console.log(`${indent}│  Fill: ${fills}`);
  
  const strokes = extractStrokes(node.strokes);
  if (strokes) console.log(`${indent}│  Stroke: ${strokes} | weight: ${node.strokeWeight ?? 0}px`);
  
  const effects = extractEffects(node.effects);
  if (effects) console.log(`${indent}│  Effects: ${effects}`);
  
  // Border radius
  if (node.cornerRadius) {
    console.log(`${indent}│  Radius: ${node.cornerRadius}px`);
  } else if (node.rectangleCornerRadii) {
    console.log(`${indent}│  Radius: [${node.rectangleCornerRadii.join(', ')}]`);
  }
  
  // Typography
  if (node.style) {
    const s = node.style;
    console.log(`${indent}│  Typography: ${s.fontFamily} ${s.fontWeight} ${s.fontSize}px / ${s.lineHeightPx ? s.lineHeightPx + 'px' : s.lineHeightPercent ? s.lineHeightPercent + '%' : 'auto'}`);
    if (s.letterSpacing) console.log(`${indent}│  Letter-spacing: ${s.letterSpacing}px`);
    if (s.textAlignHorizontal) console.log(`${indent}│  Text-align: ${s.textAlignHorizontal}`);
  }
  
  // Text content
  if (node.characters) {
    const text = node.characters.length > 80 ? node.characters.slice(0, 80) + '...' : node.characters;
    console.log(`${indent}│  Text: "${text}"`);
  }
  
  // Opacity
  if (node.opacity !== undefined && node.opacity < 1) {
    console.log(`${indent}│  Opacity: ${node.opacity}`);
  }
  
  // Constraints
  if (bb) {
    console.log(`${indent}│  Position: x=${Math.round(bb.x)} y=${Math.round(bb.y)}`);
  }
  
  console.log(`${indent}└──`);
  
  // Recurse into children (limit depth to avoid overwhelming output)
  if (node.children && depth < 6) {
    for (const child of node.children) {
      printNodeTree(child, depth + 1);
    }
  } else if (node.children && depth >= 6) {
    console.log(`${indent}  ... ${node.children.length} more children (depth limit reached)`);
  }
}

// ── Main ──
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'structure') {
    await getFileStructure();
  } else if (args[0] === 'node' && args[1]) {
    await extractNodeDetails(args[1]);
  } else {
    console.log('Usage:');
    console.log('  node figma-extract.mjs structure        — List all pages & frames');
    console.log('  node figma-extract.mjs node <node-id>   — Extract details of a specific node');
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
