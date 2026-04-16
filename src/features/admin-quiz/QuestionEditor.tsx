import { memo } from "react";
import {
    Card, Input, Select, Form, Row, Col, Space, Tag,
} from "antd";
import type { QuestionData } from "./types";
import { QUESTION_TYPES } from "./constants";
import RadioSelectEditor from "./editors/RadioSelectEditor";
import FillupEditor from "./editors/FillupEditor";
import CheckboxEditor from "./editors/CheckboxEditor";
import MatchingEditor from "./editors/MatchingEditor";
import MatrixEditor from "./editors/MatrixEditor";
import RichTextEditor from "./RichTextEditor";

type QuestionEditorProps = {
    question: QuestionData;
    onUpdate: (field: string, value: unknown) => void;
};

function QuestionEditorInner({ question: q, onUpdate }: QuestionEditorProps) {
    return (
        <>
            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item label="Type">
                        <Select value={q.type} onChange={(v) => onUpdate("type", v)} options={QUESTION_TYPES} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label="Title">
                        <Input value={q.title ?? ""} onChange={(e) => onUpdate("title", e.target.value)} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label="Question Form">
                        <Input value={q.question_form ?? ""} onChange={(e) => onUpdate("question_form", e.target.value)} />
                    </Form.Item>
                </Col>
            </Row>
            <Form.Item label="Question Text">
                <RichTextEditor value={q.question_text ?? ""} onChange={(html) => onUpdate("question_text", html)} placeholder="Nhập nội dung câu hỏi..." />
            </Form.Item>
            <Form.Item label="Instructions">
                <RichTextEditor value={q.instructions ?? ""} onChange={(html) => onUpdate("instructions", html)} placeholder="Nhập hướng dẫn..." />
            </Form.Item>

            {/* Question type specific editors */}
            {(q.type === "radio" || q.type === "select") && (
                <RadioSelectEditor
                    questions={q.list_of_questions ?? []}
                    onChange={(v) => onUpdate("list_of_questions", v)}
                />
            )}
            {q.type === "fillup" && (
                <FillupEditor
                    question_text={q.question_text ?? ""}
                    onChange={(v) => onUpdate("question_text", v)}
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
                    data={q.matrix_question ?? { matrixCategories: [], matrixItems: [] }}
                    onChange={(v) => onUpdate("matrix_question", v)}
                />
            )}
        </>
    );
}

const QuestionEditor = memo(QuestionEditorInner);
export default QuestionEditor;
