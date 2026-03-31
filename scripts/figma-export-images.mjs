/**
 * Figma Image Exporter v2
 * Exports frames/components as images with smaller batches and retry logic
 * 
 * Usage:
 *   node scripts/figma-export-images.mjs                     → Export all page frames
 *   node scripts/figma-export-images.mjs --nodes 14:137,10:2 → Export specific nodes  
 *   node scripts/figma-export-images.mjs --page "Home Page"  → Export frames from 1 page
 *   node scripts/figma-export-images.mjs --components        → Export all components
 *   node scripts/figma-export-images.mjs --all               → Export everything
 *   node scripts/figma-export-images.mjs --images            → Export only IMAGE fills (photos/illustrations)
 * 
 * Options:
 *   --format png|jpg|svg|pdf  (default: png)
 *   --scale 1|2|3|4           (default: 2 for retina)
 *   --outdir <path>           (default: public/assets/figma)
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN || '';
const FILE_KEY = 'JbK4p9yyXBjhu7B7VOIBhd';
const DATA_DIR = join(process.cwd(), 'scripts', 'figma-data');

const headers = { 'X-Figma-Token': FIGMA_TOKEN };

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    mode: 'all-pages',
    nodes: [],
    pageName: '',
    format: 'png',
    scale: 2,
    outDir: join(process.cwd(), 'public', 'assets', 'figma'),
  };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--nodes': config.mode = 'nodes'; config.nodes = args[++i].split(','); break;
      case '--page': config.mode = 'page'; config.pageName = args[++i]; break;
      case '--components': config.mode = 'components'; break;
      case '--all': config.mode = 'all'; break;
      case '--images': config.mode = 'images'; break;
      case '--format': config.format = args[++i]; break;
      case '--scale': config.scale = parseInt(args[++i]); break;
      case '--outdir': config.outDir = resolve(args[++i]); break;
    }
  }
  return config;
}

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

function toFileName(pageName, frameName) {
  const clean = (s) => s
    .replace(/[\/\\]/g, '-')
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  const page = clean(pageName);
  const frame = clean(frameName);
  if (frame.startsWith(page)) return frame;
  return `${page}--${frame}`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Export with retry and small batches
 */
async function exportBatch(nodeIds, nameMap, format, scale, outDir) {
  mkdirSync(outDir, { recursive: true });
  const results = [];
  
  // Use very small batches (5 at a time) to avoid render timeout
  const BATCH_SIZE = 5;
  const totalBatches = Math.ceil(nodeIds.length / BATCH_SIZE);
  
  for (let i = 0; i < nodeIds.length; i += BATCH_SIZE) {
    const batch = nodeIds.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`\n   📦 Batch ${batchNum}/${totalBatches} (${batch.length} nodes)`);
    
    let retries = 3;
    let imageUrls = null;
    
    while (retries > 0) {
      try {
        const ids = batch.join(',');
        const data = await figmaGet(
          `/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=${format}&scale=${scale}`
        );
        imageUrls = data.images || {};
        break;
      } catch (err) {
        retries--;
        if (retries > 0) {
          console.log(`   ⚠️  Retry in 5s... (${err.message.slice(0, 80)})`);
          await sleep(5000);
        } else {
          console.log(`   ❌ Failed after 3 retries: ${err.message.slice(0, 100)}`);
        }
      }
    }
    
    if (!imageUrls) continue;
    
    // Download each image
    for (const [nodeId, url] of Object.entries(imageUrls)) {
      if (!url) {
        console.log(`   ⚠️  No render: ${nameMap[nodeId] || nodeId}`);
        continue;
      }
      
      const fileName = `${nameMap[nodeId] || nodeId.replace(':', '-')}.${format}`;
      const filePath = join(outDir, fileName);
      
      try {
        const size = await downloadFile(url, filePath);
        const sizeStr = size > 1024 * 1024 
          ? `${(size / 1024 / 1024).toFixed(1)} MB`
          : `${(size / 1024).toFixed(1)} KB`;
        console.log(`   ✅ ${fileName} (${sizeStr})`);
        results.push({ nodeId, fileName, filePath, size });
      } catch (err) {
        console.log(`   ❌ Download failed: ${fileName}`);
      }
    }
    
    // Rate limit delay between batches
    if (i + BATCH_SIZE < nodeIds.length) {
      await sleep(2000);
    }
  }
  
  return results;
}

// ── Collect IMAGE fills from page data (photos, illustrations) ──
function findImageNodes(node, pageName, results = []) {
  // If this node has IMAGE fills
  if (node.fills) {
    const imagesFills = node.fills.filter(f => f.t === 'IMAGE');
    if (imagesFills.length > 0) {
      results.push({
        id: node.id,
        name: node.name,
        pageName,
        imageRef: imagesFills[0].ref,
        width: node.bounds?.w,
        height: node.bounds?.h,
      });
    }
  }
  
  if (node.children) {
    for (const child of node.children) {
      findImageNodes(child, pageName, results);
    }
  }
  
  return results;
}

function loadPages() {
  return JSON.parse(readFileSync(join(DATA_DIR, 'pages.json'), 'utf8'));
}

