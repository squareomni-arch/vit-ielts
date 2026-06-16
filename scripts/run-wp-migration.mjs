import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';
config({ path: '.env.local' });

const WP_URL = process.env.WP_URL || 'https://cms.vitieltstest.com';
const WP_AUTH = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_PASSWORD}`).toString('base64');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function gql(query, variables = {}) {
    const r = await fetch(`${WP_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Basic ${WP_AUTH}` },
        body: JSON.stringify({ query, variables }),
    });
    const json = await r.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors[0]));
    return json.data;
}

const log = (msg) => console.log(msg);

// ============================================
// 1. USERS via GraphQL (REST returned 401)
// ============================================
log('\n=== USERS ===');
let userTotal = 0;
try {
    let hasNext = true, after = null;
    while (hasNext) {
        const data = await gql(`query($after:String) { users(first:100, after:$after) { pageInfo { hasNextPage endCursor } nodes { databaseId name email } } }`, { after });
        const users = data?.users?.nodes || [];
        if (users.length === 0) break;
        for (const u of users) {
            if (!u.email) continue;
            const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
                email: u.email, password: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                email_confirm: true,
            });
            let uid;
            if (authErr) {
                if (authErr.message?.includes('already')) {
                    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
                    const existing = list?.users?.find(eu => eu.email === u.email);
                    if (existing) uid = existing.id;
                    else continue;
                } else { log(`  Skip ${u.email}: ${authErr.message}`); continue; }
            } else { uid = authData.user.id; }

            await supabase.from('users').upsert({
                id: uid, email: u.email, name: u.name || 'User',
                roles: JSON.stringify(['subscriber']),
            });
            userTotal++;
        }
        hasNext = data?.users?.pageInfo?.hasNextPage || false;
        after = data?.users?.pageInfo?.endCursor || null;
        log(`  Batch: ${users.length} users`);
    }
} catch (e) { log(`  Users error: ${e.message?.substring(0, 200)}`); }
log(`Users migrated: ${userTotal}`);

// ============================================
// 2. QUIZZES (step by step to find the right fields)
// ============================================
log('\n=== QUIZZES ===');
let quizTotal = 0;
try {
    // First try simple query to get quiz slugs
    let hasNext = true, after = null;
    while (hasNext) {
        const data = await gql(`query($after:String) {
      quizzes(first:50, after:$after, where:{status:PUBLISH}) {
        pageInfo { hasNextPage endCursor }
        nodes { databaseId title slug excerpt status featuredImage { node { sourceUrl } } }
      }
    }`, { after });
        const quizzes = data?.quizzes?.nodes || [];
        if (quizzes.length === 0) break;

        for (const q of quizzes) {
            const { error } = await supabase.from('quizzes').upsert({
                title: q.title, slug: q.slug, excerpt: q.excerpt || null,
                type: 'practice', skill: 'reading', time_minutes: 60,
                featured_image: q.featuredImage?.node?.sourceUrl || null,
                status: q.status === 'publish' ? 'published' : 'draft',
                published_at: new Date().toISOString(),
            }, { onConflict: 'slug' });
            if (error) log(`  Quiz ${q.slug}: ${error.message}`);
            else quizTotal++;
        }

        hasNext = data?.quizzes?.pageInfo?.hasNextPage || false;
        after = data?.quizzes?.pageInfo?.endCursor || null;
        log(`  Batch: ${quizzes.length} quizzes`);
    }
} catch (e) { log(`  Quizzes error: ${e.message?.substring(0, 200)}`); }
log(`Quizzes migrated: ${quizTotal}`);

// Now try to add quiz fields one at a time to determine what works
log('\n=== QUIZ FIELDS PROBE ===');
try {
    const data = await gql(`{ quizzes(first:1) { nodes { databaseId quizFields { skill type timeMinutes proUserOnly scoreType audioUrl pdfUrl source year quarter part questionForm } } } }`);
    const qf = data?.quizzes?.nodes?.[0]?.quizFields;
    log(`QuizFields OK: ${JSON.stringify(qf).substring(0, 300)}`);

    // Now try passages separately
    try {
        const pdata = await gql(`{ quizzes(first:1) { nodes { quizFields { passages { title content } } } } }`);
        log(`Passages OK: ${JSON.stringify(pdata?.quizzes?.nodes?.[0]?.quizFields?.passages).substring(0, 200)}`);

        // Try questions in passages
        try {
            const qdata = await gql(`{ quizzes(first:1) { nodes { quizFields { passages { questions { type title } } } } } }`);
            log(`Questions OK: ${JSON.stringify(qdata?.quizzes?.nodes?.[0]?.quizFields?.passages?.[0]?.questions).substring(0, 200)}`);
        } catch (e) { log(`Questions error: ${e.message?.substring(0, 200)}`); }
    } catch (e) { log(`Passages error: ${e.message?.substring(0, 200)}`); }
} catch (e) { log(`QuizFields error: ${e.message?.substring(0, 200)}`); }

// ============================================
// 3. SAMPLE ESSAYS
// ============================================
log('\n=== SAMPLE ESSAYS ===');
let essayTotal = 0;
try {
    let hasNext = true, after = null;
    while (hasNext) {
        const data = await gql(`query($after:String) {
      sampleEssays(first:50, after:$after) {
        pageInfo { hasNextPage endCursor }
        nodes { databaseId title slug content excerpt status date featuredImage { node { sourceUrl } } }
      }
    }`, { after });
        const essays = data?.sampleEssays?.nodes || [];
        if (essays.length === 0) break;

        for (const e of essays) {
            const { error } = await supabase.from('sample_essays').upsert({
                title: e.title, slug: e.slug, content: e.content || null,
                excerpt: e.excerpt || null,
                featured_image: e.featuredImage?.node?.sourceUrl || null,
                status: e.status === 'publish' ? 'published' : 'draft',
                published_at: e.date || null,
            }, { onConflict: 'slug' });
            if (error) log(`  Essay ${e.slug}: ${error.message}`);
            else essayTotal++;
        }
        hasNext = data?.sampleEssays?.pageInfo?.hasNextPage || false;
        after = data?.sampleEssays?.pageInfo?.endCursor || null;
        log(`  Batch: ${essays.length} essays`);
    }
} catch (e) { log(`  Essays error: ${e.message?.substring(0, 200)}`); }
log(`Sample Essays migrated: ${essayTotal}`);

// ============================================
// 4. TEST RESULTS
// ============================================
log('\n=== TEST RESULTS ===');
let trTotal = 0;
try {
    let hasNext = true, after = null;
    while (hasNext) {
        const data = await gql(`query($after:String) {
      testResults(first:100, after:$after) {
        pageInfo { hasNextPage endCursor }
        nodes { databaseId title status date }
      }
    }`, { after });
        const results = data?.testResults?.nodes || [];
        if (results.length === 0) break;
        trTotal += results.length;
        hasNext = data?.testResults?.pageInfo?.hasNextPage || false;
        after = data?.testResults?.pageInfo?.endCursor || null;
        log(`  Batch: ${results.length} results (total: ${trTotal})`);
    }
} catch (e) { log(`  TestResults error: ${e.message?.substring(0, 200)}`); }
log(`Test Results found: ${trTotal} (not inserted yet — need user/quiz mapping)`);

// ============================================
// 5. MOCK TESTS
// ============================================
log('\n=== MOCK TESTS ===');
let mockTotal = 0;
try {
    const data = await gql(`{ mockTests(first:50) { nodes { databaseId title slug } } }`);
    const mocks = data?.mockTests?.nodes || [];
    for (const m of mocks) {
        const { error } = await supabase.from('mock_tests').upsert({
            title: m.title, slug: m.slug, practice_tests: [],
        }, { onConflict: 'slug' });
        if (error) log(`  Mock ${m.slug}: ${error.message}`);
        else mockTotal++;
    }
} catch (e) { log(`  MockTests error: ${e.message?.substring(0, 200)}`); }
log(`Mock Tests migrated: ${mockTotal}`);

log('\n=== DONE ===');
