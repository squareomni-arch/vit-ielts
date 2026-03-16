import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Form, Space, Button, Spin, Typography, message, Tag, Alert,
    Card, Select, Switch, Tabs, Badge, Tooltip, Divider,
} from "antd";
import {
    ArrowLeftOutlined, SaveOutlined, CheckCircleOutlined,
    EyeOutlined, FileTextOutlined, SettingOutlined,
    CloudUploadOutlined, WarningOutlined, BookOutlined,
    QuestionCircleOutlined, ClockCircleOutlined,
} from "@ant-design/icons";
import { arrayMove } from "@dnd-kit/sortable";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import { withAdminData } from "@/shared/hoc/withAdmin";
import { supabaseAdmin } from "~supabase/admin";
import {
    QuizEditorForm,
    PassageList,
    DEFAULT_PASSAGE,
    DEFAULT_QUESTION,
} from "@/features/admin-quiz";
import type { PassageData, QuestionData } from "@/features/admin-quiz";

const { Title, Text } = Typography;

type QuizEditorPageProps = {
    initialQuiz?: Record<string, unknown> | null;
    quizId?: string;
};

export default function QuizEditorPage({ initialQuiz, quizId }: QuizEditorPageProps) {
    return <QuizEditor quizId={quizId} initialQuiz={initialQuiz} />;
}

