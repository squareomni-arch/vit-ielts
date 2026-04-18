import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Form, Space, Button, Spin, Typography, message, Tag, Alert, Tooltip } from "antd";
import { ArrowLeftOutlined, SaveOutlined, CheckCircleOutlined, EyeOutlined, CloudUploadOutlined, WarningOutlined } from "@ant-design/icons";
import { arrayMove } from "@dnd-kit/sortable";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import { supabaseAdmin } from "~supabase/admin";
import {
    QuizEditorForm,
    DEFAULT_PASSAGE,
    DEFAULT_QUESTION,
} from "@/features/admin-quiz";
import type { PassageData, QuestionData } from "@/features/admin-quiz";
import PassageListCard from "@/features/admin-quiz/PassageListCard";
import QuestionListCard from "@/features/admin-quiz/QuestionListCard";

const { Title, Text } = Typography;

type QuizEditorPageProps = {
    initialQuiz?: Record<string, unknown> | null;
    quizId?: string;
};

export default function QuizEditorPage() {
    const router = useRouter();
    const id = router.query.id as string | undefined;

    // Don't render editor until router is ready (id resolved)
    if (!router.isReady) return null;

    return <QuizEditor quizId={id} />;
}

function QuizEditor({ quizId }: { quizId?: string }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!!quizId);
    const [passages, setPassages] = useState<PassageData[]>([]);
    const isNew = !quizId;

    // ── UX State ──
    const [isDirty, setIsDirty] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const isDirtyRef = useRef(false);
    isDirtyRef.current = isDirty;

    const initialLoadDone = useRef(false);
    const setPassagesTracked = useCallback((updater: PassageData[] | ((prev: PassageData[]) => PassageData[])) => {
        setPassages(updater);
        if (initialLoadDone.current) setIsDirty(true);
    }, []);

    const markDirty = useCallback(() => {
        if (initialLoadDone.current) setIsDirty(true);
    }, []);

    const currentStatus = Form.useWatch("status", form);
    const currentSlug = Form.useWatch("slug", form);
    const currentSkill = Form.useWatch("skill", form);
    const currentTitle = Form.useWatch("title", form);
    const currentType = Form.useWatch("type", form);
    const currentPro = Form.useWatch("pro_user_only", form);

    useEffect(() => {
        initialLoadDone.current = false;
        setSaveError(null);
        setIsDirty(false);
        setLastSavedAt(null);
        setSlugManuallyEdited(false);

        if (quizId) {
            fetchQuiz();
        } else {
            form.resetFields();
            setPassages([]);
            initialLoadDone.current = true;
        }
    }, [quizId]);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!isDirtyRef.current) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    useEffect(() => {
        const handler = (url: string) => {
            if (url.startsWith('/admin/quizzes')) return;
            if (isDirtyRef.current && !window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời trang?')) {
                router.events.emit('routeChangeError');
                throw 'Route change aborted due to unsaved changes';
            }
        };
        router.events.on('routeChangeStart', handler);
        return () => router.events.off('routeChangeStart', handler);
    }, [router]);

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
                    tests_taken: quiz.tests_taken ?? 0, views: quiz.views ?? 0,
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
                    })) ?? []
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
                        explanations: (q.type === "fillup" || q.explanations) ? q.explanations ?? null : null, // Send explanations for all types if present
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
            setSaveError("Thiếu thông tin hoặc lỗi không xác định khi lưu quiz.");
            message.error("Vui lòng điền đầy đủ thông tin bắt buộc");
        } finally {
            setSaving(false);
        }
    }

    // --- Passage handlers ---
    const addPassage = useCallback((data: PassageData) => setPassagesTracked((prev: PassageData[]) => [...prev, { ...data, sort_order: prev.length, questions: [] }]), [setPassagesTracked]);
    const updatePassage = useCallback((idx: number, data: PassageData) => setPassagesTracked((prev) => {
        const arr = [...prev];
        arr[idx] = { ...arr[idx], ...data };
        return arr;
    }), [setPassagesTracked]);
    const removePassage = useCallback((idx: number) => setPassagesTracked((prev: PassageData[]) => prev.filter((_, i) => i !== idx)), [setPassagesTracked]);
    const reorderPassages = useCallback((oldIndex: number, newIndex: number) => setPassagesTracked((prev: PassageData[]) => arrayMove(prev, oldIndex, newIndex)), [setPassagesTracked]);

    // --- Question handlers ---
    const addQuestion = useCallback((pIdx: number, data: QuestionData) => {
        setPassagesTracked((prev: PassageData[]) => {
            const arr = [...prev];
            arr[pIdx] = {
                ...arr[pIdx],
                questions: [...(arr[pIdx].questions || []), { ...data, sort_order: (arr[pIdx].questions || []).length }],
            };
            return arr;
        });
    }, [setPassagesTracked]);
    const updateQuestion = useCallback((pIdx: number, qIdx: number, data: QuestionData) => {
        setPassagesTracked((prev: PassageData[]) => {
            const arr = [...prev];
            const p = { ...arr[pIdx] };
            const qs = [...(p.questions || [])];
            qs[qIdx] = { ...qs[qIdx], ...data };
            p.questions = qs;
            arr[pIdx] = p;
            return arr;
        });
    }, [setPassagesTracked]);
    const removeQuestion = useCallback((pIdx: number, qIdx: number) => {
        setPassagesTracked((prev: PassageData[]) => {
            const arr = [...prev];
            const p = { ...arr[pIdx] };
            const qs = [...(p.questions || [])];
            qs.splice(qIdx, 1);
            p.questions = qs;
            arr[pIdx] = p;
            return arr;
        });
    }, [setPassagesTracked]);
    const reorderQuestions = useCallback((pIdx: number, oldIndex: number, newIndex: number) => {
        setPassagesTracked((prev: PassageData[]) => {
            const arr = [...prev];
            const p = { ...arr[pIdx] };
            p.questions = arrayMove(p.questions || [], oldIndex, newIndex);
            arr[pIdx] = p;
            return arr;
        });
    }, [setPassagesTracked]);


    if (loading && !isNew) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <Spin size="large" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="quiz-editor-page max-w-[1200px] mx-auto pb-20">
                {/* ═══ STICKY TOP BAR ═══ */}
                <div className="quiz-editor-topbar">
                    <div className="flex items-center">
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => router.push("/admin/quizzes")}
                            type="text"
                            className="mr-2 text-gray-400 hover:text-gray-800"
                        />
                        <div className="w-12 h-12 mr-4 flex items-center justify-center bg-gray-50 rounded-lg">
                            {currentSkill === "listening" ? (
                                <img src="/assets/figma/icons/listen%201.svg" alt="Listening" className="w-8 h-8 opacity-70" />
                            ) : (
                                <img src="/assets/figma/icons/reading-book%201.svg" alt="Reading" className="w-8 h-8 opacity-70" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-semibold m-0 text-gray-800">
                                {currentTitle || (isNew ? "Tạo Quiz mới" : "Chỉnh sửa Quiz")}
                                {currentType && (
                                    <>
                                        {" - "}
                                        <span className="text-[#ff2a55] capitalize">{currentType}</span>
                                    </>
                                )}
                                {currentPro && (
                                    <span className="bg-[#ff2a55] text-white font-semibold text-xs py-0.5 rounded px-1 ml-2 uppercase align-middle">
                                        Pro
                                    </span>
                                )}
                            </h1>
                            {/* Meta statuses like published, dirty, last saved underneath title for utility */}
                            <div className="flex items-center gap-2 mt-1">
                                {currentStatus === "published" ? (
                                    <Tag color="green" bordered={false}>Đã xuất bản</Tag>
                                ) : (
                                    <Tag color="default" bordered={false}>Bản nháp</Tag>
                                )}
                                {isDirty && <Tag color="orange" bordered={false}>Chưa lưu</Tag>}
                                {lastSavedAt && !isDirty && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Lưu lúc {lastSavedAt}
                                    </Text>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Always show Save as Primary per screenshot, with Save icon */}
                        <Button
                            type={isDirty || isNew ? "primary" : "default"}
                            icon={<SaveOutlined />}
                            loading={saving}
                            disabled={!isDirty && !isNew}
                            onClick={() => handleSave(currentStatus)}
                        >
                            <span className="text-base">Save</span>
                        </Button>
                        {!isNew && currentSlug && (
                            <Tooltip title="Xem trước">
                                <Button
                                    icon={<EyeOutlined />}
                                    href={`${currentType === "practice" ? `/ielts-practice-library/${currentSlug}` : `/ielts-exam-library/${currentSlug}`}?preview=true`}
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
                        className="my-4"
                    />
                )}

                {/* ═══ MAIN EDITOR (SINGLE COLUMN) ═══ */}
                <div className="quiz-editor-layout mt-6 space-y-6">
                    {/* 1. Quiz Settings / Basic Edit */}
                    <QuizEditorForm
                        form={form}
                        saving={saving}
                        isNew={isNew}
                        currentSkill={currentSkill}
                        onValuesChange={markDirty}
                        slugManuallyEdited={slugManuallyEdited}
                        onSlugManuallyEdited={setSlugManuallyEdited}
                    />

                    {/* 2. Passages List */}
                    <PassageListCard
                        passages={passages}
                        skill={currentSkill}
                        onAdd={addPassage}
                        onRemove={removePassage}
                        onUpdate={updatePassage}
                        onReorder={reorderPassages}
                    />

                    {/* 3. Questions List */}
                    <QuestionListCard
                        passages={passages}
                        onAddQuestion={addQuestion}
                        onRemoveQuestion={removeQuestion}
                        onUpdateQuestion={updateQuestion}
                        onReorderQuestions={reorderQuestions}
                    />
                </div>
            </div>

            <style jsx>{`
                .quiz-editor-topbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 24px;
                    background: var(--admin-surface);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    gap: 16px;
                    margin-top: 24px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .quiz-editor-topbar-left {
                    display: flex;
                    align-items: center;
                }
            `}</style>
        </AdminLayout>
    );
}
