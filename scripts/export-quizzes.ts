/**
 * Export Quizzes Script
 *
 * Fetches all quizzes along with their nested passages and questions
 * from Supabase and saves them to a static JSON file.
 *
 * Usage: npx ts-node scripts/export-quizzes.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function exportQuizzes() {
  console.log("🚀 Starting quiz data export...");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
    process.exit(1);
  }

  try {
    const { data: quizzes, error } = await supabase
      .from("quizzes")
      .select("*, passages(*, questions(*))");

    if (error) {
      throw error;
    }

    if (!quizzes || quizzes.length === 0) {
      console.log("⚠️ No quizzes found in the database.");
      return;
    }

    const outputDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, "exported-quizzes.json");
    fs.writeFileSync(outputPath, JSON.stringify(quizzes, null, 2), "utf-8");

    console.log(`✅ Success! Exported ${quizzes.length} quizzes to ${outputPath}`);
  } catch (error) {
    console.error("❌ Export failed:", error);
    process.exit(1);
  }
}

exportQuizzes();
