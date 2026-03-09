import { useEffect, useState } from "react";
import {
    Card, Form, Input, Select, InputNumber, Switch, Button, Collapse, Space,
    Divider, message, Spin, Typography, Row, Col, Popconfirm, Tag,
} from "antd";
import {
    PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined,
    ArrowLeftOutlined, SaveOutlined,
} from "@ant-design/icons";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import { withAdmin } from "@/shared/hoc/withAdmin";

const { TextArea } = Input;
const { Panel } = Collapse;
const { Title } = Typography;

const QUESTION_TYPES = [
    { value: "radio", label: "Radio (Single Choice)" },
    { value: "select", label: "Select (Dropdown)" },
    { value: "fillup", label: "Fill Up (Gap Fill)" },
    { value: "checkbox", label: "Checkbox (Multiple)" },
    { value: "matching", label: "Matching" },
    { value: "matrix", label: "Matrix" },
];

const MATCHING_LAYOUTS = [
    { value: "standard", label: "Standard" },
    { value: "summary", label: "Summary Completion" },
    { value: "heading", label: "Heading Match" },
];

type QuizFormData = {
    title: string;
    slug: string;
    excerpt?: string;
    type: "practice" | "exam";
    skill: "reading" | "listening";
    time_minutes: number;
    pro_user_only: boolean;
    score_type?: string;
    featured_image?: string;
    audio_url?: string;
    pdf_url?: string;
    source?: string;
    year?: string;
    quarter?: string;
    part?: string;
    question_form?: string;
    status: "draft" | "published";
    passages: PassageData[];
};

type PassageData = {
    id?: string;
    title?: string;
    content?: string;
    sort_order: number;
    audio_start?: number;
    audio_end?: number;
    questions: QuestionData[];
};

type QuestionData = {
    id?: string;
    type: string;
    title?: string;
    question_text?: string;
    instructions?: string;
    question_form?: string;
    sort_order: number;
    list_of_questions?: { question: string; correct: string; options: { option_text: string }[] }[];
    list_of_options?: { option_text: string; correct: boolean }[];
    matching_question?: {
        layout_type: string;
        matching_items: { questionPart: string; correctAnswer: string }[];
        answer_options: { option_text: string }[];
        summary_text?: string;
    };
    matrix_question?: {
        matrix_categories: { category_letter: string; category_text: string }[];
        matrix_items: { item_text: string; correct_category_letter: string }[];
    };
    explanations?: { content: string }[];
};

const DEFAULT_PASSAGE: PassageData = {
    title: "",
    content: "",
    sort_order: 0,
    questions: [],
};

const DEFAULT_QUESTION: QuestionData = {
    type: "radio",
    title: "",
    question_text: "",
    sort_order: 0,
    list_of_questions: [],
};

type QuizEditorProps = {
    quizId?: string;
};

export default function QuizEditorPage() {
    const router = useRouter();
    const { id } = router.query;
    return <QuizEditor quizId={id as string | undefined} />;
}

