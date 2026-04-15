import { Input, Space, Checkbox, Button, Divider } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

type CheckboxOption = { option_text: string; correct: boolean };

type CheckboxEditorProps = {
    options: CheckboxOption[];
    onChange: (v: CheckboxOption[]) => void;
};

export default function CheckboxEditor({ options, onChange }: CheckboxEditorProps) {
    return (
        <div className="sub-editor-container">
            <Divider orientation="left">Checkbox Options</Divider>
            {(Array.isArray(options) ? options : []).map((o, idx) => (
                <Space key={idx} style={{ marginBottom: 8, width: '100%' }}>
                    <Checkbox
                        checked={o.correct}
                        onChange={(e) => {
                            const arr = [...options];
                            arr[idx] = { ...arr[idx], correct: e.target.checked };
                            onChange(arr);
                        }}
                    />
                    <Input
                        value={o.option_text ?? (o as any).option}
                        onChange={(e) => {
                            const arr = [...options];
                            arr[idx] = { ...arr[idx], option_text: e.target.value };
                            onChange(arr);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        style={{ width: 300 }}
                    />
                    <Button danger icon={<DeleteOutlined />} onClick={() => onChange(options.filter((_, i) => i !== idx))} />
                </Space>
            ))}
            <Button onClick={() => onChange([...options, { option_text: "", correct: false }])}>Add Option</Button>

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
