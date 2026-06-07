import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Avatar, Card, Descriptions, Spin, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";

type Detail = {
  classroom: {
    id: string;
    name: string;
    description: string | null;
    invite_code: string;
    status: string;
    created_at: string;
    owner: { name: string | null; email: string } | null;
  };
  members: {
    id: string;
    user_id: string;
    role: string;
    joined_at: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
  }[];
  assignments: {
    id: string;
    due_at: string | null;
    note: string | null;
    assigned_to_all: boolean;
    created_at: string;
    quiz_title: string;
    quiz_skill: string;
  }[];
};

export default function AdminClassroomDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/classrooms/${id}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const memberColumns: ColumnsType<Detail["members"][number]> = [
    {
      title: "Thành viên",
      key: "member",
      render: (_, m) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" src={m.avatar_url || undefined}>
            {(m.name || m.email || "?").charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div className="font-medium">{m.name || m.email}</div>
            <div className="text-xs text-gray-400">{m.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Vai trò",
      key: "role",
      width: 120,
      render: (_, m) =>
        m.role === "teacher" ? <Tag color="red">Giáo viên</Tag> : <Tag color="blue">Học sinh</Tag>,
    },
    {
      title: "Tham gia",
      key: "joined",
      width: 140,
      render: (_, m) => dayjs(m.joined_at).format("DD/MM/YYYY"),
    },
  ];

  const assignmentColumns: ColumnsType<Detail["assignments"][number]> = [
    { title: "Đề", dataIndex: "quiz_title", key: "quiz" },
    {
      title: "Kỹ năng",
      dataIndex: "quiz_skill",
      key: "skill",
      width: 110,
      render: (s: string) => (s ? <Tag>{s}</Tag> : "—"),
    },
    {
      title: "Giao cho",
      key: "audience",
      width: 110,
      render: (_, a) => (a.assigned_to_all ? "Cả lớp" : "Chọn HS"),
    },
    {
      title: "Hạn nộp",
      key: "due",
      width: 160,
      render: (_, a) => (a.due_at ? dayjs(a.due_at).format("DD/MM/YYYY HH:mm") : "—"),
    },
    {
      title: "Ngày giao",
      key: "created",
      width: 120,
      render: (_, a) => dayjs(a.created_at).format("DD/MM/YYYY"),
    },
  ];

  return (
    <AdminLayout>
      <Link href="/admin/classrooms" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500">
        <ArrowLeftOutlined /> Quay lại danh sách lớp
      </Link>

      {loading ? (
        <div className="py-20 text-center">
          <Spin />
        </div>
      ) : !data ? (
        <Card>Không tìm thấy lớp.</Card>
      ) : (
        <>
          <Card className="mb-4" title={data.classroom.name}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Mã mời">
                <span className="font-mono">{data.classroom.invite_code}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {data.classroom.status === "active" ? (
                  <Tag color="green">Đang hoạt động</Tag>
                ) : (
                  <Tag>Đã đóng</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Giáo viên chủ">
                {data.classroom.owner?.name || "—"} ({data.classroom.owner?.email})
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(data.classroom.created_at).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={2}>
                {data.classroom.description || "—"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card className="mb-4" title={`Thành viên (${data.members.length})`}>
            <Table
              columns={memberColumns}
              dataSource={data.members}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>

          <Card title={`Bài giao (${data.assignments.length})`}>
            <Table
              columns={assignmentColumns}
              dataSource={data.assignments}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </>
      )}
    </AdminLayout>
  );
}

export const getServerSideProps = withAdmin;
