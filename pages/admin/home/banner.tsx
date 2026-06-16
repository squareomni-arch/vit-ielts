import { useEffect, useState } from "react";
import { Button, Input, Form, Card, Space, message } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { ImageUpload } from "@/shared/ui/image-upload";
import type { HeroBannerConfig } from "@/pages/home/ui/hero-banner/types";

function HeroBannerPage() {
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<HeroBannerConfig>();

  // ─── Fetch config on mount ──────────────────────────────────────────
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/home/hero-banner");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            form.setFieldsValue(data);
          }
        }
      } catch {
        message.error("Error loading config");
      }
    };
    fetchConfig();
  }, [form]);

  // ─── Save ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await fetch("/api/admin/home/hero-banner", {
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
    } catch (error) {
      message.error("Vui lòng kiểm tra lại các trường bắt buộc");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>🏠 Hero Banner — Homepage</h2>
          <Button type="primary" onClick={handleSave} loading={saving}>
            💾 Lưu thay đổi
          </Button>
        </div>

        <Form form={form} layout="vertical" autoComplete="off">
          {/* ── Title ── */}
          <Card title="📝 Tiêu đề" size="small" style={{ marginBottom: 16 }}>
            <Form.Item label="Dòng 1 (in đậm)" name={["title", "line1"]} rules={[{ required: true }]}>
              <Input placeholder="Vit IELTS" />
            </Form.Item>
            <Form.Item label="Dòng 2 (prefix)" name={["title", "line2"]} rules={[{ required: true }]}>
              <Input placeholder="Thi" />
            </Form.Item>
            <Form.Item label="Highlight (màu đỏ)" name={["title", "highlight"]} rules={[{ required: true }]}>
              <Input placeholder="Thử Như Thật" />
            </Form.Item>
            <div style={{ background: "var(--admin-surface-hover)", padding: 12, borderRadius: 8, marginTop: 8 }}>
              <strong>Preview:</strong>{" "}
              <span style={{ fontSize: 18, fontWeight: 700 }}>
                {Form.useWatch(["title", "line1"], form) || "Vit IELTS"}
              </span>
              <br />
              <span style={{ fontSize: 18, fontWeight: 700 }}>
                {Form.useWatch(["title", "line2"], form) || "Thi"}{" "}
                <span style={{ color: "#D94A56" }}>
                  {Form.useWatch(["title", "highlight"], form) || "Thử Như Thật"}
                </span>
              </span>
            </div>
          </Card>

          {/* ── Subtitle ── */}
          <Card title="📋 Mô tả" size="small" style={{ marginBottom: 16 }}>
            <Form.Item label="Subtitle" name="subtitle" rules={[{ required: true }]}>
              <Input.TextArea
                rows={3}
                placeholder="Thi thử như thật với giao diện 1:1 và kho đề sát thực tế..."
              />
            </Form.Item>
          </Card>

          {/* ── Checklist ── */}
          <Card title="✅ Checklist (điểm nổi bật)" size="small" style={{ marginBottom: 16 }}>
            <Form.List name="checklist">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: "flex", marginBottom: 8, width: "100%" }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={name}
                        rules={[{ required: true, message: "Nhập nội dung" }]}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <Input placeholder="Giao diện thi máy" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ color: "red" }} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm mục
                  </Button>
                </>
              )}
            </Form.List>
          </Card>

          {/* ── CTA Button ── */}
          <Card title="🔗 Nút CTA" size="small" style={{ marginBottom: 16 }}>
            <Form.Item label="Text" name={["cta", "text"]} rules={[{ required: true }]}>
              <Input placeholder="Khám phá ngay" />
            </Form.Item>
            <Form.Item label="Link" name={["cta", "link"]} rules={[{ required: true }]}>
              <Input placeholder="/ielts-practice-library" />
            </Form.Item>
          </Card>

          {/* ── Images ── */}
          <Card title="🖼️ Hình ảnh" size="small" style={{ marginBottom: 16 }}>
            <Form.Item label="Screen image (máy tính)" name={["images", "screen"]} valuePropName="value">
              <ImageUpload label="" />
            </Form.Item>
            <Form.Item label="Mascot image (con vịt)" name={["images", "mascot"]} valuePropName="value">
              <ImageUpload label="" />
            </Form.Item>
          </Card>
        </Form>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdmin;
export default HeroBannerPage;
