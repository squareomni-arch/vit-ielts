#!/usr/bin/env bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Vit IELTS — cPanel Media Upload Setup
# Web root: /home/ieltspre/public_html/
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
set -euo pipefail

UPLOAD_SECRET="3dbfd0665d45051089cd0e16d8fea76fcf1857e739cf33d22758928e9e909d41"
WEB_ROOT="/home/ieltspre/public_html"
UPLOAD_DIR="$WEB_ROOT/upload-api"
MEDIA_DIR="$WEB_ROOT/media"
MEDIA_URL="https://cms.vitieltstest.com/media"

echo ">>> Tao thu muc..."
mkdir -p "$UPLOAD_DIR"
mkdir -p "$MEDIA_DIR/images" "$MEDIA_DIR/audio" "$MEDIA_DIR/pdf"
chmod 755 "$UPLOAD_DIR" "$MEDIA_DIR"

echo ">>> Block PHP trong /media/ bang .htaccess..."
cat > "$MEDIA_DIR/.htaccess" << 'HTEOF'
php_flag engine off
Options -ExecCGI
RemoveHandler .php .php3 .php4 .php5 .phtml
HTEOF

echo ">>> Ghi upload.php..."
cat > "$UPLOAD_DIR/upload.php" << 'ENDOFPHP'
<?php
/**
 * Vit IELTS — Media Upload API
 * Handle CORS and file uploads for Vercel frontend.
 */

// 1. Robust CORS Handling (Must be at the absolute top)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Methods: POST, OPTIONS, GET");
header("Access-Control-Allow-Headers: X-Upload-Key, Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 2. Configuration
define('UPLOAD_SECRET', '3dbfd0665d45051089cd0e16d8fea76fcf1857e739cf33d22758928e9e909d41');
define('MEDIA_DIR',     '/home/ieltspre/public_html/media/');
define('MEDIA_URL',     'https://cms.vitieltstest.com/media');
define('MAX_BYTES',     100 * 1024 * 1024);

/**
 * Helper to output JSON and exit
 */
function json_out($status, $payload) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. Validate Method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(405, ['success' => false, 'error' => 'Method not allowed']);
}

// 4. Validate Auth Key
// Support both standard and custom headers (LiteSpeed/Nginx variations)
$requestKey = $_SERVER['HTTP_X_UPLOAD_KEY'] ?? $_SERVER['X-Upload-Key'] ?? '';
if (!UPLOAD_SECRET || !hash_equals(UPLOAD_SECRET, $requestKey)) {
    json_out(401, ['success' => false, 'error' => 'Unauthorized']);
}

// 5. Basic PHP Upload Validation
if (empty($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
    json_out(400, ['success' => false, 'error' => 'Không có file được upload']);
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    $phpErrors = [
        UPLOAD_ERR_INI_SIZE   => 'File vượt quá upload_max_filesize trong php.ini',
        UPLOAD_ERR_FORM_SIZE  => 'File vượt quá MAX_FILE_SIZE',
        UPLOAD_ERR_PARTIAL    => 'File chỉ upload một phần',
        UPLOAD_ERR_NO_TMP_DIR => 'Không tìm thấy thư mục tạm',
        UPLOAD_ERR_CANT_WRITE => 'Không thể ghi file lên disk',
        UPLOAD_ERR_EXTENSION  => 'Một PHP extension đã chặn việc upload',
    ];
    json_out(500, ['success' => false, 'error' => $phpErrors[$file['error']] ?? "Lỗi upload: {$file['error']}"]);
}

if ($file['size'] > MAX_BYTES) {
    json_out(413, ['success' => false, 'error' => 'File quá lớn. Tối đa 100 MB']);
}

// 6. Mime Type Detection (with fallback)
$mimeType = '';
if (class_exists('finfo')) {
    $finfo    = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
} else if (function_exists('mime_content_type')) {
    $mimeType = mime_content_type($file['tmp_name']);
} else {
    $mimeType = $file['type']; // Fallback to browser-provided type (less secure)
}

$mimeToCategory = [
    'image/jpeg'      => 'images',
    'image/png'       => 'images',
    'image/webp'      => 'images',
    'image/gif'       => 'images',
    'image/svg+xml'   => 'images',
    'audio/mpeg'      => 'audio',
    'audio/mp4'       => 'audio',
    'audio/ogg'       => 'audio',
    'audio/wav'       => 'audio',
    'audio/webm'      => 'audio',
    'audio/x-wav'     => 'audio',
    'audio/aac'       => 'audio',
    'application/pdf' => 'pdf',
];

if (!array_key_exists($mimeType, $mimeToCategory)) {
    json_out(415, ['success' => false, 'error' => "Loại file không được hỗ trợ: {$mimeType}"]);
}

// 7. Generate Safe Filename
$category     = $mimeToCategory[$mimeType];
$originalName = $file['name'] ?? 'file';
$ext          = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
$baseName     = pathinfo($originalName, PATHINFO_FILENAME);
$safeName     = preg_replace('/[^a-z0-9\-]/i', '-', $baseName);
$safeName     = strtolower(substr((string)$safeName, 0, 60));
$safeName     = trim($safeName, '-') ?: 'file';
$filename     = $safeName . '-' . time() . '.' . $ext;

// 8. Move File
$destDir = MEDIA_DIR . $category . '/';
if (!is_dir($destDir) && !mkdir($destDir, 0755, true)) {
    json_out(500, ['success' => false, 'error' => "Không thể tạo thư mục: {$destDir}"]);
}

$destPath = $destDir . $filename;
if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    json_out(500, ['success' => false, 'error' => 'Không thể lưu file lên server']);
}

