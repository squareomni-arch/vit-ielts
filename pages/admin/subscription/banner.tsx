import { useEffect, useState } from "react";
import { Button, Input, Form, Card, Space, message } from "antd";
import type { SubscriptionBannerConfig } from "@/shared/types/admin-config";
import AdminLayout from "../_layout";
import { withFullAdmin } from "@/shared/hoc/withAdmin";
import { InactiveSectionNotice } from "@/shared/ui/admin/inactive-section-notice";

function SubscriptionPageHeaderPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/subscription/banner");
      if (!res.ok) throw new Error("Failed to load config");
      const data = await res.json();
      form.setFieldsValue({ title: data?.title || "" });
    } catch (error) {
      console.error("Error fetching config:", error);
      message.error("Error loading config");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const configData: SubscriptionBannerConfig = {
        title: values.title,
      };

      const res = await fetch("/api/admin/subscription/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });

      if (!res.ok) throw new Error("Save failed");

      message.success("Config saved successfully");
    } catch (error) {
      console.error("Error saving config:", error);
      message.error("Error saving config");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
      <InactiveSectionNotice note="Khối Banner Header đã được thay thế bằng Khung giá tiêu đề trực tiếp (Inline Header) trên trang Subscription mới. Chỉnh sửa ở đây sẽ không thay đổi giao diện." />
      <Card
        title={
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold m-0">
              Manage Subscription Page Header
            </h1>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Page Title"
            rules={[{ required: true, message: "Please enter title" }]}
            extra="Tiêu đề hiển thị trên Page Header của trang Subscription"
          >
            <Input placeholder="Subscription" />
          </Form.Item>
        </Form>
      </Card>

      <Space className="mt-6 w-full justify-end">
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

export default SubscriptionPageHeaderPage;

export const getServerSideProps = withFullAdmin;
