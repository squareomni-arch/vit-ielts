import { useEffect, useState } from "react";
import { Button, Input, Form, Card, Space, Collapse, message } from "antd";
import type { TestimonialsConfig } from "@/shared/types/admin-config";
import AdminLayout from "../_layout";
import { ImageUpload } from "@/shared/ui/image-upload";
import { withAdmin } from "@/shared/hoc/withAdmin";

const { Panel } = Collapse;
const { TextArea } = Input;

function TestimonialsPage() {
  const [config, setConfig] = useState<TestimonialsConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/home/testimonials");
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

      const res = await fetch("/api/admin/home/testimonials", {
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
              Manage Testimonials (What Our Learners Say)
            </h1>
          </div>
        }
      >
        <Form form={form} layout="vertical" initialValues={config}>
          <Collapse defaultActiveKey={["intro", "testimonials"]}>
            {/* Intro Section */}
            <Panel header="Introduction" key="intro">
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Please enter title" }]}
              >
                <Input placeholder="What Our Learners Say" />
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
                  placeholder="Learning communicate to global world and build a bright future with our histudy."
                />
              </Form.Item>
              <Form.Item
                name={["button", "text"]}
                label="Button Text"
                rules={[
                  { required: true, message: "Please enter button text" },
                ]}
              >
                <Input placeholder="Marquee Y" />
              </Form.Item>
              <Form.Item
                name={["button", "link"]}
                label="Button Link"
                rules={[
                  { required: true, message: "Please enter button link" },
                ]}
              >
                <Input placeholder="#" />
              </Form.Item>
            </Panel>

            {/* Testimonials Section */}
            <Panel header="Testimonials" key="testimonials">
              <Form.List name="testimonials">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <Card
                        key={field.key}
                        size="small"
                        title={`Testimonial ${index + 1}`}
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
                          <Input placeholder="Martha Maldonado" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "title"]}
                          label="Title"
                          rules={[
                            { required: true, message: "Please enter title" },
                          ]}
                        >
                          <Input placeholder="Executive Chairman" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "company"]}
                          label="Company"
                          rules={[
                            {
                              required: true,
                              message: "Please enter company",
                            },
                          ]}
                        >
                          <Input placeholder="@ Google" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "quote"]}
                          label="Quote"
                          rules={[
                            { required: true, message: "Please enter quote" },
                          ]}
                        >
                          <TextArea
                            rows={4}
                            placeholder="After the launch, vulputate at sapien sit amet, auctor iaculis lorem. In vel hend rerit nisi. Vestibulum eget risus velit."
                          />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "avatar"]}
                          label="Avatar Image"
                          rules={[
                            {
                              required: true,
                              message: "Please upload avatar",
                            },
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
                      + Add Testimonial
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

export default TestimonialsPage;

export const getServerSideProps = withAdmin;
