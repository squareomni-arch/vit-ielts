import { useState } from "react";
import { Input, Space, Checkbox, Button, Popover } from "antd";
import { DeleteOutlined, CommentOutlined } from "@ant-design/icons";

type CheckboxOption = { option_text: string; correct: boolean; explanation?: string };

type CheckboxEditorProps = {
    options: CheckboxOption[];
    onChange: (v: CheckboxOption[]) => void;
};

export default function CheckboxEditor({ options, onChange }: CheckboxEditorProps) {
    const [openExpIdx, setOpenExpIdx] = useState<number | null>(null);

    const update = (idx: number, patch: Partial<CheckboxOption>) => {
        const arr = [...options];
        arr[idx] = { ...arr[idx], ...patch };
        onChange(arr);
    };

    const remove = (idx: number) => onChange(options.filter((_, i) => i !== idx));

    return (
        <div className="space-y-2">
            {(Array.isArray(options) ? options : []).map((o, idx) => (
                <div key={idx} className="flex items-center gap-2" style={{ minWidth: 0 }}>
                    <Checkbox
                        style={{ flexShrink: 0 }}
                        checked={o.correct}
                        onChange={(e) => update(idx, { correct: e.target.checked })}
                    />
                    <Input
                        value={(o as { option_text?: string; option?: string }).option_text ?? (o as { option?: string }).option ?? ""}
                        onChange={(e) => update(idx, { option_text: e.target.value })}
                        placeholder={`Option ${idx + 1}`}
                        style={{ flex: 1, minWidth: 0 }}
                    />
                    <Popover
                        open={openExpIdx === idx}
                        onOpenChange={(v) => setOpenExpIdx(v ? idx : null)}
                        trigger="click"
                        title="Giải thích cho option này"
                        content={
                            <Input.TextArea
                                rows={3}
                                style={{ width: 280 }}
                                placeholder="Nhập giải thích…"
                                value={o.explanation ?? ""}
                                onChange={(e) => update(idx, { explanation: e.target.value })}
                            />
                        }
                    >
                        <Button
                            size="small"
                            icon={<CommentOutlined />}
                            type={o.explanation ? "primary" : "default"}
                            title="Add explanation"
                            style={{ flexShrink: 0 }}
                        />
                    </Popover>
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(idx)}
                        style={{ flexShrink: 0 }}
                    />
                </div>
            ))}

            <Button
                size="small"
                className="mt-1"
                onClick={() =>
                    onChange([...options, { option_text: "", correct: false }])
                }
            >
                + Add Option
            </Button>
        </div>
    );
}
