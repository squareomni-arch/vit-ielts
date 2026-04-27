import { memo } from "react";
import {
    Card, Input, Select, Form, Row, Col,
} from "antd";
import type { QuestionData } from "./types";
import { QUESTION_TYPES, QUESTION_FORMS } from "./constants";
import RadioSelectEditor from "./editors/RadioSelectEditor";
import FillupEditor from "./editors/FillupEditor";
import CheckboxEditor from "./editors/CheckboxEditor";
import MatchingEditor from "./editors/MatchingEditor";
import MatrixEditor from "./editors/MatrixEditor";
import RichTextEditor from "./RichTextEditor";

// Preset options keyed by question_form (luôn IN HOA theo chuẩn IELTS).
const PRESET_OPTIONS_BY_FORM: Record<string, string[]> = {
    true_false_not_given: ["TRUE", "FALSE", "NOT GIVEN"],
    yes_no_not_given: ["YES", "NO", "NOT GIVEN"],
};

type QuestionEditorProps = {
    question: QuestionData;
    onUpdate: (field: string, value: unknown) => void;
};

function QuestionEditorInner({ question: q, onUpdate }: QuestionEditorProps) {
    const presetOptions = PRESET_OPTIONS_BY_FORM[q.question_form ?? ""];

    const wordExplanations: Record<string, string> = (() => {
        if (!Array.isArray(q.explanations)) return {};
        return Object.fromEntries(
            q.explanations
                .filter((e: any) => e?.key != null)
                .map((e: any) => [String(e.key), e.content ?? ""])
        );
    })();

    return (
        <>
            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item label="Type">
                        <Select
                            value={q.type}
                            onChange={(v) => onUpdate("type", v)}
                            options={QUESTION_TYPES}
                        />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label="Title">
                        <Input
                            value={q.title ?? ""}
                            onChange={(e) => onUpdate("title", e.target.value)}
                        />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label="Question Form">
                        <Select
                            value={q.question_form ?? undefined}
                            onChange={(v) => onUpdate("question_form", v)}
                            options={QUESTION_FORMS}
                            allowClear
                            showSearch
                            placeholder="Select form…"
                            filterOption={(input, option) =>
                                (option?.label as string ?? "")
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                            }
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item label="Instructions">
                <RichTextEditor
                    value={q.instructions ?? ""}
                    onChange={(html) => onUpdate("instructions", html)}
                    placeholder={
                        q.type === "fillup"
                            ? "E.g. Complete the notes below. Choose NO MORE THAN TWO WORDS from the passage for each answer."
                            : "Nhập hướng dẫn..."
                    }
                    height={160}
                />
            </Form.Item>

            <Form.Item label="Question Text">
                <RichTextEditor
                    value={q.question_text ?? ""}
                    onChange={(html) => onUpdate("question_text", html)}
                    placeholder="Nhập nội dung câu hỏi..."
                />
            </Form.Item>

            {/* Type-specific editors */}
            {(q.type === "radio" || q.type === "select") && (
                <RadioSelectEditor
                    questions={q.list_of_questions ?? []}
                    onChange={(v) => onUpdate("list_of_questions", v)}
                    presetOptions={presetOptions}
                />
            )}
            {q.type === "fillup" && (
                <FillupEditor
                    question_text={q.question_text ?? ""}
                    onChange={(v) => onUpdate("question_text", v)}
                    wordExplanations={wordExplanations}
                    onExplanationsChange={(map) =>
                        onUpdate(
                            "explanations",
                            Object.entries(map).map(([key, content]) => ({ key: Number(key), content }))
                        )
                    }
                />
            )}
            {q.type === "checkbox" && (
                <CheckboxEditor
                    options={q.list_of_options ?? []}
                    onChange={(v) => onUpdate("list_of_options", v)}
                />
            )}
            {q.type === "matching" && (
                <MatchingEditor
                    data={q.matching_question ?? { layoutType: "standard", matchingItems: [], answerOptions: [] }}
                    onChange={(v) => onUpdate("matching_question", v)}
                />
            )}
            {q.type === "matrix" && (
                <MatrixEditor
                    data={q.matrix_question ?? { matrixCategories: [], matrixItems: [], layoutType: "standard" }}
                    onChange={(v) => onUpdate("matrix_question", v)}
                />
            )}
        </>
    );
}

const QuestionEditor = memo(QuestionEditorInner);
export default QuestionEditor;
