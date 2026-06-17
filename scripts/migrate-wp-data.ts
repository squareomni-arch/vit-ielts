/**
 * WordPress → Supabase Migration Script
 *
 * Migrates data from WordPress (via WPGraphQL) to Supabase:
 * 1. Users (WP REST API → auth.users + public.users)
 * 2. Quizzes + Passages + Questions (WPGraphQL → quizzes/passages/questions)
 * 3. Test Results (WPGraphQL → test_results)
 * 4. Mock Tests + Collections (WPGraphQL → mock_tests/mock_test_collections)
 * 5. Posts (WPGraphQL → posts)
 * 6. Sample Essays (WPGraphQL → sample_essays)
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/migrate-wp-data.ts
 *   or:  node -e "require('./scripts/migrate-wp-data')" (after compilation)
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   WP_URL (default: https://cms.vitielts.com)
 *   WP_ADMIN_USER, WP_ADMIN_PASSWORD
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const WP_URL = process.env.WP_URL || "https://cms.vitielts.com";
const WP_GRAPHQL_URL = `${WP_URL}/graphql`;
const WP_USER = process.env.WP_ADMIN_USER || "admin";
const WP_PASS = process.env.WP_ADMIN_PASSWORD || "3986483aA@";
const WP_AUTH = Buffer.from(`${WP_USER}:${WP_PASS}`).toString("base64");

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ID Mappings
const userIdMap = new Map<number, string>(); // wp_user_id → supabase_uuid
const quizIdMap = new Map<number, string>(); // wp_quiz_id → supabase_uuid
const mockTestIdMap = new Map<number, string>(); // wp_mock_test_id → supabase_uuid

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function graphqlQuery<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await fetch(WP_GRAPHQL_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${WP_AUTH}`,
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
    const json = await res.json();
    if (json.errors?.length) {
        console.error("GraphQL errors:", JSON.stringify(json.errors, null, 2));
        throw new Error(`GraphQL errors: ${json.errors[0].message}`);
    }
    return json.data as T;
}

async function wpRestGet<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${WP_URL}/wp-json/wp/v2/${endpoint}`, {
        headers: { Authorization: `Basic ${WP_AUTH}` },
    });
    if (!res.ok) throw new Error(`WP REST API failed: ${res.status} ${endpoint}`);
    return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// 1. Users Migration
// ---------------------------------------------------------------------------
async function migrateUsers() {
    console.log("\n📦 Migrating Users...");

    let page = 1;
    let total = 0;

    while (true) {
        const res = await fetch(
            `${WP_URL}/wp-json/wp/v2/users?per_page=100&page=${page}`,
            { headers: { Authorization: `Basic ${WP_AUTH}` } },
        );

        if (!res.ok) {
            if (res.status === 400) break; // no more pages
            throw new Error(`Users API failed: ${res.status}`);
        }

        const users = await res.json() as Array<{
            id: number;
            name: string;
            slug: string;
            description: string;
            avatar_urls?: Record<string, string>;
        }>;

        if (users.length === 0) break;

        for (const wpUser of users) {
            // We can't get email/password from REST API without edit context
            // Insert into public.users with placeholder data
            const { data, error } = await supabase
                .from("users")
                .upsert({
                    id: crypto.randomUUID(), // new UUID
                    email: `wp_user_${wpUser.id}@migration.pending`,
                    name: wpUser.name,
                    avatar_url: wpUser.avatar_urls?.["96"] || null,
                    roles: JSON.stringify(["subscriber"]),
                    created_at: new Date().toISOString(),
                }, { onConflict: "email" })
                .select("id")
                .single();

            if (error) {
                console.error(`  ⚠️ User ${wpUser.id} (${wpUser.name}): ${error.message}`);
                continue;
            }
            if (data) {
                userIdMap.set(wpUser.id, data.id);
                total++;
            }
        }

        page++;
    }

    console.log(`  ✅ Users: ${total} migrated, ${userIdMap.size} mapped`);
}

// ---------------------------------------------------------------------------
// 2. Quizzes Migration
// ---------------------------------------------------------------------------
async function migrateQuizzes() {
    console.log("\n📦 Migrating Quizzes + Passages + Questions...");

    const QUIZ_QUERY = `
    query GetQuizzes($after: String) {
      quizzes(first: 50, after: $after, where: { status: PUBLISH }) {
        pageInfo { hasNextPage endCursor }
        nodes {
          databaseId
          title
          slug
          excerpt
          date
          featuredImage { node { sourceUrl } }
          quizFields {
            type skill time scoreType proUserOnly testsTaken
            source year quarter part
            audio { node { mediaItemUrl } }
            pdf { node { mediaItemUrl } }
            passages {
              passage_content title audio_start audio_end
              questions {
                type title question question_form instructions
                list_of_questions { question correct options { option_text } }
                list_of_options { option_text correct }
                matchingQuestion {
                  layout_type
                  matching_items { questionPart correctAnswer }
                  answer_options { option_text }
                  summary_text
                }
                matrixQuestion {
                  matrix_categories { category_letter category_text }
                  matrix_items { item_text correct_category_letter }
                }
                explanations { content }
              }
            }
          }
        }
      }
    }
  `;

    let after: string | null = null;
    let total = 0;

    while (true) {
        let data: any;
        try {
            data = await graphqlQuery<any>(QUIZ_QUERY, { after });
        } catch (err) {
            console.error(`  ⚠️ Quiz query failed:`, err);
            break;
        }

        const { nodes, pageInfo } = data.quizzes;
        if (!nodes?.length) break;

        for (const quiz of nodes) {
            const fields = quiz.quizFields || {};

            // Insert quiz
            const questionForms = new Set<string>();
            fields.passages?.forEach((p: any) => {
                p.questions?.forEach((q: any) => {
                    if (q.question_form) questionForms.add(q.question_form);
                });
            });

            const { data: quizRow, error: quizErr } = await supabase
                .from("quizzes")
                .upsert({
                    title: quiz.title,
                    slug: quiz.slug,
                    excerpt: quiz.excerpt || null,
                    type: fields.type || "practice",
                    skill: fields.skill || "reading",
                    time_minutes: fields.time || 60,
                    pro_user_only: fields.proUserOnly || false,
                    score_type: fields.scoreType || null,
                    featured_image: quiz.featuredImage?.node?.sourceUrl || null,
                    audio_url: fields.audio?.node?.mediaItemUrl || null,
                    pdf_url: fields.pdf?.node?.mediaItemUrl || null,
                    tests_taken: fields.testsTaken || 0,
                    source: fields.source || null,
                    year: fields.year || null,
                    quarter: fields.quarter || null,
                    part: fields.part || null,
                    question_form: [...questionForms].join(",") || null,
                    status: "published",
                    published_at: quiz.date,
                    created_at: quiz.date,
                }, { onConflict: "slug" })
                .select("id")
                .single();

            if (quizErr) {
                console.error(`  ⚠️ Quiz "${quiz.title}": ${quizErr.message}`);
                continue;
            }

            quizIdMap.set(quiz.databaseId, quizRow!.id);

            // Insert passages + questions
            const passages = fields.passages || [];
            for (let pi = 0; pi < passages.length; pi++) {
                const passage = passages[pi];

                const { data: passageRow, error: passageErr } = await supabase
                    .from("passages")
                    .insert({
                        quiz_id: quizRow!.id,
                        title: passage.title || null,
                        content: passage.passage_content || null,
                        sort_order: pi,
                        audio_start: passage.audio_start || null,
                        audio_end: passage.audio_end || null,
                    })
                    .select("id")
                    .single();

                if (passageErr) {
                    console.error(`  ⚠️ Passage ${pi} of "${quiz.title}": ${passageErr.message}`);
                    continue;
                }

                // Insert questions
                const questions = passage.questions || [];
                for (let qi = 0; qi < questions.length; qi++) {
                    const q = questions[qi];

                    // Ensure JSONB fields are proper objects (not double-encoded strings)
                    // WPGraphQL may return pre-serialized strings that Supabase would double-encode
                    const ensureJsonb = (val: any) => {
                        if (val === null || val === undefined) return null;
                        if (typeof val === 'string') {
                            try { return JSON.parse(val); } catch { return val; }
                        }
                        return val;
                    };

                    // Detect correct question type based on actual data
                    const detectType = (q: any): string => {
                        const loq = ensureJsonb(q.list_of_questions);
                        const hasRadioQ = Array.isArray(loq) && loq.some((lq: any) => lq?.question);

                        const loo = ensureJsonb(q.list_of_options);
                        const hasOptions = Array.isArray(loo) && loo.length > 0 && loo.some((o: any) => o?.option_text || o?.option);

                        const mq = ensureJsonb(q.matchingQuestion);
                        const hasMatching = mq && (
                            (Array.isArray(mq.matching_items) && mq.matching_items.length > 0) ||
                            (Array.isArray(mq.matchingItems) && mq.matchingItems.some((mi: any) => mi.questionPart)) ||
                            (mq.summary_text?.trim() || mq.summaryText?.trim())
                        );

                        const mx = ensureJsonb(q.matrixQuestion);
                        const hasMatrix = mx && (
                            (Array.isArray(mx.matrix_items) && mx.matrix_items.length > 0) ||
                            (Array.isArray(mx.matrixItems) && mx.matrixItems.length > 0)
                        );

                        const questionText = q.question || '';
                        const hasGaps = /\{[^}]+\}/.test(questionText);

                        if (hasMatrix) return 'matrix';
                        if (hasMatching) return 'matching';
                        if (hasRadioQ) return 'radio';
                        if (hasGaps && hasOptions) return 'select';
                        if (hasGaps) return 'fillup';
                        if (hasOptions) return 'checkbox';
                        return q.type || 'radio';
                    };

                    const { error: qErr } = await supabase
                        .from("questions")
                        .insert({
                            passage_id: passageRow!.id,
                            type: detectType(q),
                            title: q.title || null,
                            question_text: q.question || null,
                            instructions: q.instructions || null,
                            question_form: q.question_form || null,
                            list_of_questions: ensureJsonb(q.list_of_questions),
                            list_of_options: ensureJsonb(q.list_of_options),
                            matching_question: ensureJsonb(q.matchingQuestion),
                            matrix_question: ensureJsonb(q.matrixQuestion),
                            explanations: ensureJsonb(q.explanations),
                            sort_order: qi,
                        });

                    if (qErr) {
                        console.error(`  ⚠️ Question ${qi} of passage ${pi}: ${qErr.message}`);
                    }
                }
            }

            total++;
        }

        if (!pageInfo.hasNextPage) break;
        after = pageInfo.endCursor;
    }

    console.log(`  ✅ Quizzes: ${total} migrated (with passages + questions)`);
}

// ---------------------------------------------------------------------------
// 3. Test Results Migration
// ---------------------------------------------------------------------------
async function migrateTestResults() {
    console.log("\n📦 Migrating Test Results...");

    const RESULT_QUERY = `
    query GetResults($after: String) {
      testResults(first: 50, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          databaseId
          date
          status
          author { node { databaseId } }
          testResultFields {
            quiz { databaseId }
            answers
            test_part
            time_left
            test_time
            test_mode
            score
            date_submitted
          }
        }
      }
    }
  `;

    let after: string | null = null;
    let total = 0;

    while (true) {
        let data: any;
        try {
            data = await graphqlQuery<any>(RESULT_QUERY, { after });
        } catch (err) {
            console.error(`  ⚠️ Test results query failed:`, err);
            break;
        }

        const { nodes, pageInfo } = data.testResults;
        if (!nodes?.length) break;

        for (const result of nodes) {
            const fields = result.testResultFields || {};
            const userId = userIdMap.get(result.author?.node?.databaseId);
            const quizId = quizIdMap.get(fields.quiz?.databaseId);

            if (!userId || !quizId) {
                console.warn(`  ⚠️ Result ${result.databaseId}: missing user/quiz mapping`);
                continue;
            }

            // Parse answers (could be string or JSON)
            let answers = fields.answers;
            if (typeof answers === "string") {
                try { answers = JSON.parse(answers); } catch { /* keep as string */ }
            }

            let testPart = fields.test_part;
            if (typeof testPart === "string") {
                try { testPart = JSON.parse(testPart); } catch { /* keep as string */ }
            }

            const { error } = await supabase.from("test_results").insert({
                user_id: userId,
                quiz_id: quizId,
                answers,
                test_part: testPart,
                time_left: fields.time_left || null,
                test_time: fields.test_time || null,
                test_mode: fields.test_mode || null,
                score: fields.score || null,
                status: result.status === "publish" ? "published" : "draft",
                submitted_at: fields.date_submitted
                    ? new Date(Number(fields.date_submitted) * 1000).toISOString()
                    : null,
                created_at: result.date,
            });

            if (error) {
                console.error(`  ⚠️ Test result ${result.databaseId}: ${error.message}`);
                continue;
            }
            total++;
        }

        if (!pageInfo.hasNextPage) break;
        after = pageInfo.endCursor;
    }

    console.log(`  ✅ Test Results: ${total} migrated`);
}

