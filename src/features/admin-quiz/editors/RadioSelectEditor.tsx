import {
    Card, Input, Row, Col, Space, Button, Divider, Radio
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

type RadioSelectQuestion = {
    question: string;
    correct: number | string;
    options: { option_text: string }[];
};

type RadioSelectEditorProps = {
    questions: RadioSelectQuestion[];
    onChange: (v: RadioSelectQuestion[]) => void;
};

export default function RadioSelectEditor({ questions, onChange }: RadioSelectEditorProps) {
    const add = () => onChange([...questions, { question: "", correct: 0, options: [{ option_text: "" }] }]);
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
        // Fallback for correct marker logic
        if (arr[qIdx].correct === oIdx || String(arr[qIdx].correct) === String(oIdx)) {
            arr[qIdx].correct = 0;
        }
        onChange(arr);
    };

    return (
        <div className="sub-editor-container">
            <Divider orientation="left">Radio/Select Questions</Divider>
            {(Array.isArray(questions) ? questions : []).map((q, idx) => (
                <Card key={idx} size="small" style={{ marginBottom: 8, background: "#f9fafb" }} extra={<Button danger icon={<DeleteOutlined />} onClick={() => remove(idx)} />}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ background: '#e5e7eb', padding: '4px 12px', borderRadius: '4px', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center' }}>
                            Q.{idx + 1}
                        </div>
                        <Input style={{ flex: 1 }} placeholder="Question text" value={q.question} onChange={(e) => update(idx, "question", e.target.value)} />
                    </div>
                    
                    <div style={{ marginTop: 16 }}>
                        {(q.options ?? []).map((opt, oIdx) => (
                            <Space key={oIdx} style={{ marginBottom: 8, width: '100%' }}>
                                <Radio 
                                    checked={q.correct === oIdx || String(q.correct) === String(oIdx)} 
                                    onChange={() => update(idx, "correct", oIdx)} 
                                />
                                <Input placeholder={`Option ${oIdx + 1}`} value={opt.option_text ?? (opt as any).content} onChange={(e) => updateOption(idx, oIdx, e.target.value)} style={{ width: 300 }} />
                                {(q.options?.length > 1) && (
                                    <Button danger icon={<DeleteOutlined />} onClick={() => removeOption(idx, oIdx)} />
                                )}
                            </Space>
                        ))}
                        <div style={{ marginTop: 8 }}>
                            <Button onClick={() => addOption(idx)}>Add Option</Button>
                        </div>
                    </div>
                </Card>
            ))}
            <Button onClick={add}>Add Question</Button>

            <style jsx>{`
                .sub-editor-container {
                    background: var(--admin-surface-hover);
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid var(--admin-border);
                }
            `}</style>
        </div>
    );
}