function QuizEditor({ quizId }: QuizEditorProps) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!!quizId);
    const [passages, setPassages] = useState<PassageData[]>([{ ...DEFAULT_PASSAGE, sort_order: 0, questions: [] }]);
    const isNew = !quizId;

    useEffect(() => {
        if (quizId) fetchQuiz();
    }, [quizId]);

    const fetchQuiz = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/quizzes/${quizId}`);
            const json = await res.json();
            if (json.success) {
                const quiz = json.data;
                form.setFieldsValue({
                    title: quiz.title,
                    slug: quiz.slug,
                    excerpt: quiz.excerpt,
                    type: quiz.type,
                    skill: quiz.skill,
                    time_minutes: quiz.time_minutes,
                    pro_user_only: quiz.pro_user_only,
                    score_type: quiz.score_type,
                    featured_image: quiz.featured_image,
                    audio_url: quiz.audio_url,
                    pdf_url: quiz.pdf_url,
                    source: quiz.source,
                    year: quiz.year,
                    quarter: quiz.quarter,
                    part: quiz.part,
                    question_form: quiz.question_form,
                    status: quiz.status,
                });
                setPassages(
                    quiz.passages?.map((p: PassageData, idx: number) => ({
                        ...p,
                        sort_order: idx,
                        questions: (p.questions ?? []).map((q: QuestionData, qIdx: number) => ({ ...q, sort_order: qIdx })),
                    })) ?? [{ ...DEFAULT_PASSAGE, sort_order: 0, questions: [] }]
                );
            }
        } catch {
            message.error("Error loading quiz");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (status?: string) => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            const payload = {
                ...values,
                status: status || values.status || "draft",
                passages: passages.map((p, pIdx) => ({
                    ...(p.id ? { id: p.id } : {}),
                    title: p.title ?? null,
                    content: p.content ?? null,
                    sort_order: pIdx,
                    audio_start: p.audio_start ?? null,
                    audio_end: p.audio_end ?? null,
                    questions: (p.questions ?? []).map((q, qIdx) => ({
                        ...(q.id ? { id: q.id } : {}),
                        type: q.type,
                        title: q.title ?? null,
                        question_text: q.question_text ?? null,
                        instructions: q.instructions ?? null,
                        question_form: q.question_form ?? null,
                        sort_order: qIdx,
                        list_of_questions: q.type === "radio" || q.type === "select" ? q.list_of_questions ?? null : null,
                        list_of_options: q.type === "checkbox" ? q.list_of_options ?? null : null,
                        matching_question: q.type === "matching" ? q.matching_question ?? null : null,
                        matrix_question: q.type === "matrix" ? q.matrix_question ?? null : null,
                        explanations: q.type === "fillup" ? q.explanations ?? null : null,
                    })),
                })),
            };

            const url = isNew ? "/api/admin/quizzes" : `/api/admin/quizzes/${quizId}`;
            const method = isNew ? "POST" : "PUT";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();

            if (json.success) {
                message.success(isNew ? "Tạo quiz thành công" : "Cập nhật thành công");
                if (isNew && json.data?.id) {
                    router.push(`/admin/quizzes/${json.data.id}`);
                }
            } else {
                message.error(json.error || "Error saving quiz");
            }
        } catch (err) {
            if (err && typeof err === "object" && "errorFields" in err) {
                message.error("Vui lòng điền đầy đủ thông tin bắt buộc");
            } else {
                message.error("Error saving quiz");
            }
        } finally {
            setSaving(false);
        }
    };

    // Passage helpers
    const addPassage = () => setPassages([...passages, { ...DEFAULT_PASSAGE, sort_order: passages.length, questions: [] }]);
    const removePassage = (idx: number) => setPassages(passages.filter((_, i) => i !== idx));
    const movePassage = (idx: number, dir: -1 | 1) => {
        const arr = [...passages];
        const target = idx + dir;
        if (target < 0 || target >= arr.length) return;
        [arr[idx], arr[target]] = [arr[target], arr[idx]];
        setPassages(arr);
    };
    const updatePassage = (idx: number, field: string, value: unknown) => {
        const arr = [...passages];
        (arr[idx] as Record<string, unknown>)[field] = value;
        setPassages(arr);
    };

    // Question helpers
    const addQuestion = (pIdx: number) => {
        const arr = [...passages];
        arr[pIdx].questions.push({ ...DEFAULT_QUESTION, sort_order: arr[pIdx].questions.length, list_of_questions: [] });
        setPassages(arr);
    };
    const removeQuestion = (pIdx: number, qIdx: number) => {
        const arr = [...passages];
        arr[pIdx].questions = arr[pIdx].questions.filter((_, i) => i !== qIdx);
        setPassages(arr);
    };
    const moveQuestion = (pIdx: number, qIdx: number, dir: -1 | 1) => {
        const arr = [...passages];
        const questions = arr[pIdx].questions;
        const target = qIdx + dir;
        if (target < 0 || target >= questions.length) return;
        [questions[qIdx], questions[target]] = [questions[target], questions[qIdx]];
        setPassages(arr);
    };
    const updateQuestion = (pIdx: number, qIdx: number, field: string, value: unknown) => {
        const arr = [...passages];
        (arr[pIdx].questions[qIdx] as Record<string, unknown>)[field] = value;
        setPassages(arr);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center" style={{ minHeight: 400 }}><Spin size="large" /></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div>
                <Space className="mb-4">
                    <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/admin/quizzes")}>Quay lại</Button>
                </Space>

                <Title level={3}>{isNew ? "Tạo Quiz mới" : "Chỉnh sửa Quiz"}</Title>

                <Form form={form} layout="vertical" initialValues={{ type: "practice", skill: "reading", time_minutes: 60, pro_user_only: false, status: "draft" }}>
                    {/* General Info */}
                    <Card title="Thông tin chung" className="mb-4">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: "Bắt buộc" }]}>
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="slug" label="Slug" rules={[{ required: true, message: "Bắt buộc" }]}>
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item name="skill" label="Skill" rules={[{ required: true }]}>
                                    <Select options={[{ value: "reading", label: "Reading" }, { value: "listening", label: "Listening" }]} />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                                    <Select options={[{ value: "practice", label: "Practice" }, { value: "exam", label: "Exam" }]} />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="time_minutes" label="Thời gian (phút)">
                                    <InputNumber min={1} max={180} className="w-full" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="pro_user_only" label="Chỉ Pro" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={6}><Form.Item name="source" label="Source"><Input /></Form.Item></Col>
                            <Col span={6}><Form.Item name="year" label="Year"><Input /></Form.Item></Col>
                            <Col span={6}><Form.Item name="quarter" label="Quarter"><Input /></Form.Item></Col>
                            <Col span={6}><Form.Item name="part" label="Part"><Input /></Form.Item></Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={8}><Form.Item name="score_type" label="Score Type"><Input /></Form.Item></Col>
                            <Col span={8}><Form.Item name="question_form" label="Question Form"><Input /></Form.Item></Col>
                            <Col span={8}><Form.Item name="status" label="Status">
                                <Select options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }]} />
                            </Form.Item></Col>
                        </Row>
                        <Form.Item name="excerpt" label="Excerpt"><TextArea rows={2} /></Form.Item>
                    </Card>

                    {/* Media */}
                    <Card title="Media" className="mb-4">
                        <Row gutter={16}>
                            <Col span={8}><Form.Item name="featured_image" label="Featured Image URL"><Input placeholder="URL hoặc upload path" /></Form.Item></Col>
                            <Col span={8}><Form.Item name="audio_url" label="Audio URL"><Input placeholder="URL file audio" /></Form.Item></Col>
                            <Col span={8}><Form.Item name="pdf_url" label="PDF URL"><Input placeholder="URL file PDF" /></Form.Item></Col>
                        </Row>
                    </Card>
                </Form>

                {/* Passages */}
                <Card
                    title={`Passages (${passages.length})`}
                    className="mb-4"
                    extra={<Button icon={<PlusOutlined />} onClick={addPassage}>Thêm Passage</Button>}
                >
                    <Collapse accordion>
                        {passages.map((passage, pIdx) => (
                            <Panel
                                key={pIdx}
                                header={
                                    <Space>
                                        <span>Passage {pIdx + 1}: {passage.title || "(Chưa đặt tên)"}</span>
                                        <span className="text-gray-400 text-xs">({passage.questions.length} questions)</span>
                                    </Space>
                                }
                                extra={
                                    <Space onClick={(e) => e.stopPropagation()}>
                                        <Button size="small" icon={<ArrowUpOutlined />} disabled={pIdx === 0} onClick={() => movePassage(pIdx, -1)} />
                                        <Button size="small" icon={<ArrowDownOutlined />} disabled={pIdx === passages.length - 1} onClick={() => movePassage(pIdx, 1)} />
                                        <Popconfirm title="Xóa passage?" onConfirm={() => removePassage(pIdx)} okText="Xóa" cancelText="Hủy">
                                            <Button size="small" danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </Space>
                                }
                            >
                                <Row gutter={16}>
                                    <Col span={16}>
                                        <Form.Item label="Title">
                                            <Input value={passage.title ?? ""} onChange={(e) => updatePassage(pIdx, "title", e.target.value)} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                        <Form.Item label="Audio Start">
                                            <InputNumber value={passage.audio_start} onChange={(v) => updatePassage(pIdx, "audio_start", v)} className="w-full" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                        <Form.Item label="Audio End">
                                            <InputNumber value={passage.audio_end} onChange={(v) => updatePassage(pIdx, "audio_end", v)} className="w-full" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Form.Item label="Content (HTML)">
                                    <TextArea rows={6} value={passage.content ?? ""} onChange={(e) => updatePassage(pIdx, "content", e.target.value)} />
                                </Form.Item>

                                <Divider>Questions ({passage.questions.length})</Divider>
                                <Button icon={<PlusOutlined />} onClick={() => addQuestion(pIdx)} className="mb-3">Thêm Question</Button>

                                {passage.questions.map((q, qIdx) => (
                                    <Card
                                        key={qIdx}
                                        size="small"
                                        className="mb-3"
                                        title={
                                            <Space>
                                                <span>Q{qIdx + 1}: {q.title || q.type}</span>
                                                <Tag>{q.type}</Tag>
                                            </Space>
                                        }
                                        extra={
                                            <Space>
                                                <Button size="small" icon={<ArrowUpOutlined />} disabled={qIdx === 0} onClick={() => moveQuestion(pIdx, qIdx, -1)} />
                                                <Button size="small" icon={<ArrowDownOutlined />} disabled={qIdx === passage.questions.length - 1} onClick={() => moveQuestion(pIdx, qIdx, 1)} />
                                                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeQuestion(pIdx, qIdx)} />
                                            </Space>
                                        }
                                    >
                                        <Row gutter={16}>
                                            <Col span={8}>
                                                <Form.Item label="Type">
                                                    <Select value={q.type} onChange={(v) => updateQuestion(pIdx, qIdx, "type", v)} options={QUESTION_TYPES} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item label="Title">
                                                    <Input value={q.title ?? ""} onChange={(e) => updateQuestion(pIdx, qIdx, "title", e.target.value)} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item label="Question Form">
                                                    <Input value={q.question_form ?? ""} onChange={(e) => updateQuestion(pIdx, qIdx, "question_form", e.target.value)} />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Form.Item label="Question Text (HTML)">
                                            <TextArea rows={3} value={q.question_text ?? ""} onChange={(e) => updateQuestion(pIdx, qIdx, "question_text", e.target.value)} />
                                        </Form.Item>
                                        <Form.Item label="Instructions">
                                            <TextArea rows={2} value={q.instructions ?? ""} onChange={(e) => updateQuestion(pIdx, qIdx, "instructions", e.target.value)} />
                                        </Form.Item>

                                        {/* Question type specific editors */}
                                        {(q.type === "radio" || q.type === "select") && (
                                            <RadioSelectEditor
                                                questions={q.list_of_questions ?? []}
                                                onChange={(v) => updateQuestion(pIdx, qIdx, "list_of_questions", v)}
                                            />
                                        )}
                                        {q.type === "fillup" && (
                                            <FillupEditor
                                                explanations={q.explanations ?? []}
                                                onChange={(v) => updateQuestion(pIdx, qIdx, "explanations", v)}
                                            />
                                        )}
                                        {q.type === "checkbox" && (
                                            <CheckboxEditor
                                                options={q.list_of_options ?? []}
                                                onChange={(v) => updateQuestion(pIdx, qIdx, "list_of_options", v)}
                                            />
                                        )}
                                        {q.type === "matching" && (
                                            <MatchingEditor
                                                data={q.matching_question ?? { layout_type: "standard", matching_items: [], answer_options: [] }}
                                                onChange={(v) => updateQuestion(pIdx, qIdx, "matching_question", v)}
                                            />
                                        )}
                                        {q.type === "matrix" && (
                                            <MatrixEditor
                                                data={q.matrix_question ?? { matrix_categories: [], matrix_items: [] }}
                                                onChange={(v) => updateQuestion(pIdx, qIdx, "matrix_question", v)}
                                            />
                                        )}
                                    </Card>
                                ))}
                            </Panel>
                        ))}
                    </Collapse>
                </Card>

                {/* Actions */}
                <Space className="mb-8">
                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => handleSave("draft")}>
                        Lưu nháp
                    </Button>
                    <Button type="primary" style={{ backgroundColor: "#52c41a" }} loading={saving} onClick={() => handleSave("published")}>
                        Xuất bản
                    </Button>
                </Space>
            </div>
        </AdminLayout>
    );
}

// ============================================================================
// Sub-editors for each question type
// ============================================================================

function RadioSelectEditor({ questions, onChange }: {
    questions: { question: string; correct: string; options: { option_text: string }[] }[];
    onChange: (v: typeof questions) => void;
}) {
    const add = () => onChange([...questions, { question: "", correct: "", options: [{ option_text: "" }] }]);
    const remove = (idx: number) => onChange(questions.filter((_, i) => i !== idx));
    const update = (idx: number, field: string, value: unknown) => {
        const arr = [...questions];
        (arr[idx] as Record<string, unknown>)[field] = value;
        onChange(arr);
    };
    const updateOption = (qIdx: number, oIdx: number, value: string) => {
        const arr = [...questions];
        arr[qIdx].options[oIdx] = { option_text: value };
        onChange(arr);
    };
    const addOption = (qIdx: number) => {
        const arr = [...questions];
        arr[qIdx].options.push({ option_text: "" });
        onChange(arr);
    };
    const removeOption = (qIdx: number, oIdx: number) => {
        const arr = [...questions];
        arr[qIdx].options = arr[qIdx].options.filter((_, i) => i !== oIdx);
        onChange(arr);
    };

    return (
        <div className="bg-gray-50 p-3 rounded">
            <Divider orientation="left">Radio/Select Questions</Divider>
            {questions.map((q, idx) => (
                <Card key={idx} size="small" className="mb-2" extra={<Button size="small" danger icon={<DeleteOutlined />} onClick={() => remove(idx)} />}>
                    <Row gutter={8}>
                        <Col span={12}><Input placeholder="Question text" value={q.question} onChange={(e) => update(idx, "question", e.target.value)} /></Col>
                        <Col span={12}><Input placeholder="Correct answer" value={q.correct} onChange={(e) => update(idx, "correct", e.target.value)} /></Col>
                    </Row>
                    <div className="mt-2">
                        {q.options.map((opt, oIdx) => (
                            <Space key={oIdx} className="mb-1 w-full">
                                <Input size="small" placeholder={`Option ${oIdx + 1}`} value={opt.option_text} onChange={(e) => updateOption(idx, oIdx, e.target.value)} style={{ width: 300 }} />
                                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeOption(idx, oIdx)} />
                            </Space>
                        ))}
                        <Button size="small" icon={<PlusOutlined />} onClick={() => addOption(idx)}>Option</Button>
                    </div>
                </Card>
            ))}
            <Button icon={<PlusOutlined />} onClick={add}>Thêm câu hỏi</Button>
        </div>
    );
}

function FillupEditor({ explanations, onChange }: {
    explanations: { content: string }[];
    onChange: (v: typeof explanations) => void;
}) {
    return (
        <div className="bg-gray-50 p-3 rounded">
            <Divider orientation="left">Fill-up Explanations</Divider>
            {explanations.map((e, idx) => (
                <Space key={idx} className="mb-1 w-full">
                    <Input value={e.content} onChange={(ev) => { const arr = [...explanations]; arr[idx] = { content: ev.target.value }; onChange(arr); }} placeholder={`Answer ${idx + 1}`} style={{ width: 400 }} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onChange(explanations.filter((_, i) => i !== idx))} />
                </Space>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => onChange([...explanations, { content: "" }])}>Thêm đáp án</Button>
        </div>
    );
}

function CheckboxEditor({ options, onChange }: {
    options: { option_text: string; correct: boolean }[];
    onChange: (v: typeof options) => void;
}) {
    return (
        <div className="bg-gray-50 p-3 rounded">
            <Divider orientation="left">Checkbox Options</Divider>
            {options.map((o, idx) => (
                <Space key={idx} className="mb-1 w-full">
                    <Input value={o.option_text} onChange={(e) => { const arr = [...options]; arr[idx] = { ...arr[idx], option_text: e.target.value }; onChange(arr); }} placeholder={`Option ${idx + 1}`} style={{ width: 300 }} />
                    <Switch checked={o.correct} onChange={(v) => { const arr = [...options]; arr[idx] = { ...arr[idx], correct: v }; onChange(arr); }} checkedChildren="✓" unCheckedChildren="✗" />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onChange(options.filter((_, i) => i !== idx))} />
                </Space>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => onChange([...options, { option_text: "", correct: false }])}>Thêm option</Button>
        </div>
    );
}

function MatchingEditor({ data, onChange }: {
    data: { layout_type: string; matching_items: { questionPart: string; correctAnswer: string }[]; answer_options: { option_text: string }[]; summary_text?: string };
    onChange: (v: typeof data) => void;
}) {
    const update = (field: string, value: unknown) => onChange({ ...data, [field]: value });

    return (
        <div className="bg-gray-50 p-3 rounded">
            <Divider orientation="left">Matching</Divider>
            <Form.Item label="Layout Type">
                <Select value={data.layout_type} onChange={(v) => update("layout_type", v)} options={MATCHING_LAYOUTS} style={{ width: 200 }} />
            </Form.Item>
            {data.layout_type === "summary" && (
                <Form.Item label="Summary Text">
                    <TextArea rows={3} value={data.summary_text ?? ""} onChange={(e) => update("summary_text", e.target.value)} />
                </Form.Item>
            )}
            <Divider orientation="left" plain>Matching Items</Divider>
            {data.matching_items.map((item, idx) => (
                <Space key={idx} className="mb-1 w-full">
                    <Input placeholder="Question Part" value={item.questionPart} onChange={(e) => { const arr = [...data.matching_items]; arr[idx] = { ...arr[idx], questionPart: e.target.value }; update("matching_items", arr); }} style={{ width: 250 }} />
                    <Input placeholder="Correct Answer" value={item.correctAnswer} onChange={(e) => { const arr = [...data.matching_items]; arr[idx] = { ...arr[idx], correctAnswer: e.target.value }; update("matching_items", arr); }} style={{ width: 200 }} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => update("matching_items", data.matching_items.filter((_, i) => i !== idx))} />
                </Space>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => update("matching_items", [...data.matching_items, { questionPart: "", correctAnswer: "" }])}>Thêm item</Button>

            <Divider orientation="left" plain>Answer Options</Divider>
            {data.answer_options.map((opt, idx) => (
                <Space key={idx} className="mb-1 w-full">
                    <Input placeholder={`Option ${idx + 1}`} value={opt.option_text} onChange={(e) => { const arr = [...data.answer_options]; arr[idx] = { option_text: e.target.value }; update("answer_options", arr); }} style={{ width: 300 }} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => update("answer_options", data.answer_options.filter((_, i) => i !== idx))} />
                </Space>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => update("answer_options", [...data.answer_options, { option_text: "" }])}>Thêm option</Button>
        </div>
    );
}

function MatrixEditor({ data, onChange }: {
    data: { matrix_categories: { category_letter: string; category_text: string }[]; matrix_items: { item_text: string; correct_category_letter: string }[] };
    onChange: (v: typeof data) => void;
}) {
    const update = (field: string, value: unknown) => onChange({ ...data, [field]: value });

    return (
        <div className="bg-gray-50 p-3 rounded">
            <Divider orientation="left">Matrix</Divider>
            <Divider orientation="left" plain>Categories</Divider>
            {data.matrix_categories.map((cat, idx) => (
                <Space key={idx} className="mb-1 w-full">
                    <Input placeholder="Letter (A, B, C...)" value={cat.category_letter} onChange={(e) => { const arr = [...data.matrix_categories]; arr[idx] = { ...arr[idx], category_letter: e.target.value }; update("matrix_categories", arr); }} style={{ width: 120 }} />
                    <Input placeholder="Category text" value={cat.category_text} onChange={(e) => { const arr = [...data.matrix_categories]; arr[idx] = { ...arr[idx], category_text: e.target.value }; update("matrix_categories", arr); }} style={{ width: 300 }} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => update("matrix_categories", data.matrix_categories.filter((_, i) => i !== idx))} />
                </Space>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => update("matrix_categories", [...data.matrix_categories, { category_letter: "", category_text: "" }])}>Thêm category</Button>

            <Divider orientation="left" plain>Items</Divider>
            {data.matrix_items.map((item, idx) => (
                <Space key={idx} className="mb-1 w-full">
                    <Input placeholder="Item text" value={item.item_text} onChange={(e) => { const arr = [...data.matrix_items]; arr[idx] = { ...arr[idx], item_text: e.target.value }; update("matrix_items", arr); }} style={{ width: 300 }} />
                    <Input placeholder="Correct letter" value={item.correct_category_letter} onChange={(e) => { const arr = [...data.matrix_items]; arr[idx] = { ...arr[idx], correct_category_letter: e.target.value }; update("matrix_items", arr); }} style={{ width: 120 }} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => update("matrix_items", data.matrix_items.filter((_, i) => i !== idx))} />
                </Space>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => update("matrix_items", [...data.matrix_items, { item_text: "", correct_category_letter: "" }])}>Thêm item</Button>
        </div>
    );
}

export const getServerSideProps = withAdmin;

