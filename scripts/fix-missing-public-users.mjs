/**
 * Fix Missing public.users Rows
 * 
 * Problem: migrate-users-from-db.mjs created auth.users successfully,
 * but some public.users inserts failed due to invalid date_of_birth format.
 * This causes FK errors when inserting test_results.
 * 
 * Solution: Re-read wp-users.json, find users that exist in auth.users
 * but NOT in public.users, then insert them with sanitized date_of_birth.
 * 
 * Run: node scripts/fix-missing-public-users.mjs
 * Then: node scripts/migrate-test-results.mjs  (to re-insert failed test results)
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DATA_DIR = join(process.cwd(), 'data');
const MAPPING_FILE = join(DATA_DIR, 'user-id-mapping.json');
const WP_USERS_FILE = join(DATA_DIR, 'wp-users.json');

// ============================================================
// Helpers
// ============================================================

function parseWpRoles(raw) {
    if (!raw) return ['subscriber'];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'object') return Object.keys(parsed);
    } catch {
        const matches = raw.matchAll(/s:\d+:"([^"]+)"/g);
        const roles = [];
        for (const m of matches) {
            if (!m[1].match(/^\d+$/)) roles.push(m[1]);
        }
        return roles.length > 0 ? roles : ['subscriber'];
    }
    return ['subscriber'];
}

function safeJsonParse(raw, fallback = null) {
    if (!raw || raw === '') return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
}

/**
 * Sanitize date_of_birth: only accept valid YYYY-MM-DD or similar DATE formats.
 * Returns null if the value is not a valid date.
 */
function sanitizeDateOfBirth(raw) {
    if (!raw || raw === '' || raw === '0000-00-00') return null;

    // Try parsing as date
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;

    // Ensure it's a reasonable date (year > 1900, year < 2020)
    const year = d.getFullYear();
    if (year < 1900 || year > 2020) return null;

    // Return as YYYY-MM-DD
    return d.toISOString().split('T')[0];
}

/**
 * Sanitize pro_expiration_date similarly
 */
function sanitizeDate(raw) {
    if (!raw || raw === '' || raw === '0000-00-00') return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
}

