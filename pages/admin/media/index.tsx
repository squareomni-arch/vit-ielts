import { useEffect, useState, useCallback } from "react";
import {
    Button, Space, Input, Modal, Table, Tag, Tooltip,
    message, Upload, Empty, Popconfirm, Typography,
    Image as AntImage,
} from "antd";
import {
    PictureOutlined, UploadOutlined, DeleteOutlined,
    CopyOutlined, ReloadOutlined, SearchOutlined,
    EyeOutlined, FileImageOutlined,
    AppstoreOutlined, UnorderedListOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile, UploadChangeParam } from "antd/es/upload";
import AdminLayout from "../_layout";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { AdminPageHeader, AdminGlassCard, AdminStatCard } from "@/widgets/admin";

const { Text } = Typography;

type MediaItem = {
    id: string;
    url: string;
    filename: string;
    mimetype: string;
    size: number;
    uploaded_by: string | null;
    created_at: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFileIcon(mimetype: string): React.ReactNode {
    if (mimetype.startsWith("image/")) return <FileImageOutlined style={{ color: "#1890ff" }} />;
    return <PictureOutlined />;
}

export default function MediaLibraryPage() {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [stats, setStats] = useState({ total: 0, totalSize: 0 });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(24);

    const fetchMedia = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(pageSize),
            });
            if (search) params.set("search", search);

            const res = await fetch(`/api/admin/media?${params}`);
            const json = await res.json();
            if (json.success) {
                setMedia(json.data);
                setTotal(json.count);
                if (json.stats) setStats(json.stats);
            }
        } catch {
            message.error("Lỗi khi tải media");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search]);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const handleUpload = async (info: UploadChangeParam<UploadFile>) => {
        const { file } = info;
        if (file.status === "uploading") {
            setUploading(true);
            return;
        }
        if (file.status === "done") {
            setUploading(false);
            message.success(`${file.name} đã upload thành công`);
            fetchMedia();
        }
        if (file.status === "error") {
            setUploading(false);
            message.error(`Upload ${file.name} thất bại`);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                message.success("Đã xóa file");
                fetchMedia();
            } else {
                message.error(json.error || "Lỗi khi xóa");
            }
        } catch {
            message.error("Lỗi khi xóa file");
        }
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        message.success("Đã copy URL");
    };

    // ─── Table columns (list view) ────────────────────────────────────────
    const columns: ColumnsType<MediaItem> = [
        {
            title: "",
            key: "preview",
            width: 56,
            render: (_, record) =>
                record.mimetype.startsWith("image/") ? (
                    <AntImage
                        src={record.url}
                        width={40}
                        height={40}
                        style={{ objectFit: "cover", borderRadius: 6 }}
                        preview={false}
                        onClick={() => setPreviewUrl(record.url)}
                    />
                ) : (
                    getFileIcon(record.mimetype)
                ),
        },
        {
            title: "Filename",
            dataIndex: "filename",
            key: "filename",
            ellipsis: true,
            render: (name: string) => <Text style={{ fontSize: 13 }}>{name}</Text>,
        },
        {
            title: "Type",
            dataIndex: "mimetype",
            key: "mimetype",
            width: 100,
            render: (t: string) => <Tag>{t.split("/")[1]}</Tag>,
        },
        {
            title: "Size",
            dataIndex: "size",
            key: "size",
            width: 90,
            render: (s: number) => formatFileSize(s),
        },
        {
            title: "Ngày upload",
            dataIndex: "created_at",
            key: "created_at",
            width: 120,
            render: (d: string) => dayjs(d).format("DD/MM/YYYY"),
        },
        {
            title: "",
            key: "actions",
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    {record.mimetype.startsWith("image/") && (
                        <Tooltip title="Xem">
                            <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewUrl(record.url)} />
                        </Tooltip>
                    )}
                    <Tooltip title="Copy URL">
                        <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopyUrl(record.url)} />
                    </Tooltip>
                    <Popconfirm title="Xóa file này?" onConfirm={() => handleDelete(record.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <AdminPageHeader
                icon={<PictureOutlined />}
                title="Media Library"
                badge={
                    <span style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
                        {stats.total} files · {formatFileSize(stats.totalSize)}
                    </span>
                }
                actions={
                    <Space>
                        <Upload
                            action="/api/admin/upload-image"
                            showUploadList={false}
                            onChange={handleUpload}
                            accept="image/*"
                            name="file"
                        >
                            <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
                                Upload
                            </Button>
                        </Upload>
                        <Tooltip title="Tải lại">
                            <Button icon={<ReloadOutlined />} onClick={fetchMedia} />
                        </Tooltip>
                    </Space>
                }
            />

            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 16 }}>
                <AdminStatCard label="Tổng files" value={stats.total} icon={<PictureOutlined />} />
                <AdminStatCard label="Dung lượng" value={formatFileSize(stats.totalSize)} icon={<FileImageOutlined />} />
            </div>

            {/* Filter bar */}
            <AdminGlassCard style={{ marginBottom: 16 }}>
                <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
                    <Input.Search
                        placeholder="Tìm theo tên file..."
                        allowClear
                        onSearch={(v) => { setSearch(v); setPage(1); }}
                        style={{ width: 260 }}
                        prefix={<SearchOutlined />}
                    />
                    <Space>
                        <Button
                            type={viewMode === "grid" ? "primary" : "default"}
                            ghost={viewMode === "grid"}
                            icon={<AppstoreOutlined />}
                            onClick={() => setViewMode("grid")}
                        />
                        <Button
                            type={viewMode === "list" ? "primary" : "default"}
                            ghost={viewMode === "list"}
                            icon={<UnorderedListOutlined />}
                            onClick={() => setViewMode("list")}
                        />
                    </Space>
                </Space>
            </AdminGlassCard>

            {/* Content */}
            <AdminGlassCard>
                {viewMode === "list" ? (
                    <Table
                        columns={columns}
                        dataSource={media}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            current: page,
                            pageSize,
                            total,
                            showSizeChanger: true,
                            showTotal: (t) => `Tổng ${t} files`,
                            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                        }}
                        scroll={{ x: 700 }}
                        size="middle"
                    />
                ) : (
                    <>
                        {media.length === 0 && !loading ? (
                            <Empty description="Chưa có media nào" />
                        ) : (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                                gap: 12,
                            }}>
                                {media.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            border: "1px solid var(--admin-border, #333)",
                                            borderRadius: 10,
                                            overflow: "hidden",
                                            background: "var(--admin-glass-bg, rgba(255,255,255,0.04))",
                                            transition: "border-color 0.2s",
                                            cursor: "pointer",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--admin-brand, #d94a56)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--admin-border, #333)")}
                                    >
                                        {/* Thumbnail */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 120,
                                                overflow: "hidden",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: "rgba(0, 0, 0, 0.1)",
                                            }}
                                            onClick={() => setPreviewUrl(item.url)}
                                        >
                                            {item.mimetype.startsWith("image/") ? (
                                                <img
                                                    src={item.url}
                                                    alt={item.filename}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            ) : (
                                                <PictureOutlined style={{ fontSize: 40, opacity: 0.3 }} />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div style={{ padding: "8px 10px" }}>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    marginBottom: 4,
                                                }}
                                                title={item.filename}
                                            >
                                                {item.filename}
                                            </div>
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}>
                                                <span style={{ fontSize: 11, opacity: 0.5 }}>
                                                    {formatFileSize(item.size)}
                                                </span>
                                                <Space size={4}>
                                                    <Tooltip title="Copy URL">
                                                        <Button
                                                            size="small"
                                                            type="text"
                                                            icon={<CopyOutlined style={{ fontSize: 12 }} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyUrl(item.url);
                                                            }}
                                                        />
                                                    </Tooltip>
                                                    <Popconfirm
                                                        title="Xóa file này?"
                                                        onConfirm={() => handleDelete(item.id)}
                                                    >
                                                        <Button
                                                            size="small"
                                                            type="text"
                                                            danger
                                                            icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </Popconfirm>
                                                </Space>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination for grid */}
                        {total > pageSize && (
                            <div style={{ textAlign: "center", marginTop: 16 }}>
                                <Button
                                    disabled={page * pageSize >= total}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Tải thêm ({total - page * pageSize > 0 ? total - page * pageSize : 0} còn lại)
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </AdminGlassCard>

            {/* Image Preview Modal */}
            <Modal
                open={!!previewUrl}
                onCancel={() => setPreviewUrl(null)}
                footer={null}
                width={800}
                centered
            >
                {previewUrl && (
                    <img
                        src={previewUrl}
                        alt="preview"
                        style={{ width: "100%", borderRadius: 8 }}
                    />
                )}
            </Modal>
        </AdminLayout>
    );
}

export const getServerSideProps = withAdmin;
