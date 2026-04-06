import { useEffect, useState } from "react";
import { Button, Input, Form, Card, Space, message } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { ImageUpload } from "@/shared/ui/image-upload";
import type { WhyChooseUsConfig } from "@/pages/home/ui/why-choose-us/types";

function WhyChooseUsPage() {
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<WhyChooseUsConfig>();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/home/why-choose-us");
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
      const res = await fetch("/api/admin/home/why-choose-us", {
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
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>🏆 Why Choose Us</h2>
          <Button type="primary" onClick={handleSave} loading={saving}>
            💾 Lưu thay đổi
          </Button>
        </div>

        <Form form={form} layout="vertical" autoComplete="off">
          {/* ── Badge & Content ── */}
          <Card title="📝 Nội dung chính" size="small" style={{ marginBottom: 16 }}>
            <Form.Item label="Badge text" name="badge" rules={[{ required: true }]}>
              <Input placeholder="Tại sao chọn chúng tôi?" />
            </Form.Item>
            <Form.Item label="Title" name="title" rules={[{ required: true }]}>
              <Input placeholder="Luyện thi IELTS Trên Giao Diện Thi Thật" />
            </Form.Item>
            <Form.Item label="Description" name="description" rules={[{ required: true }]}>
              <Input.TextArea rows={4} placeholder="IPT cung cấp bộ đề thi thật..." />
            </Form.Item>
          </Card>

          {/* ── Stat Cards ── */}
          <Card title="📊 Thống kê (4 card)" size="small" style={{ marginBottom: 16 }}>
            <p style={{ color: "#888", marginBottom: 12 }}>
              Thứ tự: 2 card bên trái, 2 card bên phải. Tổng nên giữ 4 card.
            </p>
            <Form.List name="stats">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card
                      key={key}
                      size="small"
                      type="inner"
                      title={`Card ${name + 1} (${name < 2 ? "Trái" : "Phải"})`}
                      extra={<MinusCircleOutlined onClick={() => remove(name)} style={{ color: "red" }} />}
                      style={{ marginBottom: 12 }}
                    >
                      <Space direction="vertical" style={{ width: "100%" }}>
                        {/* Icon SVG — upload + preview */}
                        <Form.Item {...restField} name={[name, "icon"]} label="Icon SVG" valuePropName="value">
                          <ImageUpload label="" />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, "number"]} label="Số liệu" rules={[{ required: true }]}>
                          <Input placeholder="5,000+" />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, "label"]} label="Label" rules={[{ required: true }]}>
                          <Input placeholder="HỌC VIÊN YÊU THÍCH" />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, "bgColor"]} label="Màu nền hover (hex)">
                          <Input placeholder="#D94A56" />
                        </Form.Item>
                      </Space>
                    </Card>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm stat card
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
export default WhyChooseUsPage;
