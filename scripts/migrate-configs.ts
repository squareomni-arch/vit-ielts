/**
 * CMS Config Migration Script
 *
 * Migrates 17 config JSON files from config/ directory to Supabase cms_configs table.
 * Uses the same section_name convention as the existing CMS config service.
 *
 * Section naming:
 * - config/home/hero-banner.json → "home/hero-banner"
 * - config/account/login.json → "account/login"
 * - config/privacy-policy.json → "privacy-policy"
 *
 * Usage: npx ts-node scripts/migrate-configs.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const CONFIG_DIR = path.join(process.cwd(), "config");

/**
 * Recursively discover all .json files under a directory.
 * Returns array of { sectionName, filePath }.
 */
function discoverConfigs(dir: string, prefix = ""): { sectionName: string; filePath: string }[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const results: { sectionName: string; filePath: string }[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            // Recurse into subdirectory with prefix
            results.push(...discoverConfigs(fullPath, prefix ? `${prefix}/${entry.name}` : entry.name));
        } else if (entry.name.endsWith(".json")) {
            // Build section name: prefix/basename (without .json)
            const baseName = entry.name.replace(/\.json$/, "");
            const sectionName = prefix ? `${prefix}/${baseName}` : baseName;
            results.push({ sectionName, filePath: fullPath });
        }
    }

    return results;
}

export async function migrateConfigs() {
    console.log("\n🚀 Starting CMS Config Migration...\n");
    console.log("=".repeat(50));

    if (!fs.existsSync(CONFIG_DIR)) {
        console.error(`❌ Config directory not found: ${CONFIG_DIR}`);
        return;
    }

    const configs = discoverConfigs(CONFIG_DIR);
    console.log(`📁 Found ${configs.length} config files\n`);

    let success = 0;
    let failed = 0;

    for (const { sectionName, filePath } of configs) {
        try {
            const raw = fs.readFileSync(filePath, "utf-8");
            const data = JSON.parse(raw);

            const { error } = await supabase
                .from("cms_configs")
                .upsert(
                    {
                        section_name: sectionName,
                        data,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "section_name" },
                );

            if (error) {
                console.error(`❌ ${sectionName}: ${error.message}`);
                failed++;
            } else {
                console.log(`✅ ${sectionName}`);
                success++;
            }
        } catch (err) {
            console.error(`❌ ${sectionName}: ${err instanceof Error ? err.message : err}`);
            failed++;
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`📊 Config Migration Summary:`);
    console.log(`   ✅ Success: ${success}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📁 Total: ${configs.length}`);
    console.log("✅ CMS Config Migration Complete!\n");
}

// Run directly
if (require.main === module) {
    migrateConfigs()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
