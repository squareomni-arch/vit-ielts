import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const LOCAL_URL = 'http://127.0.0.1:54331';
const LOCAL_SERVICE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const CLOUD_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLOUD_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CLOUD_URL || !CLOUD_SERVICE_KEY) {
  console.error("❌ Cloud Supabase credentials not found in .env.local.");
  process.exit(1);
}

const local = createClient(LOCAL_URL, LOCAL_SERVICE_KEY, {
  auth: { persistSession: false }
});

const cloud = createClient(CLOUD_URL, CLOUD_SERVICE_KEY, {
  auth: { persistSession: false }
});

// Syncing order chosen carefully to satisfy foreign key relationships:
// Parents must be synced before their child tables.
const TABLES = [
  'site_settings',
  'cms_configs',
  'coupons',
  'media_library',
  'menus',
  'posts',
  'redirects',
  'sample_essays',
  'quizzes',
  'passages',
  'questions',
  'mock_tests',
  'mock_test_collections'
];

async function syncTable(table) {
  console.log(`\n⏳ Syncing table "${table}"...`);
  
  // 1. Fetch count from local
  const { count: localCount, error: localCountErr } = await local
    .from(table)
    .select('*', { count: 'exact', head: true });
    
  if (localCountErr) {
    console.error(`  ❌ Error counting local rows: ${localCountErr.message}`);
    return;
  }
  
  console.log(`  Local rows: ${localCount}`);
  if (localCount === 0) {
    console.log(`  ℹ️ No rows to sync.`);
    return;
  }
  
  // 2. Fetch all rows from local in pages of 500
  let allRows = [];
  let page = 0;
  const pageSize = 500;
  
  while (true) {
    const { data, error } = await local
      .from(table)
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error(`  ❌ Error fetching page ${page}: ${error.message}`);
      return;
    }
    
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    page++;
  }
  
  console.log(`  Fetched ${allRows.length} rows from local.`);
  
  // 3. Upsert to cloud in chunks of 100
  const chunkSize = 100;
  let upsertedCount = 0;
  
  for (let i = 0; i < allRows.length; i += chunkSize) {
    const chunk = allRows.slice(i, i + chunkSize);
    const { error } = await cloud
      .from(table)
      .upsert(chunk);
      
    if (error) {
      console.error(`  ❌ Error upserting chunk ${i / chunkSize + 1}: ${error.message}`);
      console.error('  Sample item:', JSON.stringify(chunk[0]).slice(0, 200));
      return;
    }
    upsertedCount += chunk.length;
    process.stdout.write(`  Upserted ${upsertedCount}/${allRows.length}...\r`);
  }
  console.log(`\n  ✅ Successfully synced ${upsertedCount} rows to cloud.`);
}

async function main() {
  console.log("=========================================");
  console.log("🚀 Vit-IELTS Local to Cloud Data Syncer");
  console.log("=========================================");
  console.log(`Local DB: ${LOCAL_URL}`);
  console.log(`Cloud DB: ${CLOUD_URL}`);
  console.log("=========================================");
  
  const startTime = Date.now();
  
  for (const table of TABLES) {
    await syncTable(table);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 All tables processed in ${duration}s.`);
}

main().catch(err => {
  console.error("❌ Uncaught error:", err);
});
