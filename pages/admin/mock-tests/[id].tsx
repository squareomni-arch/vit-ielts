import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Form, Button, Spin, Typography, message, Alert, Space,
    Input, Select, Tag, Tooltip, Popconfirm, Empty,
} from "antd";
import {
    ArrowLeftOutlined, SaveOutlined, PlusOutlined,
    DeleteOutlined, HolderOutlined, BookOutlined,
} from "@ant-design/icons";
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext, sortableKeyboardCoordinates,
    verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import {
    restrictToVerticalAxis, restrictToWindowEdges,
    restrictToFirstScrollableAncestor,
} from "@dnd-kit/modifiers";
import { arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { AdminGlassCard } from "@/widgets/admin";

const { Title, Text } = Typography;

type QuizOption = {
    id: string;
    title: string;
    skill: string;
    type: string;
};

type PracticeTestRow = {
    _uid: string;
    reading_test_id: string;
    listening_test_id: string;
};

type ParentCollection = {
    id: string;
    title: string;
    slug: string;
};

// ---------------------------------------------------------------------------
// Helper: slugify
// ---------------------------------------------------------------------------
function slugify(text: string): string {
    const dm: Record<string, string> = {
        à:"a",á:"a",ả:"a",ã:"a",ạ:"a",ă:"a",ằ:"a",ắ:"a",ẳ:"a",ẵ:"a",ặ:"a",
        â:"a",ầ:"a",ấ:"a",ẩ:"a",ẫ:"a",ậ:"a",đ:"d",
        è:"e",é:"e",ẻ:"e",ẽ:"e",ẹ:"e",ê:"e",ề:"e",ế:"e",ể:"e",ễ:"e",ệ:"e",
        ì:"i",í:"i",ỉ:"i",ĩ:"i",ị:"i",
        ò:"o",ó:"o",ỏ:"o",õ:"o",ọ:"o",ô:"o",ồ:"o",ố:"o",ổ:"o",ỗ:"o",ộ:"o",
        ơ:"o",ờ:"o",ớ:"o",ở:"o",ỡ:"o",ợ:"o",
        ù:"u",ú:"u",ủ:"u",ũ:"u",ụ:"u",ư:"u",ừ:"u",ứ:"u",ử:"u",ữ:"u",ự:"u",
        ỳ:"y",ý:"y",ỷ:"y",ỹ:"y",ỵ:"y",
    };
    return text.toLowerCase().split("").map(ch => dm[ch] || ch).join("")
        .replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-").replace(/^-|-$/g, "");
}

let _uidSeq = 0;
function newUid() { return `pt-${++_uidSeq}-${Date.now()}`; }

// ---------------------------------------------------------------------------
// Sortable Practice Test Pair
// ---------------------------------------------------------------------------
function PracticeTestPairItem({
    pair,
    index,
    readingOptions,
    listeningOptions,
    quizOptionsLoading,
    onChange,
    onRemove,
}: {
    pair: PracticeTestRow;
    index: number;
    readingOptions: { value: string; label: string }[];
    listeningOptions: { value: string; label: string }[];
    quizOptionsLoading: boolean;
    onChange: (field: "reading_test_id" | "listening_test_id", value: string) => void;
    onRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pair._uid });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 100 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div style={{
                display: "grid",
                gridTemplateColumns: "auto auto 1fr 1fr auto",
                gap: 12,
                alignItems: "center",
                padding: "12px 16px",
                background: "var(--admin-bg, #f9fafb)",
                borderRadius: 8,
                border: isDragging
                    ? "2px dashed var(--admin-primary, #1677ff)"
                    : "1px solid var(--admin-border, #e5e7eb)",
                marginBottom: 10,
            }}>
                {/* Drag handle */}
                <span
                    {...listeners}
                    style={{ cursor: "grab", color: "#bbb", padding: "0 2px" }}
                    title="Kéo để sắp xếp"
                >
                    <HolderOutlined />
                </span>

                {/* Index */}
                <span style={{
                    fontSize: 11, fontWeight: 700,
                    background: "var(--admin-surface, #fff)",
                    border: "1px solid var(--admin-border, #e5e7eb)",
                    borderRadius: 4, padding: "2px 8px",
                    color: "var(--admin-text-secondary, #6b7280)",
                    minWidth: 28, textAlign: "center",
                }}>
                    {index + 1}
                </span>

                {/* Reading */}
                <div>
                    <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
                        📖 Reading Quiz
                    </Text>
                    <Select
                        style={{ width: "100%" }}
                        placeholder="Chọn Reading quiz..."
                        value={pair.reading_test_id || undefined}
                        onChange={(v) => onChange("reading_test_id", v)}
                        options={readingOptions}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                        loading={quizOptionsLoading}
                        allowClear
                    />
                </div>

                {/* Listening */}
                <div>
                    <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
                        🎧 Listening Quiz
                    </Text>
                    <Select
                        style={{ width: "100%" }}
                        placeholder="Chọn Listening quiz..."
                        value={pair.listening_test_id || undefined}
                        onChange={(v) => onChange("listening_test_id", v)}
                        options={listeningOptions}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                        loading={quizOptionsLoading}
                        allowClear
                    />
                </div>

                {/* Remove */}
                <Tooltip title="Xóa cặp này">
                    <Button danger icon={<DeleteOutlined />} onClick={onRemove} />
                </Tooltip>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Editor component
// ---------------------------------------------------------------------------
function MockTestEditor({ mockTestId }: { mockTestId?: string }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const isNew = !mockTestId;

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    const [practiceTests, setPracticeTests] = useState<PracticeTestRow[]>([]);
    const [quizOptions, setQuizOptions] = useState<QuizOption[]>([]);
    const [quizOptionsLoading, setQuizOptionsLoading] = useState(false);

    // Parent collections that contain this mock test
    const [parentCollections, setParentCollections] = useState<ParentCollection[]>([]);

    const isDirtyRef = useRef(false);
    isDirtyRef.current = isDirty;

    const currentTitle = Form.useWatch("title", form);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const sortableIds = useMemo(() => practiceTests.map(pt => pt._uid), [practiceTests]);

    // Auto-generate slug from title
    useEffect(() => {
        if (!slugManuallyEdited && currentTitle) {
            const s = slugify(currentTitle);
            if (s && isNew) form.setFieldValue("slug", s);
        }
    }, [currentTitle, slugManuallyEdited, isNew, form]);

    // Load quiz options
    const loadQuizOptions = useCallback(async () => {
        setQuizOptionsLoading(true);
        try {
            const res = await fetch("/api/admin/quizzes?pageSize=500");
            const json = await res.json();
            if (json.success) setQuizOptions(json.data);
        } catch {
            // silent
        } finally {
            setQuizOptionsLoading(false);
        }
    }, []);

    // Load parent collections (which collections reference this mock test)
    const loadParentCollections = useCallback(async (id: string) => {
        try {
            const res = await fetch("/api/admin/mock-test-collections?pageSize=500");
            const json = await res.json();
            if (json.success) {
                const parents = json.data.filter(
                    (c: { id: string; title: string; slug: string; mock_test_ids: string[] }) =>
                        (c.mock_test_ids ?? []).includes(id)
                );
                setParentCollections(parents.map((c: { id: string; title: string; slug: string }) => ({
                    id: c.id, title: c.title, slug: c.slug,
                })));
            }
        } catch {
            // silent
        }
    }, []);

    useEffect(() => { loadQuizOptions(); }, [loadQuizOptions]);

    // Load existing mock test
    useEffect(() => {
        if (isNew) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/mock-tests/${mockTestId}`);
                const json = await res.json();
                if (json.success) {
                    const mt = json.data;
                    form.setFieldsValue({ title: mt.title, slug: mt.slug });
                    setPracticeTests(
                        (mt.practice_tests ?? []).map((pt: { reading_test_id: string; listening_test_id: string }) => ({
                            ...pt,
                            _uid: newUid(),
                        }))
                    );
                    if (mt.slug) setSlugManuallyEdited(true);
                    setIsDirty(false);
                }
            } catch {
                message.error("Lỗi khi tải Mock Test");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        loadParentCollections(mockTestId!);
    }, [mockTestId, isNew, form, loadParentCollections]);

    // Warn before leave
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!isDirtyRef.current) return;
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, []);

    // Ctrl+S
    const handleSaveRef = useRef(handleSave);
    handleSaveRef.current = handleSave;
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                handleSaveRef.current();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    async function handleSave() {
        try {
            const values = await form.validateFields();
            setSaving(true);
            setSaveError(null);

            const payload = {
                title: values.title,
                slug: values.slug,
                practice_tests: practiceTests.map(({ _uid, ...pt }) => pt),
            };

            const url = isNew ? "/api/admin/mock-tests" : `/api/admin/mock-tests/${mockTestId}`;
            const method = isNew ? "POST" : "PUT";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();

            if (json.success) {
                const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                setLastSavedAt(timeStr);
                setIsDirty(false);
                message.success(isNew ? "Tạo Mock Test thành công" : `Đã lưu lúc ${timeStr}`);
                if (isNew && json.data?.id) {
                    router.push(`/admin/mock-tests/${json.data.id}`);
                }
            } else {
                setSaveError(json.error || "Lỗi khi lưu");
                message.error(json.error || "Lỗi khi lưu");
            }
        } catch (err) {
            if (err && typeof err === "object" && "errorFields" in err) {
                message.error("Vui lòng điền đầy đủ thông tin bắt buộc");
            } else {
                setSaveError("Lỗi không xác định khi lưu.");
            }
        } finally {
            setSaving(false);
        }
    }

    const handleDelete = async () => {
        if (!mockTestId) return;
        try {
            const res = await fetch(`/api/admin/mock-tests/${mockTestId}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                message.success("Đã xóa Mock Test");
                router.push("/admin/mock-test-collections");
            } else {
                message.error(json.error);
            }
        } catch {
            message.error("Lỗi khi xóa");
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = sortableIds.indexOf(String(active.id));
        const newIndex = sortableIds.indexOf(String(over.id));
        if (oldIndex !== -1 && newIndex !== -1) {
            setPracticeTests(prev => arrayMove(prev, oldIndex, newIndex));
            setIsDirty(true);
        }
    };

    const addPracticeTestRow = () => {
        setIsDirty(true);
        setPracticeTests(prev => [...prev, { _uid: newUid(), reading_test_id: "", listening_test_id: "" }]);
    };

    const updatePracticeTestRow = (uid: string, field: "reading_test_id" | "listening_test_id", value: string) => {
        setIsDirty(true);
        setPracticeTests(prev => prev.map(pt => pt._uid === uid ? { ...pt, [field]: value } : pt));
    };

    const removePracticeTestRow = (uid: string) => {
        setIsDirty(true);
        setPracticeTests(prev => prev.filter(pt => pt._uid !== uid));
    };

    const readingOptions = quizOptions
        .filter(q => q.skill === "reading")
        .map(q => ({ value: q.id, label: q.title }));
    const listeningOptions = quizOptions
        .filter(q => q.skill === "listening")
        .map(q => ({ value: q.id, label: q.title }));

    if (loading && !isNew) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64"><Spin size="large" /></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-[900px] mx-auto pb-20">
                {/* ── Top Bar ── */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 24px", background: "var(--admin-surface)",
                    position: "sticky", top: 0, zIndex: 100,
                    marginTop: 24, borderRadius: 8,
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", gap: 16,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => router.push("/admin/mock-test-collections")}
                            type="text"
                        />
                        <div>
                            <Title level={4} style={{ margin: 0 }}>
                                {currentTitle || (isNew ? "Tạo Mock Test mới" : "Chỉnh sửa Mock Test")}
                            </Title>
                            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                {isDirty && <Tag color="orange">Chưa lưu</Tag>}
                                {lastSavedAt && !isDirty && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>Lưu lúc {lastSavedAt}</Text>
                                )}
                            </div>
                        </div>
                    </div>

                    <Space>
                        <Button
                            type={isDirty || isNew ? "primary" : "default"}
                            icon={<SaveOutlined />}
                            loading={saving}
                            disabled={!isDirty && !isNew}
                            onClick={handleSave}
                        >
                            Save
                        </Button>
                        {!isNew && (
                            <Popconfirm
                                title="Xóa mock test này?"
                                description="Hành động này không thể hoàn tác."
                                onConfirm={handleDelete}
                                okText="Xóa" cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                            >
                                <Button danger icon={<DeleteOutlined />}>Xóa</Button>
                            </Popconfirm>
                        )}
                    </Space>
                </div>

                {saveError && (
                    <Alert
                        message="Lỗi khi lưu" description={saveError}
                        type="error" showIcon closable
                        onClose={() => setSaveError(null)}
                        style={{ marginTop: 16 }}
                    />
                )}

                {/* ── Parent Collections (read-only) ── */}
                {!isNew && (
                    <AdminGlassCard style={{ marginTop: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <BookOutlined style={{ color: "var(--admin-text-secondary)" }} />
                            <Text type="secondary" style={{ fontSize: 13 }}>Thuộc Collection:</Text>
                            {parentCollections.length === 0 ? (
                                <Tag color="default">Chưa gán vào Collection nào</Tag>
                            ) : (
                                parentCollections.map(c => (
                                    <Tag
                                        key={c.id}
                                        color="purple"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => router.push(`/admin/mock-test-collections/${c.id}`)}
                                    >
                                        {c.title} ↗
                                    </Tag>
                                ))
                            )}
                        </div>
                    </AdminGlassCard>
                )}

                {/* ── Basic Info ── */}
                <AdminGlassCard style={{ marginTop: 16 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>Thông tin cơ bản</Title>
                    <Form
                        form={form}
                        layout="vertical"
                        onValuesChange={() => setIsDirty(true)}
                    >
                        <Form.Item
                            name="title"
                            label={<Text strong>Tên Mock Test <Text type="danger">*</Text></Text>}
                            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                        >
                            <Input placeholder="VD: Cambridge IELTS 16 Test 1" size="large" />
                        </Form.Item>

                        <Form.Item
                            name="slug"
                            label={<Text strong>Slug</Text>}
                            rules={[{ required: true, message: "Slug không được trống" }]}
                            className="mb-0"
                        >
                            <Input
                                placeholder="cambridge-ielts-16-test-1"
                                onChange={() => setSlugManuallyEdited(true)}
                            />
                        </Form.Item>
                    </Form>
                </AdminGlassCard>

                {/* ── Practice Tests (DnD) ── */}
                <AdminGlassCard style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <div>
                            <Title level={5} style={{ margin: 0 }}>
                                Practice Tests{" "}
                                <Tag color="blue" style={{ fontSize: 12, fontWeight: 400 }}>
                                    {practiceTests.length} bài
                                </Tag>
                            </Title>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Mỗi bài gồm 1 Reading + 1 Listening quiz. Kéo thả để sắp xếp.
                            </Text>
                        </div>
                        <Button type="dashed" icon={<PlusOutlined />} onClick={addPracticeTestRow}>
                            Thêm cặp bài thi
                        </Button>
                    </div>

                    {practiceTests.length === 0 ? (
                        <Empty
                            description={
                                <span style={{ fontSize: 13 }}>
                                    Chưa có Practice Test.{" "}
                                    <Button type="link" size="small" onClick={addPracticeTestRow}>
                                        Thêm ngay →
                                    </Button>
                                </span>
                            }
                            style={{ padding: "24px 0" }}
                        />
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToVerticalAxis, restrictToWindowEdges, restrictToFirstScrollableAncestor]}
                        >
                            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                                {practiceTests.map((pt, idx) => (
                                    <PracticeTestPairItem
                                        key={pt._uid}
                                        pair={pt}
                                        index={idx}
                                        readingOptions={readingOptions}
                                        listeningOptions={listeningOptions}
                                        quizOptionsLoading={quizOptionsLoading}
                                        onChange={(field, value) => updatePracticeTestRow(pt._uid, field, value)}
                                        onRemove={() => removePracticeTestRow(pt._uid)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </AdminGlassCard>
            </div>
        </AdminLayout>
    );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------
export default function MockTestEditorPage() {
    const router = useRouter();
    const mockTestId = router.query.id as string | undefined;
    if (!router.isReady) return null;
    return <MockTestEditor mockTestId={mockTestId} />;
}

export const getServerSideProps = withAdmin;
