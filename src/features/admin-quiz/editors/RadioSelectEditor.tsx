import { useState } from "react";
import { Card, Input, Space, Button, Radio } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

type RadioSelectQuestion = {
    question: string;
    correct: number | string;
    options: { option_text: string }[];
    explanation?: string;
};

type RadioSelectEditorProps = {
    questions: RadioSelectQuestion[];
    onChange: (v: RadioSelectQuestion[]) => void;
    presetOptions?: string[];
};

export default function RadioSelectEditor({ questions, onChange, presetOptions }: RadioSelectEditorProps) {
    const isPreset = presetOptions && presetOptions.length > 0;

    const add = () => {
        const options = isPreset
            ? presetOptions.map((o) => ({ option_text: o }))
            : [{ option_text: "" }];
        onChange([...questions, { question: "", correct: 0, options }]);
    };
    const remove = (idx: number) => onChange(questions.filter((_, i) => i !== idx));

    const update = (idx: number, field: string, value: unknown) => {
        const arr = [...questions];
        (arr[idx] as Record<string, unknown>)[field] = value;
        onChange(arr);
    };

    const updateOption = (qIdx: number, oIdx: number, value: string) => {
        const arr = [...questions];
        arr[qIdx] = {
            ...arr[qIdx],
            options: arr[qIdx].options.map((o, i) =>
                i === oIdx ? { option_text: value } : o
            ),
        };
        onChange(arr);
    };

    const addOption = (qIdx: number) => {
        const arr = [...questions];
        arr[qIdx] = {
            ...arr[qIdx],
            options: [...arr[qIdx].options, { option_text: "" }],
        };
        onChange(arr);
    };

    const removeOption = (qIdx: number, oIdx: number) => {
        const arr = [...questions];
        const newOptions = arr[qIdx].options.filter((_, i) => i !== oIdx);
        arr[qIdx] = {
            ...arr[qIdx],
            options: newOptions,
            correct:
                arr[qIdx].correct === oIdx || String(arr[qIdx].correct) === String(oIdx)
                    ? 0
                    : arr[qIdx].correct,
        };
        onChange(arr);
    };

    return (
        <div className="space-y-3">
            {(Array.isArray(questions) ? questions : []).map((q, idx) => (
                <Card
                    key={idx}
                    size="small"
                    style={{ background: "#f9fafb", borderColor: "#e5e7eb" }}
                    extra={
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(idx)}
                        />
                    }
                >
                    {/* Question text */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", minWidth: 0 }}>
                        <div
                            style={{
                                background: "#e5e7eb",
                                padding: "4px 10px",
                                borderRadius: 4,
                                border: "1px solid #d1d5db",
                                display: "flex",
                                alignItems: "center",
                                whiteSpace: "nowrap",
                                fontWeight: 500,
                                fontSize: 13,
                                flexShrink: 0,
                            }}
                        >
                            Q.{idx + 1}
                        </div>
                        <Input
                            style={{ flex: 1, minWidth: 0 }}
                            placeholder="Statement or question text…"
                            value={q.question}
                            onChange={(e) => update(idx, "question", e.target.value)}
                        />
                    </div>

                    {/* Options with radio button for correct answer */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                        {(q.options ?? []).map((opt, oIdx) => (
                            <div key={oIdx} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", minWidth: 0 }}>
                                <div
                                    style={{
                                        width: 24,
                                        minWidth: 24,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <Radio
                                        style={{
                                            width: "auto",
                                            minWidth: "auto",
                                            display: "inline-flex",
                                            flexShrink: 0,
                                            marginInlineEnd: 0,
                                        }}
                                        checked={
                                            q.correct === oIdx ||
                                            String(q.correct) === String(oIdx)
                                        }
                                        onChange={() => update(idx, "correct", oIdx)}
                                    />
                                </div>
                                {isPreset ? (
                                    <span
                                        style={{
                                            flex: 1,
                                            padding: "4px 11px",
                                            background: "#f5f5f5",
                                            border: "1px solid #d9d9d9",
                                            borderRadius: 6,
                                            fontSize: 14,
                                            color: "#595959",
                                        }}
                                    >
                                        {String(
                                            (opt as { option_text?: string }).option_text ?? "",
                                        ).toUpperCase()}
                                    </span>
                                ) : (
                                    <>
                                        <Input
                                            placeholder={`Option ${oIdx + 1}`}
                                            value={(opt as { option_text?: string; content?: string }).option_text ?? (opt as { content?: string }).content ?? ""}
                                            onChange={(e) => updateOption(idx, oIdx, e.target.value)}
                                            style={{ flex: 1, minWidth: 0 }}
                                        />
                                        {q.options?.length > 1 && (
                                            <Button
                                                size="small"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => removeOption(idx, oIdx)}
                                                style={{ flexShrink: 0 }}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                        {!isPreset && (
                            <Button size="small" className="mt-1" onClick={() => addOption(idx)}>
                                + Add Option
                            </Button>
                        )}
                    </div>
                </Card>
            ))}

            <Button onClick={add}>+ Add Question</Button>
        </div>
    );
}
