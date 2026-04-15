import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Form, Button, Spin, Typography, message, Alert, Space,
    Input, Tag, Popconfirm, Modal, Select, Empty,
} from "antd";
import {
    ArrowLeftOutlined, SaveOutlined, DeleteOutlined,
    PlusOutlined, HolderOutlined, LinkOutlined,
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

type MockTestOption = {
    id: string;
    title: string;
    slug: string;
    practiceTestCount: number;
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
// Sortable Mock Test Card
// ---------------------------------------------------------------------------
function MockTestCard({
    item,
    index,
    onRemove,
    onEdit,
}: {
    item: MockTestOption;
    index: number;
    onRemove: () => void;
    onEdit: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 100 : 1,
        position: "relative",
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "var(--admin-bg, #f9fafb)",
                borderRadius: 8,
                border: isDragging
                    ? "2px dashed var(--admin-primary, #1677ff)"
                    : "1px solid var(--admin-border, #e5e7eb)",
                marginBottom: 8,
                cursor: "default",
                userSelect: "none",
            }}>
                {/* Drag handle */}
                <span
                    {...listeners}
                    style={{ cursor: "grab", color: "#bbb", padding: "0 4px", flexShrink: 0 }}
                    title="Kéo để sắp xếp"
                >
                    <HolderOutlined style={{ fontSize: 16 }} />
                </span>

                {/* Index badge */}
                <span style={{
                    fontSize: 12, fontWeight: 700,
                    background: "var(--admin-surface, #fff)",
                    border: "1px solid var(--admin-border, #e5e7eb)",
                    borderRadius: 4, padding: "2px 8px",
                    color: "var(--admin-text-secondary, #6b7280)",
                    minWidth: 30, textAlign: "center", flexShrink: 0,
                }}>
                    {index + 1}
                </span>

                {/* Title */}
                <span style={{ flex: 1, fontWeight: 500, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title}
                </span>

                {/* Practice tests count */}
                <Tag color="blue" style={{ fontSize: 11, margin: 0, flexShrink: 0 }}>
                    {item.practiceTestCount} bài
                </Tag>

                {/* Edit link */}
                <Button
                    size="small"
                    type="text"
                    icon={<LinkOutlined />}
                    onClick={onEdit}
                    title="Mở Mock Test Editor"
                >
                    Edit
                </Button>

                {/* Remove */}
                <Popconfirm
                    title="Gỡ Mock Test này khỏi collection?"
                    description="Mock Test sẽ không bị xóa."
                    onConfirm={onRemove}
                    okText="Gỡ" cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                >
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Add Mock Tests Modal
// ---------------------------------------------------------------------------
function AddMockTestsModal({
    open,
    allMockTests,
    alreadySelectedIds,
    onClose,
    onAdd,
}: {
    open: boolean;
    allMockTests: MockTestOption[];
    alreadySelectedIds: string[];
    onClose: () => void;
    onAdd: (ids: string[]) => void;
}) {
    const [selected, setSelected] = useState<string[]>([]);
    const available = allMockTests.filter(mt => !alreadySelectedIds.includes(mt.id));

    const handleOk = () => {
        if (selected.length === 0) {
            message.warning("Vui lòng chọn ít nhất một Mock Test");
            return;
        }
        onAdd(selected);
        setSelected([]);
    };

    const handleCancel = () => {
        setSelected([]);
        onClose();
    };

    return (
        <Modal
            title="Thêm Mock Test vào Collection"
            open={open}
            onCancel={handleCancel}
            width={560}
            footer={[
                <Button key="cancel" onClick={handleCancel}>Hủy</Button>,
                <Button key="ok" type="primary" onClick={handleOk} disabled={selected.length === 0}>
                    Thêm {selected.length > 0 ? `(${selected.length})` : ""}
                </Button>,
            ]}
            destroyOnClose
        >
            {available.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#999" }}>
                    Tất cả Mock Tests đã có trong collection này.
                </div>
            ) : (
                <>
                    <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 13 }}>
                        Chọn một hoặc nhiều Mock Test để thêm vào collection:
                    </Text>
                    <Select
                        mode="multiple"
                        style={{ width: "100%" }}
                        placeholder="Tìm và chọn Mock Tests..."
                        value={selected}
                        onChange={setSelected}
                        options={available.map(mt => ({
                            value: mt.id,
                            label: `${mt.title} (${mt.practiceTestCount} bài)`,
                        }))}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                        size="large"
                        maxTagCount={5}
                    />
                </>
            )}
        </Modal>
    );
}

