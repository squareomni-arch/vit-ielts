import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Form,
  Card,
  Space,
  Collapse,
  message,
  Divider,
} from "antd";
import type { SubscriptionBannerConfig } from "@/shared/types/admin-config";
import { ImageUpload } from "@/shared/ui/image-upload";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";

const { Panel } = Collapse;

function SubscriptionBannerPage() {
  const [config, setConfig] = useState<SubscriptionBannerConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cập nhật form khi config thay đổi
  useEffect(() => {
    if (config) {
      form.setFieldsValue(config);
    }
  }, [config, form]);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/subscription/banner");
      if (!res.ok) throw new Error("Failed to load config");
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      console.error("Error fetching config:", error);
      message.error("Error loading config");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const configData: SubscriptionBannerConfig = {
        backgroundImage: values.backgroundImage,
        subtitle: {
          text: values.subtitle.text,
        },
        title: values.title,
        description: values.description,
      };

      const res = await fetch("/api/admin/subscription/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });

      if (!res.ok) throw new Error("Save failed");

      message.success("Config saved successfully");
      await fetchConfig();
    } catch (error) {
      console.error("Error saving config:", error);
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
            <h1 className="text-2xl font-bold m-0">Manage Subscription Banner</h1>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Collapse defaultActiveKey={["banner"]}>
            <Panel header="Banner Settings" key="banner">
              <Form.Item
                name="backgroundImage"
                label="Background Image URL"
                rules={[
                  { required: true, message: "Please enter background image URL" },
                ]}
              >
                <ImageUpload
                  value={form.getFieldValue("backgroundImage")}
                  onChange={(url) => form.setFieldValue("backgroundImage", url)}
                />
              </Form.Item>

              <Divider orientation="left">Subtitle</Divider>
              <Form.Item
                name={["subtitle", "text"]}
                label="Subtitle Text"
                rules={[
                  { required: true, message: "Please enter subtitle text" },
                ]}
              >
                <Input placeholder="Choose Your Plan" />
              </Form.Item>

              <Divider orientation="left">Content</Divider>
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Please enter title" }]}
              >
                <Input placeholder="Upgrade to Pro Account" />
              </Form.Item>
              <Form.Item
                name="description"
                label="Description"
                rules={[
                  { required: true, message: "Please enter description" },
                ]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Unlock premium features and access to exclusive IELTS practice materials. Get the most out of your IELTS preparation journey."
                />
              </Form.Item>
            </Panel>
          </Collapse>
        </Form>
      </Card>
      <Space className="mt-6 w-full justify-end">
        <Button onClick={fetchConfig}>Reload</Button>
        <Button
          type="primary"
          loading={saving}
          onClick={handleSave}
          size="large"
        >
          Save changes
        </Button>
      </Space>
    </AdminLayout>
  );
}

export default SubscriptionBannerPage;

export const getServerSideProps = withAdmin;

