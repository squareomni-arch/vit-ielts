import { memo } from "react";
import {
    Card, Input, InputNumber, Form, Row, Col, Divider,
} from "antd";
import type { PassageData } from "./types";
import QuestionList from "./QuestionList";
import RichTextEditor from "./RichTextEditor";
import MMSSInput from "./MMSSInput";

type PassageEditorProps = {
    passage: PassageData;
    skill: string;
    pIdx: number;
    onUpdatePassage: (field: string, value: unknown) => void;
    onAddQuestion: () => void;
    onRemoveQuestion: (qIdx: number) => void;
    onUpdateQuestion: (qIdx: number, field: string, value: unknown) => void;
    onReorderQuestions: (oldIndex: number, newIndex: number) => void;
};

function PassageEditorInner({
    passage,
    skill,
    pIdx,
    onUpdatePassage,
    onAddQuestion,
    onRemoveQuestion,
    onUpdateQuestion,
    onReorderQuestions,
}: PassageEditorProps) {
    const isListening = skill === "listening";

    return (
        <div>
            <Row gutter={16}>
                <Col span={isListening ? 13 : 16}>
                    <Form.Item label="Title">
                        <Input value={passage.title ?? ""} onChange={(e) => onUpdatePassage("title", e.target.value)} />
                    </Form.Item>
                </Col>
                {isListening && (
                    <>
                        <Col span={3}>
                            <Form.Item label="Audio Start" tooltip="MM:SS hoặc số giây (vd 0:40 = 40 giây)">
                                <MMSSInput
                                    value={passage.audio_start}
                                    onChange={(v) => onUpdatePassage("audio_start", v ?? null)}
                                    placeholder="0:40"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={3}>
                            <Form.Item label="Audio End" tooltip="MM:SS hoặc số giây (vd 4:15 = 4 phút 15 giây)">
                                <MMSSInput
                                    value={passage.audio_end}
                                    onChange={(v) => onUpdatePassage("audio_end", v ?? null)}
                                    placeholder="4:15"
                                />
                            </Form.Item>
                        </Col>
                    </>
                )}
                <Col span={isListening ? 5 : 8}>
                    <Form.Item label="Start question no">
                        <InputNumber 
                            placeholder="Mặc định: 1" 
                            value={passage.start_question_number} 
                            onChange={(v) => onUpdatePassage("start_question_number", v)} 
                            className="w-full" 
                        />
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
