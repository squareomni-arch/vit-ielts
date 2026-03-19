import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Table,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Switch,
  Popconfirm,
} from "antd";
import AdminLayout from "../_layout";
// Coupon type matching the v2 API response shape (snake_case from DB)
type CouponV2 = {
  id: string;
  code: string;
  type: string;
  value: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

// Display-friendly mapped type
type Coupon = {
  id: string;
  code: string;
  discountAmount: number;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
import { withAdmin } from "@/shared/hoc/withAdmin";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      if (!res.ok) throw new Error("Failed to load coupons");
      const json = await res.json();
      const raw = (json.data || []) as CouponV2[];
      // Map v2 snake_case to display-friendly camelCase
      setCoupons(raw.map((c) => ({
        id: c.id,
        code: c.code,
        discountAmount: c.value,
        maxUses: c.max_uses ?? 0,
        currentUses: c.current_uses,
        isActive: c.is_active,
        createdAt: c.created_at,
        updatedAt: c.created_at,
      })));
    } catch {
      message.error("Error loading coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCoupon(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    form.setFieldsValue(coupon);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      message.success("Xóa mã giảm giá thành công");
      fetchCoupons();
    } catch {
      message.error("Error deleting coupon");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingCoupon) {
        const res = await fetch("/api/admin/coupons", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, id: editingCoupon.id }),
        });

        if (!res.ok) throw new Error("Update failed");
        message.success("Cập nhật mã giảm giá thành công");
      } else {
        const res = await fetch("/api/admin/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (!res.ok) throw new Error("Create failed");
        message.success("Tạo mã giảm giá thành công");
      }

      setModalVisible(false);
      fetchCoupons();
    } catch (error) {
      console.error(error);
      message.error("Error saving coupon");
    }
  };

  const columns = [
    {
      title: "Mã giảm giá",
      dataIndex: "code",
      key: "code",
      render: (code: string) => (
        <span className="font-mono font-bold text-blue-600">{code}</span>
      ),
    },
    {
      title: "Số tiền giảm",
      dataIndex: "discountAmount",
      key: "discountAmount",
      render: (amount: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount),
    },
    {
      title: "Đã dùng / Tổng",
      key: "uses",
      render: (_: any, record: Coupon) => (
        <span>
          {record.currentUses} / {record.maxUses}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <span className={isActive ? "text-green-600" : "text-gray-400"}>
          {isActive ? "Hoạt động" : "Tạm dừng"}
        </span>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_: any, record: Coupon) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa mã giảm giá này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Card
        title={<h1 className="text-2xl font-bold m-0">Quản lý mã giảm giá</h1>}
        extra={
          <Button type="primary" onClick={handleCreate}>
            Tạo mã giảm giá mới
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={coupons}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />

        <Modal
          title={editingCoupon ? "Sửa mã giảm giá" : "Tạo mã giảm giá mới"}
          open={modalVisible}
          onOk={handleSubmit}
          onCancel={() => setModalVisible(false)}
          okText={editingCoupon ? "Cập nhật" : "Tạo"}
          cancelText="Hủy"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="code"
              label="Mã giảm giá"
              rules={[
                { required: true, message: "Vui lòng nhập mã giảm giá" },
                {
                  pattern: /^[A-Z0-9]+$/,
                  message: "Mã chỉ được chứa chữ cái và số",
                },
              ]}
            >
              <Input
                placeholder="VD: IELTS20"
                style={{ textTransform: "uppercase" }}
                onInput={(e: any) => {
                  e.target.value = e.target.value.toUpperCase();
                }}
              />
            </Form.Item>

            <Form.Item
              name="discountAmount"
              label="Số tiền giảm (VNĐ)"
              rules={[
                { required: true, message: "Vui lòng nhập số tiền giảm" },
                { type: "number", min: 1, message: "Số tiền phải lớn hơn 0" },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                placeholder="20000"
              />
            </Form.Item>

            <Form.Item
              name="maxUses"
              label="Số lượng mã"
              rules={[
                { required: true, message: "Vui lòng nhập số lượng mã" },
                {
                  type: "number",
                  min: 1,
                  message: "Số lượng phải lớn hơn 0",
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                placeholder="100"
              />
            </Form.Item>

            {editingCoupon && (
              <Form.Item name="isActive" valuePropName="checked">
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
              </Form.Item>
            )}
          </Form>
        </Modal>
      </Card>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdmin;
