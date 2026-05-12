import { useEffect, useState, useCallback } from "react";
import {
    Table, Tag, Input, Space, Button, Select, message, Popconfirm,
    Modal, Form, Switch, InputNumber, Typography, Steps, Radio, Divider, Spin, Alert, Tooltip,
} from "antd";
import {
    PlusOutlined, SearchOutlined, EditOutlined, CopyOutlined,
    DeleteOutlined, ReadOutlined, CustomerServiceOutlined, FormOutlined,
    AppstoreAddOutlined, CheckCircleOutlined, FolderOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { useAdminPermissions } from "@/shared/hooks";
import { AdminPageHeader, AdminGlassCard } from "@/widgets/admin";

const { TextArea } = Input;
const { Text } = Typography;

type QuizRow = {
    id: string;
    title: string;
    slug: string;
    skill: string;
    type: string;
    status: string;
    tests_taken: number;
    pro_user_only: boolean;
    created_at: string;
};

// ---------------------------------------------------------------------------
// Slugify helper
// ---------------------------------------------------------------------------
function slugify(text: string): string {
    const dm: Record<string, string> = {
        'à':'a','á':'a','ả':'a','ã':'a','ạ':'a',
        'ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a',
        'â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a',
        'đ':'d',
        'è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e',
        'ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e',
        'ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
        'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o',
        'ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o',
        'ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o',
        'ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u',
        'ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u',
        'ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y',
    };
    return text.toLowerCase().split('').map(ch => dm[ch] || ch).join('')
        .replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Add Quiz Modal component
// ---------------------------------------------------------------------------
function AddQuizModal({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (id: string) => void;
}) {
    const [form] = Form.useForm();
    const [selectekill, setSelectekill] = useState<"reading" | "listening">("reading");
    const [creating, setCreating] = useState(false);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setCreating(true);

            const title = values.title?.trim();
            const baseSlug = slugify(title);
            const uniqueSuffix = Date.now().toString(36).slice(-5);
            const payload = {
                title,
                slug: baseSlug ? `${baseSlug}-${uniqueSuffix}` : `quiz-${uniqueSuffix}`,
                skill: selectekill,
                type: values.type || "practice",
                pro_user_only: values.pro_user_only || false,
                excerpt: values.excerpt || "",
                time_minutes: values.time_minutes || 60,
                status: "draft",
                passages: [{ title: "", content: "", sort_order: 0, questions: [] }],
            };

            const res = await fetch("/api/admin/quizzes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();

            if (json.success && json.data?.id) {
                message.success("Đã tạo quiz mới");
                form.resetFields();
                setSelectekill("reading");
                onCreated(json.data.id);
            } else {
                message.error(json.error || "Lỗi khi tạo quiz");
            }
        } catch (err) {
            if (err && typeof err === "object" && "errorFields" in err) {
                // Form validation error — don't show extra message
            } else {
                message.error("Lỗi khi tạo quiz");
            }
        } finally {
            setCreating(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectekill("reading");
        onClose();
    };

    return (
        <Modal
            title="Add Quiz"
            open={open}
            onCancel={handleCancel}
            width={520}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Cancel
                </Button>,
                <Button
                    key="ok"
                    type="primary"
                    loading={creating}
                    onClick={handleOk}
                    style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                >
                    OK
                </Button>,
            ]}
            destroyOnClose
        >
            {/* ── Skill Tabs ── */}
            <div className="add-quiz-skill-tabs">
                <div
                    className={`add-quiz-skill-tab ${selectekill === "reading" ? "active" : ""}`}
                    onClick={() => setSelectekill("reading")}
                >
                    <ReadOutlined style={{ fontSize: 28 }} />
                    <span>Reading</span>
                </div>
                <div
                    className={`add-quiz-skill-tab ${selectekill === "listening" ? "active" : ""}`}
                    onClick={() => setSelectekill("listening")}
                >
                    <CustomerServiceOutlined style={{ fontSize: 28 }} />
                    <span>Listening</span>
                </div>
            </div>

            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    type: "practice",
                    pro_user_only: false,
                    time_minutes: 60,
                }}
            >
                <Form.Item
                    name="title"
                    label={<Text strong>Quiz title <Text type="danger">*</Text></Text>}
                    rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
                >
                    <Input placeholder="Title" size="large" />
                </Form.Item>

                <Form.Item
                    name="type"
                    label={<Text strong>Quiz type <Text type="danger">*</Text></Text>}
                >
                    <Select
                        size="large"
                        options={[
                            { value: "academic", label: "Academic" },
                            { value: "general", label: "General" },
                            { value: "practice", label: "Practice" },
                        ]}
                    />
                </Form.Item>

                <Form.Item
                    name="pro_user_only"
                    label={<Text strong>Pro</Text>}
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>

                <Form.Item
                    name="excerpt"
                    label={<Text strong>Short description (Optional)</Text>}
                >
                    <TextArea
                        rows={3}
                        placeholder="Short description (Optional)"
                    />
                </Form.Item>

                <Form.Item
                    name="time_minutes"
                    label={<Text strong>Time (minutes)</Text>}
                >
                    <InputNumber
                        min={0}
                        max={180}
                        addonAfter="minutes"
                        style={{ width: "100%" }}
                        size="large"
                    />
                </Form.Item>
            </Form>

            <style jsx>{`
                .add-quiz-skill-tabs {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    margin-bottom: 24px;
                    padding: 8px 0;
                }

                .add-quiz-skill-tab {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    padding: 16px 28px;
                    border: 2px solid #e8e8e8;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #999;
                    font-size: 14px;
                    font-weight: 500;
                    min-width: 100px;
                }

                .add-quiz-skill-tab:hover {
                    border-color: #b7e4c7;
                    color: #52c41a;
                }

                .add-quiz-skill-tab.active {
                    border-color: #52c41a;
                    color: #52c41a;
                    background: #f6ffed;
                    box-shadow: 0 0 0 1px #52c41a;
                }
            `}</style>
        </Modal>
    );
}

