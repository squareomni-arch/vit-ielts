/**
 * Device Data Migration — WordPress ACF Sub-fields → Supabase JSONB
 *
 * Prerequisites:
 *   1. Export device data from WordPress DB using this SQL (prefix mf_):
 *
 *      SELECT
 *        u.ID as wp_id,
 *        MAX(CASE WHEN m.meta_key = 'devices_mobile_device_id' THEN m.meta_value END) as mobile_device_id,
 *        MAX(CASE WHEN m.meta_key = 'devices_tablet_device_id' THEN m.meta_value END) as tablet_device_id,
 *        MAX(CASE WHEN m.meta_key = 'devices_desktop_device_id' THEN m.meta_value END) as desktop_device_id
 *      FROM mf_users u
 *      LEFT JOIN mf_usermeta m ON u.ID = m.user_id
 *      WHERE m.meta_key IN ('devices_mobile_device_id', 'devices_tablet_device_id', 'devices_desktop_device_id')
 *      GROUP BY u.ID;
 *
 *   2. Save result as data/wp-users-devices.json
 *   3. Ensure data/user-id-mapping.json exists (from migrate-users-from-db.mjs)
 *   4. Run: node scripts/migrate-devices.mjs
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
const DEVICES_FILE = join(DATA_DIR, 'wp-users-devices.json');
const MAPPING_FILE = join(DATA_DIR, 'user-id-mapping.json');

// ============================================================
// Helpers
// ============================================================

/**
 * Build the devices JSONB object from the 3 ACF sub-field values
 * Only includes device types that have a non-empty device_id
 */
function buildDevicesJson(mobile, tablet, desktop) {
    const devices = {};
    if (mobile && mobile.trim()) devices.mobile = { device_id: mobile.trim() };
    if (tablet && tablet.trim()) devices.tablet = { device_id: tablet.trim() };
    if (desktop && desktop.trim()) devices.desktop = { device_id: desktop.trim() };
    return devices;
}

// ============================================================
// Main Migration
// ============================================================
async function migrateDevices() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   Device Migration — WP ACF → Supabase JSONB   ║');
    console.log('╚══════════════════════════════════════════════════╝');

    // 1. Check files exist
    if (!existsSync(DEVICES_FILE)) {
        console.error(`\n❌ File not found: ${DEVICES_FILE}`);
        console.error('   Please export device data and save as data/wp-users-devices.json');
        console.error('   See the SQL query in the header of this script.');
        process.exit(1);
    }

    if (!existsSync(MAPPING_FILE)) {
        console.error(`\n❌ File not found: ${MAPPING_FILE}`);
        console.error('   Please run migrate-users-from-db.mjs first.');
        process.exit(1);
    }

    // 2. Load data
    const rawData = JSON.parse(readFileSync(DEVICES_FILE, 'utf-8'));

    // Handle phpMyAdmin JSON export format
    let rows;
    if (Array.isArray(rawData)) {
        const tableEntry = rawData.find(item => item.type === 'table' && item.data);
        if (tableEntry && Array.isArray(tableEntry.data)) {
            rows = tableEntry.data;
        } else {
            rows = rawData;
        }
    } else {
        rows = [rawData];
    }

    const mapping = JSON.parse(readFileSync(MAPPING_FILE, 'utf-8'));

    console.log(`\n📋 Found ${rows.length} device rows in wp-users-devices.json`);
    console.log(`📂 Loaded user mapping: ${Object.keys(mapping).length} entries\n`);

    // 3. Stats
    let updated = 0;
    let skipped_no_mapping = 0;
    let skipped_no_devices = 0;
    let errors = 0;

    // 4. Process each row
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const wpId = String(row.wp_id || row.ID || row.id);

        // Build devices JSON
        const devices = buildDevicesJson(
            row.mobile_device_id,
            row.tablet_device_id,
            row.desktop_device_id
        );

        // Skip if no actual device data
        if (Object.keys(devices).length === 0) {
            skipped_no_devices++;
            continue;
        }

        // Lookup Supabase UUID
        const supabaseId = mapping[wpId];
        if (!supabaseId) {
            skipped_no_mapping++;
            continue;
        }

        try {
            const { error } = await supabase
                .from('users')
                .update({ devices })
                .eq('id', supabaseId);

            if (error) {
                console.error(`  ❌ wp_id=${wpId}: ${error.message}`);
                errors++;
            } else {
                updated++;
            }
        } catch (err) {
            console.error(`  ❌ wp_id=${wpId}: ${err.message}`);
            errors++;
        }

        // Progress log every 500 rows
        if ((i + 1) % 500 === 0) {
            console.log(`  📊 Progress: ${i + 1}/${rows.length} (updated=${updated}, errors=${errors})`);
        }
    }

    // 5. Summary
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║             DEVICE MIGRATION SUMMARY            ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Total rows:          ${String(rows.length).padStart(6)}                    ║`);
    console.log(`║  Updated in Supabase: ${String(updated).padStart(6)}                    ║`);
    console.log(`║  No mapping (skip):   ${String(skipped_no_mapping).padStart(6)}                    ║`);
    console.log(`║  No device data:      ${String(skipped_no_devices).padStart(6)}                    ║`);
    console.log(`║  Errors:              ${String(errors).padStart(6)}                    ║`);
    console.log('╚══════════════════════════════════════════════════╝');
}

// Run
migrateDevices().catch(err => {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
});
