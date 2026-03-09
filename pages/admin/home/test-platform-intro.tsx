import { useEffect, useState } from "react";
import { Button, Input, Form, Card, Space, Collapse, message } from "antd";
import type { TestPlatformIntroConfig } from "@/shared/types/admin-config";
import { ImageUpload } from "@/shared/ui/image-upload";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";

const { Panel } = Collapse;

function TestPlatformIntroPage() {
  const [config, setConfig] = useState<TestPlatformIntroConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/home/test-platform-intro");
      if (!res.ok) throw new Error("Failed to load config");
      const data = await res.json();
      setConfig(data);
      
      // Chỉ set form values lần đầu tiên khi load
      if (!isFormInitialized) {
        form.setFieldsValue(data);
        setIsFormInitialized(true);
      }
    } catch {
      message.error("Error loading config");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const res = await fetch("/api/admin/home/test-platform-intro", {
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
              Manage Test Platform Intro
            </h1>
          </div>
        }
      >
        <Form 
          form={form} 
          layout="vertical" 
          preserve={true}
          validateTrigger="onBlur"
        >
          <Collapse defaultActiveKey={["badge", "background", "title", "categories"]}>
            {/* Badge Section */}
            <Panel header="Badge" key="badge">
              <Form.Item
                name={["badge", "text"]}
                label="Badge Text"
                rules={[
                  { required: true, message: "Please enter badge text" },
                ]}
              >
                <Input placeholder="CATEGORIES" />
              </Form.Item>
            </Panel>

            {/* Background Section */}
            <Panel header="Background" key="background">
              <Form.Item
                name="backgroundGradient"
                label="Background Gradient"
                rules={[
                  { required: true, message: "Please enter background gradient" },
                ]}
                extra="Ví dụ: linear-gradient(180deg, #FB64AD 0%, #C586EE 100%)"
              >
                <Input placeholder="linear-gradient(180deg, #FB64AD 0%, #C586EE 100%)" />
              </Form.Item>
            </Panel>

            {/* Title Section */}
            <Panel header="Title" key="title">
              <Form.Item
                name={["title", "line1"]}
                label="Line 1"
                preserve={true}
                validateTrigger="onBlur"
                rules={[{ required: true, message: "Please enter line 1" }]}
              >
                <Input placeholder="Explore Top Courses Caterories" />
              </Form.Item>
              <Form.Item
                name={["title", "line2"]}
                label="Line 2"
                preserve={true}
                validateTrigger="onBlur"
                rules={[{ required: true, message: "Please enter line 2" }]}
              >
                <Input placeholder="That" />
              </Form.Item>
              <Form.Item
                name={["title", "line3"]}
                label="Line 3"
                preserve={true}
                validateTrigger="onBlur"
                rules={[{ required: true, message: "Please enter line 3" }]}
              >
                <Input placeholder="Change" />
              </Form.Item>
              <Form.Item
                name={["title", "line4"]}
                label="Line 4"
                preserve={true}
                validateTrigger="onBlur"
                rules={[{ required: true, message: "Please enter line 4" }]}
              >
                <Input placeholder="Yourself" />
              </Form.Item>
            </Panel>

            {/* Categories Section */}
            <Panel header="Categories" key="categories">
              <Form.List name="categories">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <Card
                        key={field.key}
                        size="small"
                        title={`Category ${index + 1}`}
                        className="mb-4"
                        extra={
                          <Button
                            type="link"
                            danger
                            onClick={() => remove(field.name)}
                          >
                            Delete
                          </Button>
                        }
                      >
                        <Form.Item
                          name={[field.name, "name"]}
                          label="Name"
                          rules={[
                            { required: true, message: "Please enter name" },
                          ]}
                        >
                          <Input placeholder="FULL TEST" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "href"]}
                          label="Link"
                          rules={[
                            { required: true, message: "Please enter link" },
                          ]}
                        >
                          <Input placeholder="/ielts-exam-library" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "icon"]}
                          label="Icon"
                          rules={[
                            { required: true, message: "Please upload icon" },
                          ]}
                        >
                          <ImageUpload />
                        </Form.Item>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      className="w-full"
                    >
                      + Add Category
                    </Button>
                  </>
                )}
              </Form.List>
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

export default TestPlatformIntroPage;

export const getServerSideProps = withAdmin;
