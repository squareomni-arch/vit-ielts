import { useEffect, useState } from "react";
import { Card, Form, Input, Select, Switch, Button, Space, message, Spin, Row, Col } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import AdminLayout from "../_layout";
import { useRouter } from "next/router";
import { withAdmin } from "@/shared/hoc/withAdmin";

const { TextArea } = Input;

export default function AdminPostEditorPage() {
    const router = useRouter();
    const { id } = router.query;
    const isNew = id === "new";
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(!isNew && !!id);
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (id && !isNew) fetchPost(); }, [id]);

    const fetchPost = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/posts/${id}`);
            const json = await res.json();
            if (json.success) form.setFieldsValue(json.data);
        } catch { message.error("Error loading post"); }
        finally { setLoading(false); }
    };

    const handleSave = async (status?: string) => {
        try {
            const values = await form.validateFields();
            setSaving(true);
            const body = { ...values, status: status || values.status || "draft" };

            const url = isNew ? "/api/admin/posts" : `/api/admin/posts/${id}`;
            const method = isNew ? "POST" : "PUT";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            const json = await res.json();

            if (json.success) {
                message.success(isNew ? "Tạo thành công" : "Cập nhật thành công");
                if (isNew && json.data?.id) router.push(`/admin/posts/${json.data.id}`);
            } else message.error(json.error);
        } catch { message.error("Validation error"); }
        finally { setSaving(false); }
    };

    if (loading) return <AdminLayout><div className="flex items-center justify-center" style={{ minHeight: 400 }}><Spin size="large" /></div></AdminLayout>;

    return (
        <AdminLayout>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/admin/posts")} className="mb-4">Quay lại</Button>
            <h2 className="text-xl font-bold mb-4">{isNew ? "Tạo bài viết mới" : "Chỉnh sửa bài viết"}</h2>

            <Form form={form} layout="vertical" initialValues={{ status: "draft", pro_user_only: false, categories: [] }}>
                <Card title="Nội dung" className="mb-4">
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="slug" label="Slug" rules={[{ required: true }]}><Input /></Form.Item></Col>
                    </Row>
                    <Form.Item name="excerpt" label="Tóm tắt"><TextArea rows={2} /></Form.Item>
                    <Form.Item name="content" label="Nội dung (HTML)"><TextArea rows={12} /></Form.Item>
                </Card>

                <Card title="Cài đặt" className="mb-4">
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="status" label="Status"><Select options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }]} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="featured_image" label="Ảnh đại diện"><Input placeholder="URL" /></Form.Item></Col>
                        <Col span={8}><Form.Item name="pro_user_only" label="Chỉ Pro" valuePropName="checked"><Switch /></Form.Item></Col>
                    </Row>
                    <Form.Item name="categories" label="Categories">
                        <Select mode="tags" placeholder="Thêm category..." />
                    </Form.Item>
                </Card>

                <Space>
                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => handleSave("draft")}>Lưu nháp</Button>
                    <Button type="primary" style={{ backgroundColor: "#52c41a" }} loading={saving} onClick={() => handleSave("published")}>Xuất bản</Button>
                </Space>
            </Form>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