// ---------------------------------------------------------------------------
// Editor component
// ---------------------------------------------------------------------------
function CollectionEditor({ collectionId }: { collectionId?: string }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const isNew = !collectionId;

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    // Ordered mock test IDs in this collection
    const [selectedMockTests, setSelectedMockTests] = useState<MockTestOption[]>([]);
    // All mock tests available to add
    const [allMockTests, setAllMockTests] = useState<MockTestOption[]>([]);
    const [mockTestsLoading, setMockTestsLoading] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);

    const isDirtyRef = useRef(false);
    isDirtyRef.current = isDirty;

    const currentTitle = Form.useWatch("title", form);
    const featuredImageValue = Form.useWatch("featured_image", form);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const sortableIds = useMemo(() => selectedMockTests.map(mt => mt.id), [selectedMockTests]);

    // Auto-generate slug from title
    useEffect(() => {
        if (!slugManuallyEdited && currentTitle && isNew) {
            const s = slugify(currentTitle);
            if (s) form.setFieldValue("slug", s);
        }
    }, [currentTitle, slugManuallyEdited, isNew, form]);

    // Load all mock tests for add modal
    const loadAllMockTests = useCallback(async () => {
        setMockTestsLoading(true);
        try {
            const res = await fetch("/api/admin/mock-tests?pageSize=500");
            const json = await res.json();
            if (json.success) {
                setAllMockTests(json.data.map((mt: { id: string; title: string; slug: string; practice_tests?: unknown[] }) => ({
                    id: mt.id,
                    title: mt.title,
                    slug: mt.slug,
                    practiceTestCount: mt.practice_tests?.length ?? 0,
                })));
            }
        } catch {
            // silent
        } finally {
            setMockTestsLoading(false);
        }
    }, []);

    useEffect(() => { loadAllMockTests(); }, [loadAllMockTests]);

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
                    if (coll.slug) setSlugManuallyEdited(true);
                    setIsDirty(false);

                    // We'll populate selectedMockTests once allMockTests loads
                    // Store the IDs temporarily
                    if (coll.mock_test_ids?.length > 0) {
                        _pendingIdsRef.current = coll.mock_test_ids;
                    }
                }
            } catch {
                message.error("Lỗi khi tải Collection");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [collectionId, isNew, form]);

    // Pending mock test IDs to resolve once allMockTests loads
    const _pendingIdsRef = useRef<string[]>([]);

    useEffect(() => {
        if (allMockTests.length === 0) return;
        if (_pendingIdsRef.current.length === 0) return;
        const map: Record<string, MockTestOption> = {};
        for (const mt of allMockTests) map[mt.id] = mt;
        const resolved = _pendingIdsRef.current
            .map(id => map[id])
            .filter(Boolean) as MockTestOption[];
        setSelectedMockTests(resolved);
        _pendingIdsRef.current = [];
    }, [allMockTests]);

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
                mock_test_ids: selectedMockTests.map(mt => mt.id),
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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = sortableIds.indexOf(String(active.id));
        const newIndex = sortableIds.indexOf(String(over.id));
        if (oldIndex !== -1 && newIndex !== -1) {
            setSelectedMockTests(prev => arrayMove(prev, oldIndex, newIndex));
            setIsDirty(true);
        }
    };

    const removeMockTest = (id: string) => {
        setSelectedMockTests(prev => prev.filter(mt => mt.id !== id));
        setIsDirty(true);
    };

    const addMockTests = (ids: string[]) => {
        const map: Record<string, MockTestOption> = {};
        for (const mt of allMockTests) map[mt.id] = mt;
        const toAdd = ids.map(id => map[id]).filter(Boolean) as MockTestOption[];
        setSelectedMockTests(prev => [...prev, ...toAdd]);
        setIsDirty(true);
        setAddModalOpen(false);
        message.success(`Đã thêm ${toAdd.length} Mock Test`);
    };

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
                                {currentTitle || (isNew ? "Tạo Collection mới" : "Chỉnh sửa Collection")}
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
                                title="Xóa collection này?"
                                description="Các Mock Tests bên trong sẽ không bị xóa."
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

                {/* ── Basic Info ── */}
                <AdminGlassCard style={{ marginTop: 24 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>Thông tin cơ bản</Title>
                    <Form form={form} layout="vertical" onValuesChange={() => setIsDirty(true)}>
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

                        <Form.Item name="featured_image" label={<Text strong>Featured Image URL</Text>} className="mb-0">
                            <Input placeholder="https://..." />
                        </Form.Item>
                    </Form>

                    {featuredImageValue && (
                        <div style={{ marginTop: 12 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={featuredImageValue}
                                alt="featured preview"
                                style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 8, objectFit: "cover", border: "1px solid #e5e7eb" }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                        </div>
                    )}
                </AdminGlassCard>

                {/* ── Mock Tests (DnD) ── */}
                <AdminGlassCard style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <div>
                            <Title level={5} style={{ margin: 0 }}>
                                Mock Tests trong Collection{" "}
                                <Tag color="purple" style={{ fontWeight: 400, fontSize: 12 }}>
                                    {selectedMockTests.length} bộ đề
                                </Tag>
                            </Title>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Kéo thả để sắp xếp thứ tự hiển thị.
                            </Text>
                        </div>
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            loading={mockTestsLoading}
                            onClick={() => setAddModalOpen(true)}
                        >
                            Thêm Mock Test
                        </Button>
                    </div>

                    {selectedMockTests.length === 0 ? (
                        <Empty
                            description={
                                <span style={{ fontSize: 13 }}>
                                    Chưa có Mock Test nào.{" "}
                                    <Button type="link" size="small" onClick={() => setAddModalOpen(true)}>
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
                                {selectedMockTests.map((mt, idx) => (
                                    <MockTestCard
                                        key={mt.id}
                                        item={mt}
                                        index={idx}
                                        onRemove={() => removeMockTest(mt.id)}
                                        onEdit={() => {
                                            if (isDirty) {
                                                message.warning("Hãy lưu collection trước khi chỉnh sửa Mock Test.");
                                            } else {
                                                router.push(`/admin/mock-tests/${mt.id}`);
                                            }
                                        }}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </AdminGlassCard>
            </div>

            <AddMockTestsModal
                open={addModalOpen}
                allMockTests={allMockTests}
                alreadySelectedIds={selectedMockTests.map(mt => mt.id)}
                onClose={() => setAddModalOpen(false)}
                onAdd={addMockTests}
            />
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
