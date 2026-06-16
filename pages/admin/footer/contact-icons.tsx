import { useEffect, useState } from "react";
import { Form, Input, Button, Card, message, Space } from "antd";
import { FacebookOutlined } from "@ant-design/icons";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { InactiveSectionNotice } from "@/shared/ui/admin/inactive-section-notice";

function ContactIconsAdminPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/footer/contact-icons");
      if (!res.ok) throw new Error("Lỗi khi tải dữ liệu");
      const data = await res.json();
      form.setFieldsValue(data);
    } catch (err: any) {
      message.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      const res = await fetch("/api/admin/footer/contact-icons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Lỗi khi lưu dữ liệu");

      message.success("Cập nhật thông tin thành công");
    } catch (err: any) {
      if (err.errorFields) return; // Form validation error
      message.error(err.message || "Đã có lỗi xảy ra khi lưu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <InactiveSectionNotice note="Icon liên hệ nổi trên website đang lấy từ Settings (Facebook & Zalo trong general settings), không đọc cấu hình ở đây. Chỉnh sửa mục này sẽ không có tác dụng." />
      <Card title={<h1 className="text-2xl font-bold m-0">Fixed Contact Icons</h1>}>
        {loading ? (
          <div className="py-10 text-center text-gray-500">Đang tải cấu hình...</div>
        ) : (
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-100">
              <p className="m-0 text-blue-800">
                Các icon liên hệ này sẽ luôn hiển thị ở góc phải dưới cùng của màn hình trên giao diện người dùng.
              </p>
            </div>

            <Form.Item
              name="facebook"
              label="Facebook URL"
              rules={[
                { type: "url", message: "Vui lòng nhập đường dẫn hợp lệ" }
              ]}
              extra="Ví dụ: https://www.facebook.com/vitielts"
            >
              <Input 
                prefix={<FacebookOutlined className="text-blue-600" />} 
                placeholder="Nhập link Facebook" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="zalo"
              label="Zalo URL"
              rules={[
                { type: "url", message: "Vui lòng nhập đường dẫn hợp lệ" }
              ]}
              extra="Ví dụ: https://zalo.me/..."
            >
              <Input 
                prefix={<span className="font-bold text-blue-500 px-1">Z</span>} 
                placeholder="Nhập link Zalo" 
                size="large"
              />
            </Form.Item>

            <Space className="mt-6 w-full justify-end">
              <Button type="primary" htmlType="submit" loading={saving} size="large">
                Lưu thay đổi
              </Button>
            </Space>
          </Form>
        )}
      </Card>
    </AdminLayout>
  );
}

export default ContactIconsAdminPage;

export const getServerSideProps = withAdmin;
