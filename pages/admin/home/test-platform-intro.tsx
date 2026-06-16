import { useEffect, useState } from "react";
import { Button, Input, Form, Card, message } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { ImageUpload } from "@/shared/ui/image-upload";
import { InactiveSectionNotice } from "@/shared/ui/admin/inactive-section-notice";
import type { TestPlatformIntroConfig } from "@/pages/home/ui/ielts-test-platform-intro/types";

function TestPlatformIntroPage() {
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<TestPlatformIntroConfig>();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/home/test-platform-intro");
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
      const res = await fetch("/api/admin/home/test-platform-intro", {
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
      <InactiveSectionNotice />
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>📦 Test Platform Intro</h2>
          <Button type="primary" onClick={handleSave} loading={saving}>
            💾 Lưu thay đổi
          </Button>
        </div>

        <Form form={form} layout="vertical" autoComplete="off">
          {/* ── Badge & Title ── */}
          <Card title="📝 Badge & Tiêu đề" size="small" style={{ marginBottom: 16 }}>
            <Form.Item label="Badge text" name="badge" rules={[{ required: true }]}>
              <Input placeholder="PREMIUM" />
            </Form.Item>
            <Form.Item label="Title" name="title" rules={[{ required: true }]}>
              <Input placeholder="Khám Phá Kho Đề" />
            </Form.Item>
            <Form.Item label="Title Highlight (màu đỏ)" name="titleHighlight" rules={[{ required: true }]}>
              <Input placeholder="Dự Đoán" />
            </Form.Item>
          </Card>

          {/* ── Category Cards ── */}
          <Card title="🃏 Category Cards" size="small" style={{ marginBottom: 16 }}>
            <Form.List name="cards">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card
                      key={key}
                      size="small"
                      type="inner"
                      title={`Card ${name + 1}`}
                      extra={<MinusCircleOutlined onClick={() => remove(name)} style={{ color: "red" }} />}
                      style={{ marginBottom: 12 }}
                    >
                      <Form.Item {...restField} name={[name, "title"]} label="Title" rules={[{ required: true }]}>
                        <Input placeholder="IELTS Full Test" />
                      </Form.Item>

                      {/* Icon SVG — upload + preview */}
                      <Form.Item {...restField} name={[name, "icon"]} label="Icon (SVG)" valuePropName="value">
                        <ImageUpload label="" />
                      </Form.Item>

                      {/* Background image — upload + preview */}
                      <Form.Item {...restField} name={[name, "bg"]} label="Background image" valuePropName="value">
                        <ImageUpload label="" />
                      </Form.Item>

                      <Form.Item {...restField} name={[name, "color"]} label="Gradient classes">
                        <Input placeholder="from-rose-600 to-rose-500" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "href"]} label="Link">
                        <Input placeholder="/ielts-exam-library" />
                      </Form.Item>
                    </Card>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm card
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
export default TestPlatformIntroPage;
