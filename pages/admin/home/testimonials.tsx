import { useEffect, useState } from "react";
import { Button, Input, InputNumber, Form, Card, message } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { ImageUpload } from "@/shared/ui/image-upload";
import type { TestimonialsConfig } from "@/pages/home/ui/testimonials/types";

function TestimonialsPage() {
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<TestimonialsConfig>();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/home/testimonials");
        if (res.ok) {
          const data = await res.json();
          if (data) form.setFieldsValue(data);
        }
      } catch {
        message.error("Error loading config");
      }
    };
    fetchConfig();
  }, [form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await fetch("/api/admin/home/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        message.success("Đã lưu thành công!");
      } else {
        const err = await res.json();
        message.error(err.message || "Lưu thất bại");
      }
    } catch {
      message.error("Vui lòng kiểm tra lại các trường bắt buộc");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>💬 Testimonials / Phản hồi học viên</h2>
          <Button type="primary" onClick={handleSave} loading={saving}>
            💾 Lưu thay đổi
          </Button>
        </div>

        <Form form={form} layout="vertical" autoComplete="off">
          {/* ── Section Content ── */}
          <Card title="📝 Nội dung section" size="small" style={{ marginBottom: 16 }}>
            <Form.Item label="Tiêu đề" name="title" rules={[{ required: true }]}>
              <Input placeholder="Phản hồi từ học viên" />
            </Form.Item>
            <Form.Item label="Mô tả" name="description" rules={[{ required: true }]}>
              <Input.TextArea rows={3} placeholder="Trải nghiệm thực tế từ học viên..." />
            </Form.Item>
          </Card>

          {/* ── CTA ── */}
          <Card title="🔗 Nút CTA" size="small" style={{ marginBottom: 16 }}>
            <Form.Item label="Text" name={["cta", "text"]} rules={[{ required: true }]}>
              <Input placeholder="Xem Thêm Phản Hồi" />
            </Form.Item>
            <Form.Item label="Link" name={["cta", "link"]} rules={[{ required: true }]}>
              <Input placeholder="/subscription" />
            </Form.Item>
          </Card>

          {/* ── Reviews ── */}
          <Card
            title="⭐ Danh sách review"
            size="small"
            style={{ marginBottom: 16 }}
            extra={<span style={{ color: "#888" }}>Nên có 15 reviews (5/cột × 3 cột)</span>}
          >
            <Form.List name="reviews">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card
                      key={key}
                      size="small"
                      type="inner"
                      title={`Review #${name + 1}`}
                      extra={<MinusCircleOutlined onClick={() => remove(name)} style={{ color: "red" }} />}
                      style={{ marginBottom: 12 }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Form.Item {...restField} name={[name, "name"]} label="Tên" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                          <Input placeholder="Nguyễn Thị Lan" />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, "score"]} label="Điểm IELTS" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                          <Input placeholder="IELTS 7.0" />
                        </Form.Item>
                      </div>

                      {/* Avatar — upload + preview */}
                      <Form.Item {...restField} name={[name, "avatar"]} label="Avatar" valuePropName="value" style={{ marginBottom: 8 }}>
                        <ImageUpload label="" />
                      </Form.Item>

                      <Form.Item {...restField} name={[name, "review"]} label="Nội dung review" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                        <Input.TextArea rows={2} placeholder="Giao diện thi rất giống thi thật..." />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "rating"]} label="Rating (1-5)" initialValue={5} style={{ marginBottom: 0 }}>
                        <InputNumber min={1} max={5} />
                      </Form.Item>
                    </Card>
                  ))}
                  <Button type="dashed" onClick={() => add({ rating: 5 })} block icon={<PlusOutlined />}>
                    Thêm review
                  </Button>
                </>
              )}
            </Form.List>
          </Card>
        </Form>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdmin;
export default TestimonialsPage;
