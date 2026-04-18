import { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Tag, Tooltip, Tabs } from "antd";
import { EditOutlined } from "@ant-design/icons";
import type { QuestionData } from "./types";
import { QUESTION_TEMPLATES, DEFAULT_QUESTION, type QuestionTemplate } from "./constants";
import RichTextEditor from "./RichTextEditor";
import RadioSelectEditor from "./editors/RadioSelectEditor";
import FillupEditor from "./editors/FillupEditor";
import CheckboxEditor from "./editors/CheckboxEditor";
import MatchingEditor from "./editors/MatchingEditor";
import MatrixEditor from "./editors/MatrixEditor";
import QuestionTemplatePicker from "./QuestionTemplatePicker";

import QuestionPreview from "./QuestionPreview";

type QuestionModalProps = {
    open: boolean;
    initialData?: QuestionData;
    onCancel: () => void;
    onSave: (data: QuestionData) => void;
};

// ... function getTemplateByTypeAndForm, buildDefaultDataForTemplate ...
function getTemplateByTypeAndForm(type: string, question_form?: string): QuestionTemplate | undefined {
    return QUESTION_TEMPLATES.find(
        (t) => t.type === type && t.question_form === (question_form ?? t.question_form)
    ) ?? QUESTION_TEMPLATES.find((t) => t.type === type);
}

function buildDefaultDataForTemplate(tmpl: QuestionTemplate): Partial<QuestionData> {
    const base: Partial<QuestionData> = {
        type: tmpl.type,
        question_form: tmpl.question_form,
    };

    if (tmpl.type === "radio" || tmpl.type === "select") {
        const options = tmpl.presetOptions
            ? tmpl.presetOptions.map((o) => ({ option_text: o }))
            : [{ option_text: "" }];
        base.list_of_questions = [{ question: "", correct: 0, options }];
    }
    if (tmpl.type === "checkbox") {
        base.list_of_options = [{ option_text: "", correct: false }];
    }
    if (tmpl.type === "fillup") {
        base.question_text = "";
    }
    if (tmpl.type === "matching") {
        const layoutType =
            tmpl.id === "matching_headings" ? "heading" :
            tmpl.id === "matching_summary" ? "summary" :
            "standard";
        base.matching_question = { layoutType, matchingItems: [], answerOptions: [], summaryText: "" };
    }
    if (tmpl.type === "matrix") {
        base.matrix_question = { matrixCategories: [], matrixItems: [], layoutType: "standard" };
    }

    return base;
}

