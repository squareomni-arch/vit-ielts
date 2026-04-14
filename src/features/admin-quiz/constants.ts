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
