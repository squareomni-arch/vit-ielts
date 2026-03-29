import { useState, useEffect, useCallback } from "react";
import {
  Table, Card, Tag, Button, Modal, Input, Select, Space, message,
  Descriptions, Typography, Tooltip, DatePicker,
} from "antd";
import {
  CheckCircleOutlined, CloseCircleOutlined, CopyOutlined,
  ExclamationCircleOutlined, DollarOutlined, QrcodeOutlined,
  ReloadOutlined, CheckOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";
import type { GetServerSideProps } from "next";

const { TextArea } = Input;
const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

type PayoutRow = {
  id: string;
  affiliate_id: string;
  amount: number;
  status: string;
  reject_reason: string | null;
  bank_snapshot: {
    account_holder: string;
    account_number: string;
    bank_name: string;
    bank_code?: string;
    bank_branch?: string;
  };
  sepay_transaction_id: number | null;
  sepay_reference_code: string | null;
  approved_at: string | null;
  completed_at: string | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  affiliate_custom_link: string | null;
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: "orange", label: "Chờ duyệt" },
  approved: { color: "blue", label: "Đã duyệt" },
  completed: { color: "green", label: "Hoàn thành" },
  rejected: { color: "red", label: "Từ chối" },
  flagged: { color: "volcano", label: "Cần xác minh" },
};

const formatVND = (amount: number) =>
  `${amount.toLocaleString("vi-VN")}đ`;

