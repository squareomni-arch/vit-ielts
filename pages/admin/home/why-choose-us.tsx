import { useEffect, useState } from "react";
import { Button, Input, Form, Card, Space, Collapse, message } from "antd";
import type { WhyChooseUsConfig } from "@/shared/types/admin-config";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";

const { Panel } = Collapse;
const { TextArea } = Input;

function WhyChooseUsPage() {
  const [config, setConfig] = useState<WhyChooseUsConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/home/why-choose-us");
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

      const res = await fetch("/api/admin/home/why-choose-us", {
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
            <h1 className="text-2xl font-bold m-0">Manage Why Choose Us</h1>
          </div>
        }
      >
        <Form form={form} layout="vertical" initialValues={config}>
          <Collapse
            defaultActiveKey={["badge", "title", "description", "statistics"]}
          >
            {/* Badge Section */}
            <Panel header="Badge" key="badge">
              <Form.Item
                name={["badge", "text"]}
                label="Badge Text"
                rules={[
                  { required: true, message: "Please enter badge text" },
                ]}
              >
                <Input placeholder="Why Choose Us" />
              </Form.Item>
            </Panel>

            {/* Title Section */}
            <Panel header="Title" key="title">
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Please enter title" }]}
              >
                <Input placeholder="Creating A Community Of Life Long Learners." />
              </Form.Item>
            </Panel>

            {/* Description Section */}
            <Panel header="Description" key="description">
              <Form.Item
                name="description"
                label="Description"
                rules={[
                  { required: true, message: "Please enter description" },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="There are many variations of passages of the Ipsum available, but the majority have suffered alteration in some form, by injected humour."
                />
              </Form.Item>
            </Panel>

            {/* Statistics Section */}
            <Panel header="Statistics" key="statistics">
              <Form.List name="statistics">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <Card
                        key={field.key}
                        size="small"
                        title={`Statistic ${index + 1}`}
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
                          name={[field.name, "icon"]}
                          label="Icon (Material Symbol)"
                          rules={[
                            { required: true, message: "Please enter icon" },
                          ]}
                        >
                          <Input placeholder="favorite" />
                          <p className="text-xs text-gray-500 mt-1">
                            Icon name from Material Symbols (e.g., favorite,
                            show_chart, cast, map)
                          </p>
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "value"]}
                          label="Value"
                          rules={[
                            { required: true, message: "Please enter value" },
                          ]}
                        >
                          <Input placeholder="500+" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "label"]}
                          label="Label"
                          rules={[
                            { required: true, message: "Please enter label" },
                          ]}
                        >
                          <Input placeholder="Learners & counting" />
                        </Form.Item>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      className="w-full"
                    >
                      + Add Statistic
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

export default WhyChooseUsPage;

export const getServerSideProps = withAdmin;
