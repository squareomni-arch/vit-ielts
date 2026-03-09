/**
 * User Migration — WordPress DB Export → Supabase
 * 
 * Prerequisites:
 *   1. Export users from WordPress DB using this SQL (prefix mf_):
 *
 *      SELECT 
 *        u.ID as wp_id,
 *        u.user_login,
 *        u.user_email,
 *        u.display_name,
 *        u.user_registered,
 *        MAX(CASE WHEN m.meta_key = 'mf_capabilities' THEN m.meta_value END) as roles,
 *        MAX(CASE WHEN m.meta_key = 'is_pro' THEN m.meta_value END) as is_pro,
 *        MAX(CASE WHEN m.meta_key = 'pro_expiration_date' THEN m.meta_value END) as pro_expiration_date,
 *        MAX(CASE WHEN m.meta_key = 'target_score' THEN m.meta_value END) as target_score,
 *        MAX(CASE WHEN m.meta_key = 'gender' THEN m.meta_value END) as gender,
 *        MAX(CASE WHEN m.meta_key = 'date_of_birth' THEN m.meta_value END) as date_of_birth,
 *        MAX(CASE WHEN m.meta_key = 'phone_number' THEN m.meta_value END) as phone_number,
 *        MAX(CASE WHEN m.meta_key = 'devices' THEN m.meta_value END) as devices
 *      FROM mf_users u
 *      LEFT JOIN mf_usermeta m ON u.ID = m.user_id
 *      GROUP BY u.ID, u.user_login, u.user_email, u.display_name, u.user_registered;
 *
 *   2. Save result as data/wp-users.json
 *   3. Run: node scripts/migrate-users-from-db.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DATA_DIR = join(process.cwd(), 'data');
const INPUT_FILE = join(DATA_DIR, 'wp-users.json');
const MAPPING_FILE = join(DATA_DIR, 'user-id-mapping.json');

// ============================================================
// Helpers
// ============================================================

/**
 * Parse WordPress serialized PHP roles string → array of role names
 * e.g. 'a:1:{s:10:"subscriber";b:1;}' → ['subscriber']
 */
function parseWpRoles(raw) {
    if (!raw) return ['subscriber'];
    try {
        // If it's already JSON
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'object') return Object.keys(parsed);
    } catch {
        // PHP serialized format: extract role names
        const matches = raw.matchAll(/s:\d+:"([^"]+)"/g);
        const roles = [];
        for (const m of matches) {
            // Skip numeric-looking values, keep role names
            if (!m[1].match(/^\d+$/)) roles.push(m[1]);
        }
        return roles.length > 0 ? roles : ['subscriber'];
    }
    return ['subscriber'];
}

/**
 * Safely parse a JSON string, return fallback on failure
 */
