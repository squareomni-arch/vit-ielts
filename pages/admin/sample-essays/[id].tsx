import { useEffect, useState } from "react";
import { Form, Input, Select, Switch, Button, message, Spin, Popover, Space, Row, Col, InputNumber } from "antd";
import { ArrowLeftOutlined, SaveOutlined, SendOutlined, GlobalOutlined, StarFilled } from "@ant-design/icons";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { AdminPageHeader, AdminGlassCard } from "@/widgets/admin";
import BlogEditor from "@/features/admin-post/BlogEditor";
import { ImageUpload } from "@/shared/ui/image-upload";

const { TextArea } = Input;

function toSlug(title: string): string {
    return title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

/**
 * Generate a synthetic votes array that produces the desired average rating.
 * Each vote has a fake user_id and a rate (1-5).
 */
function generateVotesArray(avgRating: number, count: number): { user_id: string; rate: number }[] {
    if (count <= 0 || avgRating <= 0) return [];
    const clampedRating = Math.min(5, Math.max(0, avgRating));
    const votes: { user_id: string; rate: number }[] = [];
    
    if (count === 1) {
        votes.push({ user_id: `admin-seed-0`, rate: Math.round(clampedRating) || 1 });
        return votes;
    }
    
    const baseRate = Math.round(clampedRating) || 1;
    const targetSum = clampedRating * count;
    const baseSum = baseRate * (count - 1);
    let lastRate = Math.round(targetSum - baseSum);
    lastRate = Math.min(5, Math.max(1, lastRate));

    for (let i = 0; i < count - 1; i++) {
        votes.push({ user_id: `admin-seed-${i}`, rate: baseRate });
    }
    votes.push({ user_id: `admin-seed-${count - 1}`, rate: lastRate });
    return votes;
}

export default function AdminSampleEssayEditorPage() {
    const router = useRouter();
    const { id } = router.query;
    const isNew = id === "new";
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(!isNew && !!id);
    const [saving, setSaving] = useState(false);

    // Watch values for live preview
    const title = Form.useWatch("title", form);
    const slug = Form.useWatch("slug", form);
    const seo_meta_title = Form.useWatch(["seo", "meta_title"], form);
    const seo_meta_description = Form.useWatch(["seo", "meta_description"], form);

    const displayTitle = seo_meta_title || title || "Your Sample Essay Title";
    const displayDesc = seo_meta_description || "Meta description goes here...";
    const displaySlug = slug || (title ? toSlug(title) : "your-slug");

    useEffect(() => {
        if (id && !isNew) fetchEssay();
    }, [id]);

    const fetchEssay = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/sample-essays/${id}`);
            const json = await res.json();
            if (json.success) {
                // Compute rating & vote_count from votes array for the UI
                const votes = json.data.votes ?? [];
                const voteCount = votes.length;
                const avgRate = voteCount > 0 ? votes.reduce((s: number, v: any) => s + v.rate, 0) / voteCount : 0;

                form.setFieldsValue({
                    ...json.data,
                    seo: json.data.seo || {},
                    _rating: Number(avgRate.toFixed(1)),
                    _vote_count: voteCount,
                });
            } else {
                message.error("Lỗi khi tải bài viết");
            }
        } catch { 
            message.error("Lỗi hệ thống"); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleSave = async (targetStatus?: string) => {
        try {
            const values = await form.validateFields();
            setSaving(true);
            const currentStatus = form.getFieldValue("status");
            const finalStatus = targetStatus || currentStatus || "draft";
            
            // Generate votes array from admin-set rating & vote_count
            const rating = values._rating ?? 0;
            const voteCount = values._vote_count ?? 0;
            const votes = generateVotesArray(rating, voteCount);

            // Remove UI-only fields before sending
            const { _rating, _vote_count, ...rest } = values;

            const body = { 
                ...rest, 
                status: finalStatus,
                views: values.views ?? 0,
                seo: values.seo || {},
                votes,
            };

            const url = isNew ? "/api/admin/sample-essays" : `/api/admin/sample-essays/${id}`;
            const method = isNew ? "POST" : "PUT";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            const json = await res.json();

            if (json.success) {
                message.success(isNew ? "Tạo essay thành công" : "Đã cập nhật essay");
                if (isNew && json.data?.id) {
                    router.push(`/admin/sample-essays/${json.data.id}`);
                } else {
                    form.setFieldsValue({ status: finalStatus });
                }
            } else {
                message.error(json.error || "Lỗi khi lưu bài viết");
            }
        } catch (err: unknown) { 
            // Ant Design validation errors have 'errorFields' - don't show generic message for those
            if (err && typeof err === "object" && "errorFields" in err) {
                message.error("Vui lòng kiểm tra lại các trường bắt buộc");
            } else {
                console.error(err);
                message.error("Lỗi hệ thống khi lưu bài viết");
            }
        } finally { 
            setSaving(false); 
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isNew || !form.getFieldValue("slug")) {
            form.setFieldsValue({ slug: toSlug(e.target.value) });
        }
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center min-h-[400px]">
                <Spin size="large" />
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <AdminPageHeader
                title={isNew ? "Tạo sample essay mới" : "Chỉnh sửa sample essay"}
                actions={
                    <Space>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/admin/sample-essays")}>Quay lại</Button>
                        <Button loading={saving} onClick={() => handleSave("draft")} icon={<SaveOutlined />}>Lưu nháp</Button>
                        <Button type="primary" style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }} loading={saving} onClick={() => handleSave("published")} icon={<SendOutlined />}>Xuất bản</Button>
                    </Space>
                }
            />

            <Form 
                form={form} 
                layout="vertical" 
                initialValues={{ 
                    status: "draft", 
                    pro_user_only: false, 
                    views: 0,
                    _rating: 0,
                    _vote_count: 0,
                    seo: {} 
                }}
            >
                <div className="admin-post-editor-layout">
                    {/* Main Panel */}
                    <div className="admin-post-main">
                        <AdminGlassCard>
                            <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}>
                                <Input size="large" placeholder="Nhập tiêu đề..." onChange={handleTitleChange} />
                            </Form.Item>
                            
                            <Form.Item name="slug" label="Đường dẫn (Slug)" rules={[{ required: true, message: "Vui lòng nhập slug" }]}>
                                <Input addonBefore="/sample-essay/" placeholder="duong-dan-bai-viet" />
                            </Form.Item>

                            <Form.Item name="excerpt" label="Tóm tắt (Excerpt)">
                                <TextArea rows={3} placeholder="Mô tả ngắn về nội dung bài viết..." />
                            </Form.Item>
                        </AdminGlassCard>

                        <AdminGlassCard title="Metadata Bài thi">
                            <Row gutter={16}>
                                <Col span={8}><Form.Item name="skill" label="Skill"><Select allowClear options={[{ value: "writing", label: "Writing" }, { value: "speaking", label: "Speaking" }]} placeholder="Chọn kỹ năng" /></Form.Item></Col>
                                <Col span={8}><Form.Item name="part" label="Part"><Select allowClear options={[{ value: "1", label: "Part 1" }, { value: "2", label: "Part 2" }, { value: "3", label: "Part 3" }]} placeholder="Chọn Part" /></Form.Item></Col>
                                <Col span={8}><Form.Item name="question_type" label="Question Type"><Input placeholder="Eg: Discuss both views" /></Form.Item></Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={6}><Form.Item name="source" label="Source (Nguồn)"><Input placeholder="Eg: Cambridge 18" /></Form.Item></Col>
                                <Col span={6}><Form.Item name="year" label="Year"><Input placeholder="Eg: 2024" /></Form.Item></Col>
                                <Col span={6}><Form.Item name="quarter" label="Quarter"><Input placeholder="Eg: Q1" /></Form.Item></Col>
                                <Col span={6}><Form.Item name="topic" label="Topic Chủ đề"><Input placeholder="Eg: Education" /></Form.Item></Col>
                            </Row>
                            <Form.Item name="task" label="Task (Câu hỏi chính)"><Input placeholder="Nhập câu hỏi bài thi..." /></Form.Item>
                            <Form.Item name="passage" label="Passage (Bài đọc/Đoạn văn liên quan nếu có)" className="mb-0"><TextArea rows={4} placeholder="Văn bản đính kèm..." /></Form.Item>
                        </AdminGlassCard>

                        <AdminGlassCard title="Nội dung Bài mẫu (Sample Answer)">
                            <Form.Item name="content" className="mb-0" rules={[{ required: true, message: "Vui lòng nhập nội dung bài mẫu" }]}>
                                <BlogEditor />
                            </Form.Item>
                        </AdminGlassCard>
                        
                        <AdminGlassCard title="SEO Settings" extra={
                            <Popover content="Xem trước bài viết của bạn sẽ hiển thị như thế nào trên Google (Mobile layout)">
                                <a>Preview Info</a>
                            </Popover>
                        }>
                            <Form.Item name={["seo", "meta_title"]} label="Meta Title" extra="Tiêu đề hiển thị trên thẻ trình duyệt và Google (Nên dưới 60 ký tự)">
                                <Input placeholder={title || "Nhập meta title..."} maxLength={100} showCount />
                            </Form.Item>
                            
                            <Form.Item name={["seo", "meta_description"]} label="Meta Description" extra="Mô tả tóm tắt hiển thị trên Google (Nên từ 150-160 ký tự)">
                                <TextArea rows={2} placeholder="Nhập meta description..." maxLength={200} showCount />
                            </Form.Item>

                            {/* SEO Preview Card */}
                            <div className="mt-6">
                                <span className="admin-stat-card-label" style={{ display: 'block', marginBottom: 8 }}>Google Search Preview</span>
                                <div className="admin-seo-preview-card">
                                    <div className="seo-preview-url">
                                        <GlobalOutlined /> https://vit-ielts.com › sample-essay › {displaySlug}
                                    </div>
                                    <div className="seo-preview-title">{displayTitle}</div>
                                    <div className="seo-preview-desc">{displayDesc}</div>
                                </div>
                            </div>
                        </AdminGlassCard>
                    </div>

                    {/* Sidebar */}
                    <div className="admin-post-sidebar">
                        <AdminGlassCard title="Publish">
                            <Form.Item name="status" label="Trạng thái">
                                <Select options={[
                                    { value: "draft", label: "📄 Nháp (Draft)" },
                                    { value: "published", label: "✅ Đã đăng (Published)" }
                                ]} />
                            </Form.Item>

                            <Form.Item name="views" label="Views">
                                <InputNumber min={0} precision={0} style={{ width: "100%" }} />
                            </Form.Item>

                            <Form.Item name="_rating" label={<span><StarFilled style={{ color: '#faad14', marginRight: 4 }} />Rating (0-5 sao)</span>}>
                                <InputNumber min={0} max={5} step={0.1} precision={1} style={{ width: "100%" }} />
                            </Form.Item>

                            <Form.Item name="_vote_count" label="Số lượt vote">
                                <InputNumber min={0} precision={0} style={{ width: "100%" }} />
                            </Form.Item>
                            
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="mb-0">
                                <Form.Item name="pro_user_only" valuePropName="checked" noStyle>
                                    <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                                </Form.Item>
                                <span>Chỉ dành cho Pro User</span>
                            </div>
                        </AdminGlassCard>

                        <AdminGlassCard title="Featured Image">
                            <Form.Item name="featured_image" className="mb-0">
                                <ImageUpload />
                            </Form.Item>
                        </AdminGlassCard>
                    </div>
                </div>
            </Form>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
