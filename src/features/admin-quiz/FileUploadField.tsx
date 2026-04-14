import React, { useState, useCallback } from "react";
import { useDropzone, Accept } from "react-dropzone";
import { Button, Spin, message, Typography, Space, Image, Input } from "antd";
import {
  DeleteOutlined,
  FileOutlined,
  FilePdfOutlined,
  SoundOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CloudUploadOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

type FileUploadFieldProps = {
  accept: Accept;
  value?: string;
  onChange: (url: string) => void;
  label: string;
  layoutType?: "dropzone" | "button" | "input-button";
  buttonLabel?: string;
};

export default function FileUploadField({
  accept,
  value,
  onChange,
  label,
  layoutType = "dropzone",
  buttonLabel = "Select Media",
}: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const fileType = React.useMemo(() => {
    const keys = Object.keys(accept);
    if (keys.some((k) => k.startsWith("image/"))) return "image";
    if (keys.some((k) => k.startsWith("audio/"))) return "audio";
    if (keys.some((k) => k.includes("pdf"))) return "pdf";
    return "other";
  }, [accept]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (json.success && json.data?.url) {
          onChange(json.data.url);
          message.success(`Upload "${file.name}" thành công`);
        } else {
          message.error(json.error || "Upload thất bại");
        }
      } catch (err) {
        message.error("Lỗi khi upload file");
        console.error("Upload error:", err);
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    disabled: uploading,
    noClick: layoutType !== "dropzone",
    noKeyboard: layoutType !== "dropzone",
  });

  const handleDelete = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setAudioPlaying(false);
    }
    onChange("");
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (audioPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setAudioPlaying(!audioPlaying);
  };

  const getFilename = (url: string) => {
    try {
      return decodeURIComponent(url.split("/").pop() || url);
    } catch {
      return url.split("/").pop() || url;
    }
  };

  // --- Layout: BUTTON (For Featured Image) ---
  if (layoutType === "button") {
    return (
      <div className="space-y-4">
        {value && (
          <div className="relative aspect-square max-w-[160px] rounded-md border border-gray-200 overflow-hidden">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="space-x-2" {...getRootProps()}>
          <input {...getInputProps()} />
          <Button type="primary" onClick={open} loading={uploading} style={{ backgroundColor: "#ff2a55", borderColor: "#ff2a55", color: "white" }}>
            {buttonLabel}
          </Button>
          {value && (
            <Button onClick={handleDelete} className="bg-gray-100 border-gray-200">
              Remove
            </Button>
          )}
        </div>
      </div>
    );
  }

  // --- Layout: INPUT-BUTTON (For PDF & Audio) ---
  if (layoutType === "input-button") {
    return (
      <div className="flex space-x-2 items-center" {...getRootProps()}>
        <input {...getInputProps()} />
        <Input 
          readOnly 
          variant="filled" 
          size="large" 
          value={value || ""} 
          className="flex-1 bg-gray-50 border-transparent hover:border-transparent focus:border-transparent" 
          style={{ cursor: "default" }}
        />
        <Button size="large" type="primary" onClick={open} loading={uploading} style={{ backgroundColor: "#ff2a55", border: "none" }}>
          {buttonLabel}
        </Button>
        {value && (
          <Button size="large" danger icon={<DeleteOutlined />} onClick={handleDelete} />
        )}
      </div>
    );
  }

  // --- Layout: DROPZONE (Original) ---
  if (value) {
    return (
      <div style={styles.container}>
        {label && <Text strong style={{ marginBottom: 8, display: "block" }}>{label}</Text>}
        <div style={styles.previewCard}>
          {fileType === "image" && (
            <div style={styles.imagePreview}>
              <Image
                src={value}
                style={{ maxHeight: 120, maxWidth: "100%", objectFit: "contain", borderRadius: 6 }}
                fallback="data:image/svg+xml;base64,...(omitted fallback)..."
              />
            </div>
          )}
          {fileType === "audio" && (
            <div style={styles.fileInfo}>
              <SoundOutlined style={{ fontSize: 24, color: "#1890ff", marginRight: 8 }} />
              <div style={{ flex: 1 }}>
                <Text ellipsis style={{ maxWidth: 200, display: "block" }}>{getFilename(value)}</Text>
                <audio ref={audioRef} src={value} onEnded={() => setAudioPlaying(false)} style={{ display: "none" }} />
                <Button size="small" type="link" icon={audioPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={toggleAudio} style={{ padding: 0, marginTop: 4 }}>
                  {audioPlaying ? "Dừng" : "Phát"}
                </Button>
              </div>
            </div>
          )}
          {fileType === "pdf" && (
            <div style={styles.fileInfo}>
              <FilePdfOutlined style={{ fontSize: 24, color: "#ff4d4f", marginRight: 8 }} />
              <div style={{ flex: 1 }}>
                <Text ellipsis style={{ maxWidth: 200, display: "block" }}>{getFilename(value)}</Text>
                <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>Mở PDF ↗</a>
              </div>
            </div>
          )}
          {fileType === "other" && (
            <div style={styles.fileInfo}>
              <FileOutlined style={{ fontSize: 24, color: "#8c8c8c", marginRight: 8 }} />
              <Text ellipsis style={{ maxWidth: 200 }}>{getFilename(value)}</Text>
            </div>
          )}
          <Button size="small" danger icon={<DeleteOutlined />} onClick={handleDelete} style={{ marginLeft: "auto" }}>Xóa</Button>
        </div>
        <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: "block" }} copyable={{ text: value }} ellipsis>
          {value}
        </Text>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {label && <Text strong style={{ marginBottom: 8, display: "block" }}>{label}</Text>}
      <div
        {...getRootProps()}
        style={{
          ...styles.dropzone,
          borderColor: isDragActive ? "#1890ff" : uploading ? "var(--admin-border)" : "var(--admin-border)",
          backgroundColor: isDragActive ? "#e6f7ff" : uploading ? "var(--admin-surface-hover)" : "var(--admin-surface-hover)",
          cursor: uploading ? "not-allowed" : "pointer",
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Space direction="vertical" align="center" size="small">
            <Spin />
            <Text type="secondary">Đang upload...</Text>
          </Space>
        ) : (
          <Space direction="vertical" align="center" size="small">
            <CloudUploadOutlined style={{ fontSize: 28, color: isDragActive ? "#1890ff" : "#bfbfbf" }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              {isDragActive ? "Thả file vào đây..." : "Kéo thả file hoặc click để chọn"}
            </Text>
          </Space>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { marginBottom: 8 },
  dropzone: {
    border: "2px dashed var(--admin-border)",
    borderRadius: 8,
    padding: "20px 16px",
    textAlign: "center",
    transition: "all 0.2s ease",
    minHeight: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCard: {
    display: "flex",
    alignItems: "center",
    padding: "10px 12px",
    border: "1px solid var(--admin-border)",
    borderRadius: 8,
    backgroundColor: "var(--admin-surface-hover)",
    gap: 12,
  },
  imagePreview: { display: "flex", alignItems: "center", justifyContent: "center", minWidth: 80 },
  fileInfo: { display: "flex", alignItems: "center", flex: 1 },
};
