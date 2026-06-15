# =============================================================
# Vit-IELTS Database Migration — Local → Remote Supabase
# Chạy tất cả 42 SQL files tự động qua psql trong Docker
# =============================================================
# CÁCH DÙNG:
#   1. Mở PowerShell, cd vào thư mục này
#   2. .\run_migration.ps1
#   3. Nhập connection string khi được hỏi
# =============================================================

param(
    [string]$ConnStr = ""
)

$SQL_DIR = "$PSScriptRoot\sql-editor"
$CONTAINER = "supabase_db_Vit-IELTS"   # container psql local dùng để kết nối

# ── Lấy connection string ────────────────────────────────────
if (-not $ConnStr) {
    Write-Host ""
    Write-Host "Nhap connection string remote (Enter de dung 127.0.0.1 → api.squarevps.com):"
    Write-Host "  Vi du: postgresql://postgres:PASSWORD@api.squarevps.com:5432/postgres"
    $ConnStr = Read-Host "Connection string"
}

# Nếu user paste string có 127.0.0.1 → tự động đổi thành api.squarevps.com
if ($ConnStr -match "127\.0\.0\.1") {
    $ConnStr = $ConnStr -replace "127\.0\.0\.1", "api.squarevps.com"
    Write-Host "  [auto] Replaced 127.0.0.1 -> api.squarevps.com" -ForegroundColor Yellow
}

# ── Test kết nối ────────────────────────────────────────────
Write-Host ""
Write-Host "Testing connection..." -ForegroundColor Cyan
$testResult = docker exec $CONTAINER psql $ConnStr -c "SELECT current_database(), version();" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: Cannot connect to remote database" -ForegroundColor Red
    Write-Host $testResult
    exit 1
}
Write-Host "Connected OK" -ForegroundColor Green
Write-Host $testResult

# ── Danh sách files theo thứ tự ──────────────────────────────
$FILES = @(
    "01_schema.sql",
    "02_auth_users.sql",
    "03_small_tables.sql",
    "data_quizzes_001.sql",
    "data_activity_logs_001.sql",
    "data_passages_001.sql",
    "data_passages_002.sql",
    "data_passages_003.sql",
    "data_questions_001.sql",
    "data_questions_002.sql",
    "data_questions_003.sql",
    "data_questions_004.sql",
    "data_questions_005.sql",
    "data_questions_006.sql",
    "data_questions_007.sql",
    "data_questions_008.sql",
    "data_questions_009.sql",
    "data_questions_010.sql",
    "data_questions_011.sql",
    "data_questions_012.sql",
    "data_questions_013.sql",
    "data_questions_014.sql",
    "data_questions_015.sql",
    "data_questions_016.sql",
    "data_questions_017.sql",
    "data_questions_018.sql",
    "data_questions_019.sql",
    "data_questions_020.sql",
    "data_questions_021.sql",
    "data_questions_022.sql",
    "data_questions_023.sql",
    "data_questions_024.sql",
    "data_questions_025.sql",
    "data_questions_026.sql",
    "data_sample_essays_001.sql",
    "data_sample_essays_002.sql",
    "data_sample_essays_003.sql",
    "data_sample_essays_004.sql",
    "data_sample_essays_005.sql",
    "data_posts_001.sql",
    "data_posts_002.sql",
    "data_posts_003.sql"
)

$total = $FILES.Count
$ok = 0
$failed = @()
$startTime = Get-Date

Write-Host ""
Write-Host "Starting migration — $total files" -ForegroundColor Cyan
Write-Host ("=" * 60)

foreach ($i in 0..($FILES.Count - 1)) {
    $fname = $FILES[$i]
    $fpath = "$SQL_DIR\$fname"
    $num   = $i + 1
    $pct   = [math]::Round($num / $total * 100)

    if (-not (Test-Path $fpath)) {
        Write-Host "[$num/$total] SKIP (not found): $fname" -ForegroundColor DarkGray
        continue
    }

    $size = [math]::Round((Get-Item $fpath).Length / 1KB)
    Write-Host "[$num/$total] ($pct%) Running: $fname ($size KB)..." -NoNewline

    # Copy file vào container, chạy psql, xóa file
    $containerPath = "/tmp/mig_$fname"
    docker cp $fpath "${CONTAINER}:${containerPath}" 2>$null
    $result = docker exec $CONTAINER psql $ConnStr -f $containerPath 2>&1
    $exitCode = $LASTEXITCODE
    docker exec $CONTAINER rm -f $containerPath 2>$null

    if ($exitCode -eq 0) {
        Write-Host " OK" -ForegroundColor Green
        $ok++
    } else {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  Error: $($result | Select-String 'ERROR|FATAL' | Select-Object -First 3)" -ForegroundColor Red
        $failed += $fname
        # Hỏi có tiếp tục không
        $cont = Read-Host "  Continue with remaining files? (Y/n)"
        if ($cont -eq 'n') { break }
    }
}

# ── Tổng kết ────────────────────────────────────────────────
$elapsed = (Get-Date) - $startTime
Write-Host ""
Write-Host ("=" * 60)
Write-Host "Done in $([math]::Round($elapsed.TotalMinutes, 1)) minutes"
Write-Host "  Succeeded : $ok / $total" -ForegroundColor Green
if ($failed.Count -gt 0) {
    Write-Host "  Failed    : $($failed.Count)" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
} else {
    Write-Host "  No failures" -ForegroundColor Green
}

# ── Verify ──────────────────────────────────────────────────
Write-Host ""
Write-Host "Quick verify (row counts):" -ForegroundColor Cyan
$verifySQL = @"
SELECT 'quizzes' AS tbl, count(*) FROM public.quizzes
UNION ALL SELECT 'passages', count(*) FROM public.passages
UNION ALL SELECT 'questions', count(*) FROM public.questions
UNION ALL SELECT 'sample_essays', count(*) FROM public.sample_essays
UNION ALL SELECT 'posts', count(*) FROM public.posts
UNION ALL SELECT 'users', count(*) FROM public.users
UNION ALL SELECT 'auth.users', count(*) FROM auth.users;
"@
docker exec $CONTAINER psql $ConnStr -c $verifySQL
