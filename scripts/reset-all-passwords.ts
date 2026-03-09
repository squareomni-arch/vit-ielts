/**
 * Reset all user passwords to a default value (parallel version)
 *
 * Usage: npx tsx scripts/reset-all-passwords.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEFAULT_PASSWORD = "IeltsTest@2026";
const CONCURRENCY = 10; // parallel requests
const SKIP_FIRST = 350; // already done from previous run

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function resetAllPasswords() {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║      Reset All User Passwords (Parallel)        ║");
    console.log("╚══════════════════════════════════════════════════╝");
    console.log(`  New password: ${DEFAULT_PASSWORD}`);
    console.log(`  Concurrency: ${CONCURRENCY}`);
    console.log(`  Skipping first: ${SKIP_FIRST}\n`);

    // Fetch all auth users (paginated)
    let page = 1;
    let allUsers: { id: string; email?: string }[] = [];

    while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({
            page,
            perPage: 1000,
        });

        if (error) {
            console.error("❌ Failed to list users:", error.message);
            process.exit(1);
        }

        if (!data.users || data.users.length === 0) break;

        allUsers.push(
            ...data.users.map((u) => ({ id: u.id, email: u.email }))
        );

        if (data.users.length < 1000) break;
        page++;
    }

    console.log(`📋 Found ${allUsers.length} auth user(s) total`);

    // Skip already processed users
    const remaining = allUsers.slice(SKIP_FIRST);
    console.log(`📋 Remaining to process: ${remaining.length}\n`);

    let updated = 0;
    let errors = 0;

    // Process in batches of CONCURRENCY
    for (let i = 0; i < remaining.length; i += CONCURRENCY) {
        const batch = remaining.slice(i, i + CONCURRENCY);

        const results = await Promise.allSettled(
            batch.map((user) =>
                supabase.auth.admin.updateUserById(user.id, {
                    password: DEFAULT_PASSWORD,
                })
            )
        );

        for (let j = 0; j < results.length; j++) {
            const result = results[j];
            if (result.status === "fulfilled" && !result.value.error) {
                updated++;
            } else {
                const errMsg =
                    result.status === "rejected"
                        ? result.reason
                        : result.value.error?.message;
                console.error(`  ❌ ${batch[j].email}: ${errMsg}`);
                errors++;
            }
        }

        // Print progress every 100 users
        const totalDone = SKIP_FIRST + i + batch.length;
        if (totalDone % 100 < CONCURRENCY || i + CONCURRENCY >= remaining.length) {
            console.log(`  ... ${totalDone}/${allUsers.length} done`);
        }
    }

    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║        ✅ PASSWORD RESET COMPLETE                ║");
    console.log("╚══════════════════════════════════════════════════╝");
    console.log(`  ✅ Updated (this run): ${updated}`);
    console.log(`  ⏭️  Previously done: ${SKIP_FIRST}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log(`  📊 Total users: ${allUsers.length}`);
    console.log(`  🔑 New password: ${DEFAULT_PASSWORD}`);
}

resetAllPasswords().catch((err) => {
    console.error("❌ Script failed:", err);
    process.exit(1);
});
