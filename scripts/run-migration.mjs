/**
 * Combined Data Migration Runner (ESM compatible)
 * Runs: JSON data + CMS configs + WordPress data → Supabase
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DATA_DIR = join(process.cwd(), 'data');
const CONFIG_DIR = join(process.cwd(), 'config');
const WP_URL = process.env.WP_URL || 'https://cms.vitieltstest.com';
const WP_USER = process.env.WP_ADMIN_USER || 'admin';
const WP_PASS = process.env.WP_ADMIN_PASSWORD || '';
const WP_AUTH = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');
const WP_GRAPHQL_URL = `${WP_URL}/graphql`;

// Helpers
function readJson(filename) {
    const fp = join(DATA_DIR, filename);
    if (!existsSync(fp)) { console.warn(`⚠️  ${filename} not found`); return []; }
    return JSON.parse(readFileSync(fp, 'utf-8'));
}

async function graphqlQuery(query, variables = {}) {
    const res = await fetch(WP_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Basic ${WP_AUTH}` },
        body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) throw new Error(json.errors.map(e => e.message).join(', '));
    return json.data;
}

async function wpRestGet(endpoint) {
    const res = await fetch(`${WP_URL}/wp-json${endpoint}`, {
        headers: { Authorization: `Basic ${WP_AUTH}` },
    });
    if (!res.ok) throw new Error(`WP REST ${res.status}: ${res.statusText}`);
    return res.json();
}

// ============================================================
// PART 1: JSON Data Migration
// ============================================================
async function migrateJsonData() {
    console.log('\n📦 PART 1: JSON Data Migration\n' + '='.repeat(50));

    // Orders
    const orders = readJson('orders.json');
    if (orders.length > 0) {
        const rows = orders.map(o => ({
            order_id: o.orderId, package_type: o.packageType || null,
            duration: o.duration, skill_type: o.skillType || null,
            amount: o.amount, original_amount: o.originalAmount || o.amount,
            discount_amount: o.discountAmount || 0, coupon_code: o.couponCode || null,
            status: o.status, payment_method: o.paymentMethod || null,
            transfer_content: o.transferContent || null, affiliate_ref: o.affiliateRef || null,
            created_at: o.createdAt,
        }));
        const { error } = await supabase.from('orders').upsert(rows, { onConflict: 'order_id', ignoreDuplicates: true });
        if (error) console.error('❌ Orders:', error.message); else console.log(`✅ Orders: ${rows.length}`);
    } else console.log('ℹ️  orders.json empty');

    // Coupons
    const coupons = readJson('coupons.json');
    if (coupons.length > 0) {
        const rows = coupons.map(c => ({
            code: c.code, type: c.type, value: c.value,
            max_uses: c.maxUses ?? null, current_uses: c.currentUses ?? 0,
            is_active: c.isActive ?? true, expires_at: c.expiresAt ?? null,
            created_at: c.createdAt ?? new Date().toISOString(),
        }));
        const { error } = await supabase.from('coupons').upsert(rows, { onConflict: 'code', ignoreDuplicates: true });
        if (error) console.error('❌ Coupons:', error.message); else console.log(`✅ Coupons: ${rows.length}`);
    } else console.log('ℹ️  coupons.json empty');

    // Affiliates
    const affiliates = readJson('affiliates.json');
    const affiliateIdMap = new Map();
    if (affiliates.length > 0) {
        for (const a of affiliates) {
            const { data, error } = await supabase.from('affiliates')
                .upsert({ custom_link: a.customLink || null, status: a.status === 'approved' ? 'active' : a.status, commission_rate: 0.2, created_at: a.createdAt }, { onConflict: 'custom_link', ignoreDuplicates: false })
                .select('id').single();
            if (error) { console.error(`⚠️  Affiliate ${a.id}: ${error.message}`); continue; }
            affiliateIdMap.set(a.id, data.id);
        }
        console.log(`✅ Affiliates: ${affiliateIdMap.size}`);
    } else console.log('ℹ️  affiliates.json empty');

    // Affiliate Links
    const links = readJson('affiliate-links.json');
    const linkIdMap = new Map();
    if (links.length > 0) {
        for (const l of links) {
            const newAffId = affiliateIdMap.get(l.affiliateId);
            if (!newAffId) continue;
            const { data, error } = await supabase.from('affiliate_links')
                .insert({ affiliate_id: newAffId, custom_link: l.customLink || l.id, created_at: l.createdAt })
                .select('id').single();
            if (error) { console.error(`⚠️  Link ${l.id}: ${error.message}`); continue; }
            linkIdMap.set(l.id, data.id);
        }
        console.log(`✅ Affiliate Links: ${linkIdMap.size}`);
    } else console.log('ℹ️  affiliate-links.json empty');

    // Affiliate Visits
    const visits = readJson('affiliate-visits.json');
    if (visits.length > 0) {
        const rows = visits.map(v => {
            const newAffId = affiliateIdMap.get(v.affiliateId);
            if (!newAffId) return null;
            return { affiliate_id: newAffId, link_id: linkIdMap.get(v.linkId) || null, ip: v.ip || null, user_agent: v.userAgent || null, converted: v.converted || false, order_id: v.orderId || null, created_at: v.visitedAt };
        }).filter(Boolean);
        if (rows.length > 0) {
            const { error } = await supabase.from('affiliate_visits').insert(rows);
            if (error) console.error('❌ Visits:', error.message); else console.log(`✅ Affiliate Visits: ${rows.length}`);
        }
    } else console.log('ℹ️  affiliate-visits.json empty');

    // Commissions
    const commissions = readJson('affiliate-commissions.json');
    if (commissions.length > 0) {
        const rows = commissions.map(c => {
            const newAffId = affiliateIdMap.get(c.affiliateId);
            if (!newAffId) return null;
            return { affiliate_id: newAffId, order_id: c.orderId, amount: c.amount, commission_rate: c.commissionRate, commission_amount: c.commissionAmount, status: c.status, created_at: c.createdAt };
        }).filter(Boolean);
        if (rows.length > 0) {
            const { error } = await supabase.from('commissions').insert(rows);
            if (error) console.error('❌ Commissions:', error.message); else console.log(`✅ Commissions: ${rows.length}`);
        }
    } else console.log('ℹ️  affiliate-commissions.json empty');
}

// ============================================================
// PART 2: CMS Config Migration
// ============================================================
function discoverConfigs(dir, prefix = '') {
    const entries = readdirSync(dir, { withFileTypes: true });
    const results = [];
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...discoverConfigs(fullPath, prefix ? `${prefix}/${entry.name}` : entry.name));
        } else if (entry.name.endsWith('.json')) {
            const sectionName = prefix ? `${prefix}/${entry.name.replace(/\.json$/, '')}` : entry.name.replace(/\.json$/, '');
            results.push({ sectionName, filePath: fullPath });
        }
    }
    return results;
}

async function migrateConfigs() {
    console.log('\n📦 PART 2: CMS Config Migration\n' + '='.repeat(50));
    if (!existsSync(CONFIG_DIR)) { console.error('❌ config/ not found'); return; }
    const configs = discoverConfigs(CONFIG_DIR);
    console.log(`📁 Found ${configs.length} config files`);
    let ok = 0, fail = 0;
    for (const { sectionName, filePath } of configs) {
        try {
            const data = JSON.parse(readFileSync(filePath, 'utf-8'));
            const { error } = await supabase.from('cms_configs')
                .upsert({ section_name: sectionName, data, updated_at: new Date().toISOString() }, { onConflict: 'section_name' });
            if (error) { console.error(`❌ ${sectionName}: ${error.message}`); fail++; }
            else { console.log(`✅ ${sectionName}`); ok++; }
        } catch (err) { console.error(`❌ ${sectionName}: ${err.message}`); fail++; }
    }
    console.log(`\n📊 Configs: ${ok} OK, ${fail} failed`);
}

// ============================================================
// PART 3: WordPress Data Migration
// ============================================================
const userIdMap = new Map(); // wp_user_id → supabase_uuid
const quizIdMap = new Map(); // wp_quiz_id → supabase_uuid
const mockTestIdMap = new Map();

async function migrateUsers() {
    console.log('\n📦 PART 3a: Users Migration\n' + '='.repeat(50));
    let page = 1; let total = 0;
    while (true) {
        try {
            const users = await wpRestGet(`/wp/v2/users?per_page=100&page=${page}&context=edit`);
            if (!users || users.length === 0) break;
            for (const u of users) {
                const email = u.email;
                if (!email) continue;
                // Create auth user
                const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
                    email, password: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                    email_confirm: true,
                });
                if (authErr) {
                    // If user exists, try to get them
                    if (authErr.message?.includes('already')) {
                        const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
                        const existing = listData?.users?.find(eu => eu.email === email);
                        if (existing) { userIdMap.set(u.id, existing.id); total++; }
                        continue;
                    }
                    console.error(`⚠️  User ${email}: ${authErr.message}`);
                    continue;
                }
                const uid = authData.user.id;
                userIdMap.set(u.id, uid);
                // Create public.users
                const meta = u.meta || {};
                const roles = u.roles || ['subscriber'];
                await supabase.from('users').upsert({
                    id: uid, email, name: u.name || u.slug,
                    avatar_url: u.avatar_urls?.['96'] || null,
                    is_pro: meta.is_pro === 'yes' || meta.is_pro === true,
                    pro_expiration_date: meta.pro_expiration_date || null,
                    target_score: meta.target_score ? (typeof meta.target_score === 'string' ? JSON.parse(meta.target_score) : meta.target_score) : {},
                    gender: meta.gender || null, date_of_birth: meta.date_of_birth || null,
                    phone_number: meta.phone_number || null,
                    roles: JSON.stringify(roles),
                    devices: meta.devices ? (typeof meta.devices === 'string' ? JSON.parse(meta.devices) : meta.devices) : {},
                });
                total++;
            }
            console.log(`  Page ${page}: ${users.length} users processed`);
            page++;
        } catch (err) {
            if (err.message?.includes('rest_forbidden') || err.message?.includes('403')) {
                console.warn('⚠️  WP REST API forbidden — skipping user migration');
                break;
            }
            console.error(`  Error page ${page}: ${err.message}`);
            break;
        }
    }
    console.log(`✅ Users: ${total} migrated (${userIdMap.size} mapped)`);
}

async function migrateQuizzes() {
    console.log('\n📦 PART 3b: Quizzes Migration\n' + '='.repeat(50));
    let hasNext = true; let after = null; let total = 0;

    while (hasNext) {
        const query = `query GetQuizzes($after: String) {
      quizzes(first: 50, after: $after, where: { status: PUBLISH }) {
        pageInfo { hasNextPage endCursor }
        nodes {
          databaseId title slug excerpt status
          quizFields {
            skill type timeMinutes proUserOnly scoreType
            audioUrl pdfUrl source year quarter part questionForm
            passages { title content audioStart audioEnd
              questions { type title questionText instructions questionForm
                listOfQuestions { question correct options { optionText } }
                listOfOptions { optionText correct }
                matchingQuestion { layoutType matchingItems { itemText } answerOptions { optionText } summaryText }
                matrixQuestion { matrixCategories { categoryLetter categoryText } matrixItems { itemText correctCategoryLetter } }
                explanations { content }
              }
            }
          }
          featuredImage { node { sourceUrl } }
        }
      }
    }`;

        try {
            const data = await graphqlQuery(query, { after });
            const quizzes = data?.quizzes?.nodes || [];
            if (quizzes.length === 0) break;

            for (const q of quizzes) {
                const f = q.quizFields || {};
                const { data: quizData, error: quizErr } = await supabase.from('quizzes')
                    .upsert({
                        title: q.title, slug: q.slug, excerpt: q.excerpt || null,
                        type: f.type || 'practice', skill: f.skill || 'reading',
                        time_minutes: f.timeMinutes || 60, pro_user_only: f.proUserOnly || false,
                        score_type: f.scoreType || null, featured_image: q.featuredImage?.node?.sourceUrl || null,
                        audio_url: f.audioUrl || null, pdf_url: f.pdfUrl || null,
                        source: f.source || null, year: f.year || null, quarter: f.quarter || null,
                        part: f.part || null, question_form: f.questionForm || null,
                        status: q.status === 'publish' ? 'published' : 'draft',
                        published_at: new Date().toISOString(),
                    }, { onConflict: 'slug' })
                    .select('id').single();

                if (quizErr) { console.error(`⚠️  Quiz ${q.slug}: ${quizErr.message}`); continue; }
                quizIdMap.set(q.databaseId, quizData.id);

                // Passages + Questions
                const passages = f.passages || [];
                for (let pi = 0; pi < passages.length; pi++) {
                    const p = passages[pi];
                    const { data: passData, error: passErr } = await supabase.from('passages')
                        .insert({
                            quiz_id: quizData.id, title: p.title || null, content: p.content || null,
                            sort_order: pi, audio_start: p.audioStart || null, audio_end: p.audioEnd || null,
                        })
                        .select('id').single();

                    if (passErr) { console.error(`  ⚠️ Passage ${pi}: ${passErr.message}`); continue; }

                    const questions = p.questions || [];
                    for (let qi = 0; qi < questions.length; qi++) {
                        const qn = questions[qi];
                        await supabase.from('questions').insert({
                            passage_id: passData.id, type: qn.type || 'radio',
                            title: qn.title || null, question_text: qn.questionText || null,
                            instructions: qn.instructions || null, question_form: qn.questionForm || null,
                            list_of_questions: qn.listOfQuestions || null,
                            list_of_options: qn.listOfOptions || null,
                            matching_question: qn.matchingQuestion || null,
                            matrix_question: qn.matrixQuestion || null,
                            explanations: qn.explanations || null,
                            sort_order: qi,
                        });
                    }
                }
                total++;
            }

            hasNext = data?.quizzes?.pageInfo?.hasNextPage || false;
            after = data?.quizzes?.pageInfo?.endCursor || null;
            console.log(`  Batch: ${quizzes.length} quizzes (total: ${total})`);
        } catch (err) {
            console.error(`  Quiz fetch error: ${err.message}`);
            break;
        }
    }
    console.log(`✅ Quizzes: ${total} migrated (${quizIdMap.size} mapped)`);
}

async function migrateTestResults() {
    console.log('\n📦 PART 3c: Test Results Migration\n' + '='.repeat(50));
    let hasNext = true; let after = null; let total = 0;

    const query = `query GetResults($after: String) {
    testResults(first: 100, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        databaseId
        testResultFields { answers testPart timeLeft testTime testMode score quizId userId }
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
                const userId = userIdMap.get(f.userId);
                const quizId = quizIdMap.get(f.quizId);
                if (!userId || !quizId) continue;

                await supabase.from('test_results').insert({
                    user_id: userId, quiz_id: quizId,
                    answers: f.answers ? (typeof f.answers === 'string' ? JSON.parse(f.answers) : f.answers) : null,
                    test_part: f.testPart ? (typeof f.testPart === 'string' ? JSON.parse(f.testPart) : f.testPart) : null,
                    time_left: f.timeLeft || null, test_time: f.testTime || null,
                    test_mode: f.testMode || null, score: f.score || null,
                    status: r.status === 'publish' ? 'published' : 'draft',
                    submitted_at: r.date || null,
                });
                total++;
            }

            hasNext = data?.testResults?.pageInfo?.hasNextPage || false;
            after = data?.testResults?.pageInfo?.endCursor || null;
            console.log(`  Batch: ${results.length} results (total: ${total})`);
        } catch (err) {
            console.error(`  Test results error: ${err.message}`);
            break;
        }
    }
    console.log(`✅ Test Results: ${total} migrated`);
}

async function migrateMockTests() {
    console.log('\n📦 PART 3d: Mock Tests Migration\n' + '='.repeat(50));
    let hasNext = true; let after = null; let total = 0;

    const query = `query GetMockTests($after: String) {
    mockTests(first: 50, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        databaseId title slug
        mockTestFields { practiceTests { readingTest { ... on Quiz { databaseId } } listeningTest { ... on Quiz { databaseId } } } }
      }
    }
  }`;

    while (hasNext) {
        try {
            const data = await graphqlQuery(query, { after });
            const mocks = data?.mockTests?.nodes || [];
            if (mocks.length === 0) break;

            for (const m of mocks) {
                const pts = (m.mockTestFields?.practiceTests || []).map(pt => ({
                    reading_test_id: quizIdMap.get(pt.readingTest?.databaseId) || null,
                    listening_test_id: quizIdMap.get(pt.listeningTest?.databaseId) || null,
                }));

                const { data: mockData, error } = await supabase.from('mock_tests')
                    .upsert({ title: m.title, slug: m.slug, practice_tests: pts }, { onConflict: 'slug' })
                    .select('id').single();

                if (error) { console.error(`⚠️  Mock ${m.slug}: ${error.message}`); continue; }
                mockTestIdMap.set(m.databaseId, mockData.id);
                total++;
            }

            hasNext = data?.mockTests?.pageInfo?.hasNextPage || false;
            after = data?.mockTests?.pageInfo?.endCursor || null;
        } catch (err) { console.error(`  Mock tests error: ${err.message}`); break; }
    }
    console.log(`✅ Mock Tests: ${total} migrated`);
}

async function migratePosts() {
    console.log('\n📦 PART 3e: Posts Migration\n' + '='.repeat(50));
    let hasNext = true; let after = null; let total = 0;

    const query = `query GetPosts($after: String) {
    posts(first: 50, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { databaseId title slug content excerpt status date featuredImage { node { sourceUrl } } }
    }
  }`;

    while (hasNext) {
        try {
            const data = await graphqlQuery(query, { after });
            const posts = data?.posts?.nodes || [];
            if (posts.length === 0) break;

            const rows = posts.map(p => ({
                title: p.title, slug: p.slug, content: p.content || null, excerpt: p.excerpt || null,
                featured_image: p.featuredImage?.node?.sourceUrl || null,
                status: p.status === 'publish' ? 'published' : 'draft',
                published_at: p.date || null,
            }));

            const { error } = await supabase.from('posts').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true });
            if (error) console.error('⚠️  Posts batch error:', error.message);
            else total += rows.length;

            hasNext = data?.posts?.pageInfo?.hasNextPage || false;
            after = data?.posts?.pageInfo?.endCursor || null;
            console.log(`  Batch: ${posts.length} posts (total: ${total})`);
        } catch (err) { console.error(`  Posts error: ${err.message}`); break; }
    }
    console.log(`✅ Posts: ${total} migrated`);
}

async function migrateSampleEssays() {
    console.log('\n📦 PART 3f: Sample Essays Migration\n' + '='.repeat(50));
    let hasNext = true; let after = null; let total = 0;

    const query = `query GetEssays($after: String) {
    sampleEssays(first: 50, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        databaseId title slug content excerpt status date
        featuredImage { node { sourceUrl } }
        sampleEssayFields { skill part questionType quarter year source topic task passage }
      }
    }
  }`;

    while (hasNext) {
        try {
            const data = await graphqlQuery(query, { after });
            const essays = data?.sampleEssays?.nodes || [];
            if (essays.length === 0) break;

            const rows = essays.map(e => {
                const f = e.sampleEssayFields || {};
                return {
                    title: e.title, slug: e.slug, content: e.content || null, excerpt: e.excerpt || null,
                    skill: f.skill || null, part: f.part || null, question_type: f.questionType || null,
                    quarter: f.quarter || null, year: f.year || null, source: f.source || null,
                    topic: f.topic || null, task: f.task || null, passage: f.passage || null,
                    featured_image: e.featuredImage?.node?.sourceUrl || null,
                    status: e.status === 'publish' ? 'published' : 'draft',
                    published_at: e.date || null,
                };
            });

            const { error } = await supabase.from('sample_essays').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true });
            if (error) console.error('⚠️  Essays batch error:', error.message);
            else total += rows.length;

            hasNext = data?.sampleEssays?.pageInfo?.hasNextPage || false;
            after = data?.sampleEssays?.pageInfo?.endCursor || null;
            console.log(`  Batch: ${essays.length} essays (total: ${total})`);
        } catch (err) { console.error(`  Essays error: ${err.message}`); break; }
    }
    console.log(`✅ Sample Essays: ${total} migrated`);
}

// ============================================================
// MAIN
// ============================================================
console.log('╔══════════════════════════════════════════════════╗');
console.log('║     Vit IELTS — Full Data Migration      ║');
console.log('╚══════════════════════════════════════════════════╝');

const startTime = Date.now();
try {
    await migrateJsonData();
    await migrateConfigs();
    await migrateUsers();
    await migrateQuizzes();
    await migrateTestResults();
    await migrateMockTests();
    await migratePosts();
    await migrateSampleEssays();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║           ✅ ALL MIGRATIONS COMPLETE             ║');
    console.log(`║           ⏱️  Time: ${elapsed}s                   ║`);
    console.log('╚══════════════════════════════════════════════════╝');
} catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
}
