import { memo } from "react";
import {
    Card, Input, InputNumber, Form, Row, Col, Divider,
} from "antd";
import type { PassageData } from "./types";
import QuestionList from "./QuestionList";
import RichTextEditor from "./RichTextEditor";

type PassageEditorProps = {
    passage: PassageData;
    pIdx: number;
    onUpdatePassage: (field: string, value: unknown) => void;
    onAddQuestion: () => void;
    onRemoveQuestion: (qIdx: number) => void;
    onUpdateQuestion: (qIdx: number, field: string, value: unknown) => void;
    onReorderQuestions: (oldIndex: number, newIndex: number) => void;
};

function PassageEditorInner({
    passage,
    pIdx,
    onUpdatePassage,
    onAddQuestion,
    onRemoveQuestion,
    onUpdateQuestion,
    onReorderQuestions,
}: PassageEditorProps) {
    return (
        <div>
            <Row gutter={16}>
                <Col span={16}>
                    <Form.Item label="Title">
                        <Input value={passage.title ?? ""} onChange={(e) => onUpdatePassage("title", e.target.value)} />
                    </Form.Item>
                </Col>
                <Col span={4}>
                    <Form.Item label="Audio Start">
                        <InputNumber value={passage.audio_start} onChange={(v) => onUpdatePassage("audio_start", v)} className="w-full" />
                    </Form.Item>
                </Col>
                <Col span={4}>
                    <Form.Item label="Audio End">
                        <InputNumber value={passage.audio_end} onChange={(v) => onUpdatePassage("audio_end", v)} className="w-full" />
                    </Form.Item>
                </Col>
            </Row>
            <Form.Item label="Content">
                <RichTextEditor value={passage.content ?? ""} onChange={(html) => onUpdatePassage("content", html)} placeholder="Nhập nội dung passage..." />
            </Form.Item>

            <Divider>Questions ({(Array.isArray(passage.questions) ? passage.questions : []).length})</Divider>

            <QuestionList
                questions={passage.questions}
                onAdd={onAddQuestion}
                onRemove={onRemoveQuestion}
                onUpdate={onUpdateQuestion}
                onReorder={onReorderQuestions}
            />
        </div>
    );
}

const PassageEditor = memo(PassageEditorInner);
export default PassageEditor;
