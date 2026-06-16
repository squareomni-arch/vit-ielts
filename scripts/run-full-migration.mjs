/**
 * Re-Migration: Fix quiz skill + mock_test practice_tests + collections
 * Run: node scripts/run-full-migration.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const WP_URL = process.env.WP_URL || 'https://cms.vitieltstest.com';
const WP_USER = process.env.WP_ADMIN_USER || 'admin';
const WP_PASS = process.env.WP_ADMIN_PASSWORD || '3986483aA@';
const WP_AUTH = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const quizIdMap = new Map();    // wp_databaseId → supabase_uuid
const mockTestIdMap = new Map(); // wp_databaseId → supabase_uuid

async function gql(query, variables = {}) {
    const res = await fetch(`${WP_URL}/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${WP_AUTH}`,
        },
        body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`GraphQL ${res.status}`);
    const json = await res.json();
    if (json.errors?.length) throw new Error(`GraphQL: ${json.errors[0].message}`);
    return json.data;
}

/** Extract first element if array, otherwise return as-is */
function arrFirst(val, fallback = null) {
    if (Array.isArray(val)) return val[0] || fallback;
    return val || fallback;
}

// ===========================================================================
// 1. QUIZZES — fix skill + type
// ===========================================================================
async function migrateQuizzes() {
    console.log('\n📦 Step 1: Re-migrating Quizzes (fix skill & type)...');

    const QUERY = `query($after:String) {
        quizzes(first:50, after:$after, where:{status:PUBLISH}) {
            pageInfo { hasNextPage endCursor }
            nodes {
                databaseId title slug excerpt date
                featuredImage { node { sourceUrl } }
                quizFields {
                    type skill time scoreType proUserOnly testsTaken
                    source year quarter part
                    audio { node { mediaItemUrl } }
                    pdf { node { mediaItemUrl } }
                }
            }
        }
    }`;

    let after = null;
    let total = 0, listeningCount = 0, failCount = 0;

    while (true) {
        let data;
        try {
            data = await gql(QUERY, { after });
        } catch (err) {
            console.error('  ⚠️ Query failed:', err.message);
            break;
        }

        const { nodes, pageInfo } = data.quizzes;
        if (!nodes?.length) break;

        for (const quiz of nodes) {
            const f = quiz.quizFields || {};

            // WP returns skill/type as arrays like ["reading","IELTS Reading"]
            const skill = arrFirst(f.skill, 'reading');
            const type = arrFirst(f.type, 'practice');

            const { data: row, error } = await supabase
                .from('quizzes')
                .upsert({
                    title: quiz.title,
                    slug: quiz.slug,
                    excerpt: quiz.excerpt || null,
                    type: type,
                    skill: skill,
                    time_minutes: f.time || 60,
                    pro_user_only: f.proUserOnly || false,
                    score_type: arrFirst(f.scoreType),
                    featured_image: quiz.featuredImage?.node?.sourceUrl || null,
                    audio_url: f.audio?.node?.mediaItemUrl || null,
                    pdf_url: f.pdf?.node?.mediaItemUrl || null,
                    tests_taken: f.testsTaken || 0,
                    source: arrFirst(f.source),
                    year: arrFirst(f.year),
                    quarter: arrFirst(f.quarter),
                    part: arrFirst(f.part),
                    status: 'published',
                    published_at: quiz.date,
                }, { onConflict: 'slug' })
                .select('id')
                .single();

            if (error) {
                console.error(`  ⚠️ "${quiz.title}" (skill=${skill}, type=${type}): ${error.message}`);
                failCount++;
                continue;
            }

            quizIdMap.set(quiz.databaseId, row.id);
            if (skill === 'listening') listeningCount++;
            total++;
        }

        console.log(`  Batch: ${nodes.length} quizzes`);
        if (!pageInfo.hasNextPage) break;
        after = pageInfo.endCursor;
    }

    console.log(`  ✅ Quizzes: ${total} OK, ${listeningCount} listening, ${failCount} failed`);
    console.log(`  📊 Quiz ID map: ${quizIdMap.size} entries`);
}

