import { useEffect, useState, useCallback } from "react";
import {
    Table, Input, Space, Button, message, Popconfirm,
    Modal, Form, Typography, Tag,
} from "antd";
import {
    PlusOutlined, SearchOutlined, EditOutlined,
    DeleteOutlined, FileTextOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { AdminPageHeader, AdminGlassCard } from "@/widgets/admin";

const { Text } = Typography;

type PracticeTest = {
    reading_test_id: string;
    listening_test_id: string;
};

type MockTestRow = {
    id: string;
    title: string;
    slug: string;
    practice_tests: PracticeTest[];
    created_at: string;
};

// ---------------------------------------------------------------------------
// Add Modal
// ---------------------------------------------------------------------------
function AddMockTestModal({
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

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title="Tạo Mock Test mới"
            open={open}
            onCancel={handleCancel}
            width={480}
            footer={[
                <Button key="cancel" onClick={handleCancel}>Hủy</Button>,
                <Button
                    key="ok"
                    type="primary"
                    loading={creating}
                    onClick={handleOk}
                >
                    Tạo
                </Button>,
            ]}
            destroyOnClose
        >
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                <Form.Item
                    name="title"
                    label={<Text strong>Tên Mock Test <Text type="danger">*</Text></Text>}
                    rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                >
                    <Input placeholder="VD: Cambridge IELTS 16 Test 1" size="large" />
                </Form.Item>
            </Form>
        </Modal>
    );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function AdminMockTestsPage() {
    const router = useRouter();
    const [rows, setRows] = useState<MockTestRow[]>([]);
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
            const res = await fetch(`/api/admin/mock-tests?${params}`);
            const json = await res.json();
            if (json.success) {
                setRows(json.data);
                setTotal(json.count);
            }
        } catch {
            message.error("Lỗi khi tải danh sách Mock Tests");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/mock-tests/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                message.success("Đã xóa Mock Test");
                fetchData();
            } else {
                message.error(json.error);
            }
        } catch {
            message.error("Lỗi khi xóa Mock Test");
        }
    };

    const columns: ColumnsType<MockTestRow> = [
        {
            title: "Tên Mock Test",
            dataIndex: "title",
            key: "title",
            ellipsis: true,
            render: (title: string, record) => (
                <a onClick={() => router.push(`/admin/mock-tests/${record.id}`)} className="font-medium">
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
            title: "Số Practice Tests",
            key: "count",
            width: 150,
            render: (_, record) => (
                <Tag color="blue">{record.practice_tests?.length ?? 0} bài</Tag>
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
                        onClick={() => router.push(`/admin/mock-tests/${record.id}`)}
                    />
                    <Popconfirm
                        title="Xóa mock test này?"
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
                icon={<FileTextOutlined />}
                title="Quản lý Mock Tests"
                actions={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setShowAddModal(true)}
                    >
                        Thêm Mock Test
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
                        showTotal: (t) => `Tổng ${t} mock tests`,
                    }}
                    scroll={{ x: 800 }}
                />
            </AdminGlassCard>

            <AddMockTestModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={(id) => {
                    setShowAddModal(false);
                    router.push(`/admin/mock-tests/${id}`);
                }}
            />
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
