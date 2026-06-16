/**
 * Orphan-media sweeper for the Supabase Storage "media" bucket.
 *
 * Reports (and, with --delete, removes) objects that NO database row references
 * and that are older than a grace window. DRY-RUN by default.
 *
 * Reference model — filename tokens, not exact URLs:
 *   Every uploaded object has a globally-unique filename (`name-<ts>-<rand>.ext`,
 *   see lib/supabase-upload.ts). We pull a broad set of text + jsonb columns that
 *   can hold or embed a media URL, concatenate them, and consider an object
 *   REFERENCED if its filename appears anywhere in that text. This catches:
 *     - direct URL columns,
 *     - HTML-embedded <img src> in rich-text/content columns,
 *     - jsonb-embedded references,
 *     - CDN-rewritten and /render/image/ transformed URLs (filename is unchanged).
 *   A false match only ever SPARES a file (safe). Deleting a referenced file
 *   (the only dangerous direction) cannot happen unless its filename is absent
 *   from every scanned column.
 *
 * Scanned columns (verified against migration-export/sql-editor/01_schema.sql):
 *   quizzes(featured_image, audio_url, pdf_url)
 *   posts(featured_image, content)
 *   sample_essays(featured_image, content)
 *   passages(content)
 *   questions(question_text, instructions, list_of_questions, list_of_options,
 *             matching_question, matrix_question, explanations)
 *   users(avatar_url)   classrooms(image_url)   media_library(url)
 *   mock_tests(practice_tests)   vocab_words(audio_url)
 *
 * Usage:
 *   npx tsx scripts/sweep-orphan-media.ts                 # dry-run, grace=30d
 *   npx tsx scripts/sweep-orphan-media.ts --days=90
 *   npx tsx scripts/sweep-orphan-media.ts --folder=images
 *   npx tsx scripts/sweep-orphan-media.ts --delete        # ACT (after review)
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, [MEDIA_SWEEP_GRACE_DAYS]
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "media";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── flags ────────────────────────────────────────────────────────────────────
const DELETE = process.argv.includes("--delete");
const daysArg = process.argv.find((a) => a.startsWith("--days="));
const folderArg = process.argv.find((a) => a.startsWith("--folder="));
const GRACE_DAYS = daysArg
  ? Number(daysArg.split("=")[1])
  : Number(process.env.MEDIA_SWEEP_GRACE_DAYS ?? 30);
const FOLDER = folderArg ? folderArg.split("=")[1] : "";

// Never sweep these prefixes/objects, even if unreferenced.
const ALLOWLIST_PREFIXES = ["keep/"];

interface ObjectEntry {
  path: string;      // e.g. "images/foo-123.png"
  filename: string;  // e.g. "foo-123.png"
  createdAt: string;
}

// ─── enumerate bucket ─────────────────────────────────────────────────────────
async function listAllObjects(prefix = ""): Promise<ObjectEntry[]> {
  const out: ObjectEntry[] = [];
  const pageSize = 100;
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list("${prefix}") failed: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const item of data) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        out.push(...(await listAllObjects(itemPath)));
      } else {
        out.push({
          path: itemPath,
          filename: item.name,
          createdAt: item.created_at ?? item.updated_at ?? "",
        });
      }
    }
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return out;
}

// ─── build the reference text (paginated; jsonb stringified) ──────────────────
const SCAN: Record<string, string[]> = {
  quizzes: ["featured_image", "audio_url", "pdf_url"],
  posts: ["featured_image", "content"],
  sample_essays: ["featured_image", "content"],
  passages: ["content"],
  questions: [
    "question_text", "instructions", "list_of_questions", "list_of_options",
    "matching_question", "matrix_question", "explanations",
  ],
  users: ["avatar_url"],
  classrooms: ["image_url"],
  media_library: ["url"],
  mock_tests: ["practice_tests"],
  vocab_words: ["audio_url"],
};

async function buildReferenceText(): Promise<{ text: string; rows: number }> {
  const parts: string[] = [];
  let rows = 0;
  for (const [table, columns] of Object.entries(SCAN)) {
    const pageSize = 1000;
    let from = 0;
    for (;;) {
      const { data, error } = await supabase
        .from(table)
        .select(columns.join(","))
        .range(from, from + pageSize - 1);
      if (error) throw new Error(`scan ${table} failed: ${error.message}`);
      if (!data || data.length === 0) break;
      for (const row of data as Record<string, unknown>[]) {
        rows++;
        for (const col of columns) {
          const val = row[col];
          if (val == null) continue;
          parts.push(typeof val === "string" ? val : JSON.stringify(val));
        }
      }
      if (data.length < pageSize) break;
      from += pageSize;
    }
  }
  return { text: parts.join("\n"), rows };
}

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!Number.isFinite(GRACE_DAYS) || GRACE_DAYS < 0) {
    console.error(`❌ Invalid --days value: ${GRACE_DAYS}`);
    process.exit(1);
  }

  console.log(`╔══ Orphan sweep (${DELETE ? "DELETE" : "dry-run"}) — grace ${GRACE_DAYS}d${FOLDER ? `, folder "${FOLDER}"` : ""} ══╗`);

  const objects = await listAllObjects(FOLDER);
  console.log(`Enumerated ${objects.length} object(s).`);

  const { text: refText, rows } = await buildReferenceText();
  console.log(`Scanned ${rows} DB row(s) → ${(refText.length / 1024).toFixed(0)} KB of reference text.`);

  // Safety guard: a near-empty reference set almost certainly means a failed/empty
  // query, not that every file is an orphan. Refuse to delete in that case.
  const cutoff = Date.now() - GRACE_DAYS * 86_400_000;
  const orphans: ObjectEntry[] = [];
  let youngSkipped = 0;
  let allowlisted = 0;

  for (const obj of objects) {
    if (ALLOWLIST_PREFIXES.some((p) => obj.path.startsWith(p))) { allowlisted++; continue; }
    if (refText.includes(obj.filename)) continue;        // referenced
    const created = obj.createdAt ? Date.parse(obj.createdAt) : 0;
    if (created && created > cutoff) { youngSkipped++; continue; } // within grace
    orphans.push(obj);
  }

  console.log(
    `\nReferenced: ${objects.length - orphans.length - youngSkipped - allowlisted}` +
    `  ·  within grace: ${youngSkipped}  ·  allowlisted: ${allowlisted}  ·  ORPHANS: ${orphans.length}\n`,
  );

  if (orphans.length === 0) {
    console.log("✅ No orphans to clean up.");
    return;
  }

  for (const o of orphans) {
    console.log(`  • ${o.path}  (created ${o.createdAt || "unknown"})`);
  }

  if (!DELETE) {
    console.log(`\n(dry-run) Re-run with --delete to remove the ${orphans.length} object(s) above.`);
    return;
  }

  // ── destructive path: guard against a broken/empty reference scan ──
  const referencedCount = objects.length - orphans.length - youngSkipped - allowlisted;
  if (rows < 1 || (objects.length > 20 && referencedCount === 0)) {
    console.error(
      "\n❌ Aborting --delete: the reference scan looks empty/broken " +
      `(rows=${rows}, referenced=${referencedCount}). Refusing to delete.`,
    );
    process.exit(1);
  }

  console.log(`\nDeleting ${orphans.length} object(s)…`);
  const paths = orphans.map((o) => o.path);
  const batchSize = 100;
  let removed = 0;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) { console.error(`  ❌ batch delete failed: ${error.message}`); continue; }
    removed += batch.length;

    // Drop matching media_library rows so the catalog stays consistent.
    const urls = batch.map(
      (p) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${p}`,
    );
    const { error: dbErr } = await supabase.from("media_library").delete().in("url", urls);
    if (dbErr) console.error(`  ⚠ media_library cleanup failed: ${dbErr.message}`);
  }

  console.log(`\n╚══ Removed ${removed}/${orphans.length} object(s) ══╝`);
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});
