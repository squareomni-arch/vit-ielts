import { Input, Space, Button, Divider } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

type FillupEditorProps = {
    explanations: { content: string }[];
    onChange: (v: { content: string }[]) => void;
};

export default function FillupEditor({ explanations, onChange }: FillupEditorProps) {
    return (
        <div className="sub-editor-container">
            <Divider orientation="left">Fill-up Explanations</Divider>
            {(Array.isArray(explanations) ? explanations : []).map((e, idx) => (
                <Space key={idx} style={{ marginBottom: 4, width: '100%' }}>
                    <Input
                        value={e.content}
                        onChange={(ev) => {
                            const arr = [...explanations];
                            arr[idx] = { content: ev.target.value };
                            onChange(arr);
                        }}
                        placeholder={`Answer ${idx + 1}`}
                        style={{ width: 400 }}
                    />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onChange(explanations.filter((_, i) => i !== idx))} />
                </Space>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => onChange([...explanations, { content: "" }])}>Thêm đáp án</Button>

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