function safeJsonParse(raw, fallback = null) {
    if (!raw || raw === '') return fallback;
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

/**
 * Generate a random password (not meant to be used by the user)
 */
function randomPassword() {
    return `mig_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ============================================================
// Main Migration
// ============================================================
async function migrateUsers() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║    User Migration — WP DB Export → Supabase     ║');
    console.log('╚══════════════════════════════════════════════════╝');

    // 1. Read input
    if (!existsSync(INPUT_FILE)) {
        console.error(`\n❌ File not found: ${INPUT_FILE}`);
        console.error('   Please export WordPress users and save as data/wp-users.json');
        console.error('   See the SQL query in the header of this script.');
        process.exit(1);
    }

    const rawData = JSON.parse(readFileSync(INPUT_FILE, 'utf-8'));

    // Handle phpMyAdmin JSON export format:
    // [{header}, {database}, {type:"table", data:[...users...]}]
    let users;
    if (Array.isArray(rawData)) {
        const tableEntry = rawData.find(item => item.type === 'table' && item.data);
        if (tableEntry && Array.isArray(tableEntry.data)) {
            users = tableEntry.data;
        } else {
            // Plain array of user objects
            users = rawData;
        }
    } else {
        users = [rawData];
    }
    console.log(`\n📋 Found ${users.length} users in wp-users.json\n`);

    // 2. Load existing mapping if any (for resume support)
    let mapping = {};
    if (existsSync(MAPPING_FILE)) {
        mapping = JSON.parse(readFileSync(MAPPING_FILE, 'utf-8'));
        console.log(`📂 Loaded existing mapping: ${Object.keys(mapping).length} entries\n`);
    }

    // 3. Stats
    let created = 0;
    let existing = 0;
    let skipped = 0;
    let errors = 0;

    // 4. Process each user
    for (let i = 0; i < users.length; i++) {
        const u = users[i];
        const wpId = String(u.wp_id || u.ID || u.id);
        const email = (u.user_email || u.email || '').trim().toLowerCase();
        const name = u.display_name || u.user_login || 'User';

        // Skip if no email
        if (!email) {
            console.warn(`  ⚠️  [${i + 1}] Skip wp_id=${wpId}: no email`);
            skipped++;
            continue;
        }

        // Skip if already mapped
        if (mapping[wpId]) {
            existing++;
            continue;
        }

        try {
            // Create auth user (silent, no email)
            let uid;
            const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
                email,
                password: randomPassword(),
                email_confirm: true, // Mark as confirmed, NO email sent
            });

            if (authErr) {
                if (authErr.message?.includes('already') || authErr.message?.includes('duplicate')) {
                    // User already exists in auth — find them
                    const { data: listData } = await supabase.auth.admin.listUsers({
                        page: 1, perPage: 1000
                    });
                    const found = listData?.users?.find(eu => eu.email === email);
                    if (found) {
                        uid = found.id;
                        existing++;
                    } else {
                        console.warn(`  ⚠️  [${i + 1}] ${email}: exists but not found in list`);
                        errors++;
                        continue;
                    }
                } else {
                    console.error(`  ❌ [${i + 1}] ${email}: ${authErr.message}`);
                    errors++;
                    continue;
                }
            } else {
                uid = authData.user.id;
                created++;
            }

            // Parse meta fields
            const roles = parseWpRoles(u.roles);
            const isPro = u.is_pro === 'yes' || u.is_pro === true || u.is_pro === '1';
            const targetScore = safeJsonParse(u.target_score, {});
            const devices = safeJsonParse(u.devices, {});

            // Create/update public.users
            const { error: profileErr } = await supabase.from('users').upsert({
                id: uid,
                email,
                name,
                is_pro: isPro,
                pro_expiration_date: u.pro_expiration_date || null,
                target_score: targetScore,
                gender: u.gender || null,
                date_of_birth: u.date_of_birth || null,
                phone_number: u.phone_number || null,
                roles: JSON.stringify(roles),
                devices,
                created_at: u.user_registered || new Date().toISOString(),
            }, { onConflict: 'id' });

            if (profileErr) {
                console.error(`  ⚠️  [${i + 1}] ${email} profile: ${profileErr.message}`);
            }

            // Save mapping
            mapping[wpId] = uid;

        } catch (err) {
            console.error(`  ❌ [${i + 1}] ${email}: ${err.message}`);
            errors++;
        }

        // Progress log every 100 users
        if ((i + 1) % 100 === 0) {
            console.log(`  📊 Progress: ${i + 1}/${users.length} (created=${created}, existing=${existing}, errors=${errors})`);
            // Save mapping periodically (in case of crash)
            writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
        }
    }

    // 5. Save final mapping
    writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));

    // 6. Summary
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║               MIGRATION SUMMARY                 ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Total in file:     ${String(users.length).padStart(6)}                      ║`);
    console.log(`║  Created (new):     ${String(created).padStart(6)}                      ║`);
    console.log(`║  Already existed:   ${String(existing).padStart(6)}                      ║`);
    console.log(`║  Skipped (no email):${String(skipped).padStart(6)}                      ║`);
    console.log(`║  Errors:            ${String(errors).padStart(6)}                      ║`);
    console.log(`║  Mapping saved:     ${String(Object.keys(mapping).length).padStart(6)} entries            ║`);
    console.log('╚══════════════════════════════════════════════════╝');
    console.log(`\n📁 Mapping file: ${MAPPING_FILE}`);
}

// Run
migrateUsers().catch(err => {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
});
