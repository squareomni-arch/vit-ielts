import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Block in production — debug endpoints should not exist outside development
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ error: "Not found" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireAdmin(req, res);
  if (!user) return;

  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  const hasImgBBKey = !!process.env.IMGBB_API_KEY;
  const isVercel = process.env.VERCEL === "1";
  const nodeEnv = process.env.NODE_ENV;

  // Kiểm tra ImgBB API key có hợp lệ không
  let imgbbTestResult = null;
  if (hasImgBBKey) {
    try {
      const testResponse = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          key: process.env.IMGBB_API_KEY || "",
          image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", // 1x1 transparent PNG
        }).toString(),
      });

      imgbbTestResult = {
        status: testResponse.status,
        ok: testResponse.ok,
        message: testResponse.ok ? "API key hợp lệ" : `Lỗi: ${testResponse.statusText}`,
      };
    } catch (error) {
      imgbbTestResult = {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return res.status(200).json({
    environment: {
      isVercel,
      nodeEnv,
    },
    blobStorage: {
      configured: hasBlobToken,
      tokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length || 0,
    },
    imgbb: {
      configured: hasImgBBKey,
      apiKeyLength: process.env.IMGBB_API_KEY?.length || 0,
      apiKeyPrefix: process.env.IMGBB_API_KEY?.substring(0, 8) || "N/A",
      testResult: imgbbTestResult,
    },
    uploadMethod: isVercel
      ? hasBlobToken
        ? "Vercel Blob Storage"
        : hasImgBBKey
        ? "ImgBB API"
        : "Không có phương thức nào được cấu hình"
      : "Local filesystem",
  });
}