const AdminPayoutsPage = () => {
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  // Modals
  const [approveModal, setApproveModal] = useState<PayoutRow | null>(null);
  const [rejectModal, setRejectModal] = useState<PayoutRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [completeModal, setCompleteModal] = useState<PayoutRow | null>(null);
  const [transactionCode, setTransactionCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/affiliate/payouts?${params}`);
      const data = await res.json();
      if (data.success) {
        setPayouts(data.data ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (error) {
      console.error("Error fetching payouts:", error);
      message.error("Không thể tải danh sách payouts");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, search]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleAction = async (payoutId: string, action: string, body: Record<string, unknown> = {}) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/affiliate/payouts/${payoutId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      if (data.success) {
        message.success("Thao tác thành công");
        setApproveModal(null);
        setRejectModal(null);
        setCompleteModal(null);
        setRejectReason("");
        setTransactionCode("");
        fetchPayouts();
      } else {
        message.error(data.error || "Thao tác thất bại");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra");
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép ${label}`);
  };

  const getVietQRUrl = (payout: PayoutRow) => {
    const { bank_snapshot: bank } = payout;
    const params = new URLSearchParams({
      acc: bank.account_number,
      bank: bank.bank_code || bank.bank_name,
      amount: String(payout.amount),
      des: `PAYOUT ${payout.id}`,
    });
    return `https://qr.sepay.vn/img?${params}`;
  };

  const columns: ColumnsType<PayoutRow> = [
    {
      title: "Affiliate",
      key: "affiliate",
      width: 200,
      render: (_: unknown, record: PayoutRow) => (
        <div>
          <div className="font-semibold">{record.user_name || "N/A"}</div>
          <div className="text-xs text-gray-500">{record.user_email || "N/A"}</div>
          {record.affiliate_custom_link && (
            <Tag color="blue" className="mt-1">ref: {record.affiliate_custom_link}</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 130,
      render: (amount: number) => (
        <span className="font-bold text-green-600">{formatVND(amount)}</span>
      ),
      sorter: (a: PayoutRow, b: PayoutRow) => a.amount - b.amount,
    },
    {
      title: "Ngân hàng",
      key: "bank",
      width: 200,
      render: (_: unknown, record: PayoutRow) => {
        const bank = record.bank_snapshot;
        return (
          <div className="text-xs">
            <div className="font-semibold">{bank.bank_name}</div>
            <div className="font-mono">{bank.account_number}</div>
            <div className="text-gray-500">{bank.account_holder}</div>
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const config = STATUS_CONFIG[status] || { color: "default", label: status };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: (a: PayoutRow, b: PayoutRow) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: "Ref SePay",
      dataIndex: "sepay_reference_code",
      key: "sepay_ref",
      width: 130,
      render: (ref: string | null) =>
        ref ? <Text code copyable>{ref}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: "Hành động",
      key: "actions",
      width: 220,
      render: (_: unknown, record: PayoutRow) => (
        <Space wrap>
          {record.status === "pending" && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => setApproveModal(record)}
              >
                Duyệt
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => setRejectModal(record)}
              >
                Từ chối
              </Button>
            </>
          )}
          {record.status === "approved" && (
            <Button
              size="small"
              icon={<CheckOutlined />}
              onClick={() => setCompleteModal(record)}
            >
              Hoàn tất thủ công
            </Button>
          )}
          {record.status === "flagged" && (
            <>
              <Button
                size="small"
                icon={<CheckOutlined />}
                onClick={() => setCompleteModal(record)}
              >
                Hoàn tất
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => setRejectModal(record)}
              >
                Từ chối
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // Calculate summary stats
  const pendingCount = payouts.filter((p) => p.status === "pending").length;
  const pendingAmount = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} style={{ margin: 0 }}>Quản lý Payouts</Title>
          <Text type="secondary">Duyệt và quản lý yêu cầu rút tiền affiliate</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchPayouts}>
          Làm mới
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <div className="text-gray-500">Chờ duyệt</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{formatVND(pendingAmount)}</div>
            <div className="text-gray-500">Tổng tiền chờ duyệt</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{total}</div>
            <div className="text-gray-500">Tổng payouts</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <Space wrap>
          <Select
            placeholder="Trạng thái"
            allowClear
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({
              value,
              label: cfg.label,
            }))}
          />
          <Input.Search
            placeholder="Tìm kiếm..."
            style={{ width: 300 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={() => fetchPayouts()}
            allowClear
          />
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={payouts}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: setPage,
            showSizeChanger: false,
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      {/* ═══ APPROVE MODAL ═══ */}
      <Modal
        title="Duyệt yêu cầu rút tiền"
        open={!!approveModal}
        onCancel={() => setApproveModal(null)}
        footer={[
          <Button key="cancel" onClick={() => setApproveModal(null)}>
            Hủy
          </Button>,
          <Button
            key="approve"
            type="primary"
            loading={actionLoading}
            onClick={() => approveModal && handleAction(approveModal.id, "approve")}
          >
            Xác nhận duyệt
          </Button>,
        ]}
        width={700}
      >
        {approveModal && (
          <div className="space-y-4">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Affiliate">
                {approveModal.user_name} ({approveModal.user_email})
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền">
                <span className="text-xl font-bold text-green-600">
                  {formatVND(approveModal.amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Ngân hàng">
                {approveModal.bank_snapshot.bank_name}
              </Descriptions.Item>
              <Descriptions.Item label="Số tài khoản">
                <Space>
                  <Text code>{approveModal.bank_snapshot.account_number}</Text>
                  <Tooltip title="Sao chép STK">
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() =>
                        copyToClipboard(
                          approveModal.bank_snapshot.account_number,
                          "số tài khoản",
                        )
                      }
                    />
                  </Tooltip>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Chủ tài khoản">
                <Space>
                  <Text>{approveModal.bank_snapshot.account_holder}</Text>
                  <Tooltip title="Sao chép tên">
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() =>
                        copyToClipboard(
                          approveModal.bank_snapshot.account_holder,
                          "tên chủ TK",
                        )
                      }
                    />
                  </Tooltip>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Nội dung CK">
                <Space>
                  <Text code>PAYOUT {approveModal.id}</Text>
                  <Tooltip title="Sao chép nội dung CK">
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() =>
                        copyToClipboard(
                          `PAYOUT ${approveModal.id}`,
                          "nội dung CK",
                        )
                      }
                    />
                  </Tooltip>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền CK">
                <Space>
                  <Text code>{approveModal.amount}</Text>
                  <Tooltip title="Sao chép số tiền">
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() =>
                        copyToClipboard(String(approveModal.amount), "số tiền")
                      }
                    />
                  </Tooltip>
                </Space>
              </Descriptions.Item>
            </Descriptions>

            {/* VietQR Code */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-3">
                <QrcodeOutlined className="text-lg" />
                <Text strong>VietQR — Quét mã để chuyển khoản</Text>
              </div>
              <img
                src={getVietQRUrl(approveModal)}
                alt="VietQR Code"
                className="mx-auto rounded-lg border border-gray-200"
                style={{ maxWidth: 300 }}
              />
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <ExclamationCircleOutlined className="text-yellow-600 mr-2" />
              <Text type="warning">
                Sau khi duyệt, hệ thống sẽ tự động xác nhận hoàn thành khi phát hiện giao dịch
                từ SePay với nội dung "PAYOUT {approveModal.id.substring(0, 8)}...".
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ REJECT MODAL ═══ */}
      <Modal
        title="Từ chối yêu cầu rút tiền"
        open={!!rejectModal}
        onCancel={() => {
          setRejectModal(null);
          setRejectReason("");
        }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModal(null); setRejectReason(""); }}>
            Hủy
          </Button>,
          <Button
            key="reject"
            type="primary"
            danger
            loading={actionLoading}
            disabled={!rejectReason.trim()}
            onClick={() => rejectModal && handleAction(rejectModal.id, "reject", { reason: rejectReason })}
          >
            Xác nhận từ chối
          </Button>,
        ]}
      >
        {rejectModal && (
          <div className="space-y-4">
            <div>
              <Text>Từ chối payout <Text strong>{formatVND(rejectModal.amount)}</Text> của {rejectModal.user_name}</Text>
            </div>
            <div>
              <Text strong>Lý do từ chối (bắt buộc):</Text>
              <TextArea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                className="mt-2"
              />
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <ExclamationCircleOutlined className="text-red-600 mr-2" />
              <Text type="danger">
                Số dư sẽ được hoàn lại vào tài khoản affiliate.
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ MANUAL COMPLETE MODAL ═══ */}
      <Modal
        title="Hoàn tất payout thủ công"
        open={!!completeModal}
        onCancel={() => {
          setCompleteModal(null);
          setTransactionCode("");
        }}
        footer={[
          <Button key="cancel" onClick={() => { setCompleteModal(null); setTransactionCode(""); }}>
            Hủy
          </Button>,
          <Button
            key="complete"
            type="primary"
            loading={actionLoading}
            onClick={() => completeModal && handleAction(completeModal.id, "complete", { transactionCode })}
          >
            Xác nhận hoàn tất
          </Button>,
        ]}
      >
        {completeModal && (
          <div className="space-y-4">
            <div>
              <Text>
                Hoàn tất payout <Text strong>{formatVND(completeModal.amount)}</Text> cho {completeModal.user_name}
              </Text>
            </div>
            <div>
              <Text strong>Mã giao dịch ngân hàng (tùy chọn):</Text>
              <Input
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value)}
                placeholder="vd: FT260230..."
                className="mt-2"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

AdminPayoutsPage.Layout = AdminLayout;

export default AdminPayoutsPage;

export const getServerSideProps: GetServerSideProps = withAdmin;
