import { useEffect, useState, useCallback } from "react";
import { Table, Tag, Input, Space, Button, Select, message } from "antd";
import { SearchOutlined, DownloadOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { AdminPageHeader, AdminGlassCard } from "@/widgets/admin";

const formatPrice = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

type OrderRow = {
    id: string;
    order_id: string;
    user_id: string;
    users: { id: string; email: string; name: string | null } | null;
    package_type: string;
    amount: number;
    status: string;
    created_at: string;
};

export default function AdminOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            if (search) params.set("search", search);
            if (statusFilter) params.set("status", statusFilter);

            const res = await fetch(`/api/admin/orders?${params}`);
            const json = await res.json();
            if (json.success) { setOrders(json.data); setTotal(json.count); }
        } catch { message.error("Lỗi tải đơn hàng"); }
        finally { setLoading(false); }
    }, [page, pageSize, search, statusFilter]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleExport = () => { window.open("/api/admin/orders/export", "_blank"); };

    const columns: ColumnsType<OrderRow> = [
        {
            title: "Order ID", dataIndex: "order_id", key: "order_id", width: 180,
            render: (id: string) => <span className="font-mono text-xs">{id.length > 16 ? id.substring(0, 16) + "..." : id}</span>,
        },
        {
            title: "Khách hàng", key: "user",
            render: (_, r) => (
                <div>
                    <div className="text-sm font-medium">{r.users?.name ?? "—"}</div>
                    <div className="text-xs text-gray-500">{r.users?.email ?? ""}</div>
                </div>
            ),
        },
        { title: "Gói", dataIndex: "package_type", key: "package_type", width: 100, render: (v: string) => <Tag>{v ?? "—"}</Tag> },
        { title: "Số tiền", dataIndex: "amount", key: "amount", width: 120, render: (v: number) => <span className="font-semibold">{formatPrice(v)}</span> },
        {
            title: "Trạng thái", dataIndex: "status", key: "status", width: 110,
            render: (s: string) => {
                const colors: Record<string, string> = { pending: "orange", completed: "green", cancelled: "red" };
                return <Tag color={colors[s]}>{s}</Tag>;
            },
        },
        { title: "Ngày", dataIndex: "created_at", key: "created_at", width: 130, render: (d: string) => dayjs(d).format("DD/MM/YYYY HH:mm") },
        {
            title: "", key: "actions", width: 80,
            render: (_, r) => <Button type="link" size="small" onClick={() => router.push(`/admin/orders/${r.id}`)}>Chi tiết</Button>,
        },
    ];

    return (
        <AdminLayout>
            <AdminPageHeader
                icon={<ShoppingCartOutlined />}
                title="Quản lý đơn hàng"
                actions={<Button icon={<DownloadOutlined />} onClick={handleExport}>Export CSV</Button>}
            />
            <AdminGlassCard>
                <Space style={{ marginBottom: 16 }} wrap>
                    <Input.Search placeholder="Tìm Order ID..." allowClear onSearch={(v) => { setSearch(v); setPage(1); }} style={{ width: 220 }} prefix={<SearchOutlined />} />
                    <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} style={{ width: 140 }} allowClear placeholder="Trạng thái">
                        <Select.Option value="pending">Pending</Select.Option>
                        <Select.Option value="completed">Completed</Select.Option>
                        <Select.Option value="cancelled">Cancelled</Select.Option>
                    </Select>
                </Space>
                <Table columns={columns} dataSource={orders} rowKey="id" loading={loading}
                    onChange={(p: TablePaginationConfig) => { setPage(p.current ?? 1); setPageSize(p.pageSize ?? 20); }}
                    pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `Tổng ${t} đơn` }}
                    scroll={{ x: 900 }}
                />
            </AdminGlassCard>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
