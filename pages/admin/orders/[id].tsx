import { useEffect, useState } from "react";
import { Card, Descriptions, Tag, Button, Space, message, Spin, Modal, InputNumber, Switch } from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";

const formatPrice = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

type OrderDetail = {
    id: string;
    order_id: string;
    user_id: string | null;
    users: { id: string; email: string; name: string | null; is_pro: boolean; pro_expiration_date: string | null } | null;
    package_type: string | null;
    duration: number;
    skill_type: string | null;
    amount: number;
    original_amount: number | null;
    discount_amount: number;
    coupon_id: string | null;
    coupon_code: string | null;
    status: string;
    payment_method: string | null;
    transfer_content: string | null;
    affiliate_ref: string | null;
    created_at: string;
};

export default function AdminOrderDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState(false);
    const [activatePro, setActivatePro] = useState(true);
    const [durationMonths, setDurationMonths] = useState(1);

    useEffect(() => { if (id) fetchOrder(); }, [id]);

    const fetchOrder = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/orders/${id}`);
            const json = await res.json();
            if (json.success) setOrder(json.data);
            else message.error("Order not found");
        } catch { message.error("Error loading order"); }
        finally { setLoading(false); }
    };

    const handleUpdateStatus = async (status: string) => {
        try {
            const body: Record<string, unknown> = { status };
            if (status === "completed") {
                body.activatePro = activatePro;
                body.durationMonths = durationMonths;
            }
            const res = await fetch(`/api/admin/orders/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (json.success) {
                message.success("Cập nhật thành công");
                setConfirmModal(false);
                fetchOrder();
            } else message.error(json.error);
        } catch { message.error("Error updating order"); }
    };

    if (loading) return <AdminLayout><div className="flex items-center justify-center" style={{ minHeight: 400 }}><Spin size="large" /></div></AdminLayout>;
    if (!order) return <AdminLayout><Card><p>Order not found</p></Card></AdminLayout>;

    const statusColors: Record<string, string> = { pending: "orange", completed: "green", cancelled: "red" };

    return (
        <AdminLayout>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/admin/orders")} className="mb-4">Quay lại</Button>

            <Card
                title={<h2 className="text-xl font-bold m-0">Chi tiết đơn hàng</h2>}
                extra={
                    order.status === "pending" && (
                        <Space>
                            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setConfirmModal(true)}>Xác nhận thanh toán</Button>
                            <Button danger icon={<CloseCircleOutlined />} onClick={() => handleUpdateStatus("cancelled")}>Hủy đơn</Button>
                        </Space>
                    )
                }
            >
                <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Order ID"><span className="font-mono">{order.order_id}</span></Descriptions.Item>
                    <Descriptions.Item label="Trạng thái"><Tag color={statusColors[order.status]}>{order.status}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Khách hàng">{order.users?.name ?? "—"} ({order.users?.email ?? "—"})</Descriptions.Item>
                    <Descriptions.Item label="Pro hiện tại">{order.users?.is_pro ? <Tag color="gold">PRO</Tag> : <Tag>Free</Tag>}</Descriptions.Item>
                    <Descriptions.Item label="Gói">{order.package_type ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Thời gian">{order.duration} tháng</Descriptions.Item>
                    <Descriptions.Item label="Số tiền gốc">{formatPrice(order.original_amount ?? order.amount)}</Descriptions.Item>
                    <Descriptions.Item label="Giảm giá">{formatPrice(order.discount_amount)}</Descriptions.Item>
                    <Descriptions.Item label="Tổng thanh toán"><span className="text-lg font-bold text-green-600">{formatPrice(order.amount)}</span></Descriptions.Item>
                    <Descriptions.Item label="Mã giảm giá">{order.coupon_code ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Phương thức">{order.payment_method ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Nội dung CK">{order.transfer_content ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Affiliate ref">{order.affiliate_ref ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">{dayjs(order.created_at).format("DD/MM/YYYY HH:mm:ss")}</Descriptions.Item>
                </Descriptions>
            </Card>

            <Modal
                title="Xác nhận thanh toán"
                open={confirmModal}
                onOk={() => handleUpdateStatus("completed")}
                onCancel={() => setConfirmModal(false)}
                okText="Xác nhận"
                cancelText="Hủy"
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Switch checked={activatePro} onChange={setActivatePro} />
                        <span>Kích hoạt Pro cho user</span>
                    </div>
                    {activatePro && (
                        <div>
                            <label className="block text-sm mb-1">Thời gian Pro (tháng)</label>
                            <InputNumber min={1} max={24} value={durationMonths} onChange={(v) => setDurationMonths(v ?? 1)} />
                        </div>
                    )}
                </div>
            </Modal>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
