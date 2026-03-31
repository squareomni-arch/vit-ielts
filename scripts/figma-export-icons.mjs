/**
 * Export individual icons and logos from Figma as SVG
 * Reads directly from downloaded JSON data (no text parsing)
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN || '';
const FILE_KEY = 'JbK4p9yyXBjhu7B7VOIBhd';
const DATA_DIR = join(process.cwd(), 'scripts', 'figma-data');
const headers = { 'X-Figma-Token': FIGMA_TOKEN };

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function figmaGet(endpoint) {
  const res = await fetch(`https://api.figma.com/v1${endpoint}`, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function downloadFile(url, outputPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(outputPath, buffer);
  return buffer.length;
}

function cleanName(name) {
  return name
    .replace(/\s*\(\d+\)\s*/g, '')     // Remove "(1)" suffixes
    .replace(/\s+\d+$/, '')             // Remove trailing " 1"  
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * Find nodes under a parent by searching the JSON tree
 */
function findNodeById(tree, targetId) {
  if (tree.id === targetId) return tree;
  if (tree.children) {
    for (const child of tree.children) {
      const found = findNodeById(child, targetId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Extract exportable children from a parent node
 * Returns COMPONENT, FRAME (illustrations), RECTANGLE (images), top-level GROUPs
 */
function getExportableChildren(parentNode) {
  if (!parentNode.children) return [];
  
  const exportable = [];
  for (const child of parentNode.children) {
    const type = child.type;
    // Export components, frames, rectangles (images), and named groups
    if (['COMPONENT', 'FRAME', 'RECTANGLE', 'GROUP', 'INSTANCE'].includes(type)) {
      exportable.push({
        id: child.id,
        name: child.name,
        type: child.type,
        width: child.bounds?.w || 0,
        height: child.bounds?.h || 0,
        hasImage: child.fills?.some(f => f.t === 'IMAGE') || false,
      });
    }
  }
  return exportable;
}

async function exportNodes(nodes, outDir, format, scale) {
  mkdirSync(outDir, { recursive: true });
  
  const results = [];
  const ids = nodes.map(n => n.id).join(',');
  
  console.log(`\n   📦 Fetching image URLs for ${nodes.length} nodes in a single request...`);
  
  let retries = 3;
  let imageUrls = null;
  
  while (retries > 0) {
    try {
      const data = await figmaGet(
        `/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=${format}&scale=${scale}`
      );
      imageUrls = data.images || {};
      break;
    } catch (err) {
      retries--;
      if (retries > 0) {
        const wait = 30; // Wait 30 seconds on failure
        console.log(`   ⚠️ Rate limited or error, waiting ${wait}s... (${retries} retries left)`);
        await sleep(wait * 1000);
      } else {
        console.log(`   ❌ Failed after retries: ${err.message.slice(0, 80)}`);
      }
    }
  }
  
  if (!imageUrls) return [];
  
  for (const node of nodes) {
    const url = imageUrls[node.id];
    if (!url) {
      console.log(`   ⚠️ No render: ${node.name}`);
      continue;
    }
    
    const fileName = `${cleanName(node.name)}.${format}`;
    const filePath = join(outDir, fileName);
    
    try {
      const size = await downloadFile(url, filePath);
      const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`;
      console.log(`   ✅ ${fileName.padEnd(35)} ${String(node.width).padStart(4)}×${String(node.height).padEnd(4)} ${sizeStr}`);
      results.push({ name: node.name, fileName, size, nodeId: node.id });
    } catch (err) {
      console.log(`   ❌ ${fileName}: ${err.message}`);
    }
  }
  
  return results;
}

async function main() {
  const format = process.argv.includes('--png') ? 'png' : 'svg';
  const scale = format === 'png' ? 2 : 1;
  
  console.log(`\n🎯 Figma Icon & Logo Exporter`);
  console.log(`   Format: ${format.toUpperCase()} | Scale: ${scale}x`);
  
  // ── Load the page JSON data ──
  const dsPageFile = join(DATA_DIR, 'page_des_system.json');
  if (!existsSync(dsPageFile)) {
    console.error('❌ page_des_system.json not found. Run figma-extract-full.mjs first.');
    process.exit(1);
  }
  
  const dsPage = JSON.parse(readFileSync(dsPageFile, 'utf8'));
  
  // ── Find ICONS frame (29:16) ──
  const iconsFrame = findNodeById(dsPage, '29:16');
  const logoSection = findNodeById(dsPage, '1076:2185');
  
  // ── Extract icon nodes ──
  let iconNodes = [];
  if (iconsFrame) {
    iconNodes = getExportableChildren(iconsFrame);
    console.log(`\n═══ ICONS (${iconNodes.length} items) ═══\n`);
    for (const node of iconNodes) {
      console.log(`   ${node.type.padEnd(12)} ${node.name.padEnd(25)} ${node.id.padEnd(14)} ${node.width}×${node.height}${node.hasImage ? ' [IMAGE]' : ''}`);
    }
  } else {
    console.log('\n⚠️ ICONS frame (29:16) not found');
  }
  
  // ── Extract logo nodes ──
  let logoNodes = [];
  if (logoSection) {
    logoNodes = getExportableChildren(logoSection);
    console.log(`\n═══ LOGOS (${logoNodes.length} items) ═══\n`);
    for (const node of logoNodes) {
      console.log(`   ${node.type.padEnd(12)} ${node.name.padEnd(25)} ${node.id.padEnd(14)} ${node.width}×${node.height}${node.hasImage ? ' [IMAGE]' : ''}`);
    }
  } else {
    console.log('\n⚠️ LOGO section (1076:2185) not found');
  }
  
  if (iconNodes.length === 0 && logoNodes.length === 0) {
    console.log('\nNothing to export.');
    process.exit(0);
  }
  
  // ── Export Icons ──
  const iconsDir = join(process.cwd(), 'public', 'assets', 'figma', 'icons');
  console.log(`\n── Exporting ${iconNodes.length} icons to ${iconsDir}`);
  const iconResults = await exportNodes(iconNodes, iconsDir, format, scale);
  
  // ── Export Logos ──  
  const logosDir = join(process.cwd(), 'public', 'assets', 'figma', 'logos');
  console.log(`\n── Exporting ${logoNodes.length} logos to ${logosDir}`);
  const logoResults = await exportNodes(logoNodes, logosDir, format, scale);
  
  // ── Manifest ──
  const allResults = [...iconResults, ...logoResults];
  const manifest = {
    exportedAt: new Date().toISOString(),
    format,
    icons: iconResults.map(r => ({ name: r.name, file: r.fileName, nodeId: r.nodeId })),
    logos: logoResults.map(r => ({ name: r.name, file: r.fileName, nodeId: r.nodeId })),
  };
  
  const manifestDir = join(process.cwd(), 'public', 'assets', 'figma');
  mkdirSync(manifestDir, { recursive: true });
  writeFileSync(join(manifestDir, '_icons-manifest.json'), JSON.stringify(manifest, null, 2));
  
  // ── Summary ──
  console.log(`\n═══ EXPORT COMPLETE ═══`);
  console.log(`   Icons: ${iconResults.length}/${iconNodes.length}`);
  console.log(`   Logos: ${logoResults.length}/${logoNodes.length}`);
  console.log(`   Total: ${allResults.length} files`);
  console.log(`   Size:  ${(allResults.reduce((s, r) => s + r.size, 0) / 1024).toFixed(1)} KB`);
  console.log(`   Manifest: public/assets/figma/_icons-manifest.json\n`);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
