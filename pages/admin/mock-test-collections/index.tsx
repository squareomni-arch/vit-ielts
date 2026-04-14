import { useEffect, useState, useCallback } from "react";
import {
    Table, Input, Space, Button, message, Popconfirm,
    Modal, Form, Typography, Tag,
} from "antd";
import {
    PlusOutlined, SearchOutlined, EditOutlined,
    DeleteOutlined, BookOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
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

// ---------------------------------------------------------------------------
// Add Modal
// ---------------------------------------------------------------------------
function AddCollectionModal({
    open,
    onClose,
    onCreated,
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

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title="Tạo Mock Test Collection mới"
            open={open}
            onCancel={handleCancel}
            width={480}
            footer={[
                <Button key="cancel" onClick={handleCancel}>Hủy</Button>,
                <Button key="ok" type="primary" loading={creating} onClick={handleOk}>
                    Tạo
                </Button>,
            ]}
            destroyOnClose
        >
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                <Form.Item
                    name="title"
                    label={<Text strong>Tên Collection <Text type="danger">*</Text></Text>}
                    rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                >
                    <Input placeholder="VD: Cambridge IELTS 16" size="large" />
                </Form.Item>
            </Form>
        </Modal>
    );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function AdminMockTestCollectionsPage() {
    const router = useRouter();
    const [rows, setRows] = useState<CollectionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            if (search) params.set("search", search);
            const res = await fetch(`/api/admin/mock-test-collections?${params}`);
            const json = await res.json();
            if (json.success) {
                setRows(json.data);
                setTotal(json.count);
            }
        } catch {
            message.error("Lỗi khi tải danh sách Collections");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/mock-test-collections/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                message.success("Đã xóa Collection");
                fetchData();
            } else {
                message.error(json.error);
            }
        } catch {
            message.error("Lỗi khi xóa Collection");
        }
    };

    const columns: ColumnsType<CollectionRow> = [
        {
            title: "Tên Collection",
            dataIndex: "title",
            key: "title",
            ellipsis: true,
            render: (title: string, record) => (
                <a
                    onClick={() => router.push(`/admin/mock-test-collections/${record.id}`)}
                    className="font-medium"
                >
                    {title}
                </a>
            ),
        },
        {
            title: "Slug",
            dataIndex: "slug",
            key: "slug",
            ellipsis: true,
            width: 220,
            render: (s: string) => <Text type="secondary" style={{ fontSize: 12 }}>{s}</Text>,
        },
        {
            title: "Số Mock Tests",
            key: "count",
            width: 140,
            render: (_, record) => (
                <Tag color="purple">{record.mock_test_ids?.length ?? 0} bộ đề</Tag>
            ),
        },
        {
            title: "Featured Image",
            dataIndex: "featured_image",
            key: "featured_image",
            width: 140,
            render: (url: string | null) =>
                url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={url}
                        alt="featured"
                        style={{ height: 40, width: 60, objectFit: "cover", borderRadius: 4 }}
                    />
                ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
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
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => router.push(`/admin/mock-test-collections/${record.id}`)}
                    />
                    <Popconfirm
                        title="Xóa collection này?"
                        description="Hành động này không thể hoàn tác."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
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
                title="Quản lý Mock Test Collections"
                actions={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setShowAddModal(true)}
                    >
                        Thêm Collection
                    </Button>
                }
            />
            <AdminGlassCard>
                <Space style={{ marginBottom: 16 }} wrap>
                    <Input.Search
                        placeholder="Tìm theo tên..."
                        allowClear
                        onSearch={(v) => { setSearch(v); setPage(1); }}
                        style={{ width: 260 }}
                        prefix={<SearchOutlined />}
                    />
                </Space>

                <Table
                    columns={columns}
                    dataSource={rows}
                    rowKey="id"
                    loading={loading}
                    onChange={(pagination: TablePaginationConfig) => {
                        setPage(pagination.current ?? 1);
                        setPageSize(pagination.pageSize ?? 20);
                    }}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        showTotal: (t) => `Tổng ${t} collections`,
                    }}
                    scroll={{ x: 900 }}
                />
            </AdminGlassCard>

            <AddCollectionModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={(id) => {
                    setShowAddModal(false);
                    router.push(`/admin/mock-test-collections/${id}`);
                }}
            />
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
