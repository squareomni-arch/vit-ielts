import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function removePdfsFromBucket() {
  console.log("Fetching all PDFs from 'media' bucket in 'pdf' folder...");
  
  const { data, error } = await supabase.storage.from('media').list('pdf', {
    limit: 1000,
  });

  if (error) {
    console.error("Error listing files:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("No PDF files found in the bucket.");
    return;
  }

  const filePaths = data.map(file => `pdf/${file.name}`);
  console.log(`Found ${filePaths.length} files. Deleting...`);

  const { data: deleted, error: deleteError } = await supabase.storage
    .from('media')
    .remove(filePaths);

  if (deleteError) {
    console.error("Error deleting files:", deleteError.message);
    process.exit(1);
  }

  console.log(`Successfully deleted ${deleted.length} PDF files from the bucket.`);
}

removePdfsFromBucket();
