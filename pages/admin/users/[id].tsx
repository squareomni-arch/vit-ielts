import { useEffect, useState } from "react";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Tabs,
  Table,
  Modal,
  InputNumber,
  Space,
  message,
  Spin,
  Avatar,
  Popconfirm,
  Tooltip,
  Form,
  Input,
  Select,
  DatePicker,
  Divider,
  Segmented,
} from "antd";
import {
  UserOutlined,
  CrownOutlined,
  ArrowLeftOutlined,
  DesktopOutlined,
  TabletOutlined,
  MobileOutlined,
  CopyOutlined,
  CheckOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  ReloadOutlined,
  CustomerServiceOutlined,
  BookOutlined,
  CalendarOutlined,
  TeamOutlined,
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

const DEVICE_META: Record<
  DeviceType,
  { icon: React.ReactNode; label: string; color: string }
> = {
  desktop: { icon: <DesktopOutlined />, label: "Desktop", color: "#1677ff" },
  tablet: { icon: <TabletOutlined />, label: "Tablet", color: "#722ed1" },
  mobile: { icon: <MobileOutlined />, label: "Mobile", color: "#13c2c2" },
};

function DeviceCard({
  type,
  entry,
}: {
  type: DeviceType;
  entry?: DeviceEntry;
}) {
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
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: id ? "#262626" : "#bfbfbf",
          }}
        >
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
            icon={
              copied ? (
                <CheckOutlined style={{ color: "#52c41a" }} />
              ) : (
                <CopyOutlined />
              )
            }
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
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount,
  );

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

type EditUserFormValues = {
  name?: string;
  gender?: string;
  phone_number?: string;
  role?: "subscriber" | "administrator";
  date_of_birth?: dayjs.Dayjs | null;
};

