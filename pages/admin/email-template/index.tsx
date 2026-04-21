import { useEffect, useState, useCallback } from "react";
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
    const [previewType, setPreviewType] = useState<"orderConfirmation" | "adminNotification">("orderConfirmation");
    const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [testEmailModal, setTestEmailModal] = useState(false);
    const [testEmail, setTestEmail] = useState("");
    const [sendingTest, setSendingTest] = useState(false);
    const [form] = Form.useForm();

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
    const handlePreview = useCallback(async (type: "orderConfirmation" | "adminNotification" = "orderConfirmation") => {
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
                body: JSON.stringify({ email: testEmail }),
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
                        <h2 style={{ margin: 0 }}>✉️ Email Template</h2>
                        <p style={{ margin: "4px 0 0", color: "#888", fontSize: 14 }}>
                            Quản lý nội dung và style email gửi cho học viên
                        </p>
                    </div>
                    <Space wrap>
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => handlePreview("orderConfirmation")}
                        >
                            Preview
                        </Button>
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
                    <Tabs
                        defaultActiveKey="brand"
                        items={[
                            {
                                key: "brand",
                                label: "🏢 Thương hiệu",
                                children: (
                                    <Card title="Thông tin thương hiệu" size="small">
                                        <Form.Item
                                            label="Tên thương hiệu"
                                            name={["brand", "name"]}
                                            rules={[{ required: true }]}
                                        >
                                            <Input placeholder="IELTS Prediction Test" />
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
                                            <Input placeholder="https://ieltspredictiontest.com" />
                                        </Form.Item>
                                        <Form.Item
                                            label="Số điện thoại"
                                            name={["brand", "phone"]}
                                            rules={[{ required: true }]}
                                        >
                                            <Input placeholder="0927090848" />
                                        </Form.Item>
                                        <Form.Item
                                            label="Email liên hệ"
                                            name={["brand", "email"]}
                                            rules={[{ required: true, type: "email" }]}
                                        >
                                            <Input placeholder="ieltsprediction9@gmail.com" />
                                        </Form.Item>
                                        <Form.Item
                                            label="Địa chỉ (tuỳ chọn)"
                                            name={["brand", "address"]}
                                        >
                                            <Input placeholder="15205 North Kierland Blvd." />
                                        </Form.Item>
                                    </Card>
                                ),
                            },
                            {
                                key: "orderConfirmation",
                                label: "📦 Email xác nhận đơn hàng",
                                children: (
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
                                            <Input placeholder="https://ieltspredictiontest.com" />
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
                                ),
                            },
                            {
                                key: "adminNotification",
                                label: "🔔 Email thông báo admin",
                                children: (
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
                                ),
                            },
                            {
                                key: "style",
                                label: "🎨 Giao diện",
                                children: (
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
                                ),
                            },
                            {
                                key: "variables",
                                label: "📋 Biến hỗ trợ",
                                children: (
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
                                ),
                            },
                        ]}
                    />
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
                title="📧 Gửi email test"
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