// ---------------------------------------------------------------------------
// 4. Mock Tests + Collections
// ---------------------------------------------------------------------------
async function migrateMockTests() {
    console.log("\n📦 Migrating Mock Tests + Collections...");

    // 4a. Mock Tests
    const MOCK_QUERY = `
    query GetMockTests($after: String) {
      mockTests(first: 50, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          databaseId title slug
          mockTestFields {
            practice_test {
              reading_test { databaseId }
              listening_test { databaseId }
            }
          }
        }
      }
    }
  `;

    let after: string | null = null;
    let mockTotal = 0;

    while (true) {
        let data: any;
        try {
            data = await graphqlQuery<any>(MOCK_QUERY, { after });
        } catch (err) {
            console.error(`  ⚠️ Mock tests query failed:`, err);
            break;
        }

        const { nodes, pageInfo } = data.mockTests;
        if (!nodes?.length) break;

        for (const mt of nodes) {
            const practiceTests = (mt.mockTestFields?.practice_test || []).map((pt: any) => ({
                reading_test_id: quizIdMap.get(pt.reading_test?.databaseId) || null,
                listening_test_id: quizIdMap.get(pt.listening_test?.databaseId) || null,
            }));

            const { data: row, error } = await supabase
                .from("mock_tests")
                .upsert({
                    title: mt.title,
                    slug: mt.slug,
                    practice_tests: practiceTests,
                    created_at: new Date().toISOString(),
                }, { onConflict: "slug" })
                .select("id")
                .single();

            if (error) {
                console.error(`  ⚠️ Mock test "${mt.title}": ${error.message}`);
                continue;
            }
            mockTestIdMap.set(mt.databaseId, row!.id);
            mockTotal++;
        }

        if (!pageInfo.hasNextPage) break;
        after = pageInfo.endCursor;
    }

    console.log(`  ✅ Mock Tests: ${mockTotal} migrated`);

    // 4b. Collections
    const COLL_QUERY = `
    query GetCollections($after: String) {
      mockTestCollections(first: 50, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          databaseId title slug
          featuredImage { node { sourceUrl } }
          mockTestCollectionFields {
            mock_test { databaseId }
          }
        }
      }
    }
  `;

    after = null;
    let collTotal = 0;

    while (true) {
        let data: any;
        try {
            data = await graphqlQuery<any>(COLL_QUERY, { after });
        } catch (err) {
            console.error(`  ⚠️ Collections query failed:`, err);
            break;
        }

        const { nodes, pageInfo } = data.mockTestCollections;
        if (!nodes?.length) break;

        for (const coll of nodes) {
            const mockTestIds = (coll.mockTestCollectionFields?.mock_test || [])
                .map((mt: any) => mockTestIdMap.get(mt.databaseId))
                .filter(Boolean);

            const { error } = await supabase
                .from("mock_test_collections")
                .upsert({
                    title: coll.title,
                    slug: coll.slug,
                    mock_test_ids: mockTestIds,
                    featured_image: coll.featuredImage?.node?.sourceUrl || null,
                    created_at: new Date().toISOString(),
                }, { onConflict: "slug" });

            if (error) {
                console.error(`  ⚠️ Collection "${coll.title}": ${error.message}`);
                continue;
            }
            collTotal++;
        }

        if (!pageInfo.hasNextPage) break;
        after = pageInfo.endCursor;
    }

    console.log(`  ✅ Collections: ${collTotal} migrated`);
}

