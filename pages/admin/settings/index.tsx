import { useEffect, useState } from "react";
import { Card, Tabs, Form, Input, Button, message, Spin, Switch, InputNumber, Row, Col } from "antd";
import { SaveOutlined, SendOutlined } from "@ant-design/icons";
import AdminLayout from "../_layout";
import { withAdmin } from "@/shared/hoc/withAdmin";

const { TextArea } = Input;

type SettingsData = Record<string, Record<string, unknown>>;

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SettingsData>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [generalForm] = Form.useForm();
    const [emailForm] = Form.useForm();
    const [paymentForm] = Form.useForm();
    const [authForm] = Form.useForm();

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/settings");
            const json = await res.json();
            if (json.success) {
                setSettings(json.data);
                generalForm.setFieldsValue(json.data.general || {});
                emailForm.setFieldsValue(json.data.email || {});
                paymentForm.setFieldsValue(json.data.payment || {});
                authForm.setFieldsValue(json.data.auth || {});
            }
        } catch { message.error("Error loading settings"); }
        finally { setLoading(false); }
    };

    const saveSetting = async (key: string, form: ReturnType<typeof Form.useForm>[0]) => {
        try {
            const values = await form.validateFields();
            setSaving(true);
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value: values }),
            });
            const json = await res.json();
            if (json.success) message.success("Đã lưu");
            else message.error(json.error);
        } catch { message.error("Error"); }
        finally { setSaving(false); }
    };

    if (loading) return <AdminLayout><div className="flex items-center justify-center" style={{ minHeight: 400 }}><Spin size="large" /></div></AdminLayout>;

    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold mb-4">Cài đặt hệ thống</h1>
            <Tabs
                type="card"
                items={[
                    {
                        key: "general",
                        label: "Chung",
                        children: (
                            <Card>
                                <Form form={generalForm} layout="vertical">
                                    <Row gutter={16}>
                                        <Col span={12}><Form.Item name="site_name" label="Tên trang"><Input /></Form.Item></Col>
                                        <Col span={12}><Form.Item name="site_url" label="URL"><Input /></Form.Item></Col>
                                    </Row>
                                    <Row gutter={16}>
                                        <Col span={12}><Form.Item name="logo_url" label="Logo URL"><Input /></Form.Item></Col>
                                        <Col span={12}><Form.Item name="favicon_url" label="Favicon URL"><Input /></Form.Item></Col>
                                    </Row>
                                    <Form.Item name="seo_title" label="SEO Title mặc định"><Input /></Form.Item>
                                    <Form.Item name="seo_description" label="SEO Description mặc định"><TextArea rows={2} /></Form.Item>
                                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => saveSetting("general", generalForm)}>Lưu</Button>
                                </Form>
                            </Card>
                        ),
                    },
                    {
                        key: "email",
                        label: "Email (SMTP)",
                        children: (
                            <Card>
                                <Form form={emailForm} layout="vertical">
                                    <Row gutter={16}>
                                        <Col span={12}><Form.Item name="smtp_host" label="SMTP Host"><Input placeholder="smtp.gmail.com" /></Form.Item></Col>
                                        <Col span={6}><Form.Item name="smtp_port" label="Port"><InputNumber className="w-full" placeholder="587" /></Form.Item></Col>
                                        <Col span={6}><Form.Item name="smtp_secure" label="Secure" valuePropName="checked"><Switch /></Form.Item></Col>
                                    </Row>
                                    <Row gutter={16}>
                                        <Col span={12}><Form.Item name="smtp_user" label="Username"><Input /></Form.Item></Col>
                                        <Col span={12}><Form.Item name="smtp_pass" label="Password"><Input.Password /></Form.Item></Col>
                                    </Row>
                                    <Form.Item name="from_email" label="From Email"><Input placeholder="noreply@example.com" /></Form.Item>
                                    <Form.Item name="from_name" label="From Name"><Input placeholder="IELTS Prediction" /></Form.Item>
                                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => saveSetting("email", emailForm)}>Lưu</Button>
                                </Form>
                            </Card>
                        ),
                    },
                    {
                        key: "payment",
                        label: "Thanh toán",
                        children: (
                            <Card>
                                <Form form={paymentForm} layout="vertical">
                                    <Form.Item name="sepay_account_number" label="Số tài khoản Sepay"><Input /></Form.Item>
                                    <Form.Item name="sepay_bank" label="Ngân hàng"><Input /></Form.Item>
                                    <Form.Item name="sepay_account_name" label="Chủ tài khoản"><Input /></Form.Item>
                                    <Form.Item name="sepay_webhook_secret" label="Webhook Secret"><Input.Password /></Form.Item>
                                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => saveSetting("payment", paymentForm)}>Lưu</Button>
                                </Form>
                            </Card>
                        ),
                    },
                    {
                        key: "auth",
                        label: "Auth",
                        children: (
                            <Card>
                                <Form form={authForm} layout="vertical">
                                    <Form.Item name="google_client_id" label="Google OAuth Client ID"><Input /></Form.Item>
                                    <Form.Item name="supabase_url" label="Supabase URL"><Input disabled /></Form.Item>
                                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => saveSetting("auth", authForm)}>Lưu</Button>
                                </Form>
                            </Card>
                        ),
                    },
                ]}
            />
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
