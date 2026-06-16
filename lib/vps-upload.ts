/**
 * VPS Media Upload Utility
 *
 * Sends files to the custom PHP upload endpoint on the VPS
 * (cms.vitieltstest.com/upload-api/upload.php).
 *
 * The database (Supabase) stores only the returned public URL.
 * No files are stored in Supabase Storage.
 *
 * Required env vars:
 *   MEDIA_UPLOAD_URL    — full URL to upload.php on the VPS
 *   MEDIA_UPLOAD_SECRET — secret key set in Nginx fastcgi_param
 */

const UPLOAD_URL = process.env.MEDIA_UPLOAD_URL ?? "";
const UPLOAD_SECRET = process.env.MEDIA_UPLOAD_SECRET ?? "";

export interface VpsUploadResult {
  url: string;
  filename: string;
  mimeType: string;
  category: "images" | "audio" | "pdf";
  size: number;
}

/**
 * Uploads a file buffer to the VPS via the PHP endpoint.
 * Returns the public URL and metadata.
 *
 * @throws if env vars are missing, the server is unreachable,
 *         auth fails, or the file type is not accepted.
 */
export async function uploadToVPS(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<VpsUploadResult> {
  if (!UPLOAD_URL) {
    throw new Error("MEDIA_UPLOAD_URL chưa được cấu hình trong environment variables");
  }
  if (!UPLOAD_SECRET) {
    throw new Error("MEDIA_UPLOAD_SECRET chưa được cấu hình trong environment variables");
  }

  // Build multipart form — PHP $_FILES expects standard multipart
  const formData = new FormData();
  // Convert Buffer → Uint8Array so the Blob constructor is happy in Node 18+
  formData.append(
    "file",
    new Blob([new Uint8Array(fileBuffer)], { type: mimeType }),
    originalFilename
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000); // 2-minute timeout

  let response: Response;
  try {
    response = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: { 
        "X-Upload-Key": UPLOAD_SECRET,
        "ngrok-skip-browser-warning": "true",
      },
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === "AbortError") {
      throw new Error("Upload VPS timeout sau 120 giây");
    }
    throw new Error(`Không thể kết nối VPS: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }

  const json = await response.json().catch(() => ({})) as {
    success?: boolean;
    error?: string;
    data?: VpsUploadResult;
  };

  if (!response.ok || !json.success) {
    throw new Error(
      `Upload VPS thất bại (HTTP ${response.status}): ${json.error ?? "Unknown error"}`
    );
  }

  if (!json.data?.url) {
    throw new Error("VPS không trả về URL của file đã upload");
  }

  return json.data;
}

/**
 * Deletes a file from the VPS via the PHP endpoint.
 *
 * @param url The public URL of the file to delete.
 */
export async function deleteFromVPS(url: string): Promise<void> {
  const deleteUrl = UPLOAD_URL.replace("upload.php", "delete.php");
  if (!deleteUrl || !UPLOAD_SECRET) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(deleteUrl, {
      method: "POST",
      headers: {
        "X-Upload-Key": UPLOAD_SECRET,
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    const json = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || !json.success) {
      console.error(`Xóa file VPS thất bại: ${json.error ?? "Unknown error"}`);
    }
  } catch (err) {
    console.error(`Lỗi kết nối VPS khi xóa: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}

