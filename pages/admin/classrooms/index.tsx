import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  Input,
  Popconfirm,
  Segmented,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";
import type { AdminClassroomRow } from "~services/classroom-admin";

export default function AdminClassroomsPage() {
  const [rows, setRows] = useState<AdminClassroomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "closed">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/admin/classrooms?${params}`);
      const json = await res.json();
      if (json.success) setRows(json.data);
      else message.error(json.error);
    } catch {
      message.error("Lỗi tải danh sách lớp");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatus = async (id: string, next: "active" | "closed") => {
    try {
      const res = await fetch(`/api/admin/classrooms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (json.success) {
        message.success(json.message);
        fetchData();
      } else message.error(json.error);
    } catch {
      message.error("Lỗi cập nhật trạng thái");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/classrooms/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        message.success(json.message);
        fetchData();
      } else message.error(json.error);
    } catch {
      message.error("Lỗi xóa lớp");
    }
  };

  const columns: ColumnsType<AdminClassroomRow> = [
    {
      title: "Tên lớp",
      key: "name",
      render: (_, r) => (
        <div>
          <Link href={`/admin/classrooms/${r.id}`} className="font-semibold text-[#D94A56]">
            {r.name}
          </Link>
          <div className="text-xs text-gray-400">
            Mã: <span className="font-mono">{r.invite_code}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Giáo viên (chủ)",
      key: "owner",
      render: (_, r) => (
        <div>
          <div>{r.owner_name || "—"}</div>
          <div className="text-xs text-gray-400">{r.owner_email}</div>
        </div>
      ),
    },
    { title: "Học sinh", dataIndex: "student_count", key: "students", align: "center", width: 90 },
    { title: "GV", dataIndex: "teacher_count", key: "teachers", align: "center", width: 70 },
    { title: "Bài giao", dataIndex: "assignment_count", key: "assignments", align: "center", width: 90 },
    {
      title: "Trạng thái",
      key: "status",
      width: 110,
      render: (_, r) =>
        r.status === "active" ? <Tag color="green">Đang hoạt động</Tag> : <Tag>Đã đóng</Tag>,
    },
    {
      title: "Ngày tạo",
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
          <Link href={`/admin/classrooms/${r.id}`}>
            <Button size="small" icon={<EyeOutlined />}>
              Xem
            </Button>
          </Link>
          {r.status === "active" ? (
            <Button size="small" onClick={() => handleStatus(r.id, "closed")}>
              Đóng
            </Button>
          ) : (
            <Button size="small" onClick={() => handleStatus(r.id, "active")}>
              Mở lại
            </Button>
          )}
          <Popconfirm
            title="Xóa lớp này?"
            description="Toàn bộ thành viên & bài giao sẽ bị xóa vĩnh viễn."
            onConfirm={() => handleDelete(r.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Quản lý Lớp học</h1>
      </div>
      <Card className="mb-4">
        <Space wrap>
          <Input.Search
            placeholder="Tìm theo tên lớp hoặc mã mời…"
            allowClear
            style={{ width: 320 }}
            onSearch={(v) => setSearch(v)}
            onChange={(e) => !e.target.value && setSearch("")}
          />
          <Segmented
            value={status}
            onChange={(v) => setStatus(v as "all" | "active" | "closed")}
            options={[
              { label: "Tất cả", value: "all" },
              { label: "Đang hoạt động", value: "active" },
              { label: "Đã đóng", value: "closed" },
            ]}
          />
        </Space>
      </Card>
      <Card>
        <Table<AdminClassroomRow>
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: "max-content" }}
          size="small"
        />
      </Card>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdmin;