export default function QuestionModal({ open, initialData, onCancel, onSave }: QuestionModalProps) {
    const [form] = Form.useForm();
    const [localData, setLocalData] = useState<QuestionData>({ ...DEFAULT_QUESTION });
    const [activeTemplate, setActiveTemplate] = useState<QuestionTemplate | undefined>(undefined);
    const [showPicker, setShowPicker] = useState(false);

    const isNew = !initialData;

    useEffect(() => {
        if (open) {
            if (initialData) {
                setLocalData({ ...initialData });
                setActiveTemplate(getTemplateByTypeAndForm(initialData.type, initialData.question_form));
                form.setFieldsValue({ title: initialData.title });
            } else {
                // New question — show template picker
                setLocalData({ ...DEFAULT_QUESTION });
                setActiveTemplate(undefined);
                form.resetFields();
                setShowPicker(true);
            }
        } else {
            setShowPicker(false);
        }
    }, [open, initialData, form]);

    const handleSelectTemplate = (tmpl: QuestionTemplate) => {
        setActiveTemplate(tmpl);
        const newData: QuestionData = {
            ...DEFAULT_QUESTION,
            ...buildDefaultDataForTemplate(tmpl),
        };
        setLocalData(newData);
        setShowPicker(false);
    };

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

    const renderEditor = () => {
        switch (localData.type) {
            case "radio":
            case "select":
                return (
                    <RadioSelectEditor
                        questions={localData.list_of_questions ?? []}
                        onChange={(v) => handleUpdate("list_of_questions", v)}
                        presetOptions={activeTemplate?.presetOptions}
                    />
                );
            case "fillup":
                return (
                    <FillupEditor
                        question_text={localData.question_text ?? ""}
                        onChange={(v) => handleUpdate("question_text", v)}
                        wordExplanations={
                            Array.isArray(localData.explanations)
                                ? Object.fromEntries(
                                    localData.explanations
                                        .filter((e: any) => e?.key != null)
                                        .map((e: any) => [String(e.key), e.content ?? ""])
                                )
                                : {}
                        }
                        onExplanationsChange={(map) =>
                            handleUpdate(
                                "explanations",
                                Object.entries(map).map(([key, content]) => ({ key: Number(key), content }))
                            )
                        }
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

    return (
        <>
            {/* Template picker shown for new questions */}
            <QuestionTemplatePicker
                open={open && showPicker}
                onSelect={handleSelectTemplate}
                onCancel={onCancel}
            />

            {/* Main editor modal — only shown once template is selected */}
            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <span>{isNew ? "Add Question" : "Edit Question"}</span>
                        {activeTemplate && (
                            <Tooltip title="Click to change format">
                                <Tag
                                    icon={<span className="mr-1">{activeTemplate.icon}</span>}
                                    color="blue"
                                    className="cursor-pointer select-none text-xs font-medium"
                                    onClick={() => setShowPicker(true)}
                                >
                                    {activeTemplate.label}
                                    <EditOutlined className="ml-1 opacity-60" />
                                </Tag>
                            </Tooltip>
                        )}
                    </div>
                }
                open={open && !showPicker}
                onOk={handleOk}
                onCancel={onCancel}
                width={900}
                destroyOnClose
                centered
                okText="Save Question"
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item
                        name="title"
                        label={<span className="font-medium">Title <span className="text-red-500">*</span></span>}
                        rules={[{ required: true, message: "Title is required" }]}
                        className="mb-4"
                    >
                        <Input placeholder="E.g. Questions 1–6" />
                    </Form.Item>
                </Form>

                <Tabs
                    defaultActiveKey="question"
                    items={[
                        {
                            key: "question",
                            label: "Question",
                            children: (
                                <div className="space-y-4 pt-2">
                                    <div>
                                            <p className="font-medium mb-2">
                                                Instructions <span className="text-gray-400 font-normal text-xs ml-1">(optional)</span>
                                            </p>
                                            <RichTextEditor
                                                value={localData.instructions ?? ""}
                                                onChange={(html) => handleUpdate("instructions", html)}
                                                placeholder={
                                                    localData.type === "fillup"
                                                        ? "E.g. Complete the notes below. Choose NO MORE THAN TWO WORDS from the passage for each answer."
                                                        : "E.g. Do the following statements agree with the information given in the reading passage?"
                                                }
                                                height={180}
                                            />
                                        </div>

                                    {activeTemplate ? (
                                        <div>
                                            <p className="font-medium mb-2">
                                                {localData.type === "fillup" ? "Passage / Question Content" : "Questions & Answers"}
                                            </p>
                                            {renderEditor()}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <p>No question format selected.</p>
                                            <Button className="mt-2" onClick={() => setShowPicker(true)}>
                                                Choose Format
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: "explanation",
                            label: <span className={!localData.explanations?.[0]?.content ? "text-red-500" : ""}>Explanation</span>,
                            children: (
                                <div className="pt-2">
                                    <p className="font-medium mb-2">
                                        Explanation <span className="text-red-500">*</span>
                                    </p>
                                    <RichTextEditor
                                        value={localData.explanations?.[0]?.content ?? ""}
                                        onChange={(html) => handleUpdate("explanations", [{ content: html }])}
                                        placeholder="Enter explanation..."
                                        height={300}
                                    />
                                </div>
                            ),
                        },
                        {
                            key: "preview",
                            label: "Preview",
                            children: (
                                <div className="pt-4 pb-12 bg-white rounded-lg border border-gray-100 p-6 mt-2 shadow-sm min-h-[300px]">
                                    <QuestionPreview data={{ ...initialData, ...localData, title: form.getFieldValue("title") || localData.title }} />
                                </div>
                            ),
                        },
                    ]}
                />
            </Modal>
        </>
    );
}

