"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/appx/providers/auth-provider";
import { MyProfileLayout } from "@/widgets/layouts";
import { toast } from "react-toastify";
import {
  Tabs, Card, Button, Input, Table, Tag, Statistic, Space, Modal,
  InputNumber, Form, Descriptions, message, Alert, Empty,
} from "antd";
import {
  DollarOutlined,
  EyeOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  SettingOutlined,
  BankOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { formatPrice } from "@/pages/subscription/ui/subscription-plans/pricing";

const { TabPane } = Tabs;

interface AffiliateUser {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
  customLink?: string;
  emailNotifications: boolean;
  commissionRate?: number;
}

interface AffiliateLink {
  id: string;
  affiliateId: string;
  link: string;
  customLink?: string;
  createdAt: string;
}

interface AffiliateStats {
  totalBalance: number;
  totalCommissions: number;
  totalVisits: number;
  totalConversions: number;
  conversionRate: number;
  pendingCommissions: number;
  paidCommissions: number;
}

interface Commission {
  id: string;
  orderId: string;
  amount: number;
  commissionAmount: number;
  status: "pending" | "approved" | "paid" | "cancelled" | "review";
  fraudFlag?: string;
  eligibleAt?: string;
  createdAt: string;
}

interface Visit {
  id: string;
  linkId: string;
  visitedAt: string;
  converted: boolean;
  orderId?: string;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  reject_reason: string | null;
  bank_snapshot: Record<string, string>;
  created_at: string;
  completed_at: string | null;
}

interface BankInfo {
  account_holder: string;
  account_number: string;
  bank_name: string;
  bank_code?: string;
  bank_branch?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ duyệt", color: "orange" },
  approved: { label: "Đã duyệt", color: "blue" },
  completed: { label: "Hoàn thành", color: "green" },
  rejected: { label: "Từ chối", color: "red" },
  flagged: { label: "Cần xác minh", color: "volcano" },
};

export const PageAffiliate = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<AffiliateUser | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [customLink, setCustomLink] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Payout state
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [balance, setBalance] = useState(0);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [bankForm] = Form.useForm();
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      fetchAffiliateData();
    }
  }, [currentUser]);

  const fetchAffiliateData = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);

      // Check if user is affiliate
      const affiliateRes = await fetch(`/api/affiliate/register?userId=${currentUser.id}`);
      const affiliateData = await affiliateRes.json();

      if (affiliateData.success && affiliateData.affiliate) {
        setAffiliate(affiliateData.affiliate);
        setEmailNotifications(affiliateData.affiliate.emailNotifications);

        // Fetch all data concurrently
        const [statsRes, linksRes, commissionsRes, visitsRes, bankRes, payoutsRes] =
          await Promise.all([
            fetch(`/api/affiliate/stats?affiliateId=${affiliateData.affiliate.id}`),
            fetch(`/api/affiliate/links?affiliateId=${affiliateData.affiliate.id}`),
            fetch(`/api/affiliate/commissions?affiliateId=${affiliateData.affiliate.id}`),
            fetch(`/api/affiliate/visits?affiliateId=${affiliateData.affiliate.id}`),
            fetch("/api/affiliate/bank-info"),
            fetch("/api/affiliate/payouts"),
          ]);

        const [statsData, linksData, commissionsData, visitsData, bankData, payoutsData] =
          await Promise.all([
            statsRes.json(),
            linksRes.json(),
            commissionsRes.json(),
            visitsRes.json(),
            bankRes.json(),
            payoutsRes.json(),
          ]);

        if (statsData.success) setStats(statsData.stats);
        if (linksData.success) {
          const uniqueLinks = linksData.links.filter(
            (link: AffiliateLink, index: number, self: AffiliateLink[]) =>
              index ===
              self.findIndex(
                (l: AffiliateLink) =>
                  l.affiliateId === link.affiliateId &&
                  (link.customLink ? l.customLink === link.customLink : !l.customLink),
              ),
          );
          setLinks(uniqueLinks);
        }
        if (commissionsData.success) setCommissions(commissionsData.commissions);
        if (visitsData.success) setVisits(visitsData.visits);
        if (bankData.success && bankData.bankInfo) {
          setBankInfo(bankData.bankInfo);
          bankForm.setFieldsValue({
            accountHolder: bankData.bankInfo.account_holder,
            accountNumber: bankData.bankInfo.account_number,
            bankName: bankData.bankInfo.bank_name,
            bankCode: bankData.bankInfo.bank_code || "",
            bankBranch: bankData.bankInfo.bank_branch || "",
          });
        }
        if (payoutsData.success) {
          setPayouts(payoutsData.payouts || []);
        }

        // Fetch balance
        const dashRes = await fetch("/api/affiliate/dashboard");
        const dashData = await dashRes.json();
        if (dashData.success) {
          setBalance(dashData.dashboard?.balance ?? 0);
        }
      }
    } catch (error) {
      console.error("Error fetching affiliate data:", error);
      toast.error("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!currentUser?.id) {
      toast.error("Vui lòng đăng nhập để đăng ký affiliate");
      return;
    }

    try {
      const res = await fetch("/api/affiliate/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          email: (currentUser as any).email,
          name: currentUser.name || (currentUser as any).username,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Đăng ký thành công!");
        fetchAffiliateData();
      } else {
        toast.error(data.error || "Đăng ký thất bại");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đăng ký");
    }
  };

  const handleCreateLink = async () => {
    if (!affiliate) return;

    try {
      const res = await fetch("/api/affiliate/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId: affiliate.id,
          customLink: customLink?.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.message && data.message.includes("đã tồn tại")) {
          toast.info(data.message);
        } else {
          toast.success("Tạo link thành công!");
        }
        setCustomLink("");
        await fetchAffiliateData();
      } else {
        toast.error(data.error || "Tạo link thất bại");
      }
    } catch (error) {
      console.error("Error creating link:", error);
      toast.error("Có lỗi xảy ra khi tạo link");
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Đã sao chép link!");
  };

  const handleUpdateSettings = async () => {
    if (!affiliate) return;

    try {
      const res = await fetch("/api/affiliate/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          emailNotifications,
        }),
      });

      if (res.ok) {
        toast.success("Cập nhật cài đặt thành công!");
        fetchAffiliateData();
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật cài đặt");
    }
  };

  // ──── Bank Info ────
  const handleSaveBankInfo = async (values: Record<string, string>) => {
    try {
      const res = await fetch("/api/affiliate/bank-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (data.success) {
        setBankInfo(data.bankInfo);
        setShowBankForm(false);
        toast.success("Đã lưu thông tin ngân hàng");
      } else {
        toast.error(data.error || "Lưu thất bại");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  // ──── Payout Request ────
  const handleRequestPayout = async () => {
    if (!payoutAmount || payoutAmount <= 0) {
      toast.error("Vui lòng nhập số tiền rút");
      return;
    }
    if (!bankInfo) {
      toast.error("Vui lòng cập nhật thông tin ngân hàng trước");
      return;
    }

    setPayoutLoading(true);
    try {
      const res = await fetch("/api/affiliate/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: payoutAmount }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Yêu cầu rút tiền đã được gửi thành công!");
        setShowPayoutModal(false);
        setPayoutAmount(0);
        fetchAffiliateData();
      } else {
        toast.error(data.error || "Gửi yêu cầu thất bại");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setPayoutLoading(false);
    }
  };

  // If not registered or pending
  if (!affiliate || affiliate.status === "pending") {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-8">
            {!affiliate ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Trở thành Affiliate
                </h2>
                <p className="text-gray-600 mb-6">
                  Tham gia chương trình affiliate và kiếm hoa hồng khi giới thiệu khách hàng mua
                  khóa học
                </p>
                <Button type="primary" size="large" onClick={handleRegister} loading={loading}>
                  Trở thành Affiliate
                </Button>
              </>
            ) : (
              <>
                <CheckCircleOutlined className="text-4xl text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Đơn đăng ký của bạn đang chờ duyệt
                </h2>
                <p className="text-gray-600">
                  Vui lòng chờ quản trị viên duyệt đơn đăng ký của bạn.
                </p>
              </>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (affiliate.status === "rejected") {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Đơn đăng ký của bạn đã bị từ chối
            </h2>
            <p className="text-gray-600">Vui lòng liên hệ admin để biết thêm chi tiết.</p>
          </div>
        </Card>
      </div>
    );
  }

  const commissionColumns: ColumnsType<Commission> = [
    {
      title: "Mã đơn",
      dataIndex: "orderId",
      key: "orderId",
      render: (orderId: string) => `#${orderId.substring(0, 8)}`,
    },
    {
      title: "Giá trị đơn",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => formatPrice(amount),
    },
    {
      title: "Hoa hồng",
      dataIndex: "commissionAmount",
      key: "commissionAmount",
      render: (amount: number) => (
        <span className="font-bold text-green-600">{formatPrice(amount)}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: Commission) => {
        const colors: Record<string, string> = {
          pending: "orange",
          approved: "blue",
          paid: "green",
          cancelled: "red",
          review: "volcano",
        };
        const labels: Record<string, string> = {
          pending: "Đang chờ",
          approved: "Đã duyệt",
          paid: "Đã thanh toán",
          cancelled: "Đã hủy",
          review: "Đang xem xét",
        };

        return (
          <Space direction="vertical" size={0}>
            <Tag color={colors[status]}>{labels[status] || status}</Tag>
            {status === "pending" && record.eligibleAt && (
              <span className="text-xs text-gray-400">
                Đủ điều kiện: {dayjs(record.eligibleAt).format("DD/MM/YYYY")}
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
  ];

  const visitColumns: ColumnsType<Visit> = [
    {
      title: "Link",
      dataIndex: "linkId",
      key: "linkId",
      render: (linkId: string) => `Link ${linkId.substring(0, 8)}`,
    },
    {
      title: "Thời gian",
      dataIndex: "visitedAt",
      key: "visitedAt",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Chuyển đổi",
      dataIndex: "converted",
      key: "converted",
      render: (converted: boolean) => (
        <Tag color={converted ? "green" : "default"}>{converted ? "Có" : "Chưa"}</Tag>
      ),
    },
    {
      title: "Mã đơn",
      dataIndex: "orderId",
      key: "orderId",
      render: (orderId?: string) => (orderId ? `#${orderId.substring(0, 8)}` : "-"),
    },
  ];

  const payoutColumns: ColumnsType<Payout> = [
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <span className="font-bold text-green-600">{formatPrice(amount)}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const cfg = STATUS_LABELS[status] || { label: status, color: "default" };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Lý do từ chối",
      dataIndex: "reject_reason",
      key: "reject_reason",
      render: (reason: string | null) =>
        reason ? <span className="text-red-500 text-sm">{reason}</span> : "-",
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Hoàn thành",
      dataIndex: "completed_at",
      key: "completed_at",
      render: (date: string | null) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Affiliate Dashboard</h1>
        <p className="text-gray-600">Quản lý chương trình affiliate của bạn</p>
      </div>

      <Tabs defaultActiveKey="overview" size="large">
        {/* Tab Tổng quan */}
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <DollarOutlined />
              Tổng quan
            </span>
          }
          key="overview"
        >
          {/* Balance + Payout Card */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Số dư hiện tại</div>
                <div className="text-3xl font-bold text-green-600">
                  {formatPrice(balance)}
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  type="primary"
                  icon={<WalletOutlined />}
                  size="large"
                  onClick={() => {
                    if (!bankInfo) {
                      toast.warning("Vui lòng cập nhật thông tin ngân hàng trước");
                      return;
                    }
                    setPayoutAmount(balance);
                    setShowPayoutModal(true);
                  }}
                  disabled={balance < 200000}
                >
                  Rút tiền
                </Button>
                <Button
                  icon={<BankOutlined />}
                  onClick={() => setShowBankForm(true)}
                >
                  {bankInfo ? "Sửa thông tin NH" : "Cập nhật ngân hàng"}
                </Button>
              </div>
            </div>
          </Card>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <Statistic
                  title="Tổng hoa hồng"
                  value={stats.totalCommissions}
                  prefix="₫"
                />
              </Card>
              <Card>
                <Statistic
                  title="Lượt ghé thăm"
                  value={stats.totalVisits}
                  prefix={<EyeOutlined />}
                />
              </Card>
              <Card>
                <Statistic
                  title="Tỷ lệ chuyển đổi"
                  value={stats.conversionRate}
                  suffix="%"
                  precision={2}
                />
              </Card>
              <Card>
                <Statistic
                  title="Chuyển đổi thành công"
                  value={stats.totalConversions}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </div>
          )}

          <Card title="Thống kê chi tiết">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold">Hoa hồng chờ thanh toán:</span>
                <span className="text-lg font-bold text-orange-600">
                  {stats ? formatPrice(stats.pendingCommissions) : "0 ₫"}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold">Hoa hồng đã thanh toán:</span>
                <span className="text-lg font-bold text-green-600">
                  {stats ? formatPrice(stats.paidCommissions) : "0 ₫"}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold">Tổng lượt chuyển đổi:</span>
                <span className="text-lg font-bold">{stats?.totalConversions || 0}</span>
              </div>
            </div>
          </Card>
        </TabPane>

        {/* Tab Hoa hồng */}
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <DollarOutlined />
              Hoa hồng
            </span>
          }
          key="commissions"
        >
          <Card>
            <Alert
              message="Hoa hồng có thời gian chờ 7 ngày trước khi được Credit vào số dư"
              type="info"
              showIcon
              className="mb-4"
            />
            <Table
              columns={commissionColumns}
              dataSource={commissions}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        {/* Tab Rút tiền */}
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <WalletOutlined />
              Rút tiền
            </span>
          }
          key="payouts"
        >
          <Card>
            {payouts.length > 0 ? (
              <Table
                columns={payoutColumns}
                dataSource={payouts}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Empty description="Chưa có yêu cầu rút tiền nào" />
            )}
          </Card>
        </TabPane>

        {/* Tab Lượt ghé thăm */}
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <EyeOutlined />
              Lượt ghé thăm
            </span>
          }
          key="visits"
        >
          <Card>
            <Table
              columns={visitColumns}
              dataSource={visits}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        {/* Tab Trình tạo liên kết */}
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <LinkOutlined />
              Trình tạo liên kết
            </span>
          }
          key="links"
        >
          <Card title="Tạo link affiliate mới" className="mb-6">
            <Space direction="vertical" className="w-full" size="middle">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link tùy chỉnh (tùy chọn)
                </label>
                <Input
                  placeholder="vd: mylink"
                  value={customLink}
                  onChange={(e) => setCustomLink(e.target.value)}
                  addonBefore="ref="
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nếu để trống, hệ thống sẽ tự động tạo link
                </p>
              </div>
              <Button type="primary" onClick={handleCreateLink}>
                Tạo link
              </Button>
            </Space>
          </Card>

          <Card title="Danh sách link của bạn">
            <div className="space-y-4">
              {links.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    Chưa có link nào. Hãy tạo link đầu tiên của bạn!
                  </p>
                  <Button type="primary" onClick={handleCreateLink}>
                    Tạo link mặc định
                  </Button>
                </div>
              ) : (
                links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">
                        {link.customLink ? `Link tùy chỉnh: ${link.customLink}` : "Link mặc định"}
                      </div>
                      <div className="text-sm text-gray-600 break-all font-mono">{link.link}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Tạo ngày: {dayjs(link.createdAt).format("DD/MM/YYYY HH:mm")}
                      </div>
                    </div>
                    <Button icon={<CopyOutlined />} onClick={() => handleCopyLink(link.link)}>
                      Sao chép
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabPane>

        {/* Tab Cài đặt */}
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <SettingOutlined />
              Cài đặt
            </span>
          }
          key="settings"
        >
          {/* Bank Info */}
          <Card title="🏦 Thông tin ngân hàng" className="mb-6">
            {bankInfo ? (
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Chủ tài khoản">
                  {bankInfo.account_holder}
                </Descriptions.Item>
                <Descriptions.Item label="Số tài khoản">
                  {bankInfo.account_number}
                </Descriptions.Item>
                <Descriptions.Item label="Ngân hàng">
                  {bankInfo.bank_name}
                </Descriptions.Item>
                {bankInfo.bank_branch && (
                  <Descriptions.Item label="Chi nhánh">
                    {bankInfo.bank_branch}
                  </Descriptions.Item>
                )}
              </Descriptions>
            ) : (
              <Alert
                message="Chưa có thông tin ngân hàng"
                description="Vui lòng cập nhật thông tin ngân hàng để có thể rút tiền."
                type="warning"
                showIcon
              />
            )}
            <Button
              type="primary"
              className="mt-4"
              icon={<BankOutlined />}
              onClick={() => setShowBankForm(true)}
            >
              {bankInfo ? "Cập nhật thông tin" : "Thêm thông tin ngân hàng"}
            </Button>
          </Card>

          {/* Notification Settings */}
          <Card title="Cài đặt thông báo">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold">Nhận thông báo qua email</div>
                  <div className="text-sm text-gray-600">
                    Nhận thông báo về hoa hồng và thanh toán qua email
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <Button type="primary" onClick={handleUpdateSettings}>
                Lưu cài đặt
              </Button>
            </div>
          </Card>

          {/* Affiliate Info */}
          <Card title="Thông tin affiliate" className="mt-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <Tag color="green">Đã duyệt</Tag>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mức hoa hồng:</span>
                <span className="font-bold text-blue-600">
                  {affiliate.commissionRate || 20}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày đăng ký:</span>
                <span>{dayjs(affiliate.createdAt).format("DD/MM/YYYY")}</span>
              </div>
              {affiliate.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày duyệt:</span>
                  <span>{dayjs(affiliate.approvedAt).format("DD/MM/YYYY")}</span>
                </div>
              )}
            </div>
          </Card>
        </TabPane>
      </Tabs>

      {/* ═══ BANK INFO MODAL ═══ */}
      <Modal
        title="Thông tin ngân hàng"
        open={showBankForm}
        onCancel={() => setShowBankForm(false)}
        footer={null}
      >
        <Form form={bankForm} layout="vertical" onFinish={handleSaveBankInfo}>
          <Form.Item
            name="accountHolder"
            label="Chủ tài khoản"
            rules={[{ required: true, message: "Bắt buộc" }]}
          >
            <Input placeholder="NGUYEN VAN A" />
          </Form.Item>
          <Form.Item
            name="accountNumber"
            label="Số tài khoản"
            rules={[{ required: true, message: "Bắt buộc" }]}
          >
            <Input placeholder="1234567890" />
          </Form.Item>
          <Form.Item
            name="bankName"
            label="Tên ngân hàng"
            rules={[{ required: true, message: "Bắt buộc" }]}
          >
            <Input placeholder="Vietcombank" />
          </Form.Item>
          <Form.Item name="bankCode" label="Mã ngân hàng (cho VietQR)">
            <Input placeholder="VCB" />
          </Form.Item>
          <Form.Item name="bankBranch" label="Chi nhánh">
            <Input placeholder="Hồ Chí Minh" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Lưu thông tin
          </Button>
        </Form>
      </Modal>

      {/* ═══ PAYOUT REQUEST MODAL ═══ */}
      <Modal
        title="Yêu cầu rút tiền"
        open={showPayoutModal}
        onCancel={() => {
          setShowPayoutModal(false);
          setPayoutAmount(0);
        }}
        footer={[
          <Button key="cancel" onClick={() => setShowPayoutModal(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={payoutLoading}
            onClick={handleRequestPayout}
          >
            Gửi yêu cầu
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="text-sm text-gray-500">Số dư khả dụng</div>
            <div className="text-2xl font-bold text-green-600">{formatPrice(balance)}</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Số tiền muốn rút (VNĐ)</label>
            <InputNumber
              value={payoutAmount}
              onChange={(v) => setPayoutAmount(v || 0)}
              min={200000}
              max={balance}
              step={10000}
              style={{ width: "100%" }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ""))}
              addonAfter="VNĐ"
            />
            <p className="text-xs text-gray-500 mt-1">Tối thiểu 200,000đ</p>
          </div>

          {bankInfo && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <div className="font-semibold mb-1">Chuyển đến:</div>
              <div>
                {bankInfo.bank_name} — {bankInfo.account_number}
              </div>
              <div className="text-gray-500">{bankInfo.account_holder}</div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

PageAffiliate.Layout = MyProfileLayout;