export default function AdminUserDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [testResults, setTestResults] = useState<unknown[]>([]);
  const [orders, setOrders] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Pro Activation Modal State ──
  const [proModalVisible, setProModalVisible] = useState(false);
  const [proActivating, setProActivating] = useState(false);
  const [teacherUpdating, setTeacherUpdating] = useState(false);
  const [proMode, setProMode] = useState<"month" | "day">("month");
  const [durationMonths, setDurationMonths] = useState(1);
  const [durationDays, setDurationDays] = useState(7);
  const [proNote, setProNote] = useState("");
  const [proPackage, setProPackage] = useState<"combo" | "listening" | "reading">("combo");

  // ── Set PRO Date Modal State ──
  const [setDateModalVisible, setSetDateModalVisible] = useState(false);
  const [setDateNote, setSetDateNote] = useState("");
  const [setDateValue, setSetDateValue] = useState<
    import("dayjs").Dayjs | null
  >(null);
  const [setDateUpdating, setSetDateUpdating] = useState(false);
  const [extendDays, setExtendDays] = useState<number | null>(null);
  const [extendMonths, setExtendMonths] = useState<number | null>(null);

  // ── Edit & Delete State ──
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm] = Form.useForm();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordForm] = Form.useForm();

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
    setProActivating(true);
    try {
      const body: Record<string, unknown> = {
        action,
        note: proNote || undefined,
      };

      if (action === "activate") {
        if (proMode === "day") {
          body.durationDays = durationDays;
        } else {
          body.durationMonths = durationMonths;
        }
        if (proPackage !== "combo") {
          body.proSkills = [proPackage];
        }
      }

      const res = await fetch(`/api/admin/users/${id}/toggle-pro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        message.success(json.message);
        setProModalVisible(false);
        setProNote("");
        setProPackage("combo");
        fetchUser();
      } else {
        message.error(json.error);
      }
    } catch {
      message.error("Error toggling Pro status");
    } finally {
      setProActivating(false);
    }
  };

  const handleSetProDate = async () => {
    if (!setDateValue) {
      message.warning("Vui lòng chọn ngày hết hạn PRO");
      return;
    }
    setSetDateUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/toggle-pro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-date",
          expirationDate: setDateValue.format("YYYY-MM-DD"),
          note: setDateNote || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        message.success(json.message);
        setSetDateModalVisible(false);
        setSetDateNote("");
        setSetDateValue(null);
        fetchUser();
      } else {
        message.error(json.error);
      }
    } catch {
      message.error("Lỗi khi cập nhật ngày PRO");
    } finally {
      setSetDateUpdating(false);
    }
  };

  const handleToggleTeacher = async (action: "grant" | "revoke") => {
    setTeacherUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/toggle-teacher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        message.success(json.message);
        fetchUser();
      } else {
        message.error(json.error);
      }
    } catch {
      message.error("Lỗi khi cập nhật quyền Giáo viên");
    } finally {
      setTeacherUpdating(false);
    }
  };

  const openSetDateModal = () => {
    setSetDateValue(
      user?.pro_expiration_date ? dayjs(user.pro_expiration_date) : null,
    );
    setSetDateNote("");
    setExtendDays(null);
    setExtendMonths(null);
    setSetDateModalVisible(true);
  };

  /** Base để tính "Tăng thêm": ngày hết hạn hiện tại (nếu còn hạn) hoặc hôm nay */
  const proBaseDate =
    user?.pro_expiration_date &&
    dayjs(user.pro_expiration_date).isAfter(dayjs())
      ? dayjs(user.pro_expiration_date)
      : dayjs();

  const extendDaysResult =
    extendDays && extendDays > 0 ? proBaseDate.add(extendDays, "day") : null;

  const extendMonthsResult =
    extendMonths && extendMonths > 0
      ? proBaseDate.add(extendMonths, "month")
      : null;

  const handleDeleteUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        message.success("Đã xoá user");
        router.push("/admin/users");
      } else {
        message.error(json.error || "Có lỗi xảy ra");
      }
    } catch {
      message.error("Lỗi khi xoá user");
    }
  };

  const handleUpdateUser = async (values: EditUserFormValues) => {
    setUpdating(true);
    try {
      // Preserve the teacher role (managed by the dedicated toggle) so editing
      // other profile fields doesn't silently revoke it.
      const hadTeacher = Array.isArray(user?.roles)
        ? user.roles.includes("teacher")
        : user?.roles === "teacher";
      const nextRoles = [
        ...(values.role ? [values.role] : []),
        ...(hadTeacher ? ["teacher"] : []),
      ];

      const updateData = {
        name: values.name,
        gender: values.gender,
        phone_number: values.phone_number,
        roles: Array.from(new Set(nextRoles)),
        date_of_birth: values.date_of_birth
          ? values.date_of_birth.format("YYYY-MM-DD")
          : null,
      };

      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const json = await res.json();
      if (json.success) {
        message.success("Cập nhật thông tin thành công");
        setEditModalVisible(false);
        fetchUser();
      } else {
        message.error(json.error || "Có lỗi xảy ra");
      }
    } catch {
      message.error("Lỗi khi cập nhật");
    } finally {
      setUpdating(false);
    }
  };

  const openEditModal = () => {
    if (user) {
      editForm.setFieldsValue({
        name: user.name,
        gender: user.gender,
        phone_number: user.phone_number,
        role:
          Array.isArray(user.roles) && user.roles.includes("administrator")
            ? "administrator"
            : "subscriber",
        date_of_birth: user.date_of_birth ? dayjs(user.date_of_birth) : null,
      });
      setEditModalVisible(true);
    }
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    const length = 14;
    const generated = Array.from({ length }, () => {
      const index =
        crypto.getRandomValues(new Uint32Array(1))[0] % chars.length;
      return chars[index];
    }).join("");

    passwordForm.setFieldsValue({
      password: generated,
      confirmPassword: generated,
    });
  };

  const openPasswordModal = () => {
    passwordForm.resetFields();
    generatePassword();
    setPasswordModalVisible(true);
  };

  const handleResetPassword = async (values: { password: string }) => {
    setPasswordUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: values.password }),
      });
      const json = await res.json();
      if (json.success) {
        message.success("Đã đặt lại mật khẩu cho user");
        setPasswordModalVisible(false);
        passwordForm.resetFields();
      } else {
        message.error(json.error || "Có lỗi xảy ra");
      }
    } catch {
      message.error("Lỗi khi đặt lại mật khẩu");
    } finally {
      setPasswordUpdating(false);
    }
  };

  const testColumns: ColumnsType<Record<string, unknown>> = [
    {
      title: "Bài test",
      key: "quiz",
      render: (_, r: Record<string, unknown>) => {
        const quiz = r.quizzes as Record<string, unknown> | null;
        return (quiz?.title as string) ?? "—";
      },
    },
    {
      title: "Skill",
      key: "skill",
      width: 100,
      render: (_, r: Record<string, unknown>) => {
        const quiz = r.quizzes as Record<string, unknown> | null;
        const skill = quiz?.skill as string;
        return skill ? (
          <Tag color={skill === "reading" ? "blue" : "purple"}>{skill}</Tag>
        ) : (
          "—"
        );
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
      render: (d: string | null) =>
        d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—",
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
        const colors: Record<string, string> = {
          pending: "orange",
          completed: "green",
          cancelled: "red",
        };
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
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 400 }}
        >
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
          onClick={() =>
            window.history.length > 1 ? router.back() : router.push("/admin/users")
          }
          className="mb-4"
        >
          Quay lại
        </Button>

        <Card
          title={
            <div className="flex flex-col gap-3 py-2 whitespace-normal md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={user.avatar_url} icon={<UserOutlined />} size={48} />
                <div className="min-w-0">
                  <h2 className="text-xl font-bold m-0 truncate">
                    {user.name || user.email}
                  </h2>
                  <span className="text-gray-500 text-sm truncate block">
                    {user.email}
                  </span>
                </div>
              </div>
              <Space wrap size={[8, 8]} className="shrink-0">
                <Button icon={<EditOutlined />} onClick={openEditModal}>
                  Sửa
                </Button>
                <Button icon={<KeyOutlined />} onClick={openPasswordModal}>
                  Đặt lại mật khẩu
                </Button>
                <Popconfirm
                  title="Xoá User này?"
                  description="Hành động này không thể hoàn tác."
                  onConfirm={handleDeleteUser}
                  okText="Xoá"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Xoá
                  </Button>
                </Popconfirm>
                {user.is_pro ? (
                  <>
                    <Button icon={<EditOutlined />} onClick={openSetDateModal}>
                      Sửa ngày PRO
                    </Button>
                    <Popconfirm
                      title="Hủy Pro?"
                      description="User sẽ không còn quyền truy cập Pro"
                      onConfirm={() => handleTogglePro("deactivate")}
                      okText="Xác nhận"
                      cancelText="Hủy"
                      getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
                    >
                      <Button danger>Hủy Pro</Button>
                    </Popconfirm>
                  </>
                ) : (
                  <Button
                    type="primary"
                    icon={<CrownOutlined />}
                    onClick={() => setProModalVisible(true)}
                  >
                    Kích hoạt Pro
                  </Button>
                )}
                {(
                  Array.isArray(user.roles)
                    ? user.roles.includes("teacher")
                    : user.roles === "teacher"
                ) ? (
                  <Popconfirm
                    title="Thu hồi quyền Giáo viên?"
                    description="User sẽ không còn tạo/quản lý lớp học được."
                    onConfirm={() => handleToggleTeacher("revoke")}
                    okText="Xác nhận"
                    cancelText="Hủy"
                    getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
                  >
                    <Button danger loading={teacherUpdating}>
                      Thu hồi Giáo viên
                    </Button>
                  </Popconfirm>
                ) : (
                  <Button
                    icon={<TeamOutlined />}
                    loading={teacherUpdating}
                    onClick={() => handleToggleTeacher("grant")}
                  >
                    Cấp quyền Giáo viên
                  </Button>
                )}
              </Space>
            </div>
          }
        >
          <Descriptions bordered column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="ID">
              <span className="font-mono text-xs">{user.id}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Pro Status">
              {user.is_pro ? (
                <Tag color="gold" icon={<CrownOutlined />}>
                  PRO
                </Tag>
              ) : (
                <Tag>Free</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Pro hết hạn">
              {user.pro_expiration_date
                ? dayjs(user.pro_expiration_date).format("DD/MM/YYYY")
                : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Giới tính">
              {user.gender || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày sinh">
              {user.date_of_birth
                ? dayjs(user.date_of_birth).format("DD/MM/YYYY")
                : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="SĐT">
              {user.phone_number || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Roles">
              {(typeof user.roles === "string"
                ? [user.roles]
                : Array.isArray(user.roles)
                  ? user.roles
                  : []
              ).map((r) => (
                <Tag key={r} color={r === "administrator" ? "red" : "blue"}>
                  {r}
                </Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày đăng ký">
              {dayjs(user.created_at).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Mục tiêu (Target Score)" span={2}>
              {(() => {
                const ts = (user.target_score || {}) as Record<string, unknown>;
                const SKILL_LABELS: Record<string, string> = {
                  reading: "Reading",
                  listening: "Listening",
                  speaking: "Speaking",
                  writing: "Writing",
                };
                const skills = (["listening", "reading", "writing", "speaking"] as const)
                  .filter((k) => ts[k] != null && ts[k] !== "")
                  .map((k) => ({ k, label: SKILL_LABELS[k], v: ts[k] }));
                const examDate = ts.exam_date ? dayjs(ts.exam_date as string) : null;
                const hasExam = examDate && examDate.isValid();
                if (skills.length === 0 && !hasExam) return "—";
                return (
                  <Space wrap size={[8, 8]}>
                    {skills.map(({ k, label, v }) => (
                      <Tag key={k} color="blue">
                        {label}: {String(v)}
                      </Tag>
                    ))}
                    {hasExam ? (
                      <Tag color="gold">Ngày thi: {examDate!.format("DD/MM/YYYY")}</Tag>
                    ) : null}
                  </Space>
                );
              })()}
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
          title={
            <Space>
              <CrownOutlined style={{ color: "#faad14" }} />
              Kích hoạt Pro
            </Space>
          }
          open={proModalVisible}
          onOk={() => handleTogglePro("activate")}
          onCancel={() => {
            setProModalVisible(false);
            setProNote("");
            setProPackage("combo");
          }}
          okText="Kích hoạt"
          cancelText="Hủy"
          confirmLoading={proActivating}
          width={560}
        >
          {/* ── Section 1: Gói truy cập (Combo / Single) ── */}
          <section className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold text-gray-800 uppercase tracking-wide">
                Gói truy cập
              </label>
              <span className="text-[11px] text-gray-400">
                Combo ghi đè gói lẻ • Mua gói lẻ khác sẽ cộng dồn
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  value: "combo" as const,
                  label: "Combo",
                  desc: "Listening + Reading",
                  icon: <CrownOutlined style={{ fontSize: 18 }} />,
                },
                {
                  value: "listening" as const,
                  label: "Listening",
                  desc: "Chỉ kỹ năng nghe",
                  icon: <CustomerServiceOutlined style={{ fontSize: 18 }} />,
                },
                {
                  value: "reading" as const,
                  label: "Reading",
                  desc: "Chỉ kỹ năng đọc",
                  icon: <BookOutlined style={{ fontSize: 18 }} />,
                },
              ].map((opt) => {
                const active = proPackage === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setProPackage(opt.value)}
                    className={`relative rounded-lg border px-3 py-3 text-left transition-all ${
                      active
                        ? "border-[#D94A56] bg-[#FDECEE] ring-1 ring-[#D94A56]/30"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 text-sm font-bold ${
                        active ? "text-[#D94A56]" : "text-gray-800"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {opt.desc}
                    </div>
                    {active && (
                      <CheckOutlined
                        className="absolute top-2 right-2 text-[#D94A56]"
                        style={{ fontSize: 11 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Section 2: Thời hạn ── */}
          <section className="mb-5">
            <label className="block text-[13px] font-semibold text-gray-800 uppercase tracking-wide mb-2">
              Thời hạn
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Segmented
                value={proMode}
                onChange={(v) => setProMode(v as "month" | "day")}
                options={[
                  { label: "Theo tháng", value: "month" },
                  { label: "Theo ngày", value: "day" },
                ]}
                block
                className="sm:w-[220px]"
              />
              <InputNumber
                min={1}
                max={proMode === "month" ? 24 : 365}
                value={proMode === "month" ? durationMonths : durationDays}
                onChange={(v) =>
                  proMode === "month"
                    ? setDurationMonths(v ?? 1)
                    : setDurationDays(v ?? 7)
                }
                addonAfter={proMode === "month" ? "tháng" : "ngày"}
                className="flex-1"
              />
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-md px-2.5 py-1">
              <CalendarOutlined />
              Hết hạn dự kiến:&nbsp;
              <b className="text-gray-800">
                {dayjs()
                  .add(
                    proMode === "month" ? durationMonths : durationDays,
                    proMode === "month" ? "month" : "day",
                  )
                  .format("DD/MM/YYYY")}
              </b>
            </div>
          </section>

          <Divider className="!my-4" />

          {/* ── Section 3: Note ── */}
          <section className="pb-6">
            <label className="block text-[13px] font-semibold text-gray-800 uppercase tracking-wide mb-2">
              Ghi chú / Lý do
            </label>
            <Input.TextArea
              placeholder="VD: Tặng dùng thử, hỗ trợ kỹ thuật, KH đã thanh toán..."
              value={proNote}
              onChange={(e) => setProNote(e.target.value)}
              rows={3}
              maxLength={300}
              showCount
            />
          </section>
        </Modal>

        {/* Set PRO Date Modal */}
        <Modal
          title={
            <Space>
              <EditOutlined />
              Chỉnh sửa ngày hết hạn PRO
            </Space>
          }
          open={setDateModalVisible}
          onOk={handleSetProDate}
          onCancel={() => {
            setSetDateModalVisible(false);
            setSetDateNote("");
          }}
          okText="Lưu"
          cancelText="Hủy"
          confirmLoading={setDateUpdating}
          width={520}
        >
          {/* Thông tin ngày hiện tại */}
          {user?.pro_expiration_date && (
            <div
              style={{
                background: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: 6,
                padding: "8px 12px",
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              <span style={{ color: "#389e0d" }}>Ngày hết hạn hiện tại: </span>
              <b>{dayjs(user.pro_expiration_date).format("DD/MM/YYYY")}</b>
              {dayjs(user.pro_expiration_date).isAfter(dayjs()) ? (
                <span style={{ color: "#8c8c8c", marginLeft: 8, fontSize: 12 }}>
                  (còn {dayjs(user.pro_expiration_date).diff(dayjs(), "day")}{" "}
                  ngày)
                </span>
              ) : (
                <span style={{ color: "#ff4d4f", marginLeft: 8, fontSize: 12 }}>
                  (đã hết hạn)
                </span>
              )}
            </div>
          )}

          {/* Tăng thêm ngày */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tăng thêm (ngày)
            </label>
            <Space.Compact style={{ width: "100%" }}>
              <InputNumber
                style={{ width: "100%" }}
                placeholder="Nhập số ngày"
                min={1}
                precision={0}
                value={extendDays}
                onChange={(v) => {
                  const val = v !== null ? Math.floor(Number(v)) : null;
                  setExtendDays(val && val > 0 ? val : null);
                  // reset tháng và datepicker khi nhập ngày
                  setExtendMonths(null);
                  if (val && val > 0) {
                    setSetDateValue(proBaseDate.add(val, "day"));
                  }
                }}
                addonAfter="ngày"
                status={
                  extendDays !== null && extendDays <= 0 ? "error" : undefined
                }
              />
            </Space.Compact>
            {extendDaysResult && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Hết hạn mới: <b>{extendDaysResult.format("DD/MM/YYYY")}</b>
              </p>
            )}
            {extendDays !== null && extendDays <= 0 && (
              <p className="text-xs mt-1" style={{ color: "#ff4d4f" }}>
                Phải là số nguyên dương &gt; 0
              </p>
            )}
          </div>

          {/* Tăng thêm tháng */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tăng thêm (tháng)
            </label>
            <Space.Compact style={{ width: "100%" }}>
              <InputNumber
                style={{ width: "100%" }}
                placeholder="Nhập số tháng"
                min={1}
                precision={0}
                value={extendMonths}
                onChange={(v) => {
                  const val = v !== null ? Math.floor(Number(v)) : null;
                  setExtendMonths(val && val > 0 ? val : null);
                  // reset ngày và datepicker khi nhập tháng
                  setExtendDays(null);
                  if (val && val > 0) {
                    setSetDateValue(proBaseDate.add(val, "month"));
                  }
                }}
                addonAfter="tháng"
                status={
                  extendMonths !== null && extendMonths <= 0
                    ? "error"
                    : undefined
                }
              />
            </Space.Compact>
            {extendMonthsResult && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Hết hạn mới: <b>{extendMonthsResult.format("DD/MM/YYYY")}</b>
              </p>
            )}
            {extendMonths !== null && extendMonths <= 0 && (
              <p className="text-xs mt-1" style={{ color: "#ff4d4f" }}>
                Phải là số nguyên dương &gt; 0
              </p>
            )}
          </div>

          <Divider className="my-2">
            <span className="text-xs text-gray-400">
              hoặc chọn ngày trực tiếp
            </span>
          </Divider>

          {/* DatePicker chọn ngày trực tiếp */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Đặt ngày hết hạn cụ thể
            </label>
            <DatePicker
              format="DD/MM/YYYY"
              className="w-full"
              value={setDateValue}
              onChange={(d) => {
                setSetDateValue(d);
                // reset extend khi chọn thủ công
                setExtendDays(null);
                setExtendMonths(null);
              }}
              placeholder="Chọn ngày hết hạn mới"
            />
            {setDateValue && (
              <p
                className="text-xs mt-1"
                style={{
                  color: setDateValue.isAfter(dayjs()) ? "#52c41a" : "#ff4d4f",
                }}
              >
                {setDateValue.isAfter(dayjs())
                  ? `✓ Sẽ lưu: ${setDateValue.format("DD/MM/YYYY")}`
                  : `⚠ Ngày đã qua — tài khoản sẽ bị hủy PRO`}
              </p>
            )}
          </div>

          <Divider className="my-3" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú / Lý do thay đổi
            </label>
            <Input.TextArea
              placeholder="VD: Gia hạn thủ công, sửa lỗi hệ thống..."
              value={setDateNote}
              onChange={(e) => setSetDateNote(e.target.value)}
              rows={3}
              maxLength={300}
              showCount
            />
          </div>
        </Modal>

        {/* Edit Info Modal */}
        <Modal
          title="Sửa thông tin User"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          onOk={() => editForm.submit()}
          confirmLoading={updating}
          okText="Lưu"
          cancelText="Hủy"
        >
          <Form form={editForm} layout="vertical" onFinish={handleUpdateUser}>
            <Form.Item name="name" label="Họ và tên">
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>
            <Form.Item name="phone_number" label="Số điện thoại">
              <Input placeholder="Nhập SĐT" />
            </Form.Item>
            <Form.Item name="gender" label="Giới tính">
              <Select
                options={[
                  { value: "Nam", label: "Nam" },
                  { value: "Nữ", label: "Nữ" },
                  { value: "Khác", label: "Khác" },
                ]}
                allowClear
              />
            </Form.Item>
            <Form.Item name="date_of_birth" label="Ngày sinh">
              <DatePicker format="DD/MM/YYYY" className="w-full" />
            </Form.Item>
            <Form.Item name="role" label="Vai trò">
              <Select
                options={[
                  { value: "subscriber", label: "Subscriber" },
                  { value: "administrator", label: "Quản trị viên" },
                ]}
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Đặt lại mật khẩu"
          open={passwordModalVisible}
          onCancel={() => {
            setPasswordModalVisible(false);
            passwordForm.resetFields();
          }}
          onOk={() => passwordForm.submit()}
          confirmLoading={passwordUpdating}
          okText="Lưu mật khẩu mới"
          cancelText="Hủy"
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleResetPassword}
          >
            <Form.Item label="User">
              <Input value={user.email} disabled />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu mới"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới" },
                { min: 8, message: "Mật khẩu tối thiểu 8 ký tự" },
              ]}
              extra="Admin có thể nhập thủ công hoặc bấm tự sinh."
            >
              <Input.Password
                placeholder="Nhập mật khẩu mới"
                addonAfter={
                  <Button
                    type="text"
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={generatePassword}
                  >
                    Tạo mới
                  </Button>
                }
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu xác nhận không khớp"),
                    );
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Nhập lại mật khẩu mới" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdmin;
