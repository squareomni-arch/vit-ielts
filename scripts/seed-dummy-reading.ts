/**
 * Seed: Dummy IELTS Reading Quiz — All 6 Question Types
 *
 * Inserts a complete reading quiz with 3 passages covering:
 *   radio, select, fillup, checkbox, matching (standard + summary + heading), matrix
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/seed-dummy-reading.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const QUIZ_SLUG = "ielts-reading-full-demo";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Passage Content (realistic IELTS reading passages)
// ---------------------------------------------------------------------------

const PASSAGE_1_CONTENT = `
<h3>The History of Coffee</h3>
<p>The story of coffee begins in Ethiopia, where, according to legend, a goat herder named Kaldi noticed that his goats became unusually energetic after eating berries from a certain tree. Curious, he tried the berries himself and experienced a similar burst of energy. News of these energising berries spread to the local monastery, where monks began to make a drink from them to stay alert during long evening prayers.</p>
<p>Coffee cultivation and trade began on the Arabian Peninsula by the 15th century. By the 16th century, it had spread to Persia, Egypt, Syria, and Turkey. Coffee was not only enjoyed in homes but also in many public coffee houses — called <em>qahveh khaneh</em> — which became important centres for social activity and the exchange of information.</p>
<p>European travellers to the Near East brought back stories of an unusual dark beverage. By the 17th century, coffee had made its way to Europe and was becoming popular across the continent. Some people reacted with suspicion, calling it the "bitter invention of Satan." The local clergy in Venice even condemned coffee when it arrived there in 1615. The controversy was so great that Pope Clement VIII was asked to intervene. He found the drink so satisfying that he gave it papal approval.</p>
<p>Today, coffee is one of the world's most popular beverages, with over 2.25 billion cups consumed every day. Brazil remains the largest producer, followed by Vietnam and Colombia. The industry employs millions of people worldwide, from small-scale farmers to large multinational corporations.</p>
`;

const PASSAGE_2_CONTENT = `
<h3>Ocean Conservation: Challenges and Solutions</h3>
<p>The world's oceans cover more than 70 percent of the Earth's surface and play a critical role in regulating the planet's climate. They absorb approximately 30 percent of the carbon dioxide produced by human activities, thereby buffering the impacts of global warming. However, this absorption comes at a cost: ocean acidification, which threatens marine ecosystems and the species that depend on them.</p>
<p>Overfishing is another major threat to ocean health. According to the Food and Agriculture Organization (FAO), approximately 34 percent of fish stocks worldwide are now fished at biologically unsustainable levels. This has led to a decline in biodiversity and has threatened the livelihoods of millions of people who rely on fishing for food and income. Implementing sustainable fishing practices, such as catch limits and marine protected areas, has shown promise in helping fish populations recover.</p>
<p>Plastic pollution has become one of the most pressing environmental issues of our time. An estimated 8 million tonnes of plastic waste enter the oceans each year, harming marine life through ingestion and entanglement. Sea turtles, for example, often mistake plastic bags for jellyfish, their primary food source. Various initiatives, including beach clean-ups, bans on single-use plastics, and the development of biodegradable alternatives, are being implemented to address this growing crisis.</p>
<p>Marine protected areas (MPAs) have emerged as a key strategy for ocean conservation. These designated regions restrict human activities such as fishing, mining, and drilling, allowing ecosystems to recover and thrive. Research has shown that well-managed MPAs can increase fish biomass by up to 670 percent, benefiting both the environment and local communities that depend on healthy ocean resources.</p>
`;

const PASSAGE_3_CONTENT = `
<h3>Artificial Intelligence in Education</h3>
<p>{Introduction} Artificial intelligence (AI) is transforming the educational landscape in unprecedented ways. From personalised learning platforms to automated grading systems, AI technologies are being integrated into classrooms worldwide. This article examines the current applications, benefits, and challenges of AI in education.</p>
<p>{Personalised Learning} One of the most significant applications of AI in education is the development of personalised learning systems. These platforms use algorithms to analyse student performance data and adjust the difficulty and pace of content accordingly. For example, if a student consistently struggles with algebra problems, the system will provide additional practice materials and simpler explanations before progressing to more complex topics. Research has shown that personalised learning can improve student outcomes by up to 30 percent compared to traditional one-size-fits-all approaches.</p>
<p>{Automated Assessment} AI-powered assessment tools are revolutionising the way educators evaluate student work. Natural language processing (NLP) algorithms can now grade essays with a level of accuracy comparable to human markers. These tools can provide instant feedback, allowing students to learn from their mistakes immediately rather than waiting days or weeks for their work to be returned. However, critics argue that automated systems may not fully capture the nuances of creative or critical thinking.</p>
<p>{Ethical Considerations} Despite its potential benefits, the integration of AI in education raises important ethical questions. Data privacy is a primary concern, as AI systems collect and analyse vast amounts of student information. There is also the risk of algorithmic bias, where AI systems may inadvertently reinforce existing inequalities. Additionally, the increasing reliance on technology raises questions about the role of human teachers in the classroom and whether AI might eventually replace them.</p>
`;

// ---------------------------------------------------------------------------
// Question Data
// ---------------------------------------------------------------------------

// Passage 1: radio (3 MCQs) + fillup (3 blanks)
const PASSAGE_1_QUESTIONS = [
    // RADIO — 3 sub-questions
    {
        type: "radio",
        title: "Questions 1–3",
        question_text: "Choose the correct letter, A, B, C, or D.",
        instructions: "Choose the correct answer for each question.",
        question_form: "multiple-choice",
        sort_order: 0,
        list_of_questions: [
            {
                question: "According to legend, who first discovered the effects of coffee berries?",
                correct: "1",
                options: [
                    { option_text: "A monk from a local monastery" },
                    { option_text: "A goat herder named Kaldi" },
                    { option_text: "An Arabian merchant" },
                    { option_text: "Pope Clement VIII" },
                ],
            },
            {
                question: "What were 'qahveh khaneh'?",
                correct: "2",
                options: [
                    { option_text: "Private homes where coffee was served" },
                    { option_text: "Monasteries that cultivated coffee" },
                    { option_text: "Public coffee houses" },
                    { option_text: "Markets for trading coffee beans" },
                ],
            },
            {
                question: "How did Pope Clement VIII respond to coffee?",
                correct: "0",
                options: [
                    { option_text: "He approved it after tasting it" },
                    { option_text: "He banned it across Europe" },
                    { option_text: "He ignored the controversy" },
                    { option_text: "He taxed its importation" },
                ],
            },
        ],
    },
    // FILLUP — 3 blanks (question_text must contain {answer} patterns for the UI to render input fields)
    {
        type: "fillup",
        title: "Questions 4–6",
        question_text: "Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.\n\n<p>4. The story of coffee begins in {Ethiopia}, according to legend.</p>\n<p>5. Coffee cultivation and trade first began on the {Arabian Peninsula} by the 15th century.</p>\n<p>6. Today, {Brazil} remains the largest producer of coffee in the world.</p>",
        instructions: "Write no more than two words from the passage.",
        question_form: "fill-in-the-blank",
        sort_order: 1,
        explanations: [
            { content: "Ethiopia" },
            { content: "Arabian Peninsula / arabian peninsula" },
            { content: "Brazil" },
        ],
    },
];

// Passage 2: select (2 dropdowns) + checkbox (1 block) + matching standard (4 items) + matching summary (3 gaps)
const PASSAGE_2_QUESTIONS = [
    // SELECT — 2 sub-questions
    {
        type: "select",
        title: "Questions 7–8",
        question_text: "Choose the correct answer from the dropdown.",
        instructions: "Select the best answer.",
        question_form: "dropdown",
        sort_order: 0,
        list_of_questions: [
            {
                question: "What percentage of fish stocks are fished at unsustainable levels?",
                correct: "1",
                options: [
                    { option_text: "25 percent" },
                    { option_text: "34 percent" },
                    { option_text: "50 percent" },
                ],
            },
            {
                question: "How much plastic waste enters the oceans each year?",
                correct: "2",
                options: [
                    { option_text: "4 million tonnes" },
                    { option_text: "6 million tonnes" },
                    { option_text: "8 million tonnes" },
                ],
            },
        ],
    },
    // CHECKBOX — pick 3 of 6
    {
        type: "checkbox",
        title: "Question 9",
        question_text: "Which THREE of the following are mentioned as threats to ocean health?",
        instructions: "Choose THREE letters, A–F.",
        question_form: "multiple-select",
        sort_order: 1,
        list_of_options: [
            { option_text: "A. Rising sea levels", correct: false },
            { option_text: "B. Overfishing", correct: true },
            { option_text: "C. Coral bleaching", correct: false },
            { option_text: "D. Ocean acidification", correct: true },
            { option_text: "E. Volcanic activity", correct: false },
            { option_text: "F. Plastic pollution", correct: true },
        ],
    },
    // MATCHING — Standard (4 items)
    {
        type: "matching",
        title: "Questions 10–13",
        question_text: "Match each statement with the correct conservation measure.",
        instructions: "Choose the correct letter, A–E, for each statement.",
        question_form: "matching",
        sort_order: 2,
        matching_question: {
            layout_type: "standard",
            matching_items: [
                { questionPart: "Restricts fishing and mining in designated ocean regions", correctAnswer: "Marine protected areas" },
                { questionPart: "Sets limits on the amount of fish that can be caught", correctAnswer: "Catch limits" },
                { questionPart: "Prevents the sale of disposable plastic items", correctAnswer: "Single-use plastic bans" },
                { questionPart: "Removes waste from coastal environments", correctAnswer: "Beach clean-ups" },
            ],
            answer_options: [
                { option_text: "Marine protected areas" },
                { option_text: "Catch limits" },
                { option_text: "Single-use plastic bans" },
                { option_text: "Beach clean-ups" },
                { option_text: "Biodegradable alternatives" },
            ],
        },
    },
    // MATCHING — Summary (3 gaps)
    {
        type: "matching",
        title: "Questions 14–16",
        question_text: "Complete the summary below using words from the box.",
        instructions: "Choose the correct letter, A–F.",
        question_form: "summary-completion",
        sort_order: 3,
        matching_question: {
            layout_type: "summary",
            matching_items: [],
            answer_options: [
                { option_text: "carbon dioxide" },
                { option_text: "oxygen" },
                { option_text: "biodiversity" },
                { option_text: "acidification" },
                { option_text: "biomass" },
                { option_text: "temperature" },
            ],
            summary_text: "The oceans absorb about 30 percent of {carbon dioxide} released by humans. However, this process leads to ocean {acidification}, which damages marine life. Well-managed protected areas can significantly increase fish {biomass}.",
        },
    },
];

// Passage 3: matching heading (2 headings) + matrix (3 categories × 4 items)
const PASSAGE_3_QUESTIONS = [
    // MATCHING — Heading layout (4 headings in passage content)
    {
        type: "matching",
        title: "Questions 17–20",
        question_text: "Match the correct heading to each section of the passage.",
        instructions: "Choose the correct heading, i–vi, for each section.",
        question_form: "heading-match",
        sort_order: 0,
        matching_question: {
            layout_type: "heading",
            matching_items: [],
            answer_options: [
                { option_text: "Introduction" },
                { option_text: "Personalised Learning" },
                { option_text: "Automated Assessment" },
                { option_text: "Ethical Considerations" },
                { option_text: "Future Predictions" },
                { option_text: "Cost Analysis" },
            ],
        },
    },
    // MATRIX — 3 categories, 5 items
    {
        type: "matrix",
        title: "Questions 21–25",
        question_text: "Classify the following statements as relating to:",
        instructions: "Write the correct letter, A, B, or C.",
        question_form: "classification",
        sort_order: 1,
        matrix_question: {
            matrix_categories: [
                { category_letter: "A", category_text: "Personalised Learning" },
                { category_letter: "B", category_text: "Automated Assessment" },
                { category_letter: "C", category_text: "Ethical Considerations" },
            ],
            matrix_items: [
                { item_text: "Adjusts content difficulty based on student performance", correct_category_letter: "A" },
                { item_text: "Uses NLP to grade written assignments", correct_category_letter: "B" },
                { item_text: "Raises concerns about data privacy", correct_category_letter: "C" },
                { item_text: "Can improve outcomes by up to 30 percent", correct_category_letter: "A" },
                { item_text: "Provides instant feedback on student work", correct_category_letter: "B" },
            ],
        },
    },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seedDummyReading() {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║   Seed: Dummy IELTS Reading Quiz (All Types)    ║");
    console.log("╚══════════════════════════════════════════════════╝");
    console.log(`  Supabase URL: ${SUPABASE_URL}`);
    console.log();

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        process.exit(1);
    }

    // -----------------------------------------------------------------------
    // Step 0: Delete existing quiz with same slug (idempotent)
    // -----------------------------------------------------------------------
    console.log("🗑️  Checking for existing quiz...");
    const { data: existing } = await supabase
        .from("quizzes")
        .select("id")
        .eq("slug", QUIZ_SLUG)
        .maybeSingle();

    if (existing) {
        console.log(`  Found existing quiz ${existing.id}, deleting...`);
        // CASCADE will delete passages → questions
        await supabase.from("passages").delete().eq("quiz_id", existing.id);
        await supabase.from("quizzes").delete().eq("id", existing.id);
        console.log("  ✅ Deleted existing quiz\n");
    } else {
        console.log("  No existing quiz found\n");
    }

    // -----------------------------------------------------------------------
    // Step 1: Insert quiz
    // -----------------------------------------------------------------------
    console.log("📝 Creating quiz...");
    const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
            title: "IELTS Reading — Full Demo (All Question Types)",
            slug: QUIZ_SLUG,
            excerpt: "A complete IELTS Reading practice test featuring all 6 question types: Multiple Choice, Dropdown, Fill-in-the-Blank, Checkbox, Matching, and Classification.",
            type: "practice",
            skill: "reading",
            time_minutes: 60,
            pro_user_only: false,
            status: "published",
            question_form: "multiple-choice, dropdown, fill-in-the-blank, multiple-select, matching, summary-completion, heading-match, classification",
            source: "Demo",
            year: "2026",
        })
        .select("id")
        .single();

    if (quizError) {
        console.error("❌ Failed to create quiz:", quizError.message);
        process.exit(1);
    }
    console.log(`  ✅ Quiz created: ${quiz.id}\n`);

    // -----------------------------------------------------------------------
    // Step 2: Insert passages
    // -----------------------------------------------------------------------
    console.log("📄 Creating passages...");
    const passagesData = [
        { quiz_id: quiz.id, title: "The History of Coffee", content: PASSAGE_1_CONTENT, sort_order: 0 },
        { quiz_id: quiz.id, title: "Ocean Conservation: Challenges and Solutions", content: PASSAGE_2_CONTENT, sort_order: 1 },
        { quiz_id: quiz.id, title: "Artificial Intelligence in Education", content: PASSAGE_3_CONTENT, sort_order: 2 },
    ];

    const { data: passages, error: passageError } = await supabase
        .from("passages")
        .insert(passagesData)
        .select("id, title, sort_order")
        .order("sort_order");

    if (passageError) {
        console.error("❌ Failed to create passages:", passageError.message);
        process.exit(1);
    }
    passages.forEach((p: any) => console.log(`  ✅ Passage ${p.sort_order + 1}: ${p.title}`));
    console.log();

    // -----------------------------------------------------------------------
    // Step 3: Insert questions
    // -----------------------------------------------------------------------
    console.log("❓ Creating questions...");

    const questionsByPassage = [PASSAGE_1_QUESTIONS, PASSAGE_2_QUESTIONS, PASSAGE_3_QUESTIONS];

    const allQuestions = passages.flatMap((passage: any, pIndex: number) =>
        questionsByPassage[pIndex].map((q: any) => ({
            passage_id: passage.id,
            ...q,
        }))
    );

    const { error: questionError } = await supabase
        .from("questions")
        .insert(allQuestions);

    if (questionError) {
        console.error("❌ Failed to create questions:", questionError.message);
        process.exit(1);
    }

    // Count question types
    const typeCounts: Record<string, number> = {};
    for (const q of allQuestions) {
        const label = q.type === "matching"
            ? `matching (${q.matching_question?.layout_type})`
            : q.type;
        typeCounts[label] = (typeCounts[label] || 0) + 1;
    }
    Object.entries(typeCounts).forEach(([type, count]) =>
        console.log(`  ✅ ${type}: ${count} question block(s)`)
    );

    // -----------------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------------
    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║         ✅ SEED COMPLETE                        ║");
    console.log("╚══════════════════════════════════════════════════╝");
    console.log(`  Quiz:       ${quiz.id}`);
    console.log(`  Slug:       ${QUIZ_SLUG}`);
    console.log(`  Passages:   ${passages.length}`);
    console.log(`  Questions:  ${allQuestions.length} blocks`);
    console.log(`  URL:        /ielts-practice-library/${QUIZ_SLUG}`);
}

seedDummyReading().catch((err) => {
    console.error("❌ Script failed:", err);
    process.exit(1);
});
