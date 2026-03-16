import { Input, Select, Form, Space, Button, Divider } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { MATCHING_LAYOUTS } from "../constants";

const { TextArea } = Input;

type MatchingData = {
    layoutType: string;
    matchingItems: { questionPart: string; correctAnswer: string }[];
    answerOptions: { optionText: string }[];
    summaryText?: string;
};

type MatchingEditorProps = {
    data: MatchingData;
    onChange: (v: MatchingData) => void;
};

export default function MatchingEditor({ data, onChange }: MatchingEditorProps) {
    const update = (field: string, value: unknown) => onChange({ ...data, [field]: value });

    return (
        <div className="sub-editor-container">
            <Divider orientation="left">Matching</Divider>
            <Form.Item label="Layout Type">
                <Select value={data.layoutType} onChange={(v) => update("layoutType", v)} options={MATCHING_LAYOUTS} style={{ width: 200 }} />
            </Form.Item>
            {data.layoutType === "summary" && (
                <Form.Item label="Summary Text">
                    <TextArea rows={3} value={data.summaryText ?? ""} onChange={(e) => update("summaryText", e.target.value)} />
                </Form.Item>
            )}
            <Divider orientation="left" plain>Matching Items</Divider>
            {(data.matchingItems ?? []).map((item, idx) => (
                <Space key={idx} style={{ marginBottom: 4, width: '100%' }}>
                    <Input placeholder="Question Part" value={item.questionPart} onChange={(e) => { const arr = [...data.matchingItems]; arr[idx] = { ...arr[idx], questionPart: e.target.value }; update("matchingItems", arr); }} style={{ width: 250 }} />
                    <Input placeholder="Correct Answer" value={item.correctAnswer} onChange={(e) => { const arr = [...data.matchingItems]; arr[idx] = { ...arr[idx], correctAnswer: e.target.value }; update("matchingItems", arr); }} style={{ width: 200 }} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => update("matchingItems", data.matchingItems.filter((_, i) => i !== idx))} />
                </Space>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => update("matchingItems", [...(data.matchingItems ?? []), { questionPart: "", correctAnswer: "" }])}>Thêm item</Button>

            <Divider orientation="left" plain>Answer Options</Divider>
            {(data.answerOptions ?? []).map((opt, idx) => (
                <Space key={idx} style={{ marginBottom: 4, width: '100%' }}>
                    <Input placeholder={`Option ${idx + 1}`} value={opt.optionText} onChange={(e) => { const arr = [...data.answerOptions]; arr[idx] = { optionText: e.target.value }; update("answerOptions", arr); }} style={{ width: 300 }} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => update("answerOptions", data.answerOptions.filter((_, i) => i !== idx))} />
                </Space>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => update("answerOptions", [...(data.answerOptions ?? []), { optionText: "" }])}>Thêm option</Button>

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
