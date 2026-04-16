import { useEffect, useState } from "react";
import { Form, Input, Select, Switch, Button, message, Spin, Popover, Space, Tag, InputNumber } from "antd";
import { ArrowLeftOutlined, SaveOutlined, SendOutlined, GlobalOutlined, PictureOutlined, TagsOutlined } from "@ant-design/icons";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { AdminPageHeader, AdminGlassCard } from "@/widgets/admin";
import BlogEditor from "@/features/admin-post/BlogEditor";

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

export default function AdminPostEditorPage() {
    const router = useRouter();
    const { id } = router.query;
    const isNew = id === "new";
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(!isNew && !!id);
    const [saving, setSaving] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);

    // Fetch existing categories for suggestions
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/admin/posts/categories");
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && Array.isArray(json.data)) {
                        setCategoryOptions(
                            json.data.map((cat: string) => ({ value: cat, label: cat }))
                        );
                    }
                }
            } catch {
                // Non-critical — silently fail
            }
        };
        fetchCategories();
    }, []);

    // Watch values for live preview
    const title = Form.useWatch("title", form);
    const slug = Form.useWatch("slug", form);
    const seo_meta_title = Form.useWatch(["seo", "meta_title"], form);
    const seo_meta_description = Form.useWatch(["seo", "meta_description"], form);
    const featured_image = Form.useWatch("featured_image", form);

    const displayTitle = seo_meta_title || title || "Your Blog Post Title";
    const displayDesc = seo_meta_description || "Meta description goes here...";
    const displaySlug = slug || (title ? toSlug(title) : "your-slug");

    useEffect(() => {
        if (id && !isNew) fetchPost();
    }, [id]);

    const fetchPost = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/posts/${id}`);
            const json = await res.json();
            if (json.success) {
                form.setFieldsValue({
                    ...json.data,
                    seo: json.data.seo || {}
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
            
            const body = {
                ...values,
                pro_user_only: form.getFieldValue("pro_user_only") ?? false,
                status: finalStatus,
                seo: values.seo || {}
            };

            const url = isNew ? "/api/admin/posts" : `/api/admin/posts/${id}`;
            const method = isNew ? "POST" : "PUT";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            const json = await res.json();

            if (json.success) {
                message.success(isNew ? "Tạo bài viết thành công" : "Đã cập nhật bài viết");
                if (isNew && json.data?.id) {
                    router.push(`/admin/posts/${json.data.id}`);
                } else {
                    form.setFieldsValue({ status: finalStatus });
                }
            } else {
                message.error(json.error);
            }
        } catch (err) { 
            console.error(err);
            message.error("Vui lòng kiểm tra lại thông tin"); 
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
                title={isNew ? "Tạo bài viết mới" : "Chỉnh sửa bài viết"}
                actions={
                    <Space>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/admin/posts")}>Quay lại</Button>
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
                    categories: [],
                    seo: {} 
                }}
            >
                <div className="admin-post-editor-layout">
                    {/* Main Panel */}
                    <div className="admin-post-main">
                        <AdminGlassCard>
                            <Form.Item name="title" label="Tiêu đề bài viết" rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}>
                                <Input size="large" placeholder="Nhập tiêu đề..." onChange={handleTitleChange} />
                            </Form.Item>
                            
                            <Form.Item name="slug" label="Đường dẫn (Slug)" rules={[{ required: true, message: "Vui lòng nhập slug" }]}>
                                <Input addonBefore="/blog/" placeholder="duong-dan-bai-viet" />
                            </Form.Item>

                            <Form.Item name="excerpt" label="Tóm tắt ngắn (Excerpt)">
                                <TextArea rows={3} placeholder="Mô tả ngắn về nội dung bài viết..." />
                            </Form.Item>
                        </AdminGlassCard>

                        <AdminGlassCard title="Nội dung">
                            <Form.Item name="content" className="mb-0">
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
                                        <GlobalOutlined /> https://ielts-prediction.com › blog › {displaySlug}
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
                            
                            <Form.Item name="pro_user_only" valuePropName="checked" className="mb-0">
                                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                                <span style={{ marginLeft: 8 }}>Chỉ dành cho Pro User</span>
                            </Form.Item>
                        </AdminGlassCard>

                        <AdminGlassCard title="Phân loại">
                            <Form.Item
                                name="categories"
                                label={
                                    <span>
                                        <TagsOutlined style={{ marginRight: 6 }} />
                                        Danh mục / Thẻ (Tags)
                                    </span>
                                }
                                className="mb-0"
                                extra="Chọn gợi ý hoặc gõ tự do rồi nhấn Enter để tạo tag mới."
                            >
                                <Select
                                    mode="tags"
                                    placeholder="Tìm hoặc thêm tag: IELTS Reading, Tips..."
                                    style={{ width: '100%' }}
                                    options={categoryOptions}
                                    filterOption={(input, option) =>
                                        (option?.label as string ?? '')
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    notFoundContent={
                                        <span style={{ color: '#888', fontSize: 13 }}>
                                            Nhấn Enter để tạo tag mới
                                        </span>
                                    }
                                    tagRender={(props) => {
                                        const { label, closable, onClose } = props;
                                        return (
                                            <Tag
                                                color="red"
                                                closable={closable}
                                                onClose={onClose}
                                                style={{ marginInlineEnd: 4, borderRadius: 4 }}
                                            >
                                                {label}
                                            </Tag>
                                        );
                                    }}
                                />
                            </Form.Item>
                        </AdminGlassCard>

                        <AdminGlassCard title="Featured Image">
                            <Form.Item name="featured_image" className="mb-4">
                                <Input prefix={<PictureOutlined />} placeholder="Nhập URL hình ảnh..." />
                            </Form.Item>
                            {featured_image ? (
                                <div className="mt-2 rounded-lg overflow-hidden border border-dashed border-gray-600 relative pt-[56.25%] bg-black/20">
                                    <img src={featured_image} alt="Featured preview" className="absolute top-0 left-0 w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="mt-2 rounded-lg border border-dashed border-gray-600 h-32 flex items-center justify-center text-gray-500 bg-black/20 text-sm">
                                    Chưa có hình ảnh
                                </div>
                            )}
                        </AdminGlassCard>
                    </div>
                </div>
            </Form>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
