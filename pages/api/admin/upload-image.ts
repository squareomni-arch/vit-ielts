import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { put, del } from "@vercel/blob";
import axios from "axios";
import { requireAdmin } from "~lib/admin-auth";
import { dbg } from "~lib/debug";

const log = dbg.upload;

// Disable body parser Ä‘á»ƒ xá»­ lÃ½ file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Kiá»ƒm tra xem cÃ³ nÃªn sá»­ dá»¥ng Vercel Blob Storage khÃ´ng
 */
function shouldUseBlob(): boolean {
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  const isVercel = process.env.VERCEL === "1";
  const result = hasBlobToken && isVercel;
  
  if (isVercel && !hasBlobToken) {
    log.warn("âš ï¸ Running on Vercel but BLOB_READ_WRITE_TOKEN is not configured. File upload will fail.");
  }
  
  return result;
}

/**
 * Upload file lÃªn Vercel Blob Storage
 */
async function uploadToBlob(
  file: formidable.File,
  oldPath?: string
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN khÃ´ng Ä‘Æ°á»£c cáº¥u hÃ¬nh");
  }

  // Äá»c file buffer
  const fileBuffer = fs.readFileSync(file.filepath);
  
  // Táº¡o tÃªn file unique
  const timestamp = Date.now();
  const originalName = file.originalFilename || "image";
  const ext = path.extname(originalName);
  const baseName = path
    .basename(originalName, ext)
    .replace(/[^a-z0-9]/gi, "-");
  const fileName = `img-admin/${baseName}-${timestamp}${ext}`;

  // XÃ³a file cÅ© náº¿u cÃ³
  if (oldPath && typeof oldPath === "string" && oldPath.trim()) {
    try {
      // Extract blob key tá»« oldPath (format: /img-admin/filename.jpg)
      const blobKey = oldPath.startsWith("/") ? oldPath.substring(1) : oldPath;
      if (blobKey.startsWith("img-admin/")) {
        await del(blobKey, { token });
        log(`ÄÃ£ xÃ³a file cÅ© tá»« Blob: ${blobKey}`);
      }
    } catch (deleteError) {
      log.warn("KhÃ´ng thá»ƒ xÃ³a file cÅ© tá»« Blob:", deleteError);
    }
  }

  // Upload file má»›i
  const blob = await put(fileName, fileBuffer, {
    access: "public",
    token,
    contentType: file.mimetype || "image/jpeg",
  });

  return `/${blob.pathname}`;
}

/**
 * Upload file lÃªn ImgBB (fallback khi khÃ´ng cÃ³ Blob Storage)
 */
