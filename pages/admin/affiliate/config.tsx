import { useState, useEffect } from "react";
import { Card, Form, InputNumber, Button, Switch, message, Typography, Space, Divider } from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";
import type { GetServerSideProps } from "next";

const { Title, Text } = Typography;

type AffiliateConfig = {
  commission_rate: number;
  cookie_duration_days: number;
  min_payout_amount: number;
  click_rate_limit_per_ip_hours: number;
  click_velocity_threshold: number;
  waiting_period_days: number;
  payout_transfer_prefix: string;
};

const AdminAffiliateConfigPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/affiliate/config");
      const data = await res.json();
      if (data.success && data.config) {
        form.setFieldsValue({
          commission_rate: data.config.commission_rate * 100, // Display as %
          cookie_duration_days: data.config.cookie_duration_days,
          min_payout_amount: data.config.min_payout_amount,
          click_rate_limit_per_ip_hours: data.config.click_rate_limit_per_ip_hours,
          click_velocity_threshold: data.config.click_velocity_threshold,
          waiting_period_days: data.config.waiting_period_days,
        });
      }
    } catch (error) {
      message.error("Không thể tải cấu hình");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (values: Record<string, number>) => {
    setSaving(true);
    try {
      const config: AffiliateConfig = {
        commission_rate: values.commission_rate / 100, // Convert back to decimal
        cookie_duration_days: values.cookie_duration_days,
        min_payout_amount: values.min_payout_amount,
        click_rate_limit_per_ip_hours: values.click_rate_limit_per_ip_hours,
        click_velocity_threshold: values.click_velocity_threshold,
        waiting_period_days: values.waiting_period_days,
        payout_transfer_prefix: "PAYOUT",
      };

      const res = await fetch("/api/admin/affiliate/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (data.success) {
        message.success("Đã lưu cấu hình thành công");
      } else {
        message.error(data.error || "Lưu thất bại");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} style={{ margin: 0 }}>Cấu hình Affiliate</Title>
          <Text type="secondary">Quản lý các thiết lập chương trình affiliate</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchConfig}>
          Tải lại
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        disabled={loading}
      >
        {/* Commission Settings */}
        <Card title="💰 Hoa hồng" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="commission_rate"
              label="Tỷ lệ hoa hồng (%)"
              rules={[{ required: true, message: "Bắt buộc" }]}
              tooltip="Phần trăm hoa hồng affiliate nhận được từ mỗi đơn hàng"
            >
              <InputNumber
                min={1}
                max={100}
                step={1}
                addonAfter="%"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              name="waiting_period_days"
              label="Thời gian chờ (ngày)"
              rules={[{ required: true, message: "Bắt buộc" }]}
              tooltip="Số ngày chờ trước khi hoa hồng được Credit vào balance (tránh refund)"
            >
              <InputNumber
                min={0}
                max={90}
                step={1}
                addonAfter="ngày"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </div>
        </Card>

        {/* Payout Settings */}
        <Card title="🏦 Rút tiền" className="mb-6">
          <Form.Item
            name="min_payout_amount"
            label="Số tiền rút tối thiểu (VNĐ)"
            rules={[{ required: true, message: "Bắt buộc" }]}
            tooltip="Số tiền tối thiểu affiliate cần có trong balance để yêu cầu rút tiền"
          >
            <InputNumber
              min={10000}
              step={10000}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={((value: string | undefined) => Number(value!.replace(/[^\d]/g, "")) || 10000) as any}
              addonAfter="VNĐ"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Card>

        {/* Cookie & Tracking */}
        <Card title="🍪 Cookie & Tracking" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="cookie_duration_days"
              label="Thời hạn cookie (ngày)"
              rules={[{ required: true, message: "Bắt buộc" }]}
              tooltip="Số ngày cookie affiliate_ref tồn tại trên browser người dùng"
            >
              <InputNumber
                min={1}
                max={365}
                step={1}
                addonAfter="ngày"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              name="click_rate_limit_per_ip_hours"
              label="Rate limit click/IP (giờ)"
              rules={[{ required: true, message: "Bắt buộc" }]}
              tooltip="Khoảng thời gian tối thiểu giữa 2 lượt click từ cùng IP — chỉ đếm 1 unique visit"
            >
              <InputNumber
                min={1}
                max={168}
                step={1}
                addonAfter="giờ"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </div>
        </Card>

        {/* Anti-fraud */}
        <Card title="🛡️ Chống gian lận" className="mb-6">
          <Form.Item
            name="click_velocity_threshold"
            label="Ngưỡng click velocity"
            rules={[{ required: true, message: "Bắt buộc" }]}
            tooltip="Số click tối đa từ cùng IP trong 1 giờ trước khi bị flag là bất thường"
          >
            <InputNumber
              min={10}
              max={10000}
              step={10}
              addonAfter="clicks/giờ"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Text type="secondary">
              Hệ thống tự động kiểm tra:
              <ul className="mt-2 space-y-1">
                <li>✅ Self-referral (email / phone trùng affiliate)</li>
                <li>✅ IP match (IP buyer trùng IP affiliate)</li>
                <li>✅ Bot detection (user-agent screening)</li>
                <li>✅ Click rate limiting (1 unique visit/IP/{"{N}"} giờ)</li>
              </ul>
            </Text>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={saving}
            size="large"
          >
            Lưu cấu hình
          </Button>
        </div>
      </Form>
    </div>
  );
};

AdminAffiliateConfigPage.Layout = AdminLayout;

export default AdminAffiliateConfigPage;

export const getServerSideProps: GetServerSideProps = withAdmin;
