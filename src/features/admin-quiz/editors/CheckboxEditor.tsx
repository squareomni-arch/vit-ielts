import { Input, Space, Switch, Button, Divider } from "antd";
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
                <Space key={idx} style={{ marginBottom: 4, width: '100%' }}>
                    <Input
                        value={o.option_text}
                        onChange={(e) => {
                            const arr = [...options];
                            arr[idx] = { ...arr[idx], option_text: e.target.value };
                            onChange(arr);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        style={{ width: 300 }}
                    />
                    <Switch
                        checked={o.correct}
                        onChange={(v) => {
                            const arr = [...options];
                            arr[idx] = { ...arr[idx], correct: v };
                            onChange(arr);
                        }}
                        checkedChildren="✓"
                        unCheckedChildren="✗"
                    />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onChange(options.filter((_, i) => i !== idx))} />
                </Space>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => onChange([...options, { option_text: "", correct: false }])}>Thêm option</Button>

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
