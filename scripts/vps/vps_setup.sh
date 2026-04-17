#!/usr/bin/env bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# IELTS Prediction — cPanel Media Upload Setup
# Web root: /home/ieltspre/public_html/
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
set -euo pipefail

UPLOAD_SECRET="3dbfd0665d45051089cd0e16d8fea76fcf1857e739cf33d22758928e9e909d41"
WEB_ROOT="/home/ieltspre/public_html"
UPLOAD_DIR="$WEB_ROOT/upload-api"
MEDIA_DIR="$WEB_ROOT/media"
MEDIA_URL="https://cms.ieltspredictiontest.com/media"

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
declare(strict_types=1);

// Secret stored here since cPanel has no fastcgi_param.
// Keep this file non-listable (no directory index).
define('UPLOAD_SECRET', '3dbfd0665d45051089cd0e16d8fea76fcf1857e739cf33d22758928e9e909d41');
define('MEDIA_DIR',     '/home/ieltspre/public_html/media/');
define('MEDIA_URL',     'https://cms.ieltspredictiontest.com/media');
define('MAX_BYTES',     100 * 1024 * 1024);

function json_out(int $status, array $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: X-Upload-Key, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(405, ['success' => false, 'error' => 'Method not allowed']);
}

$requestKey = $_SERVER['HTTP_X_UPLOAD_KEY'] ?? '';
if (!UPLOAD_SECRET || !hash_equals(UPLOAD_SECRET, $requestKey)) {
    json_out(401, ['success' => false, 'error' => 'Unauthorized']);
}

if (empty($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
    json_out(400, ['success' => false, 'error' => 'Khong co file duoc upload']);
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    $phpErrors = [
        UPLOAD_ERR_INI_SIZE   => 'File vuot qua upload_max_filesize trong php.ini',
        UPLOAD_ERR_FORM_SIZE  => 'File vuot qua MAX_FILE_SIZE',
        UPLOAD_ERR_PARTIAL    => 'File chi upload mot phan',
        UPLOAD_ERR_NO_TMP_DIR => 'Khong tim thay thu muc tam',
        UPLOAD_ERR_CANT_WRITE => 'Khong the ghi file len disk',
    ];
    json_out(500, ['success' => false, 'error' => $phpErrors[$file['error']] ?? "Upload error: {$file['error']}"]);
}

if ($file['size'] > MAX_BYTES) {
    json_out(413, ['success' => false, 'error' => 'File qua lon. Toi da 100 MB']);
}

$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

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
    json_out(415, ['success' => false, 'error' => "Loai file khong duoc ho tro: {$mimeType}"]);
}

$category     = $mimeToCategory[$mimeType];
$originalName = $file['name'] ?? 'file';
$ext          = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
$baseName     = pathinfo($originalName, PATHINFO_FILENAME);
$safeName     = preg_replace('/[^a-z0-9\-]/i', '-', $baseName);
$safeName     = strtolower(substr((string)$safeName, 0, 60));
$safeName     = trim($safeName, '-') ?: 'file';
$filename     = $safeName . '-' . time() . '.' . $ext;

$destDir = MEDIA_DIR . $category . '/';
if (!is_dir($destDir) && !mkdir($destDir, 0755, true)) {
    json_out(500, ['success' => false, 'error' => "Khong the tao thu muc: {$destDir}"]);
}

$destPath = $destDir . $filename;
if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    json_out(500, ['success' => false, 'error' => 'Khong the luu file len server']);
}

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

echo ""
echo "=================================================="
echo "DONE!"
echo ""
echo "Test upload:"
echo "curl -X POST https://cms.ieltspredictiontest.com/upload-api/upload.php \\"
echo "  -H 'X-Upload-Key: ${UPLOAD_SECRET}' \\"
echo "  -F 'file=@/home/ieltspre/public_html/wp-login.php'"
echo "=================================================="
