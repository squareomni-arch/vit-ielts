/**
 * Migrate PDF files from old CMS URLs to Supabase Storage bucket.
 *
 * For each unique pdf_url in the quizzes table that points to the old CMS domain,
 * this script:
 *   1. Downloads the PDF
 *   2. Uploads it to the "media" Supabase bucket under "pdf/<filename>"
 *   3. Updates all quizzes rows referencing that old URL to the new Supabase URL
 *
 * Usage:
 *   npx tsx scripts/migrate-pdf-to-bucket.ts
 *
 * Env vars required (same as other migration scripts):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
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

// ─── helpers ────────────────────────────────────────────────────────────────

function filenameFromUrl(url: string): string {
    // e.g. ".../IPQ3.pdf" → "IPQ3.pdf"
    //      ".../ipq3-1777707001.pdf" → "ipq3-1777707001.pdf"
    return url.split("/").pop()!.split("?")[0];
}

async function downloadPdf(url: string): Promise<Buffer> {
    const res = await fetch(url, { headers: { "User-Agent": "VitIELTS-migration/1.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
        console.warn(`  ⚠  Unexpected content-type "${contentType}" for ${url}`);
    }
    return Buffer.from(await res.arrayBuffer());
}

async function fileExistsInBucket(path: string): Promise<boolean> {
    const { data } = await supabase.storage.from(BUCKET).list("pdf", {
        search: path.replace("pdf/", ""),
        limit: 1,
    });
    return (data?.length ?? 0) > 0;
}

async function uploadPdf(buffer: Buffer, filename: string): Promise<string> {
    const storagePath = `pdf/${filename}`;

    const exists = await fileExistsInBucket(storagePath);
    if (exists) {
        console.log(`  ↩  Already in bucket: ${storagePath}`);
    } else {
        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });
        if (error) throw new Error(`Upload failed for ${storagePath}: ${error.message}`);
        console.log(`  ✅ Uploaded: ${storagePath} (${(buffer.length / 1024).toFixed(0)} KB)`);
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return publicUrl;
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
    console.log("╔════════════════════════════════════════════════════╗");
    console.log("║  PDF Migration: CMS → Supabase Storage bucket    ║");
    console.log("╚════════════════════════════════════════════════════╝\n");

    // 1. Get all unique pdf_url values
    const { data: rows, error: fetchErr } = await supabase
        .from("quizzes")
        .select("pdf_url")
        .not("pdf_url", "is", null);

    if (fetchErr) throw new Error(`Failed to fetch pdf_urls: ${fetchErr.message}`);

    const allUrls: string[] = rows!.map((r: { pdf_url: string }) => r.pdf_url).filter(Boolean);
    const uniqueUrls = [...new Set(allUrls)];

    // Filter to only external CMS URLs that haven't been migrated yet
    const toMigrate = uniqueUrls.filter(
        (u) => !u.includes(SUPABASE_URL) && !u.startsWith("/")
    );

    if (toMigrate.length === 0) {
        console.log("✅ All pdf_urls are already pointing to Supabase. Nothing to do.");
        return;
    }

    console.log(`Found ${uniqueUrls.length} unique pdf_url(s), ${toMigrate.length} need migration:\n`);
    toMigrate.forEach((u) => console.log(`  • ${u}`));
    console.log();

    // 2. Download + upload each unique PDF, track old→new URL mapping
    const urlMap = new Map<string, string>(); // oldUrl → newSupabaseUrl

    for (const oldUrl of toMigrate) {
        console.log(`\nProcessing: ${oldUrl}`);
        try {
            const filename = filenameFromUrl(oldUrl);
            const buffer = await downloadPdf(oldUrl);
            const newUrl = await uploadPdf(buffer, filename);
            urlMap.set(oldUrl, newUrl);
            console.log(`  → ${newUrl}`);
        } catch (err) {
            console.error(`  ❌ FAILED: ${(err as Error).message}`);
        }
    }

    // 3. Update quizzes rows for each mapped URL
    console.log("\n─── Updating database ───────────────────────────────");
    let totalUpdated = 0;

    for (const [oldUrl, newUrl] of urlMap.entries()) {
        const { data: updated, error: updateErr } = await supabase
            .from("quizzes")
            .update({ pdf_url: newUrl })
            .eq("pdf_url", oldUrl)
            .select("id, title");

        if (updateErr) {
            console.error(`❌ DB update failed for ${oldUrl}: ${updateErr.message}`);
            continue;
        }

        const count = updated?.length ?? 0;
        totalUpdated += count;
        console.log(`  ✅ Updated ${count} quiz(zes) for: ${filenameFromUrl(oldUrl)}`);
    }

    console.log(`\n╔════════════════════════════════════════════════════╗`);
    console.log(`║  Done — ${totalUpdated} quiz row(s) updated across ${urlMap.size} PDF(s)  `);
    console.log(`╚════════════════════════════════════════════════════╝`);
}

main().catch((err) => {
    console.error("\n❌ Fatal:", err.message);
    process.exit(1);
});