// ===========================================================================
// 2. MOCK TESTS — fix practice_tests with correct node path
// ===========================================================================
async function migrateMockTests() {
    console.log('\n📦 Step 2: Re-migrating Mock Tests (fix practice_tests)...');

    // WP ACF relationship fields return { node: { databaseId, slug } }
    const QUERY = `query($after:String) {
        mockTests(first:50, after:$after) {
            pageInfo { hasNextPage endCursor }
            nodes {
                databaseId title slug
                mockTestFields {
                    practice_test {
                        reading_test {
                            node { ... on Quiz { databaseId slug } }
                        }
                        listening_test {
                            node { ... on Quiz { databaseId slug } }
                        }
                    }
                }
            }
        }
    }`;

    let after = null;
    let total = 0;

    while (true) {
        let data;
        try {
            data = await gql(QUERY, { after });
        } catch (err) {
            console.error('  ⚠️ Query failed:', err.message);
            break;
        }

        const { nodes, pageInfo } = data.mockTests;
        if (!nodes?.length) break;

        for (const mt of nodes) {
            const practiceTests = (mt.mockTestFields?.practice_test || []).map(pt => ({
                reading_test_id: quizIdMap.get(pt.reading_test?.node?.databaseId) || null,
                listening_test_id: quizIdMap.get(pt.listening_test?.node?.databaseId) || null,
            })).filter(pt => pt.reading_test_id || pt.listening_test_id);

            const { data: row, error } = await supabase
                .from('mock_tests')
                .upsert({
                    title: mt.title,
                    slug: mt.slug,
                    practice_tests: practiceTests,
                }, { onConflict: 'slug' })
                .select('id')
                .single();

            if (error) {
                console.error(`  ⚠️ "${mt.title}": ${error.message}`);
                continue;
            }
            mockTestIdMap.set(mt.databaseId, row.id);
            total++;

            if (practiceTests.length > 0) {
                console.log(`  📎 "${mt.title}": ${practiceTests.length} practice tests`);
            }
        }

        console.log(`  Batch: ${nodes.length} mock tests`);
        if (!pageInfo.hasNextPage) break;
        after = pageInfo.endCursor;
    }

    console.log(`  ✅ Mock Tests: ${total} migrated`);
}

// ===========================================================================
// 3. MOCK TEST COLLECTIONS
// ===========================================================================
async function migrateMockTestCollections() {
    console.log('\n📦 Step 3: Re-migrating Mock Test Collections...');

    const QUERY = `query($after:String) {
        mockTestCollections(first:50, after:$after) {
            pageInfo { hasNextPage endCursor }
            nodes {
                databaseId title slug
                featuredImage { node { sourceUrl } }
                mockTestCollectionFields {
                    mock_test {
                        nodes { ... on MockTest { databaseId slug } }
                    }
                }
            }
        }
    }`;

    let after = null;
    let total = 0;

    while (true) {
        let data;
        try {
            data = await gql(QUERY, { after });
        } catch (err) {
            console.error('  ⚠️ Query failed:', err.message);
            break;
        }

        const { nodes, pageInfo } = data.mockTestCollections;
        if (!nodes?.length) break;

        for (const coll of nodes) {
            const mockTestNodes = coll.mockTestCollectionFields?.mock_test?.nodes || [];
            const mockTestIds = mockTestNodes
                .map(mt => mockTestIdMap.get(mt.databaseId))
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
                console.error(`  ⚠️ "${coll.title}": ${error.message}`);
                continue;
            }
            total++;
            console.log(`  📂 "${coll.title}": ${mockTestIds.length} mock tests`);
        }

        console.log(`  Batch: ${nodes.length} collections`);
        if (!pageInfo.hasNextPage) break;
        after = pageInfo.endCursor;
    }

    console.log(`  ✅ Collections: ${total} migrated`);
}

// ===========================================================================
// Main
// ===========================================================================
async function main() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  Re-Migration: Fix Skill + Mock Test References ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log(`  WP: ${WP_URL}`);

    const start = Date.now();

    await migrateQuizzes();
    await migrateMockTests();
    await migrateMockTestCollections();

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n🎉 Done in ${elapsed}s`);
    console.log(`   Quizzes: ${quizIdMap.size}`);
    console.log(`   Mock Tests: ${mockTestIdMap.size}`);
}

main().catch(err => {
    console.error('\n❌ Failed:', err);
    process.exit(1);
});
