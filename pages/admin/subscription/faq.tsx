import { useEffect, useState } from "react";
import { Button, Input, Form, Card, Space, Collapse, message } from "antd";
import type { FAQConfig } from "@/shared/types/admin-config";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";

const { Panel } = Collapse;
const { TextArea } = Input;

function FAQPage() {
  const [config, setConfig] = useState<FAQConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/subscription/faq");
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

      const res = await fetch("/api/admin/subscription/faq", {
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
              Manage FAQ (Subscription Page)
            </h1>
          </div>
        }
      >
        <Form form={form} layout="vertical" initialValues={config}>
          <Collapse defaultActiveKey={["intro", "items"]}>
            {/* Intro Section */}
            <Panel header="Introduction" key="intro">
              <Form.Item
                name={["badge", "text"]}
                label="Badge Text"
                rules={[
                  { required: true, message: "Please enter badge text" },
                ]}
              >
                <Input placeholder="FREQUENTLY ASKED QUESTIONS" />
              </Form.Item>
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Please enter title" }]}
              >
                <Input placeholder="Have a Question with Histudy University?" />
              </Form.Item>
              <Form.Item
                name="description"
                label="Description"
                rules={[
                  { required: true, message: "Please enter description" },
                ]}
              >
                <TextArea
                  rows={3}
                  placeholder="Its an educational platform Lorem Ipsum is simply dummy text of the printing and typesetting industry."
                />
              </Form.Item>
            </Panel>

            {/* FAQ Items Section */}
            <Panel header="FAQ Items" key="items">
              <Form.List name="items">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <Card
                        key={field.key}
                        size="small"
                        title={`FAQ Item ${index + 1}`}
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
                          name={[field.name, "question"]}
                          label="Question"
                          rules={[
                            {
                              required: true,
                              message: "Please enter question",
                            },
                          ]}
                        >
                          <Input placeholder="What is Histudy ? How does it work?" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "answer"]}
                          label="Answer"
                          rules={[
                            { required: true, message: "Please enter answer" },
                          ]}
                        >
                          <TextArea
                            rows={4}
                            placeholder="Histudy is an educational platform designed to help students learn and grow..."
                          />
                        </Form.Item>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      className="w-full"
                    >
                      + Add FAQ Item
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

export default FAQPage;

export const getServerSideProps = withAdmin;

