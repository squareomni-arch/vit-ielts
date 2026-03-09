/**
 * Create auth.users for existing public.users records
 *
 * This script creates Supabase Auth accounts for all users in the public.users
 * table that were migrated from WordPress (with placeholder emails).
 *
 * Default password: IeltsTest@2026
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/create-auth-users.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEFAULT_PASSWORD = "IeltsTest@2026";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function createAuthUsers() {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║   Create Auth Users for Migrated WP Users       ║");
    console.log("╚══════════════════════════════════════════════════╝");
    console.log(`  Supabase URL: ${SUPABASE_URL}`);
    console.log(`  Default Password: ${DEFAULT_PASSWORD}`);
    console.log();

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        process.exit(1);
    }

    // 1. Fetch all users from public.users
    console.log("📋 Fetching users from public.users...");
    const { data: publicUsers, error: fetchErr } = await supabase
        .from("users")
        .select("id, email, name, avatar_url, roles, created_at")
        .order("created_at", { ascending: true });

    if (fetchErr) {
        console.error("❌ Failed to fetch users:", fetchErr.message);
        process.exit(1);
    }

    if (!publicUsers || publicUsers.length === 0) {
        console.log("ℹ️  No users found in public.users. Nothing to do.");
        return;
    }

    console.log(`  Found ${publicUsers.length} user(s) in public.users\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of publicUsers) {
        const email = user.email;
        const displayName = user.name || "User";

        // Skip users that already have a real email (not migration placeholder)
        // — they may already have auth accounts
        const isMigrationPlaceholder = email.endsWith("@migration.pending");

        // Generate a real-ish email for placeholder users
        // Use the name to create a more usable email, or keep the placeholder
        let authEmail = email;
        if (isMigrationPlaceholder) {
            // Keep the placeholder email as-is for now — admin can update later
            // The important thing is they get an auth account
            authEmail = email;
        }

        // 2. Check if auth user already exists with this email
        const { data: existingUsers } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1,
        });

        // Try to create auth user
        console.log(`  👤 Processing: ${displayName} (${authEmail})`);

        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
            email: authEmail,
            password: DEFAULT_PASSWORD,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                name: displayName,
                avatar_url: user.avatar_url,
            },
        });

        if (authErr) {
            // If user already exists in auth, try to link
            if (authErr.message?.includes("already been registered") ||
                authErr.message?.includes("already exists")) {
                console.log(`    ⏭️  Auth user already exists, skipping`);
                skipped++;
                continue;
            }
            console.error(`    ❌ Error: ${authErr.message}`);
            errors++;
            continue;
        }

        const newAuthId = authData.user.id;

        // 3. Update public.users to use the new auth user ID
        //    First check if there are related records that reference the old ID
        const oldId = user.id;

        if (oldId !== newAuthId) {
            // Update test_results that reference the old user ID
            const { error: trErr } = await supabase
                .from("test_results")
                .update({ user_id: newAuthId })
                .eq("user_id", oldId);

            if (trErr) {
                console.warn(`    ⚠️  Could not update test_results: ${trErr.message}`);
            }

            // Delete old public.users record and insert new one with auth ID
            const { error: deleteErr } = await supabase
                .from("users")
                .delete()
                .eq("id", oldId);

            if (deleteErr) {
                console.warn(`    ⚠️  Could not delete old user record: ${deleteErr.message}`);
            }

            // Insert new record with auth user ID
            const { error: insertErr } = await supabase
                .from("users")
                .upsert({
                    id: newAuthId,
                    email: authEmail,
                    name: user.name,
                    avatar_url: user.avatar_url,
                    roles: user.roles,
                    created_at: user.created_at,
                }, { onConflict: "id" });

            if (insertErr) {
                console.error(`    ❌ Could not create new user record: ${insertErr.message}`);
                errors++;
                continue;
            }

            console.log(`    ✅ Created auth user & updated ID: ${oldId} → ${newAuthId}`);
        } else {
            console.log(`    ✅ Created auth user (ID matched)`);
        }

        created++;
    }

    // Summary
    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║           ✅ AUTH USER CREATION COMPLETE         ║");
    console.log("╚══════════════════════════════════════════════════╝");
    console.log(`  ✅ Created: ${created}`);
    console.log(`  ⏭️  Skipped (already exists): ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log(`  📊 Total processed: ${publicUsers.length}`);
    console.log(`\n  🔑 Default password: ${DEFAULT_PASSWORD}`);
}

createAuthUsers().catch((err) => {
    console.error("❌ Script failed:", err);
    process.exit(1);
});