// ============================================================
// Main
// ============================================================
async function main() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   Fix Missing public.users Rows                 ║');
    console.log('╚══════════════════════════════════════════════════╝');

    // 1. Load mapping
    if (!existsSync(MAPPING_FILE)) {
        console.error('❌ Mapping file not found:', MAPPING_FILE);
        process.exit(1);
    }
    const mapping = JSON.parse(readFileSync(MAPPING_FILE, 'utf-8'));
    const allUuids = Object.values(mapping);
    console.log(`\n📂 Mapping: ${allUuids.length} users`);

    // 2. Find which UUIDs are missing from public.users
    console.log('🔍 Checking public.users for missing rows...');

    const missingUuids = new Set();
    const BATCH = 500;

    for (let i = 0; i < allUuids.length; i += BATCH) {
        const batch = allUuids.slice(i, i + BATCH);
        const { data: existingUsers, error } = await supabase
            .from('users')
            .select('id')
            .in('id', batch);

        if (error) {
            console.error(`❌ Query error: ${error.message}`);
            continue;
        }

        const existingIds = new Set(existingUsers.map(u => u.id));
        for (const uuid of batch) {
            if (!existingIds.has(uuid)) {
                missingUuids.add(uuid);
            }
        }
    }

    console.log(`\n📊 Missing from public.users: ${missingUuids.size}`);

    if (missingUuids.size === 0) {
        console.log('✅ No missing users! Nothing to fix.');
        return;
    }

    // 3. Build reverse mapping: supabase_uuid → wp_id
    const uuidToWpId = {};
    for (const [wpId, uuid] of Object.entries(mapping)) {
        uuidToWpId[uuid] = wpId;
    }

    // 4. Load WP users data
    if (!existsSync(WP_USERS_FILE)) {
        console.error('❌ WP users file not found:', WP_USERS_FILE);
        console.log('   Falling back: inserting minimal records from auth.users...');
        await fallbackFromAuth(missingUuids);
        return;
    }

    const rawData = JSON.parse(readFileSync(WP_USERS_FILE, 'utf-8'));
    let wpUsers;
    if (Array.isArray(rawData)) {
        const tableEntry = rawData.find(item => item.type === 'table' && item.data);
        wpUsers = tableEntry ? tableEntry.data : rawData;
    } else {
        wpUsers = [rawData];
    }

    // Build WP user lookup: wp_id → user data
    const wpUserMap = new Map();
    for (const u of wpUsers) {
        const wpId = String(u.wp_id || u.ID || u.id);
        wpUserMap.set(wpId, u);
    }
    console.log(`📂 WP users data: ${wpUserMap.size} entries`);

    // 5. Insert missing users with sanitized data
    let fixed = 0;
    let fixErrors = 0;
    let noWpData = 0;

    for (const uuid of missingUuids) {
        const wpId = uuidToWpId[uuid];
        const wpUser = wpId ? wpUserMap.get(wpId) : null;

        if (!wpUser) {
            noWpData++;
            // Fallback: get email from auth.users
            const { data: authUser } = await supabase.auth.admin.getUserById(uuid);
            if (authUser?.user) {
                const { error: insertErr } = await supabase.from('users').upsert({
                    id: uuid,
                    email: authUser.user.email || '',
                    name: authUser.user.user_metadata?.name || authUser.user.email || 'User',
                    created_at: authUser.user.created_at || new Date().toISOString(),
                }, { onConflict: 'id' });

                if (insertErr) {
                    fixErrors++;
                    if (fixErrors <= 10) console.error(`  ❌ ${uuid}: ${insertErr.message}`);
                } else {
                    fixed++;
                }
            }
            continue;
        }

        // Re-insert with sanitized date fields
        const email = (wpUser.user_email || wpUser.email || '').trim().toLowerCase();
        const name = wpUser.display_name || wpUser.user_login || 'User';
        const roles = parseWpRoles(wpUser.roles);
        const isPro = wpUser.is_pro === 'yes' || wpUser.is_pro === true || wpUser.is_pro === '1';
        const targetScore = safeJsonParse(wpUser.target_score, {});
        const devices = safeJsonParse(wpUser.devices, {});

        const { error: insertErr } = await supabase.from('users').upsert({
            id: uuid,
            email,
            name,
            is_pro: isPro,
            pro_expiration_date: sanitizeDate(wpUser.pro_expiration_date),
            target_score: targetScore,
            gender: wpUser.gender || null,
            date_of_birth: sanitizeDateOfBirth(wpUser.date_of_birth),
            phone_number: wpUser.phone_number || null,
            roles: JSON.stringify(roles),
            devices,
            created_at: wpUser.user_registered || new Date().toISOString(),
        }, { onConflict: 'id' });

        if (insertErr) {
            fixErrors++;
            if (fixErrors <= 10) console.error(`  ❌ [wp_id=${wpId}] ${email}: ${insertErr.message}`);
        } else {
            fixed++;
        }

        if ((fixed + fixErrors) % 100 === 0) {
            console.log(`  📊 Progress: fixed=${fixed}, errors=${fixErrors}`);
        }
    }

    // 6. Summary
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║                   FIX SUMMARY                   ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Missing users found:  ${String(missingUuids.size).padStart(6)}                   ║`);
    console.log(`║  Fixed (inserted):     ${String(fixed).padStart(6)}                   ║`);
    console.log(`║  No WP data (auth fb): ${String(noWpData).padStart(6)}                   ║`);
    console.log(`║  Errors:               ${String(fixErrors).padStart(6)}                   ║`);
    console.log('╚══════════════════════════════════════════════════╝');

    if (fixed > 0) {
        console.log('\n👉 Next step: re-run test results migration:');
        console.log('   node scripts/migrate-test-results.mjs');
    }
}

main().catch(err => {
    console.error('\n❌ Fix failed:', err);
    process.exit(1);
});
