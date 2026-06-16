import { useEffect, useState, useCallback } from "react";
import {
    Form, Input, Button, Table, Space, Tag, Switch, Select,
    Modal, Popconfirm, message, Tabs, Tooltip, Statistic,
} from "antd";
import {
    GlobalOutlined, LinkOutlined, PlusOutlined,
    DeleteOutlined, EditOutlined, SaveOutlined,
    ReloadOutlined, SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "../_layout";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { AdminPageHeader, AdminGlassCard } from "@/widgets/admin";
import { ImageUpload } from "@/shared/ui/image-upload";

const { TextArea } = Input;

type SeoConfig = {
    siteTitle: string;
    titleSuffix: string;
    defaultDescription: string;
    ogImage: string;
    robotsTxt: string;
    googleVerification: string;
    bingVerification: string;
    facebookVerification?: string;
    gtmId?: string;
    fbAppId?: string;
    keywords?: string;
    author?: string;
};

type RedirectRule = {
    id: string;
    source_path: string;
    target_path: string;
    status_code: number;
    is_active: boolean;
    hits: number;
    created_at: string;
};

export default function SeoManagerPage() {
    const [seoForm] = Form.useForm();
    const [redirectForm] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [redirects, setRedirects] = useState<RedirectRule[]>([]);
    const [redirectsCount, setRedirectsCount] = useState(0);
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeTab, setActiveTab] = useState("config");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);

            const res = await fetch(`/api/admin/seo?${params}`);
            const json = await res.json();

            if (json.success) {
                seoForm.setFieldsValue(json.seoConfig);
                setRedirects(json.redirects);
                setRedirectsCount(json.redirectsCount);
            }
        } catch {
            message.error("Lỗi khi tải dữ liệu SEO");
        } finally {
            setLoading(false);
        }
    }, [search, seoForm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Save SEO Config ──
    const handleSaveConfig = async () => {
        try {
            const values = await seoForm.validateFields();
            setSaving(true);

            const res = await fetch("/api/admin/seo?action=saveConfig", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            const json = await res.json();

            if (json.success) {
                message.success("Đã lưu cấu hình SEO");
            } else {
                message.error(json.error || "Lỗi khi lưu");
            }
        } catch {
            message.error("Lỗi khi lưu cấu hình SEO");
        } finally {
            setSaving(false);
        }
    };

    // ── Create Redirect ──
    const handleCreateRedirect = async () => {
        try {
            const values = await redirectForm.validateFields();

            const res = await fetch("/api/admin/seo?action=createRedirect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            const json = await res.json();

            if (json.success) {
                message.success("Đã tạo redirect");
                redirectForm.resetFields();
                setShowAddModal(false);
                fetchData();
            } else {
                message.error(json.error || "Lỗi khi tạo redirect");
            }
        } catch {
            message.error("Vui lòng nhập đủ thông tin");
        }
    };

    // ── Toggle redirect ──
    const handleToggleRedirect = async (id: string, isActive: boolean) => {
        try {
            const res = await fetch(`/api/admin/seo?action=updateRedirect&id=${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: isActive }),
            });
            if ((await res.json()).success) {
                fetchData();
            }
        } catch {
            message.error("Lỗi khi cập nhật redirect");
        }
    };

    // ── Delete redirect ──
    const handleDeleteRedirect = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/seo?id=${id}`, { method: "DELETE" });
            if ((await res.json()).success) {
                message.success("Đã xóa redirect");
                fetchData();
            }
        } catch {
            message.error("Lỗi khi xóa redirect");
        }
    };

    const redirectColumns: ColumnsType<RedirectRule> = [
        {
            title: "Source",
            dataIndex: "source_path",
            key: "source_path",
            render: (p: string) => (
                <code style={{ fontSize: 12, background: "rgba(0,0,0,0.06)", padding: "2px 6px", borderRadius: 4 }}>
                    {p}
                </code>
            ),
        },
        {
            title: "Target",
            dataIndex: "target_path",
            key: "target_path",
            render: (p: string) => (
                <code style={{ fontSize: 12, background: "rgba(0,0,0,0.06)", padding: "2px 6px", borderRadius: 4 }}>
                    {p}
                </code>
            ),
        },
        {
            title: "Status",
            dataIndex: "status_code",
            key: "status_code",
            width: 80,
            render: (code: number) => (
                <Tag color={code === 301 ? "blue" : "orange"}>{code}</Tag>
            ),
        },
        {
            title: "Hits",
            dataIndex: "hits",
            key: "hits",
            width: 70,
            render: (hits: number) => hits.toLocaleString(),
        },
        {
            title: "Active",
            dataIndex: "is_active",
            key: "is_active",
            width: 80,
            render: (active: boolean, record) => (
                <Switch
                    checked={active}
                    size="small"
                    onChange={(v) => handleToggleRedirect(record.id, v)}
                />
            ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            key: "created_at",
            width: 110,
            render: (d: string) => dayjs(d).format("DD/MM/YYYY"),
        },
        {
            title: "",
            key: "actions",
            width: 60,
            render: (_, record) => (
                <Popconfirm title="Xóa redirect này?" onConfirm={() => handleDeleteRedirect(record.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    return (
        <AdminLayout>
            <AdminPageHeader
                icon={<GlobalOutlined />}
                title="SEO Manager"
                actions={
                    <Tooltip title="Tải lại">
                        <Button icon={<ReloadOutlined />} onClick={fetchData} />
                    </Tooltip>
                }
            />

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: "config",
                        label: (
                            <span>
                                <GlobalOutlined /> Global SEO
                            </span>
                        ),
                        children: (
                            <AdminGlassCard>
                                <Form
                                    form={seoForm}
                                    layout="vertical"
                                >
                                    <Form.Item name="siteTitle" label="Site Title" rules={[{ required: true }]}>
                                        <Input placeholder="Vit IELTS" />
                                    </Form.Item>

                                    <Form.Item name="titleSuffix" label="Title Suffix">
                                        <Input placeholder=" | Vit IELTS" />
                                    </Form.Item>

                                    <Form.Item name="defaultDescription" label="Default Meta Description">
                                        <TextArea rows={3} placeholder="Site description for search engines..." />
                                    </Form.Item>

                                    <Form.Item name="keywords" label="Keywords">
                                        <TextArea rows={2} placeholder="ielts, vit ielts, ..." />
                                    </Form.Item>

                                    <Form.Item name="author" label="Author">
                                        <Input placeholder="Vịt IELTS" />
                                    </Form.Item>

                                    <Form.Item name="ogImage" label="Default OG Image URL" valuePropName="value">
                                        <ImageUpload />
                                    </Form.Item>

                                    <Form.Item name="googleVerification" label="Google Verification Code">
                                        <Input placeholder="google-site-verification=..." />
                                    </Form.Item>

                                    <Form.Item name="facebookVerification" label="Facebook Verification Code">
                                        <Input placeholder="facebook-domain-verification=..." />
                                    </Form.Item>

                                    <Form.Item name="gtmId" label="Google Tag Manager ID">
                                        <Input placeholder="GTM-K667XHRR" />
                                    </Form.Item>

                                    <Form.Item name="fbAppId" label="Facebook App ID">
                                        <Input placeholder="ID APP" />
                                    </Form.Item>

                                    <Form.Item name="bingVerification" label="Bing Verification Code">
                                        <Input placeholder="msvalidate.01=..." />
                                    </Form.Item>

                                    <Form.Item name="robotsTxt" label="robots.txt Content">
                                        <TextArea
                                            rows={8}
                                            style={{ fontFamily: "monospace", fontSize: 13 }}
                                        />
                                    </Form.Item>

                                    <Button
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        onClick={handleSaveConfig}
                                        loading={saving}
                                    >
                                        Lưu cấu hình
                                    </Button>
                                </Form>
                            </AdminGlassCard>
                        ),
                    },
                    {
                        key: "redirects",
                        label: (
                            <span>
                                <LinkOutlined /> Redirects ({redirectsCount})
                            </span>
                        ),
                        children: (
                            <AdminGlassCard>
                                <Space style={{ marginBottom: 16 }} wrap>
                                    <Input.Search
                                        placeholder="Tìm theo URL..."
                                        allowClear
                                        onSearch={(v) => setSearch(v)}
                                        style={{ width: 260 }}
                                        prefix={<SearchOutlined />}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setShowAddModal(true)}
                                    >
                                        Thêm Redirect
                                    </Button>
                                </Space>

                                <Table
                                    columns={redirectColumns}
                                    dataSource={redirects}
                                    rowKey="id"
                                    loading={loading}
                                    pagination={{
                                        total: redirectsCount,
                                        showTotal: (t) => `Tổng ${t} redirect rules`,
                                        showSizeChanger: true,
                                    }}
                                    scroll={{ x: "max-content" }}
                                    size="middle"
                                />
                            </AdminGlassCard>
                        ),
                    },
                ]}
            />

            {/* Add Redirect Modal */}
            <Modal
                title="Thêm Redirect Rule"
                open={showAddModal}
                onCancel={() => { setShowAddModal(false); redirectForm.resetFields(); }}
                onOk={handleCreateRedirect}
                okText="Tạo"
                cancelText="Hủy"
            >
                <Form form={redirectForm} layout="vertical" initialValues={{ status_code: 301 }}>
                    <Form.Item
                        name="source_path"
                        label="Source Path"
                        rules={[{ required: true, message: "Nhập URL nguồn" }]}
                    >
                        <Input placeholder="/old-page" addonBefore="Source" />
                    </Form.Item>
                    <Form.Item
                        name="target_path"
                        label="Target Path"
                        rules={[{ required: true, message: "Nhập URL đích" }]}
                    >
                        <Input placeholder="/new-page" addonBefore="Target" />
                    </Form.Item>
                    <Form.Item name="status_code" label="Status Code">
                        <Select
                            options={[
                                { value: 301, label: "301 — Permanent Redirect" },
                                { value: 302, label: "302 — Temporary Redirect" },
                                { value: 307, label: "307 — Temporary (preserve method)" },
                                { value: 308, label: "308 — Permanent (preserve method)" },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
