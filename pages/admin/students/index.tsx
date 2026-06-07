import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, Button, Card, Input, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined } from "@ant-design/icons";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";
import type { AdminStudentRow } from "~services/classroom-admin";

export default function AdminStudentsPage() {
  const [rows, setRows] = useState<AdminStudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/students?${params}`);
      const json = await res.json();
      if (json.success) setRows(json.data);
      else message.error(json.error);
    } catch {
      message.error("Lỗi tải danh sách học viên");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnsType<AdminStudentRow> = [
    {
      title: "Học viên",
      key: "student",
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
    {
      title: "Số lớp",
      dataIndex: "class_count",
      key: "class_count",
      align: "center",
      width: 90,
    },
    {
      title: "Lớp đang tham gia",
      key: "classes",
      render: (_, r) => (
        <Space wrap size={[4, 4]}>
          {r.classes.map((c) => (
            <Link key={c.id} href={`/admin/classrooms/${c.id}`}>
              <Tag color="blue" className="cursor-pointer">
                {c.name}
              </Tag>
            </Link>
          ))}
        </Space>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, r) => (
        <Link href={`/admin/users/${r.id}`}>
          <Button size="small" icon={<EditOutlined />}>
            Hồ sơ
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Quản lý Học viên</h1>
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
        <Table<AdminStudentRow>
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
