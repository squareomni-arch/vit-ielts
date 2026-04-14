import { useCallback, useEffect, useRef, useState } from "react";
import {
    Form, Button, Spin, Typography, message, Alert, Space,
    Input, Select, Tag, Tooltip, Popconfirm,
} from "antd";
import {
    ArrowLeftOutlined, SaveOutlined, PlusOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
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
    reading_test_id: string;
    listening_test_id: string;
};

type MockTestEditorPageProps = {
    mockTestId?: string;
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

// ---------------------------------------------------------------------------
// Editor component
// ---------------------------------------------------------------------------
function MockTestEditor({ mockTestId }: MockTestEditorPageProps) {
    const router = useRouter();
    const [form] = Form.useForm();
    const isNew = !mockTestId;

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

    const [practiceTests, setPracticeTests] = useState<PracticeTestRow[]>([]);
    const [quizOptions, setQuizOptions] = useState<QuizOption[]>([]);
    const [quizOptionsLoading, setQuizOptionsLoading] = useState(false);

    const isDirtyRef = useRef(false);
    isDirtyRef.current = isDirty;

    const currentTitle = Form.useWatch("title", form);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    // Auto-generate slug from title
    useEffect(() => {
        if (!slugManuallyEdited && currentTitle) {
            const baseSlug = slugify(currentTitle);
            if (baseSlug && isNew) {
                form.setFieldValue("slug", baseSlug);
            }
        }
    }, [currentTitle, slugManuallyEdited, isNew, form]);

    // Load quiz options for Select (reading + listening)
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
                    setPracticeTests(mt.practice_tests ?? []);
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
    }, [mockTestId, isNew, form]);

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
                practice_tests: practiceTests,
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
                router.push("/admin/mock-tests");
            } else {
                message.error(json.error);
            }
        } catch {
            message.error("Lỗi khi xóa");
        }
    };

    // Practice tests management
    const addPracticeTestRow = () => {
        setIsDirty(true);
        setPracticeTests(prev => [...prev, { reading_test_id: "", listening_test_id: "" }]);
    };

    const updatePracticeTestRow = (idx: number, field: keyof PracticeTestRow, value: string) => {
        setIsDirty(true);
        setPracticeTests(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: value };
            return next;
        });
    };

    const removePracticeTestRow = (idx: number) => {
        setIsDirty(true);
        setPracticeTests(prev => prev.filter((_, i) => i !== idx));
    };

    // Quiz option helpers
    const readingOptions = quizOptions
        .filter(q => q.skill === "reading")
        .map(q => ({ value: q.id, label: q.title }));
    const listeningOptions = quizOptions
        .filter(q => q.skill === "listening")
        .map(q => ({ value: q.id, label: q.title }));

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
            <div className="max-w-[860px] mx-auto pb-20">
                {/* ── Top Bar ── */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 24px",
                        background: "var(--admin-surface)",
                        position: "sticky",
                        top: 0,
                        zIndex: 100,
                        marginTop: 24,
                        borderRadius: 8,
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                        gap: 16,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => router.push("/admin/mock-tests")}
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
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                            >
                                <Button danger icon={<DeleteOutlined />}>Xóa</Button>
                            </Popconfirm>
                        )}
                    </Space>
                </div>

                {saveError && (
                    <Alert
                        message="Lỗi khi lưu"
                        description={saveError}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setSaveError(null)}
                        style={{ marginTop: 16 }}
                    />
                )}

                {/* ── Basic Info ── */}
                <AdminGlassCard style={{ marginTop: 24 }}>
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
                        >
                            <Input
                                placeholder="cambridge-ielts-16-test-1"
                                onChange={() => setSlugManuallyEdited(true)}
                            />
                        </Form.Item>
                    </Form>
                </AdminGlassCard>

                {/* ── Practice Tests ── */}
                <AdminGlassCard style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <Title level={5} style={{ margin: 0 }}>
                            Practice Tests{" "}
                            <Tag color="blue" style={{ fontSize: 12, fontWeight: 400 }}>
                                {practiceTests.length} bài
                            </Tag>
                        </Title>
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={addPracticeTestRow}
                        >
                            Thêm cặp bài thi
                        </Button>
                    </div>

                    {practiceTests.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "32px 0",
                                color: "#999",
                                border: "1px dashed #d9d9d9",
                                borderRadius: 8,
                            }}
                        >
                            <p>Chưa có practice test nào.</p>
                            <p style={{ fontSize: 13 }}>
                                Mỗi cặp gồm 1 Reading quiz + 1 Listening quiz.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {practiceTests.map((pt, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr auto",
                                        gap: 12,
                                        alignItems: "center",
                                        padding: "12px 16px",
                                        background: "var(--admin-bg, #f9fafb)",
                                        borderRadius: 8,
                                        border: "1px solid var(--admin-border, #e5e7eb)",
                                    }}
                                >
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                                            📖 Reading Quiz
                                        </Text>
                                        <Select
                                            style={{ width: "100%" }}
                                            placeholder="Chọn Reading quiz..."
                                            value={pt.reading_test_id || undefined}
                                            onChange={(v) => updatePracticeTestRow(idx, "reading_test_id", v)}
                                            options={readingOptions}
                                            showSearch
                                            filterOption={(input, option) =>
                                                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                                            }
                                            loading={quizOptionsLoading}
                                            allowClear
                                        />
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                                            🎧 Listening Quiz
                                        </Text>
                                        <Select
                                            style={{ width: "100%" }}
                                            placeholder="Chọn Listening quiz..."
                                            value={pt.listening_test_id || undefined}
                                            onChange={(v) => updatePracticeTestRow(idx, "listening_test_id", v)}
                                            options={listeningOptions}
                                            showSearch
                                            filterOption={(input, option) =>
                                                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                                            }
                                            loading={quizOptionsLoading}
                                            allowClear
                                        />
                                    </div>
                                    <Tooltip title="Xóa cặp này">
                                        <Button
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => removePracticeTestRow(idx)}
                                        />
                                    </Tooltip>
                                </div>
                            ))}
                        </div>
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
    // Wait until router is ready to avoid rendering with undefined id
    if (!router.isReady) return null;
    return <MockTestEditor mockTestId={mockTestId} />;
}

export const getServerSideProps = withAdmin;