function QuizEditor({ quizId, initialQuiz }: { quizId?: string; initialQuiz?: Record<string, unknown> | null }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    // No loading spinner needed if we have SSR data
    const [loading, setLoading] = useState(!!quizId && !initialQuiz);
    const [passages, setPassages] = useState<PassageData[]>(() => {
        if (initialQuiz?.passages) {
            return (initialQuiz.passages as PassageData[]).map((p: PassageData, idx: number) => ({
                ...p, sort_order: idx,
                questions: (p.questions ?? []).map((q: QuestionData, qIdx: number) => ({ ...q, sort_order: qIdx })),
            }));
        }
        return [{ ...DEFAULT_PASSAGE, sort_order: 0, questions: [] }];
    });
    const isNew = !quizId;

    // ── UX State ──
    const [isDirty, setIsDirty] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [activeTab, setActiveTab] = useState("content");
    const isDirtyRef = useRef(false);
    isDirtyRef.current = isDirty;

    // Track passages changes after initial load
    const initialLoadDone = useRef(false);
    const setPassagesTracked = useCallback((updater: PassageData[] | ((prev: PassageData[]) => PassageData[])) => {
        setPassages(updater);
        if (initialLoadDone.current) setIsDirty(true);
    }, []);

    // Mark form dirty
    const markDirty = useCallback(() => {
        if (initialLoadDone.current) setIsDirty(true);
    }, []);

    // ── Stats ──
    const totalQuestions = useMemo(() => {
        return passages.reduce((sum, p) => sum + (Array.isArray(p.questions) ? p.questions.length : 0), 0);
    }, [passages]);

    const questionTypeCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        passages.forEach(p => {
            (Array.isArray(p.questions) ? p.questions : []).forEach(q => {
                counts[q.type] = (counts[q.type] || 0) + 1;
            });
        });
        return counts;
    }, [passages]);

    // Watch form values for sidebar
    const currentStatus = Form.useWatch("status", form);
    const currentSkill = Form.useWatch("skill", form);
    const currentType = Form.useWatch("type", form);
    const currentSlug = Form.useWatch("slug", form);

    // Hydrate form from SSR data on mount (if available)
    useEffect(() => {
        if (initialQuiz) {
            const quiz = initialQuiz as Record<string, unknown>;
            form.setFieldsValue({
                title: quiz.title, slug: quiz.slug, excerpt: quiz.excerpt,
                type: quiz.type, skill: quiz.skill, time_minutes: quiz.time_minutes,
                pro_user_only: quiz.pro_user_only, score_type: quiz.score_type,
                featured_image: quiz.featured_image, audio_url: quiz.audio_url,
                pdf_url: quiz.pdf_url, source: quiz.source, year: quiz.year,
                quarter: quiz.quarter, part: quiz.part, question_form: quiz.question_form,
                status: quiz.status,
            });
            if (quiz.slug) setSlugManuallyEdited(true);
            setIsDirty(false);
            setSaveError(null);
            setTimeout(() => { initialLoadDone.current = true; }, 0);
        } else if (quizId) {
            fetchQuiz(); // Fallback: client-side fetch if no SSR data
        } else {
            initialLoadDone.current = true;
        }
    }, [quizId]);

    // ── Unsaved changes: beforeunload ──
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!isDirtyRef.current) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    // ── Unsaved changes: Next.js route change ──
    useEffect(() => {
        const handler = () => {
            if (isDirtyRef.current && !window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời trang?')) {
                router.events.emit('routeChangeError');
                throw 'Route change aborted due to unsaved changes';
            }
        };
        router.events.on('routeChangeStart', handler);
        return () => router.events.off('routeChangeStart', handler);
    }, [router]);

    // ── Keyboard shortcuts ──
    const handleSaveRef = useRef(handleSave);
    handleSaveRef.current = handleSave;

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (e.shiftKey) {
                    handleSaveRef.current('published');
                } else {
                    handleSaveRef.current('draft');
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // ── Data fetching ──
    async function fetchQuiz() {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/quizzes/${quizId}`);
            const json = await res.json();
            if (json.success) {
                const quiz = json.data;
                form.setFieldsValue({
                    title: quiz.title, slug: quiz.slug, excerpt: quiz.excerpt,
                    type: quiz.type, skill: quiz.skill, time_minutes: quiz.time_minutes,
                    pro_user_only: quiz.pro_user_only, score_type: quiz.score_type,
                    featured_image: quiz.featured_image, audio_url: quiz.audio_url,
                    pdf_url: quiz.pdf_url, source: quiz.source, year: quiz.year,
                    quarter: quiz.quarter, part: quiz.part, question_form: quiz.question_form,
                    status: quiz.status,
                });
                setPassages(
                    quiz.passages?.map((p: PassageData, idx: number) => ({
                        ...p, sort_order: idx,
                        questions: (p.questions ?? []).map((q: QuestionData, qIdx: number) => ({ ...q, sort_order: qIdx })),
                    })) ?? [{ ...DEFAULT_PASSAGE, sort_order: 0, questions: [] }]
                );
                if (quiz.slug) setSlugManuallyEdited(true);
                setIsDirty(false);
                setSaveError(null);
                setTimeout(() => { initialLoadDone.current = true; }, 0);
            }
        } catch {
            message.error("Error loading quiz");
        } finally {
            setLoading(false);
        }
    }

    // ── Save handler ──
    async function handleSave(status?: string) {
        try {
            const values = await form.validateFields();
            setSaving(true);
            setSaveError(null);

            const payload = {
                ...values,
                status: status || values.status || "draft",
                passages: passages.map((p, pIdx) => ({
                    ...(p.id ? { id: p.id } : {}),
                    title: p.title ?? null, content: p.content ?? null, sort_order: pIdx,
                    audio_start: p.audio_start ?? null, audio_end: p.audio_end ?? null,
                    questions: (p.questions ?? []).map((q, qIdx) => ({
                        ...(q.id ? { id: q.id } : {}),
                        type: q.type, title: q.title ?? null, question_text: q.question_text ?? null,
                        instructions: q.instructions ?? null, question_form: q.question_form ?? null,
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
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const json = await res.json();

            if (json.success) {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                setLastSavedAt(timeStr);
                setIsDirty(false);
                setSaveError(null);
                message.success(isNew ? "Tạo quiz thành công" : `Đã lưu lúc ${timeStr}`);
                if (isNew && json.data?.id) router.push(`/admin/quizzes/${json.data.id}`);
            } else {
                const errorMsg = json.error || "Error saving quiz";
                setSaveError(errorMsg);
                message.error(errorMsg);
            }
        } catch (err) {
            if (err && typeof err === "object" && "errorFields" in err) {
                const fieldErr = err as { errorFields: { name: string[]; errors: string[] }[] };
                const details = fieldErr.errorFields.map(f => `${f.name.join('.')}: ${f.errors.join(', ')}`).join(' | ');
                setSaveError(`Thiếu thông tin: ${details}`);
                message.error("Vui lòng điền đầy đủ thông tin bắt buộc");
                // Switch to settings tab if there are form validation errors
                setActiveTab("settings");
            } else {
                setSaveError("Lỗi không xác định khi lưu quiz");
                message.error("Error saving quiz");
            }
        } finally {
            setSaving(false);
        }
    }

    // --- Passage helpers ---
    const addPassage = useCallback(() => setPassagesTracked((prev: PassageData[]) => [...prev, { ...DEFAULT_PASSAGE, sort_order: prev.length, questions: [] }]), [setPassagesTracked]);
    const removePassage = useCallback((idx: number) => setPassagesTracked((prev: PassageData[]) => prev.filter((_, i) => i !== idx)), [setPassagesTracked]);
    const reorderPassages = useCallback((oldIndex: number, newIndex: number) => setPassagesTracked((prev: PassageData[]) => arrayMove(prev, oldIndex, newIndex)), [setPassagesTracked]);
    const updatePassage = useCallback((idx: number, field: string, value: unknown) => {
        setPassagesTracked((prev: PassageData[]) => {
            const arr = [...prev];
            (arr[idx] as Record<string, unknown>)[field] = value;
            return arr;
        });
    }, [setPassagesTracked]);

    // --- Question helpers ---
    const addQuestion = useCallback((pIdx: number) => {
        setPassagesTracked((prev: PassageData[]) => {
            const arr = [...prev];
            arr[pIdx] = {
                ...arr[pIdx],
                questions: [...arr[pIdx].questions, { ...DEFAULT_QUESTION, sort_order: arr[pIdx].questions.length, list_of_questions: [] }],
            };
            return arr;
        });
    }, [setPassagesTracked]);
    const removeQuestion = useCallback((pIdx: number, qIdx: number) => {
        setPassagesTracked((prev: PassageData[]) => {
            const arr = [...prev];
            arr[pIdx] = {
                ...arr[pIdx],
                questions: arr[pIdx].questions.filter((_, i) => i !== qIdx),
            };
            return arr;
        });
    }, [setPassagesTracked]);
    const updateQuestion = useCallback((pIdx: number, qIdx: number, field: string, value: unknown) => {
        setPassagesTracked((prev: PassageData[]) => {
            const arr = [...prev];
            const questions = [...arr[pIdx].questions];
            questions[qIdx] = { ...questions[qIdx], [field]: value };
            arr[pIdx] = { ...arr[pIdx], questions };
            return arr;
        });
    }, [setPassagesTracked]);
    const reorderQuestions = useCallback((pIdx: number, oldIndex: number, newIndex: number) => {
        setPassagesTracked((prev: PassageData[]) => {
            const arr = [...prev];
            arr[pIdx] = {
                ...arr[pIdx],
                questions: arrayMove(arr[pIdx].questions, oldIndex, newIndex),
            };
            return arr;
        });
    }, [setPassagesTracked]);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center" style={{ minHeight: 400 }}><Spin size="large" /></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="quiz-editor-page">
                {/* ═══ STICKY TOP BAR ═══ */}
                <div className="quiz-editor-topbar">
                    <div className="quiz-editor-topbar-left">
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => router.push("/admin/quizzes")}
                            type="text"
                            className="quiz-editor-back-btn"
                        />
                        <div className="quiz-editor-topbar-title">
                            <Title level={4} style={{ margin: 0, fontSize: 18 }}>
                                {isNew ? "Tạo Quiz mới" : "Chỉnh sửa Quiz"}
                            </Title>
                            <div className="quiz-editor-topbar-meta">
                                {currentStatus === "published" ? (
                                    <Tag color="green" icon={<CheckCircleOutlined />}>Đã xuất bản</Tag>
                                ) : (
                                    <Tag color="default">Bản nháp</Tag>
                                )}
                                {isDirty && <Tag color="orange" icon={<WarningOutlined />}>Chưa lưu</Tag>}
                                {lastSavedAt && !isDirty && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                                        Lưu lúc {lastSavedAt}
                                    </Text>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="quiz-editor-topbar-actions">
                        <Tooltip title="Ctrl+S">
                            <Button
                                icon={<SaveOutlined />}
                                loading={saving}
                                disabled={saving}
                                onClick={() => handleSave("draft")}
                            >
                                Lưu nháp
                            </Button>
                        </Tooltip>
                        <Tooltip title="Ctrl+Shift+S">
                            <Button
                                type="primary"
                                icon={<CloudUploadOutlined />}
                                loading={saving}
                                disabled={saving}
                                onClick={() => handleSave("published")}
                                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                            >
                                Xuất bản
                            </Button>
                        </Tooltip>
                        {!isNew && currentSlug && currentStatus === "published" && (
                            <Tooltip title="Xem trước">
                                <Button
                                    icon={<EyeOutlined />}
                                    href={`/ielts-practice/${currentSlug}`}
                                    target="_blank"
                                />
                            </Tooltip>
                        )}
                    </div>
                </div>

                {/* Error banner */}
                {saveError && (
                    <Alert
                        message="Lỗi khi lưu"
                        description={saveError}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setSaveError(null)}
                        style={{ marginBottom: 16 }}
                    />
                )}

                {/* ═══ TWO-COLUMN LAYOUT ═══ */}
                <div className="quiz-editor-layout">
                    {/* ── MAIN CONTENT (LEFT) ── */}
                    <div className="quiz-editor-main">
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            type="card"
                            size="large"
                            items={[
                                {
                                    key: "content",
                                    label: (
                                        <span>
                                            <BookOutlined /> Nội dung
                                            <Badge
                                                count={totalQuestions}
                                                style={{ marginLeft: 8, backgroundColor: '#1890ff' }}
                                                overflowCount={999}
                                                showZero
                                            />
                                        </span>
                                    ),
                                    children: (
                                        <div className="quiz-editor-tab-content">
                                            <PassageList
                                                passages={passages}
                                                onAdd={addPassage}
                                                onRemove={removePassage}
                                                onReorder={reorderPassages}
                                                onUpdatePassage={updatePassage}
                                                onAddQuestion={addQuestion}
                                                onRemoveQuestion={removeQuestion}
                                                onUpdateQuestion={updateQuestion}
                                                onReorderQuestions={reorderQuestions}
                                            />
                                        </div>
                                    ),
                                },
                                {
                                    key: "settings",
                                    label: (
                                        <span>
                                            <SettingOutlined /> Cài đặt
                                        </span>
                                    ),
                                    children: (
                                        <div className="quiz-editor-tab-content">
                                            <QuizEditorForm
                                                form={form}
                                                saving={saving}
                                                isNew={isNew}
                                                onValuesChange={markDirty}
                                                slugManuallyEdited={slugManuallyEdited}
                                                onSlugManuallyEdited={setSlugManuallyEdited}
                                            />
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </div>

                    {/* ── SIDEBAR (RIGHT) ── */}
                    <div className="quiz-editor-sidebar">
                        {/* Publish box */}
                        <Card
                            size="small"
                            title={
                                <span style={{ fontWeight: 600 }}>
                                    <CloudUploadOutlined style={{ marginRight: 6 }} />
                                    Xuất bản
                                </span>
                            }
                            className="quiz-editor-sidebar-card"
                        >
                            <div className="quiz-sidebar-field">
                                <Text type="secondary" className="quiz-sidebar-label">Trạng thái</Text>
                                <Form form={form}>
                                    <Form.Item name="status" noStyle>
                                        <Select
                                            style={{ width: "100%" }}
                                            disabled={saving}
                                            options={[
                                                { value: "draft", label: "📝 Bản nháp" },
                                                { value: "published", label: "✅ Đã xuất bản" },
                                            ]}
                                            onChange={() => markDirty()}
                                        />
                                    </Form.Item>
                                </Form>
                            </div>
                            <Divider style={{ margin: "12px 0" }} />
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <Button
                                    block
                                    type="primary"
                                    icon={<CloudUploadOutlined />}
                                    loading={saving}
                                    onClick={() => handleSave("published")}
                                    style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                                >
                                    Xuất bản
                                </Button>
                                <Button
                                    block
                                    icon={<SaveOutlined />}
                                    loading={saving}
                                    onClick={() => handleSave("draft")}
                                >
                                    Lưu bản nháp
                                </Button>
                            </Space>
                        </Card>

                        {/* Quiz Info summary */}
                        <Card
                            size="small"
                            title={
                                <span style={{ fontWeight: 600 }}>
                                    <FileTextOutlined style={{ marginRight: 6 }} />
                                    Thông tin Quiz
                                </span>
                            }
                            className="quiz-editor-sidebar-card"
                        >
                            <div className="quiz-sidebar-info">
                                <div className="quiz-sidebar-info-row">
                                    <Text type="secondary">Skill</Text>
                                    <Tag color={currentSkill === "reading" ? "blue" : "purple"}>
                                        {currentSkill === "reading" ? "📖 Reading" : "🎧 Listening"}
                                    </Tag>
                                </div>
                                <div className="quiz-sidebar-info-row">
                                    <Text type="secondary">Type</Text>
                                    <Tag color={currentType === "exam" ? "red" : "cyan"}>
                                        {currentType === "exam" ? "📋 Exam" : "✏️ Practice"}
                                    </Tag>
                                </div>
                                <div className="quiz-sidebar-info-row">
                                    <Text type="secondary">Passages</Text>
                                    <Text strong>{passages.length}</Text>
                                </div>
                                <div className="quiz-sidebar-info-row">
                                    <Text type="secondary">Tổng câu hỏi</Text>
                                    <Text strong>{totalQuestions}</Text>
                                </div>
                            </div>
                        </Card>

                        {/* Question breakdown */}
                        {totalQuestions > 0 && (
                            <Card
                                size="small"
                                title={
                                    <span style={{ fontWeight: 600 }}>
                                        <QuestionCircleOutlined style={{ marginRight: 6 }} />
                                        Phân loại câu hỏi
                                    </span>
                                }
                                className="quiz-editor-sidebar-card"
                            >
                                <div className="quiz-sidebar-question-types">
                                    {Object.entries(questionTypeCounts).map(([type, count]) => {
                                        const colors: Record<string, string> = {
                                            radio: "blue", select: "cyan", fillup: "green",
                                            checkbox: "orange", matching: "purple", matrix: "magenta",
                                        };
                                        return (
                                            <div key={type} className="quiz-sidebar-qtype-row">
                                                <Tag color={colors[type] || "default"}>{type}</Tag>
                                                <Text strong>{count}</Text>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        )}

                        {/* Keyboard shortcuts */}
                        <Card
                            size="small"
                            title={
                                <span style={{ fontWeight: 600 }}>
                                    <ClockCircleOutlined style={{ marginRight: 6 }} />
                                    Phím tắt
                                </span>
                            }
                            className="quiz-editor-sidebar-card"
                        >
                            <div className="quiz-sidebar-shortcuts">
                                <div className="quiz-sidebar-shortcut-row">
                                    <kbd>Ctrl</kbd> + <kbd>S</kbd>
                                    <Text type="secondary">Lưu nháp</Text>
                                </div>
                                <div className="quiz-sidebar-shortcut-row">
                                    <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>
                                    <Text type="secondary">Xuất bản</Text>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .quiz-editor-page {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    margin: -24px -24px 0;
                    padding: 0;
                }

                /* ── Top bar ── */
                .quiz-editor-topbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 24px;
                    background: #fff;
                    border-bottom: 1px solid #f0f0f0;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    gap: 16px;
                }

                .quiz-editor-topbar-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 0;
                }

                .quiz-editor-topbar-title {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }

                .quiz-editor-topbar-meta {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .quiz-editor-topbar-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-shrink: 0;
                }

                /* ── Two-column layout ── */
                .quiz-editor-layout {
                    display: flex;
                    gap: 20px;
                    padding: 20px 24px;
                    align-items: flex-start;
                }

                .quiz-editor-main {
                    flex: 1;
                    min-width: 0;
                }

                .quiz-editor-tab-content {
                    padding-top: 4px;
                }

                /* ── Sidebar ── */
                .quiz-editor-sidebar {
                    width: 280px;
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    position: sticky;
                    top: 80px;
                }

                .quiz-sidebar-field {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .quiz-sidebar-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .quiz-sidebar-info {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .quiz-sidebar-info-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .quiz-sidebar-question-types {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .quiz-sidebar-qtype-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .quiz-sidebar-shortcuts {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .quiz-sidebar-shortcut-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                }

                .quiz-sidebar-shortcut-row kbd {
                    background: #f5f5f5;
                    border: 1px solid #d9d9d9;
                    border-radius: 4px;
                    padding: 1px 6px;
                    font-family: monospace;
                    font-size: 11px;
                    color: #333;
                    box-shadow: 0 1px 1px rgba(0,0,0,0.06);
                }

                @media (max-width: 1024px) {
                    .quiz-editor-layout {
                        flex-direction: column;
                    }

                    .quiz-editor-sidebar {
                        width: 100%;
                        position: static;
                        flex-direction: row;
                        flex-wrap: wrap;
                    }
                }

                @media (max-width: 768px) {
                    .quiz-editor-topbar {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                    }

                    .quiz-editor-topbar-actions {
                        width: 100%;
                        justify-content: flex-end;
                    }
                }
            `}</style>

            <style jsx global>{`
                .quiz-editor-sidebar-card {
                    border-radius: 8px !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important;
                }

                .quiz-editor-sidebar-card .ant-card-head {
                    min-height: auto !important;
                    padding: 10px 16px !important;
                    background: #fafafa !important;
                    border-radius: 8px 8px 0 0 !important;
                }

                .quiz-editor-sidebar-card .ant-card-head-title {
                    padding: 0 !important;
                    font-size: 13px !important;
                }

                .quiz-editor-sidebar-card .ant-card-body {
                    padding: 14px 16px !important;
                }

                .quiz-editor-back-btn:hover {
                    background: #f5f5f5 !important;
                }

                /* Tab card styling */
                .quiz-editor-main .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
                    border-radius: 8px 8px 0 0 !important;
                    padding: 8px 20px !important;
                    font-weight: 500 !important;
                }

                .quiz-editor-main .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
                    border-bottom-color: #fff !important;
                    font-weight: 600 !important;
                }
            `}</style>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdminData(async (context) => {
    const quizId = context.params?.id as string | undefined;
    if (!quizId) return { quizId: undefined, initialQuiz: null };

    try {
        const { data, error } = await supabaseAdmin
            .from("quizzes")
            .select(`*, passages(*, questions(*))`)
            .eq("id", quizId)
            .single();

        if (error || !data) return { quizId, initialQuiz: null };

        // Sort passages and questions by sort_order
        if (data.passages) {
            data.passages.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
            data.passages.forEach((p: { questions?: { sort_order: number }[] }) => {
                if (p.questions) {
                    p.questions.sort((a, b) => a.sort_order - b.sort_order);
                }
            });
        }

        return { quizId, initialQuiz: data };
    } catch {
        return { quizId, initialQuiz: null };
    }
});
