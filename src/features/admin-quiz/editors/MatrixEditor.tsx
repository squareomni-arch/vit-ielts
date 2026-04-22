import { useState } from "react";
import { Input, Space, Button, Divider, Popover, Select, Form } from "antd";
import { PlusOutlined, DeleteOutlined, CommentOutlined } from "@ant-design/icons";

type MatrixCategory = { categoryLetter: string; categoryText: string };
type MatrixItem = { itemText: string; correctCategoryLetter: string; explanation?: string };

type MatrixData = {
    matrixCategories: MatrixCategory[];
    matrixItems: MatrixItem[];
    layoutType?: string;
    legendTitle?: string;
};

type MatrixEditorProps = {
    data: MatrixData;
    onChange: (v: MatrixData) => void;
};

const MATRIX_LAYOUTS = [
    { value: "standard", label: "Standard (table với categories nằm ngang)" },
    { value: "simple", label: "Simple (danh sách đơn giản)" },
];

export default function MatrixEditor({ data, onChange }: MatrixEditorProps) {
    const [openExpIdx, setOpenExpIdx] = useState<number | null>(null);

    const update = (field: string, value: unknown) =>
        onChange({ ...data, [field]: value });

    const updateCategory = (idx: number, patch: Partial<MatrixCategory>) => {
        const arr = [...data.matrixCategories];
        arr[idx] = { ...arr[idx], ...patch };
        update("matrixCategories", arr);
    };

    const updateItem = (idx: number, patch: Partial<MatrixItem>) => {
        const arr = [...data.matrixItems];
        arr[idx] = { ...arr[idx], ...patch };
        update("matrixItems", arr);
    };

    const categoryOptions = (data.matrixCategories ?? []).map((c) => ({
        value: c.categoryLetter,
        label: `${c.categoryLetter} — ${c.categoryText || "…"}`,
    }));

    return (
        <div className="space-y-4">
            {/* Layout type + Legend title */}
            <div className="flex gap-4 flex-wrap">
                <Form.Item label="Layout Type" className="mb-0">
                    <Select
                        value={data.layoutType ?? "standard"}
                        onChange={(v) => update("layoutType", v)}
                        options={MATRIX_LAYOUTS}
                        style={{ width: 320 }}
                    />
                </Form.Item>
                <Form.Item label="Legend Title (optional)" className="mb-0 flex-1">
                    <Input
                        placeholder='E.g. "Which writer mentions the following?"'
                        value={data.legendTitle ?? ""}
                        onChange={(e) => update("legendTitle", e.target.value)}
                    />
                </Form.Item>
            </div>

            <Divider orientation="left" plain className="!my-2">
                Categories (e.g. A = Writer Jones, B = Writer Smith)
            </Divider>

            <div className="space-y-2">
                {(data.matrixCategories ?? []).map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <Input
                            placeholder="Letter"
                            value={cat.categoryLetter}
                            onChange={(e) =>
                                updateCategory(idx, { categoryLetter: e.target.value })
                            }
                            style={{ width: 70, flexShrink: 0 }}
                        />
                        <Input
                            placeholder="Category label (e.g. Yes, True, Writer Jones)"
                            value={cat.categoryText}
                            onChange={(e) =>
                                updateCategory(idx, { categoryText: e.target.value })
                            }
                            style={{ flex: 1 }}
                        />
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() =>
                                update(
                                    "matrixCategories",
                                    data.matrixCategories.filter((_, i) => i !== idx)
                                )
                            }
                        />
                    </div>
                ))}
                <Button
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={() =>
                        update("matrixCategories", [
                            ...(data.matrixCategories ?? []),
                            { categoryLetter: "", categoryText: "" },
                        ])
                    }
                >
                    Add Category
                </Button>
            </div>

            <Divider orientation="left" plain className="!my-2">
                Items to categorise
            </Divider>

            <div className="space-y-2">
                {(data.matrixItems ?? []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <div
                            style={{
                                background: "#f3f4f6",
                                padding: "4px 8px",
                                borderRadius: 4,
                                border: "1px solid #e5e7eb",
                                fontSize: 12,
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {idx + 1}
                        </div>
                        <Input
                            placeholder="Statement / item text"
                            value={item.itemText}
                            onChange={(e) => updateItem(idx, { itemText: e.target.value })}
                            style={{ flex: 1 }}
                        />
                        <Select
                            placeholder="Category"
                            value={item.correctCategoryLetter || undefined}
                            onChange={(v) =>
                                updateItem(idx, { correctCategoryLetter: v })
                            }
                            options={categoryOptions}
                            style={{ width: 200 }}
                            notFoundContent="Thêm Categories trước"
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
                        </Popover>
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() =>
                                update(
                                    "matrixItems",
                                    data.matrixItems.filter((_, i) => i !== idx)
                                )
                            }
                        />
                    </div>
                ))}
                <Button
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={() =>
                        update("matrixItems", [
                            ...(data.matrixItems ?? []),
                            { itemText: "", correctCategoryLetter: "" },
                        ])
                    }
                >
                    Add Item
                </Button>
            </div>
        </div>
    );
}