// ---------------------------------------------------------------------------
// Add to Mock Test Modal (2-step: Mock Test → Collection)
// ---------------------------------------------------------------------------
type PracticeTestEntry = {
    reading_test_id: string;
    listening_test_id: string;
};

type MockTestRow = { id: string; title: string; practice_tests: PracticeTestEntry[] };
type CollectionRow = { id: string; title: string; mock_test_ids: string[] };
type CompanionQuiz = { id: string; title: string; skill: string };

function AddToMockTestModal({
    quiz,
    onClose,
}: {
    quiz: QuizRow | null;
    onClose: () => void;
}) {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [saving, setSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [completed, setCompleted] = useState(false);

    // Step 1 state
    const [mockTestMode, setMockTestMode] = useState<"new" | "existing">("new");
    const [newMockTestTitle, setNewMockTestTitle] = useState("");
    const [selectedMockTestId, setSelectedMockTestId] = useState<string | undefined>();
    const [companionQuizId, setCompanionQuizId] = useState<string | undefined>();
    const [mockTests, setMockTests] = useState<MockTestRow[]>([]);
    const [companionQuizzes, setCompanionQuizzes] = useState<CompanionQuiz[]>([]);

    // Step 2 state
    const [collectionMode, setCollectionMode] = useState<"new" | "existing" | "skip">("skip");
    const [newCollectionTitle, setNewCollectionTitle] = useState("");
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>();
    const [collections, setCollections] = useState<CollectionRow[]>([]);

    // Persisted mock test ID from step 1 → used in step 2
    const [resolvedMockTestId, setResolvedMockTestId] = useState<string | null>(null);
    const [resolvedMockTestTitle, setResolvedMockTestTitle] = useState<string>("");
    const [resolvedCollectionId, setResolvedCollectionId] = useState<string | null>(null);
    const [resolvedCollectionTitle, setResolvedCollectionTitle] = useState<string>("");

    const companionSkill = quiz?.skill === "reading" ? "listening" : "reading";
    const primaryQuizField = quiz?.skill === "reading" ? "reading_test_id" : "listening_test_id";

    const handleClose = () => {
        setCompleted(false);
        setResolvedCollectionId(null);
        setResolvedCollectionTitle("");
        onClose();
    };

    // Load reference data when modal opens
    useEffect(() => {
        if (!quiz) return;
        setStep(1);
        setCompleted(false);
        setMockTestMode("new");
        setNewMockTestTitle("");
        setSelectedMockTestId(undefined);
        setCompanionQuizId(undefined);
        setCollectionMode("skip");
        setNewCollectionTitle("");
        setSelectedCollectionId(undefined);
        setResolvedMockTestId(null);
        setResolvedMockTestTitle("");
        setResolvedCollectionId(null);
        setResolvedCollectionTitle("");

        setLoadingData(true);
        Promise.all([
            fetch("/api/admin/mock-tests?pageSize=200").then(r => r.json()),
            fetch(`/api/admin/quizzes?pageSize=500&skill=${companionSkill}`).then(r => r.json()),
            fetch("/api/admin/mock-test-collections?pageSize=200").then(r => r.json()),
        ]).then(([mt, cq, col]) => {
            setMockTests(mt.data || []);
            setCompanionQuizzes(cq.data || []);
            setCollections(col.data || []);
        }).catch(() => {
            message.error("Không tải được dữ liệu");
        }).finally(() => setLoadingData(false));
    }, [quiz, companionSkill]);

    // ── Step 1: confirm Mock Test ──────────────────────────────────────────
    const handleStep1Next = async () => {
        if (mockTestMode === "new" && !newMockTestTitle.trim()) {
            message.warning("Vui lòng nhập tiêu đề Mock Test");
            return;
        }
        if (mockTestMode === "existing" && !selectedMockTestId) {
            message.warning("Vui lòng chọn Mock Test");
            return;
        }

        setSaving(true);
        try {
            let mockTestId: string;
            let mockTestTitle: string;
            const normalizedCompanionQuizId = companionQuizId || "";

            const newEntry = {
                reading_test_id: quiz!.skill === "reading" ? quiz!.id : normalizedCompanionQuizId,
                listening_test_id: quiz!.skill === "listening" ? quiz!.id : normalizedCompanionQuizId,
            };

            if (mockTestMode === "new") {
                // 1. Create mock test
                const createRes = await fetch("/api/admin/mock-tests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: newMockTestTitle.trim() }),
                });
                const createJson = await createRes.json();
                if (!createJson.success) throw new Error(createJson.error);
                mockTestId = createJson.data.id;
                mockTestTitle = newMockTestTitle.trim();

                // 2. Add the practice test entry
                const updateRes = await fetch(`/api/admin/mock-tests/${mockTestId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ practice_tests: [newEntry] }),
                });
                const updateJson = await updateRes.json();
                if (!updateJson.success) throw new Error(updateJson.error);
            } else {
                mockTestId = selectedMockTestId!;
                const found = mockTests.find(m => m.id === mockTestId);
                mockTestTitle = found?.title || "";

                // Fetch current practice_tests then append
                const mtRes = await fetch(`/api/admin/mock-tests/${mockTestId}`);
                const mtJson = await mtRes.json();
                if (!mtJson.success) throw new Error(mtJson.error);
                const existing: PracticeTestEntry[] = mtJson.data.practice_tests || [];
                const alreadyAdded = existing.some((entry) => entry[primaryQuizField] === quiz!.id);

                if (alreadyAdded) {
                    message.info("Quiz này đã nằm trong Mock Test đã chọn. Tiếp tục bước gán Collection.");
                    setResolvedMockTestId(mockTestId);
                    setResolvedMockTestTitle(mockTestTitle);
                    setStep(2);
                    return;
                }

                const updateRes = await fetch(`/api/admin/mock-tests/${mockTestId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ practice_tests: [...existing, newEntry] }),
                });
                const updateJson = await updateRes.json();
                if (!updateJson.success) throw new Error(updateJson.error);
            }

            setResolvedMockTestId(mockTestId);
            setResolvedMockTestTitle(mockTestTitle);
            setStep(2);
        } catch (err) {
            message.error("Lỗi: " + (err instanceof Error ? err.message : "Không xác định"));
        } finally {
            setSaving(false);
        }
    };

    // ── Step 2: confirm Collection ─────────────────────────────────────────
    const handleStep2Finish = async () => {
        if (collectionMode === "skip") {
            message.success(`Đã thêm quiz vào Mock Test "${resolvedMockTestTitle}" thành công!`);
            setResolvedCollectionId(null);
            setResolvedCollectionTitle("");
            setCompleted(true);
            return;
        }
        if (collectionMode === "new" && !newCollectionTitle.trim()) {
            message.warning("Vui lòng nhập tiêu đề Collection");
            return;
        }
        if (collectionMode === "existing" && !selectedCollectionId) {
            message.warning("Vui lòng chọn Collection");
            return;
        }

        setSaving(true);
        try {
            let colId: string;
            let colTitle: string;

            if (collectionMode === "new") {
                const createRes = await fetch("/api/admin/mock-test-collections", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: newCollectionTitle.trim() }),
                });
                const createJson = await createRes.json();
                if (!createJson.success) throw new Error(createJson.error);
                colId = createJson.data.id;
                colTitle = newCollectionTitle.trim();

                const updateRes = await fetch(`/api/admin/mock-test-collections/${colId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mock_test_ids: [resolvedMockTestId] }),
                });
                const updateJson = await updateRes.json();
                if (!updateJson.success) throw new Error(updateJson.error);
            } else {
                colId = selectedCollectionId!;
                colTitle = collections.find((collection) => collection.id === colId)?.title || "";
                const colRes = await fetch(`/api/admin/mock-test-collections/${colId}`);
                const colJson = await colRes.json();
                if (!colJson.success) throw new Error(colJson.error);
                const existingIds: string[] = colJson.data.mock_test_ids || [];

                if (!existingIds.includes(resolvedMockTestId!)) {
                    const updateRes = await fetch(`/api/admin/mock-test-collections/${colId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ mock_test_ids: [...existingIds, resolvedMockTestId] }),
                    });
                    const updateJson = await updateRes.json();
                    if (!updateJson.success) throw new Error(updateJson.error);
                } else {
                    message.info("Mock Test này đã có trong Collection đã chọn");
                }
            }

            message.success("Hoàn tất! Quiz đã được thêm vào Mock Test và Collection.");
            setResolvedCollectionId(colId);
            setResolvedCollectionTitle(colTitle);
            setCompleted(true);
        } catch (err) {
            message.error("Lỗi: " + (err instanceof Error ? err.message : "Không xác định"));
        } finally {
            setSaving(false);
        }
    };

    if (!quiz) return null;

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <AppstoreAddOutlined style={{ color: "#1890ff" }} />
                    <span>Thêm vào Mock Test</span>
                </div>
            }
            open={!!quiz}
            onCancel={handleClose}
            width={580}
            destroyOnClose
            footer={
                completed ? (
                    <div className="flex justify-between">
                        <Button onClick={handleClose}>Đóng</Button>
                        <div className="flex gap-2">
                            {resolvedCollectionId ? (
                                <Button onClick={() => router.push(`/admin/mock-test-collections/${resolvedCollectionId}`)}>
                                    Mở Collection
                                </Button>
                            ) : null}
                            {resolvedMockTestId ? (
                                <Button type="primary" onClick={() => router.push(`/admin/mock-tests/${resolvedMockTestId}`)}>
                                    Mở Mock Test
                                </Button>
                            ) : null}
                        </div>
                    </div>
                ) : step === 1 ? (
                    <div className="flex justify-end gap-2">
                        <Button onClick={handleClose}>Hủy</Button>
                        <Button type="primary" loading={saving} onClick={handleStep1Next}>
                            Tiếp theo →
                        </Button>
                    </div>
                ) : (
                    <div className="flex justify-between">
                        <Button onClick={() => setStep(1)} disabled={saving}>← Quay lại</Button>
                        <div className="flex gap-2">
                            <Button onClick={handleClose}>Hủy</Button>
                            <Button type="primary" loading={saving} onClick={handleStep2Finish}>
                                {collectionMode === "skip" ? "Hoàn tất" : "Xác nhận"}
                            </Button>
                        </div>
                    </div>
                )
            }
        >
            {/* Progress steps */}
            <Steps
                current={step - 1}
                size="small"
                className="mb-6"
                items={[
                    { title: "Mock Test", icon: <ReadOutlined /> },
                    { title: "Collection", icon: <FolderOutlined /> },
                ]}
            />

            {loadingData ? (
                <div className="flex justify-center py-8">
                    <Spin tip="Đang tải dữ liệu..." />
                </div>
            ) : completed ? (
                <div className="space-y-4">
                    <Alert
                        message="Đã xử lý xong"
                        description={
                            <div className="space-y-2">
                                <div>
                                    Quiz đã được thêm vào Mock Test: <strong>{resolvedMockTestTitle}</strong>
                                </div>
                                {resolvedCollectionId ? (
                                    <div>
                                        Mock Test hiện thuộc Collection: <strong>{resolvedCollectionTitle}</strong>
                                    </div>
                                ) : (
                                    <div>Chưa gán vào Collection nào.</div>
                                )}
                            </div>
                        }
                        type="success"
                        showIcon
                    />
                    <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                        Bạn có thể mở ngay editor của Mock Test hoặc Collection để tiếp tục chỉnh sửa.
                    </div>
                </div>
            ) : (
                <>
                    {/* ── STEP 1: Mock Test ── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            {/* Quiz being added */}
                            <Alert
                                message={
                                    <span>
                                        Quiz: <strong>{quiz.title}</strong>{" "}
                                        <Tag color={quiz.skill === "reading" ? "blue" : "purple"}>
                                            {quiz.skill}
                                        </Tag>
                                    </span>
                                }
                                type="info"
                                showIcon
                            />

                            {/* Mode selector */}
                            <div>
                                <p className="font-medium mb-2 text-sm text-gray-600">Chọn Mock Test</p>
                                <Radio.Group
                                    value={mockTestMode}
                                    onChange={e => { setMockTestMode(e.target.value); setSelectedMockTestId(undefined); setNewMockTestTitle(""); }}
                                    className="w-full"
                                >
                                    <div className="grid grid-cols-2 gap-2">
                                        <Radio.Button value="new" className="text-center h-auto py-3">
                                            <div className="flex flex-col items-center gap-1">
                                                <PlusOutlined />
                                                <span className="text-xs">Tạo Mock Test mới</span>
                                            </div>
                                        </Radio.Button>
                                        <Radio.Button value="existing" className="text-center h-auto py-3">
                                            <div className="flex flex-col items-center gap-1">
                                                <AppstoreAddOutlined />
                                                <span className="text-xs">Chọn Mock Test có sẵn</span>
                                            </div>
                                        </Radio.Button>
                                    </div>
                                </Radio.Group>
                            </div>

                            {/* New mock test: title input */}
                            {mockTestMode === "new" && (
                                <div>
                                    <p className="text-sm font-medium mb-1">Tiêu đề Mock Test mới <span className="text-red-500">*</span></p>
                                    <Input
                                        placeholder="VD: IELTS Practice Test 2024"
                                        value={newMockTestTitle}
                                        onChange={e => setNewMockTestTitle(e.target.value)}
                                        size="large"
                                        allowClear
                                    />
                                </div>
                            )}

                            {/* Existing mock test: select dropdown */}
                            {mockTestMode === "existing" && (
                                <div>
                                    <p className="text-sm font-medium mb-1">Chọn Mock Test <span className="text-red-500">*</span></p>
                                    <Select
                                        showSearch
                                        placeholder="Tìm và chọn Mock Test..."
                                        value={selectedMockTestId}
                                        onChange={v => setSelectedMockTestId(v)}
                                        style={{ width: "100%" }}
                                        size="large"
                                        optionFilterProp="label"
                                        options={mockTests.map(mt => ({
                                            value: mt.id,
                                            label: `${mt.title} (${mt.practice_tests?.length ?? 0} cặp)`,
                                        }))}
                                        notFoundContent="Không tìm thấy Mock Test"
                                    />
                                </div>
                            )}

                            <Divider className="my-3" />

                            {/* Companion quiz */}
                            <div>
                                <p className="text-sm font-medium mb-1">
                                    Quiz {companionSkill} đi kèm{" "}
                                    <Tag color={companionSkill === "reading" ? "blue" : "purple"}>{companionSkill}</Tag>
                                    <span className="text-gray-400 font-normal ml-1">(tùy chọn)</span>
                                </p>
                                <Select
                                    showSearch
                                    allowClear
                                    placeholder={`Chọn quiz ${companionSkill} ghép cặp...`}
                                    value={companionQuizId}
                                    onChange={v => setCompanionQuizId(v)}
                                    style={{ width: "100%" }}
                                    size="large"
                                    optionFilterProp="label"
                                    options={companionQuizzes.map(q => ({
                                        value: q.id,
                                        label: q.title,
                                    }))}
                                    notFoundContent={`Không có quiz ${companionSkill}`}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Mỗi Practice Test gồm một quiz reading + một quiz listening. Bỏ trống nếu chưa có.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Collection ── */}
                    {step === 2 && (
                        <div className="space-y-4">
                            {/* Summary of step 1 */}
                            <Alert
                                message={
                                    <span>
                                        <CheckCircleOutlined className="text-green-500 mr-1" />
                                        Đã thêm vào Mock Test: <strong>{resolvedMockTestTitle}</strong>
                                    </span>
                                }
                                type="success"
                            />

                            <div>
                                <p className="font-medium mb-2 text-sm text-gray-600">
                                    Thêm Mock Test này vào Collection? <span className="text-gray-400 font-normal">(không bắt buộc)</span>
                                </p>
                                <Radio.Group
                                    value={collectionMode}
                                    onChange={e => { setCollectionMode(e.target.value); setSelectedCollectionId(undefined); setNewCollectionTitle(""); }}
                                    className="w-full"
                                >
                                    <div className="grid grid-cols-3 gap-2">
                                        <Radio.Button value="skip" className="text-center h-auto py-3">
                                            <div className="flex flex-col items-center gap-1">
                                                <CheckCircleOutlined />
                                                <span className="text-xs">Bỏ qua</span>
                                            </div>
                                        </Radio.Button>
                                        <Radio.Button value="new" className="text-center h-auto py-3">
                                            <div className="flex flex-col items-center gap-1">
                                                <PlusOutlined />
                                                <span className="text-xs">Tạo Collection mới</span>
                                            </div>
                                        </Radio.Button>
                                        <Radio.Button value="existing" className="text-center h-auto py-3">
                                            <div className="flex flex-col items-center gap-1">
                                                <FolderOutlined />
                                                <span className="text-xs">Collection có sẵn</span>
                                            </div>
                                        </Radio.Button>
                                    </div>
                                </Radio.Group>
                            </div>

                            {collectionMode === "new" && (
                                <div>
                                    <p className="text-sm font-medium mb-1">Tiêu đề Collection mới <span className="text-red-500">*</span></p>
                                    <Input
                                        placeholder="VD: Cambridge IELTS 18"
                                        value={newCollectionTitle}
                                        onChange={e => setNewCollectionTitle(e.target.value)}
                                        size="large"
                                        allowClear
                                    />
                                </div>
                            )}

                            {collectionMode === "existing" && (
                                <div>
                                    <p className="text-sm font-medium mb-1">Chọn Collection <span className="text-red-500">*</span></p>
                                    <Select
                                        showSearch
                                        placeholder="Tìm và chọn Collection..."
                                        value={selectedCollectionId}
                                        onChange={v => setSelectedCollectionId(v)}
                                        style={{ width: "100%" }}
                                        size="large"
                                        optionFilterProp="label"
                                        options={collections.map(c => ({
                                            value: c.id,
                                            label: `${c.title} (${c.mock_test_ids?.length ?? 0} mock tests)`,
                                        }))}
                                        notFoundContent="Không tìm thấy Collection"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </Modal>
    );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function AdminQuizzesPage() {
    const router = useRouter();
    const { canDelete } = useAdminPermissions();
    // Hydrate pagination + filter state from the URL so navigating into an
    // edit page and back (or sharing/reopening the URL) keeps the same view —
    // previously every navigation reset to page 1, making the editor have to
    // re-find their quiz.
    const initialPage = Number(router.query.page) || 1;
    const initialPageSize = Number(router.query.pageSize) || 20;
    const initialSearch = (router.query.search as string) || "";
    const initialSkill = (router.query.skill as string) || undefined;
    const initialType = (router.query.type as string) || undefined;
    const initialStatus = (router.query.status as string) || undefined;

    const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [search, setSearch] = useState(initialSearch);
    const [skillFilter, setSkillFilter] = useState<string | undefined>(initialSkill);
    const [typeFilter, setTypeFilter] = useState<string | undefined>(initialType);
    const [statusFilter, setStatusFilter] = useState<string | undefined>(initialStatus);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedQuizForMockTest, setSelectedQuizForMockTest] = useState<QuizRow | null>(null);

    // Push current state back to the URL (replace, not push, so the back
    // button still works as expected). Skip while the router isn't ready.
    useEffect(() => {
        if (!router.isReady) return;
        const query: Record<string, string> = {};
        if (page !== 1) query.page = String(page);
        if (pageSize !== 20) query.pageSize = String(pageSize);
        if (search) query.search = search;
        if (skillFilter) query.skill = skillFilter;
        if (typeFilter) query.type = typeFilter;
        if (statusFilter) query.status = statusFilter;
        router.replace(
            { pathname: router.pathname, query },
            undefined,
            { shallow: true, scroll: false }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, search, skillFilter, typeFilter, statusFilter, router.isReady]);

    const fetchQuizzes = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            if (search) params.set("search", search);
            if (skillFilter) params.set("skill", skillFilter);
            if (typeFilter) params.set("type", typeFilter);
            if (statusFilter) params.set("status", statusFilter);

            const res = await fetch(`/api/admin/quizzes?${params}`);
            const json = await res.json();
            if (json.success) {
                setQuizzes(json.data);
                setTotal(json.count);
            }
        } catch {
            message.error("Lỗi khi tải danh sách quiz");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, skillFilter, typeFilter, statusFilter]);

    useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/quizzes/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                message.success("Đã xóa quiz");
                fetchQuizzes();
            } else {
                message.error(json.error);
            }
        } catch {
            message.error("Error deleting quiz");
        }
    };

    const handleClone = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/quizzes/${id}/clone`, { method: "POST" });
            const json = await res.json();
            if (json.success) {
                message.success("Đã clone quiz");
                fetchQuizzes();
            } else {
                message.error(json.error);
            }
        } catch {
            message.error("Error cloning quiz");
        }
    };

    const handleTogglePro = async (id: string, pro_user_only: boolean) => {
        try {
            const res = await fetch(`/api/admin/quizzes/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pro_user_only }),
            });
            const json = await res.json();
            if (json.success) {
                message.success("Đã cập nhật");
                setQuizzes(prev => prev.map(item => item.id === id ? { ...item, pro_user_only } : item));
            } else {
                message.error(json.error || "Lỗi");
            }
        } catch { message.error("Error"); }
    };

    const handleToggleStatus = async (id: string, nextStatus: "draft" | "published") => {
        // Optimistic toggle so the UI feels instant; revert on failure.
        const prevQuizzes = quizzes;
        setQuizzes(prev => prev.map(item => item.id === id ? { ...item, status: nextStatus } : item));
        try {
            const res = await fetch(`/api/admin/quizzes/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });
            const json = await res.json();
            if (json.success) {
                message.success(nextStatus === "published" ? "Đã publish" : "Đã chuyển về draft");
            } else {
                setQuizzes(prevQuizzes);
                message.error(json.error || "Lỗi");
            }
        } catch {
            setQuizzes(prevQuizzes);
            message.error("Error");
        }
    };

    const columns: ColumnsType<QuizRow> = [
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            render: (title: string, record) => (
                <a onClick={() => router.push(`/admin/quizzes/${record.id}`)} className="font-medium">
                    {title}
                </a>
            ),
        },
        {
            title: "Skill",
            dataIndex: "skill",
            key: "skill",
            width: 100,
            render: (s: string) => <Tag color={s === "reading" ? "blue" : "purple"}>{s}</Tag>,
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            width: 100,
            render: (t: string) => <Tag>{t}</Tag>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 110,
            render: (s: string, record) => {
                const isPublished = s === "published";
                const next = isPublished ? "draft" : "published";
                return (
                    <Tooltip title={`Bấm để chuyển sang ${next}`}>
                        <Tag
                            color={isPublished ? "green" : "default"}
                            style={{ cursor: "pointer", userSelect: "none" }}
                            onClick={() => handleToggleStatus(record.id, next)}
                        >
                            {s}
                        </Tag>
                    </Tooltip>
                );
            },
        },
        {
            title: "Lượt làm",
            dataIndex: "tests_taken",
            key: "tests_taken",
            width: 110,
            sorter: (a, b) => a.tests_taken - b.tests_taken,
        },
        {
            title: "Pro",
            dataIndex: "pro_user_only",
            key: "pro_user_only",
            width: 60,
            render: (v: boolean, r) => (
                <Switch size="small" checked={v} onChange={(checked) => handleTogglePro(r.id, checked)} />
            ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            key: "created_at",
            width: 120,
            render: (d: string) => dayjs(d).format("DD/MM/YYYY"),
        },
        {
            title: "Actions",
            key: "actions",
            width: 280,
            render: (_, record) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => router.push(`/admin/quizzes/${record.id}`)} />
                    <Button size="small" icon={<CopyOutlined />} onClick={() => handleClone(record.id)} />
                    <Tooltip title="Thêm quiz này vào Mock Test hoặc Mock Test Collection">
                        <Button
                            size="small"
                            icon={<AppstoreAddOutlined />}
                            onClick={() => setSelectedQuizForMockTest(record)}
                        >
                            Mock Test
                        </Button>
                    </Tooltip>
                    {canDelete && (
                        <Popconfirm title="Xóa quiz này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
                            <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <AdminPageHeader
                icon={<FormOutlined />}
                title="Quản lý Quizzes"
                actions={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAddModal(true)}>
                        Thêm quiz mới
                    </Button>
                }
            />
            <AdminGlassCard>
                <Space style={{ marginBottom: 16 }} wrap>
                    <Input.Search
                        placeholder="Tìm theo tiêu đề..."
                        allowClear
                        onSearch={(v) => { setSearch(v); setPage(1); }}
                        style={{ width: 220 }}
                        prefix={<SearchOutlined />}
                    />
                    <Select value={skillFilter} onChange={(v) => { setSkillFilter(v); setPage(1); }} style={{ width: 120 }} allowClear placeholder="Skill">
                        <Select.Option value="reading">Reading</Select.Option>
                        <Select.Option value="listening">Listening</Select.Option>
                    </Select>
                    <Select value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }} style={{ width: 120 }} allowClear placeholder="Type">
                        <Select.Option value="academic">Academic</Select.Option>
                        <Select.Option value="general">General</Select.Option>
                        <Select.Option value="practice">Practice</Select.Option>
                        <Select.Option value="exam">Exam (All)</Select.Option>
                    </Select>
                    <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} style={{ width: 120 }} allowClear placeholder="Status">
                        <Select.Option value="published">Published</Select.Option>
                        <Select.Option value="draft">Draft</Select.Option>
                    </Select>
                </Space>

                <Table
                    columns={columns}
                    dataSource={quizzes}
                    rowKey="id"
                    loading={loading}
                    onChange={(pagination: TablePaginationConfig) => { setPage(pagination.current ?? 1); setPageSize(pagination.pageSize ?? 20); }}
                    pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `Tổng ${t} quizzes` }}
                    scroll={{ x: 1000 }}
                />
            </AdminGlassCard>

            {/* Add Quiz Modal — BP Quiz style */}
            <AddQuizModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={(id) => {
                    setShowAddModal(false);
                    router.push(`/admin/quizzes/${id}`);
                }}
            />

            <AddToMockTestModal
                quiz={selectedQuizForMockTest}
                onClose={() => setSelectedQuizForMockTest(null)}
            />
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