// 9. Success Response
json_out(200, [
    'success' => true,
    'data'    => [
        'url'      => MEDIA_URL . '/' . $category . '/' . $filename,
        'filename' => $filename,
        'mimeType' => $mimeType,
        'category' => $category,
        'size'     => $file['size'],
    ],
]);
ENDOFPHP

chmod 644 "$UPLOAD_DIR/upload.php"

echo ">>> Ghi delete.php..."
cat > "$UPLOAD_DIR/delete.php" << 'ENDOFPHP'
<?php
/**
 * Vit IELTS — Media Delete API
 */

// 1. CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: X-Upload-Key, Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

define('UPLOAD_SECRET', '3dbfd0665d45051089cd0e16d8fea76fcf1857e739cf33d22758928e9e909d41');
define('MEDIA_DIR',     '/home/ieltspre/public_html/media/');
define('MEDIA_URL_BASE', 'https://cms.vitieltstest.com/media/');

function json_out($status, $payload) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. Validate Auth
$requestKey = $_SERVER['HTTP_X_UPLOAD_KEY'] ?? $_SERVER['X-Upload-Key'] ?? '';
if (!UPLOAD_SECRET || !hash_equals(UPLOAD_SECRET, $requestKey)) {
    json_out(401, ['success' => false, 'error' => 'Unauthorized']);
}

// 3. Get URL to delete
$data = json_decode(file_get_contents('php://input'), true);
$fileUrl = $data['url'] ?? '';

if (!$fileUrl) {
    json_out(400, ['success' => false, 'error' => 'Thiếu URL file cần xóa']);
}

// 4. Resolve path
if (strpos($fileUrl, MEDIA_URL_BASE) !== 0) {
    json_out(400, ['success' => false, 'error' => 'URL không thuộc quản lý của hệ thống media']);
}

$relativePath = substr($fileUrl, strlen(MEDIA_URL_BASE));
// Security: prevent directory traversal
$relativePath = str_replace(['..', '\\'], ['', '/'], $relativePath);
$filePath = MEDIA_DIR . $relativePath;

if (file_exists($filePath)) {
    if (unlink($filePath)) {
        json_out(200, ['success' => true, 'message' => 'Đã xóa file vật lý']);
    } else {
        json_out(500, ['success' => false, 'error' => 'Không thể xóa file trên disk']);
    }
} else {
    json_out(200, ['success' => true, 'message' => 'File không tồn tại hoặc đã bị xóa trước đó']);
}
ENDOFPHP

chmod 644 "$UPLOAD_DIR/delete.php"

echo ""
echo "=================================================="
echo "DONE!"
echo ""
echo "Test upload:"
echo "curl -X POST https://cms.vitieltstest.com/upload-api/upload.php \\"
echo "  -H 'X-Upload-Key: ${UPLOAD_SECRET}' \\"
echo "  -F 'file=@/home/ieltspre/public_html/wp-login.php'"
echo "=================================================="
