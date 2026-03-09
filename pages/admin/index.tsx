import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Table, Tag, Spin } from "antd";
import {
    UserOutlined,
    CrownOutlined,
    UserAddOutlined,
    FileTextOutlined,
    DollarOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "./_layout";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";

type DashboardData = {
    totalUsers: number;
    proUsers: number;
    todayUsers: number;
    totalTestsTaken: number;
    monthlyRevenue: number;
    recentOrders: {
        order_id: string;
        user_id: string;
        user_email: string | null;
        user_name: string | null;
        package_type: string;
        amount: number;
        status: string;
        created_at: string;
    }[];
    topQuizzes: {
        id: string;
        title: string;
        slug: string;
        skill: string;
        type: string;
        tests_taken: number;
        status: string;
    }[];
};

const formatPrice = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/dashboard");
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            }
        } catch (error) {
            console.error("Failed to load dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const orderColumns: ColumnsType<DashboardData["recentOrders"][0]> = [
        {
            title: "Order ID",
            dataIndex: "order_id",
            key: "order_id",
            width: 180,
            render: (id: string) => (
                <span className="font-mono text-xs">{id.length > 20 ? id.substring(0, 20) + "..." : id}</span>
            ),
        },
        {
            title: "Khách hàng",
            key: "user",
            render: (_, record) => (
                <div>
                    <div className="text-sm font-medium">{record.user_name ?? "—"}</div>
                    <div className="text-xs text-gray-500">{record.user_email ?? record.user_id?.substring(0, 8)}</div>
                </div>
            ),
        },
        {
            title: "Gói",
            dataIndex: "package_type",
            key: "package_type",
            render: (type: string) => <Tag>{type ?? "—"}</Tag>,
        },
        {
            title: "Số tiền",
            dataIndex: "amount",
            key: "amount",
            render: (amount: number) => <span className="font-semibold">{formatPrice(amount)}</span>,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status: string) => {
                const colors: Record<string, string> = {
                    pending: "orange",
                    completed: "green",
                    cancelled: "red",
                };
                return <Tag color={colors[status] ?? "default"}>{status}</Tag>;
            },
        },
        {
            title: "Ngày",
            dataIndex: "created_at",
            key: "created_at",
            render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
        },
    ];

    const quizColumns: ColumnsType<DashboardData["topQuizzes"][0]> = [
        {
            title: "#",
            key: "index",
            width: 50,
            render: (_, __, index) => <span className="text-gray-500">{index + 1}</span>,
        },
        {
            title: "Bài test",
            dataIndex: "title",
            key: "title",
            ellipsis: true,
        },
        {
            title: "Skill",
            dataIndex: "skill",
            key: "skill",
            width: 100,
            render: (skill: string) => (
                <Tag color={skill === "reading" ? "blue" : "purple"}>{skill}</Tag>
            ),
        },
        {
            title: "Loại",
            dataIndex: "type",
            key: "type",
            width: 100,
            render: (type: string) => <Tag>{type}</Tag>,
        },
        {
            title: "Lượt làm",
            dataIndex: "tests_taken",
            key: "tests_taken",
            width: 100,
            sorter: (a, b) => a.tests_taken - b.tests_taken,
            render: (count: number) => <span className="font-bold text-blue-600">{count}</span>,
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

    return (
        <AdminLayout>
            <div>
                <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

                {/* Stats Cards */}
                <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Tổng Users"
                                value={data?.totalUsers ?? 0}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: "#1890ff" }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Users Pro"
                                value={data?.proUsers ?? 0}
                                prefix={<CrownOutlined />}
                                valueStyle={{ color: "#faad14" }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Users mới hôm nay"
                                value={data?.todayUsers ?? 0}
                                prefix={<UserAddOutlined />}
                                valueStyle={{ color: "#52c41a" }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Tổng bài test đã làm"
                                value={data?.totalTestsTaken ?? 0}
                                prefix={<FileTextOutlined />}
                                valueStyle={{ color: "#722ed1" }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Revenue Card */}
                <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24}>
                        <Card>
                            <Statistic
                                title="Doanh thu tháng này"
                                value={data?.monthlyRevenue ?? 0}
                                prefix={<DollarOutlined />}
                                valueStyle={{ color: "#3f8600", fontSize: 28 }}
                                formatter={(value) => formatPrice(Number(value))}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Recent Orders */}
                <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24}>
                        <Card title="Đơn hàng gần đây">
                            <Table
                                columns={orderColumns}
                                dataSource={data?.recentOrders ?? []}
                                rowKey="order_id"
                                pagination={false}
                                size="small"
                                scroll={{ x: 800 }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Top Quizzes */}
                <Row gutter={[16, 16]}>
                    <Col xs={24}>
                        <Card title="Top 10 bài test làm nhiều nhất">
                            <Table
                                columns={quizColumns}
                                dataSource={data?.topQuizzes ?? []}
                                rowKey="id"
                                pagination={false}
                                size="small"
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
