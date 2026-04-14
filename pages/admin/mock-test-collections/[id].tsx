import { useCallback, useEffect, useRef, useState } from "react";
import {
    Form, Button, Spin, Typography, message, Alert, Space,
    Input, Select, Tag, Popconfirm,
} from "antd";
import {
    ArrowLeftOutlined, SaveOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { AdminGlassCard } from "@/widgets/admin";

const { Title, Text } = Typography;

type MockTestOption = {
    id: string;
    title: string;
    slug: string;
};

type CollectionEditorPageProps = {
    collectionId?: string;
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
function CollectionEditor({ collectionId }: CollectionEditorPageProps) {
    const router = useRouter();
    const [form] = Form.useForm();
    const isNew = !collectionId;

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    const [selectedMockTestIds, setSelectedMockTestIds] = useState<string[]>([]);
    const [mockTestOptions, setMockTestOptions] = useState<MockTestOption[]>([]);
    const [mockTestsLoading, setMockTestsLoading] = useState(false);

    const isDirtyRef = useRef(false);
    isDirtyRef.current = isDirty;

    const currentTitle = Form.useWatch("title", form);
    const featuredImageValue = Form.useWatch("featured_image", form);

    // Auto-generate slug from title (new only)
    useEffect(() => {
        if (!slugManuallyEdited && currentTitle && isNew) {
            const baseSlug = slugify(currentTitle);
            if (baseSlug) form.setFieldValue("slug", baseSlug);
        }
    }, [currentTitle, slugManuallyEdited, isNew, form]);

    // Load mock test options
    const loadMockTestOptions = useCallback(async () => {
        setMockTestsLoading(true);
        try {
            const res = await fetch("/api/admin/mock-tests?pageSize=500");
            const json = await res.json();
            if (json.success) setMockTestOptions(json.data);
        } catch {
            // silent
        } finally {
            setMockTestsLoading(false);
        }
    }, []);

    useEffect(() => { loadMockTestOptions(); }, [loadMockTestOptions]);

    // Load existing collection
    useEffect(() => {
        if (isNew) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/mock-test-collections/${collectionId}`);
                const json = await res.json();
                if (json.success) {
                    const coll = json.data;
                    form.setFieldsValue({
                        title: coll.title,
                        slug: coll.slug,
                        featured_image: coll.featured_image ?? "",
                    });
                    setSelectedMockTestIds(coll.mock_test_ids ?? []);
                    if (coll.slug) setSlugManuallyEdited(true);
                    setIsDirty(false);
                }
            } catch {
                message.error("Lỗi khi tải Collection");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [collectionId, isNew, form]);

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
                featured_image: values.featured_image || null,
                mock_test_ids: selectedMockTestIds,
            };

            const url = isNew
                ? "/api/admin/mock-test-collections"
                : `/api/admin/mock-test-collections/${collectionId}`;
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
                message.success(isNew ? "Tạo Collection thành công" : `Đã lưu lúc ${timeStr}`);
                if (isNew && json.data?.id) {
                    router.push(`/admin/mock-test-collections/${json.data.id}`);
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
        if (!collectionId) return;
        try {
            const res = await fetch(`/api/admin/mock-test-collections/${collectionId}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                message.success("Đã xóa Collection");
                router.push("/admin/mock-test-collections");
            } else {
                message.error(json.error);
            }
        } catch {
            message.error("Lỗi khi xóa");
        }
    };

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
                            onClick={() => router.push("/admin/mock-test-collections")}
                            type="text"
                        />
                        <div>
                            <Title level={4} style={{ margin: 0 }}>
                                {currentTitle || (isNew ? "Tạo Collection mới" : "Chỉnh sửa Collection")}
                            </Title>
                            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                {isDirty && <Tag color="orange">Chưa lưu</Tag>}
                                {lastSavedAt && !isDirty && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Lưu lúc {lastSavedAt}
                                    </Text>
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
                                title="Xóa collection này?"
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
                            label={<Text strong>Tên Collection <Text type="danger">*</Text></Text>}
                            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                        >
                            <Input placeholder="VD: Cambridge IELTS 16" size="large" />
                        </Form.Item>

                        <Form.Item
                            name="slug"
                            label={<Text strong>Slug</Text>}
                            rules={[{ required: true, message: "Slug không được trống" }]}
                        >
                            <Input
                                placeholder="cambridge-ielts-16"
                                onChange={() => setSlugManuallyEdited(true)}
                            />
                        </Form.Item>

                        <Form.Item
                            name="featured_image"
                            label={<Text strong>Featured Image URL</Text>}
                        >
                            <Input placeholder="https://..." />
                        </Form.Item>
                    </Form>

                    {/* Image preview */}
                    {featuredImageValue && (
                        <div style={{ marginTop: 8 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={featuredImageValue}
                                alt="featured preview"
                                style={{
                                    maxHeight: 120,
                                    maxWidth: "100%",
                                    borderRadius: 8,
                                    objectFit: "cover",
                                    border: "1px solid #e5e7eb",
                                }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                        </div>
                    )}
                </AdminGlassCard>

                {/* ── Mock Tests Selection ── */}
                <AdminGlassCard style={{ marginTop: 16 }}>
                    <div style={{ marginBottom: 12 }}>
                        <Title level={5} style={{ margin: 0 }}>
                            Mock Tests trong Collection{" "}
                            <Tag color="purple" style={{ fontWeight: 400, fontSize: 12 }}>
                                {selectedMockTestIds.length} bộ đề
                            </Tag>
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Chọn các Mock Test để thêm vào collection này. Thứ tự hiển thị theo thứ tự bạn chọn.
                        </Text>
                    </div>

                    <Select
                        mode="multiple"
                        style={{ width: "100%" }}
                        placeholder="Tìm và chọn Mock Tests..."
                        value={selectedMockTestIds}
                        onChange={(vals: string[]) => {
                            setSelectedMockTestIds(vals);
                            setIsDirty(true);
                        }}
                        options={mockTestOptions.map(mt => ({
                            value: mt.id,
                            label: mt.title,
                        }))}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                        loading={mockTestsLoading}
                        size="large"
                        allowClear
                        maxTagCount={10}
                    />
                </AdminGlassCard>
            </div>
        </AdminLayout>
    );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------
export default function CollectionEditorPage() {
    const router = useRouter();
    const collectionId = router.query.id as string | undefined;
    if (!router.isReady) return null;
    return <CollectionEditor collectionId={collectionId} />;
}

export const getServerSideProps = withAdmin;
