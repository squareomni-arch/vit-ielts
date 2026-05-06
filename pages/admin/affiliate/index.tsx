import { useEffect, useState } from "react";
import {
    Card, Table, Tabs, Tag, Space, Button, message, Modal,
    InputNumber, Input, Statistic, Row, Col, Spin, Popconfirm,
} from "antd";
import { EyeOutlined, DollarOutlined, UserOutlined, CheckOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "../_layout";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";

const formatPrice = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

type AffiliateRow = {
    id: string;
    user_id: string | null;
    custom_link: string | null;
    status: string;
    commission_rate: number;
    created_at: string;
    user?: { email: string; name: string | null } | null;
};

type CommissionRow = {
    id: string;
    affiliate_id: string | null;
    order_id: string | null;
    amount: number | null;
    commission_rate: number | null;
    commission_amount: number | null;
    status: string;
    created_at: string;
};

export default function AdminAffiliatePage() {
    const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
    const [commissions, setCommissions] = useState<CommissionRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [affRes, commRes] = await Promise.all([
                fetch("/api/admin/affiliate-v2"),
                fetch("/api/admin/affiliate-v2/commissions"),
            ]);
            const affJson = await affRes.json();
            const commJson = await commRes.json();
            if (affJson.success) setAffiliates(affJson.data);
            if (commJson.success) setCommissions(commJson.data);
        } catch { message.error("Error"); }
        finally { setLoading(false); }
    };

    const handleApprove = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/affiliate-v2/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "approved" }),
            });
            const json = await res.json();
            if (json.success) { message.success("Đã duyệt"); fetchData(); }
        } catch { message.error("Error"); }
    };

    const handlePayCommission = async (id: string) => {
        try {
            const res = await fetch("/api/admin/affiliate-v2/commissions", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: "paid" }),
            });
            const json = await res.json();
            if (json.success) { message.success("Đã thanh toán"); fetchData(); }
        } catch { message.error("Error"); }
    };

    const affColumns: ColumnsType<AffiliateRow> = [
        {
            title: "User", key: "user",
            render: (_, r) => (
                <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--admin-text-primary)" }}>{r.user?.name ?? "—"}</div>
                    {r.user?.email && <div className="text-xs font-semibold text-blue-600">{r.user.email}</div>}
                    <span className="font-mono text-xs mt-1 block" style={{ color: "var(--admin-text-secondary)" }}>ID: {r.user_id?.substring(0, 12) ?? "—"}...</span>
                </div>
            ),
        },
        { title: "Link", dataIndex: "custom_link", key: "custom_link", render: (v: string | null) => v ?? "—" },
        {
            title: "Status", dataIndex: "status", key: "status", width: 110,
            render: (s: string) => {
                const colors: Record<string, string> = { pending: "orange", approved: "green", rejected: "red" };
                return <Tag color={colors[s]}>{s}</Tag>;
            },
        },
        {
            title: "Rate", dataIndex: "commission_rate", key: "commission_rate", width: 80,
            // DB stores commission_rate as decimal (0.1 = 10%), so multiply by 100 for display.
            render: (v: number | null | undefined) =>
                v == null ? "—" : `${+(v * 100).toFixed(2)}%`,
        },
        { title: "Ngày", dataIndex: "created_at", key: "created_at", width: 120, render: (d: string) => dayjs(d).format("DD/MM/YYYY") },
        {
            title: "", key: "actions", width: 100,
            render: (_, r) => r.status === "pending" ? (
                <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(r.id)}>Duyệt</Button>
            ) : null,
        },
    ];

    const commColumns: ColumnsType<CommissionRow> = [
        {
            title: "Affiliate", dataIndex: "affiliate_id", key: "affiliate_id",
            render: (v: string | null) => (
                <span className="font-mono text-xs break-all">{v ?? "—"}</span>
            ),
        },
        {
            title: "Order", dataIndex: "order_id", key: "order_id",
            render: (v: string | null) => (
                <span className="font-mono text-xs break-all">{v ?? "—"}</span>
            ),
        },
        { title: "Amount", dataIndex: "amount", key: "amount", width: 120, render: (v: number | null) => v ? formatPrice(v) : "—" },
        { title: "Commission", dataIndex: "commission_amount", key: "commission_amount", width: 120, render: (v: number | null) => v ? <span className="font-bold text-green-600">{formatPrice(v)}</span> : "—" },
        {
            title: "Status", dataIndex: "status", key: "status", width: 110,
            render: (s: string) => <Tag color={s === "paid" ? "green" : s === "pending" ? "orange" : "red"}>{s}</Tag>,
        },
        { title: "Ngày", dataIndex: "created_at", key: "created_at", width: 120, render: (d: string) => dayjs(d).format("DD/MM/YYYY") },
        {
            title: "", key: "actions", width: 100,
            render: (_, r) => r.status === "pending" ? (
                <Button type="primary" size="small" onClick={() => handlePayCommission(r.id)}>Thanh toán</Button>
            ) : null,
        },
    ];

    if (loading) return <AdminLayout><div className="flex items-center justify-center" style={{ minHeight: 400 }}><Spin size="large" /></div></AdminLayout>;

    const totalCommissions = commissions.reduce((sum, c) => sum + (c.commission_amount ?? 0), 0);
    const pendingCommissions = commissions.filter(c => c.status === "pending").reduce((sum, c) => sum + (c.commission_amount ?? 0), 0);

    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold mb-4">Affiliate Management</h1>

            <Row gutter={16} className="mb-4">
                <Col span={6}><Card><Statistic title="Tổng Affiliates" value={affiliates.length} prefix={<UserOutlined />} /></Card></Col>
                <Col span={6}><Card><Statistic title="Đang chờ duyệt" value={affiliates.filter(a => a.status === "pending").length} valueStyle={{ color: "#faad14" }} /></Card></Col>
                <Col span={6}><Card><Statistic title="Tổng hoa hồng" value={totalCommissions} prefix="₫" valueStyle={{ color: "#3f8600" }} /></Card></Col>
                <Col span={6}><Card><Statistic title="Chờ thanh toán" value={pendingCommissions} prefix="₫" valueStyle={{ color: "#cf1322" }} /></Card></Col>
            </Row>

            <Tabs
                type="card"
                items={[
                    {
                        key: "affiliates",
                        label: `Affiliates (${affiliates.length})`,
                        children: <Table columns={affColumns} dataSource={affiliates} rowKey="id" pagination={{ pageSize: 15 }} />,
                    },
                    {
                        key: "commissions",
                        label: `Commissions (${commissions.length})`,
                        children: <Table columns={commColumns} dataSource={commissions} rowKey="id" pagination={{ pageSize: 15 }} />,
                    },
                ]}
            />
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
