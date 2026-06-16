<?php
/**
 * Vit IELTS — VPS Media Upload Endpoint
 *
 * Receives multipart file uploads from the Next.js API layer,
 * saves them to /var/www/media/{category}/, and returns the public URL.
 *
 * Auth: X-Upload-Key header must match UPLOAD_SECRET env variable
 *       (set via Nginx fastcgi_param — never hard-coded here).
 *
 * Supported types: image/*, audio/*, application/pdf
 * Max size: 100 MB (enforced here; also set client_max_body_size in Nginx)
 */

declare(strict_types=1);

// ── Constants (from Nginx fastcgi_param) ──────────────────────────────────────
define('UPLOAD_SECRET', $_SERVER['UPLOAD_SECRET'] ?? '');
define('MEDIA_DIR',     rtrim($_SERVER['MEDIA_DIR'] ?? '/var/www/media', '/') . '/');
define('MEDIA_URL',     rtrim($_SERVER['MEDIA_URL'] ?? 'https://cms.vitieltstest.com/media', '/') . '/');
define('MAX_BYTES',     100 * 1024 * 1024); // 100 MB

// ── Helpers ───────────────────────────────────────────────────────────────────
function json_out(int $status, array $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

// ── CORS (server-to-server, but set for safety) ───────────────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: X-Upload-Key, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Method ────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(405, ['success' => false, 'error' => 'Method not allowed']);
}

// ── Auth ──────────────────────────────────────────────────────────────────────
$requestKey = $_SERVER['HTTP_X_UPLOAD_KEY'] ?? '';
if (!UPLOAD_SECRET || !hash_equals(UPLOAD_SECRET, $requestKey)) {
    json_out(401, ['success' => false, 'error' => 'Unauthorized']);
}

// ── File presence ─────────────────────────────────────────────────────────────
if (empty($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
    json_out(400, ['success' => false, 'error' => 'Không có file được upload']);
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    $phpErrors = [
        UPLOAD_ERR_INI_SIZE   => 'File vượt quá upload_max_filesize trong php.ini',
        UPLOAD_ERR_FORM_SIZE  => 'File vượt quá MAX_FILE_SIZE trong form',
        UPLOAD_ERR_PARTIAL    => 'File chỉ được upload một phần',
        UPLOAD_ERR_NO_TMP_DIR => 'Không tìm thấy thư mục tạm',
        UPLOAD_ERR_CANT_WRITE => 'Không thể ghi file lên disk',
    ];
    $msg = $phpErrors[$file['error']] ?? "Upload error code: {$file['error']}";
    json_out(500, ['success' => false, 'error' => $msg]);
}

// ── Size ──────────────────────────────────────────────────────────────────────
if ($file['size'] > MAX_BYTES) {
    json_out(413, ['success' => false, 'error' => 'File quá lớn. Tối đa 100 MB']);
}

// ── MIME detection (use finfo, not client-supplied) ───────────────────────────
$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

$mimeToCategory = [
    'image/jpeg'      => 'images',
    'image/png'       => 'images',
    'image/webp'      => 'images',
    'image/gif'       => 'images',
    'image/svg+xml'   => 'images',
    'audio/mpeg'      => 'audio',   // .mp3
    'audio/mp4'       => 'audio',   // .m4a
    'audio/ogg'       => 'audio',   // .ogg
    'audio/wav'       => 'audio',   // .wav
    'audio/webm'      => 'audio',   // .weba
    'audio/x-wav'     => 'audio',
    'audio/aac'       => 'audio',
    'application/pdf' => 'pdf',
];

if (!array_key_exists($mimeType, $mimeToCategory)) {
    json_out(415, ['success' => false, 'error' => "Loại file không được hỗ trợ: {$mimeType}"]);
}

$category = $mimeToCategory[$mimeType];

// ── Safe filename ─────────────────────────────────────────────────────────────
$originalName = $file['name'] ?? 'file';
$ext          = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
$baseName     = pathinfo($originalName, PATHINFO_FILENAME);
$safeName     = preg_replace('/[^a-z0-9\-]/i', '-', $baseName);
$safeName     = strtolower(substr((string)$safeName, 0, 60));
$safeName     = trim($safeName, '-') ?: 'file';
$filename     = $safeName . '-' . time() . '.' . $ext;

// ── Save file ─────────────────────────────────────────────────────────────────
$destDir = MEDIA_DIR . $category . '/';
if (!is_dir($destDir) && !mkdir($destDir, 0755, true)) {
    json_out(500, ['success' => false, 'error' => "Không thể tạo thư mục: {$destDir}"]);
}

$destPath = $destDir . $filename;
if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    json_out(500, ['success' => false, 'error' => 'Không thể lưu file lên server']);
}

// ── Response ──────────────────────────────────────────────────────────────────
$publicUrl = MEDIA_URL . $category . '/' . $filename;

json_out(200, [
    'success' => true,
    'data'    => [
        'url'      => $publicUrl,
        'filename' => $filename,
        'mimeType' => $mimeType,
        'category' => $category,
        'size'     => $file['size'],
    ],
]);
