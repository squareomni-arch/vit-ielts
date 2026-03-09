/**
 * Test Results Migration — WP GraphQL → Supabase
 * 
 * Prerequisites:
 *   - Users already migrated (data/user-id-mapping.json exists)
 *   - Quizzes already migrated in Supabase (slug-based)
 *   - WP GraphQL endpoint accessible
 *
 * Run: node scripts/migrate-test-results.mjs
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

const WP_URL = process.env.WP_URL || 'https://cms.ieltspredictiontest.com';
const WP_GRAPHQL_URL = `${WP_URL}/graphql`;
const DATA_DIR = join(process.cwd(), 'data');
const USER_MAPPING_FILE = join(DATA_DIR, 'user-id-mapping.json');
const QUIZ_MAPPING_FILE = join(DATA_DIR, 'quiz-id-mapping.json');

// ============================================================
// Helpers
// ============================================================

async function graphqlQuery(query, variables = {}) {
    const res = await fetch(WP_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) throw new Error(json.errors.map(e => e.message).join(', '));
    return json.data;
}

// ============================================================
// Step 1: Build Quiz ID Mapping (wp_databaseId → supabase_uuid)
// ============================================================
async function buildQuizMapping() {
    console.log('\n📋 Building Quiz ID Mapping...');

    // If mapping file exists, reuse it
    if (existsSync(QUIZ_MAPPING_FILE)) {
        const existing = JSON.parse(readFileSync(QUIZ_MAPPING_FILE, 'utf-8'));
        console.log(`  📂 Loaded existing mapping: ${Object.keys(existing).length} entries`);
        return existing;
    }

    // Step 1a: Get all WP quizzes (databaseId → slug)
    const wpQuizzes = new Map(); // databaseId → slug
    let hasNext = true, after = null;
    while (hasNext) {
        const data = await graphqlQuery(
            `query($after:String) { quizzes(first:100, after:$after, where:{status:PUBLISH}) { pageInfo { hasNextPage endCursor } nodes { databaseId slug } } }`,
            { after }
        );
        const nodes = data?.quizzes?.nodes || [];
        if (nodes.length === 0) break;
        for (const q of nodes) {
            wpQuizzes.set(String(q.databaseId), q.slug);
        }
        hasNext = data?.quizzes?.pageInfo?.hasNextPage || false;
        after = data?.quizzes?.pageInfo?.endCursor || null;
    }
    console.log(`  📦 WP quizzes: ${wpQuizzes.size}`);

    // Step 1b: Get all Supabase quizzes (slug → uuid)
    const { data: sbQuizzes, error } = await supabase
        .from('quizzes')
        .select('id, slug');
    if (error) throw new Error(`Supabase quizzes error: ${error.message}`);

    const slugToUuid = new Map();
    for (const q of sbQuizzes) {
        slugToUuid.set(q.slug, q.id);
    }
    console.log(`  📦 Supabase quizzes: ${slugToUuid.size}`);

    // Step 1c: Build wp_databaseId → supabase_uuid
    const mapping = {};
    let mapped = 0, unmapped = 0;
    for (const [dbId, slug] of wpQuizzes) {
        const uuid = slugToUuid.get(slug);
        if (uuid) {
            mapping[dbId] = uuid;
            mapped++;
        } else {
            unmapped++;
        }
    }
    console.log(`  ✅ Mapped: ${mapped}, ⚠️ Unmapped: ${unmapped}`);

    // Save mapping
    writeFileSync(QUIZ_MAPPING_FILE, JSON.stringify(mapping, null, 2));
    console.log(`  📁 Saved: ${QUIZ_MAPPING_FILE}`);

    return mapping;
}

// ============================================================
// Step 2: Migrate Test Results
// ============================================================
async function migrateTestResults(userMapping, quizMapping) {
    console.log('\n📦 Migrating Test Results...');

    let hasNext = true;
    let after = null;
    let total = 0;
    let skipped = 0;
    let errors = 0;

    const query = `query GetResults($after: String) {
        testResults(first: 100, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
                databaseId
                authorDatabaseId
                testResultFields { answers testPart timeLeft testTime testMode score quiz { node { ... on Quiz { databaseId } } } }
                status date
            }
        }
    }`;

    while (hasNext) {
        try {
            const data = await graphqlQuery(query, { after });
            const results = data?.testResults?.nodes || [];
            if (results.length === 0) break;

            for (const r of results) {
                const f = r.testResultFields || {};
                const wpUserId = r.authorDatabaseId;
                const wpQuizId = f.quiz?.node?.databaseId;
                const userId = userMapping[String(wpUserId)];
                const quizId = quizMapping[String(wpQuizId)];

                if (!userId || !quizId) {
                    skipped++;
                    continue;
                }

                try {
                    let answers = null;
                    if (f.answers) {
                        answers = typeof f.answers === 'string' ? JSON.parse(f.answers) : f.answers;
                    }
                    let testPart = null;
                    if (f.testPart) {
                        testPart = typeof f.testPart === 'string' ? JSON.parse(f.testPart) : f.testPart;
                    }

                    const { error: insertErr } = await supabase.from('test_results').insert({
                        user_id: userId,
                        quiz_id: quizId,
                        answers,
                        test_part: testPart,
                        time_left: f.timeLeft || null,
                        test_time: f.testTime || null,
                        test_mode: f.testMode || null,
                        score: f.score || null,
                        status: r.status === 'publish' ? 'published' : 'draft',
                        submitted_at: r.date || null,
                    });

                    if (insertErr) {
                        errors++;
                        if (errors <= 5) console.error(`  ⚠️ Insert error: ${insertErr.message}`);
                    } else {
                        total++;
                    }
                } catch (parseErr) {
                    errors++;
                    if (errors <= 5) console.error(`  ⚠️ Parse error: ${parseErr.message}`);
                }
            }

            hasNext = data?.testResults?.pageInfo?.hasNextPage || false;
            after = data?.testResults?.pageInfo?.endCursor || null;

            if ((total + skipped) % 500 < 100) {
                console.log(`  📊 Progress: inserted=${total}, skipped=${skipped}, errors=${errors}`);
            }
        } catch (err) {
            console.error(`  ❌ Batch error: ${err.message}`);
            // If it's a GraphQL error, try to continue
            if (after) continue;
            break;
        }
    }

    return { total, skipped, errors };
}

// ============================================================
// Main
// ============================================================
async function main() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   Test Results Migration — WP GraphQL → Supabase║');
    console.log('╚══════════════════════════════════════════════════╝');

    // Load user mapping
    if (!existsSync(USER_MAPPING_FILE)) {
        console.error(`❌ User mapping not found: ${USER_MAPPING_FILE}`);
        console.error('   Run migrate-users-from-db.mjs first!');
        process.exit(1);
    }
    const userMapping = JSON.parse(readFileSync(USER_MAPPING_FILE, 'utf-8'));
    console.log(`📂 User mapping: ${Object.keys(userMapping).length} entries`);

    // Build quiz mapping
    const quizMapping = await buildQuizMapping();
    console.log(`📂 Quiz mapping: ${Object.keys(quizMapping).length} entries`);

    // Migrate test results
    const { total, skipped, errors } = await migrateTestResults(userMapping, quizMapping);

    // Summary
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║               MIGRATION SUMMARY                 ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Inserted:          ${String(total).padStart(6)}                      ║`);
    console.log(`║  Skipped (no map):  ${String(skipped).padStart(6)}                      ║`);
    console.log(`║  Errors:            ${String(errors).padStart(6)}                      ║`);
    console.log('╚══════════════════════════════════════════════════╝');
}

main().catch(err => {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
});
