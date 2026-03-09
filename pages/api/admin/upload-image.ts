import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";
// @ts-ignore — @vercel/blob@0.0.2 types are outdated; del exists at runtime
import { put, del } from "@vercel/blob";
import axios from "axios";

// Disable body parser để xử lý file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Kiểm tra xem có nên sử dụng Vercel Blob Storage không
 */
function shouldUseBlob(): boolean {
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  const isVercel = process.env.VERCEL === "1";
  const result = hasBlobToken && isVercel;
  
  if (isVercel && !hasBlobToken) {
    console.warn("⚠️ Running on Vercel but BLOB_READ_WRITE_TOKEN is not configured. File upload will fail.");
  }
  
  return result;
}

/**
 * Upload file lên Vercel Blob Storage
 */
async function uploadToBlob(
  file: formidable.File,
  oldPath?: string
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN không được cấu hình");
  }

  // Đọc file buffer
  const fileBuffer = fs.readFileSync(file.filepath);
  
  // Tạo tên file unique
  const timestamp = Date.now();
  const originalName = file.originalFilename || "image";
  const ext = path.extname(originalName);
  const baseName = path
    .basename(originalName, ext)
    .replace(/[^a-z0-9]/gi, "-");
  const fileName = `img-admin/${baseName}-${timestamp}${ext}`;

  // Xóa file cũ nếu có
  if (oldPath && typeof oldPath === "string" && oldPath.trim()) {
    try {
      // Extract blob key từ oldPath (format: /img-admin/filename.jpg)
      const blobKey = oldPath.startsWith("/") ? oldPath.substring(1) : oldPath;
      if (blobKey.startsWith("img-admin/")) {
        await del(blobKey, { token });
        console.log(`Đã xóa file cũ từ Blob: ${blobKey}`);
      }
    } catch (deleteError) {
      console.warn("Không thể xóa file cũ từ Blob:", deleteError);
    }
  }

  // Upload file mới
  // @ts-ignore — fileBuffer type mismatch with old @vercel/blob types
  const blob = await put(fileName, fileBuffer, {
    access: "public",
    token,
    contentType: file.mimetype || "image/jpeg",
  });

  // @ts-ignore — pathname exists in runtime but not in old @vercel/blob@0.0.2 types
  return `/${blob.pathname}`;
}

/**
 * Upload file lên ImgBB (fallback khi không có Blob Storage)
 */
async function uploadToImgBB(file: formidable.File): Promise<string> {
  const imgbbApiKey = process.env.IMGBB_API_KEY;
  
  if (!imgbbApiKey) {
    throw new Error("IMGBB_API_KEY chưa được cấu hình. Vui lòng lấy API key miễn phí từ https://api.imgbb.com");
  }
  
  // Validate API key format (ImgBB keys thường có 32 ký tự hex)
  if (imgbbApiKey.length < 20 || !/^[a-f0-9]+$/i.test(imgbbApiKey)) {
    console.warn("⚠️ IMGBB_API_KEY có format không đúng. ImgBB API keys thường là chuỗi hex 32 ký tự.");
  }
  
  // Đọc file buffer và convert sang base64
  const fileBuffer = fs.readFileSync(file.filepath);
  const base64 = fileBuffer.toString("base64");
  
  try {
    console.log("Calling ImgBB API...", {
      apiKeyLength: imgbbApiKey.length,
      apiKeyPrefix: imgbbApiKey.substring(0, 8),
      fileSize: fileBuffer.length,
      base64Length: base64.length,
      mimetype: file.mimetype,
    });
    
    // ImgBB API yêu cầu form-urlencoded với key và image (base64)
    // Sử dụng axios để đảm bảo encoding đúng
    const formData = new URLSearchParams();
    formData.append("key", imgbbApiKey);
    formData.append("image", base64);
    
    console.log("Sending request to ImgBB API...");
    
    let response;
    try {
      response = await axios.post("https://api.imgbb.com/1/upload", formData.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        maxRedirects: 0,
        validateStatus: () => true, // Don't throw on any status code
        timeout: 30000, // 30 seconds timeout
      });
    } catch (axiosError: any) {
      console.error("Axios error:", axiosError);
      if (axiosError.response) {
        // Server responded with error status
        const errorData = axiosError.response.data;
        const errorMsg = errorData?.error?.message || errorData?.error?.code || `HTTP ${axiosError.response.status}`;
        throw new Error(`ImgBB API error: ${errorMsg}`);
      } else if (axiosError.request) {
        // Request made but no response
        throw new Error(`ImgBB API không phản hồi: ${axiosError.message || "Network error"}`);
      } else {
        // Error setting up request
        throw new Error(`Lỗi khi gọi ImgBB API: ${axiosError.message || String(axiosError)}`);
      }
    }
    
    console.log("ImgBB API response status:", response.status);
    console.log("ImgBB API response data:", JSON.stringify(response.data, null, 2));
    
    const data = response.data;
    
    if (response.status !== 200) {
      const errorMessage = data?.error?.message || data?.error?.code || `HTTP ${response.status}: ${response.statusText || "Unknown error"}`;
      throw new Error(`ImgBB upload failed: ${errorMessage}`);
    }
    
    if (!data || typeof data !== "object") {
      throw new Error(`ImgBB returned invalid response: ${JSON.stringify(data).substring(0, 200)}`);
    }
    
    if (!data.success) {
      const errorMsg = data.error?.message || data.error?.code || JSON.stringify(data.error) || "Unknown error";
      throw new Error(`ImgBB upload failed: ${errorMsg}`);
    }
    
    if (!data.data || !data.data.url) {
      console.error("ImgBB response missing URL:", JSON.stringify(data, null, 2));
      throw new Error("ImgBB upload failed: Invalid response - missing URL");
    }
    
    console.log("ImgBB upload successful:", data.data.url);
    return data.data.url;
  } catch (error) {
    console.error("ImgBB upload error:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
      throw error; // Re-throw để handler bên ngoài có thể xử lý
    }
    throw new Error(`Không thể upload lên ImgBB: ${String(error)}`);
  }
}

