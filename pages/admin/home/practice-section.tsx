import { useEffect, useState } from "react";
import { Button, Input, Form, Card, Space, Collapse, message } from "antd";
import type { PracticeSectionConfig } from "@/shared/types/admin-config";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";

const { Panel } = Collapse;

function PracticeSectionPage() {
  const [config, setConfig] = useState<PracticeSectionConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/home/practice-section");
      if (!res.ok) throw new Error("Failed to load config");
      const data = await res.json();
      setConfig(data);
      form.setFielValue(data);
    } catch {
      message.error("Error loading config");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const res = await fetch("/api/admin/home/practice-section", {
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
              Manage Practice Section Background
            </h1>
          </div>
        }
      >
        <Form form={form} layout="vertical" initialValues={config}>
          <Collapse defaultActiveKey={["background"]}>
            {/* Background Section */}
            <Panel header="Background Gradient" key="background">
              <Form.Item
                name="backgroundGradient"
                label="Background Gradient"
                rules={[
                  { required: true, message: "Please enter background gradient" },
                ]}
                extra="Ví dụ: linear-gradient(180deg, #FF6B6B 0%, #FF8C42 100%)"
              >
                <Input placeholder="linear-gradient(180deg, #FF6B6B 0%, #FF8C42 100%)" />
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

export default PracticeSectionPage;

export const getServerSideProps = withAdmin;

