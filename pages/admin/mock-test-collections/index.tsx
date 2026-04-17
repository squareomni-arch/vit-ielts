import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Table, Input, InputNumber, Space, Button, message, Popconfirm,
    Modal, Form, Typography, Tag, Switch, Tooltip,
} from "antd";
import {
    PlusOutlined, SearchOutlined, EditOutlined,
    DeleteOutlined, BookOutlined, MinusCircleOutlined,
    FileTextOutlined, HomeOutlined, SaveOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { AdminPageHeader, AdminGlassCard } from "@/widgets/admin";

const { Text } = Typography;

type CollectionRow = {
    id: string;
    title: string;
    slug: string;
    mock_test_ids: string[];
    featured_image: string | null;
    created_at: string;
};

type MockTestRow = {
    id: string;
    title: string;
    slug: string;
    practice_tests: { reading_test_id: string; listening_test_id: string }[];
    created_at: string;
};

// ---------------------------------------------------------------------------
// Create Collection Modal
// ---------------------------------------------------------------------------
function CreateCollectionModal({
    open, onClose, onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (id: string) => void;
}) {
    const [form] = Form.useForm();
    const [creating, setCreating] = useState(false);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setCreating(true);
            const res = await fetch("/api/admin/mock-test-collections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: values.title.trim() }),
            });
            const json = await res.json();
            if (json.success && json.data?.id) {
                message.success("Đã tạo Collection mới");
                form.resetFields();
                onCreated(json.data.id);
            } else {
                message.error(json.error || "Lỗi khi tạo Collection");
            }
        } catch (err) {
            if (err && typeof err === "object" && "errorFields" in err) return;
            message.error("Lỗi khi tạo Collection");
        } finally {
            setCreating(false);
        }
    };

    return (
        <Modal
            title="Tạo Mock Test Collection mới"
            open={open}
            onCancel={() => { form.resetFields(); onClose(); }}
            width={480}
            footer={[
                <Button key="cancel" onClick={() => { form.resetFields(); onClose(); }}>Hủy</Button>,
                <Button key="ok" type="primary" loading={creating} onClick={handleOk}>Tạo & Mở editor</Button>,
            ]}
            destroyOnClose
        >
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                <Form.Item name="title" label={<Text strong>Tên Collection <Text type="danger">*</Text></Text>}
                    rules={[{ required: true, message: "Vui lòng nhập tên" }]}>
                    <Input placeholder="VD: Cambridge IELTS 16" size="large" />
                </Form.Item>
            </Form>
        </Modal>
    );
}

// ---------------------------------------------------------------------------
// Create Mock Test Modal
// ---------------------------------------------------------------------------
function CreateMockTestModal({
    open, onClose, onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (id: string) => void;
}) {
    const [form] = Form.useForm();
    const [creating, setCreating] = useState(false);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setCreating(true);
            const res = await fetch("/api/admin/mock-tests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: values.title.trim() }),
            });
            const json = await res.json();
            if (json.success && json.data?.id) {
                message.success("Đã tạo Mock Test mới");
                form.resetFields();
                onCreated(json.data.id);
            } else {
                message.error(json.error || "Lỗi khi tạo Mock Test");
            }
        } catch (err) {
            if (err && typeof err === "object" && "errorFields" in err) return;
            message.error("Lỗi khi tạo Mock Test");
        } finally {
            setCreating(false);
        }
    };

    return (
        <Modal
            title="Tạo Mock Test mới"
            open={open}
            onCancel={() => { form.resetFields(); onClose(); }}
            width={480}
            footer={[
                <Button key="cancel" onClick={() => { form.resetFields(); onClose(); }}>Hủy</Button>,
                <Button key="ok" type="primary" loading={creating} onClick={handleOk}>Tạo & Mở editor</Button>,
            ]}
            destroyOnClose
        >
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                <Form.Item name="title" label={<Text strong>Tên Mock Test <Text type="danger">*</Text></Text>}
                    rules={[{ required: true, message: "Vui lòng nhập tên" }]}>
                    <Input placeholder="VD: Cambridge IELTS 16 Test 1" size="large" />
                </Form.Item>
            </Form>
        </Modal>
    );
}

