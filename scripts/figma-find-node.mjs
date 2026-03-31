/**
 * Extract a specific node from already-downloaded page data
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'scripts', 'figma-data');
const targetId = process.argv[2];

if (!targetId) {
  console.log('Usage: node figma-find-node.mjs <node-id>');
  process.exit(1);
}

function rgbaInfo(hex, opacity) {
  return opacity < 100 ? `${hex} (${opacity}%)` : hex;
}

function findNode(node, id) {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
}

function printNode(node, indent = '') {
  const size = node.bounds ? `${node.bounds.w}×${node.bounds.h}` : '';
  console.log(`${indent}📦 ${node.type}: "${node.name}" (${node.id}) ${size ? `[${size}]` : ''}`);
  
  if (node.layout) {
    const l = node.layout;
    console.log(`${indent}   Layout: ${l.mode} | gap: ${l.gap}px | padding: [${l.pad.join(', ')}]`);
    if (l.mainAlign) console.log(`${indent}   Align: main=${l.mainAlign} cross=${l.crossAlign}`);
    if (l.hSize) console.log(`${indent}   Sizing: h=${l.hSize} v=${l.vSize}`);
  }
  
  if (node.fills?.length) {
    for (const f of node.fills) {
      if (f.t === 'SOLID') {
        console.log(`${indent}   Fill: ${rgbaInfo(f.hex, f.op)}`);
      } else if (f.t === 'GRADIENT') {
        const stops = f.stops.map(s => `${s.c} @${s.p}%`).join(', ');
        console.log(`${indent}   Gradient: ${stops}`);
      } else if (f.t === 'IMAGE') {
        console.log(`${indent}   Image: ref=${f.ref}`);
      }
    }
  }
  
  if (node.strokes?.length) {
    for (const s of node.strokes) {
      console.log(`${indent}   Stroke: ${s.hex} weight=${s.weight}px`);
    }
  }
  
  if (node.effects?.length) {
    for (const e of node.effects) {
      console.log(`${indent}   Effect: ${e.type} offset(${e.off?.x},${e.off?.y}) blur=${e.blur} spread=${e.spread} ${e.color}`);
    }
  }
  
  if (node.radius !== undefined) {
    console.log(`${indent}   Radius: ${Array.isArray(node.radius) ? `[${node.radius.join(', ')}]` : node.radius + 'px'}`);
  }
  
  if (node.typo) {
    const t = node.typo;
    console.log(`${indent}   Typography: ${t.font} ${t.weight} ${t.size}px / ${t.lh ? t.lh + 'px' : 'auto'}${t.ls ? ` ls:${t.ls}` : ''} align:${t.align || 'LEFT'}`);
  }
  
  if (node.text) {
    const text = node.text.length > 100 ? node.text.slice(0, 100) + '...' : node.text;
    console.log(`${indent}   Text: "${text}"`);
  }
  
  if (node.opacity !== undefined) {
    console.log(`${indent}   Opacity: ${node.opacity}`);
  }
  
  if (node.styleRefs) {
    const refs = Object.entries(node.styleRefs).map(([k,v]) => `${k}=${v}`).join(', ');
    console.log(`${indent}   Style Refs: ${refs}`);
  }
  
  if (node.children) {
    for (const child of node.children) {
      printNode(child, indent + '  ');
    }
  }
  
  if (node.childCount) {
    console.log(`${indent}   ... ${node.childCount} children (depth limit)`);
  }
}

// Search through all page files
const files = readdirSync(DATA_DIR).filter(f => f.startsWith('page_') && f.endsWith('.json'));

for (const file of files) {
  const data = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'));
  const found = findNode(data, targetId);
  if (found) {
    console.log(`Found in: ${file}\n`);
    printNode(found);
    process.exit(0);
  }
}

// Also check design-system-page.json
try {
  const dsData = JSON.parse(readFileSync(join(DATA_DIR, 'design-system-page.json'), 'utf8'));
  const found = findNode(dsData, targetId);
  if (found) {
    console.log(`Found in: design-system-page.json\n`);
    printNode(found);
    process.exit(0);
  }
} catch {}

console.log(`Node ${targetId} not found in any downloaded page data.`);
console.log('Available page files:', files.join(', '));
