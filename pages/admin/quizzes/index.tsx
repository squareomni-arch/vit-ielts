import { useEffect, useState, useCallback } from "react";
import {
    Table, Tag, Input, Space, Card, Button, Select, message, Popconfirm,
    Modal, Form, Switch, InputNumber, Typography,
} from "antd";
import {
    PlusOutlined, SearchOutlined, EditOutlined, CopyOutlined,
    DeleteOutlined, ReadOutlined, CustomerServiceOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";

const { TextArea } = Input;
const { Text } = Typography;

type QuizRow = {
    id: string;
    title: string;
    slug: string;
    skill: string;
    type: string;
    status: string;
    tests_taken: number;
    pro_user_only: boolean;
    created_at: string;
};

// ---------------------------------------------------------------------------
// Slugify helper
// ---------------------------------------------------------------------------
function slugify(text: string): string {
    const dm: Record<string, string> = {
        'à':'a','á':'a','ả':'a','ã':'a','ạ':'a',
        'ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a',
        'â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a',
        'đ':'d',
        'è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e',
        'ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e',
        'ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
        'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o',
        'ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o',
        'ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o',
        'ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u',
        'ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u',
        'ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y',
    };
    return text.toLowerCase().split('').map(ch => dm[ch] || ch).join('')
        .replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Add Quiz Modal component
// ---------------------------------------------------------------------------
function AddQuizModal({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (id: string) => void;
}) {
    const [form] = Form.useForm();
    const [selectedSkill, setSelectedSkill] = useState<"reading" | "listening">("reading");
    const [creating, setCreating] = useState(false);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setCreating(true);

            const title = values.title?.trim();
            const baseSlug = slugify(title);
            const uniqueSuffix = Date.now().toString(36).slice(-5);
            const payload = {
                title,
                slug: baseSlug ? `${baseSlug}-${uniqueSuffix}` : `quiz-${uniqueSuffix}`,
                skill: selectedSkill,
                type: values.type || "practice",
                pro_user_only: values.pro_user_only || false,
                excerpt: values.excerpt || "",
                time_minutes: values.time_minutes || 60,
                status: "draft",
                passages: [{ title: "", content: "", sort_order: 0, questions: [] }],
            };

            const res = await fetch("/api/admin/quizzes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();

            if (json.success && json.data?.id) {
                message.success("Đã tạo quiz mới");
                form.resetFields();
                setSelectedSkill("reading");
                onCreated(json.data.id);
            } else {
                message.error(json.error || "Lỗi khi tạo quiz");
            }
        } catch (err) {
            if (err && typeof err === "object" && "errorFields" in err) {
                // Form validation error — don't show extra message
            } else {
                message.error("Lỗi khi tạo quiz");
            }
        } finally {
            setCreating(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedSkill("reading");
        onClose();
    };

    return (
        <Modal
            title="Add Quiz"
            open={open}
            onCancel={handleCancel}
            width={520}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Cancel
                </Button>,
                <Button
                    key="ok"
                    type="primary"
                    loading={creating}
                    onClick={handleOk}
                    style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                >
                    OK
                </Button>,
            ]}
            destroyOnClose
        >
            {/* ── Skill Tabs ── */}
            <div className="add-quiz-skill-tabs">
                <div
                    className={`add-quiz-skill-tab ${selectedSkill === "reading" ? "active" : ""}`}
                    onClick={() => setSelectedSkill("reading")}
                >
                    <ReadOutlined style={{ fontSize: 28 }} />
                    <span>Reading</span>
                </div>
                <div
                    className={`add-quiz-skill-tab ${selectedSkill === "listening" ? "active" : ""}`}
                    onClick={() => setSelectedSkill("listening")}
                >
                    <CustomerServiceOutlined style={{ fontSize: 28 }} />
                    <span>Listening</span>
                </div>
            </div>

            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    type: "practice",
                    pro_user_only: false,
                    time_minutes: 60,
                }}
            >
                <Form.Item
                    name="title"
                    label={<Text strong>Quiz title <Text type="danger">*</Text></Text>}
                    rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
                >
                    <Input placeholder="Title" size="large" />
                </Form.Item>

                <Form.Item
                    name="type"
                    label={<Text strong>Quiz type <Text type="danger">*</Text></Text>}
                >
                    <Select
                        size="large"
                        options={[
                            { value: "practice", label: "Practice" },
                            { value: "exam", label: "Exam" },
                        ]}
                    />
                </Form.Item>

                <Form.Item
                    name="pro_user_only"
                    label={<Text strong>Pro</Text>}
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>

                <Form.Item
                    name="excerpt"
                    label={<Text strong>Short description (Optional)</Text>}
                >
                    <TextArea
                        rows={3}
                        placeholder="Short description (Optional)"
                    />
                </Form.Item>

                <Form.Item
                    name="time_minutes"
                    label={<Text strong>Time (minutes)</Text>}
                >
                    <InputNumber
                        min={0}
                        max={180}
                        addonAfter="minutes"
                        style={{ width: "100%" }}
                        size="large"
                    />
                </Form.Item>
            </Form>

            <style jsx>{`
                .add-quiz-skill-tabs {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    margin-bottom: 24px;
                    padding: 8px 0;
                }

                .add-quiz-skill-tab {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    padding: 16px 28px;
                    border: 2px solid #e8e8e8;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #999;
                    font-size: 14px;
                    font-weight: 500;
                    min-width: 100px;
                }

                .add-quiz-skill-tab:hover {
                    border-color: #b7e4c7;
                    color: #52c41a;
                }

                .add-quiz-skill-tab.active {
                    border-color: #52c41a;
                    color: #52c41a;
                    background: #f6ffed;
                    box-shadow: 0 0 0 1px #52c41a;
                }
            `}</style>
        </Modal>
    );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function AdminQuizzesPage() {
    const router = useRouter();
    const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [search, setSearch] = useState("");
    const [skillFilter, setSkillFilter] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchQuizzes = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            if (search) params.set("search", search);
            if (skillFilter) params.set("skill", skillFilter);
            if (typeFilter) params.set("type", typeFilter);
            if (statusFilter) params.set("status", statusFilter);

            const res = await fetch(`/api/admin/quizzes?${params}`);
            const json = await res.json();
            if (json.success) {
                setQuizzes(json.data);
                setTotal(json.count);
            }
        } catch {
            message.error("Lỗi khi tải danh sách quiz");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, skillFilter, typeFilter, statusFilter]);

    useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/quizzes/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                message.success("Đã xóa quiz");
                fetchQuizzes();
            } else {
                message.error(json.error);
            }
        } catch {
            message.error("Error deleting quiz");
        }
    };

    const handleClone = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/quizzes/${id}/clone`, { method: "POST" });
            const json = await res.json();
            if (json.success) {
                message.success("Đã clone quiz");
                fetchQuizzes();
            } else {
                message.error(json.error);
            }
        } catch {
            message.error("Error cloning quiz");
        }
    };

    const columns: ColumnsType<QuizRow> = [
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            ellipsis: true,
            render: (title: string, record) => (
                <a onClick={() => router.push(`/admin/quizzes/${record.id}`)} className="font-medium">
                    {title}
                </a>
            ),
        },
        {
            title: "Skill",
            dataIndex: "skill",
            key: "skill",
            width: 100,
            render: (s: string) => <Tag color={s === "reading" ? "blue" : "purple"}>{s}</Tag>,
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            width: 100,
            render: (t: string) => <Tag>{t}</Tag>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 100,
            render: (s: string) => <Tag color={s === "published" ? "green" : "default"}>{s}</Tag>,
        },
        {
            title: "Lượt làm",
            dataIndex: "tests_taken",
            key: "tests_taken",
            width: 90,
            sorter: (a, b) => a.tests_taken - b.tests_taken,
        },
        {
            title: "Pro",
            dataIndex: "pro_user_only",
            key: "pro_user_only",
            width: 60,
            render: (v: boolean) => v ? <Tag color="gold">Pro</Tag> : null,
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            key: "created_at",
            width: 120,
            render: (d: string) => dayjs(d).format("DD/MM/YYYY"),
        },
        {
            title: "Actions",
            key: "actions",
            width: 160,
            render: (_, record) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => router.push(`/admin/quizzes/${record.id}`)} />
                    <Button size="small" icon={<CopyOutlined />} onClick={() => handleClone(record.id)} />
                    <Popconfirm title="Xóa quiz này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Card
                title={<h1 className="text-2xl font-bold m-0">Quản lý Quizzes</h1>}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAddModal(true)}>
                        Thêm quiz mới
                    </Button>
                }
            >
                <Space className="mb-4" wrap>
                    <Input.Search
                        placeholder="Tìm theo tiêu đề..."
                        allowClear
                        onSearch={(v) => { setSearch(v); setPage(1); }}
                        style={{ width: 220 }}
                        prefix={<SearchOutlined />}
                    />
                    <Select value={skillFilter} onChange={(v) => { setSkillFilter(v); setPage(1); }} style={{ width: 120 }} allowClear placeholder="Skill">
                        <Select.Option value="reading">Reading</Select.Option>
                        <Select.Option value="listening">Listening</Select.Option>
                    </Select>
                    <Select value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }} style={{ width: 120 }} allowClear placeholder="Type">
                        <Select.Option value="practice">Practice</Select.Option>
                        <Select.Option value="exam">Exam</Select.Option>
                    </Select>
                    <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} style={{ width: 120 }} allowClear placeholder="Status">
                        <Select.Option value="published">Published</Select.Option>
                        <Select.Option value="draft">Draft</Select.Option>
                    </Select>
                </Space>

                <Table
                    columns={columns}
                    dataSource={quizzes}
                    rowKey="id"
                    loading={loading}
                    onChange={(pagination: TablePaginationConfig) => { setPage(pagination.current ?? 1); setPageSize(pagination.pageSize ?? 20); }}
                    pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `Tổng ${t} quizzes` }}
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* Add Quiz Modal — BP Quiz style */}
            <AddQuizModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={(id) => {
                    setShowAddModal(false);
                    router.push(`/admin/quizzes/${id}`);
                }}
            />
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
