import { useEffect, useState } from "react";
import { Table, Tag, Spin } from "antd";
import {
  UserOutlined,
  CrownOutlined,
  UserAddOutlined,
  FileTextOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  FormOutlined,
  PlusOutlined,
  TeamOutlined,
  RiseOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "./_layout";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { AdminStatCard, AdminGlassCard } from "@/widgets/admin";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

// Recharts ResponsiveContainer needs window — dynamic import for SSR safety
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

type DailyPoint = { date: string; value: number };
type SkillPoint = { skill: string; value: number };

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
  chartNewUsers: DailyPoint[];
  chartRevenue: DailyPoint[];
  chartSkills: SkillPoint[];
};

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

const formatShortPrice = (amount: number) => {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toString();
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};

// ─── Skill color palette ───
const SKILL_COLORS: Record<string, string> = {
  reading: "#3b82f6",
  listening: "#a855f7",
  speaking: "#f59e0b",
  writing: "#22c55e",
};
const SKILL_COLORS_LIST = ["#3b82f6", "#a855f7", "#f59e0b", "#22c55e", "#f43f5e"];

// ─── Custom Tooltip ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(15, 15, 25, 0.92)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10,
      padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    }}>
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
        {label}
      </div>
      {payload.map((entry: { value: number; color: string }, i: number) => (
        <div key={i} style={{ color: entry.color, fontWeight: 700, fontSize: 14 }}>
          {formatter ? formatter(entry.value) : entry.value.toLocaleString()}
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
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

  // ─── Format chart dates for display ───
  const chartUsersFormatted = (data?.chartNewUsers ?? []).map((d) => ({
    ...d,
    label: dayjs(d.date).format("DD/MM"),
  }));

  const chartRevenueFormatted = (data?.chartRevenue ?? []).map((d) => ({
    ...d,
    label: dayjs(d.date).format("DD/MM"),
  }));

  const chartSkillsFormatted = (data?.chartSkills ?? []).map((d) => ({
    ...d,
    name: d.skill.charAt(0).toUpperCase() + d.skill.slice(1),
  }));

  const orderColumns: ColumnsType<DashboardData["recentOrders"][0]> = [
    {
      title: "Order ID",
      dataIndex: "order_id",
      key: "order_id",
      width: 160,
      render: (id: string) => (
        <span style={{ fontFamily: "monospace", fontSize: 12, opacity: 0.7 }}>
          {id?.length > 16 ? id.substring(0, 16) + "…" : id || "—"}
        </span>
      ),
    },
    {
      title: "Khách hàng",
      key: "user",
      render: (_, record) => {
        const username =
          record.user_name || record.user_email?.split("@")[0] || "—";
        return (
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{username}</div>
            <div style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
              {record.user_email ?? "—"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Gói",
      dataIndex: "package_type",
      key: "package_type",
      width: 100,
      render: (type: string) => <Tag>{type ?? "—"}</Tag>,
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (amount: number) => (
        <span style={{ fontWeight: 600 }}>{formatPrice(amount)}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: string) => {
        const config: Record<string, { color: string; bg: string }> = {
          pending: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
          completed: { color: "#22c55e", bg: "rgba(34, 197, 94, 0.12)" },
          cancelled: { color: "#f43f5e", bg: "rgba(244, 63, 94, 0.12)" },
        };
        const c = config[status] ?? { color: "#9ca3af", bg: "rgba(156, 163, 175, 0.12)" };
        return (
          <Tag
            style={{
              background: c.bg,
              color: c.color,
              border: "none",
              fontWeight: 500,
              borderRadius: 6,
            }}
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Ngày",
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
      render: (date: string) => (
        <span style={{ fontSize: 12.5, color: "var(--admin-text-secondary)" }}>
          {dayjs(date).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
    },
  ];

  const quizColumns: ColumnsType<DashboardData["topQuizzes"][0]> = [
    {
      title: "#",
      key: "index",
      width: 42,
      render: (_, __, index) => (
        <span style={{ color: "var(--admin-text-muted)", fontSize: 12, fontWeight: 600 }}>
          {index + 1}
        </span>
      ),
    },
    {
      title: "Bài test",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (title: string) => (
        <span style={{ fontWeight: 500, fontSize: 13 }}>{title}</span>
      ),
    },
    {
      title: "Skill",
      dataIndex: "skill",
      key: "skill",
      width: 100,
      render: (skill: string) => {
        const config: Record<string, { color: string; bg: string }> = {
          reading: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" },
          listening: { color: "#a855f7", bg: "rgba(168, 85, 247, 0.12)" },
          speaking: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
          writing: { color: "#22c55e", bg: "rgba(34, 197, 94, 0.12)" },
        };
        const c = config[skill] ?? { color: "#9ca3af", bg: "rgba(156, 163, 175, 0.12)" };
        return (
          <Tag
            style={{
              background: c.bg,
              color: c.color,
              border: "none",
              fontWeight: 500,
              borderRadius: 6,
              textTransform: "capitalize",
            }}
          >
            {skill}
          </Tag>
        );
      },
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 90,
      render: (type: string) => (
        <Tag
          style={{
            background: "var(--admin-glass-bg-hover)",
            color: "var(--admin-text-secondary)",
            border: "none",
            borderRadius: 6,
          }}
        >
          {type}
        </Tag>
      ),
    },
    {
      title: "Lượt làm",
      dataIndex: "tests_taken",
      key: "tests_taken",
      width: 100,
      sorter: (a, b) => a.tests_taken - b.tests_taken,
      render: (count: number) => (
        <span style={{ fontWeight: 700, color: "var(--admin-accent-blue)" }}>
          {count.toLocaleString()}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 400,
          }}
        >
          <Spin size="large" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* ═══ Greeting ═══ */}
      <div className="admin-greeting admin-animate-in">
        <h1>{getGreeting()}, Admin! 👋</h1>
        <p>Tổng quan hoạt động hệ thống IELTS Master hôm nay</p>
      </div>

      {/* ═══ Quick Actions ═══ */}
      <div className="admin-quick-actions admin-animate-in">
        <button
          className="admin-quick-action-btn"
          onClick={() => router.push("/admin/quizzes/new")}
        >
          <PlusOutlined /> Thêm bài test
        </button>
        <button
          className="admin-quick-action-btn"
          onClick={() => router.push("/admin/orders")}
        >
          <ShoppingCartOutlined /> Xem đơn hàng
        </button>
        <button
          className="admin-quick-action-btn"
          onClick={() => router.push("/admin/users")}
        >
          <TeamOutlined /> Quản lý users
        </button>
        <button
          className="admin-quick-action-btn"
          onClick={() => router.push("/admin/posts")}
        >
          <EditOutlined /> Viết bài
        </button>
      </div>

      {/* ═══ KPI Stat Cards ═══ */}
      <div className="admin-grid-4" style={{ marginBottom: 24 }}>
        <AdminStatCard
          icon={<UserOutlined />}
          iconColor="blue"
          label="Tổng Users"
          value={(data?.totalUsers ?? 0).toLocaleString()}
        />
        <AdminStatCard
          icon={<CrownOutlined />}
          iconColor="amber"
          label="Users Pro"
          value={(data?.proUsers ?? 0).toLocaleString()}
        />
        <AdminStatCard
          icon={<UserAddOutlined />}
          iconColor="green"
          label="Users mới hôm nay"
          value={(data?.todayUsers ?? 0).toLocaleString()}
        />
        <AdminStatCard
          icon={<FileTextOutlined />}
          iconColor="purple"
          label="Tổng bài test đã làm"
          value={(data?.totalTestsTaken ?? 0).toLocaleString()}
        />
      </div>

      {/* ═══ Revenue Card ═══ */}
      <div className="admin-revenue-card admin-animate-in" style={{ marginBottom: 24 }}>
        <div>
          <div className="admin-revenue-label">
            <DollarOutlined style={{ marginRight: 6 }} />
            Doanh thu tháng này
          </div>
          <div className="admin-revenue-value">
            {formatPrice(data?.monthlyRevenue ?? 0)}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 8,
            background: "rgba(34, 197, 94, 0.1)",
            color: "var(--admin-accent-green)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <RiseOutlined /> Đang cập nhật
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* ═══ CHARTS SECTION ═══ */}
      {/* ═══════════════════════════════════════════════ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 24,
        }}
        className="admin-charts-grid"
      >
        {/* ── Chart 1: New Users (Area) ── */}
        <AdminGlassCard
          title={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <UserAddOutlined style={{ color: "var(--admin-accent-blue)" }} />
              Users mới (30 ngày)
            </span>
          }
        >
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartUsersFormatted} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--admin-text-muted)", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: "var(--admin-text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#gradientUsers)"
                  dot={false}
                  activeDot={{ r: 5, stroke: "#3b82f6", fill: "#0f0f19", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminGlassCard>

        {/* ── Chart 2: Revenue (Bar) ── */}
        <AdminGlassCard
          title={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <DollarOutlined style={{ color: "var(--admin-accent-green)" }} />
              Doanh thu (30 ngày)
            </span>
          }
        >
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRevenueFormatted} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--admin-text-muted)", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: "var(--admin-text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatShortPrice}
                />
                <Tooltip content={<ChartTooltip formatter={formatPrice} />} />
                <Bar
                  dataKey="value"
                  fill="url(#gradientRevenue)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminGlassCard>
      </div>

      {/* ── Row 2: Recent Orders (full width) ── */}
      <AdminGlassCard
        title="Đơn hàng gần đây"
        extra={
          <button
            className="admin-quick-action-btn"
            style={{ fontSize: 12, padding: "4px 10px" }}
            onClick={() => router.push("/admin/orders")}
          >
            Xem tất cả →
          </button>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={orderColumns}
          dataSource={data?.recentOrders ?? []}
          rowKey="order_id"
          pagination={false}
          size="small"
          scroll={{ x: 900 }}
        />
      </AdminGlassCard>

      {/* ── Row 3: Donut Chart + Top Quizzes (2-col grid) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 24,
        }}
        className="admin-tables-grid"
      >
        {/* Chart 3: Skill Distribution (Donut) */}
        <AdminGlassCard
          title={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FormOutlined style={{ color: "var(--admin-accent-purple)" }} />
              Phân bố lượt làm bài theo Skill
            </span>
          }
        >
          <div style={{ width: "100%", height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {chartSkillsFormatted.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartSkillsFormatted}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={4}
                    strokeWidth={0}
                  >
                    {chartSkillsFormatted.map((entry, index) => (
                      <Cell
                        key={entry.skill}
                        fill={SKILL_COLORS[entry.skill] || SKILL_COLORS_LIST[index % SKILL_COLORS_LIST.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <div style={{
                          background: "rgba(15, 15, 25, 0.92)",
                          backdropFilter: "blur(12px)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 10,
                          padding: "10px 14px",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                        }}>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>
                            {d.name}
                          </div>
                          <div style={{ color: d.payload?.fill || "#fff", fontWeight: 700, fontSize: 16 }}>
                            {(d.value as number).toLocaleString()} lượt
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    iconSize={10}
                    formatter={(value: string) => (
                      <span style={{ color: "var(--admin-text-primary)", fontSize: 13, fontWeight: 500 }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: "var(--admin-text-muted)", fontSize: 14 }}>
                Chưa có dữ liệu bài test
              </div>
            )}
          </div>
        </AdminGlassCard>

        {/* Top Quizzes */}
        <AdminGlassCard
          title="Top 10 bài test phổ biến"
          extra={
            <button
              className="admin-quick-action-btn"
              style={{ fontSize: 12, padding: "4px 10px" }}
              onClick={() => router.push("/admin/quizzes")}
            >
              Xem tất cả →
            </button>
          }
        >
          <Table
            columns={quizColumns}
            dataSource={data?.topQuizzes ?? []}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </AdminGlassCard>
      </div>

      {/* Responsive override for grids */}
      <style jsx>{`
        @media (max-width: 1200px) {
          :global(.admin-charts-grid),
          :global(.admin-tables-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdmin;

