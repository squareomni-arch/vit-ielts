import { useCallback, useEffect, useState } from "react";
import { Table, Tag, Button, Select, Space, message, Popconfirm } from "antd";
import { DeleteOutlined, ContactsOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import AdminLayout from "../_layout";
import { withFullAdmin } from "@/shared/hoc/withAdmin";
import { AdminPageHeader, AdminGlassCard } from "@/widgets/admin";
import type { Lead, LeadStatus } from "~services/lead";

const STATUS_META: Record<LeadStatus, { label: string; color: string }> = {
    new: { label: "Mới", color: "blue" },
    contacted: { label: "Đã liên hệ", color: "gold" },
    converted: { label: "Đã chốt", color: "green" },
    spam: { label: "Spam", color: "red" },
};

export default function AdminLeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/leads");
            const json = await res.json();
            if (json.success) setLeads(json.data);
            else message.error(json.error || "Lỗi tải dữ liệu");
        } catch {
            message.error("Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const handleStatus = async (id: string, status: LeadStatus) => {
        try {
            const res = await fetch("/api/admin/leads", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status }),
            });
            const json = await res.json();
            if (json.success) {
                setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
            } else message.error(json.error);
        } catch {
            message.error("Lỗi cập nhật");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/leads?id=${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                message.success("Đã xóa");
                setLeads((prev) => prev.filter((l) => l.id !== id));
            } else message.error(json.error);
        } catch {
            message.error("Lỗi");
        }
    };

    const columns: ColumnsType<Lead> = [
        { title: "Họ tên", dataIndex: "name", key: "name", ellipsis: true, render: (v: string) => <span className="font-semibold">{v}</span> },
        { title: "Số điện thoại", dataIndex: "phone", key: "phone", width: 150, render: (v: string) => <a href={`tel:${v}`} className="font-mono">{v}</a> },
        { title: "Mục tiêu", dataIndex: "target_band", key: "target_band", width: 200, ellipsis: true, render: (v: string | null) => v || "—" },
        { title: "Nguồn", dataIndex: "source", key: "source", width: 110, responsive: ["lg"], render: (v: string) => <Tag>{v}</Tag> },
        {
            title: "Trạng thái", dataIndex: "status", key: "status", width: 160,
            render: (status: LeadStatus, r) => (
                <Select
                    size="small"
                    value={status}
                    style={{ width: 140 }}
                    onChange={(v) => handleStatus(r.id, v)}
                    options={(Object.keys(STATUS_META) as LeadStatus[]).map((s) => ({
                        value: s,
                        label: <Tag color={STATUS_META[s].color} style={{ marginInlineEnd: 0 }}>{STATUS_META[s].label}</Tag>,
                    }))}
                />
            ),
        },
        { title: "Ngày gửi", dataIndex: "created_at", key: "created_at", width: 150, render: (d: string) => dayjs(d).format("HH:mm DD/MM/YYYY") },
        {
            title: "", key: "actions", width: 60,
            render: (_, r) => (
                <Space size="small">
                    <Popconfirm title="Xóa lead này?" onConfirm={() => handleDelete(r.id)} okText="Xóa" cancelText="Hủy">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <AdminPageHeader
                icon={<ContactsOutlined />}
                title="Leads từ Landing page"
                actions={<Button onClick={fetchLeads}>Làm mới</Button>}
            />
            <AdminGlassCard>
                <Table
                    columns={columns}
                    dataSource={leads}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 20, showSizeChanger: true }}
                    scroll={{ x: "max-content" }}
                />
            </AdminGlassCard>
        </AdminLayout>
    );
}

export const getServerSideProps = withFullAdmin;
