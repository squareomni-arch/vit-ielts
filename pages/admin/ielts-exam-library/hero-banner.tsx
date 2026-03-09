import { useEffect, useState } from "react";
import { Button, Input, Form, Card, Space, Collapse, message } from "antd";
import type { ExamLibraryHeroConfig } from "@/shared/types/admin-config";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";

const { Panel } = Collapse;

function ExamLibraryHeroBannerPage() {
  const [config, setConfig] = useState<ExamLibraryHeroConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/ielts-exam-library/hero-banner");
      if (!res.ok) throw new Error("Failed to load config");
      const data = await res.json();
      setConfig(data);
      form.setFieldsValue(data);
    } catch {
      message.error("Error loading config");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const res = await fetch("/api/admin/ielts-exam-library/hero-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Save failed");

      message.success("Config saved successfully");
      setConfig(values);
    } catch {
      message.error("Error saving config");
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading config...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Card
        title={
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold m-0">
              Manage IELTS Exam Library Hero
            </h1>
          </div>
        }
      >
        <Form form={form} layout="vertical" initialValues={config}>
          <Collapse defaultActiveKey={["hero", "background"]}>
            <Panel header="Hero Banner" key="hero">
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Please enter title" }]}
              >
                <Input placeholder="IELTS Exam Library" />
              </Form.Item>
              <Form.Item
                name={["breadcrumb", "homeLabel"]}
                label="Breadcrumb Home Label"
                rules={[
                  { required: true, message: "Please enter breadcrumb home" },
                ]}
              >
                <Input placeholder="Home" />
              </Form.Item>
              <Form.Item
                name={["breadcrumb", "currentLabel"]}
                label="Breadcrumb Current Label"
                rules={[
                  {
                    required: true,
                    message: "Please enter breadcrumb current",
                  },
                ]}
              >
                <Input placeholder="IELTS Exam Library" />
              </Form.Item>
            </Panel>
            <Panel header="Background" key="background">
              <Form.Item
                name="backgroundColor"
                label="Background Color/Gradient"
                rules={[
                  { required: true, message: "Please enter background color" },
                ]}
                extra="Ví dụ: linear-gradient(rgb(255, 255, 255) 0%, rgb(239, 241, 255) 100%) hoặc #ffffff"
              >
                <Input placeholder="linear-gradient(rgb(255, 255, 255) 0%, rgb(239, 241, 255) 100%)" />
              </Form.Item>
            </Panel>
          </Collapse>

          <Space className="mt-6 w-full justify-end">
            <Button
              type="primary"
              onClick={handleSave}
              loading={saving}
              size="large"
            >
              Save changes
            </Button>
          </Space>
        </Form>
      </Card>
    </AdminLayout>
  );
}

export default ExamLibraryHeroBannerPage;

export const getServerSideProps = withAdmin;


