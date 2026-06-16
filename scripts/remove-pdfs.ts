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

async function removePdfs() {
  console.log("Removing pdf_url from all quizzes...");
  
  const { data, error } = await supabase
    .from('quizzes')
    .update({ pdf_url: null })
    .not('pdf_url', 'is', null)
    .select();

  if (error) {
    console.error("Error updating quizzes:", error.message);
    process.exit(1);
  }

  console.log(`Successfully removed PDF attachments from ${data.length} quizzes.`);
}

removePdfs();
