/**
 * Remaining Phase 6 Migrations:
 *   1. Mock Test Collections (WP GraphQL → mock_test_collections)
 *   2. Site Settings (seed default data → site_settings)
 *   3. Menus (WP GraphQL → menus)
 * 
 * Run: node scripts/migrate-remaining.mjs
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

const WP_URL = process.env.WP_URL || 'https://cms.vitieltstest.com';
const QUIZ_MAPPING_FILE = join(process.cwd(), 'data', 'quiz-id-mapping.json');

async function graphqlQuery(query, variables = {}) {
    const res = await fetch(`${WP_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) throw new Error(json.errors.map(e => e.message).join(', '));
    return json.data;
}

// ============================================================
// 1. Mock Test Collections
// ============================================================
async function migrateMockTestCollections() {
    console.log('\n📦 PART 1: Mock Test Collections');
    console.log('='.repeat(50));

    // First, get mock_test slug → uuid from Supabase
    const { data: sbMockTests, error: mtErr } = await supabase
        .from('mock_tests')
        .select('id, slug');
    if (mtErr) {
        console.error(`❌ Cannot fetch mock_tests: ${mtErr.message}`);
        return;
    }
    const mtSlugToUuid = new Map(sbMockTests.map(m => [m.slug, m.id]));
    console.log(`📂 Mock tests in Supabase: ${mtSlugToUuid.size}`);

    // Try to fetch mock_test_collections from WP GraphQL
    let collTotal = 0;
    let hasNext = true, after = null;

    // First, probe if mockTestCollections type exists
    try {
        const probeData = await graphqlQuery(`{ mockTestCollections(first:1) { nodes { databaseId title slug } } }`);
        const probeNodes = probeData?.mockTestCollections?.nodes || [];
        console.log(`🔍 Probe: found ${probeNodes.length} collections`);
    } catch (err) {
        console.log(`⚠️  mockTestCollections type not available in GraphQL: ${err.message}`);
        console.log(`   Trying mock-test-collection custom post type...`);

        // Try alternative: mock_test_collection
        try {
            const data = await graphqlQuery(`{ mockTestCollections: allMockTestCollection(first:50) { nodes { databaseId title slug } } }`);
            console.log(`🔍 Alternative found:`, data);
        } catch (err2) {
            console.log(`⚠️  Alternative also failed. Mock test collections may not exist in WP.`);
            console.log(`   Skipping mock_test_collections migration.`);
            return;
        }
    }

    // Query with full fields — WP ACF uses snake_case "mock_test"
    const query = `query GetCollections($after: String) {
        mockTestCollections(first: 50, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
                databaseId title slug
                featuredImage { node { sourceUrl } }
                mockTestCollectionFields {
                    mock_test { nodes { ... on MockTest { databaseId slug } } }
                }
            }
        }
    }`;

    while (hasNext) {
        try {
            const data = await graphqlQuery(query, { after });
            const collections = data?.mockTestCollections?.nodes || [];
            if (collections.length === 0) break;

            for (const coll of collections) {
                // Resolve mock_test IDs from slugs
                const mockTestNodes = coll.mockTestCollectionFields?.mock_test?.nodes || [];
                const mockTestIds = mockTestNodes
                    .map(mt => mtSlugToUuid.get(mt.slug))
                    .filter(Boolean);

                const { error } = await supabase
                    .from('mock_test_collections')
                    .upsert({
                        title: coll.title,
                        slug: coll.slug,
                        mock_test_ids: mockTestIds,
                        featured_image: coll.featuredImage?.node?.sourceUrl || null,
                    }, { onConflict: 'slug' });

                if (error) {
                    console.error(`  ⚠️ Collection "${coll.title}": ${error.message}`);
                } else {
                    collTotal++;
                }
            }

            hasNext = data?.mockTestCollections?.pageInfo?.hasNextPage || false;
            after = data?.mockTestCollections?.pageInfo?.endCursor || null;
        } catch (err) {
            console.error(`  ❌ Collections error: ${err.message}`);
            break;
        }
    }

    console.log(`✅ Mock Test Collections: ${collTotal}`);
}

// ============================================================
// 2. Site Settings (seed with default data from WP GraphQL)
// ============================================================
async function migrateSiteSettings() {
    console.log('\n📦 PART 2: Site Settings');
    console.log('='.repeat(50));

    let inserted = 0;

    // Try to fetch generalSettings from WP GraphQL
    try {
        const data = await graphqlQuery(`{
            generalSettings { title description url language }
            websiteOptions {
                websiteOptionsFields {
                    generalSettings {
                        favicon { node { sourceUrl } }
                        logo { node { sourceUrl } }
                        facebook email zalo phoneNumber
                        preventCopy buyProLink
                        bannerTestResult { node { sourceUrl } }
                    }
                }
            }
        }`);

        const generalSettings = data?.generalSettings || {};
        const websiteFields = data?.websiteOptions?.websiteOptionsFields?.generalSettings || {};

        // Insert site_title
        const { error: e1 } = await supabase.from('site_settings').upsert({
            key: 'site_title',
            value: JSON.stringify(generalSettings.title || 'Vit IELTS'),
        }, { onConflict: 'key' });
        if (!e1) inserted++;

        // Insert site_description
        const { error: e2 } = await supabase.from('site_settings').upsert({
            key: 'site_description',
            value: JSON.stringify(generalSettings.description || ''),
        }, { onConflict: 'key' });
        if (!e2) inserted++;

        // Insert site_url
        const { error: e3 } = await supabase.from('site_settings').upsert({
            key: 'site_url',
            value: JSON.stringify(generalSettings.url || ''),
        }, { onConflict: 'key' });
        if (!e3) inserted++;

        // Insert general_settings (the big one used by getMasterData)
        const generalSettingsObj = {
            favicon: websiteFields.favicon?.node?.sourceUrl || '',
            logo: websiteFields.logo?.node?.sourceUrl || '',
            facebook: websiteFields.facebook || '',
            email: websiteFields.email || '',
            zalo: websiteFields.zalo || '',
            phoneNumber: websiteFields.phoneNumber || '',
            preventCopy: websiteFields.preventCopy || false,
            buyProLink: websiteFields.buyProLink || '',
            bannerTestResult: websiteFields.bannerTestResult?.node?.sourceUrl || '',
        };

        const { error: e4 } = await supabase.from('site_settings').upsert({
            key: 'general_settings',
            value: generalSettingsObj,
        }, { onConflict: 'key' });
        if (!e4) inserted++;
        else console.error(`  ⚠️ general_settings: ${e4.message}`);

        console.log(`  ✅ From WP GraphQL: ${inserted} settings`);
    } catch (err) {
        console.log(`  ⚠️ WP GraphQL websiteOptions failed: ${err.message}`);
        console.log(`  → Seeding default site_settings...`);

        // Seed defaults if WP query fails
        const defaults = [
            { key: 'site_title', value: 'Vit IELTS' },
            { key: 'site_description', value: 'Luyện thi IELTS Online' },
            { key: 'site_url', value: 'https://vitieltstest.com' },
            {
                key: 'general_settings', value: {
                    favicon: '', logo: '', facebook: '', email: '',
                    zalo: '', phoneNumber: '', preventCopy: false,
                    buyProLink: '', bannerTestResult: '',
                }
            },
        ];

        for (const d of defaults) {
            const { error } = await supabase.from('site_settings').upsert({
                key: d.key,
                value: typeof d.value === 'string' ? JSON.stringify(d.value) : d.value,
            }, { onConflict: 'key' });
            if (!error) inserted++;
            else console.error(`  ⚠️ ${d.key}: ${error.message}`);
        }
        console.log(`  ✅ Seeded defaults: ${inserted} settings`);
    }
}

// ============================================================
// 3. Menus (WP GraphQL → menus)
// ============================================================
async function migrateMenus() {
    console.log('\n📦 PART 3: Menus');
    console.log('='.repeat(50));

    let inserted = 0;

    // Try fetching menus from WP GraphQL
    try {
        const data = await graphqlQuery(`{
            menus {
                nodes {
                    slug name
                    locations
                    menuItems {
                        nodes {
                            label url order
                            parentDatabaseId
                            cssClasses
                            childItems {
                                nodes {
                                    label url order
                                }
                            }
                        }
                    }
                }
            }
        }`);

        const wpMenus = data?.menus?.nodes || [];
        console.log(`  📂 Found ${wpMenus.length} menus in WP`);

        for (const menu of wpMenus) {
            // Map WP menu location to our format
            const locations = menu.locations || [];
            const location = locations[0]?.toLowerCase()?.replace(/_/g, '-') || menu.slug;

            // Build menu items
            const items = (menu.menuItems?.nodes || [])
                .filter(item => !item.parentDatabaseId || item.parentDatabaseId === 0)
                .map(item => ({
                    label: item.label,
                    url: item.url || '#',
                    order: item.order || 0,
                    cssClasses: item.cssClasses || [],
                    children: (item.childItems?.nodes || []).map(child => ({
                        label: child.label,
                        url: child.url || '#',
                        order: child.order || 0,
                    })),
                }));

            const { error } = await supabase.from('menus').upsert({
                location,
                items,
            }, { onConflict: 'location' });

            if (error) {
                console.error(`  ⚠️ Menu "${location}": ${error.message}`);
            } else {
                inserted++;
                console.log(`  ✅ Menu "${location}": ${items.length} items`);
            }
        }
    } catch (err) {
        console.log(`  ⚠️ WP GraphQL menus failed: ${err.message}`);
        console.log(`  → Seeding default menus...`);

        // Seed default menus
        const defaultMenus = [
            {
                location: 'main-menu',
                items: [
                    { label: 'Trang chủ', url: '/', order: 0 },
                    { label: 'Luyện thi', url: '/library', order: 1 },
                    { label: 'Đề thi', url: '/exam', order: 2 },
                    { label: 'Blog', url: '/blog', order: 3 },
                    { label: 'Bài mẫu', url: '/bai-mau', order: 4 },
                ],
            },
            {
                location: 'footer-menu',
                items: [
                    { label: 'Giới thiệu', url: '/about', order: 0 },
                    { label: 'Chính sách', url: '/privacy', order: 1 },
                    { label: 'Điều khoản', url: '/terms', order: 2 },
                ],
            },
        ];

        for (const menu of defaultMenus) {
            const { error } = await supabase.from('menus').upsert(menu, { onConflict: 'location' });
            if (!error) inserted++;
            else console.error(`  ⚠️ ${menu.location}: ${error.message}`);
        }
        console.log(`  ✅ Seeded defaults: ${inserted} menus`);
    }
}

// ============================================================
// Main
// ============================================================
async function main() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  Remaining Migrations: Collections + Settings   ║');
    console.log('╚══════════════════════════════════════════════════╝');

    await migrateMockTestCollections();
    await migrateSiteSettings();
    await migrateMenus();

    console.log('\n🎉 All remaining migrations done!');
}

main().catch(err => {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
});
