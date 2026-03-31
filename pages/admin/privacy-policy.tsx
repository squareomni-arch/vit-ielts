import { useEffect, useState } from "react";
import { Button, Input, Form, Card, Space, Collapse, message } from "antd";
import type { PrivacyPolicyConfig } from "@/shared/types/admin-config";
import AdminLayout from "./_layout";
import { ImageUpload } from "@/shared/ui/image-upload";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { withAdmin } from "@/shared/hoc/withAdmin";

const { Panel } = Collapse;
const { TextArea } = Input;

function PrivacyPolicyPage() {
  const [config, setConfig] = useState<PrivacyPolicyConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/privacy-policy");
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

      const res = await fetch("/api/admin/privacy-policy", {
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
            <h1 className="text-2xl font-bold m-0">Manage Privacy Policy</h1>
          </div>
        }
      >
        <Form form={form} layout="vertical" initialValues={config}>
          <Collapse defaultActiveKey={["banner", "content"]}>
            {/* Banner Section */}
            <Panel header="Banner Section" key="banner">
              <Form.Item
                name={["banner", "title"]}
                label="Title"
                rules={[{ required: true, message: "Please enter title" }]}
              >
                <Input placeholder="Privacy Policy" />
              </Form.Item>
              <Form.Item
                name={["banner", "subtitle"]}
                label="Subtitle"
                rules={[{ required: true, message: "Please enter subtitle" }]}
              >
                <Input placeholder="IELTS Prediction Privacy Policy Here" />
              </Form.Item>
              <Form.Item
                name={["banner", "backgroundImage"]}
                label="Background Image URL"
                rules={[{ required: true, message: "Please enter background image URL" }]}
              >
                <ImageUpload />
              </Form.Item>
            </Panel>

            {/* Hero Image Section */}
            <Panel header="Hero Image" key="hero">
              <Form.Item
                name="heroImage"
                label="Hero Image URL"
                rules={[{ required: true, message: "Please enter hero image URL" }]}
              >
                <ImageUpload />
              </Form.Item>
            </Panel>

            {/* Content Section */}
            <Panel header="Content" key="content">
              <Form.Item
                name={["content", "introTitle"]}
                label="Introduction Title"
                rules={[{ required: true, message: "Please enter introduction title" }]}
              >
                <Input placeholder="Welcome to IELTS Prediction Privacy Policy" />
              </Form.Item>

              <Form.Item
                label="Introduction Paragraphs"
                name={["content", "introParagraphs"]}
                rules={[{ required: true, message: "Please add at least one paragraph" }]}
              >
                <Form.List name={["content", "introParagraphs"]}>
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <div key={key} style={{ display: "flex", gap: 8, marginBottom: 16, width: "100%" }}>
                          <Form.Item
                            {...restField}
                            name={name}
                            rules={[{ required: true, message: "Missing paragraph" }]}
                            style={{ flex: 1, marginBottom: 0 }}
                          >
                            <TextArea rows={3} placeholder="Enter paragraph text..." style={{ width: "100%" }} />
                          </Form.Item>
                          <Button
                            type="text"
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(name)}
                            style={{ flexShrink: 0, alignSelf: "flex-start", marginTop: 4 }}
                          />
                        </div>
                      ))}
                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                          Add Paragraph
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </Form.Item>

              <Form.Item
                label="Content Sections"
                name={["content", "sections"]}
                rules={[{ required: true, message: "Please add at least one section" }]}
              >
                <Form.List name={["content", "sections"]}>
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Card
                          key={key}
                          size="small"
                          title={`Section ${name + 1}`}
                          style={{ marginBottom: 16 }}
                          extra={
                            <Button
                              type="text"
                              danger
                              icon={<MinusCircleOutlined />}
                              onClick={() => remove(name)}
                            >
                              Remove
                            </Button>
                          }
                        >
                          <Form.Item
                            {...restField}
                            name={[name, "title"]}
                            label="Section Title"
                            rules={[{ required: true, message: "Missing section title" }]}
                          >
                            <Input placeholder="Section title..." />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, "content"]}
                            label="Section Content"
                            rules={[{ required: true, message: "Missing section content" }]}
                          >
                            <TextArea rows={4} placeholder="Section content..." style={{ width: "100%" }} />
                          </Form.Item>
                        </Card>
                      ))}
                      <Form.Item>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                          Add Section
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
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

export default PrivacyPolicyPage;

export const getServerSideProps = withAdmin;

