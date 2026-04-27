import type { PassageData, QuestionData } from "./types";

export const QUESTION_TYPES = [
    { value: "fillup", label: "Fill-up (typed answer questions)" },
    { value: "radio", label: "Radio (single answer questions)" },
    { value: "select", label: "Select (select answers from a numerical/alphabetical list)" },
    { value: "checkbox", label: "Checkbox (check the correct box(es) questions)" },
    { value: "matching", label: "Matching (Matching components)" },
    { value: "matrix", label: "Matrix (Matrix components)" },
];

export const QUESTION_FORMS = [
    { value: "uncategorized", label: "Uncategorized" },
    { value: "summary_completion", label: "Summary Completion" },
    { value: "true_false_not_given", label: "True/ False/ Not Given" },
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "matching_paragraph_information", label: "Matching Paragraph Information" },
    { value: "matching_name", label: "Matching Name" },
    { value: "yes_no_not_given", label: "Yes/ No/ Not Given" },
    { value: "matching_headings", label: "Matching Headings" },
    { value: "sentence_completion", label: "Sentence Completion" },
    { value: "list_selection", label: "List Selection" },
    { value: "short_answer", label: "Short Answer" },
    { value: "matching_sentence_endings", label: "Matching Sentence Endings" },
    { value: "table_completion", label: "Table Completion" },
    { value: "diagram_completion", label: "Diagram Completion" },
    { value: "flow_chart_completion", label: "Flow Chart Completion" },
    { value: "choose_a_title", label: "Choose a Title" },
];



export const MATCHING_LAYOUTS = [
    { value: "standard", label: "Standard" },
    { value: "summary", label: "Summary Completion" },
    { value: "heading", label: "Heading Match" },
];

export const DEFAULT_PASSAGE: PassageData = {
    title: "",
    content: "",
    sort_order: 0,
    questions: [],
};

export const DEFAULT_QUESTION: QuestionData = {
    type: "radio",
    title: "",
    question_text: "",
    sort_order: 0,
    list_of_questions: [],
};

// ─── Template-Driven Picker ─────────────────────────────────────────────────
// User picks an IELTS format name → system maps to type + question_form + optional presets.

export type QuestionTemplate = {
    id: string;
    label: string;
    description: string;
    icon: string;
    type: string;
    question_form: string;
    presetOptions?: string[];   // Auto-fill answer options (e.g. True/False/Not Given)
};

export const QUESTION_TEMPLATES: QuestionTemplate[] = [
    // ── Fill-up types ───────────────────────────────────────────
    {
        id: "summary_completion",
        label: "Summary / Note Completion",
        description: "Fill-in-the-blank from passage, answers extracted from {word} markers",
        icon: "✏️",
        type: "fillup",
        question_form: "summary_completion",
    },
    {
        id: "sentence_completion",
        label: "Sentence Completion",
        description: "Complete sentences using words from the passage",
        icon: "📝",
        type: "fillup",
        question_form: "sentence_completion",
    },
    {
        id: "short_answer",
        label: "Short Answer",
        description: "Answer questions using NO MORE THAN TWO/THREE WORDS from the passage",
        icon: "✍️",
        type: "fillup",
        question_form: "short_answer",
    },
    {
        id: "table_completion",
        label: "Table / Diagram / Flow Chart Completion",
        description: "Fill in a table, diagram or flow chart",
        icon: "📊",
        type: "fillup",
        question_form: "table_completion",
    },
    // ── Radio / single-choice types ─────────────────────────────
    {
        id: "multiple_choice",
        label: "Multiple Choice (Single Answer)",
        description: "Choose ONE correct answer from a list of options",
        icon: "⭕",
        type: "radio",
        question_form: "multiple_choice",
    },
    {
        id: "true_false_not_given",
        label: "True / False / Not Given",
        description: "Decide if a statement is True, False or Not Given based on the passage",
        icon: "✅",
        type: "radio",
        question_form: "true_false_not_given",
        presetOptions: ["TRUE", "FALSE", "NOT GIVEN"],
    },
    {
        id: "yes_no_not_given",
        label: "Yes / No / Not Given",
        description: "Decide if statements agree/disagree/not mentioned",
        icon: "💬",
        type: "radio",
        question_form: "yes_no_not_given",
        presetOptions: ["YES", "NO", "NOT GIVEN"],
    },
    // ── Checkbox / multi-choice types ──────────────────────────
    {
        id: "checkbox_multi",
        label: "Multiple Choice (Multiple Answers)",
        description: "Choose TWO or MORE correct answers from a list",
        icon: "☑️",
        type: "checkbox",
        question_form: "multiple_choice",
    },
    {
        id: "list_selection",
        label: "List Selection",
        description: "Select items from a list that match criteria",
        icon: "📋",
        type: "checkbox",
        question_form: "list_selection",
    },
    // ── Matching types ──────────────────────────────────────────
    {
        id: "matching_summary",
        label: "Summary Completion (Word Bank)",
        description: "Drag words from a word bank into gaps in a summary paragraph",
        icon: "🔡",
        type: "matching",
        question_form: "summary_completion",
    },
    {
        id: "matching_headings",
        label: "Matching Headings",
        description: "Match headings to sections of the passage",
        icon: "🔖",
        type: "matching",
        question_form: "matching_headings",
    },
    {
        id: "matching_name",
        label: "Matching Features / Names",
        description: "Match names or features to statements",
        icon: "👤",
        type: "matching",
        question_form: "matching_name",
    },
    {
        id: "matching_paragraph_information",
        label: "Matching Paragraph Information",
        description: "Match statements to paragraphs in the passage",
        icon: "📄",
        type: "matching",
        question_form: "matching_paragraph_information",
    },
    {
        id: "matching_sentence_endings",
        label: "Matching Sentence Endings",
        description: "Match sentence beginnings to their correct endings",
        icon: "↔️",
        type: "matching",
        question_form: "matching_sentence_endings",
    },
    // ── Matrix types ────────────────────────────────────────────
    {
        id: "choose_a_title",
        label: "Choose a Title / Category",
        description: "Categorise items into groups/categories",
        icon: "🏷️",
        type: "matrix",
        question_form: "choose_a_title",
    },
];