/**
 * Upload file vào filesystem (CHỈ cho local development)
 * KHÔNG BAO GIỜ được gọi trên Vercel
 */
function uploadToFileSystem(
  file: formidable.File,
  oldPath?: string
): string {
  // Safety check: không bao giờ chạy trên Vercel
  if (process.env.VERCEL === "1") {
    throw new Error("uploadToFileSystem không thể chạy trên Vercel. Sử dụng Blob Storage hoặc ImgBB.");
  }
  
  // Tạo tên file unique
  const timestamp = Date.now();
  const originalName = file.originalFilename || "image";
  const ext = path.extname(originalName);
  const baseName = path
    .basename(originalName, ext)
    .replace(/[^a-z0-9]/gi, "-");
  const newFileName = `${baseName}-${timestamp}${ext}`;
  const newFilePath = path.join(
    process.cwd(),
    "public",
    "img-admin",
    newFileName
  );

  // Đảm bảo thư mục tồn tại
  const uploadDir = path.join(process.cwd(), "public", "img-admin");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Xóa file cũ nếu có
  if (oldPath && typeof oldPath === "string" && oldPath.trim()) {
    try {
      const oldFilePath = path.join(process.cwd(), "public", oldPath);
      if (
        oldFilePath.startsWith(path.join(process.cwd(), "public", "img-admin")) &&
        fs.existsSync(oldFilePath)
      ) {
        fs.unlinkSync(oldFilePath);
        console.log(`Đã xóa file cũ: ${oldFilePath}`);
      }
    } catch (deleteError) {
      console.warn("Không thể xóa file cũ:", deleteError);
    }
  }

  // Đổi tên file
  fs.renameSync(file.filepath, newFilePath);

  return `/img-admin/${newFileName}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // TODO: Thêm authentication check ở đây
    // if (!isAdmin(req)) return res.status(401).json({ message: "Unauthorized" });

    const useBlob = shouldUseBlob();
    const isVercel = process.env.VERCEL === "1";
    
    const hasImgBBKey = !!process.env.IMGBB_API_KEY;
    
    console.log("Upload request:", {
      useBlob,
      isVercel,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      hasImgBBKey,
      nodeEnv: process.env.NODE_ENV,
    });

    // Kiểm tra nếu đang trên Vercel nhưng không có cả Blob token và ImgBB key
    if (isVercel && !useBlob && !hasImgBBKey) {
      return res.status(500).json({
        message: "Không thể upload file. Vui lòng cấu hình BLOB_READ_WRITE_TOKEN hoặc IMGBB_API_KEY",
        error: "Cả BLOB_READ_WRITE_TOKEN và IMGBB_API_KEY đều chưa được cấu hình",
        hint: "Cách 1: Tạo Blob Store trong Vercel Dashboard và thêm BLOB_READ_WRITE_TOKEN vào Environment Variables. Xem VERCEL_BLOB_SETUP.md\nCách 2: Lấy API key miễn phí từ https://api.imgbb.com và thêm IMGBB_API_KEY vào Environment Variables. Xem IMGBB_SETUP.md",
      });
    }

    // Trên Vercel, luôn dùng temp dir (không thể ghi vào filesystem)
    // Local development mới dùng public/img-admin
    const uploadDir = isVercel 
      ? require("os").tmpdir() // Dùng temp dir trên Vercel
      : path.join(process.cwd(), "public", "img-admin");
    
    console.log("Upload directory:", {
      uploadDir,
      isVercel,
      useBlob,
      hasImgBBKey,
    });
    
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
      uploadDir,
    });

    const [fields, files] = await form.parse(req);
    
    // Lấy đường dẫn file cũ (nếu có) từ form field
    const oldPath = Array.isArray(fields.oldPath) 
      ? fields.oldPath[0] 
      : fields.oldPath;

    const uploadedFiles = Array.isArray(files.file) ? files.file : [files.file];

    if (!uploadedFiles[0]) {
      return res.status(400).json({ message: "Không có file được upload" });
    }

    const file = uploadedFiles[0];

    if (!file) {
      return res.status(400).json({ message: "File không hợp lệ" });
    }

    console.log("Processing file:", {
      filename: file.originalFilename,
      mimetype: file.mimetype,
      size: file.size,
      useBlob,
      hasImgBBKey,
    });

    // Kiểm tra kích thước file (ImgBB giới hạn 32MB, nhưng base64 sẽ lớn hơn ~33%)
    const maxSizeForImgBB = 20 * 1024 * 1024; // 20MB để đảm bảo base64 không vượt quá 32MB
    if (isVercel && hasImgBBKey && !useBlob && file.size > maxSizeForImgBB) {
      return res.status(400).json({
        message: "File quá lớn",
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) vượt quá giới hạn cho ImgBB (20MB)`,
        hint: "Vui lòng giảm kích thước file hoặc cấu hình Vercel Blob Storage để upload file lớn hơn",
      });
    }

    // Upload file
    let relativePath: string;
    try {
      // Đảm bảo không bao giờ gọi uploadToFileSystem trên Vercel
      if (isVercel) {
        if (useBlob) {
          console.log("Uploading to Vercel Blob Storage...");
          relativePath = await uploadToBlob(file, oldPath as string);
          console.log("Upload successful, path:", relativePath);
        } else if (hasImgBBKey) {
          // Trên Vercel nhưng không có Blob token, sử dụng ImgBB làm fallback
          console.log("Uploading to ImgBB (fallback)...");
          relativePath = await uploadToImgBB(file);
          console.log("Upload successful to ImgBB, URL:", relativePath);
        } else {
          // Trên Vercel nhưng không có cả Blob token và ImgBB key
          // Điều này không nên xảy ra vì đã check ở trên, nhưng để chắc chắn
          throw new Error("Không có phương thức upload nào được cấu hình trên Vercel. Vui lòng cấu hình BLOB_READ_WRITE_TOKEN hoặc IMGBB_API_KEY");
        }
      } else {
        // Local development, upload vào filesystem
        console.log("Uploading to filesystem (local development)...");
        relativePath = uploadToFileSystem(file, oldPath as string);
        console.log("Upload successful, path:", relativePath);
      }
    } catch (uploadError) {
      console.error("Upload failed:", uploadError);
      
      // Log chi tiết để debug
      console.error("Upload error details:", {
        error: uploadError instanceof Error ? uploadError.message : String(uploadError),
        stack: uploadError instanceof Error ? uploadError.stack : undefined,
        useBlob,
        isVercel,
        hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
        hasImgBBKey: !!process.env.IMGBB_API_KEY,
      });
      
      // Nếu lỗi do thiếu config trên Vercel
      if (isVercel && !useBlob && !hasImgBBKey && uploadError instanceof Error) {
        return res.status(500).json({
          message: "Không thể upload file. Vui lòng cấu hình BLOB_READ_WRITE_TOKEN hoặc IMGBB_API_KEY",
          error: uploadError.message,
          hint: "Cách 1: Tạo Blob Store trong Vercel Dashboard và thêm BLOB_READ_WRITE_TOKEN vào Environment Variables. Xem VERCEL_BLOB_SETUP.md\nCách 2: Lấy API key miễn phí từ https://api.imgbb.com và thêm IMGBB_API_KEY vào Environment Variables. Xem IMGBB_SETUP.md",
        });
      }
      
      // Nếu lỗi từ ImgBB upload
      if (isVercel && !useBlob && hasImgBBKey && uploadError instanceof Error) {
        return res.status(500).json({
          message: "Lỗi khi upload lên ImgBB",
          error: uploadError.message,
          hint: "Kiểm tra IMGBB_API_KEY có đúng không. Xem IMGBB_SETUP.md để biết cách lấy API key mới.",
        });
      }
      
      throw uploadError;
    }

    return res.status(200).json({
      message: "Upload thành công",
      path: relativePath,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      isVercel: process.env.VERCEL === "1",
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(500).json({
      message: "Lỗi khi upload file",
      error: errorMessage,
      ...(process.env.NODE_ENV === "development" && { stack: errorStack }),
    });
  }
}
