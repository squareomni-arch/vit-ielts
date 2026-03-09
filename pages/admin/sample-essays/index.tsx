import { useEffect, useState, useCallback } from "react";
import { Table, Tag, Card, Button, Space, Input, Select, message, Popconfirm } from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";

type EssayRow = {
    id: string;
    title: string;
    slug: string;
    skill: string | null;
    part: string | null;
    status: string;
    pro_user_only: boolean;
    views: number;
    created_at: string;
};

export default function AdminSampleEssaysPage() {
    const router = useRouter();
    const [essays, setEssays] = useState<EssayRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const fetchEssays = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            if (search) params.set("search", search);
            if (statusFilter) params.set("status", statusFilter);
            const res = await fetch(`/api/admin/sample-essays?${params}`);
            const json = await res.json();
            if (json.success) { setEssays(json.data); setTotal(json.count); }
        } catch { message.error("Error"); }
        finally { setLoading(false); }
    }, [page, pageSize, search, statusFilter]);

    useEffect(() => { fetchEssays(); }, [fetchEssays]);

    const handleDelete = async (id: string) => {
        try { const res = await fetch(`/api/admin/sample-essays/${id}`, { method: "DELETE" }); const json = await res.json(); if (json.success) { message.success("Đã xóa"); fetchEssays(); } }
        catch { message.error("Error"); }
    };

    const columns: ColumnsType<EssayRow> = [
        { title: "Tiêu đề", dataIndex: "title", key: "title", ellipsis: true, render: (t: string, r) => <a onClick={() => router.push(`/admin/sample-essays/${r.id}`)} className="font-medium">{t}</a> },
        { title: "Skill", dataIndex: "skill", key: "skill", width: 90, render: (s: string | null) => s ? <Tag>{s}</Tag> : "—" },
        { title: "Part", dataIndex: "part", key: "part", width: 80 },
        { title: "Status", dataIndex: "status", key: "status", width: 100, render: (s: string) => <Tag color={s === "published" ? "green" : "default"}>{s}</Tag> },
        { title: "Views", dataIndex: "views", key: "views", width: 70 },
        { title: "Ngày tạo", dataIndex: "created_at", key: "created_at", width: 120, render: (d: string) => dayjs(d).format("DD/MM/YYYY") },
        {
            title: "", key: "actions", width: 120,
            render: (_, r) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => router.push(`/admin/sample-essays/${r.id}`)} />
                    <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Card
                title={<h1 className="text-2xl font-bold m-0">Sample Essays</h1>}
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/admin/sample-essays/new")}>Tạo mới</Button>}
            >
                <Space className="mb-4" wrap>
                    <Input.Search placeholder="Tìm tiêu đề..." allowClear onSearch={(v) => { setSearch(v); setPage(1); }} style={{ width: 220 }} prefix={<SearchOutlined />} />
                    <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} style={{ width: 130 }} allowClear placeholder="Status">
                        <Select.Option value="published">Published</Select.Option>
                        <Select.Option value="draft">Draft</Select.Option>
                    </Select>
                </Space>
                <Table columns={columns} dataSource={essays} rowKey="id" loading={loading}
                    onChange={(p: TablePaginationConfig) => { setPage(p.current ?? 1); setPageSize(p.pageSize ?? 20); }}
                    pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `Tổng ${t} bài` }}
                />
            </Card>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
