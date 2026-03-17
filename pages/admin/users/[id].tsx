import { useEffect, useState } from "react";
import {
    Card, Descriptions, Tag, Button, Tabs, Table, Modal,
    InputNumber, Space, message, Spin, Avatar, Popconfirm, Tooltip,
} from "antd";
import {
    UserOutlined, CrownOutlined, ArrowLeftOutlined,
    DesktopOutlined, TabletOutlined, MobileOutlined, CopyOutlined, CheckOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";

/* ── Device display helpers ──────────────────────────── */

type DeviceType = "desktop" | "tablet" | "mobile";
type DeviceEntry = { device_id: string };
type DevicesMap = Partial<Record<DeviceType, DeviceEntry>>;

const DEVICE_META: Record<DeviceType, { icon: React.ReactNode; label: string; color: string }> = {
    desktop: { icon: <DesktopOutlined />, label: "Desktop", color: "#1677ff" },
    tablet:  { icon: <TabletOutlined />,  label: "Tablet",  color: "#722ed1" },
    mobile:  { icon: <MobileOutlined />,  label: "Mobile",  color: "#13c2c2" },
};

function DeviceCard({ type, entry }: { type: DeviceType; entry?: DeviceEntry }) {
    const [copied, setCopied] = useState(false);
    const meta = DEVICE_META[type];
    const id = entry?.device_id;

    const handleCopy = async () => {
        if (!id) return;
        await navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid ${id ? meta.color + "40" : "#f0f0f0"}`,
                background: id ? meta.color + "08" : "#fafafa",
                opacity: id ? 1 : 0.45,
                minWidth: 220,
            }}
        >
            <span
                style={{
                    fontSize: 22,
                    color: id ? meta.color : "#bfbfbf",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                {meta.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: id ? "#262626" : "#bfbfbf" }}>
                    {meta.label}
                </div>
                {id ? (
                    <Tooltip title={id}>
                        <span
                            className="font-mono"
                            style={{ fontSize: 11, color: "#8c8c8c", cursor: "default" }}
                        >
                            {id.slice(0, 8)}…{id.slice(-4)}
                        </span>
                    </Tooltip>
                ) : (
                    <span style={{ fontSize: 11, color: "#d9d9d9" }}>Chưa đăng ký</span>
                )}
            </div>
            {id && (
                <Tooltip title={copied ? "Đã copy!" : "Copy ID"}>
                    <Button
                        type="text"
                        size="small"
                        icon={copied ? <CheckOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
                        onClick={handleCopy}
                        style={{ color: "#8c8c8c" }}
                    />
                </Tooltip>
            )}
        </div>
    );
}

function DevicesDisplay({ devices }: { devices: DevicesMap | null }) {
    const deviceMap = (devices ?? {}) as DevicesMap;
    const types: DeviceType[] = ["desktop", "tablet", "mobile"];
    const hasAny = types.some((t) => deviceMap[t]?.device_id);

    if (!hasAny) return <span>—</span>;

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {types.map((type) => (
                <DeviceCard key={type} type={type} entry={deviceMap[type]} />
            ))}
        </div>
    );
}

const formatPrice = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

type UserDetail = {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    is_pro: boolean;
    pro_expiration_date: string | null;
    target_score: Record<string, unknown> | null;
    gender: string | null;
    date_of_birth: string | null;
    phone_number: string | null;
    roles: string[];
    devices: Record<string, unknown> | null;
    created_at: string;
};

export default function AdminUserDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const [user, setUser] = useState<UserDetail | null>(null);
    const [testResults, setTestResults] = useState<unknown[]>([]);
    const [orders, setOrders] = useState<unknown[]>([]);
    const [loading, setLoading] = useState(true);
    const [proModalVisible, setProModalVisible] = useState(false);
    const [durationMonths, setDurationMonths] = useState(1);

    useEffect(() => {
        if (id) fetchUser();
    }, [id]);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${id}`);
            const json = await res.json();
            if (json.success) {
                setUser(json.data.user);
                setTestResults(json.data.testResults);
                setOrders(json.data.orders);
            } else {
                message.error("User not found");
            }
        } catch {
            message.error("Error loading user");
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePro = async (action: "activate" | "deactivate") => {
        try {
            const res = await fetch(`/api/admin/users/${id}/toggle-pro`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, durationMonths }),
            });
            const json = await res.json();
            if (json.success) {
                message.success(json.message);
                setProModalVisible(false);
                fetchUser();
            } else {
                message.error(json.error);
            }
        } catch {
            message.error("Error toggling Pro status");
        }
    };

    const testColumns: ColumnsType<Record<string, unknown>> = [
        {
            title: "Bài test",
            key: "quiz",
            render: (_, r: Record<string, unknown>) => {
                const quiz = r.quizzes as Record<string, unknown> | null;
                return quiz?.title as string ?? "—";
            },
        },
        {
            title: "Skill",
            key: "skill",
            width: 100,
            render: (_, r: Record<string, unknown>) => {
                const quiz = r.quizzes as Record<string, unknown> | null;
                const skill = quiz?.skill as string;
                return skill ? <Tag color={skill === "reading" ? "blue" : "purple"}>{skill}</Tag> : "—";
            },
        },
        {
            title: "Điểm",
            dataIndex: "score",
            key: "score",
            width: 80,
            render: (score: number | null) =>
                score !== null ? <span className="font-bold">{score}</span> : "—",
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 100,
            render: (s: string) => (
                <Tag color={s === "published" ? "green" : "default"}>{s}</Tag>
            ),
        },
        {
            title: "Ngày nộp",
            dataIndex: "submitted_at",
            key: "submitted_at",
            width: 140,
            render: (d: string | null) => d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—",
        },
    ];

    const orderColumns: ColumnsType<Record<string, unknown>> = [
        {
            title: "Order ID",
            dataIndex: "order_id",
            key: "order_id",
            width: 200,
            render: (id: string) => <span className="font-mono text-xs">{id}</span>,
        },
        {
            title: "Gói",
            dataIndex: "package_type",
            key: "package_type",
            width: 100,
        },
        {
            title: "Số tiền",
            dataIndex: "amount",
            key: "amount",
            width: 120,
            render: (amount: number) => formatPrice(amount),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 110,
            render: (s: string) => {
                const colors: Record<string, string> = { pending: "orange", completed: "green", cancelled: "red" };
                return <Tag color={colors[s]}>{s}</Tag>;
            },
        },
        {
            title: "Ngày",
            dataIndex: "created_at",
            key: "created_at",
            width: 140,
            render: (d: string) => dayjs(d).format("DD/MM/YYYY HH:mm"),
        },
    ];

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
                    <Spin size="large" />
                </div>
            </AdminLayout>
        );
    }

    if (!user) {
        return (
            <AdminLayout>
                <Card>
                    <p>User not found</p>
                    <Button onClick={() => router.push("/admin/users")}>Quay lại</Button>
                </Card>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push("/admin/users")}
                    className="mb-4"
                >
                    Quay lại
                </Button>

                <Card
                    title={
                        <Space>
                            <Avatar src={user.avatar_url} icon={<UserOutlined />} size={48} />
                            <div>
                                <h2 className="text-xl font-bold m-0">{user.name || user.email}</h2>
                                <span className="text-gray-500 text-sm">{user.email}</span>
                            </div>
                        </Space>
                    }
                    extra={
                        <Space>
                            {user.is_pro ? (
                                <Popconfirm
                                    title="Hủy Pro?"
                                    description="User sẽ không còn quyền truy cập Pro"
                                    onConfirm={() => handleTogglePro("deactivate")}
                                    okText="Xác nhận"
                                    cancelText="Hủy"
                                >
                                    <Button danger>Hủy Pro</Button>
                                </Popconfirm>
                            ) : (
                                <Button
                                    type="primary"
                                    icon={<CrownOutlined />}
                                    onClick={() => setProModalVisible(true)}
                                >
                                    Kích hoạt Pro
                                </Button>
                            )}
                        </Space>
                    }
                >
                    <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                        <Descriptions.Item label="ID">
                            <span className="font-mono text-xs">{user.id}</span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Pro Status">
                            {user.is_pro ? (
                                <Tag color="gold" icon={<CrownOutlined />}>PRO</Tag>
                            ) : (
                                <Tag>Free</Tag>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Pro hết hạn">
                            {user.pro_expiration_date
                                ? dayjs(user.pro_expiration_date).format("DD/MM/YYYY")
                                : "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Giới tính">{user.gender || "—"}</Descriptions.Item>
                        <Descriptions.Item label="Ngày sinh">
                            {user.date_of_birth ? dayjs(user.date_of_birth).format("DD/MM/YYYY") : "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="SĐT">{user.phone_number || "—"}</Descriptions.Item>
                        <Descriptions.Item label="Roles">
                            {(typeof user.roles === 'string' ? [user.roles] : Array.isArray(user.roles) ? user.roles : []).map((r) => (
                                <Tag key={r} color={r === "administrator" ? "red" : "blue"}>{r}</Tag>
                            ))}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày đăng ký">
                            {dayjs(user.created_at).format("DD/MM/YYYY HH:mm")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Target Score" span={2}>
                            {user.target_score ? (
                                <Space>
                                    {Object.entries(user.target_score).map(([k, v]) => (
                                        <Tag key={k}>{k}: {String(v)}</Tag>
                                    ))}
                                </Space>
                            ) : "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Devices" span={2}>
                            <DevicesDisplay devices={user.devices as DevicesMap} />
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                <Tabs
                    defaultActiveKey="tests"
                    className="mt-4"
                    items={[
                        {
                            key: "tests",
                            label: `Lịch sử làm bài (${testResults.length})`,
                            children: (
                                <Table
                                    columns={testColumns}
                                    dataSource={testResults as Record<string, unknown>[]}
                                    rowKey="id"
                                    pagination={{ pageSize: 10 }}
                                    size="small"
                                />
                            ),
                        },
                        {
                            key: "orders",
                            label: `Lịch sử thanh toán (${orders.length})`,
                            children: (
                                <Table
                                    columns={orderColumns}
                                    dataSource={orders as Record<string, unknown>[]}
                                    rowKey="id"
                                    pagination={{ pageSize: 10 }}
                                    size="small"
                                />
                            ),
                        },
                    ]}
                />

                {/* Pro Activation Modal */}
                <Modal
                    title="Kích hoạt Pro"
                    open={proModalVisible}
                    onOk={() => handleTogglePro("activate")}
                    onCancel={() => setProModalVisible(false)}
                    okText="Kích hoạt"
                    cancelText="Hủy"
                >
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thời gian Pro (tháng)
                        </label>
                        <InputNumber
                            min={1}
                            max={24}
                            value={durationMonths}
                            onChange={(v) => setDurationMonths(v ?? 1)}
                            addonAfter="tháng"
                            className="w-full"
                        />
                    </div>
                </Modal>
            </div>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
