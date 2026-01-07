# 중복 JS 파일 삭제 스크립트 (PowerShell)
# 작성일: 2026-01-07
# 목적: TypeScript 전환 후 남은 JS 파일 정리

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  중복 JS 파일 삭제 스크립트                               ║" -ForegroundColor Cyan
Write-Host "║  (TypeScript 파일이 이미 존재하는 JS 파일만 삭제)          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 현재 디렉토리 확인
if (-Not (Test-Path "src")) {
    Write-Host "❌ 에러: src 폴더가 없습니다. 프로젝트 루트에서 실행하세요." -ForegroundColor Red
    exit 1
}

Write-Host "📂 작업 디렉토리: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# 삭제 카운터
$count = 0

Write-Host "🔍 Firebase 폴더 정리 중..." -ForegroundColor Green
$firebaseFiles = @(
    "src\firebase\allowedUsers.js",
    "src\firebase\auth.js",
    "src\firebase\config.js",
    "src\firebase\history.js",
    "src\firebase\index.js",
    "src\firebase\inquiries.js",
    "src\firebase\invitations.js",
    "src\firebase\joinRequests.js",
    "src\firebase\requests.js",
    "src\firebase\rooms.js",
    "src\firebase\settings.js",
    "src\firebase\users.js"
)

foreach ($file in $firebaseFiles) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Force
        Write-Host "  ✅ 삭제: $file" -ForegroundColor Green
        $count++
    } else {
        Write-Host "  ⏭️  없음: $file" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🔍 Utils 폴더 정리 중..." -ForegroundColor Green
$utilsFiles = @(
    "src\utils\constants.js",
    "src\utils\csvExport.js",
    "src\utils\csvParser.js",
    "src\utils\genderUtils.js",
    "src\utils\matchingUtils.js",
    "src\utils\notifications.js",
    "src\utils\rateLimit.js",
    "src\utils\sanitize.js"
)

foreach ($file in $utilsFiles) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Force
        Write-Host "  ✅ 삭제: $file" -ForegroundColor Green
        $count++
    } else {
        Write-Host "  ⏭️  없음: $file" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🔍 Contexts 폴더 정리 중..." -ForegroundColor Green
if (Test-Path "src\contexts\index.js") {
    Remove-Item -Path "src\contexts\index.js" -Force
    Write-Host "  ✅ 삭제: src\contexts\index.js" -ForegroundColor Green
    $count++
} else {
    Write-Host "  ⏭️  없음: src\contexts\index.js" -ForegroundColor Gray
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  정리 완료!                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "📊 총 $count개 파일 삭제됨" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  다음 단계:" -ForegroundColor Yellow
Write-Host "  1. npm run build (빌드 확인)"
Write-Host "  2. npm run lint (린트 확인)"
Write-Host "  3. npm run test (테스트 확인)"
Write-Host "  4. Git 커밋"
Write-Host ""

