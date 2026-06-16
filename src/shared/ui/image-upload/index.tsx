import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button, message, Input } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import Image from "next/image";

interface ImageUploadProps {
  value?: string;
  onChange?: (path: string) => void;
  label?: string;
  required?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  label,
  required = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);

  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url || !url.trim()) return false;
    if (url.includes('fakepath') || url.includes('C:\\') || url.includes('C:/')) {
      return false;
    }
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  };

  useEffect(() => {
    if (value && isValidImageUrl(value)) {
      setPreview(value);
    } else if (!value) {
      setPreview(null);
    } else {
      console.warn("Invalid image URL detected:", value);
      setPreview(null);
      onChange?.("");
    }
  }, [value, onChange]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (value && value.trim() && isValidImageUrl(value)) {
        formData.append("oldPath", value);
      }

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Upload failed");
      }

      const json = await res.json();
      // Handle both local API response { path } and VPS response { data: { url } }
      const imagePath = json.path || json.data?.url;

      if (!isValidImageUrl(imagePath)) {
        throw new Error("Invalid image URL. Please try again.");
      }

      setPreview(imagePath);
      onChange?.(imagePath);
      message.success("Image uploaded successfully");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleUpload(acceptedFiles[0]);
      }
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error) {
        if (error.code === "file-too-large") {
          message.error("File too large. Maximum size is 5MB.");
        } else if (error.code === "file-invalid-type") {
          message.error("Invalid file type. Only images are accepted.");
        } else {
          message.error(error.message || "Cannot upload file");
        }
      }
    },
  });

  const handleRemove = () => {
    setPreview(null);
    onChange?.("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {label && (
        <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "var(--admin-text-primary, #374151)" }}>
          {label}
          {required && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
        </label>
      )}

      {preview && isValidImageUrl(preview) ? (
        <div style={{
          border: "1px solid var(--admin-border, #d1d5db)",
          borderRadius: 8,
          padding: 16,
          background: "var(--admin-surface-hover, #f9fafb)",
        }}>
          <div style={{ position: "relative", width: "100%", height: 192 }}>
            {preview.startsWith('http://') || preview.startsWith('https://') ? (
              <img
                src={preview}
                alt="Preview"
                style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 4 }}
                onError={(e) => {
                  console.error("Failed to load image:", preview);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <Image
                src={preview}
                alt="Preview"
                fill
                style={{ objectFit: "contain", borderRadius: 4 }}
                unoptimized={preview.startsWith('/img-admin/')}
              />
            )}
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <Button
              {...getRootProps()}
              icon={<UploadOutlined />}
              loading={uploading}
            >
              <input {...getInputProps()} />
              Change the image
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleRemove}>
              Delete
            </Button>
          </div>
          <div style={{ marginTop: 8 }}>
            <Input
              value={preview || ""}
              style={{ fontSize: 12 }}
              placeholder="Or paste an image URL directly here"
              onChange={(e) => {
                const newValue = e.target.value.trim();
                if (isValidImageUrl(newValue)) {
                  setPreview(newValue);
                  onChange?.(newValue);
                } else if (newValue === "") {
                  setPreview(null);
                  onChange?.("");
                } else {
                  message.warning("Invalid URL. Please enter a full URL (http:// or https://) or a relative path (/img-admin/...).");
                }
              }}
            />
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? "#3b82f6" : "var(--admin-border, #d1d5db)"}`,
            borderRadius: 8,
            padding: "32px 16px",
            textAlign: "center",
            cursor: "pointer",
            background: isDragActive ? "rgba(59,130,246,0.06)" : "var(--admin-surface-hover, #f9fafb)",
            transition: "border-color 0.2s, background 0.2s",
          }}
        >
          <input {...getInputProps()} />
          <UploadOutlined style={{ fontSize: 36, color: "var(--admin-text-secondary, #9ca3af)", marginBottom: 12 }} />
          <p style={{ color: "var(--admin-text-secondary, #6b7280)", marginBottom: 4 }}>
            {isDragActive
              ? "Drop file here..."
              : "Drag and drop an image here or click to select"}
          </p>
          <p style={{ fontSize: 13, color: "var(--admin-text-secondary, #9ca3af)", margin: 0 }}>PNG, JPG, GIF up to 5MB</p>
          {uploading && (
            <div style={{ marginTop: 12 }}>
              <p style={{ color: "#3b82f6" }}>Uploading...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
