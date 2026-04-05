import { useEffect, useState, useCallback } from "react";
import {
    Table, Tag, Select, Input, Space, DatePicker, Button, Tooltip,
} from "antd";
import {
    HistoryOutlined, SearchOutlined, ReloadOutlined,
    ClearOutlined, FilterOutlined,
    PlusOutlined, EditOutlined, DeleteOutlined,
    LoginOutlined, SendOutlined, EyeOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import AdminLayout from "../_layout";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { AdminPageHeader, AdminGlassCard } from "@/widgets/admin";

dayjs.extend(relativeTime);

type LogEntry = {
    id: string;
    user_id: string | null;
    user_email: string | null;
    user_name: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    entity_title: string | null;
    metadata: Record<string, unknown>;
    ip_address: string | null;
    created_at: string;
};

// ─── Action styling ───────────────────────────────────────────────────────
const ACTION_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    create:     { color: "green",   icon: <PlusOutlined />,   label: "Tạo mới" },
    update:     { color: "blue",    icon: <EditOutlined />,   label: "Cập nhật" },
    delete:     { color: "red",     icon: <DeleteOutlined />, label: "Xóa" },
    publish:    { color: "cyan",    icon: <SendOutlined />,   label: "Xuất bản" },
    unpublish:  { color: "orange",  icon: <EyeOutlined />,    label: "Ẩn" },
    login:      { color: "purple",  icon: <LoginOutlined />,  label: "Đăng nhập" },
    bulk_update:{ color: "geekblue",icon: <EditOutlined />,   label: "Cập nhật hàng loạt" },
    bulk_delete:{ color: "magenta", icon: <DeleteOutlined />, label: "Xóa hàng loạt" },
    export:     { color: "default", icon: <SendOutlined />,   label: "Xuất dữ liệu" },
};

const ENTITY_LABELS: Record<string, string> = {
    quiz: "Bài test",
    post: "Bài viết",
    sample_essay: "Bài mẫu",
    user: "User",
    order: "Đơn hàng",
    coupon: "Mã giảm giá",
    cms_config: "CMS Config",
    mock_test: "Mock Test",
    affiliate: "Affiliate",
    payout: "Payout",
    redirect: "Redirect",
    setting: "Cài đặt",
    media: "Media",
};

