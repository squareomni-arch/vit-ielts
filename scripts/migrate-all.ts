/**
 * Master Migration Script
 *
 * Runs all data migration scripts in the correct order:
 * 1. JSON data (orders, coupons, affiliates)
 * 2. CMS configs (17 config files)
 *
 * Note: WordPress REST API migrations (users, quizzes, test-results, etc.)
 * are deferred and not included here — they require live WP credentials.
 *
 * Usage: npx ts-node scripts/migrate-all.ts
 */

import "dotenv/config";
import { migrateJsonData } from "./migrate-json-data";
import { migrateConfigs } from "./migrate-configs";

async function main() {
    const startTime = Date.now();

    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║        Vit IELTS — Data Migration        ║");
    console.log("║        WordPress/JSON → Supabase PostgreSQL     ║");
    console.log("╚══════════════════════════════════════════════════╝");

    // Verify env vars
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("\n❌ Missing environment variables:");
        console.error("   NEXT_PUBLIC_SUPABASE_URL");
        console.error("   SUPABASE_SERVICE_ROLE_KEY");
        console.error("\n   Please set them in .env.local or environment.");
        process.exit(1);
    }

    try {
        // Step 1: JSON data migration
        console.log("\n📦 Step 1/2: JSON Data Migration");
        await migrateJsonData();

        // Step 2: CMS config migration
        console.log("\n📦 Step 2/2: CMS Config Migration");
        await migrateConfigs();

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log("\n╔══════════════════════════════════════════════════╗");
        console.log("║            ✅ ALL MIGRATIONS COMPLETE            ║");
        console.log(`║            ⏱️  Time: ${elapsed}s${" ".repeat(Math.max(0, 26 - elapsed.length))}║`);
        console.log("╚══════════════════════════════════════════════════╝\n");
    } catch (err) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error("\n╔══════════════════════════════════════════════════╗");
        console.error("║            ❌ MIGRATION FAILED                   ║");
        console.error(`║            ⏱️  Time: ${elapsed}s${" ".repeat(Math.max(0, 26 - elapsed.length))}║`);
        console.error("╚══════════════════════════════════════════════════╝");
        console.error("\nError:", err);
        process.exit(1);
    }
}

main();
