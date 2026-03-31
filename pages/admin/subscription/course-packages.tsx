import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Collapse,
  Form,
  Input,
  InputNumber,
  message,
  Space,
  Switch,
  Divider,
} from "antd";
import type { CoursePackagesConfig } from "@/shared/types/admin-config";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";

const { Panel } = Collapse;

export default function CoursePackagesPage() {
  const [config, setConfig] = useState<CoursePackagesConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/subscription/course-packages");
      if (!res.ok) throw new Error("Failed to load config");
      const data = (await res.json()) as CoursePackagesConfig;
      setConfig(data);
      form.setFielValue(data);
    } catch {
      message.error("Error loading config");
    }
  };

  const handleSave = async () => {
    try {
      const values = (await form.validateFields()) as CoursePackagesConfig;
      setSaving(true);

      const res = await fetch("/api/admin/subscription/course-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Save failed");

      message.success("Config saved successfully");
      setConfig(values);
    } catch (error) {
      console.error(error);
      message.error("Error saving config");
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12 text-gray-600">
          Loading config...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Card
        title={
          <h1 className="text-2xl font-bold m-0">Manage Course Packages</h1>
        }
      >
        <Form form={form} layout="vertical" initialValues={config}>
          <Collapse defaultActiveKey={["general", "texts", "combo", "single"]}>
            <Panel header="General" key="general">
              <Form.Item
                name="currencySuffix"
                label="Currency Suffix"
                tooltip="Shown after the numeric price (e.g., đ)"
                rules={[
                  { required: true, message: "Please enter a currency suffix" },
                ]}
              >
                <Input placeholder="đ" />
              </Form.Item>
            </Panel>

            <Panel header="Texts & Labels" key="texts">
              <Form.Item
                name="popularBadgeText"
                label="Popular Badge Text"
                rules={[
                  {
                    required: true,
                    message: "Please enter popular badge text",
                  },
                ]}
              >
                <Input placeholder="POPULAR" />
              </Form.Item>

              <Form.Item
                name="priceSuffix"
                label="Price Suffix"
                rules={[
                  { required: true, message: "Please enter price suffix" },
                ]}
              >
                <Input placeholder="/Monthly" />
              </Form.Item>

              <Divider orientation="left">Month Text</Divider>
              <Space align="start" className="w-full" wrap>
                <Form.Item
                  name={["monthText", "singular"]}
                  label="Singular (Month)"
                  rules={[
                    { required: true, message: "Please enter singular form" },
                  ]}
                >
                  <Input placeholder="Month" />
                </Form.Item>
                <Form.Item
                  name={["monthText", "plural"]}
                  label="Plural (Months)"
                  rules={[
                    { required: true, message: "Please enter plural form" },
                  ]}
                >
                  <Input placeholder="Months" />
                </Form.Item>
              </Space>

              <Form.Item
                name="accessText"
                label="Access Text"
                rules={[
                  { required: true, message: "Please enter access text" },
                ]}
              >
                <Input placeholder="Access" />
              </Form.Item>

              <Form.Item
                name="dealNoteTemplate"
                label="Deal Note Template"
                rules={[
                  {
                    required: true,
                    message: "Please enter deal note template",
                  },
                ]}
              >
                <Input placeholder="SAME PRICE AS THE SHORTER PLAN" />
              </Form.Item>

              <Divider orientation="left">Features</Divider>
              <Form.List name={["features", "included"]}>
                {(fields, { add, remove }) => (
                  <Space direction="vertical" className="w-full">
                    <div className="font-semibold text-gray-700">
                      Included Features
                    </div>
                    {fields.map((field) => (
                      <Space key={field.key} align="center" className="w-full">
                        <Form.Item
                          {...field}
                          name={field.name}

                          rules={[
                            { required: true, message: "Enter feature text" },
                          ]}
                          className="flex-1 mb-0"
                        >
                          <Input placeholder="Unlimited Access Courses" />
                        </Form.Item>
                        <Button danger onClick={() => remove(field.name)}>
                          Remove
                        </Button>
                      </Space>
                    ))}
                    <Button type="dashed" onClick={() => add()} block>
                      Add Included Feature
                    </Button>
                  </Space>
                )}
              </Form.List>

              <Form.List name={["features", "excluded"]}>
                {(fields, { add, remove }) => (
                  <Space direction="vertical" className="w-full mt-3">
                    <div className="font-semibold text-gray-700">
                      Excluded Features
                    </div>
                    {fields.map((field) => (
                      <Space key={field.key} align="center" className="w-full">
                        <Form.Item
                          {...field}
                          name={field.name}

                          rules={[
                            { required: true, message: "Enter feature text" },
                          ]}
                          className="flex-1 mb-0"
                        >
                          <Input placeholder="24/7 Dedicated Support" />
                        </Form.Item>
                        <Button danger onClick={() => remove(field.name)}>
                          Remove
                        </Button>
                      </Space>
                    ))}
                    <Button type="dashed" onClick={() => add()} block>
                      Add Excluded Feature
                    </Button>
                  </Space>
                )}
              </Form.List>

              <Divider orientation="left">Skill Labels</Divider>
              <Space align="start" className="w-full" wrap>
                <Form.Item
                  name={["skillLabels", "listening"]}
                  label="Listening Label"
                  rules={[
                    { required: true, message: "Please enter listening label" },
                  ]}
                >
                  <Input placeholder="LISTENING" />
                </Form.Item>
                <Form.Item
                  name={["skillLabels", "reading"]}
                  label="Reading Label"
                  rules={[
                    { required: true, message: "Please enter reading label" },
                  ]}
                >
                  <Input placeholder="READING" />
                </Form.Item>
              </Space>
            </Panel>

            <Panel header="Combo Packages" key="combo">
              <Form.Item
                name={["combo", "title"]}
                label="Section Title"
                rules={[
                  { required: true, message: "Please enter section title" },
                ]}
              >
                <Input placeholder="Combo" />
              </Form.Item>

              <Form.Item
                name={["combo", "ctaText"]}
                label="CTA Text"
                rules={[{ required: true, message: "Please enter CTA text" }]}
              >
                <Input placeholder="Join Course Plan" />
              </Form.Item>

              <Space align="start" className="w-full" wrap>
                <Form.Item
                  name={["combo", "basePrice"]}
                  label="Base Price (Tháng đầu tiên)"
                  tooltip="Giá cơ bản cho tháng đầu tiên. Giá sẽ tính: basePrice + (months - 1) * monthlyIncrementPrice"
                >
                  <InputNumber min={0} step={50000} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item
                  name={["combo", "monthlyIncrementPrice"]}
                  label="Monthly Increment Price"
                  tooltip="Giá tăng thêm mỗi tháng (mặc định: 100,000đ)"
                >
                  <InputNumber min={0} step={10000} style={{ width: "100%" }} />
                </Form.Item>
              </Space>

              <Divider orientation="left">Plans</Divider>
              <Form.List name={["combo", "plans"]}>
                {(fields, { add, remove }) => (
                  <Space direction="vertical" className="w-full">
                    {fields.map((field) => (
                      <Card
                        key={field.key}
                        size="small"
                        className="border border-gray-100 shadow-sm"
                        title={`Plan #${field.name + 1}`}
                        extra={
                          <Button danger onClick={() => remove(field.name)}>
                            Remove
                          </Button>
                        }
                      >
                        <Space align="start" className="w-full" wrap>
                          <Form.Item
                            {...field}
                            name={[field.name, "name"]}

                            label="Name"
                            rules={[
                              { required: true, message: "Enter plan name" },
                            ]}
                          >
                            <Input placeholder="Standard Plan" />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "months"]}

                            label="Months"
                            rules={[
                              {
                                required: true,
                                message: "Enter duration (months)",
                              },
                            ]}
                          >
                            <InputNumber min={1} />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "price"]}

                            label="Price"
                            rules={[{ required: true, message: "Enter price" }]}
                          >
                            <InputNumber min={0} step={50000} />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "popular"]}

                            label="Popular Badge"
                            valuePropName="checked"
                          >
                            <Switch />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "featuredDeal"]}

                            label="Featured Deal"
                            valuePropName="checked"
                          >
                            <Switch />
                          </Form.Item>
                        </Space>
                        <Form.Item
                          {...field}
                          name={[field.name, "dealNote"]}

                          label="Deal Note"
                        >
                          <Input placeholder="Same price as the shorter plan" />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, "samePriceAsMonths"]}

                          label="Same Price As (months)"
                        >
                          <InputNumber min={1} />
                        </Form.Item>
                      </Card>
                    ))}
                    <Button type="dashed" onClick={() => add()} block>
                      Add plan
                    </Button>
                  </Space>
                )}
              </Form.List>
            </Panel>

            <Panel header="Single Skill Packages" key="single">
              <Form.Item
                name={["single", "title"]}
                label="Section Title"
                rules={[
                  { required: true, message: "Please enter section title" },
                ]}
              >
                <Input placeholder="Single Pack" />
              </Form.Item>

              <Form.Item
                name={["single", "ctaText"]}
                label="CTA Text"
                rules={[{ required: true, message: "Please enter CTA text" }]}
              >
                <Input placeholder="Join Course Plan" />
              </Form.Item>

              <Space align="start" className="w-full" wrap>
                <Form.Item
                  name={["single", "basePrice"]}
                  label="Base Price (Tháng đầu tiên)"
                  tooltip="Giá cơ bản cho tháng đầu tiên. Giá sẽ tính: basePrice + (months - 1) * monthlyIncrementPrice"
                >
                  <InputNumber min={0} step={50000} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item
                  name={["single", "monthlyIncrementPrice"]}
                  label="Monthly Increment Price"
                  tooltip="Giá tăng thêm mỗi tháng (mặc định: 100,000đ)"
                >
                  <InputNumber min={0} step={10000} style={{ width: "100%" }} />
                </Form.Item>
              </Space>

              <Form.List name={["single", "skills"]}>
                {(fields, { add, remove }) => (
                  <Space direction="vertical" className="w-full">
                    <Divider orientation="left">Skills</Divider>
                    {fields.map((field) => (
                      <Space key={field.key} align="center">
                        <Form.Item
                          {...field}
                          name={field.name}

                          label={`Skill #${field.name + 1}`}
                          rules={[
                            { required: true, message: "Enter skill name" },
                          ]}
                        >
                          <Input placeholder="listening" />
                        </Form.Item>
                        <Button danger onClick={() => remove(field.name)}>
                          Remove
                        </Button>
                      </Space>
                    ))}
                    <Button type="dashed" onClick={() => add()} block>
                      Add skill
                    </Button>
                  </Space>
                )}
              </Form.List>

              <Divider orientation="left">Plans</Divider>
              <Form.List name={["single", "plans"]}>
                {(fields, { add, remove }) => (
                  <Space direction="vertical" className="w-full">
                    {fields.map((field) => (
                      <Card
                        key={field.key}
                        size="small"
                        className="border border-gray-100 shadow-sm"
                        title={`Plan #${field.name + 1}`}
                        extra={
                          <Button danger onClick={() => remove(field.name)}>
                            Remove
                          </Button>
                        }
                      >
                        <Space align="start" className="w-full" wrap>
                          <Form.Item
                            {...field}
                            name={[field.name, "name"]}

                            label="Name"
                            rules={[
                              { required: true, message: "Enter plan name" },
                            ]}
                          >
                            <Input placeholder="Single Pack" />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "months"]}

                            label="Months"
                            rules={[
                              {
                                required: true,
                                message: "Enter duration (months)",
                              },
                            ]}
                          >
                            <InputNumber min={1} />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "price"]}

                            label="Price"
                            rules={[{ required: true, message: "Enter price" }]}
                          >
                            <InputNumber min={0} step={50000} />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "popular"]}

                            label="Popular Badge"
                            valuePropName="checked"
                          >
                            <Switch />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "featuredDeal"]}

                            label="Featured Deal"
                            valuePropName="checked"
                          >
                            <Switch />
                          </Form.Item>
                        </Space>
                        <Form.Item
                          {...field}
                          name={[field.name, "dealNote"]}

                          label="Deal Note"
                        >
                          <Input placeholder="Best value" />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, "samePriceAsMonths"]}

                          label="Same Price As (months)"
                        >
                          <InputNumber min={1} />
                        </Form.Item>
                      </Card>
                    ))}
                    <Button type="dashed" onClick={() => add()} block>
                      Add plan
                    </Button>
                  </Space>
                )}
              </Form.List>
            </Panel>
          </Collapse>

          <Space className="mt-6 w-full justify-end">
            <Button onClick={fetchConfig}>Reload</Button>
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

export const getServerSideProps = withAdmin;
