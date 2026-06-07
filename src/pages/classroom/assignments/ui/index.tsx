import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Radio,
  Select,
  Tag,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { createClient } from "~supabase/client";
import { getQuizzes } from "~services/quiz";
import { createAssignments, deleteAssignment } from "~services/classroom";
import type { AssignmentWithStats } from "~services/types/classroom";
import type { Quiz } from "~services/types/database";
import { ROUTES } from "@/shared/routes";

type StudentLite = { id: string; name: string | null; email: string };

type Props = {
  classroom: { id: string; name: string };
  assignments: AssignmentWithStats[];
  students: StudentLite[];
};

const skillColor = (skill: string) =>
  skill === "listening" ? "purple" : skill === "reading" ? "geekblue" : "default";

const AssignmentRow = ({
  a,
  onDelete,
}: {
  a: AssignmentWithStats;
  onDelete: (id: string) => void;
}) => {
  const ratio = a.target_count ? Math.round((a.submitted_count / a.target_count) * 100) : 0;
  const overdue = a.due_at && dayjs(a.due_at).isBefore(dayjs());
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-[10px] border border-gray-100 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-[#2D3142]">{a.quiz_title}</span>
          {a.quiz_skill ? <Tag color={skillColor(a.quiz_skill)}>{a.quiz_skill}</Tag> : null}
          {!a.assigned_to_all ? <Tag color="orange">Giao riêng</Tag> : null}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-[#6A7282]">
          {a.due_at ? (
            <span className={overdue ? "text-[#D94A56]" : ""}>
              <ClockCircleOutlined /> Hạn: {dayjs(a.due_at).format("DD/MM/YYYY HH:mm")}
            </span>
          ) : (
            <span>Không có hạn nộp</span>
          )}
          {a.note ? <span className="truncate">· {a.note}</span> : null}
        </div>
      </div>
      <div className="w-40">
        <div className="mb-1 text-xs text-[#6A7282]">
          {a.submitted_count}/{a.target_count} đã nộp
        </div>
        <Progress percent={ratio} size="small" showInfo={false} strokeColor="#D94A56" />
      </div>
      <Popconfirm
        title="Xóa bài giao này?"
        onConfirm={() => onDelete(a.id)}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <Button type="text" danger icon={<DeleteOutlined />} />
      </Popconfirm>
    </div>
  );
};

export const PageClassroomAssignments = ({ classroom, assignments, students }: Props) => {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — quiz picker
  const [search, setSearch] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [selectedQuizzes, setSelectedQuizzes] = useState<Quiz[]>([]);

  // Step 2 — config
  const [dueAt, setDueAt] = useState<Dayjs | null>(null);
  const [note, setNote] = useState("");
  const [audience, setAudience] = useState<"all" | "subset">("all");
  const [subset, setSubset] = useState<string[]>([]);

  const selectedIds = new Set(selectedQuizzes.map((q) => q.id));

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingQuizzes(true);
    getQuizzes(supabase, { search: search || undefined, page: 1, pageSize: 20 })
      .then((res) => {
        if (active) setQuizzes(res.data);
      })
      .catch(() => active && setQuizzes([]))
      .finally(() => active && setLoadingQuizzes(false));
    return () => {
      active = false;
    };
  }, [open, search, supabase]);

  const resetModal = () => {
    setOpen(false);
    setStep(1);
    setSearch("");
    setSelectedQuizzes([]);
    setDueAt(null);
    setNote("");
    setAudience("all");
    setSubset([]);
  };

  const toggleQuiz = (q: Quiz) => {
    setSelectedQuizzes((prev) =>
      prev.some((x) => x.id === q.id) ? prev.filter((x) => x.id !== q.id) : [...prev, q]
    );
  };

  const handleAssign = async () => {
    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Bạn cần đăng nhập.");
      await createAssignments(supabase, {
        classroomId: classroom.id,
        quizIds: selectedQuizzes.map((q) => q.id),
        dueAt: dueAt ? dueAt.toISOString() : null,
        note: note.trim() || null,
        studentIds: audience === "subset" ? subset : null,
        createdBy: user.id,
      });
      message.success(`Đã giao ${selectedQuizzes.length} đề cho học sinh`);
      resetModal();
      router.replace(router.asPath, undefined, { scroll: false });
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Không giao được bài.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAssignment(supabase, id);
      message.success("Đã xóa bài giao");
      router.replace(router.asPath, undefined, { scroll: false });
    } catch {
      message.error("Không xóa được bài giao.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:py-10">
      <Link
        href={ROUTES.CLASSROOM.DETAIL(classroom.id)}
        className="inline-flex items-center gap-1 text-sm text-[#6A7282] hover:text-[#D94A56]"
      >
        <ArrowLeftOutlined /> Quay lại lớp
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2D3142]">Bài giao</h1>
          <p className="text-[#6A7282]">Lớp {classroom.name}</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Giao bài
        </Button>
      </div>

      <div className="mt-6">
        {assignments.length === 0 ? (
          <Card className="rounded-[13px] border border-dashed border-gray-200">
            <Empty description="Chưa giao bài nào">
              <Button type="primary" onClick={() => setOpen(true)}>
                Giao bài
              </Button>
            </Empty>
          </Card>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <AssignmentRow key={a.id} a={a} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* 2-step Giao bài modal */}
      <Modal
        title={step === 1 ? "Chọn đề · Bước 1/2" : "Cấu hình bài giao · Bước 2/2"}
        open={open}
        onCancel={() => !submitting && resetModal()}
        width={640}
        footer={null}
        destroyOnClose
      >
        {step === 1 ? (
          <>
            <Input.Search
              placeholder="Tìm kiếm đề thi..."
              allowClear
              onSearch={(v) => setSearch(v)}
              onChange={(e) => !e.target.value && setSearch("")}
              className="mb-3"
            />
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {loadingQuizzes ? (
                <p className="py-6 text-center text-[#6A7282]">Đang tải đề…</p>
              ) : quizzes.length === 0 ? (
                <p className="py-6 text-center text-[#6A7282]">Không tìm thấy đề thi.</p>
              ) : (
                quizzes.map((q) => (
                  <label
                    key={q.id}
                    className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-gray-100 px-3 py-2 hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedIds.has(q.id)}
                      onChange={() => toggleQuiz(q)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-[#2D3142]">{q.title}</div>
                      <div className="text-xs text-[#6A7282]">
                        {q.skill} · {q.time_minutes} phút
                      </div>
                    </div>
                    {q.skill ? <Tag color={skillColor(q.skill)}>{q.skill}</Tag> : null}
                  </label>
                ))
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[#6A7282]">
                Đã chọn {selectedQuizzes.length} đề
              </span>
              <div className="flex gap-2">
                <Button onClick={resetModal}>Hủy</Button>
                <Button
                  type="primary"
                  disabled={selectedQuizzes.length === 0}
                  onClick={() => setStep(2)}
                >
                  Tiếp tục →
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-3 rounded-[10px] bg-[#F7F7F7] p-3 text-sm text-[#2D3142]">
              {selectedQuizzes.map((q) => q.title).join(" · ")}
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#2D3142]">
                  Hạn nộp (tùy chọn)
                </label>
                <DatePicker
                  showTime={{ defaultValue: dayjs("23:59", "HH:mm"), format: "HH:mm" }}
                  format="DD/MM/YYYY HH:mm"
                  className="w-full"
                  value={dueAt}
                  onChange={(v) => setDueAt(v)}
                  placeholder="DD/MM/YYYY (gõ hoặc chọn)"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#2D3142]">
                  Lời dặn của giáo viên (tùy chọn)
                </label>
                <Input.TextArea
                  rows={3}
                  maxLength={500}
                  showCount
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Làm trước thứ 6. Chú ý phần Matching Headings."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#2D3142]">
                  Giao cho
                </label>
                <Radio.Group
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="mb-2"
                >
                  <Radio value="all">Cả lớp ({students.length} HS)</Radio>
                  <Radio value="subset">Chọn học sinh</Radio>
                </Radio.Group>
                {audience === "subset" ? (
                  <Select
                    mode="multiple"
                    className="w-full"
                    placeholder="Chọn học sinh…"
                    value={subset}
                    onChange={setSubset}
                    optionFilterProp="label"
                    options={students.map((s) => ({
                      value: s.id,
                      label: s.name || s.email,
                    }))}
                  />
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <Button onClick={() => setStep(1)}>← Quay lại</Button>
              <Button
                type="primary"
                loading={submitting}
                disabled={audience === "subset" && subset.length === 0}
                onClick={handleAssign}
              >
                Giao {selectedQuizzes.length} đề
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