// ---------------------------------------------------------------------------
// Expanded row: Mock Tests inside a Collection
// ---------------------------------------------------------------------------
function CollectionMockTestList({
    collection,
    mockTestMap,
    onRemove,
    onNavigate,
}: {
    collection: CollectionRow;
    mockTestMap: Record<string, MockTestRow>;
    onRemove: (collectionId: string, mockTestId: string) => void;
    onNavigate: (mockTestId: string) => void;
}) {
    const mockTests = (collection.mock_test_ids ?? [])
        .map(id => mockTestMap[id])
        .filter(Boolean) as MockTestRow[];

    if (mockTests.length === 0) {
        return (
            <div style={{ padding: "12px 0 12px 48px", color: "#999", fontSize: 13 }}>
                Chưa có Mock Test nào.{" "}
                <a onClick={() => onNavigate(collection.id)} style={{ fontSize: 13 }}>
                    Thêm trong Collection Editor →
                </a>
            </div>
        );
    }

    return (
        <div style={{ padding: "8px 16px 12px 48px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {mockTests.map((mt, idx) => (
                    <div
                        key={mt.id}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 14px",
                            background: "var(--admin-bg, #f9fafb)",
                            borderRadius: 6,
                            border: "1px solid var(--admin-border, #e5e7eb)",
                        }}
                    >
                        <span style={{
                            fontSize: 11, fontWeight: 700,
                            background: "var(--admin-surface)",
                            border: "1px solid var(--admin-border)",
                            borderRadius: 4, padding: "1px 7px",
                            color: "var(--admin-text-secondary)",
                            minWidth: 28, textAlign: "center",
                        }}>
                            {idx + 1}
                        </span>
                        <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{mt.title}</span>
                        <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                            {mt.practice_tests?.length ?? 0} bài
                        </Tag>
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => onNavigate(mt.id)}
                        >
                            Edit
                        </Button>
                        <Popconfirm
                            title="Xóa khỏi collection này?"
                            description="Mock Test sẽ không bị xóa, chỉ bị gỡ ra khỏi collection."
                            onConfirm={() => onRemove(collection.id, mt.id)}
                            okText="Gỡ" cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button size="small" icon={<MinusCircleOutlined />} />
                        </Popconfirm>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function ExamLibraryPage() {
    const router = useRouter();

    // Collections (paginated)
    const [collections, setCollections] = useState<CollectionRow[]>([]);
    const [colLoading, setColLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [search, setSearch] = useState("");

    // All mock tests map (for building tree + standalone)
    const [allMockTests, setAllMockTests] = useState<MockTestRow[]>([]);
    const [mockTestMap, setMockTestMap] = useState<Record<string, MockTestRow>>({});
    const [mockTestsLoading, setMockTestsLoading] = useState(true);

    // Expanded rows
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

    // Modals
    const [createColOpen, setCreateColOpen] = useState(false);
    const [createMTOpen, setCreateMTOpen] = useState(false);

    // Toggle states
    const [homepageIds, setHomepageIds] = useState<string[]>([]);
    const [globalOrderIds, setGlobalOrderIds] = useState<string[]>([]);
    const [toggling, setToggling] = useState<string | null>(null);

    const fetchCollections = useCallback(async () => {
        setColLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            if (search) params.set("search", search);
            const res = await fetch(`/api/admin/mock-test-collections?${params}`);
            const json = await res.json();
            if (json.success) {
                setCollections(json.data);
                setTotal(json.count);
            }
        } catch {
            message.error("Lỗi khi tải danh sách Collections");
        } finally {
            setColLoading(false);
        }
    }, [page, pageSize, search]);

    const fetchAllMockTests = useCallback(async () => {
        setMockTestsLoading(true);
        try {
            const res = await fetch("/api/admin/mock-tests?pageSize=500");
            const json = await res.json();
            if (json.success) {
                setAllMockTests(json.data);
                const map: Record<string, MockTestRow> = {};
                for (const mt of json.data) map[mt.id] = mt;
                setMockTestMap(map);
            }
        } catch {
            // silent
        } finally {
            setMockTestsLoading(false);
        }
    }, []);



    const fetchGlobalOrder = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/library/mock-collections-order");
            if (res.ok) {
                const data = await res.json();
                setGlobalOrderIds(data?.collection_ids ?? []);
            }
        } catch { /* silent */ }
    }, []);

    const fetchHomepageConfig = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/home/practice-section");
            if (res.ok) {
                const data = await res.json();
                setHomepageIds(data?.collection_ids ?? []);
            }
        } catch { /* silent */ }
    }, []);

    const toggleHomepage = useCallback(async (collectionId: string, checked: boolean) => {
        setToggling(collectionId);
        try {
            const updatedIds = checked
                ? [...homepageIds, collectionId]
                : homepageIds.filter(id => id !== collectionId);
            const res = await fetch("/api/admin/home/practice-section", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ collection_ids: updatedIds }),
            });
            if (res.ok) {
                setHomepageIds(updatedIds);
                message.success(checked ? "Đã thêm vào trang chủ" : "Đã gỡ khỏi trang chủ");
            } else {
                message.error("Lỗi khi cập nhật config trang chủ");
            }
        } catch {
            message.error("Lỗi kết nối");
        } finally {
            setToggling(null);
        }
    }, [homepageIds]);

    const saveGlobalOrder = useCallback(async (newIds: string[]) => {
        try {
            const res = await fetch("/api/admin/library/mock-collections-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ collection_ids: newIds }),
            });
            if (res.ok) {
                setGlobalOrderIds(newIds);
                message.success("Đã lưu thứ tự hiển thị");
            } else {
                message.error("Lỗi khi lưu thứ tự");
            }
        } catch {
            message.error("Lỗi kết nối");
        }
    }, []);

    useEffect(() => { fetchCollections(); }, [fetchCollections]);
    useEffect(() => { fetchAllMockTests(); }, [fetchAllMockTests]);
    useEffect(() => { fetchHomepageConfig(); }, [fetchHomepageConfig]);
    useEffect(() => { fetchGlobalOrder(); }, [fetchGlobalOrder]);

    const standaloneMockTests = useMemo(() => {
        const usedIds = new Set(collections.flatMap(c => c.mock_test_ids ?? []));
        return allMockTests.filter(mt => !usedIds.has(mt.id));
    }, [collections, allMockTests]);

    const removeFromCollection = async (collectionId: string, mockTestId: string) => {
        const col = collections.find(c => c.id === collectionId);
        if (!col) return;
        const newIds = (col.mock_test_ids ?? []).filter(id => id !== mockTestId);
        try {
            const res = await fetch(`/api/admin/mock-test-collections/${collectionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mock_test_ids: newIds }),
            });
            const json = await res.json();
            if (json.success) {
                message.success("Đã gỡ Mock Test khỏi collection");
                fetchCollections();
            } else {
                message.error(json.error);
            }
        } catch {
            message.error("Lỗi khi cập nhật collection");
        }
    };

    const deleteCollection = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/mock-test-collections/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                message.success("Đã xóa Collection");
                fetchCollections();
            } else {
                message.error(json.error);
            }
        } catch {
            message.error("Lỗi khi xóa");
        }
    };

    const deleteMockTest = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/mock-tests/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                message.success("Đã xóa Mock Test");
                fetchAllMockTests();
                fetchCollections();
            } else {
                message.error(json.error);
            }
        } catch {
            message.error("Lỗi khi xóa");
        }
    };

    // ----- Inline order change handler -----
    const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);

    /** Compute order position for a given collection ID (1-based) */
    const getOrderPosition = (id: string): number => {
        const idx = globalOrderIds.indexOf(id);
        if (idx !== -1) return idx + 1;
        // Not in order list → show high number
        return globalOrderIds.length + 1 + collections.findIndex(c => c.id === id);
    };

    const handleOrderChange = useCallback((collectionId: string, newPos: number | null) => {
        if (newPos === null || newPos < 1) return;

        // Build the full ordered list: globalOrderIds + any missing collection IDs
        const allIds = [...globalOrderIds];
        for (const c of collections) {
            if (!allIds.includes(c.id)) allIds.push(c.id);
        }

        // Remove the item being moved
        const filtered = allIds.filter(id => id !== collectionId);

        // Insert at new position (1-based → 0-based)
        const insertIdx = Math.min(newPos - 1, filtered.length);
        filtered.splice(insertIdx, 0, collectionId);

        // Optimistic update
        setGlobalOrderIds(filtered);
        setHasUnsavedOrder(true);
    }, [globalOrderIds, collections]);

    const saveOrder = async () => {
        setSavingOrder(true);
        try {
            const res = await fetch("/api/admin/library/mock-collections-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ collection_ids: globalOrderIds }),
            });
            if (res.ok) {
                message.success("Đã lưu thứ tự hiển thị");
                setHasUnsavedOrder(false);
            } else {
                message.error("Lỗi khi lưu thứ tự");
            }
        } catch {
            message.error("Lỗi kết nối");
        } finally {
            setSavingOrder(false);
        }
    };

    // Collection table columns
    const colColumns: ColumnsType<CollectionRow> = [
        {
            title: "Thứ tự",
            key: "order",
            width: 90,
            render: (_, record) => {
                const pos = getOrderPosition(record.id);
                return (
                    <InputNumber
                        size="small"
                        min={1}
                        value={pos}
                        onChange={(val) => handleOrderChange(record.id, val)}
                        style={{ width: 60 }}
                    />
                );
            },
        },
        {
            title: "Collection",
            dataIndex: "title",
            key: "title",
            render: (title, record) => (
                <span
                    style={{ fontWeight: 600, cursor: "pointer", color: "var(--admin-primary)" }}
                    onClick={() => router.push(`/admin/mock-test-collections/${record.id}`)}
                >
                    {title}
                </span>
            ),
        },
        {
            title: "Slug",
            dataIndex: "slug",
            key: "slug",
            ellipsis: true,
            width: 200,
            render: (s) => <Text type="secondary" style={{ fontSize: 12 }}>{s}</Text>,
        },
        {
            title: "Mock Tests",
            key: "count",
            width: 120,
            render: (_, record) => (
                <Tag color="purple">{record.mock_test_ids?.length ?? 0} bộ đề</Tag>
            ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            key: "created_at",
            width: 120,
            render: (d) => dayjs(d).format("DD/MM/YYYY"),
        },
        {
            title: "Trang chủ",
            key: "homepage",
            width: 110,
            render: (_, record) => {
                const isOn = homepageIds.includes(record.id);
                return (
                    <Tooltip title={isOn ? "Đang hiển thị trang chủ. Click để gỡ." : "Click để hiển thị trang chủ"}>
                        <Switch
                            size="small"
                            checked={isOn}
                            loading={toggling === record.id}
                            onChange={(checked) => toggleHomepage(record.id, checked)}
                            checkedChildren={<HomeOutlined />}
                        />
                    </Tooltip>
                );
            },
        },
        {
            title: "",
            key: "actions",
            width: 90,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => router.push(`/admin/mock-test-collections/${record.id}`)}
                    />
                    <Popconfirm
                        title="Xóa collection này?"
                        description="Các Mock Tests bên trong sẽ không bị xóa."
                        onConfirm={() => deleteCollection(record.id)}
                        okText="Xóa" cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Standalone mock tests columns
    const mtColumns: ColumnsType<MockTestRow> = [
        {
            title: "Mock Test",
            dataIndex: "title",
            key: "title",
            render: (title, record) => (
                <a onClick={() => router.push(`/admin/mock-tests/${record.id}`)} style={{ fontWeight: 500 }}>
                    {title}
                </a>
            ),
        },
        {
            title: "Practice Tests",
            key: "count",
            width: 140,
            render: (_, record) => (
                <Tag color="blue">{record.practice_tests?.length ?? 0} bài</Tag>
            ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            key: "created_at",
            width: 120,
            render: (d) => dayjs(d).format("DD/MM/YYYY"),
        },
        {
            title: "",
            key: "actions",
            width: 90,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => router.push(`/admin/mock-tests/${record.id}`)}
                    />
                    <Popconfirm
                        title="Xóa mock test này?"
                        onConfirm={() => deleteMockTest(record.id)}
                        okText="Xóa" cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <AdminPageHeader
                icon={<BookOutlined />}
                title="Exam Library"
                actions={
                    <Space>
                        <Button icon={<FileTextOutlined />} onClick={() => setCreateMTOpen(true)}>
                            Thêm Mock Test
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateColOpen(true)}>
                            Thêm Collection
                        </Button>
                    </Space>
                }
            />

            {/* Stats */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <AdminGlassCard style={{ flex: 1, padding: "16px 20px" }}>
                    <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{total}</div>
                    <div style={{ fontSize: 12, color: "var(--admin-text-secondary)", marginTop: 4 }}>
                        Collections
                    </div>
                </AdminGlassCard>
                <AdminGlassCard style={{ flex: 1, padding: "16px 20px" }}>
                    <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{allMockTests.length}</div>
                    <div style={{ fontSize: 12, color: "var(--admin-text-secondary)", marginTop: 4 }}>
                        Mock Tests
                    </div>
                </AdminGlassCard>
                <AdminGlassCard style={{ flex: 1, padding: "16px 20px" }}>
                    <div style={{
                        fontSize: 26, fontWeight: 700, lineHeight: 1.2,
                        color: homepageIds.length > 0 ? "var(--admin-primary, #D94A56)" : undefined,
                    }}>
                        {homepageIds.length}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--admin-text-secondary)", marginTop: 4 }}>
                        Trang chủ
                    </div>
                </AdminGlassCard>
                <AdminGlassCard style={{ flex: 1, padding: "16px 20px" }}>
                    <div style={{
                        fontSize: 26, fontWeight: 700, lineHeight: 1.2,
                        color: standaloneMockTests.length > 0 ? "var(--color-warning, #fa8c16)" : undefined,
                    }}>
                        {standaloneMockTests.length}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--admin-text-secondary)", marginTop: 4 }}>
                        Chưa gán Collection
                    </div>
                </AdminGlassCard>
            </div>

            {/* Collections Table */}
            <AdminGlassCard>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <Space wrap>
                        <Input.Search
                            placeholder="Tìm collection..."
                            allowClear
                            onSearch={(v) => { setSearch(v); setPage(1); }}
                            style={{ width: 280 }}
                            prefix={<SearchOutlined />}
                        />
                    </Space>
                    {(hasUnsavedOrder || savingOrder) && (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 13, color: "var(--color-warning, #fa8c16)" }}>Chưa lưu thay đổi thứ tự</span>
                            <Button 
                                type="primary" 
                                icon={<SaveOutlined />} 
                                loading={savingOrder} 
                                onClick={saveOrder}
                            >
                                Lưu thay đổi
                            </Button>
                        </div>
                    )}
                </div>

                <Table
                    columns={colColumns}
                    dataSource={collections}
                    rowKey="id"
                    loading={colLoading || mockTestsLoading}
                    expandable={{
                        expandedRowRender: (record) => (
                            <CollectionMockTestList
                                collection={record}
                                mockTestMap={mockTestMap}
                                onRemove={removeFromCollection}
                                onNavigate={(targetId) => {
                                    // If navigating to a mock test by ID
                                    if (allMockTests.find(mt => mt.id === targetId)) {
                                        router.push(`/admin/mock-tests/${targetId}`);
                                    } else {
                                        // It's a collection ID (from "Thêm trong Collection Editor")
                                        router.push(`/admin/mock-test-collections/${targetId}`);
                                    }
                                }}
                            />
                        ),
                        expandedRowKeys: expandedKeys,
                        onExpand: (expanded, record) => {
                            setExpandedKeys(
                                expanded
                                    ? [...expandedKeys, record.id]
                                    : expandedKeys.filter(k => k !== record.id)
                            );
                        },
                        rowExpandable: () => true,
                    }}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        onChange: (p) => setPage(p),
                        showTotal: (t) => `Tổng ${t} collections`,
                        showSizeChanger: false,
                    }}
                    scroll={{ x: 800 }}
                />
            </AdminGlassCard>

            {/* Standalone Mock Tests */}
            {standaloneMockTests.length > 0 && (
                <AdminGlassCard
                    title={`Mock Tests chưa gán vào Collection (${standaloneMockTests.length})`}
                    style={{ marginTop: 16 }}
                >
                    <Table
                        columns={mtColumns}
                        dataSource={standaloneMockTests}
                        rowKey="id"
                        loading={mockTestsLoading}
                        pagination={standaloneMockTests.length > 10 ? { pageSize: 10 } : false}
                        size="small"
                    />
                </AdminGlassCard>
            )}

            <CreateCollectionModal
                open={createColOpen}
                onClose={() => setCreateColOpen(false)}
                onCreated={(id) => {
                    setCreateColOpen(false);
                    router.push(`/admin/mock-test-collections/${id}`);
                }}
            />
            <CreateMockTestModal
                open={createMTOpen}
                onClose={() => setCreateMTOpen(false)}
                onCreated={(id) => {
                    setCreateMTOpen(false);
                    router.push(`/admin/mock-tests/${id}`);
                }}
            />

        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
