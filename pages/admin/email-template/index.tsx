import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import {
    Button,
    Input,
    Form,
    Card,
    Collapse,
    message,
    Tabs,
    Tag,
    Table,
    Space,
    Modal,
    Divider,
    ColorPicker,
} from "antd";
import {
    SendOutlined,
    EyeOutlined,
    SaveOutlined,
    DesktopOutlined,
    MobileOutlined,
    InfoCircleOutlined,
    MailOutlined,
} from "@ant-design/icons";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { ImageUpload } from "@/shared/ui/image-upload";

const { TextArea } = Input;
const { Panel } = Collapse;

// ── Template Variables Reference ──────────────────────────────────────────
const TEMPLATE_VARIABLES = [
    { variable: "{{customerName}}", description: "Tên học viên" },
    { variable: "{{orderId}}", description: "Mã đơn hàng" },
    { variable: "{{amount}}", description: "Số tiền (formatted VND)" },
    { variable: "{{duration}}", description: "Thời hạn Pro (tháng)" },
    { variable: "{{purchaseDate}}", description: "Ngày mua hàng" },
    { variable: "{{currentYear}}", description: "Năm hiện tại" },
    { variable: "{{brandName}}", description: "Tên thương hiệu" },
    { variable: "{{brandPhone}}", description: "Số điện thoại" },
    { variable: "{{brandEmail}}", description: "Email liên hệ" },
    { variable: "{{brandWebsite}}", description: "Website" },
    { variable: "{{customerEmail}}", description: "Email khách hàng" },
    { variable: "{{affiliateName}}", description: "Tên Affiliate" },
    { variable: "{{affiliateEmail}}", description: "Email Affiliate" },
    { variable: "{{commissionAmount}}", description: "Số tiền hoa hồng" },
    { variable: "{{orderTotal}}", description: "Tổng giá trị đơn hàng" },
    { variable: "{{payoutAmount}}", description: "Số tiền yêu cầu rút" },
    { variable: "{{customLink}}", description: "Link affiliate riêng" },
];

const variableColumns = [
    {
        title: "Biến",
        dataIndex: "variable",
        key: "variable",
        render: (text: string) => (
            <Tag
                color="blue"
                style={{ cursor: "pointer", fontFamily: "monospace" }}
                onClick={() => {
                    navigator.clipboard.writeText(text);
                    message.success(`Đã copy: ${text}`);
                }}
            >
                {text}
            </Tag>
        ),
    },
    {
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
    },
];

