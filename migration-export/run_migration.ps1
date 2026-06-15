# =============================================================
# Vit-IELTS Database Migration — Local -> Remote Supabase
# Chay tat ca 42 SQL files tu dong qua psql trong Docker
# =============================================================
# CACH DUNG:
#   1. Mo PowerShell, cd vao thu muc nay
#   2. .\run_migration.ps1
#   3. Nhap connection string khi duoc hoi
# =============================================================

param(
    [string]$ConnStr = "postgresql://postgres.zafdudcwgejbiddcctjo:01062026tuyendung@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
)

$SQL_DIR = "$PSScriptRoot\sql-editor"
$CONTAINER = "supabase_db_Vit-IELTS"

# Test ket noi
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

# Danh sach files theo thu tu — scope: quiz + blog + course config
$FILES = @(
    "01_schema.sql",              # Tables, functions, RLS
    "02_config.sql",              # site_settings, cms_configs, mock_test_collections, mock_tests
    "data_quizzes_001.sql",       # Quiz list
    "data_passages_001.sql",      # Passages (IELTS reading)
    "data_passages_002.sql",
    "data_passages_003.sql",
    "data_questions_001.sql",     # Questions
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
    "data_sample_essays_001.sql", # Sample essays
    "data_posts_001.sql"          # Blog posts
)

$total = $FILES.Count
$ok = 0
$failed = @()
$startTime = Get-Date

Write-Host ""
Write-Host "Starting migration -- $total files" -ForegroundColor Cyan
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

    $sizeKB = [math]::Round((Get-Item $fpath).Length / 1KB)
    Write-Host "[$num/$total] ($($pct)%) $fname ($($sizeKB) KB)..." -NoNewline

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
        $result | Select-String "ERROR|FATAL" | Select-Object -First 3 |
            ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        $failed += $fname
        $cont = Read-Host "  Continue with remaining files? (Y/n)"
        if ($cont -eq "n") { break }
    }
}

# Tong ket
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

# Verify row counts
Write-Host ""
Write-Host "Quick verify (row counts):" -ForegroundColor Cyan
$verifySql = "SELECT 'quizzes' AS tbl, count(*)::text FROM public.quizzes " +
             "UNION ALL SELECT 'passages', count(*)::text FROM public.passages " +
             "UNION ALL SELECT 'questions', count(*)::text FROM public.questions " +
             "UNION ALL SELECT 'sample_essays', count(*)::text FROM public.sample_essays " +
             "UNION ALL SELECT 'posts', count(*)::text FROM public.posts " +
             "UNION ALL SELECT 'mock_tests', count(*)::text FROM public.mock_tests " +
             "UNION ALL SELECT 'mock_test_collections', count(*)::text FROM public.mock_test_collections;"
docker exec $CONTAINER psql $ConnStr -c $verifySql
