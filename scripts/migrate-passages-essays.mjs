/**
 * Passages, Questions & Sample Essays Migration — WP GraphQL → Supabase
 * 
 * Run: node scripts/migrate-passages-essays.mjs
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
// PART 1: Passages & Questions
// ============================================================
async function migratePassagesAndQuestions() {
    console.log('\n📦 PART 1: Passages & Questions');
    console.log('='.repeat(50));

    // Load quiz mapping (wp_databaseId → supabase_uuid)
    if (!existsSync(QUIZ_MAPPING_FILE)) {
        console.error('❌ Quiz mapping not found. Run migrate-test-results.mjs first.');
        return;
    }
    const quizMapping = JSON.parse(readFileSync(QUIZ_MAPPING_FILE, 'utf-8'));
    console.log(`📂 Quiz mapping: ${Object.keys(quizMapping).length} entries`);

    let hasNext = true, after = null;
    let passageCount = 0, questionCount = 0, errors = 0, quizzesProcessed = 0;

    const query = `query GetQuizzes($after: String) {
        quizzes(first: 20, after: $after, where: { status: PUBLISH }) {
            pageInfo { hasNextPage endCursor }
            nodes {
                databaseId
                slug
                quizFields {
                    passages {
                        title
                        passage_content
                        audio_start
                        audio_end
                        questions {
                            title
                            question
                            question_form
                            option_type
                            optionChoose
                            instructions
                            type
                            list_of_options {
                                option
                                correct
                            }
                            list_of_questions {
                                question
                                correct
                                options {
                                    content
                                }
                            }
                            matchingQuestion {
                                layoutType
                                matchingItems {
                                    correctAnswer
                                    questionPart
                                    sectionContent
                                }
                                answerOptions {
                                    optionText
                                }
                                summaryText
                            }
                            matrixQuestion {
                                layoutType
                                legendTitle
                                matrixCategories {
                                    categoryLetter
                                    categoryText
                                }
                                matrixItems {
                                    itemText
                                    correctCategoryLetter
                                }
                            }
                            explanations {
                                content
                            }
                        }
                    }
                }
            }
        }
    }`;

    while (hasNext) {
        try {
            const data = await graphqlQuery(query, { after });
            const quizzes = data?.quizzes?.nodes || [];
            if (quizzes.length === 0) break;

            for (const quiz of quizzes) {
                const supabaseQuizId = quizMapping[String(quiz.databaseId)];
                if (!supabaseQuizId) continue;

                const passages = quiz.quizFields?.passages || [];
                if (passages.length === 0) continue;

                for (let pi = 0; pi < passages.length; pi++) {
                    const p = passages[pi];

                    // Insert passage
                    const { data: passageRow, error: pErr } = await supabase
                        .from('passages')
                        .insert({
                            quiz_id: supabaseQuizId,
                            title: p.title || `Passage ${pi + 1}`,
                            content: p.passage_content || null,
                            sort_order: pi,
                            audio_start: p.audio_start ? parseInt(p.audio_start) : null,
                            audio_end: p.audio_end ? parseInt(p.audio_end) : null,
                        })
                        .select('id')
                        .single();

                    if (pErr) {
                        errors++;
                        if (errors <= 5) console.error(`  ⚠️ Passage insert: ${pErr.message}`);
                        continue;
                    }
                    passageCount++;

                    // Insert questions for this passage
                    const questions = p.questions || [];
                    for (let qi = 0; qi < questions.length; qi++) {
                        const q = questions[qi];
                        const qType = mapQuestionType(q.option_type, q.type, q.question_form);

                        const { error: qErr } = await supabase.from('questions').insert({
                            passage_id: passageRow.id,
                            type: qType,
                            title: q.title || null,
                            question_text: q.question || null,
                            instructions: q.instructions || null,
                            question_form: q.question_form ? JSON.stringify(q.question_form) : null,
                            list_of_questions: q.list_of_questions ? JSON.stringify(q.list_of_questions) : null,
                            list_of_options: q.list_of_options ? JSON.stringify(q.list_of_options) : null,
                            matching_question: q.matchingQuestion ? JSON.stringify(q.matchingQuestion) : null,
                            matrix_question: q.matrixQuestion ? JSON.stringify(q.matrixQuestion) : null,
                            explanations: q.explanations ? JSON.stringify(q.explanations) : null,
                            sort_order: qi,
                        });

                        if (qErr) {
                            errors++;
                            if (errors <= 10) console.error(`  ⚠️ Question insert: ${qErr.message}`);
                        } else {
                            questionCount++;
                        }
                    }
                }
                quizzesProcessed++;
            }

            hasNext = data?.quizzes?.pageInfo?.hasNextPage || false;
            after = data?.quizzes?.pageInfo?.endCursor || null;
            console.log(`  📊 Quizzes: ${quizzesProcessed}, Passages: ${passageCount}, Questions: ${questionCount}, Errors: ${errors}`);
        } catch (err) {
            console.error(`  ❌ Batch error: ${err.message}`);
            if (!after) break;
        }
    }

    console.log(`\n✅ Passages: ${passageCount}, Questions: ${questionCount}, Errors: ${errors}`);
}

function mapQuestionType(optionType, typeArr, questionForm) {
    // Map WP ACF option_type to Supabase question type
    const t = optionType?.toLowerCase() || '';
    if (t.includes('matching')) return 'matching';
    if (t.includes('matrix')) return 'matrix';
    if (t.includes('checkbox')) return 'checkbox';
    if (t.includes('select') || t.includes('dropdown')) return 'select';
    if (t.includes('fill') || t.includes('text') || t.includes('input')) return 'fillup';
    if (t.includes('radio')) return 'radio';

    // Fallback: check question_form or type arrays
    const form = Array.isArray(questionForm) ? questionForm.join(',').toLowerCase() : '';
    if (form.includes('matching')) return 'matching';
    if (form.includes('matrix')) return 'matrix';
    if (form.includes('fill')) return 'fillup';

    return 'radio'; // default
}

// ============================================================
// PART 2: Sample Essays
// ============================================================
async function migrateSampleEssays() {
    console.log('\n📦 PART 2: Sample Essays');
    console.log('='.repeat(50));

    let hasNext = true, after = null;
    let total = 0, errors = 0;

    const query = `query GetEssays($after: String) {
        sampleEssays(first: 50, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
                databaseId slug title content date status
                sampleEssayFields { quarter }
                writingSampleEssayFields { task topic }
                speakingSampleEssayFields { part questionType }
                sampleEssayTypes { nodes { name slug } }
                sampleSources { nodes { name slug } }
            }
        }
    }`;

    while (hasNext) {
        try {
            const data = await graphqlQuery(query, { after });
            const essays = data?.sampleEssays?.nodes || [];
            if (essays.length === 0) break;

            for (const e of essays) {
                // Determine skill from sampleEssayTypes
                const types = e.sampleEssayTypes?.nodes || [];
                const typeNames = types.map(t => t.slug);
                let skill = null;
                if (typeNames.some(n => n.includes('writing'))) skill = 'writing';
                else if (typeNames.some(n => n.includes('speaking'))) skill = 'speaking';
                else if (typeNames.some(n => n.includes('reading'))) skill = 'reading';
                else if (typeNames.some(n => n.includes('listening'))) skill = 'listening';

                const sources = e.sampleSources?.nodes || [];
                const source = sources.map(s => s.name).join(', ') || null;

                const wf = e.writingSampleEssayFields || {};
                const sf = e.speakingSampleEssayFields || {};
                const ef = e.sampleEssayFields || {};

                const { error: insertErr } = await supabase.from('sample_essays').upsert({
                    title: e.title || 'Untitled',
                    slug: e.slug,
                    content: e.content || null,
                    skill,
                    part: sf.part ? (Array.isArray(sf.part) ? sf.part[0] : sf.part) : null,
                    question_type: sf.questionType ? (Array.isArray(sf.questionType) ? sf.questionType[0] : sf.questionType) : null,
                    quarter: ef.quarter ? (Array.isArray(ef.quarter) ? ef.quarter[0] : ef.quarter) : null,
                    topic: wf.topic ? (Array.isArray(wf.topic) ? wf.topic[0] : wf.topic) : null,
                    task: wf.task ? (Array.isArray(wf.task) ? wf.task[0] : wf.task) : null,
                    source,
                    status: e.status === 'publish' ? 'published' : 'draft',
                    published_at: e.date || null,
                }, { onConflict: 'slug' });

                if (insertErr) {
                    errors++;
                    if (errors <= 5) console.error(`  ⚠️ Essay insert: ${insertErr.message}`);
                } else {
                    total++;
                }
            }

            hasNext = data?.sampleEssays?.pageInfo?.hasNextPage || false;
            after = data?.sampleEssays?.pageInfo?.endCursor || null;
            console.log(`  📊 Essays: ${total}, Errors: ${errors}`);
        } catch (err) {
            console.error(`  ❌ Batch error: ${err.message}`);
            if (!after) break;
        }
    }

    console.log(`\n✅ Sample Essays: ${total}, Errors: ${errors}`);
}

// ============================================================
// Main
// ============================================================
async function main() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  Passages, Questions & Sample Essays Migration  ║');
    console.log('╚══════════════════════════════════════════════════╝');

    await migratePassagesAndQuestions();
    await migrateSampleEssays();

    console.log('\n🎉 All done!');
}

main().catch(err => {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
});