function EmailTemplatePage() {
    const [saving, setSaving] = useState(false);
    const [previewHtml, setPreviewHtml] = useState("");
    const [previewType, setPreviewType] = useState<
        "orderConfirmation" | "adminNotification" | "affiliateRegistered" | "affiliateApproved" | "affiliateRejected" | "newCommission" | "payoutRequest" | "payoutRejected" | "payoutCompleted"
    >("orderConfirmation");
    const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [testEmailModal, setTestEmailModal] = useState(false);
    const [testEmail, setTestEmail] = useState("");
    const [sendingTest, setSendingTest] = useState(false);
    const [form] = Form.useForm();
    const router = useRouter();

    const activeTab = (router.query.tab as string) || "brand";

    const handleTabChange = (key: string) => {
        router.push(
            {
                pathname: router.pathname,
                query: { ...router.query, tab: key },
            },
            undefined,
            { shallow: true },
        );
    };

    // ── Fetch config ──────────────────────────────────────────────────────
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/admin/email-template");
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        form.setFieldsValue(data);
                    }
                }
            } catch {
                message.error("Error loading email template config");
            }
        };
        fetchConfig();
    }, [form]);

    // ── Save ──────────────────────────────────────────────────────────────
    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);
            const res = await fetch("/api/admin/email-template", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (res.ok) {
                message.success("Đã lưu Email Template thành công!");
            } else {
                const err = await res.json();
                message.error(err.error || "Lưu thất bại");
            }
        } catch {
            message.error("Vui lòng kiểm tra lại các trường bắt buộc");
        } finally {
            setSaving(false);
        }
    };

    // ── Preview ───────────────────────────────────────────────────────────
    const handlePreview = useCallback(async (type: "orderConfirmation" | "adminNotification" | "affiliateRegistered" | "affiliateApproved" | "affiliateRejected" | "newCommission" | "payoutRequest" | "payoutRejected" | "payoutCompleted" = "orderConfirmation") => {
        try {
            const values = form.getFieldsValue(true);
            setPreviewType(type);
            const res = await fetch("/api/admin/email-template/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config: values, type }),
            });
            const data = await res.json();
            if (data.success) {
                setPreviewHtml(data.html);
                setPreviewModalOpen(true);
            } else {
                message.error("Không thể tạo preview");
            }
        } catch {
            message.error("Error generating preview");
        }
    }, [form]);

    // ── Send Test Email ───────────────────────────────────────────────────
    const handleSendTest = async () => {
        if (!testEmail) {
            message.error("Vui lòng nhập email");
            return;
        }
        try {
            setSendingTest(true);
            const res = await fetch("/api/admin/email-template/send-test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: testEmail, 
                    type: activeTab 
                }),
            });
            const data = await res.json();
            if (data.success) {
                message.success(`Đã gửi test email tới ${testEmail}`);
                setTestEmailModal(false);
                setTestEmail("");
            } else {
                message.error(data.error || "Gửi email thất bại");
            }
        } catch {
            message.error("Error sending test email");
        } finally {
            setSendingTest(false);
        }
    };

    return (
        <AdminLayout>
            <div style={{ maxWidth: 960, margin: "0 auto" }}>
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 24,
                        flexWrap: "wrap",
                        gap: 12,
                    }}
                >
                    <div>
                        <h2 style={{ display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
                            <MailOutlined /> Email Template
                        </h2>
                        <p style={{ margin: "4px 0 0", color: "#888", fontSize: 14 }}>
                            Quản lý nội dung và style email gửi cho học viên
                        </p>
                    </div>
                    <Space wrap>
                        {["orderConfirmation", "adminNotification", "affiliateRegistered", "affiliateApproved", "affiliateRejected", "newCommission", "payoutRequest", "payoutRejected", "payoutCompleted"].includes(activeTab) && (
                            <Button
                                icon={<EyeOutlined />}
                                onClick={() => handlePreview(activeTab as any)}
                            >
                                Preview
                            </Button>
                        )}
                        <Button
                            icon={<SendOutlined />}
                            onClick={() => setTestEmailModal(true)}
                        >
                            Gửi test email
                        </Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleSave}
                            loading={saving}
                        >
                            Lưu thay đổi
                        </Button>
                    </Space>
                </div>

                <Form form={form} layout="vertical" autoComplete="off">
                    {activeTab === "brand" && (
                        <Card title="Thông tin thương hiệu" size="small">
                            <Form.Item
                                label="Tên thương hiệu"
                                name={["brand", "name"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Vit IELTS" />
                            </Form.Item>
                            <Form.Item
                                label="Logo URL"
                                name={["brand", "logoUrl"]}
                                extra="Để trống nếu muốn hiển thị tên brand dạng text"
                            >
                                <ImageUpload label="" />
                            </Form.Item>
                            <Form.Item
                                label="Website"
                                name={["brand", "website"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="https://vitielts.com" />
                            </Form.Item>
                            <Form.Item
                                label="Số điện thoại"
                                name={["brand", "phone"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="0326752732" />
                            </Form.Item>
                            <Form.Item
                                label="Email liên hệ"
                                name={["brand", "email"]}
                                rules={[{ required: true, type: "email" }]}
                            >
                                <Input placeholder="vitielts9@gmail.com" />
                            </Form.Item>
                            <Form.Item
                                label="Địa chỉ (tuỳ chọn)"
                                name={["brand", "address"]}
                            >
                                <Input placeholder="15205 North Kierland Blvd." />
                            </Form.Item>
                        </Card>
                    )}

                    {activeTab === "orderConfirmation" && (
                        <Card
                            title="Email gửi cho học viên sau khi thanh toán"
                            size="small"
                            extra={
                                <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => handlePreview("orderConfirmation")}
                                >
                                    Preview
                                </Button>
                            }
                        >
                            <Form.Item
                                label="Subject (tiêu đề email)"
                                name={["orderConfirmation", "subject"]}
                                rules={[{ required: true }]}
                                extra="Hỗ trợ biến: {{orderId}}, {{customerName}}"
                            >
                                <Input placeholder="Thanh toán thành công - Đơn hàng {{orderId}}" />
                            </Form.Item>
                            <Form.Item
                                label="Tiêu đề hiển thị trong email"
                                name={["orderConfirmation", "headerTitle"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Những điều tốt đẹp đang đến với bạn!" />
                            </Form.Item>
                            <Form.Item
                                label="Lời chào"
                                name={["orderConfirmation", "greeting"]}
                                rules={[{ required: true }]}
                                extra="Dùng {{customerName}} để hiển thị tên học viên"
                            >
                                <Input placeholder="Xin chào {{customerName}}," />
                            </Form.Item>
                            <Form.Item
                                label="Nội dung chính"
                                name={["orderConfirmation", "bodyHtml"]}
                                rules={[{ required: true }]}
                                extra="Hỗ trợ HTML. Mỗi dòng sẽ thành 1 đoạn văn."
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Chúng tôi đã xử lý thành công đơn hàng của bạn..."
                                />
                            </Form.Item>
                            <Form.Item
                                label="Tiêu đề bảng đơn hàng"
                                name={["orderConfirmation", "orderTableTitle"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Tóm tắt đơn hàng" />
                            </Form.Item>
                            <Form.Item
                                label="Nội dung kết thúc (sau bảng đơn hàng)"
                                name={["orderConfirmation", "closingHtml"]}
                                rules={[{ required: true }]}
                                extra="Hỗ trợ HTML. Thông báo kích hoạt Pro, v.v."
                            >
                                <TextArea
                                    rows={3}
                                    placeholder='Tài khoản <strong>Pro</strong> của bạn đã được kích hoạt thành công.'
                                />
                            </Form.Item>

                            <Divider orientation="left">Nút CTA (tuỳ chọn)</Divider>
                            <Form.Item
                                label="Text nút"
                                name={["orderConfirmation", "ctaButton", "text"]}
                            >
                                <Input placeholder="Bắt đầu học ngay" />
                            </Form.Item>
                            <Form.Item
                                label="Link nút"
                                name={["orderConfirmation", "ctaButton", "link"]}
                            >
                                <Input placeholder="https://vitielts.com" />
                            </Form.Item>

                            <Divider orientation="left">Footer</Divider>
                            <Form.Item
                                label="Footer text"
                                name={["orderConfirmation", "footerText"]}
                                rules={[{ required: true }]}
                            >
                                <TextArea
                                    rows={2}
                                    placeholder="Nếu bạn cần hỗ trợ, vui lòng liên hệ..."
                                />
                            </Form.Item>
                        </Card>
                    )}

                    {activeTab === "adminNotification" && (
                        <Card
                            title="Email thông báo đơn hàng mới cho admin"
                            size="small"
                            extra={
                                <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => handlePreview("adminNotification")}
                                >
                                    Preview
                                </Button>
                            }
                        >
                            <Form.Item
                                label="Subject"
                                name={["adminNotification", "subject"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="[Admin] Thanh toán thành công - Đơn hàng {{orderId}}" />
                            </Form.Item>
                            <Form.Item
                                label="Tiêu đề hiển thị"
                                name={["adminNotification", "headerTitle"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Thông báo đơn hàng mới" />
                            </Form.Item>
                            <Form.Item
                                label="Nội dung"
                                name={["adminNotification", "bodyHtml"]}
                                rules={[{ required: true }]}
                            >
                                <TextArea
                                    rows={3}
                                    placeholder="Xác nhận thanh toán thành công!"
                                />
                            </Form.Item>
                        </Card>
                    )}

                    {activeTab === "affiliateRegistered" && (
                        <Card
                            title="Email báo cho Admin khi có người đăng ký Affiliate mới"
                            size="small"
                            extra={
                                <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => handlePreview("affiliateRegistered")}
                                >
                                    Preview
                                </Button>
                            }
                        >
                            <Form.Item
                                label="Subject"
                                name={["affiliateRegistered", "subject"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="[Admin] Có người đăng ký Affiliate mới - {{affiliateName}}" />
                            </Form.Item>
                            <Form.Item
                                label="Tiêu đề hiển thị"
                                name={["affiliateRegistered", "headerTitle"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Đơn đăng ký Affiliate mới" />
                            </Form.Item>
                            <Form.Item
                                label="Nội dung"
                                name={["affiliateRegistered", "bodyHtml"]}
                                rules={[{ required: true }]}
                            >
                                <TextArea rows={4} />
                            </Form.Item>
                        </Card>
                    )}

                    {activeTab === "affiliateApproval" && (
                        <Card
                            title="Email gửi khi duyệt yêu cầu làm Affiliate"
                            size="small"
                            extra={
                                <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => handlePreview("affiliateApproved")}
                                >
                                    Preview
                                </Button>
                            }
                        >
                            <Form.Item
                                label="Subject"
                                name={["affiliateApproved", "subject"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Chúc mừng! Đơn đăng ký Affiliate của bạn đã được duyệt" />
                            </Form.Item>
                            <Form.Item
                                label="Tiêu đề hiển thị"
                                name={["affiliateApproved", "headerTitle"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Chào mừng bạn gia nhập đội ngũ đối tác" />
                            </Form.Item>
                            <Form.Item
                                label="Nội dung"
                                name={["affiliateApproved", "bodyHtml"]}
                                rules={[{ required: true }]}
                                extra="Dùng {{affiliateName}} để hiển thị tên"
                            >
                                <TextArea rows={4} />
                            </Form.Item>
                            <Divider orientation="left">Nút CTA</Divider>
                            <Form.Item label="Text nút" name={["affiliateApproved", "ctaButton", "text"]}>
                                <Input placeholder="Bảng điều khiển Affiliate" />
                            </Form.Item>
                            <Form.Item label="Link nút" name={["affiliateApproved", "ctaButton", "link"]}>
                                <Input placeholder="https://vitielts.com/account/affiliate" />
                            </Form.Item>
                        </Card>
                    )}

                    {activeTab === "affiliateRejection" && (
                        <Card
                            title="Email gửi khi từ chối yêu cầu làm Affiliate"
                            size="small"
                            extra={
                                <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => handlePreview("affiliateRejected")}
                                >
                                    Preview
                                </Button>
                            }
                        >
                            <Form.Item
                                label="Subject"
                                name={["affiliateRejected", "subject"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Thông tin về đơn đăng ký Affiliate của bạn" />
                            </Form.Item>
                            <Form.Item
                                label="Tiêu đề hiển thị"
                                name={["affiliateRejected", "headerTitle"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Cảm ơn bạn đã quan tâm" />
                            </Form.Item>
                            <Form.Item
                                label="Nội dung"
                                name={["affiliateRejected", "bodyHtml"]}
                                rules={[{ required: true }]}
                            >
                                <TextArea rows={4} />
                            </Form.Item>
                        </Card>
                    )}

                    {activeTab === "newCommission" && (
                        <Card
                            title="Email gửi cho Affiliate khi có hoa hồng mới"
                            size="small"
                            extra={
                                <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => handlePreview("newCommission")}
                                >
                                    Preview
                                </Button>
                            }
                        >
                            <Form.Item
                                label="Subject"
                                name={["newCommission", "subject"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Chúc mừng! Bạn vừa nhận được hoa hồng mới" />
                            </Form.Item>
                            <Form.Item
                                label="Tiêu đề hiển thị"
                                name={["newCommission", "headerTitle"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Bạn vừa kiếm được hoa hồng!" />
                            </Form.Item>
                            <Form.Item
                                label="Nội dung"
                                name={["newCommission", "bodyHtml"]}
                                rules={[{ required: true }]}
                                extra="Hỗ trợ: {{orderId}}, {{orderTotal}}, {{commissionAmount}}"
                            >
                                <TextArea rows={5} />
                            </Form.Item>
                            <Divider orientation="left">Nút CTA</Divider>
                            <Form.Item label="Text nút" name={["newCommission", "ctaButton", "text"]}>
                                <Input placeholder="Xem lịch sử hoa hồng" />
                            </Form.Item>
                            <Form.Item label="Link nút" name={["newCommission", "ctaButton", "link"]}>
                                <Input placeholder="https://vitielts.com/account/affiliate" />
                            </Form.Item>
                        </Card>
                    )}

                    {activeTab === "payoutRequest" && (
                        <Card
                            title="Email báo cho Admin khi có yêu cầu rút tiền"
                            size="small"
                            extra={
                                <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => handlePreview("payoutRequest")}
                                >
                                    Preview
                                </Button>
                            }
                        >
                            <Form.Item
                                label="Subject"
                                name={["payoutRequest", "subject"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="[Admin] Yêu cầu rút tiền mới từ {{affiliateName}}" />
                            </Form.Item>
                            <Form.Item
                                label="Tiêu đề hiển thị"
                                name={["payoutRequest", "headerTitle"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Yêu cầu rút tiền mới" />
                            </Form.Item>
                            <Form.Item
                                label="Nội dung"
                                name={["payoutRequest", "bodyHtml"]}
                                rules={[{ required: true }]}
                            >
                                <TextArea rows={4} />
                            </Form.Item>
                        </Card>
                    )}

                    {activeTab === "payoutRejected" && (
                        <Card
                            title="Email gửi khi từ chối yêu cầu rút tiền"
                            size="small"
                            extra={
                                <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => handlePreview("payoutRejected")}
                                >
                                    Preview
                                </Button>
                            }
                        >
                            <Form.Item
                                label="Subject"
                                name={["payoutRejected", "subject"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Thông tin về yêu cầu rút tiền của bạn" />
                            </Form.Item>
                            <Form.Item
                                label="Tiêu đề hiển thị"
                                name={["payoutRejected", "headerTitle"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Cập nhật yêu cầu rút tiền" />
                            </Form.Item>
                            <Form.Item
                                label="Nội dung"
                                name={["payoutRejected", "bodyHtml"]}
                                rules={[{ required: true }]}
                                extra="Hỗ trợ: {{payoutAmount}}, {{rejectReason}}"
                            >
                                <TextArea rows={4} />
                            </Form.Item>
                        </Card>
                    )}

                    {activeTab === "payoutCompleted" && (
                        <Card
                            title="Email gửi khi thanh toán thành công payout"
                            size="small"
                            extra={
                                <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => handlePreview("payoutCompleted")}
                                >
                                    Preview
                                </Button>
                            }
                        >
                            <Form.Item
                                label="Subject"
                                name={["payoutCompleted", "subject"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Chúc mừng! Yêu cầu rút tiền của bạn đã được thanh toán" />
                            </Form.Item>
                            <Form.Item
                                label="Tiêu đề hiển thị"
                                name={["payoutCompleted", "headerTitle"]}
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Thanh toán thành công" />
                            </Form.Item>
                            <Form.Item
                                label="Nội dung"
                                name={["payoutCompleted", "bodyHtml"]}
                                rules={[{ required: true }]}
                                extra="Hỗ trợ: {{payoutAmount}}"
                            >
                                <TextArea rows={4} />
                            </Form.Item>
                        </Card>
                    )}

                    {activeTab === "style" && (
                        <Card title="Cài đặt màu sắc email" size="small">
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 16,
                                }}
                            >
                                <Form.Item
                                    label="Header Background"
                                    name={["style", "headerBgColor"]}
                                    rules={[{ required: true }]}
                                >
                                    <Input placeholder="#D94A56" />
                                </Form.Item>
                                <Form.Item
                                    label="Header Gradient"
                                    name={["style", "headerBgGradient"]}
                                    rules={[{ required: true }]}
                                >
                                    <Input placeholder="linear-gradient(135deg, #D94A56 0%, #c62828 100%)" />
                                </Form.Item>
                                <Form.Item
                                    label="Body Background"
                                    name={["style", "bodyBgColor"]}
                                    rules={[{ required: true }]}
                                >
                                    <Input placeholder="#f4f6f8" />
                                </Form.Item>
                                <Form.Item
                                    label="Content Background"
                                    name={["style", "contentBgColor"]}
                                    rules={[{ required: true }]}
                                >
                                    <Input placeholder="#ffffff" />
                                </Form.Item>
                                <Form.Item
                                    label="Primary Color (buttons, links)"
                                    name={["style", "primaryColor"]}
                                    rules={[{ required: true }]}
                                >
                                    <Input placeholder="#D94A56" />
                                </Form.Item>
                                <Form.Item
                                    label="Text Color"
                                    name={["style", "textColor"]}
                                    rules={[{ required: true }]}
                                >
                                    <Input placeholder="#333333" />
                                </Form.Item>
                                <Form.Item
                                    label="Footer Background"
                                    name={["style", "footerBgColor"]}
                                    rules={[{ required: true }]}
                                >
                                    <Input placeholder="#2D3142" />
                                </Form.Item>
                                <Form.Item
                                    label="Footer Text Color"
                                    name={["style", "footerTextColor"]}
                                    rules={[{ required: true }]}
                                >
                                    <Input placeholder="#ffffff" />
                                </Form.Item>
                            </div>
                        </Card>
                    )}

                    {activeTab === "variables" && (
                        <Card
                            title={
                                <Space>
                                    <InfoCircleOutlined />
                                    <span>
                                        Danh sách biến động — Nhấn vào biến để copy
                                    </span>
                                </Space>
                            }
                            size="small"
                        >
                            <p style={{ color: "#888", marginBottom: 16 }}>
                                Sử dụng các biến bên dưới trong Subject, Greeting,
                                Body Content, Closing để tự động điền thông tin.
                            </p>
                            <Table
                                dataSource={TEMPLATE_VARIABLES}
                                columns={variableColumns}
                                pagination={false}
                                size="small"
                                rowKey="variable"
                            />
                        </Card>
                    )}
                </Form>
            </div>

            {/* ── Preview Modal ── */}
            <Modal
                title={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 24 }}>
                        <span>
                            Preview
                        </span>
                        <Space>
                            <Button
                                size="small"
                                type={previewDevice === "desktop" ? "primary" : "default"}
                                icon={<DesktopOutlined />}
                                onClick={() => setPreviewDevice("desktop")}
                            >
                                Desktop
                            </Button>
                            <Button
                                size="small"
                                type={previewDevice === "mobile" ? "primary" : "default"}
                                icon={<MobileOutlined />}
                                onClick={() => setPreviewDevice("mobile")}
                            >
                                Mobile
                            </Button>
                        </Space>
                    </div>
                }
                open={previewModalOpen}
                onCancel={() => setPreviewModalOpen(false)}
                footer={null}
                width={previewDevice === "desktop" ? 720 : 420}
                centered
            >
                <div
                    style={{
                        border: "1px solid #e8e8e8",
                        borderRadius: 8,
                        overflow: "hidden",
                        maxHeight: "70vh",
                        overflowY: "auto",
                    }}
                >
                    <iframe
                        srcDoc={previewHtml}
                        style={{
                            width: "100%",
                            height: 600,
                            border: "none",
                        }}
                        title="Email Preview"
                    />
                </div>
            </Modal>

            {/* ── Send Test Email Modal ── */}
            <Modal
                title={
                    <Space>
                        <MailOutlined />
                        <span>Gửi email test</span>
                    </Space>
                }
                open={testEmailModal}
                onCancel={() => setTestEmailModal(false)}
                onOk={handleSendTest}
                okText="Gửi"
                confirmLoading={sendingTest}
                okButtonProps={{ icon: <SendOutlined /> }}
            >
                <p style={{ color: "#888", marginBottom: 16 }}>
                    Gửi một email test sử dụng template hiện tại (đã lưu trong
                    database). Hãy lưu thay đổi trước khi gửi test.
                </p>
                <Input
                    placeholder="Nhập email nhận test..."
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    onPressEnter={handleSendTest}
                    type="email"
                    size="large"
                />
            </Modal>
        </AdminLayout>
    );
}

export default EmailTemplatePage;
export const getServerSideProps = withAdmin;