// ---------------------------------------------------------------------------
// 5. Posts Migration
// ---------------------------------------------------------------------------
async function migratePosts() {
    console.log("\n📦 Migrating Posts...");

    const POST_QUERY = `
    query GetPosts($after: String) {
      posts(first: 50, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          databaseId title slug content excerpt date status
          featuredImage { node { sourceUrl } }
          categories { nodes { name } }
          seo { title metaDesc opengraphImage { sourceUrl } }
        }
      }
    }
  `;

    let after: string | null = null;
    let total = 0;

    while (true) {
        let data: any;
        try {
            data = await graphqlQuery<any>(POST_QUERY, { after });
        } catch (err) {
            console.error(`  ⚠️ Posts query failed:`, err);
            break;
        }

        const { nodes, pageInfo } = data.posts;
        if (!nodes?.length) break;

        for (const post of nodes) {
            const categories = (post.categories?.nodes || []).map((c: any) => c.name);
            const seo = post.seo ? {
                title: post.seo.title || null,
                metaDesc: post.seo.metaDesc || null,
                ogImage: post.seo.opengraphImage?.sourceUrl || null,
            } : {};

            const { error } = await supabase
                .from("posts")
                .upsert({
                    title: post.title,
                    slug: post.slug,
                    content: post.content || null,
                    excerpt: post.excerpt || null,
                    featured_image: post.featuredImage?.node?.sourceUrl || null,
                    status: post.status === "publish" ? "published" : "draft",
                    categories,
                    seo,
                    published_at: post.date,
                    created_at: post.date,
                }, { onConflict: "slug" });

            if (error) {
                console.error(`  ⚠️ Post "${post.title}": ${error.message}`);
                continue;
            }
            total++;
        }

        if (!pageInfo.hasNextPage) break;
        after = pageInfo.endCursor;
    }

    console.log(`  ✅ Posts: ${total} migrated`);
}