async function uploadToImgBB(file: formidable.File): Promise<string> {
  const imgbbApiKey = process.env.IMGBB_API_KEY;
  
  if (!imgbbApiKey) {
    throw new Error("IMGBB_API_KEY chÆ°a Ä‘Æ°á»£c cáº¥u hÃ¬nh. Vui lÃ²ng láº¥y API key miá»…n phÃ­ tá»« https://api.imgbb.com");
  }
  
  // Validate API key format (ImgBB keys thÆ°á»ng cÃ³ 32 kÃ½ tá»± hex)
  if (imgbbApiKey.length < 20 || !/^[a-f0-9]+$/i.test(imgbbApiKey)) {
    log.warn("âš ï¸ IMGBB_API_KEY cÃ³ format khÃ´ng Ä‘Ãºng. ImgBB API keys thÆ°á»ng lÃ  chuá»—i hex 32 kÃ½ tá»±.");
  }
  
  // Äá»c file buffer vÃ  convert sang base64
  const fileBuffer = fs.readFileSync(file.filepath);
  const base64 = fileBuffer.toString("base64");
  
  try {
    log("Calling ImgBB API...", {
      apiKeyPresent: true,
      fileSize: fileBuffer.length,
      base64Length: base64.length,
      mimetype: file.mimetype,
    });
    
    // ImgBB API yÃªu cáº§u form-urlencoded vá»›i key vÃ  image (base64)
    // Sá»­ dá»¥ng axios Ä‘á»ƒ Ä‘áº£m báº£o encoding Ä‘Ãºng
    const formData = new URLSearchParams();
    formData.append("key", imgbbApiKey);
    formData.append("image", base64);
    
    log("Sending request to ImgBB API...");
    
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
      log.error("Axios error:", axiosError);
      if (axiosError.response) {
        // Server responded with error status
        const errorData = axiosError.response.data;
        const errorMsg = errorData?.error?.message || errorData?.error?.code || `HTTP ${axiosError.response.status}`;
        throw new Error(`ImgBB API error: ${errorMsg}`);
      } else if (axiosError.request) {
        // Request made but no response
        throw new Error(`ImgBB API khÃ´ng pháº£n há»“i: ${axiosError.message || "Network error"}`);
      } else {
        // Error setting up request
        throw new Error(`Lá»—i khi gá»i ImgBB API: ${axiosError.message || String(axiosError)}`);
      }
    }
    
    log("ImgBB API response status:", response.status);
    log("ImgBB API response data:", JSON.stringify(response.data, null, 2));
    
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
      log.error("ImgBB response missing URL:", JSON.stringify(data, null, 2));
      throw new Error("ImgBB upload failed: Invalid response - missing URL");
    }
    
    log("ImgBB upload successful:", data.data.url);
    return data.data.url;
  } catch (error) {
    log.error("ImgBB upload error:", error);
    if (error instanceof Error) {
      log.error("Error stack:", error.stack);
      throw error; // Re-throw Ä‘á»ƒ handler bÃªn ngoÃ i cÃ³ thá»ƒ xá»­ lÃ½
    }
    throw new Error(`KhÃ´ng thá»ƒ upload lÃªn ImgBB: ${String(error)}`);
  }
}

/**
 * Upload file vÃ o filesystem (CHá»ˆ cho local development)
 * KHÃ”NG BAO GIá»œ Ä‘Æ°á»£c gá»i trÃªn Vercel
 */
