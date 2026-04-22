import { useEffect, useState } from "react";
import {
  Button,
  Table,
  Tag,
  Input,
  Space,
  Card,
  message,
  Modal,
  Descriptions,
  Tabs,
  Statistic,
  InputNumber,
  Row,
  Col,
  Tooltip,
  Select,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "../_layout";
import dayjs from "dayjs";
import {
  EyeOutlined,
  DollarOutlined,
  LinkOutlined,
  UserOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { formatPrice } from "@/pages/subscription/ui/subscription-plans/pricing";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { GetServerSideProps } from "next";



const { TabPane } = Tabs;
const { Option } = Select;

interface AffiliateUser {
  id: string;
  userId: string;
  user_id?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  customLink?: string;
  emailNotifications: boolean;
  email?: string;
  name?: string;
  commissionRate?: number;
  stats?: {
    totalLinks: number;
    totalVisits: number;
    totalConversions: number;
    totalCommissions: number;
    pendingCommissions: number;
  };
}

interface AffiliateDetail {
  affiliate: AffiliateUser;
  links: any[];
  commissions: any[];
  visits: any[];
}

export default function AffiliateUsersPage() {
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([]);
  const [filteredAffiliates, setFilteredAffiliates] = useState<AffiliateUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateUser | null>(null);
  const [affiliateDetail, setAffiliateDetail] = useState<AffiliateDetail | null>(null);
  const [customLink, setCustomLink] = useState("");
  const [commissionRate, setCommissionRate] = useState<number>(20);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchAffiliates();
  }, []);

  useEffect(() => {
    if (affiliates && affiliates.length >= 0) {
      filterAffiliates();
    }
  }, [affiliates, searchText, statusFilter]);

  const filterAffiliates = () => {
    if (!affiliates || !Array.isArray(affiliates)) {
      setFilteredAffiliates([]);
      return;
    }
    let filtered = [...affiliates];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(
        (a) =>
          a.userId.toLowerCase().includes(searchText.toLowerCase()) ||
          a.id.toLowerCase().includes(searchText.toLowerCase()) ||
          (a.customLink && a.customLink.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    setFilteredAffiliates(filtered);
  };

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/affiliate/users");
      const data = await res.json();

      if (data.success) {
        const affiliatesData = data.affiliates as AffiliateUser[];

        const enrichedAffiliates = affiliatesData.map((affiliate) => {
          const rawStatus = (affiliate as any).status as string;
          return {
            ...affiliate,
            userId: affiliate.userId || (affiliate as any).user_id,
            email: affiliate.email || (affiliate as any).user_email,
            name: affiliate.name || (affiliate as any).user_name,
            status: (rawStatus === "active" ? "approved" : rawStatus) as AffiliateUser["status"],
            commissionRate:
              affiliate.commissionRate !== undefined
                ? affiliate.commissionRate
                : (affiliate as any).commission_rate,
          };
        });

        setAffiliates(enrichedAffiliates);
        setFilteredAffiliates(enrichedAffiliates);
      } else {
        message.error("Không thể tải danh sách affiliate");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const fetchAffiliateDetail = async (affiliateId: string) => {
    try {
      const res = await fetch(`/api/admin/affiliate/detail?affiliateId=${affiliateId}`);
      const data = await res.json();

      if (!res.ok) {
        console.error("API Error:", data);
        message.error(data.message || data.error || "Không thể tải thông tin chi tiết");
        return;
      }

      if (data.success && data.affiliate) {
        let email = data.affiliate.email;
        let name = data.affiliate.name;

        // Also check if we have it in the list (fallback)
        if (!email) {
          const currentAffiliate = affiliates.find(a => a.id === affiliateId);
          if (currentAffiliate?.email) {
            email = currentAffiliate.email;
            name = currentAffiliate.name || name;
          }
        }

        const rawStatus = data.affiliate.status as string;
        setAffiliateDetail({
          affiliate: {
            ...data.affiliate,
            userId: data.affiliate.userId || data.affiliate.user_id,
            email,
            name,
            status: rawStatus === "active" ? "approved" : rawStatus,
            commissionRate:
              data.affiliate.commissionRate !== undefined
                ? data.affiliate.commissionRate
                : data.affiliate.commission_rate,
          },
          links: Array.isArray(data.links) ? data.links : [],
          commissions: Array.isArray(data.commissions) ? data.commissions : [],
          visits: Array.isArray(data.visits) ? data.visits : [],
        });
        setDetailModalVisible(true);
      } else {
        console.error("Invalid response format:", data);
        message.error(data.message || data.error || "Không thể tải thông tin chi tiết");
      }
    } catch (error) {
      console.error("Error fetching affiliate detail:", error);
      message.error("Có lỗi xảy ra khi tải thông tin chi tiết");
    }
  };

  const handlePayCommission = async (commissionId: string, affiliateId: string) => {
    try {
      const res = await fetch("/api/admin/affiliate/pay-commission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commissionId }),
      });

      const data = await res.json();

      if (data.success) {
        message.success("Thanh toán hoa hồng thành công");
        // Refresh affiliate detail to show updated status
        await fetchAffiliateDetail(affiliateId);
        // Refresh affiliates list to update stats
        await fetchAffiliates();
      } else {
        message.error(data.message || "Không thể thanh toán hoa hồng");
      }
    } catch (error) {
      console.error("Error paying commission:", error);
      message.error("Có lỗi xảy ra khi thanh toán");
    }
  };

  const handleApprove = async (affiliate: AffiliateUser) => {
    setSelectedAffiliate(affiliate);
    setCustomLink(affiliate.customLink || "");
    setCommissionRate(affiliate.commissionRate || 20);
    setModalVisible(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedAffiliate) return;

    try {
      const res = await fetch("/api/admin/affiliate/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          affiliateId: selectedAffiliate.id,
          customLink: customLink || undefined,
          commissionRate,
        }),
      });

      const data = await res.json();

      if (data.success) {
        message.success("Đã duyệt affiliate thành công");
        setModalVisible(false);
        fetchAffiliates();
      } else {
        message.error(data.error || "Duyệt thất bại");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const handleReject = async (affiliate: AffiliateUser) => {
    Modal.confirm({
      title: "Xác nhận từ chối",
      content: "Bạn có chắc chắn muốn từ chối affiliate này?",
      onOk: async () => {
        try {
          const res = await fetch("/api/admin/affiliate/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "reject",
              affiliateId: affiliate.id,
            }),
          });

          const data = await res.json();

          if (data.success) {
            message.success("Đã từ chối affiliate");
            fetchAffiliates();
          } else {
            message.error(data.error || "Từ chối thất bại");
          }
        } catch (error) {
          message.error("Có lỗi xảy ra");
        }
      },
    });
  };

  const columns: ColumnsType<AffiliateUser> = [
    {
      title: "Thông tin Affiliate",
      dataIndex: "userId",
      key: "userId",
      width: 250,
      render: (userId: string, record: AffiliateUser) => {
        const idToDisplay = userId || record.user_id;
        return (
          <div className="flex flex-col">
            <div className="font-semibold" style={{ color: "var(--admin-text-primary)" }}>{record.name || "N/A"}</div>
            {record.email && (
              <span className="text-xs font-semibold text-blue-600">{record.email}</span>
            )}
            <Tooltip title={idToDisplay}>
              <span className="font-mono text-xs mt-1" style={{ color: "var(--admin-text-secondary)" }}>ID: {idToDisplay?.substring(0, 12)}...</span>
            </Tooltip>
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
        const colors: Record<string, string> = {
          pending: "orange",
          approved: "green",
          rejected: "red",
        };
        const labels: Record<string, string> = {
          pending: "Chờ duyệt",
          approved: "Đã duyệt",
          rejected: "Đã từ chối",
        };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      },
    },
    {
      title: "Thống kê",
      key: "stats",
      width: 200,
      render: (_: any, record: AffiliateUser) => {
        if (!record.stats) return "-";
        return (
          <div className="text-xs space-y-1">
            <div>Links: <strong>{record.stats.totalLinks}</strong></div>
            <div>Visits: <strong>{record.stats.totalVisits}</strong></div>
            <div>Hoa hồng: <strong className="text-green-600">{formatPrice(record.stats.totalCommissions)}</strong></div>
          </div>
        );
      },
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Ngày duyệt",
      dataIndex: "approvedAt",
      key: "approvedAt",
      width: 150,
      render: (date?: string) => date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      render: (_: any, record: AffiliateUser) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => fetchAffiliateDetail(record.id)}
          >
            Chi tiết
          </Button>
          {record.status === "pending" && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleApprove(record)}
              >
                Duyệt
              </Button>
              <Button
                danger
                size="small"
                onClick={() => handleReject(record)}
              >
                Từ chối
              </Button>
            </>
          )}
          {record.status === "approved" && (
            <Button
              size="small"
              onClick={() => {
                setSelectedAffiliate(record);
                setCustomLink(record.customLink || "");
                setCommissionRate(record.commissionRate || 20);
                setModalVisible(true);
              }}
            >
              Sửa
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Card
        title={
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold m-0">Quản lý Affiliate Users</h1>
            <div className="text-sm mr-4" style={{ color: "var(--admin-text-secondary)" }}>
              Tổng số: <strong style={{ color: "var(--admin-text-primary)" }}>{filteredAffiliates?.length || 0}</strong>
            </div>
          </div>
        }
        extra={
          <Space>
            <Input
              placeholder="Tìm kiếm User ID, Affiliate ID..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            >
              <Option value="all">Tất cả</Option>
              <Option value="pending">Chờ duyệt</Option>
              <Option value="approved">Đã duyệt</Option>
              <Option value="rejected">Đã từ chối</Option>
            </Select>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredAffiliates}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 1000 }}
        />

        {/* Modal for Approve/Edit */}
        <Modal
          title={selectedAffiliate?.status === "approved" ? "Cập nhật affiliate" : "Duyệt affiliate"}
          open={modalVisible}
          onOk={handleConfirmApprove}
          onCancel={() => setModalVisible(false)}
          okText="Xác nhận"
          cancelText="Hủy"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--admin-text-primary)" }}>
                Link tùy chỉnh (tùy chọn)
              </label>
              <Input
                placeholder="vd: mylink"
                value={customLink}
                onChange={(e) => setCustomLink(e.target.value)}
                addonBefore="ref="
              />
              <p className="text-xs mt-1" style={{ color: "var(--admin-text-secondary)" }}>
                Nếu để trống, hệ thống sẽ tự động tạo link
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--admin-text-primary)" }}>
                Mức hoa hồng (%)
              </label>
              <InputNumber
                min={0}
                max={100}
                value={commissionRate}
                onChange={(val) => setCommissionRate(val || 0)}
                className="w-full"
                addonAfter="%"
              />
            </div>
          </div>
        </Modal>

        {/* Modal for Detail */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <UserOutlined />
              <span>Chi tiết Affiliate</span>
            </div>
          }
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          width={900}
        >
          {affiliateDetail && affiliateDetail.affiliate && (
            <div>
              <Tabs defaultActiveKey="info">
                <TabPane
                  tab={
                    <span className="flex items-center gap-2">
                      <UserOutlined />
                      Thông tin
                    </span>
                  }
                  key="info"
                >
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Affiliate ID">
                      <span className="font-mono text-xs">{affiliateDetail.affiliate.id}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="User ID">
                      <span className="font-mono text-xs">{affiliateDetail.affiliate.userId}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {affiliateDetail.affiliate.email || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mức hoa hồng">
                      <strong className="text-blue-600">{affiliateDetail.affiliate.commissionRate || 20}%</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      <Tag
                        color={
                          affiliateDetail.affiliate.status === "approved"
                            ? "green"
                            : affiliateDetail.affiliate.status === "pending"
                              ? "orange"
                              : "red"
                        }
                      >
                        {affiliateDetail.affiliate.status === "approved"
                          ? "Đã duyệt"
                          : affiliateDetail.affiliate.status === "pending"
                            ? "Chờ duyệt"
                            : "Đã từ chối"}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email Notifications">
                      {affiliateDetail.affiliate.emailNotifications ? "Bật" : "Tắt"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày đăng ký">
                      {dayjs(affiliateDetail.affiliate.createdAt).format("DD/MM/YYYY HH:mm:ss")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày duyệt">
                      {affiliateDetail.affiliate.approvedAt
                        ? dayjs(affiliateDetail.affiliate.approvedAt).format("DD/MM/YYYY HH:mm:ss")
                        : "-"}
                    </Descriptions.Item>
                  </Descriptions>

                  <Row gutter={16} className="mt-6">
                    <Col span={6}>
                      <Statistic
                        title="Tổng Links"
                        value={affiliateDetail.affiliate.stats?.totalLinks || 0}
                        prefix={<LinkOutlined />}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Tổng Visits"
                        value={affiliateDetail.affiliate.stats?.totalVisits || 0}
                        prefix={<EyeOutlined />}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Tổng Conversions"
                        value={affiliateDetail.affiliate.stats?.totalConversions || 0}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Tổng Hoa hồng"
                        value={affiliateDetail.affiliate.stats?.totalCommissions || 0}
                        prefix="₫"
                        valueStyle={{ color: "#3f8600" }}
                      />
                    </Col>
                  </Row>
                </TabPane>

                <TabPane
                  tab={
                    <span className="flex items-center gap-2">
                      <LinkOutlined />
                      Links ({affiliateDetail.links?.length || 0})
                    </span>
                  }
                  key="links"
                >
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {!affiliateDetail.links || affiliateDetail.links.length === 0 ? (
                      <p className="text-center py-4" style={{ color: "var(--admin-text-secondary)" }}>Chưa có link nào</p>
                    ) : (
                      affiliateDetail.links.map((link: any) => (
                        <div
                          key={link.id}
                          className="p-3 rounded"
                          style={{ background: "var(--admin-surface-hover)", border: "1px solid var(--admin-border)" }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm" style={{ color: "var(--admin-text-primary)" }}>
                                {link.customLink ? `Custom: ${link.customLink}` : "Default"}
                              </div>
                              <div className="text-xs font-mono break-all" style={{ color: "var(--admin-text-secondary)" }}>
                                {link.link}
                              </div>
                              <div className="text-xs mt-1" style={{ color: "var(--admin-text-secondary)" }}>
                                {dayjs(link.createdAt).format("DD/MM/YYYY HH:mm")}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabPane>

                <TabPane
                  tab={
                    <span className="flex items-center gap-2">
                      <DollarOutlined />
                      Commissions ({affiliateDetail.commissions?.length || 0})
                    </span>
                  }
                  key="commissions"
                >
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {!affiliateDetail.commissions || affiliateDetail.commissions.length === 0 ? (
                      <p className="text-center py-4" style={{ color: "var(--admin-text-secondary)" }}>Chưa có commission nào</p>
                    ) : (
                      affiliateDetail.commissions.map((commission: any) => (
                        <div
                          key={commission.id}
                          className="p-3 rounded"
                          style={{ background: "var(--admin-surface-hover)", border: "1px solid var(--admin-border)" }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm" style={{ color: "var(--admin-text-primary)" }}>
                                Order: #{(commission.orderId || commission.order_id)?.substring(0, 12)}...
                              </div>
                              <div className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>
                                Amount: {formatPrice(commission.amount)} | Commission:{" "}
                                <strong className="text-green-600">
                                  {formatPrice(commission.commissionAmount || commission.commission_amount)}
                                </strong>
                              </div>
                              <div className="text-xs mt-1 flex items-center gap-2" style={{ color: "var(--admin-text-secondary)" }}>
                                <span>
                                  {dayjs(commission.createdAt).format("DD/MM/YYYY HH:mm")}
                                </span>
                                <Tag
                                  color={
                                    commission.status === "paid"
                                      ? "green"
                                      : commission.status === "pending"
                                        ? "orange"
                                        : "red"
                                  }
                                  className="text-xs"
                                >
                                  {commission.status === "paid"
                                    ? "Đã thanh toán"
                                    : commission.status === "pending"
                                      ? "Chờ thanh toán"
                                      : "Đã hủy"}
                                </Tag>
                                {commission.status === "paid" && commission.paidAt && (
                                  <span className="text-gray-400">
                                    (Thanh toán: {dayjs(commission.paidAt).format("DD/MM/YYYY HH:mm")})
                                  </span>
                                )}
                              </div>
                            </div>
                            {commission.status === "pending" && (
                              <div className="ml-4">
                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={() => handlePayCommission(commission.id, affiliateDetail.affiliate.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Thanh toán
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabPane>
              </Tabs>
            </div>
          )}
        </Modal>
      </Card>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = withAdmin;

