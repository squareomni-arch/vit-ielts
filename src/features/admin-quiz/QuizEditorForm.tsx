import { useCallback, useState } from "react";
import {
    Card, Form, Input, Select, InputNumber, Switch, Button
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";
import FileUploadField from "./FileUploadField";
import Link from "next/link";

const { TextArea } = Input;

function slugify(text: string): string {
    // ... same slugify logic
    const diacriticsMap: Record<string, string> = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'đ': 'd',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    };
    return text
        .toLowerCase()
        .split('')
        .map(ch => diacriticsMap[ch] || ch)
        .join('')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

type QuizEditorFormProps = {
    form: FormInstance;
    saving?: boolean;
    isNew?: boolean;
    currentSkill: string;
    onValuesChange?: () => void;
    slugManuallyEdited?: boolean;
    onSlugManuallyEdited?: (v: boolean) => void;
};

export default function QuizEditorForm({
    form,
    saving,
    isNew,
    currentSkill,
    onValuesChange,
    slugManuallyEdited,
    onSlugManuallyEdited,
}: QuizEditorFormProps) {
    const watchFeaturedImage = Form.useWatch('featured_image', form) || '';
    const watchAudioUrl = Form.useWatch('audio_url', form) || '';
    const watchPdfUrl = Form.useWatch('pdf_url', form) || '';
    const currentType = Form.useWatch('type', form);
    const currentSlug = Form.useWatch('slug', form);
    const currentStatus = Form.useWatch('status', form);

    const [localSlugEdited, setLocalSlugEdited] = useState(false);
    const isSlugEdited = slugManuallyEdited ?? localSlugEdited;
    const setSlugEdited = onSlugManuallyEdited ?? setLocalSlugEdited;

    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        form.setFieldsValue({ title: newTitle });
        if (!isSlugEdited) {
            form.setFieldsValue({ slug: slugify(newTitle) });
        }
        onValuesChange?.();
    }, [form, isSlugEdited, onValuesChange]);

    const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSlugEdited(true);
        form.setFieldsValue({ slug: e.target.value });
        onValuesChange?.();
    }, [form, setSlugEdited, onValuesChange]);

    const renderLabel = (text: string, required: boolean = false) => (
        <span className="font-semibold text-gray-800">
            {text} {required && <span className="text-red-500">*</span>}
        </span>
    );

    return (
        <Card title={<h3 className="text-lg m-0 font-bold">Quiz basic</h3>} className="mb-4">
            <Form
                form={form}
                layout="horizontal"
                labelCol={{ span: 8, md: 6 }}
                wrapperCol={{ span: 16, md: 18 }}
                labelAlign="left"
                initialValues={{
                    type: "practice",
                    skill: "reading",
                    time_minutes: 60,
                    tests_taken: 0,
                    views: 0,
                    pro_user_only: false,
                    status: "draft",
                }}
                onValuesChange={() => onValuesChange?.()}
                className="space-y-2 mt-4"
                colon={false}
            >
                {/* Hidden tracking fields for Form.useWatch */}
                <Form.Item name="skill" hidden><Input /></Form.Item>
                <Form.Item name="status" hidden><Input /></Form.Item>
                <Form.Item name="score_type" hidden><Input /></Form.Item>

                {/* 1. Featured Image */}
                <Form.Item label={renderLabel("Featured Image")}>
                    <Form.Item name="featured_image" noStyle><Input hidden /></Form.Item>
                    <FileUploadField
                        label=""
                        accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                        value={watchFeaturedImage}
                        layoutType="button"
                        buttonLabel="Select Media"
                        onChange={(url) => { form.setFieldsValue({ featured_image: url }); onValuesChange?.(); }}
                    />
                </Form.Item>

                {/* 2. Title */}
                <Form.Item label={renderLabel("Quiz title", true)} name="title" rules={[{ required: true }]}>
                    <Input variant="filled" size="large" onChange={handleTitleChange} disabled={saving} />
                </Form.Item>

                {/* Slug (Not in legacy UI but needed, we put it here) */}
                <Form.Item label={
                    <span className="font-semibold text-gray-800">
                        Slug (URL) <span className="text-red-500">*</span>
                        {!isNew && currentSlug && currentStatus === 'published' && (
                            <Link href={`/ielts-practice/${currentSlug}`} target="_blank" legacyBehavior>
                                <a target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                                    <Button size="small" type="link" icon={<EyeOutlined />} />
                                </a>
                            </Link>
                        )}
                    </span>
                } name="slug" rules={[{ required: true }]}>
                    <Input variant="filled" size="large" onChange={handleSlugChange} disabled={saving} />
                </Form.Item>

                {/* 3. Description */}
                <Form.Item label={renderLabel("Description")} name="excerpt">
                    <TextArea rows={4} variant="filled" size="large" className="resize-none" disabled={saving} />
                </Form.Item>

                {/* Conditional Fields for Practice */}
                {currentType === "practice" && (
                    <>
                        <Form.Item label={renderLabel("Year", true)} name="year">
                            <Input variant="filled" size="large" placeholder="E.g. 2024" disabled={saving} />
                        </Form.Item>

                        <Form.Item label={renderLabel("Quarter", true)} name="quarter">
                            <Select
                                variant="filled"
                                size="large"
                                placeholder="Quarter"
                                options={[
                                    { value: "Q1", label: "Quarter 1 T1-T4" },
                                    { value: "Q2", label: "Quarter 2 T5-T8" },
                                    { value: "Q3", label: "Quarter 3 T9-T12" },
                                ]}
                                disabled={saving}
                            />
                        </Form.Item>

                        <Form.Item label={renderLabel(currentSkill === "reading" ? "Passage" : "Part", true)} name="part">
                            <Select
                                variant="filled"
                                size="large"
                                placeholder="Part/Passage"
                                options={Array.from({ length: currentSkill === "reading" ? 3 : 4 }, (_, i) => ({
                                    value: (i + 1).toString(),
                                    label: `${currentSkill === "reading" ? "Passage" : "Part"} ${i + 1}`
                                }))}
                                disabled={saving}
                            />
                        </Form.Item>

                        <Form.Item label={renderLabel("Source", true)} name="source">
                            <Input variant="filled" size="large" disabled={saving} />
                        </Form.Item>
                    </>
                )}

                {/* 4. Quiz Type */}
                <Form.Item label={renderLabel("Quiz type", true)} name="type" rules={[{ required: true }]}>
                    <Select
                        variant="filled"
                        size="large"
                        options={[
                            { value: "academic", label: "Academic" },
                            { value: "general", label: "General" },
                            { value: "practice", label: "Practice" },
                        ]}
                        disabled={saving}
                    />
                </Form.Item>

                {/* 5. Pro */}
                <Form.Item label={renderLabel("Pro")} name="pro_user_only" valuePropName="checked">
                    <Switch disabled={saving} />
                </Form.Item>

                {/* 6. Time */}
                <Form.Item label={renderLabel("Time (minutes)", true)} name="time_minutes">
                    <InputNumber variant="filled" size="large" addonAfter="minutes" disabled={saving} />
                </Form.Item>

                <Form.Item label={renderLabel("Attempts")} name="tests_taken">
                    <InputNumber
                        variant="filled"
                        size="large"
                        min={0}
                        precision={0}
                        style={{ width: "100%" }}
                        disabled={saving}
                    />
                </Form.Item>

                <Form.Item label={renderLabel("Views")} name="views">
                    <InputNumber
                        variant="filled"
                        size="large"
                        min={0}
                        precision={0}
                        style={{ width: "100%" }}
                        disabled={saving}
                    />
                </Form.Item>

                {/* 7. PDF File */}
                <Form.Item label={renderLabel("PDF File", true)}>
                    <Form.Item name="pdf_url" noStyle><Input hidden /></Form.Item>
                    <FileUploadField
                        label=""
                        accept={{ 'application/pdf': ['.pdf'] }}
                        value={watchPdfUrl}
                        layoutType="input-button"
                        buttonLabel="Select PDF"
                        onChange={(url) => { form.setFieldsValue({ pdf_url: url }); onValuesChange?.(); }}
                    />
                </Form.Item>

                {/* 8. Audio (for listening) */}
                {currentSkill === "listening" && (
                    <Form.Item label={renderLabel("Audio", true)}>
                        <Form.Item name="audio_url" noStyle><Input hidden /></Form.Item>
                        <FileUploadField
                            label=""
                            accept={{ 'audio/*': ['.mp3', '.wav', '.ogg'] }}
                            value={watchAudioUrl}
                            layoutType="input-button"
                            buttonLabel="Select Audio"
                            onChange={(url) => { form.setFieldsValue({ audio_url: url }); onValuesChange?.(); }}
                        />
                    </Form.Item>
                )}

                {/* 9. Score Type */}
                <Form.Item label={renderLabel("Score Type")} name="score_type">
                    <Select
                        variant="filled"
                        size="large"
                        options={[
                            { value: "band", label: "Band" },
                            { value: "percentage", label: "Percentage" },
                        ]}
                        disabled={saving}
                    />
                </Form.Item>

                {/* Question Form (Legacy might keep it inside passages/types, but here it's global for the test config) */}
                <Form.Item label={renderLabel("Question Form")} name="question_form">
                     {/* Keep this field from the previous system just in case */}
                    <Input variant="filled" size="large" disabled={saving} />
                </Form.Item>

                {/* 10. Status */}
                <Form.Item label={renderLabel("Status")} name="status">
                    <Select
                        variant="filled"
                        size="large"
                        options={[
                            { value: "draft", label: "Draft" },
                            { value: "published", label: "Published" },
                        ]}
                        disabled={saving}
                    />
                </Form.Item>
            </Form>
        </Card>
    );
}
