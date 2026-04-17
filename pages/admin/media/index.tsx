import { useEffect, useState, useCallback, useRef } from "react";
import {
    Button, Space, Input, Modal, Table, Tag, Tooltip,
    message, Upload, Empty, Popconfirm, Typography, Segmented,
} from "antd";
import {
    PictureOutlined, UploadOutlined, DeleteOutlined,
    CopyOutlined, ReloadOutlined, SearchOutlined,
    SoundOutlined, FilePdfOutlined, FileOutlined,
    AppstoreOutlined, UnorderedListOutlined,
    PlayCircleOutlined, PauseCircleOutlined, LinkOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { UploadChangeParam, UploadFile } from "antd/es/upload";
import AdminLayout from "../_layout";
import dayjs from "dayjs";
import { withAdmin } from "@/shared/hoc/withAdmin";
import { AdminPageHeader, AdminGlassCard, AdminStatCard } from "@/widgets/admin";

const { Text } = Typography;

type MediaType = "all" | "image" | "audio" | "pdf";

type MediaItem = {
    id: string;
    url: string;
    filename: string;
    mimetype: string;
    size: number;
    uploaded_by: string | null;
    created_at: string;
};

type Stats = {
    total: number;
    totalSize: number;
    countByType: { image: number; audio: number; pdf: number };
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getCategory(mimetype: string): "image" | "audio" | "pdf" | "other" {
    if (mimetype.startsWith("image/")) return "image";
    if (mimetype.startsWith("audio/")) return "audio";
    if (mimetype === "application/pdf") return "pdf";
    return "other";
}

// ─── Audio Card ─────────────────────────────────────────────────────────────

function AudioCard({ url, filename }: { url: string; filename: string }) {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const toggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audioRef.current) return;
        if (playing) { audioRef.current.pause(); setPlaying(false); }
        else { audioRef.current.play(); setPlaying(true); }
    };

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} style={{ display: "none" }} />
            <SoundOutlined style={{ fontSize: 36, color: "#1890ff", opacity: 0.8 }} />
            <Button
                size="small"
                type="text"
                icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={toggle}
                style={{ color: "#1890ff", fontSize: 12 }}
            >
                {playing ? "Dừng" : "Phát"}
            </Button>
        </div>
    );
}

// ─── Grid Card ──────────────────────────────────────────────────────────────

