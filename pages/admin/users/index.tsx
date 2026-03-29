import { useEffect, useState, useCallback } from "react";
import { AdminPageHeader } from "@/widgets/admin";
import {
    Table, Tag, Input, Space, Card, Button, Select, Avatar,
    message, DatePicker, Tooltip, Badge, Dropdown,
} from "antd";
import {
    SearchOutlined, UserOutlined, CrownOutlined,
    ReloadOutlined, FilterOutlined, DownOutlined,
    ClearOutlined, TeamOutlined, SafetyCertificateOutlined,
    ClockCircleOutlined, ExportOutlined
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { FilterValue, SorterResult } from "antd/es/table/interface";
import type { MenuProps } from "antd";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";

const { RangePicker } = DatePicker;

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

type UserStats = {
    total: number;
    administrator: number;
    subscriber: number;
    proActive: number;
    proExpired: number;
    free: number;
};

type QuickFilter = "all" | "administrator" | "subscriber" | "proActive" | "proExpired" | "free";

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // ── Filters ──
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [proFilter, setProFilter] = useState<string>("all");
    const [proStatusFilter, setProStatusFilter] = useState<string>("all");
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const [sortField, setSortField] = useState<string>("created_at");
    const [sortOrder, setSortOrder] = useState<string>("desc");

    // ── Stats ──
    const [stats, setStats] = useState<UserStats | null>(null);
    const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter>("all");
    const [showFilters, setShowFilters] = useState(false);

    // ── Bulk actions ──
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    // Count active filters
    const activeFilterCount = [
        roleFilter !== "all",
        proFilter !== "all",
        proStatusFilter !== "all",
        dateRange !== null,
        search !== "",
    ].filter(Boolean).length;

    // ── Fetch stats ──
    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/users/stats");
            const json = await res.json();
            if (json.success) {
                setStats(json.stats);
            }
        } catch {
            // silently fail — stats are non-critical
        }
    }, []);

    // ── Fetch users ──
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(pageSize),
                sort: sortField,
                order: sortOrder,
            });
            if (search) params.set("search", search);
            if (proFilter !== "all") params.set("isPro", proFilter);
            if (roleFilter !== "all") params.set("role", roleFilter);
            if (proStatusFilter !== "all") params.set("proStatus", proStatusFilter);
            if (dateRange?.[0]) params.set("dateFrom", dateRange[0].toISOString());
            if (dateRange?.[1]) params.set("dateTo", dateRange[1].toISOString());

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
    }, [page, pageSize, search, proFilter, roleFilter, proStatusFilter, dateRange, sortField, sortOrder]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // ── Quick filter handler (WordPress-style tab links) ──
    const handleQuickFilter = (filter: QuickFilter) => {
        setActiveQuickFilter(filter);
        setPage(1);

        // Reset all filters first
        setRoleFilter("all");
        setProFilter("all");
        setProStatusFilter("all");

        switch (filter) {
            case "administrator":
                setRoleFilter("administrator");
                break;
            case "subscriber":
                setRoleFilter("subscriber");
                break;
            case "proActive":
                setProStatusFilter("active");
                break;
            case "proExpired":
                setProStatusFilter("expired");
                break;
            case "free":
                setProFilter("false");
                break;
            default:
                break;
        }
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setSearchInput(value);
        setPage(1);
    };

    const handleClearFilters = () => {
        setSearch("");
        setSearchInput("");
        setRoleFilter("all");
        setProFilter("all");
        setProStatusFilter("all");
        setDateRange(null);
        setActiveQuickFilter("all");
        setPage(1);
    };

    const handleTableChange = (
        pagination: TablePaginationConfig,
        _filters: Record<string, FilterValue | null>,
        sorter: SorterResult<UserRow> | SorterResult<UserRow>[],
    ) => {
        setPage(pagination.current ?? 1);
        setPageSize(pagination.pageSize ?? 20);

        // Handle sort
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        if (s?.field && s?.order) {
            setSortField(s.field as string);
            setSortOrder(s.order === "ascend" ? "asc" : "desc");
        }
    };

    // ── Bulk action menu ──
    const bulkMenuItems: MenuProps["items"] = [
        {
            key: "export",
            label: "Xuất CSV",
            icon: <ExportOutlined />,
            onClick: () => handleExportCSV(),
        },
    ];

    const handleExportCSV = () => {
        if (users.length === 0) {
            message.warning("Không có dữ liệu để xuất");
            return;
        }

        const exportData = selectedRowKeys.length > 0
            ? users.filter(u => selectedRowKeys.includes(u.id))
            : users;

        const csvHeaders = ["ID", "Tên", "Email", "Pro", "Hết hạn Pro", "Role", "Ngày tạo"];
        const csvRows = exportData.map(u => [
            u.id,
            u.name || "",
            u.email,
            u.is_pro ? "Pro" : "Free",
            u.pro_expiration_date ? dayjs(u.pro_expiration_date).format("DD/MM/YYYY") : "",
            Array.isArray(u.roles) && u.roles.includes("administrator") ? "Admin" : "User",
            dayjs(u.created_at).format("DD/MM/YYYY"),
        ]);

        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `users_${dayjs().format("YYYY-MM-DD_HHmm")}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        message.success(`Đã xuất ${exportData.length} user(s)`);
    };

    // ── Table columns ──
    const columns: ColumnsType<UserRow> = [
        {
            title: "Avatar",
            dataIndex: "avatar_url",
            key: "avatar",
            width: 56,
            render: (url: string | null) => (
                <Avatar src={url} icon={<UserOutlined />} size={36} />
            ),
        },
        {
            title: "Tên",
            dataIndex: "name",
            key: "name",
            sorter: true,
            sortOrder: sortField === "name" ? (sortOrder === "asc" ? "ascend" : "descend") : undefined,
            render: (name: string | null, record: UserRow) => (
                <div>
                    <div
                        className="font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => router.push(`/admin/users/${record.id}`)}
                    >
                        {name || "—"}
                    </div>
                    <div className="text-xs text-gray-400">{record.email}</div>
                </div>
            ),
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            sorter: true,
            sortOrder: sortField === "email" ? (sortOrder === "asc" ? "ascend" : "descend") : undefined,
            ellipsis: true,
            responsive: ["lg"],
        },
        {
            title: "Role",
            dataIndex: "roles",
            key: "roles",
            width: 120,
            render: (roles: string[]) => {
                const r = Array.isArray(roles) ? roles : [];
                if (r.includes("administrator"))
                    return (
                        <Tag color="red" icon={<SafetyCertificateOutlined />}>
                            Admin
                        </Tag>
                    );
                return <Tag color="default">Subscriber</Tag>;
            },
        },
        {
            title: "Gói",
            dataIndex: "is_pro",
            key: "is_pro",
            width: 100,
            render: (isPro: boolean, record: UserRow) => {
                if (isPro) {
                    const isExpired = record.pro_expiration_date
                        ? new Date(record.pro_expiration_date) < new Date()
                        : false;
                    return isExpired ? (
                        <Tooltip title={`Hết hạn: ${dayjs(record.pro_expiration_date).format("DD/MM/YYYY")}`}>
                            <Tag color="orange" icon={<ClockCircleOutlined />}>
                                Pro (hết hạn)
                            </Tag>
                        </Tooltip>
                    ) : (
                        <Tag color="gold" icon={<CrownOutlined />}>
                            PRO
                        </Tag>
                    );
                }
                return <Tag>Free</Tag>;
            },
        },
        {
            title: "Hết hạn Pro",
            dataIndex: "pro_expiration_date",
            key: "pro_expiration_date",
            width: 130,
            sorter: true,
            sortOrder: sortField === "pro_expiration_date" ? (sortOrder === "asc" ? "ascend" : "descend") : undefined,
            render: (date: string | null) => {
                if (!date) return <span className="text-gray-300">—</span>;
                const isExpired = new Date(date) < new Date();
                return (
                    <span className={isExpired ? "text-red-500" : "text-green-600"}>
                        {dayjs(date).format("DD/MM/YYYY")}
                    </span>
                );
            },
        },
        {
            title: "Ngày đăng ký",
            dataIndex: "created_at",
            key: "created_at",
            width: 130,
            sorter: true,
            sortOrder: sortField === "created_at" ? (sortOrder === "asc" ? "ascend" : "descend") : undefined,
            render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
        },
        {
            title: "",
            key: "actions",
            width: 80,
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
            <div className="admin-users-page">
                {/* ═══ Page header ═══ */}
                <AdminPageHeader
                    icon={<TeamOutlined />}
                    title="Quản lý Users"
                    badge={stats && (
                        <span className="admin-users-total-badge">
                            {stats.total} người dùng
                        </span>
                    )}
                    actions={
                        <Space>
                            <Tooltip title="Tải lại">
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={() => { fetchUsers(); fetchStats(); }}
                                />
                            </Tooltip>
                            <Dropdown menu={{ items: bulkMenuItems }} trigger={["click"]}>
                                <Button>
                                    Hành động <DownOutlined />
                                </Button>
                            </Dropdown>
                        </Space>
                    }
                />

                {/* ═══ WordPress-style quick filter tabs ═══ */}
                {stats && (
                    <div className="admin-users-quick-filters">
                        <button
                            className={`admin-users-qf-tab ${activeQuickFilter === "all" ? "active" : ""}`}
                            onClick={() => handleQuickFilter("all")}
                        >
                            Tất cả <span className="admin-users-qf-count">({stats.total})</span>
                        </button>
                        <span className="admin-users-qf-sep">|</span>
                        <button
                            className={`admin-users-qf-tab ${activeQuickFilter === "administrator" ? "active" : ""}`}
                            onClick={() => handleQuickFilter("administrator")}
                        >
                            Quản trị viên <span className="admin-users-qf-count">({stats.administrator})</span>
                        </button>
                        <span className="admin-users-qf-sep">|</span>
                        <button
                            className={`admin-users-qf-tab ${activeQuickFilter === "subscriber" ? "active" : ""}`}
                            onClick={() => handleQuickFilter("subscriber")}
                        >
                            Subscriber <span className="admin-users-qf-count">({stats.subscriber})</span>
                        </button>
                        <span className="admin-users-qf-sep">|</span>
                        <button
                            className={`admin-users-qf-tab admin-users-qf-pro ${activeQuickFilter === "proActive" ? "active" : ""}`}
                            onClick={() => handleQuickFilter("proActive")}
                        >
                            <CrownOutlined /> Pro đang hoạt động <span className="admin-users-qf-count">({stats.proActive})</span>
                        </button>
                        <span className="admin-users-qf-sep">|</span>
                        <button
                            className={`admin-users-qf-tab admin-users-qf-expired ${activeQuickFilter === "proExpired" ? "active" : ""}`}
                            onClick={() => handleQuickFilter("proExpired")}
                        >
                            Pro hết hạn <span className="admin-users-qf-count">({stats.proExpired})</span>
                        </button>
                        <span className="admin-users-qf-sep">|</span>
                        <button
                            className={`admin-users-qf-tab ${activeQuickFilter === "free" ? "active" : ""}`}
                            onClick={() => handleQuickFilter("free")}
                        >
                            Free <span className="admin-users-qf-count">({stats.free})</span>
                        </button>
                    </div>
                )}

                {/* ═══ Filter bar ═══ */}
                <Card
                    size="small"
                    className="admin-users-filter-card"
                    bodyStyle={{ padding: "12px 16px" }}
                >
                    <div className="admin-users-filter-bar">
                        {/* Search */}
                        <Input.Search
                            placeholder="Tìm theo tên, email..."
                            allowClear
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                                if (!e.target.value) setSearch("");
                            }}
                            onSearch={handleSearch}
                            className="admin-users-search"
                            prefix={<SearchOutlined style={{ color: "#999" }} />}
                        />

                        {/* Toggle advanced filters */}
                        <Button
                            icon={<FilterOutlined />}
                            onClick={() => setShowFilters(!showFilters)}
                            type={showFilters || activeFilterCount > 0 ? "primary" : "default"}
                            ghost={showFilters || activeFilterCount > 0}
                        >
                            Bộ lọc
                            {activeFilterCount > 0 && (
                                <Badge
                                    count={activeFilterCount}
                                    size="small"
                                    offset={[4, -2]}
                                    style={{ backgroundColor: "#d94a56" }}
                                />
                            )}
                        </Button>

                        {/* Clear all button */}
                        {activeFilterCount > 0 && (
                            <Button
                                type="text"
                                icon={<ClearOutlined />}
                                onClick={handleClearFilters}
                                className="admin-users-clear-btn"
                            >
                                Xóa bộ lọc
                            </Button>
                        )}
                    </div>

                    {/* Advanced filters — collapsible */}
                    {showFilters && (
                        <div className="admin-users-adv-filters">
                            <div className="admin-users-adv-filter-item">
                                <label className="admin-users-adv-label">Role</label>
                                <Select
                                    value={roleFilter}
                                    onChange={(v) => {
                                        setRoleFilter(v);
                                        setActiveQuickFilter("all");
                                        setPage(1);
                                    }}
                                    style={{ width: 160 }}
                                    size="middle"
                                    options={[
                                        { value: "all", label: "Tất cả role" },
                                        { value: "administrator", label: "Quản trị viên" },
                                        { value: "subscriber", label: "Subscriber" },
                                    ]}
                                />
                            </div>

                            <div className="admin-users-adv-filter-item">
                                <label className="admin-users-adv-label">Gói tài khoản</label>
                                <Select
                                    value={proFilter}
                                    onChange={(v) => {
                                        setProFilter(v);
                                        setActiveQuickFilter("all");
                                        setPage(1);
                                    }}
                                    style={{ width: 140 }}
                                    size="middle"
                                    options={[
                                        { value: "all", label: "Tất cả" },
                                        { value: "true", label: "Pro" },
                                        { value: "false", label: "Free" },
                                    ]}
                                />
                            </div>

                            <div className="admin-users-adv-filter-item">
                                <label className="admin-users-adv-label">Trạng thái Pro</label>
                                <Select
                                    value={proStatusFilter}
                                    onChange={(v) => {
                                        setProStatusFilter(v);
                                        setActiveQuickFilter("all");
                                        setPage(1);
                                    }}
                                    style={{ width: 170 }}
                                    size="middle"
                                    options={[
                                        { value: "all", label: "Tất cả" },
                                        { value: "active", label: "Đang hoạt động" },
                                        { value: "expired", label: "Hết hạn" },
                                        { value: "never", label: "Chưa từng Pro" },
                                    ]}
                                />
                            </div>

                            <div className="admin-users-adv-filter-item">
                                <label className="admin-users-adv-label">Ngày đăng ký</label>
                                <RangePicker
                                    value={dateRange}
                                    onChange={(dates) => {
                                        setDateRange(dates);
                                        setPage(1);
                                    }}
                                    format="DD/MM/YYYY"
                                    placeholder={["Từ ngày", "Đến ngày"]}
                                    size="middle"
                                    allowClear
                                    style={{ width: 260 }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Active filter tags */}
                    {activeFilterCount > 0 && (
                        <div className="admin-users-active-filters">
                            {search && (
                                <Tag
                                    closable
                                    onClose={() => setSearch("")}
                                    color="blue"
                                >
                                    Tìm kiếm: &quot;{search}&quot;
                                </Tag>
                            )}
                            {roleFilter !== "all" && (
                                <Tag
                                    closable
                                    onClose={() => { setRoleFilter("all"); setActiveQuickFilter("all"); }}
                                    color="red"
                                >
                                    Role: {roleFilter === "administrator" ? "Quản trị viên" : "Subscriber"}
                                </Tag>
                            )}
                            {proFilter !== "all" && (
                                <Tag
                                    closable
                                    onClose={() => { setProFilter("all"); setActiveQuickFilter("all"); }}
                                    color="gold"
                                >
                                    Gói: {proFilter === "true" ? "Pro" : "Free"}
                                </Tag>
                            )}
                            {proStatusFilter !== "all" && (
                                <Tag
                                    closable
                                    onClose={() => { setProStatusFilter("all"); setActiveQuickFilter("all"); }}
                                    color="orange"
                                >
                                    Pro: {proStatusFilter === "active" ? "Đang hoạt động" : proStatusFilter === "expired" ? "Hết hạn" : "Chưa từng"}
                                </Tag>
                            )}
                            {dateRange && (
                                <Tag
                                    closable
                                    onClose={() => setDateRange(null)}
                                    color="cyan"
                                >
                                    Ngày: {dateRange[0]?.format("DD/MM/YYYY")} – {dateRange[1]?.format("DD/MM/YYYY")}
                                </Tag>
                            )}
                        </div>
                    )}
                </Card>

                {/* ═══ Selection info bar ═══ */}
                {selectedRowKeys.length > 0 && (
                    <div className="admin-users-selection-bar">
                        <span>
                            Đã chọn <strong>{selectedRowKeys.length}</strong> user(s)
                        </span>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => setSelectedRowKeys([])}
                        >
                            Bỏ chọn tất cả
                        </Button>
                    </div>
                )}

                {/* ═══ Table ═══ */}
                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    onChange={handleTableChange}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                    }}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50", "100"],
                        showTotal: (t, range) =>
                            `${range[0]}-${range[1]} / ${t} users`,
                        showQuickJumper: true,
                    }}
                    scroll={{ x: 1000 }}
                    size="middle"
                    className="admin-users-table"
                />
            </div>

            <style jsx>{`
                .admin-users-page {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                }

                .admin-users-total-badge {
                    font-size: 13px;
                    color: var(--admin-text-muted);
                    background: var(--admin-glass-bg-hover);
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-weight: 500;
                }

                /* ── Quick filter tabs ── */
                .admin-users-quick-filters {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 2px;
                    padding: 10px 0;
                    margin-bottom: 12px;
                    border-bottom: 1px solid var(--admin-border);
                }

                .admin-users-qf-tab {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 13px;
                    color: var(--admin-accent-blue);
                    padding: 2px 4px;
                    border-radius: 3px;
                    transition: all 0.15s;
                    font-family: inherit;
                    line-height: 1.5;
                }

                .admin-users-qf-tab:hover {
                    opacity: 0.8;
                    text-decoration: underline;
                }

                .admin-users-qf-tab.active {
                    color: var(--admin-text-primary);
                    font-weight: 600;
                    text-decoration: none;
                }

                .admin-users-qf-tab.admin-users-qf-pro.active {
                    color: var(--admin-accent-amber);
                }

                .admin-users-qf-tab.admin-users-qf-expired.active {
                    color: var(--admin-accent-rose, #f43f5e);
                }

                .admin-users-qf-count {
                    color: var(--admin-text-muted);
                    font-weight: 400;
                }

                .admin-users-qf-tab.active .admin-users-qf-count {
                    color: inherit;
                }

                .admin-users-qf-sep {
                    color: var(--admin-text-muted);
                    user-select: none;
                    font-size: 13px;
                    margin: 0 2px;
                    opacity: 0.4;
                }

                /* ── Filter bar ── */
                .admin-users-filter-bar {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                /* ── Advanced filters ── */
                .admin-users-adv-filters {
                    display: flex;
                    align-items: flex-end;
                    gap: 16px;
                    flex-wrap: wrap;
                    margin-top: 14px;
                    padding-top: 14px;
                    border-top: 1px solid var(--admin-border);
                }

                .admin-users-adv-filter-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .admin-users-adv-label {
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--admin-text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                /* ── Active filter tags ── */
                .admin-users-active-filters {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid var(--admin-border);
                }

                /* ── Selection bar ── */
                .admin-users-selection-bar {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 16px;
                    background: rgba(217, 74, 86, 0.1);
                    border: 1px solid rgba(217, 74, 86, 0.2);
                    border-radius: 6px;
                    margin-top: 12px;
                    font-size: 13px;
                    color: var(--admin-brand-light);
                }
            `}</style>

            <style jsx global>{`
                .admin-users-search {
                    width: 280px !important;
                }

                .admin-users-search .ant-input-search-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .admin-users-clear-btn {
                    color: var(--admin-text-muted) !important;
                    font-size: 13px !important;
                }

                .admin-users-clear-btn:hover {
                    color: var(--admin-brand) !important;
                }

                .admin-users-filter-card {
                    margin-bottom: 12px !important;
                    border-radius: 8px !important;
                }

                .admin-users-table .ant-table-tbody > tr > td {
                    font-size: 13px !important;
                }

                @media (max-width: 768px) {
                    .admin-users-search {
                        width: 100% !important;
                    }

                    .admin-users-filter-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .admin-users-adv-filters {
                        flex-direction: column;
                    }

                    .admin-users-quick-filters {
                        gap: 4px;
                    }
                }
            `}</style>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
