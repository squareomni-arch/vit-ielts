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
import type { PracticeLibraryBannerConfig } from "@/shared/types/admin-config";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";

const { Panel } = Collapse;

function PracticeLibraryBannerPage() {
  const [config, setConfig] = useState<PracticeLibraryBannerConfig | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/ielts-practice-library/banner");
      if (!res.ok) throw new Error("Failed to load config");
      const data = await res.json();
      
      // Đảm bảo structure đầy đủ để tránh form reset
      const normalizedData: PracticeLibraryBannerConfig = {
        listening: {
          title: data.listening?.title || "",
          description: {
            line1: data.listening?.description?.line1 || "",
            line2: data.listening?.description?.line2 || "",
            line3: data.listening?.description?.line3 || "",
          },
          backgroundColor: data.listening?.backgroundColor || "",
          button: {
            text: data.listening?.button?.text || "",
            link: data.listening?.button?.link || "",
          },
        },
        reading: {
          title: data.reading?.title || "",
          description: {
            line1: data.reading?.description?.line1 || "",
            line2: data.reading?.description?.line2 || "",
            line3: data.reading?.description?.line3 || "",
          },
          backgroundColor: data.reading?.backgroundColor || "",
          button: {
            text: data.reading?.button?.text || "",
            link: data.reading?.button?.link || "",
          },
        },
      };
      
      setConfig(normalizedData);
      
      // Chỉ set form values lần đầu tiên khi load
      if (!isFormInitialized) {
        form.setFielValue(normalizedData);
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

      const configData: PracticeLibraryBannerConfig = {
        listening: values.listening,
        reading: values.reading,
      };

      const res = await fetch("/api/admin/ielts-practice-library/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Save failed");
      }

      const result = await res.json();
      message.success(result.message || "Config saved successfully");

      // Update config state với giá trị đã save để đồng bộ
      setConfig(configData);
      
      // KHÔNG reload form để tránh reset các field user đang nhập
      // Form values đã được update khi user save, không cần reset
    } catch (error) {
      console.error("Error saving config:", error);
      message.error(
        error instanceof Error ? error.message : "Error saving config"
      );
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
              Manage Practice Library Banner
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
          <Collapse
            defaultActiveKey={["listening", "reading"]}
          >
            {/* Listening Banner */}
            <Panel header="Listening Banner" key="listening">
              <Form.Item
                name={["listening", "title"]}
                label="Title"
                rules={[{ required: true, message: "Please enter title" }]}
              >
                <Input placeholder="IELTS Listening Practice Tests" />
              </Form.Item>
              <Divider orientation="left">Description</Divider>
              <Form.Item
                name={["listening", "description", "line1"]}
                label="Line 1"
                preserve={true}
                validateTrigger="onBlur"
                rules={[
                  {
                    required: true,
                    message: "Please enter line 1",
                  },
                ]}
              >
                <Input placeholder="IELTS Listening Practice Tests Online miễn phí tại IELTS PREDICTION với đề" />
              </Form.Item>
              <Form.Item
                name={["listening", "description", "line2"]}
                label="Line 2"
                preserve={true}
                validateTrigger="onBlur"
                rules={[
                  {
                    required: true,
                    message: "Please enter line 2",
                  },
                ]}
              >
                <Input placeholder="thi, audio, transcript, answer key, giải thích chi tiết từ vựng đi kèm và" />
              </Form.Item>
              <Form.Item
                name={["listening", "description", "line3"]}
                label="Line 3"
                preserve={true}
                validateTrigger="onBlur"
                rules={[
                  {
                    required: true,
                    message: "Please enter line 3",
                  },
                ]}
              >
                <Input placeholder="trải nghiệm làm bài thi thử như trên máy." />
              </Form.Item>
              <Form.Item
                name={["listening", "backgroundColor"]}
                label="Background Color/Gradient"
                rules={[
                  { required: true, message: "Please enter background color" },
                ]}
                extra="Ví dụ: linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%) hoặc #ffffff"
              >
                <Input placeholder="linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)" />
              </Form.Item>
              <Form.Item
                name={["listening", "button", "text"]}
                label="Button Text"
                rules={[
                  {
                    required: true,
                    message: "Please enter button text",
                  },
                ]}
              >
                <Input placeholder="Tìm hiểu khóa học" />
              </Form.Item>
              <Form.Item
                name={["listening", "button", "link"]}
                label="Button Link"
                rules={[
                  {
                    required: true,
                    message: "Please enter button link",
                  },
                ]}
              >
                <Input placeholder="#" />
              </Form.Item>
            </Panel>

            {/* Reading Banner */}
            <Panel header="Reading Banner" key="reading">
              <Form.Item
                name={["reading", "title"]}
                label="Title"
                rules={[{ required: true, message: "Please enter title" }]}
              >
                <Input placeholder="IELTS Reading Practice Tests" />
              </Form.Item>
              <Divider orientation="left">Description</Divider>
              <Form.Item
                name={["reading", "description", "line1"]}
                label="Line 1"
                preserve={true}
                validateTrigger="onBlur"
                rules={[
                  {
                    required: true,
                    message: "Please enter line 1",
                  },
                ]}
              >
                <Input placeholder="IELTS Reading Practice Tests Online miễn phí tại DOL Academy với đề" />
              </Form.Item>
              <Form.Item
                name={["reading", "description", "line2"]}
                label="Line 2"
                preserve={true}
                validateTrigger="onBlur"
                rules={[
                  {
                    required: true,
                    message: "Please enter line 2",
                  },
                ]}
              >
                <Input placeholder="thi, transcript, answer key, giải thích chi tiết từ vựng đi kèm và" />
              </Form.Item>
              <Form.Item
                name={["reading", "description", "line3"]}
                label="Line 3"
                preserve={true}
                validateTrigger="onBlur"
                rules={[
                  {
                    required: true,
                    message: "Please enter line 3",
                  },
                ]}
              >
                <Input placeholder="trải nghiệm làm bài thi thử như trên máy." />
              </Form.Item>
              <Form.Item
                name={["reading", "backgroundColor"]}
                label="Background Color/Gradient"
                rules={[
                  { required: true, message: "Please enter background color" },
                ]}
                extra="Ví dụ: linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%) hoặc #ffffff"
              >
                <Input placeholder="linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)" />
              </Form.Item>
              <Form.Item
                name={["reading", "button", "text"]}
                label="Button Text"
                rules={[
                  {
                    required: true,
                    message: "Please enter button text",
                  },
                ]}
              >
                <Input placeholder="Tìm hiểu khóa học" />
              </Form.Item>
              <Form.Item
                name={["reading", "button", "link"]}
                label="Button Link"
                rules={[
                  {
                    required: true,
                    message: "Please enter button link",
                  },
                ]}
              >
                <Input placeholder="#" />
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

export default PracticeLibraryBannerPage;

export const getServerSideProps = withAdmin;