function MediaCard({
    item,
    onPreview,
    onCopy,
    onDelete,
}: {
    item: MediaItem;
    onPreview: (url: string) => void;
    onCopy: (url: string) => void;
    onDelete: (id: string) => void;
}) {
    const category = getCategory(item.mimetype);
    const [hovered, setHovered] = useState(false);

    const thumbnailBg = {
        image: "rgba(0,0,0,0.08)",
        audio: "rgba(24,144,255,0.06)",
        pdf:   "rgba(255,77,79,0.06)",
        other: "rgba(0,0,0,0.06)",
    }[category];

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                border: `1px solid ${hovered ? "var(--admin-brand, #d94a56)" : "var(--admin-border, #333)"}`,
                borderRadius: 10,
                overflow: "hidden",
                background: "var(--admin-glass-bg, rgba(255,255,255,0.04))",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.12)" : "none",
            }}
        >
            {/* Thumbnail */}
            <div
                onClick={() => category === "image" && onPreview(item.url)}
                style={{
                    width: "100%",
                    height: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: thumbnailBg,
                    cursor: category === "image" ? "zoom-in" : "default",
                    overflow: "hidden",
                }}
            >
                {category === "image" && (
                    <img
                        src={item.url}
                        alt={item.filename}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                )}
                {category === "audio" && <AudioCard url={item.url} filename={item.filename} />}
                {category === "pdf" && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <FilePdfOutlined style={{ fontSize: 40, color: "#ff4d4f", opacity: 0.8 }} />
                        <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: "#ff4d4f" }}>
                            Mở PDF ↗
                        </a>
                    </div>
                )}
                {category === "other" && <FileOutlined style={{ fontSize: 40, opacity: 0.3 }} />}
            </div>

            {/* Info */}
            <div style={{ padding: "8px 10px" }}>
                <div
                    title={item.filename}
                    style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 6 }}
                >
                    {item.filename}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, opacity: 0.5 }}>{formatFileSize(item.size)}</span>
                    <Space size={2}>
                        {category === "pdf" && (
                            <Tooltip title="Mở PDF">
                                <Button size="small" type="text" icon={<LinkOutlined style={{ fontSize: 11 }} />}
                                    onClick={e => { e.stopPropagation(); window.open(item.url, "_blank"); }} />
                            </Tooltip>
                        )}
                        <Tooltip title="Copy URL">
                            <Button size="small" type="text" icon={<CopyOutlined style={{ fontSize: 11 }} />}
                                onClick={e => { e.stopPropagation(); onCopy(item.url); }} />
                        </Tooltip>
                        <Popconfirm title="Xóa bản ghi này?" description="File trên VPS không bị xóa." onConfirm={() => onDelete(item.id)}>
                            <Button size="small" type="text" danger icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                                onClick={e => e.stopPropagation()} />
                        </Popconfirm>
                    </Space>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function MediaLibraryPage() {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [activeType, setActiveType] = useState<MediaType>("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [stats, setStats] = useState<Stats>({ total: 0, totalSize: 0, countByType: { image: 0, audio: 0, pdf: 0 } });
    const [page, setPage] = useState(1);
    const pageSize = 24;

    const fetchMedia = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(pageSize),
            });
            if (search) params.set("search", search);
            if (activeType !== "all") params.set("type", activeType);

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
    }, [page, search, activeType]);

    useEffect(() => { fetchMedia(); }, [fetchMedia]);

    // Register in DB after VPS upload succeeds
    const registerInDB = async (fileData: {
        url: string; filename: string; mimetype: string; size: number;
    }) => {
        await fetch("/api/admin/media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fileData),
        });
    };

    const handleUploadChange = async (info: UploadChangeParam<UploadFile>) => {
        const { file } = info;
        if (file.status === "uploading") { setUploading(true); return; }

        if (file.status === "done") {
            const resp = file.response;
            if (resp?.success && resp?.data?.url) {
                await registerInDB({
                    url: resp.data.url,
                    filename: file.name,
                    mimetype: resp.data.mimeType || file.type || "",
                    size: resp.data.size || file.size || 0,
                });
                message.success(`"${file.name}" đã upload thành công`);
                fetchMedia();
            } else {
                message.error(resp?.error || `Upload "${file.name}" thất bại`);
            }
        }

        if (file.status === "error") {
            const errMsg = file.response?.error || `Upload "${file.name}" thất bại`;
            message.error(errMsg);
        }

        // Clear uploading state when queue is empty
        setUploading(info.fileList.some(f => f.status === "uploading"));
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) { message.success("Đã xóa bản ghi"); fetchMedia(); }
            else message.error(json.error || "Lỗi khi xóa");
        } catch { message.error("Lỗi khi xóa"); }
    };

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url);
        message.success("Đã copy URL");
    };

    // ─── Table columns ────────────────────────────────────────────────────
    const columns: ColumnsType<MediaItem> = [
        {
            title: "",
            key: "thumb",
            width: 52,
            render: (_, r) => {
                const cat = getCategory(r.mimetype);
                if (cat === "image") return <img src={r.url} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, cursor: "zoom-in" }} onClick={() => setPreviewUrl(r.url)} />;
                if (cat === "audio") return <SoundOutlined style={{ fontSize: 22, color: "#1890ff" }} />;
                if (cat === "pdf") return <FilePdfOutlined style={{ fontSize: 22, color: "#ff4d4f" }} />;
                return <FileOutlined style={{ fontSize: 22 }} />;
            },
        },
        {
            title: "Filename",
            dataIndex: "filename",
            key: "filename",
            ellipsis: true,
            render: (name: string) => <Text style={{ fontSize: 13 }}>{name}</Text>,
        },
        {
            title: "Loại",
            dataIndex: "mimetype",
            key: "type",
            width: 80,
            render: (t: string) => {
                const cat = getCategory(t);
                const colors = { image: "blue", audio: "green", pdf: "red", other: "default" } as const;
                return <Tag color={colors[cat]}>{cat}</Tag>;
            },
        },
        {
            title: "Kích thước",
            dataIndex: "size",
            key: "size",
            width: 90,
            render: (s: number) => formatFileSize(s),
        },
        {
            title: "Ngày upload",
            dataIndex: "created_at",
            key: "created_at",
            width: 110,
            render: (d: string) => dayjs(d).format("DD/MM/YY HH:mm"),
        },
        {
            title: "",
            key: "actions",
            width: 130,
            render: (_, r) => (
                <Space size="small">
                    {getCategory(r.mimetype) === "pdf" && (
                        <Tooltip title="Mở PDF">
                            <Button size="small" icon={<LinkOutlined />} onClick={() => window.open(r.url, "_blank")} />
                        </Tooltip>
                    )}
                    <Tooltip title="Copy URL">
                        <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(r.url)} />
                    </Tooltip>
                    <Popconfirm title="Xóa bản ghi này?" description="File trên VPS không bị xóa." onConfirm={() => handleDelete(r.id)}>
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
                            action="/api/admin/upload"
                            name="file"
                            multiple
                            showUploadList={false}
                            onChange={handleUploadChange}
                            accept="image/*,audio/*,.pdf"
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

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 16 }}>
                <AdminStatCard label="Tổng files" value={stats.total} icon={<PictureOutlined />} />
                <AdminStatCard label="Ảnh" value={stats.countByType.image} icon={<PictureOutlined />} />
                <AdminStatCard label="Audio" value={stats.countByType.audio} icon={<SoundOutlined />} />
                <AdminStatCard label="PDF" value={stats.countByType.pdf} icon={<FilePdfOutlined />} />
                <AdminStatCard label="Dung lượng" value={formatFileSize(stats.totalSize)} icon={<FileOutlined />} />
            </div>

            {/* Filter + View toggles */}
            <AdminGlassCard style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                    <Space wrap>
                        <Segmented
                            value={activeType}
                            onChange={(v) => { setActiveType(v as MediaType); setPage(1); }}
                            options={[
                                { label: "Tất cả", value: "all" },
                                { label: `Ảnh (${stats.countByType.image})`, value: "image" },
                                { label: `Audio (${stats.countByType.audio})`, value: "audio" },
                                { label: `PDF (${stats.countByType.pdf})`, value: "pdf" },
                            ]}
                        />
                        <Input.Search
                            placeholder="Tìm theo tên file..."
                            allowClear
                            onSearch={(v) => { setSearch(v); setPage(1); }}
                            style={{ width: 220 }}
                            prefix={<SearchOutlined />}
                        />
                    </Space>
                    <Space>
                        <Button
                            type={viewMode === "grid" ? "primary" : "default"}
                            icon={<AppstoreOutlined />}
                            onClick={() => setViewMode("grid")}
                        />
                        <Button
                            type={viewMode === "list" ? "primary" : "default"}
                            icon={<UnorderedListOutlined />}
                            onClick={() => setViewMode("list")}
                        />
                    </Space>
                </div>
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
                            showSizeChanger: false,
                            showTotal: (t) => `Tổng ${t} files`,
                            onChange: (p) => setPage(p),
                        }}
                        scroll={{ x: 700 }}
                        size="middle"
                    />
                ) : (
                    <>
                        {!loading && media.length === 0 ? (
                            <Empty description="Chưa có media nào" />
                        ) : (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                                gap: 12,
                            }}>
                                {media.map((item) => (
                                    <MediaCard
                                        key={item.id}
                                        item={item}
                                        onPreview={setPreviewUrl}
                                        onCopy={handleCopy}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {total > pageSize && (
                            <div style={{ textAlign: "center", marginTop: 20 }}>
                                <Space>
                                    <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Trước</Button>
                                    <span style={{ fontSize: 13, opacity: 0.6 }}>
                                        Trang {page} / {Math.ceil(total / pageSize)}
                                    </span>
                                    <Button disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)}>Tiếp →</Button>
                                </Space>
                            </div>
                        )}
                    </>
                )}
            </AdminGlassCard>

            {/* Image Preview Modal */}
            <Modal
                open={!!previewUrl}
                onCancel={() => setPreviewUrl(null)}
                footer={
                    <Space>
                        <Button icon={<CopyOutlined />} onClick={() => previewUrl && handleCopy(previewUrl)}>Copy URL</Button>
                        <Button onClick={() => setPreviewUrl(null)}>Đóng</Button>
                    </Space>
                }
                width={860}
                centered
            >
                {previewUrl && (
                    <img
                        src={previewUrl}
                        alt="preview"
                        style={{ width: "100%", borderRadius: 8, maxHeight: "70vh", objectFit: "contain" }}
                    />
                )}
            </Modal>
        </AdminLayout>
    );
}

export default MediaLibraryPage;
export const getServerSideProps = withAdmin;
