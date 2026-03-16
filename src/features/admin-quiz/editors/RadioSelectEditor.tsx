import {
    Card, Input, Row, Col, Space, Button, Divider,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

type RadioSelectQuestion = {
    question: string;
    correct: string;
    options: { option_text: string }[];
};

type RadioSelectEditorProps = {
    questions: RadioSelectQuestion[];
    onChange: (v: RadioSelectQuestion[]) => void;
};

export default function RadioSelectEditor({ questions, onChange }: RadioSelectEditorProps) {
    const add = () => onChange([...questions, { question: "", correct: "", options: [{ option_text: "" }] }]);
    const remove = (idx: number) => onChange(questions.filter((_, i) => i !== idx));
    const update = (idx: number, field: string, value: unknown) => {
        const arr = [...questions];
        (arr[idx] as Record<string, unknown>)[field] = value;
        onChange(arr);
    };
    const updateOption = (qIdx: number, oIdx: number, value: string) => {
        const arr = [...questions];
        arr[qIdx].options[oIdx] = { option_text: value };
        onChange(arr);
    };
    const addOption = (qIdx: number) => {
        const arr = [...questions];
        arr[qIdx].options.push({ option_text: "" });
        onChange(arr);
    };
    const removeOption = (qIdx: number, oIdx: number) => {
        const arr = [...questions];
        arr[qIdx].options = arr[qIdx].options.filter((_, i) => i !== oIdx);
        onChange(arr);
    };

    return (
        <div className="sub-editor-container">
            <Divider orientation="left">Radio/Select Questions</Divider>
            {(Array.isArray(questions) ? questions : []).map((q, idx) => (
                <Card key={idx} size="small" style={{ marginBottom: 8 }} extra={<Button size="small" danger icon={<DeleteOutlined />} onClick={() => remove(idx)} />}>
                    <Row gutter={8}>
                        <Col span={12}><Input placeholder="Question text" value={q.question} onChange={(e) => update(idx, "question", e.target.value)} /></Col>
                        <Col span={12}><Input placeholder="Correct answer" value={q.correct} onChange={(e) => update(idx, "correct", e.target.value)} /></Col>
                    </Row>
                    <div style={{ marginTop: 8 }}>
                        {(q.options ?? []).map((opt, oIdx) => (
                            <Space key={oIdx} style={{ marginBottom: 4, width: '100%' }}>
                                <Input size="small" placeholder={`Option ${oIdx + 1}`} value={opt.option_text} onChange={(e) => updateOption(idx, oIdx, e.target.value)} style={{ width: 300 }} />
                                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeOption(idx, oIdx)} />
                            </Space>
                        ))}
                        <Button size="small" icon={<PlusOutlined />} onClick={() => addOption(idx)}>Option</Button>
                    </div>
                </Card>
            ))}
            <Button icon={<PlusOutlined />} onClick={add}>Thêm câu hỏi</Button>

            <style jsx>{`
                .sub-editor-container {
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid #f0f0f0;
                }
            `}</style>
        </div>
    );
}
