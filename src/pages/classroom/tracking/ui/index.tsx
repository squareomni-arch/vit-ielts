import { useMemo } from "react";
import Link from "next/link";
import { Avatar, Button, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ClassroomLayout } from "@/widgets/layouts";
import type { AssignmentWithStats, TrackingRow } from "~services/types/classroom";
import { ROUTES } from "@/shared/routes";
import { STATUS_META } from "../../status-display";

type Props = {
  classroom: { id: string; name: string };
  assignments: AssignmentWithStats[];
  rows: TrackingRow[];
};

const tints = ["#D94A56", "#2563EB", "#7C3AED", "#0EA5E9", "#16A34A", "#EA580C"];
const tintFor = (k: string) => tints[[...k].reduce((a, c) => a + c.charCodeAt(0), 0) % tints.length];

const StatCard = ({
  icon,
  label,
  value,
  tint,
}: {
  icon: string;
  label: string;
  value: string;
  tint: string;
}) => (
  <div className="flex items-center gap-[14px] rounded-[13px] border border-[#E5E7EB] bg-white px-5 py-[18px] shadow-[0_2px_6px_0_rgba(0,0,0,0.04)]">
    <span
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px]"
      style={{ background: `${tint}1A` }}
    >
      <span className="material-symbols-rounded text-[22px] leading-none" style={{ color: tint }}>
        {icon}
      </span>
    </span>
    <div className="flex flex-col gap-1">
      <span className="text-[13px] font-medium text-[#6A7282]">{label}</span>
      <span className="text-[28px] font-bold leading-none text-[#191D24]">{value}</span>
    </div>
  </div>
);

export const PageClassroomTracking = ({ classroom, assignments, rows }: Props) => {
  const stats = useMemo(() => {
    const bands = rows.map((r) => r.average_band).filter((b): b is number => b != null);
    const totalApplicable = rows.reduce((s, r) => s + r.total_count, 0);
    const totalSubmitted = rows.reduce((s, r) => s + r.submitted_count, 0);
    return {
      submittedTotal: totalSubmitted,
      avg: bands.length ? Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 10) / 10 : null,
      submitRate: totalApplicable ? Math.round((totalSubmitted / totalApplicable) * 100) : 0,
    };
  }, [rows]);

  const exportCsv = () => {
    const header = ["Học sinh", "Email", ...assignments.map((a) => a.quiz_title), "Band TB"];
    const lines = rows.map((r) => {
      const byA = new Map(r.cells.map((c) => [c.assignment_id, c]));
      const cols = assignments.map((a) => {
        const c = byA.get(a.id);
        if (!c) return "";
        return c.score != null ? String(c.score) : STATUS_META[c.status].label;
      });
      return [r.name || "", r.email, ...cols, r.average_band ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [header.map((h) => `"${h}"`).join(","), ...lines].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${classroom.name}-bao-cao.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<TrackingRow> = [
    {
      title: "Học sinh",
      key: "student",
      fixed: "left",
      width: 220,
      render: (_, r) => (
        <Link
          href={ROUTES.CLASSROOM.STUDENT_HISTORY(classroom.id, r.student_id)}
          className="flex items-center gap-2"
        >
          <Avatar size="small" style={{ background: tintFor(r.student_id) }} src={r.avatar_url || undefined}>
            {(r.name || r.email || "?").charAt(0).toUpperCase()}
          </Avatar>
          <div className="min-w-0">
            <div className="truncate font-medium text-[#2D3142]">{r.name || r.email}</div>
            <div className="truncate text-xs font-normal text-[#6A7282]">{r.email}</div>
          </div>
        </Link>
      ),
    },
    ...assignments.map((a) => ({
      title: (
        <Tooltip title={a.quiz_title}>
          <span className="line-clamp-2 text-xs">{a.quiz_title}</span>
        </Tooltip>
      ),
      key: a.id,
      align: "center" as const,
      width: 116,
      render: (_: unknown, r: TrackingRow) => {
        const c = r.cells.find((x) => x.assignment_id === a.id);
        if (!c) return <span className="text-[#C7CBD1]">—</span>;
        if (c.score != null) return <span className="font-bold text-[#D94A56]">{c.score}</span>;
        const meta = STATUS_META[c.status];
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    })),
    {
      title: "Band TB",
      key: "avg",
      fixed: "right",
      align: "center",
      width: 96,
      render: (_, r) =>
        r.average_band != null ? (
          <span className="font-bold text-[#D94A56]">{r.average_band}</span>
        ) : (
          <span className="text-[#C7CBD1]">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <Link
        href={ROUTES.CLASSROOM.DETAIL(classroom.id)}
        className="inline-flex items-center gap-1 text-sm text-[#6A7282] hover:text-[#D94A56]"
      >
        <span className="material-symbols-rounded text-[18px]">arrow_back</span>
        Quay lại lớp
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold text-[#2D3142]">
          {classroom.name} — Kết quả làm bài
        </h2>
        <div className="flex gap-2">
          <Link href={`${ROUTES.CLASSROOM.DETAIL(classroom.id)}?tab=assignments`}>
            <Button type="primary">+ Giao bài mới</Button>
          </Link>
          <Button onClick={exportCsv} disabled={rows.length === 0}>
            <span className="material-symbols-rounded mr-1 text-[18px]">download</span>
            Xuất báo cáo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="assignment" label="Bài đã giao" value={String(assignments.length)} tint="#2563EB" />
        <StatCard icon="task_alt" label="Lượt đã nộp" value={String(stats.submittedTotal)} tint="#16A34A" />
        <StatCard icon="grade" label="Band trung bình" value={stats.avg != null ? String(stats.avg) : "—"} tint="#D94A56" />
        <StatCard icon="trending_up" label="Tỷ lệ nộp" value={`${stats.submitRate}%`} tint="#7C3AED" />
      </div>

      <div className="flex items-start gap-2 rounded-[10px] bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <span className="material-symbols-rounded text-[18px]">info</span>
        <span>
          Điểm Reading &amp; Listening được đồng bộ tự động ngay khi học sinh nhấn &quot;Nộp
          bài&quot;. Cột kết quả cập nhật theo thời gian thực.
        </span>
      </div>

      <div className="rounded-[13px] border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-base font-bold text-[#2D3142]">Bảng điểm học viên</h3>
        <Table<TrackingRow>
          columns={columns}
          dataSource={rows}
          rowKey="student_id"
          pagination={false}
          scroll={{ x: "max-content" }}
          size="small"
        />
      </div>
    </div>
  );
};

PageClassroomTracking.Layout = ClassroomLayout;
