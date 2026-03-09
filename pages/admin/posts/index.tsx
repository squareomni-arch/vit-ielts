import { useEffect, useState, useCallback } from "react";
import { Table, Tag, Card, Button, Space, Input, Select, message, Popconfirm } from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";

type PostRow = {
    id: string;
    title: string;
    slug: string;
    status: string;
    pro_user_only: boolean;
    views: number;
    categories: string[];
    created_at: string;
};

export default function AdminPostsPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<PostRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            if (search) params.set("search", search);
            if (statusFilter) params.set("status", statusFilter);
            const res = await fetch(`/api/admin/posts?${params}`);
            const json = await res.json();
            if (json.success) { setPosts(json.data); setTotal(json.count); }
        } catch { message.error("Error"); }
        finally { setLoading(false); }
    }, [page, pageSize, search, statusFilter]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) { message.success("Đã xóa"); fetchPosts(); }
        } catch { message.error("Error"); }
    };

    const columns: ColumnsType<PostRow> = [
        { title: "Tiêu đề", dataIndex: "title", key: "title", ellipsis: true, render: (t: string, r) => <a onClick={() => router.push(`/admin/posts/${r.id}`)} className="font-medium">{t}</a> },
        { title: "Status", dataIndex: "status", key: "status", width: 100, render: (s: string) => <Tag color={s === "published" ? "green" : "default"}>{s}</Tag> },
        { title: "Views", dataIndex: "views", key: "views", width: 80 },
        { title: "Pro", dataIndex: "pro_user_only", key: "pro", width: 60, render: (v: boolean) => v ? <Tag color="gold">Pro</Tag> : null },
        { title: "Ngày tạo", dataIndex: "created_at", key: "created_at", width: 120, render: (d: string) => dayjs(d).format("DD/MM/YYYY") },
        {
            title: "", key: "actions", width: 120,
            render: (_, r) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => router.push(`/admin/posts/${r.id}`)} />
                    <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Card
                title={<h1 className="text-2xl font-bold m-0">Blog Posts</h1>}
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/admin/posts/new")}>Tạo mới</Button>}
            >
                <Space className="mb-4" wrap>
                    <Input.Search placeholder="Tìm tiêu đề..." allowClear onSearch={(v) => { setSearch(v); setPage(1); }} style={{ width: 220 }} prefix={<SearchOutlined />} />
                    <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} style={{ width: 130 }} allowClear placeholder="Status">
                        <Select.Option value="published">Published</Select.Option>
                        <Select.Option value="draft">Draft</Select.Option>
                    </Select>
                </Space>
                <Table columns={columns} dataSource={posts} rowKey="id" loading={loading}
                    onChange={(p: TablePaginationConfig) => { setPage(p.current ?? 1); setPageSize(p.pageSize ?? 20); }}
                    pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `Tổng ${t} bài` }}
                />
            </Card>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
