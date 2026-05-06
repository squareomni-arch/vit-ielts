export type QuizFormData = {
    title: string;
    slug: string;
    excerpt?: string;
    type: "practice" | "exam";
    skill: "reading" | "listening";
    time_minutes: number;
    pro_user_only: boolean;
    score_type?: string;
    featured_image?: string;
    audio_url?: string;
    pdf_url?: string;
    source?: string;
    year?: string;
    quarter?: string;
    part?: string;
    question_form?: string[];
    status: "draft" | "published";
    passages: PassageData[];
};

export type PassageData = {
    id?: string;
    title?: string;
    content?: string;
    sort_order: number;
    audio_start?: number;
    audio_end?: number;
    start_question_number?: number;
    questions: QuestionData[];
};

export type QuestionData = {
    id?: string;
    type: string;
    title?: string;
    question_text?: string;
    instructions?: string;
    question_form?: string;
    sort_order: number;
    list_of_questions?: {
        question: string;
        correct: number | string;
        options: { option_text: string }[];
        explanation?: string;
    }[];
    list_of_options?: { option_text: string; correct: boolean; explanation?: string }[];
    matching_question?: {
        layoutType: string;
        matchingItems: { questionPart: string; correctAnswer: string; explanation?: string }[];
        answerOptions: { optionText: string }[];
        summaryText?: string;
        optionsTitle?: string;
    };
    matrix_question?: {
        matrixCategories: { categoryLetter: string; categoryText: string }[];
        matrixItems: { itemText: string; correctCategoryLetter: string; explanation?: string }[];
        layoutType?: string;
        legendTitle?: string;
    };
    explanations?: { content: string }[];
};
