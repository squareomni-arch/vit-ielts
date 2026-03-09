import { useEffect, useState, useCallback } from "react";
import { Table, Tag, Input, Space, Card, Button, Select, message, Popconfirm } from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, CopyOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";

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

export default function AdminQuizzesPage() {
    const router = useRouter();
    const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [search, setSearch] = useState("");
    const [skillFilter, setSkillFilter] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");

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

    const columns: ColumnsType<QuizRow> = [
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            ellipsis: true,
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
            width: 100,
            render: (s: string) => <Tag color={s === "published" ? "green" : "default"}>{s}</Tag>,
        },
        {
            title: "Lượt làm",
            dataIndex: "tests_taken",
            key: "tests_taken",
            width: 90,
            sorter: (a, b) => a.tests_taken - b.tests_taken,
        },
        {
            title: "Pro",
            dataIndex: "pro_user_only",
            key: "pro_user_only",
            width: 60,
            render: (v: boolean) => v ? <Tag color="gold">Pro</Tag> : null,
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
            width: 160,
            render: (_, record) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => router.push(`/admin/quizzes/${record.id}`)} />
                    <Button size="small" icon={<CopyOutlined />} onClick={() => handleClone(record.id)} />
                    <Popconfirm title="Xóa quiz này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Card
                title={<h1 className="text-2xl font-bold m-0">Quản lý Quizzes</h1>}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/admin/quizzes/new")}>
                        Thêm quiz mới
                    </Button>
                }
            >
                <Space className="mb-4" wrap>
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
                        <Select.Option value="practice">Practice</Select.Option>
                        <Select.Option value="exam">Exam</Select.Option>
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
            </Card>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
