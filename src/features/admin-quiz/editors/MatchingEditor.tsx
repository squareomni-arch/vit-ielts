import { useState } from "react";
import { Input, Select, Form, Button, Divider, Popover } from "antd";
import { PlusOutlined, DeleteOutlined, CommentOutlined } from "@ant-design/icons";
import { MATCHING_LAYOUTS } from "../constants";

const { TextArea } = Input;

type MatchingItem = { questionPart: string; correctAnswer: string; explanation?: string };

type MatchingData = {
    layoutType: string;
    matchingItems: MatchingItem[];
    answerOptions: { optionText: string }[];
    summaryText?: string;
};

type MatchingEditorProps = {
    data: MatchingData;
    onChange: (v: MatchingData) => void;
};

export default function MatchingEditor({ data, onChange }: MatchingEditorProps) {
    const [openExpIdx, setOpenExpIdx] = useState<number | null>(null);

    const update = (field: string, value: unknown) =>
        onChange({ ...data, [field]: value });

    const updateItem = (idx: number, patch: Partial<MatchingItem>) => {
        const arr = [...data.matchingItems];
        arr[idx] = { ...arr[idx], ...patch };
        update("matchingItems", arr);
    };

    return (
        <div className="space-y-4">
            <Form.Item label="Layout Type" className="mb-0">
                <Select
                    value={data.layoutType}
                    onChange={(v) => update("layoutType", v)}
                    options={MATCHING_LAYOUTS}
                    style={{ width: 220 }}
                />
            </Form.Item>

            {data.layoutType === "summary" && (
                <Form.Item label="Summary Text" className="mb-0">
                    <TextArea
                        rows={3}
                        value={data.summaryText ?? ""}
                        onChange={(e) => update("summaryText", e.target.value)}
                    />
                </Form.Item>
            )}

            <Divider orientation="left" plain className="!my-2">
                Matching Items
            </Divider>

            <div className="space-y-2">
                {(data.matchingItems ?? []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2" style={{ minWidth: 0 }}>
                        <div
                            style={{
                                background: "#f3f4f6",
                                padding: "4px 10px",
                                borderRadius: 4,
                                border: "1px solid #e5e7eb",
                                fontSize: 12,
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                            }}
                        >
                            {idx + 1}
                        </div>
                        <Input
                            placeholder="Statement / heading to match"
                            value={item.questionPart}
                            onChange={(e) => updateItem(idx, { questionPart: e.target.value })}
                            style={{ flex: 2, minWidth: 0 }}
                        />
                        <Input
                            placeholder="Correct answer (e.g. A, B, i, ii)"
                            value={item.correctAnswer}
                            onChange={(e) => updateItem(idx, { correctAnswer: e.target.value })}
                            style={{ flex: 1, minWidth: 60, maxWidth: 160 }}
                        />
                        <Popover
                            open={openExpIdx === idx}
                            onOpenChange={(v) => setOpenExpIdx(v ? idx : null)}
                            trigger="click"
                            title="Giải thích cho câu này"
                            content={
                                <Input.TextArea
                                    rows={3}
                                    style={{ width: 280 }}
                                    placeholder="Nhập giải thích…"
                                    value={item.explanation ?? ""}
                                    onChange={(e) =>
                                        updateItem(idx, { explanation: e.target.value })
                                    }
                                />
                            }
                        >
                            <Button
                                size="small"
                                icon={<CommentOutlined />}
                                type={item.explanation ? "primary" : "default"}
                                title="Explanation"
                                style={{ flexShrink: 0 }}
                            />
                        </Popover>
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            style={{ flexShrink: 0 }}
                            onClick={() =>
                                update(
                                    "matchingItems",
                                    data.matchingItems.filter((_, i) => i !== idx)
                                )
                            }
                        />
                    </div>
                ))}
                <Button
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={() =>
                        update("matchingItems", [
                            ...(data.matchingItems ?? []),
                            { questionPart: "", correctAnswer: "" },
                        ])
                    }
                >
                    Add Item
                </Button>
            </div>

            <Divider orientation="left" plain className="!my-2">
                Answer Options
            </Divider>

            <div className="space-y-2">
                {(data.answerOptions ?? []).map((opt, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div
                            style={{
                                background: "#f3f4f6",
                                padding: "4px 8px",
                                borderRadius: 4,
                                border: "1px solid #e5e7eb",
                                fontSize: 12,
                                fontWeight: 600,
                                minWidth: 28,
                                textAlign: "center",
                                flexShrink: 0,
                            }}
                        >
                            {String.fromCharCode(65 + idx)}
                        </div>
                        <Input
                            placeholder={`Answer option ${String.fromCharCode(65 + idx)}`}
                            value={opt.optionText}
                            onChange={(e) => {
                                const arr = [...data.answerOptions];
                                arr[idx] = { optionText: e.target.value };
                                update("answerOptions", arr);
                            }}
                            style={{ flex: 1, minWidth: 0 }}
                        />
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            style={{ flexShrink: 0 }}
                            onClick={() =>
                                update(
                                    "answerOptions",
                                    data.answerOptions.filter((_, i) => i !== idx)
                                )
                            }
                        />
                    </div>
                ))}
                <Button
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={() =>
                        update("answerOptions", [
                            ...(data.answerOptions ?? []),
                            { optionText: "" },
                        ])
                    }
                >
                    Add Answer Option
                </Button>
            </div>
        </div>
    );
}