function uploadToFileSystem(
  file: formidable.File,
  oldPath?: string
): string {
  // Safety check: khÃ´ng bao giá» cháº¡y trÃªn Vercel
  if (process.env.VERCEL === "1") {
    throw new Error("uploadToFileSystem khÃ´ng thá»ƒ cháº¡y trÃªn Vercel. Sá»­ dá»¥ng Blob Storage hoáº·c ImgBB.");
  }
  
  // Táº¡o tÃªn file unique
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

  // Äáº£m báº£o thÆ° má»¥c tá»“n táº¡i
  const uploadDir = path.join(process.cwd(), "public", "img-admin");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // XÃ³a file cÅ© náº¿u cÃ³
  if (oldPath && typeof oldPath === "string" && oldPath.trim()) {
    try {
      const oldFilePath = path.join(process.cwd(), "public", oldPath);
      if (
        oldFilePath.startsWith(path.join(process.cwd(), "public", "img-admin")) &&
        fs.existsSync(oldFilePath)
      ) {
        fs.unlinkSync(oldFilePath);
        log(`ÄÃ£ xÃ³a file cÅ©: ${oldFilePath}`);
      }
    } catch (deleteError) {
      log.warn("KhÃ´ng thá»ƒ xÃ³a file cÅ©:", deleteError);
    }
  }

  // Äá»•i tÃªn file
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
    const user = await requireAdmin(req, res);
    if (!user) return;

    const useBlob = shouldUseBlob();
    const isVercel = process.env.VERCEL === "1";
    
    const hasImgBBKey = !!process.env.IMGBB_API_KEY;
    
    log("Upload request:", {
      useBlob,
      isVercel,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      hasImgBBKey,
      nodeEnv: process.env.NODE_ENV,
    });

    // Kiá»ƒm tra náº¿u Ä‘ang trÃªn Vercel nhÆ°ng khÃ´ng cÃ³ cáº£ Blob token vÃ  ImgBB key
    if (isVercel && !useBlob && !hasImgBBKey) {
      return res.status(500).json({
        message: "KhÃ´ng thá»ƒ upload file. Vui lÃ²ng cáº¥u hÃ¬nh BLOB_READ_WRITE_TOKEN hoáº·c IMGBB_API_KEY",
        error: "Cáº£ BLOB_READ_WRITE_TOKEN vÃ  IMGBB_API_KEY Ä‘á»u chÆ°a Ä‘Æ°á»£c cáº¥u hÃ¬nh",
        hint: "CÃ¡ch 1: Táº¡o Blob Store trong Vercel Dashboard vÃ  thÃªm BLOB_READ_WRITE_TOKEN vÃ o Environment Variables. Xem VERCEL_BLOB_SETUP.md\nCÃ¡ch 2: Láº¥y API key miá»…n phÃ­ tá»« https://api.imgbb.com vÃ  thÃªm IMGBB_API_KEY vÃ o Environment Variables. Xem IMGBB_SETUP.md",
      });
    }

    // TrÃªn Vercel, luÃ´n dÃ¹ng temp dir (khÃ´ng thá»ƒ ghi vÃ o filesystem)
    // Local development má»›i dÃ¹ng public/img-admin
    const uploadDir = isVercel 
      ? require("os").tmpdir() // DÃ¹ng temp dir trÃªn Vercel
      : path.join(process.cwd(), "public", "img-admin");
    
    log("Upload directory:", {
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
    
    // Láº¥y Ä‘Æ°á»ng dáº«n file cÅ© (náº¿u cÃ³) tá»« form field
    const oldPath = Array.isArray(fields.oldPath) 
      ? fields.oldPath[0] 
      : fields.oldPath;

    const uploadedFiles = Array.isArray(files.file) ? files.file : [files.file];

    if (!uploadedFiles[0]) {
      return res.status(400).json({ message: "KhÃ´ng cÃ³ file Ä‘Æ°á»£c upload" });
    }

    const file = uploadedFiles[0];

    if (!file) {
      return res.status(400).json({ message: "File khÃ´ng há»£p lá»‡" });
    }

    // Validate file type — only allow safe image formats
    const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!file.mimetype || !ALLOWED_MIMES.includes(file.mimetype)) {
      return res.status(400).json({
        message: "File type not allowed",
        error: `Allowed: ${ALLOWED_MIMES.join(", ")}. Got: ${file.mimetype || "unknown"}`,
      });
    }

    log("Processing file:", {
      filename: file.originalFilename,
      mimetype: file.mimetype,
      size: file.size,
      useBlob,
      hasImgBBKey,
    });

    // Kiá»ƒm tra kÃ­ch thÆ°á»›c file (ImgBB giá»›i háº¡n 32MB, nhÆ°ng base64 sáº½ lá»›n hÆ¡n ~33%)
    const maxSizeForImgBB = 20 * 1024 * 1024; // 20MB Ä‘á»ƒ Ä‘áº£m báº£o base64 khÃ´ng vÆ°á»£t quÃ¡ 32MB
    if (isVercel && hasImgBBKey && !useBlob && file.size > maxSizeForImgBB) {
      return res.status(400).json({
        message: "File quÃ¡ lá»›n",
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) vÆ°á»£t quÃ¡ giá»›i háº¡n cho ImgBB (20MB)`,
        hint: "Vui lÃ²ng giáº£m kÃ­ch thÆ°á»›c file hoáº·c cáº¥u hÃ¬nh Vercel Blob Storage Ä‘á»ƒ upload file lá»›n hÆ¡n",
      });
    }

    // Upload file
    let relativePath: string;
    try {
      // Äáº£m báº£o khÃ´ng bao giá» gá»i uploadToFileSystem trÃªn Vercel
      if (isVercel) {
        if (useBlob) {
          log("Uploading to Vercel Blob Storage...");
          relativePath = await uploadToBlob(file, oldPath as string);
          log("Upload successful, path:", relativePath);
        } else if (hasImgBBKey) {
          // TrÃªn Vercel nhÆ°ng khÃ´ng cÃ³ Blob token, sá»­ dá»¥ng ImgBB lÃ m fallback
          log("Uploading to ImgBB (fallback)...");
          relativePath = await uploadToImgBB(file);
          log("Upload successful to ImgBB, URL:", relativePath);
        } else {
          // TrÃªn Vercel nhÆ°ng khÃ´ng cÃ³ cáº£ Blob token vÃ  ImgBB key
          // Äiá»u nÃ y khÃ´ng nÃªn xáº£y ra vÃ¬ Ä‘Ã£ check á»Ÿ trÃªn, nhÆ°ng Ä‘á»ƒ cháº¯c cháº¯n
          throw new Error("KhÃ´ng cÃ³ phÆ°Æ¡ng thá»©c upload nÃ o Ä‘Æ°á»£c cáº¥u hÃ¬nh trÃªn Vercel. Vui lÃ²ng cáº¥u hÃ¬nh BLOB_READ_WRITE_TOKEN hoáº·c IMGBB_API_KEY");
        }
      } else {
        // Local development, upload vÃ o filesystem
        log("Uploading to filesystem (local development)...");
        relativePath = uploadToFileSystem(file, oldPath as string);
        log("Upload successful, path:", relativePath);
      }
    } catch (uploadError) {
      log.error("Upload failed:", uploadError);
      
      // Log chi tiáº¿t Ä‘á»ƒ debug
      log.error("Upload error details:", {
        error: uploadError instanceof Error ? uploadError.message : String(uploadError),
        stack: uploadError instanceof Error ? uploadError.stack : undefined,
        useBlob,
        isVercel,
        hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
        hasImgBBKey: !!process.env.IMGBB_API_KEY,
      });
      
      // Náº¿u lá»—i do thiáº¿u config trÃªn Vercel
      if (isVercel && !useBlob && !hasImgBBKey && uploadError instanceof Error) {
        return res.status(500).json({
          message: "KhÃ´ng thá»ƒ upload file. Vui lÃ²ng cáº¥u hÃ¬nh BLOB_READ_WRITE_TOKEN hoáº·c IMGBB_API_KEY",
          error: uploadError.message,
          hint: "CÃ¡ch 1: Táº¡o Blob Store trong Vercel Dashboard vÃ  thÃªm BLOB_READ_WRITE_TOKEN vÃ o Environment Variables. Xem VERCEL_BLOB_SETUP.md\nCÃ¡ch 2: Láº¥y API key miá»…n phÃ­ tá»« https://api.imgbb.com vÃ  thÃªm IMGBB_API_KEY vÃ o Environment Variables. Xem IMGBB_SETUP.md",
        });
      }
      
      // Náº¿u lá»—i tá»« ImgBB upload
      if (isVercel && !useBlob && hasImgBBKey && uploadError instanceof Error) {
        return res.status(500).json({
          message: "Lá»—i khi upload lÃªn ImgBB",
          error: uploadError.message,
          hint: "Kiá»ƒm tra IMGBB_API_KEY cÃ³ Ä‘Ãºng khÃ´ng. Xem IMGBB_SETUP.md Ä‘á»ƒ biáº¿t cÃ¡ch láº¥y API key má»›i.",
        });
      }
      
      throw uploadError;
    }

    return res.status(200).json({
      message: "Upload thÃ nh cÃ´ng",
      path: relativePath,
    });
  } catch (error) {
    log.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    log.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      isVercel: process.env.VERCEL === "1",
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(500).json({
      message: "Lá»—i khi upload file",
      error: errorMessage,
      ...(process.env.NODE_ENV === "development" && { stack: errorStack }),
    });
  }
}