function loadComponents() {
  return JSON.parse(readFileSync(join(DATA_DIR, 'components.json'), 'utf8'));
}

async function main() {
  const config = parseArgs();
  const pages = loadPages();
  
  console.log(`\n🖼️  Figma Image Exporter v2`);
  console.log(`   Format: ${config.format} | Scale: ${config.scale}x`);
  console.log(`   Output: ${config.outDir}\n`);
  
  let nodeIds = [];
  let nameMap = {};
  
  switch (config.mode) {
    case 'nodes': {
      nodeIds = config.nodes;
      for (const page of pages) {
        for (const frame of page.frames) {
          if (nodeIds.includes(frame.id)) {
            nameMap[frame.id] = toFileName(page.name, frame.name);
          }
        }
      }
      for (const id of nodeIds) {
        if (!nameMap[id]) nameMap[id] = id.replace(':', '-');
      }
      break;
    }
    
    case 'page': {
      const page = pages.find(p => p.name.toLowerCase().includes(config.pageName.toLowerCase()));
      if (!page) {
        console.log(`Page not found: "${config.pageName}". Available:`);
        pages.forEach(p => console.log(`   - ${p.name}`));
        process.exit(1);
      }
      console.log(`📑 Page: "${page.name}"\n`);
      for (const frame of page.frames) {
        nodeIds.push(frame.id);
        nameMap[frame.id] = toFileName(page.name, frame.name);
      }
      break;
    }
    
    case 'components': {
      const { components, componentSets } = loadComponents();
      for (const comp of components) {
        nodeIds.push(comp.id);
        nameMap[comp.id] = `component--${comp.name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase()}`;
      }
      for (const set of componentSets) {
        nodeIds.push(set.id);
        nameMap[set.id] = `component-set--${set.name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase()}`;
      }
      break;
    }

    case 'images': {
      // Find all IMAGE fill references in page data
      console.log('🔍 Scanning page data for image fills...\n');
      const { components } = loadComponents();
      // We'll export the nodes that contain images
      const allImageNodes = [];
      
      const pageFiles = ['page_des_system.json', 'page_home_page.json'];
      for (const file of pageFiles) {
        const filePath = join(DATA_DIR, file);
        if (existsSync(filePath)) {
          const data = JSON.parse(readFileSync(filePath, 'utf8'));
          const pageName = file.replace('page_', '').replace('.json', '').replace(/_/g, ' ');
          const imageNodes = findImageNodes(data, pageName);
          allImageNodes.push(...imageNodes);
        }
      }
      
      console.log(`   Found ${allImageNodes.length} image nodes`);
      for (const img of allImageNodes) {
        nodeIds.push(img.id);
        nameMap[img.id] = `image--${img.name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase()}`;
        console.log(`   ${img.id.padEnd(12)} → ${nameMap[img.id]} [${img.width}×${img.height}]`);
      }
      break;
    }
    
    case 'all':
    case 'all-pages':
    default: {
      const skipOld = config.mode !== 'all';
      for (const page of pages) {
        // Skip "Home Page Old" by default
        if (skipOld && page.name.includes('Old')) continue;
        
        for (const frame of page.frames) {
          nodeIds.push(frame.id);
          nameMap[frame.id] = toFileName(page.name, frame.name);
        }
      }
      
      if (config.mode === 'all') {
        const { components, componentSets } = loadComponents();
        for (const comp of components) {
          if (!nodeIds.includes(comp.id)) {
            nodeIds.push(comp.id);
            nameMap[comp.id] = `component--${comp.name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase()}`;
          }
        }
        for (const set of componentSets) {
          if (!nodeIds.includes(set.id)) {
            nodeIds.push(set.id);
            nameMap[set.id] = `component-set--${set.name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase()}`;
          }
        }
      }
      break;
    }
  }
  
  if (nodeIds.length === 0) {
    console.log('No nodes to export.');
    process.exit(0);
  }
  
  // Print plan
  console.log(`\n📋 Export plan (${nodeIds.length} images):\n`);
  for (const id of nodeIds) {
    console.log(`   ${id.padEnd(14)} → ${nameMap[id]}.${config.format}`);
  }
  
  // Execute
  const results = await exportBatch(nodeIds, nameMap, config.format, config.scale, config.outDir);
  
  // Save manifest
  const manifest = {
    exportedAt: new Date().toISOString(),
    figmaFile: FILE_KEY,
    format: config.format,
    scale: config.scale,
    totalImages: results.length,
    totalSizeBytes: results.reduce((sum, r) => sum + r.size, 0),
    images: results.map(r => ({ nodeId: r.nodeId, fileName: r.fileName, sizeBytes: r.size })),
  };
  writeFileSync(join(config.outDir, '_manifest.json'), JSON.stringify(manifest, null, 2));
  
  // Summary
  const totalMB = (manifest.totalSizeBytes / 1024 / 1024).toFixed(2);
  console.log(`\n═══ EXPORT COMPLETE ═══`);
  console.log(`   ✅ ${results.length}/${nodeIds.length} images exported`);
  console.log(`   📦 Total size: ${totalMB} MB`);
  console.log(`   📁 Output: ${config.outDir}`);
  console.log(`   📄 Manifest: _manifest.json\n`);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
