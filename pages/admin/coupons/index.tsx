import { useEffect, useState, useCallback } from "react";
import {
    Table, Tag, Card, Button, Form, Input, InputNumber, Select, Switch,
    Modal, Space, message, Popconfirm, DatePicker,
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "../_layout";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";

const formatPrice = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

type CouponRow = {
    id: string;
    code: string;
    type: string | null;
    value: number;
    max_uses: number | null;
    current_uses: number;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
};

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<CouponRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<CouponRow | null>(null);
    const [form] = Form.useForm();

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/coupons");
            const json = await res.json();
            if (json.success) setCoupons(json.data);
        } catch { message.error("Error loading coupons"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

    const handleCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ type: "fixed", is_active: true }); setModalVisible(true); };
    const handleEdit = (c: CouponRow) => {
        setEditing(c);
        form.setFieldsValue({
            code: c.code, type: c.type, value: c.value, max_uses: c.max_uses,
            is_active: c.is_active, expires_at: c.expires_at ? dayjs(c.expires_at) : null,
        });
        setModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) { message.success("Đã xóa"); fetchCoupons(); }
            else message.error(json.error);
        } catch { message.error("Error"); }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const body = {
                ...values,
                expires_at: values.expires_at ? values.expires_at.toISOString() : null,
                ...(editing ? { id: editing.id } : {}),
            };
            const res = await fetch("/api/admin/coupons", {
                method: editing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (json.success) {
                message.success(editing ? "Cập nhật thành công" : "Tạo thành công");
                setModalVisible(false);
                fetchCoupons();
            } else message.error(json.error);
        } catch { message.error("Validation error"); }
    };

    const columns: ColumnsType<CouponRow> = [
        { title: "Mã", dataIndex: "code", key: "code", render: (c: string) => <span className="font-mono font-bold text-blue-600">{c}</span> },
        {
            title: "Loại", dataIndex: "type", key: "type", width: 100,
            render: (t: string) => <Tag color={t === "percent" ? "purple" : "blue"}>{t === "percent" ? "%" : "₫"}</Tag>,
        },
        {
            title: "Giá trị", key: "value", width: 130,
            render: (_, r) => r.type === "percent" ? `${r.value}%` : formatPrice(r.value),
        },
        { title: "Đã dùng / Max", key: "uses", width: 110, render: (_, r) => `${r.current_uses} / ${r.max_uses ?? "∞"}` },
        {
            title: "Active", dataIndex: "is_active", key: "is_active", width: 80,
            render: (v: boolean) => <Tag color={v ? "green" : "default"}>{v ? "ON" : "OFF"}</Tag>,
        },
        {
            title: "Hết hạn", dataIndex: "expires_at", key: "expires_at", width: 120,
            render: (d: string | null) => {
                if (!d) return "—";
                const expired = new Date(d) < new Date();
                return <span className={expired ? "text-red-500" : ""}>{dayjs(d).format("DD/MM/YYYY")}</span>;
            },
        },
        { title: "Ngày tạo", dataIndex: "created_at", key: "created_at", width: 120, render: (d: string) => dayjs(d).format("DD/MM/YYYY") },
        {
            title: "", key: "actions", width: 120,
            render: (_, r) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)} />
                    <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)} okText="Xóa" cancelText="Hủy">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Card
                title={<h1 className="text-2xl font-bold m-0">Quản lý mã giảm giá</h1>}
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Tạo mới</Button>}
            >
                <Table columns={columns} dataSource={coupons} rowKey="id" loading={loading} pagination={{ pageSize: 15, showSizeChanger: true }} />
                <Modal
                    title={editing ? "Sửa mã giảm giá" : "Tạo mã giảm giá mới"}
                    open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}
                    okText={editing ? "Cập nhật" : "Tạo"} cancelText="Hủy"
                >
                    <Form form={form} layout="vertical">
                        <Form.Item name="code" label="Mã giảm giá" rules={[{ required: true }, { pattern: /^[A-Z0-9]+$/, message: "Chỉ chữ hoa và số" }]}>
                            <Input placeholder="VD: IELTS30" style={{ textTransform: "uppercase" }} onInput={(e: React.FormEvent<HTMLInputElement>) => { e.currentTarget.value = e.currentTarget.value.toUpperCase(); }} />
                        </Form.Item>
                        <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
                            <Select options={[{ value: "fixed", label: "Số tiền cố định (₫)" }, { value: "percent", label: "Phần trăm (%)" }]} />
                        </Form.Item>
                        <Form.Item name="value" label="Giá trị" rules={[{ required: true }, { type: "number", min: 1 }]}>
                            <InputNumber className="w-full" />
                        </Form.Item>
                        <Form.Item name="max_uses" label="Số lượng tối đa">
                            <InputNumber className="w-full" min={1} />
                        </Form.Item>
                        <Form.Item name="expires_at" label="Ngày hết hạn">
                            <DatePicker className="w-full" />
                        </Form.Item>
                        {editing && (
                            <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
                                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                            </Form.Item>
                        )}
                    </Form>
                </Modal>
            </Card>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
