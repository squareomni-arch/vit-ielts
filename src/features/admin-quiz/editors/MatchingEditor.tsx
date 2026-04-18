import { useState } from "react";
import { Input, Select, Form, Button, Divider, Popover, Alert } from "antd";
import { PlusOutlined, DeleteOutlined, CommentOutlined } from "@ant-design/icons";
import { MATCHING_LAYOUTS } from "../constants";
import RichTextEditor from "../RichTextEditor";

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

    const answerOptionLetters = (data.answerOptions ?? []).map((_, i) =>
        String.fromCharCode(65 + i)
    );

    const validAnswers = new Set(answerOptionLetters.map((l) => l.toUpperCase()));

    const summaryGapCount = (data.summaryText ?? "").match(/\{[^}]+\}/g)?.length ?? 0;

    const isHeading = data.layoutType === "heading";
    const isSummary = data.layoutType === "summary";

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

            {/* ── SUMMARY layout ── */}
            {isSummary && (
                <Form.Item label="Summary Text" className="mb-0">
                    <p className="px-3 py-2 mb-2 bg-neutral-100 rounded border border-dashed border-gray-300 text-sm text-gray-600">
                        Dùng <code className="bg-gray-200 px-1 rounded">{"{ }"}</code> để đánh dấu chỗ trống, viết đáp án đúng bên trong.{" "}
                        Ví dụ: <em>The process is <strong>{"{"+"efficient"+"}"}</strong> and cost-effective.</em>
                    </p>
                    <RichTextEditor
                        value={data.summaryText ?? ""}
                        onChange={(v) => update("summaryText", v)}
                        placeholder="Type the summary paragraph here. Wrap each blank with { correct_answer }…"
                        height={180}
                    />
                    {summaryGapCount === 0 && (data.summaryText ?? "").length > 0 && (
                        <Alert
                            type="warning"
                            showIcon
                            message="Không tìm thấy chỗ trống { }. Hãy đặt đáp án trong dấu ngoặc nhọn."
                            className="mt-2"
                        />
                    )}
                    {summaryGapCount > 0 && (
                        <p className="text-xs text-green-700 mt-1">
                            ✓ Phát hiện <strong>{summaryGapCount}</strong> chỗ trống
                        </p>
                    )}
                </Form.Item>
            )}

            {/* ── STANDARD / HEADING layout — Matching Items ── */}
            {!isSummary && (
                <>
                    <Divider orientation="left" plain className="!my-2">
                        {isHeading
                            ? "Sections to match (e.g. Paragraph i, ii, iii…)"
                            : "Matching Items"}
                    </Divider>

                    {isHeading && (
                        <p className="text-xs text-gray-500 -mt-2 mb-1">
                            Cột trái: nhãn đoạn văn (i, ii, iii…). Cột phải: chữ cái heading đúng (A, B, C…) từ danh sách Answer Options bên dưới.
                        </p>
                    )}

                    <div className="space-y-2">
                        {(data.matchingItems ?? []).map((item, idx) => {
                            const answerUpper = item.correctAnswer?.trim().toUpperCase();
                            const isInvalid =
                                answerUpper &&
                                validAnswers.size > 0 &&
                                !validAnswers.has(answerUpper);

                            return (
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
                                        {isHeading
                                            ? ["i","ii","iii","iv","v","vi","vii","viii","ix","x"][idx] ?? idx + 1
                                            : idx + 1}
                                    </div>
                                    <Input
                                        placeholder={isHeading ? "Paragraph label (e.g. Section A)" : "Statement / sentence to match"}
                                        value={item.questionPart}
                                        onChange={(e) => updateItem(idx, { questionPart: e.target.value })}
                                        style={{ flex: 2, minWidth: 0 }}
                                    />
                                    <Select
                                        placeholder="Answer"
                                        value={item.correctAnswer || undefined}
                                        onChange={(v) => updateItem(idx, { correctAnswer: v })}
                                        options={answerOptionLetters.map((l) => ({ value: l, label: l }))}
                                        style={{ width: 90, flexShrink: 0 }}
                                        status={isInvalid ? "error" : undefined}
                                        allowClear
                                        showSearch
                                        notFoundContent={
                                            answerOptionLetters.length === 0
                                                ? "Thêm Answer Options trước"
                                                : "Không tìm thấy"
                                        }
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
                            );
                        })}
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
                </>
            )}

            {/* ── Answer Options (always shown) ── */}
            <Divider orientation="left" plain className="!my-2">
                {isHeading ? "Headings (Answer Options)" : "Answer Options"}
            </Divider>

            {isHeading && (
                <p className="text-xs text-gray-500 -mt-2 mb-1">
                    Danh sách heading để match — được đánh nhãn A, B, C… tự động.
                </p>
            )}

            <div className="space-y-2">
                {(data.answerOptions ?? []).map((opt, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div
                            style={{
                                background: "#e0f2fe",
                                padding: "4px 8px",
                                borderRadius: 4,
                                border: "1px solid #bae6fd",
                                fontSize: 12,
                                fontWeight: 700,
                                minWidth: 28,
                                textAlign: "center",
                                flexShrink: 0,
                                color: "#0369a1",
                            }}
                        >
                            {String.fromCharCode(65 + idx)}
                        </div>
                        <Input
                            placeholder={isHeading ? `Heading ${String.fromCharCode(65 + idx)}` : `Answer option ${String.fromCharCode(65 + idx)}`}
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
                    Add {isHeading ? "Heading" : "Answer Option"}
                </Button>
            </div>
        </div>
    );
}
