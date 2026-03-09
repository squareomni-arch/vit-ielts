import { useEffect, useState, useCallback } from "react";
import { Table, Tag, Card, message, Popconfirm, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import AdminLayout from "../_layout";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";

type TestResultRow = {
    id: string;
    user_id: string;
    quiz_id: string;
    score: number | null;
    status: string;
    test_time: number | null;
    submitted_at: string | null;
    created_at: string;
    users: { email: string; name: string | null } | null;
    quizzes: { title: string; skill: string; type: string } | null;
};

export default function AdminTestResultsPage() {
    const [results, setResults] = useState<TestResultRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const fetchResults = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            const res = await fetch(`/api/admin/test-results?${params}`);
            const json = await res.json();
            if (json.success) { setResults(json.data); setTotal(json.count); }
        } catch { message.error("Error"); }
        finally { setLoading(false); }
    }, [page, pageSize]);

    useEffect(() => { fetchResults(); }, [fetchResults]);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/test-results?id=${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) { message.success("Đã xóa"); fetchResults(); }
        } catch { message.error("Error"); }
    };

    const columns: ColumnsType<TestResultRow> = [
        { title: "User", key: "user", render: (_, r) => <div><div className="text-sm font-medium">{r.users?.name ?? "—"}</div><div className="text-xs text-gray-500">{r.users?.email}</div></div> },
        { title: "Bài test", key: "quiz", ellipsis: true, render: (_, r) => r.quizzes?.title ?? "—" },
        { title: "Skill", key: "skill", width: 90, render: (_, r) => r.quizzes?.skill ? <Tag color={r.quizzes.skill === "reading" ? "blue" : "purple"}>{r.quizzes.skill}</Tag> : "—" },
        { title: "Điểm", dataIndex: "score", key: "score", width: 70, render: (v: number | null) => v !== null ? <span className="font-bold">{v}</span> : "—" },
        { title: "Status", dataIndex: "status", key: "status", width: 100, render: (s: string) => <Tag color={s === "published" ? "green" : "default"}>{s}</Tag> },
        { title: "Thời gian", dataIndex: "test_time", key: "test_time", width: 90, render: (v: number | null) => v ? `${v} phút` : "—" },
        { title: "Ngày nộp", dataIndex: "submitted_at", key: "submitted_at", width: 130, render: (d: string | null) => d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—" },
        {
            title: "", key: "actions", width: 60,
            render: (_, r) => (
                <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)} okText="Xóa" cancelText="Hủy">
                    <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Card title={<h1 className="text-2xl font-bold m-0">Test Results</h1>}>
                <Table columns={columns} dataSource={results} rowKey="id" loading={loading}
                    onChange={(p: TablePaginationConfig) => { setPage(p.current ?? 1); setPageSize(p.pageSize ?? 20); }}
                    pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `Tổng ${t} kết quả` }}
                    scroll={{ x: 900 }}
                />
            </Card>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