// ---------------------------------------------------------------------------
// 6. Sample Essays Migration
// ---------------------------------------------------------------------------
async function migrateSampleEssays() {
    console.log("\n📦 Migrating Sample Essays...");

    const ESSAY_QUERY = `
    query GetEssays($after: String) {
      sampleEssays(first: 50, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          databaseId title slug content excerpt date status
          featuredImage { node { sourceUrl } }
          sampleEssayFields {
            skill part question_type quarter year source topic task passage
            proUserOnly
          }
          seo { title metaDesc }
        }
      }
    }
  `;

    let after: string | null = null;
    let total = 0;

    while (true) {
        let data: any;
        try {
            data = await graphqlQuery<any>(ESSAY_QUERY, { after });
        } catch (err) {
            console.error(`  ⚠️ Sample essays query failed:`, err);
            break;
        }

        const { nodes, pageInfo } = data.sampleEssays;
        if (!nodes?.length) break;

        for (const essay of nodes) {
            const fields = essay.sampleEssayFields || {};
            const seo = essay.seo ? {
                title: essay.seo.title || null,
                metaDesc: essay.seo.metaDesc || null,
            } : {};

            const { error } = await supabase
                .from("sample_essays")
                .upsert({
                    title: essay.title,
                    slug: essay.slug,
                    content: essay.content || null,
                    excerpt: essay.excerpt || null,
                    skill: fields.skill || null,
                    part: fields.part || null,
                    question_type: fields.question_type || null,
                    quarter: fields.quarter || null,
                    year: fields.year || null,
                    source: fields.source || null,
                    topic: fields.topic || null,
                    task: fields.task || null,
                    passage: fields.passage || null,
                    featured_image: essay.featuredImage?.node?.sourceUrl || null,
                    status: essay.status === "publish" ? "published" : "draft",
                    pro_user_only: fields.proUserOnly || false,
                    seo,
                    published_at: essay.date,
                    created_at: essay.date,
                }, { onConflict: "slug" });

            if (error) {
                console.error(`  ⚠️ Essay "${essay.title}": ${error.message}`);
                continue;
            }
            total++;
        }

        if (!pageInfo.hasNextPage) break;
        after = pageInfo.endCursor;
    }

    console.log(`  ✅ Sample Essays: ${total} migrated`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export async function migrateWpData() {
    const startTime = Date.now();

    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║     WordPress → Supabase Data Migration         ║");
    console.log("╚══════════════════════════════════════════════════╝");
    console.log(`  WP URL: ${WP_URL}`);
    console.log(`  WP User: ${WP_USER}`);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("\n❌ Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
        process.exit(1);
    }

    try {
        await migrateUsers();
        await migrateQuizzes();
        await migrateTestResults();
        await migrateMockTests();
        await migratePosts();
        await migrateSampleEssays();

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log("\n╔══════════════════════════════════════════════════╗");
        console.log("║         ✅ WP DATA MIGRATION COMPLETE            ║");
        console.log(`║         ⏱️  Time: ${elapsed}s${" ".repeat(Math.max(0, 28 - elapsed.length))}║`);
        console.log("╚══════════════════════════════════════════════════╝");
        console.log("\n📊 ID Mappings:");
        console.log(`   Users: ${userIdMap.size}`);
        console.log(`   Quizzes: ${quizIdMap.size}`);
        console.log(`   Mock Tests: ${mockTestIdMap.size}`);
    } catch (err) {
        console.error("\n❌ Migration failed:", err);
        process.exit(1);
    }
}

if (require.main === module) {
    migrateWpData();
}
