import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Tabs, Empty } from "antd";
import type { QuestionData } from "./types";
import { QUESTION_TYPES, QUESTION_FORMS, DEFAULT_QUESTION } from "./constants";
import RichTextEditor from "./RichTextEditor";
import RadioSelectEditor from "./editors/RadioSelectEditor";
import FillupEditor from "./editors/FillupEditor";
import CheckboxEditor from "./editors/CheckboxEditor";
import MatchingEditor from "./editors/MatchingEditor";
import MatrixEditor from "./editors/MatrixEditor";

type QuestionModalProps = {
    open: boolean;
    initialData?: QuestionData;
    onCancel: () => void;
    onSave: (data: QuestionData) => void;
};

export default function QuestionModal({ open, initialData, onCancel, onSave }: QuestionModalProps) {
    const [form] = Form.useForm();
    const [localData, setLocalData] = useState<QuestionData>({ ...DEFAULT_QUESTION });

    useEffect(() => {
        if (open) {
            const data = initialData ? { ...initialData } : { ...DEFAULT_QUESTION };
            setLocalData(data);
            form.setFieldsValue({
                title: data.title,
                type: data.type,
                question_form: data.question_form || "uncategorized",
            });
        }
    }, [open, initialData, form]);

    const handleUpdate = (field: string, value: unknown) => {
        setLocalData((prev) => ({ ...prev, [field]: value }));
    };

    const handleOk = () => {
        form.validateFields()
            .then((values) => {
                onSave({
                    ...(initialData || DEFAULT_QUESTION),
                    ...localData,
                    ...values,
                });
            })
            .catch((info) => {
                console.log("Validate Failed:", info);
            });
    };

    const questionType = form.getFieldValue("type") || localData.type;

    const renderEditor = () => {
        switch (questionType) {
            case "radio":
            case "select":
                return (
                    <RadioSelectEditor
                        questions={localData.list_of_questions ?? []}
                        onChange={(v) => handleUpdate("list_of_questions", v)}
                    />
                );
            case "fillup":
                return (
                    <FillupEditor
                        explanations={localData.explanations ?? []}
                        onChange={(v) => handleUpdate("explanations", v)}
                    />
                );
            case "checkbox":
                return (
                    <CheckboxEditor
                        options={localData.list_of_options ?? []}
                        onChange={(v) => handleUpdate("list_of_options", v)}
                    />
                );
            case "matching":
                return (
                    <MatchingEditor
                        data={localData.matching_question ?? { layoutType: "standard", matchingItems: [], answerOptions: [] }}
                        onChange={(v) => handleUpdate("matching_question", v)}
                    />
                );
            case "matrix":
                return (
                    <MatrixEditor
                        data={localData.matrix_question ?? { matrixCategories: [], matrixItems: [] }}
                        onChange={(v) => handleUpdate("matrix_question", v)}
                    />
                );
            default:
                return null;
        }
    };

    const questionTab = (
        <div className="space-y-4 pt-4">
            <div className="space-y-1">
                <p className="font-medium">Instructions</p>
                <RichTextEditor
                    value={localData.instructions ?? ""}
                    onChange={(html) => handleUpdate("instructions", html)}
                    placeholder="Nhập hướng dẫn (nếu có)..."
                />
            </div>
            {/* Some specific types don't rely only on instructions, e.g. fillup requires passage text but that's in passage. We can add a generic text if needed. BP Quiz uses Instructions mostly. */}
            <div className="space-y-4 border-t pt-4">
                <p className="font-medium">Details</p>
                {renderEditor()}
            </div>
        </div>
    );

    const explanationTab = (
        <div className="space-y-4 pt-4">
            <div className="space-y-1">
                <p className="font-medium text-gray-500 mb-4">Note: Explanation is currently coupled inside specific editors for Fill-up, and generalized here for others (To be implemented based on legacy spec).</p>
                <Empty description="Tính năng Giải thích chi tiết sẽ được nâng cấp ở wave sau." />
            </div>
        </div>
    );

    const previewTab = (
        <div className="space-y-4 pt-4">
            <Empty description="Bản xem trước câu hỏi" />
        </div>
    );

    return (
        <Modal
            title={initialData ? "Edit Question" : "Add Question"}
            open={open}
            onOk={handleOk}
            onCancel={onCancel}
            width={900}
            destroyOnClose
            centered
            okText="Save Question"
        >
            <Form form={form} layout="vertical" className="mt-4" onValuesChange={(_, all) => setLocalData(prev => ({ ...prev, type: all.type }))}>
                <div className="space-y-4">
                    <div>
                        <p className="font-medium mb-1">
                            Title <span className="text-red-500">*</span>
                        </p>
                        <Form.Item name="title" rules={[{ required: true, message: "Title is required" }]} className="mb-0">
                            <Input placeholder="E.g. Question 1-5" />
                        </Form.Item>
                    </div>

                    <div>
                        <p className="font-medium mb-1">
                            Type <span className="text-red-500">*</span>
                        </p>
                        <Form.Item name="type" rules={[{ required: true, message: "Type is required" }]} className="mb-0">
                            <Select options={QUESTION_TYPES} />
                        </Form.Item>
                    </div>

                    <div>
                        <p className="font-medium mb-1">
                            Question Form <span className="text-red-500">*</span>
                        </p>
                        <Form.Item name="question_form" rules={[{ required: true, message: "Form is required" }]} className="mb-0">
                            <Select options={QUESTION_FORMS} />
                        </Form.Item>
                    </div>
                </div>
            </Form>

            <Tabs
                defaultActiveKey="1"
                className="mt-6"
                tabBarStyle={{ backgroundColor: "#f9fafb", padding: "0 20px" }}
                items={[
                    { key: "1", label: "Question", children: questionTab },
                    { key: "2", label: "Explanation", children: explanationTab },
                    { key: "3", label: "Preview", children: previewTab },
                ]}
            />
        </Modal>
    );
}
