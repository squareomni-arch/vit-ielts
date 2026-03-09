import { useEffect, useState, useCallback } from "react";
import { Table, Tag, Input, Space, Card, Button, Select, Avatar, message } from "antd";
import { SearchOutlined, UserOutlined, CrownOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";

type UserRow = {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    is_pro: boolean;
    pro_expiration_date: string | null;
    roles: string[];
    created_at: string;
};

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [search, setSearch] = useState("");
    const [proFilter, setProFilter] = useState<string>("all");

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(pageSize),
            });
            if (search) params.set("search", search);
            if (proFilter === "true") params.set("isPro", "true");
            if (proFilter === "false") params.set("isPro", "false");

            const res = await fetch(`/api/admin/users?${params}`);
            const json = await res.json();
            if (json.success) {
                setUsers(json.data);
                setTotal(json.count);
            }
        } catch {
            message.error("Lỗi khi tải danh sách users");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, proFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleTableChange = (pagination: TablePaginationConfig) => {
        setPage(pagination.current ?? 1);
        setPageSize(pagination.pageSize ?? 20);
    };

    const columns: ColumnsType<UserRow> = [
        {
            title: "Avatar",
            dataIndex: "avatar_url",
            key: "avatar",
            width: 60,
            render: (url: string | null) => (
                <Avatar src={url} icon={<UserOutlined />} size={36} />
            ),
        },
        {
            title: "Tên",
            dataIndex: "name",
            key: "name",
            sorter: true,
            render: (name: string | null) => name || "—",
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            ellipsis: true,
        },
        {
            title: "Pro",
            dataIndex: "is_pro",
            key: "is_pro",
            width: 80,
            render: (isPro: boolean) =>
                isPro ? (
                    <Tag color="gold" icon={<CrownOutlined />}>PRO</Tag>
                ) : (
                    <Tag>Free</Tag>
                ),
        },
        {
            title: "Hết hạn Pro",
            dataIndex: "pro_expiration_date",
            key: "pro_expiration_date",
            width: 130,
            render: (date: string | null) => {
                if (!date) return "—";
                const isExpired = new Date(date) < new Date();
                return (
                    <span className={isExpired ? "text-red-500" : "text-green-600"}>
                        {dayjs(date).format("DD/MM/YYYY")}
                    </span>
                );
            },
        },
        {
            title: "Role",
            dataIndex: "roles",
            key: "roles",
            width: 120,
            render: (roles: string[]) => {
                const r = Array.isArray(roles) ? roles : [];
                if (r.includes("administrator")) return <Tag color="red">Admin</Tag>;
                return <Tag>User</Tag>;
            },
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            key: "created_at",
            width: 130,
            sorter: true,
            render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
        },
        {
            title: "",
            key: "actions",
            width: 90,
            render: (_, record) => (
                <Button
                    type="link"
                    size="small"
                    onClick={() => router.push(`/admin/users/${record.id}`)}
                >
                    Chi tiết
                </Button>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Card
                title={<h1 className="text-2xl font-bold m-0">Quản lý Users</h1>}
                extra={
                    <Space>
                        <Input.Search
                            placeholder="Tìm theo tên, email..."
                            allowClear
                            onSearch={handleSearch}
                            style={{ width: 250 }}
                            prefix={<SearchOutlined />}
                        />
                        <Select
                            value={proFilter}
                            onChange={(v) => { setProFilter(v); setPage(1); }}
                            style={{ width: 120 }}
                        >
                            <Select.Option value="all">Tất cả</Select.Option>
                            <Select.Option value="true">Pro</Select.Option>
                            <Select.Option value="false">Free</Select.Option>
                        </Select>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    onChange={handleTableChange}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        showTotal: (t) => `Tổng ${t} users`,
                    }}
                    scroll={{ x: 900 }}
                />
            </Card>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