export default function ActivityLogPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(30);

    // Filters
    const [actionFilter, setActionFilter] = useState<string>("");
    const [entityTypeFilter, setEntityTypeFilter] = useState<string>("");
    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(pageSize),
            });
            if (actionFilter) params.set("action", actionFilter);
            if (entityTypeFilter) params.set("entityType", entityTypeFilter);
            if (search) params.set("search", search);
            if (dateRange?.[0]) params.set("dateFrom", dateRange[0].toISOString());
            if (dateRange?.[1]) params.set("dateTo", dateRange[1].toISOString());

            const res = await fetch(`/api/admin/activity-log?${params}`);
            const json = await res.json();
            if (json.success) {
                setLogs(json.data);
                setTotal(json.count);
            }
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, actionFilter, entityTypeFilter, search, dateRange]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleClearFilters = () => {
        setActionFilter("");
        setEntityTypeFilter("");
        setSearch("");
        setDateRange(null);
        setPage(1);
    };

    const columns: ColumnsType<LogEntry> = [
        {
            title: "Thời gian",
            dataIndex: "created_at",
            key: "created_at",
            width: 170,
            render: (date: string) => (
                <Tooltip title={dayjs(date).format("DD/MM/YYYY HH:mm:ss")}>
                    <span style={{ fontSize: 13, color: "var(--admin-text-secondary)" }}>
                        {dayjs(date).fromNow()}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: "Người thực hiện",
            key: "user",
            width: 200,
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>
                        {record.user_name || record.user_email?.split("@")[0] || "System"}
                    </div>
                    {record.user_email && (
                        <div style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                            {record.user_email}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: "Hành động",
            dataIndex: "action",
            key: "action",
            width: 150,
            render: (action: string) => {
                const cfg = ACTION_CONFIG[action] ?? {
                    color: "default",
                    icon: null,
                    label: action,
                };
                return (
                    <Tag color={cfg.color} icon={cfg.icon}>
                        {cfg.label}
                    </Tag>
                );
            },
        },
        {
            title: "Đối tượng",
            key: "entity",
            render: (_, record) => (
                <div>
                    <Tag color="default">
                        {ENTITY_LABELS[record.entity_type] || record.entity_type}
                    </Tag>
                    {record.entity_title && (
                        <span style={{ fontSize: 13, marginLeft: 6 }}>
                            {record.entity_title}
                        </span>
                    )}
                </div>
            ),
        },
        {
            title: "IP",
            dataIndex: "ip_address",
            key: "ip_address",
            width: 130,
            responsive: ["xl"],
            render: (ip: string | null) => (
                <span style={{ fontFamily: "monospace", fontSize: 12, opacity: 0.6 }}>
                    {ip || "—"}
                </span>
            ),
        },
    ];

    const activeFilterCount = [
        actionFilter,
        entityTypeFilter,
        search,
        dateRange,
    ].filter(Boolean).length;

    return (
        <AdminLayout>
            <AdminPageHeader
                icon={<HistoryOutlined />}
                title="Activity Log"
                actions={
                    <Space>
                        <Tooltip title="Tải lại">
                            <Button icon={<ReloadOutlined />} onClick={fetchLogs} />
                        </Tooltip>
                    </Space>
                }
            />

            {/* Filters */}
            <AdminGlassCard style={{ marginBottom: 16 }}>
                <Space wrap style={{ width: "100%" }}>
                    <Input.Search
                        placeholder="Tìm theo tên, email, tiêu đề..."
                        allowClear
                        onSearch={(v) => { setSearch(v); setPage(1); }}
                        style={{ width: 260 }}
                        prefix={<SearchOutlined />}
                    />
                    <Select
                        value={actionFilter || undefined}
                        onChange={(v) => { setActionFilter(v || ""); setPage(1); }}
                        placeholder="Hành động"
                        allowClear
                        style={{ width: 140 }}
                    >
                        {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                            <Select.Option key={key} value={key}>
                                {cfg.label}
                            </Select.Option>
                        ))}
                    </Select>
                    <Select
                        value={entityTypeFilter || undefined}
                        onChange={(v) => { setEntityTypeFilter(v || ""); setPage(1); }}
                        placeholder="Loại đối tượng"
                        allowClear
                        style={{ width: 150 }}
                    >
                        {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                            <Select.Option key={key} value={key}>
                                {label}
                            </Select.Option>
                        ))}
                    </Select>
                    <DatePicker.RangePicker
                        value={dateRange}
                        onChange={(dates) => {
                            setDateRange(dates);
                            setPage(1);
                        }}
                        format="DD/MM/YYYY"
                        placeholder={["Từ ngày", "Đến ngày"]}
                        allowClear
                    />
                    {activeFilterCount > 0 && (
                        <Button
                            type="text"
                            icon={<ClearOutlined />}
                            onClick={handleClearFilters}
                        >
                            Xóa bộ lọc
                        </Button>
                    )}
                </Space>
            </AdminGlassCard>

            {/* Table */}
            <AdminGlassCard>
                <Table
                    columns={columns}
                    dataSource={logs}
                    rowKey="id"
                    loading={loading}
                    onChange={(pagination: TablePaginationConfig) => {
                        setPage(pagination.current ?? 1);
                        setPageSize(pagination.pageSize ?? 30);
                    }}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: ["20", "30", "50", "100"],
                        showTotal: (t) => `Tổng ${t} hoạt động`,
                    }}
                    scroll={{ x: 900 }}
                    size="middle"
                />
            </AdminGlassCard>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
