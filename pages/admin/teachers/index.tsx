import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { UserAddOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";
import type { AdminTeacherRow } from "~services/classroom-admin";

export default function AdminTeachersPage() {
  const [rows, setRows] = useState<AdminTeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [grantOpen, setGrantOpen] = useState(false);
  const [granting, setGranting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/teachers?${params}`);
      const json = await res.json();
      if (json.success) setRows(json.data);
      else message.error(json.error);
    } catch {
      message.error("Lỗi tải danh sách giáo viên");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGrant = async () => {
    const values = await form.validateFields();
    setGranting(true);
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        message.success(json.message);
        setGrantOpen(false);
        form.resetFields();
        fetchData();
      } else message.error(json.error);
    } catch {
      message.error("Lỗi cấp quyền");
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/toggle-teacher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });
      const json = await res.json();
      if (json.success) {
        message.success(json.message);
        fetchData();
      } else message.error(json.error);
    } catch {
      message.error("Lỗi thu hồi quyền");
    }
  };

  const columns: ColumnsType<AdminTeacherRow> = [
    {
      title: "Giáo viên",
      key: "teacher",
      render: (_, r) => (
        <div className="flex items-center gap-2">
          <Avatar src={r.avatar_url || undefined}>
            {(r.name || r.email || "?").charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div className="font-medium">{r.name || "—"}</div>
            <div className="text-xs text-gray-400">{r.email}</div>
          </div>
        </div>
      ),
    },
    { title: "Lớp làm chủ", dataIndex: "owned_count", key: "owned", align: "center", width: 110 },
    { title: "Lớp tham gia dạy", dataIndex: "teaching_count", key: "teaching", align: "center", width: 140 },
    {
      title: "Tham gia",
      key: "created",
      width: 120,
      render: (_, r) => dayjs(r.created_at).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 220,
      render: (_, r) => (
        <Space>
          <Link href={`/admin/users/${r.id}`}>
            <Button size="small" icon={<EditOutlined />}>
              Hồ sơ
            </Button>
          </Link>
          <Popconfirm
            title="Thu hồi quyền Giáo viên?"
            description="Họ sẽ không tạo/quản lý lớp được nữa (lớp cũ vẫn giữ)."
            onConfirm={() => handleRevoke(r.id)}
            okText="Thu hồi"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>
              Thu hồi
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Quản lý Giáo viên</h1>
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => setGrantOpen(true)}>
          Cấp quyền Giáo viên
        </Button>
      </div>

      <Card className="mb-4">
        <Input.Search
          placeholder="Tìm theo tên hoặc email…"
          allowClear
          style={{ width: 320 }}
          onSearch={(v) => setSearch(v)}
          onChange={(e) => !e.target.value && setSearch("")}
        />
      </Card>

      <Card>
        <Table<AdminTeacherRow>
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: "max-content" }}
          size="small"
        />
      </Card>

      <Modal
        title="Cấp quyền Giáo viên"
        open={grantOpen}
        onCancel={() => !granting && setGrantOpen(false)}
        onOk={handleGrant}
        confirmLoading={granting}
        okText="Cấp quyền"
        cancelText="Hủy"
        destroyOnClose
      >
        <p className="mb-3 text-sm text-gray-500">
          Nhập email tài khoản đã đăng ký để cấp quyền Giáo viên (tạo/quản lý lớp học).
        </p>
        <Form form={form} layout="vertical" requiredMark={false} preserve={false}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email." },
              { type: "email", message: "Email không hợp lệ." },
            ]}
          >
            <Input placeholder="vd: giaovien@email.com" />
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdmin;
