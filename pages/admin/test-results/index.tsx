import { useEffect, useState, useCallback } from "react";
import {
    Table, Tag, message, Popconfirm, Button, Input, Space, Select,
    Tooltip, Badge,
} from "antd";
import {
    DeleteOutlined, SearchOutlined, FilterOutlined, ClearOutlined,
    ReloadOutlined, BarChartOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { FilterValue, SorterResult } from "antd/es/table/interface";
import AdminLayout from "../_layout";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { AdminPageHeader, AdminGlassCard } from "@/widgets/admin";

type TestResultRow = {
    id: string;
    user_id: string;
    quiz_id: string;
    score: number | null;
    status: string;
    test_time: number | null;
    submitted_at: string | null;
    created_at: string;
    users: { email: string; name: string | null } | null;
    quizzes: { title: string; skill: string; type: string } | null;
};

export default function AdminTestResultsPage() {
    const [results, setResults] = useState<TestResultRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // ── Filters ──
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [skillFilter, setSkillFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [sortField, setSortField] = useState<string>("created_at");
    const [sortOrder, setSortOrder] = useState<string>("desc");
    const [showFilters, setShowFilters] = useState(false);

    const activeFilterCount = [
        search !== "",
        skillFilter !== "",
        statusFilter !== "",
        typeFilter !== "",
    ].filter(Boolean).length;

    const fetchResults = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(pageSize),
                sort: sortField,
                order: sortOrder,
            });
            if (search) params.set("search", search);
            if (skillFilter) params.set("skill", skillFilter);
            if (statusFilter) params.set("status", statusFilter);
            if (typeFilter) params.set("type", typeFilter);

            const res = await fetch(`/api/admin/test-results?${params}`);
            const json = await res.json();
            if (json.success) {
                setResults(json.data);
                setTotal(json.count);
            }
        } catch {
            message.error("Lỗi khi tải kết quả test");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, skillFilter, statusFilter, typeFilter, sortField, sortOrder]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    const handleSearch = (value: string) => {
        setSearch(value);
        setSearchInput(value);
        setPage(1);
    };

    const handleClearFilters = () => {
        setSearch("");
        setSearchInput("");
        setSkillFilter("");
        setStatusFilter("");
        setTypeFilter("");
        setPage(1);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/test-results?id=${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                message.success("Đã xóa");
                fetchResults();
            }
        } catch {
            message.error("Error");
        }
    };

    const handleTableChange = (
        pagination: TablePaginationConfig,
        _filters: Record<string, FilterValue | null>,
        sorter: SorterResult<TestResultRow> | SorterResult<TestResultRow>[],
    ) => {
        setPage(pagination.current ?? 1);
        setPageSize(pagination.pageSize ?? 20);

        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        if (s?.field && s?.order) {
            setSortField(s.field as string);
            setSortOrder(s.order === "ascend" ? "asc" : "desc");
        }
    };

    const columns: ColumnsType<TestResultRow> = [
        {
            title: "User",
            key: "user",
            render: (_, r) => (
                <div>
                    <div className="text-sm font-medium">{r.users?.name ?? "—"}</div>
                    <div className="text-xs text-gray-500">{r.users?.email}</div>
                </div>
            ),
        },
        {
            title: "Bài test",
            key: "quiz",
            ellipsis: true,
            render: (_, r) => r.quizzes?.title ?? "—",
        },
        {
            title: "Skill",
            key: "skill",
            width: 100,
            render: (_, r) =>
                r.quizzes?.skill ? (
                    <Tag color={r.quizzes.skill === "reading" ? "blue" : "purple"}>
                        {r.quizzes.skill}
                    </Tag>
                ) : (
                    "—"
                ),
        },
        {
            title: "Type",
            key: "type",
            width: 90,
            render: (_, r) =>
                r.quizzes?.type ? <Tag>{r.quizzes.type}</Tag> : "—",
        },
        {
            title: "Điểm",
            dataIndex: "score",
            key: "score",
            width: 70,
            sorter: true,
            sortOrder: sortField === "score" ? (sortOrder === "asc" ? "ascend" : "descend") : undefined,
            render: (v: number | null) =>
                v !== null ? (
                    <span
                        className="font-bold"
                        style={{
                            color:
                                v >= 7 ? "#52c41a" : v >= 5 ? "#faad14" : "#ff4d4f",
                        }}
                    >
                        {v}
                    </span>
                ) : (
                    "—"
                ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 100,
            render: (s: string) => (
                <Tag color={s === "published" ? "green" : "default"}>{s}</Tag>
            ),
        },
        {
            title: "Thời gian",
            dataIndex: "test_time",
            key: "test_time",
            width: 90,
            render: (v: number | null) => (v ? `${v} phút` : "—"),
        },
        {
            title: "Ngày nộp",
            dataIndex: "submitted_at",
            key: "submitted_at",
            width: 130,
            sorter: true,
            sortOrder: sortField === "submitted_at" ? (sortOrder === "asc" ? "ascend" : "descend") : undefined,
            render: (d: string | null) =>
                d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—",
        },
        {
            title: "",
            key: "actions",
            width: 60,
            render: (_, r) => (
                <Popconfirm
                    title="Xóa kết quả này?"
                    onConfirm={() => handleDelete(r.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    return (
        <AdminLayout>
            <AdminPageHeader
                icon={<BarChartOutlined />}
                title="Test Results"
                actions={
                    <Tooltip title="Tải lại">
                        <Button icon={<ReloadOutlined />} onClick={fetchResults} />
                    </Tooltip>
                }
            />
            <AdminGlassCard>
                {/* ── Filter bar ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                    <Input.Search
                        placeholder="Tìm user, email, bài test..."
                        allowClear
                        value={searchInput}
                        onChange={(e) => {
                            setSearchInput(e.target.value);
                            if (!e.target.value) setSearch("");
                        }}
                        onSearch={handleSearch}
                        style={{ width: 260 }}
                        prefix={<SearchOutlined style={{ color: "#999" }} />}
                    />

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

                    {activeFilterCount > 0 && (
                        <Button
                            type="text"
                            icon={<ClearOutlined />}
                            onClick={handleClearFilters}
                            style={{ color: "#ff4d4f" }}
                        >
                            Xóa bộ lọc
                        </Button>
                    )}
                </div>

                {/* ── Advanced filters ── */}
                {showFilters && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 16,
                            flexWrap: "wrap",
                            marginBottom: 16,
                            padding: "14px 16px",
                            background: "var(--admin-glass-bg)",
                            borderRadius: 8,
                            border: "1px solid var(--admin-border)",
                        }}
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--admin-text-muted)", textTransform: "uppercase", letterSpacing: 0.3 }}>
                                Skill
                            </label>
                            <Select
                                value={skillFilter}
                                onChange={(v) => { setSkillFilter(v); setPage(1); }}
                                style={{ width: 130 }}
                                allowClear
                                placeholder="Tất cả"
                            >
                                <Select.Option value="reading">Reading</Select.Option>
                                <Select.Option value="listening">Listening</Select.Option>
                            </Select>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--admin-text-muted)", textTransform: "uppercase", letterSpacing: 0.3 }}>
                                Loại bài
                            </label>
                            <Select
                                value={typeFilter}
                                onChange={(v) => { setTypeFilter(v); setPage(1); }}
                                style={{ width: 130 }}
                                allowClear
                                placeholder="Tất cả"
                            >
                                <Select.Option value="practice">Practice</Select.Option>
                                <Select.Option value="exam">Exam</Select.Option>
                            </Select>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--admin-text-muted)", textTransform: "uppercase", letterSpacing: 0.3 }}>
                                Trạng thái
                            </label>
                            <Select
                                value={statusFilter}
                                onChange={(v) => { setStatusFilter(v); setPage(1); }}
                                style={{ width: 140 }}
                                allowClear
                                placeholder="Tất cả"
                            >
                                <Select.Option value="published">Published</Select.Option>
                                <Select.Option value="draft">Draft</Select.Option>
                            </Select>
                        </div>
                    </div>
                )}

                {/* ── Active filter tags ── */}
                {activeFilterCount > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                        {search && (
                            <Tag closable onClose={() => { setSearch(""); setSearchInput(""); }} color="blue">
                                Tìm: &quot;{search}&quot;
                            </Tag>
                        )}
                        {skillFilter && (
                            <Tag closable onClose={() => setSkillFilter("")} color="purple">
                                Skill: {skillFilter}
                            </Tag>
                        )}
                        {typeFilter && (
                            <Tag closable onClose={() => setTypeFilter("")} color="cyan">
                                Loại: {typeFilter}
                            </Tag>
                        )}
                        {statusFilter && (
                            <Tag closable onClose={() => setStatusFilter("")} color="green">
                                Status: {statusFilter}
                            </Tag>
                        )}
                    </div>
                )}

                {/* ── Table ── */}
                <Table
                    columns={columns}
                    dataSource={results}
                    rowKey="id"
                    loading={loading}
                    onChange={handleTableChange}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50", "100"],
                        showTotal: (t, range) => `${range[0]}-${range[1]} / ${t} kết quả`,
                        showQuickJumper: true,
                    }}
                    scroll={{ x: 1000 }}
                    size="middle"
                />
            </AdminGlassCard>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
