# ============================================================
# SCRIPT 1-CLICK DEPLOY TỪ WINDOWS LÊN VPS 103.163.214.101
# ============================================================
param (
    [string]$VpsIp = "103.163.214.101",
    [string]$VpsUser = "root",
    [switch]$SkipBuild
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  TRIỂN KHAI BẢN MỚI CHUM CHUM BAKERY KHO LÊN VPS $VpsIp" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not $SkipBuild) {
    Write-Host "[+] Đang build bản Next.js Standalone mới nhất..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[-] Build thất bại! Vui lòng kiểm tra lỗi code." -ForegroundColor Red
        exit 1
    }
    Write-Host "[+] Sao chép static files & file cấu hình..." -ForegroundColor Yellow
    Copy-Item -Path ".next\static" -Destination ".next\standalone\.next\static" -Recurse -Force
    if (Test-Path ".env.local") {
        Copy-Item -Path ".env.local" -Destination ".next\standalone\.env.production" -Force
    }
    if (Test-Path "ecosystem.config.js") {
        Copy-Item -Path "ecosystem.config.js" -Destination ".next\standalone\ecosystem.config.js" -Force
    }
    tar.exe -czf chumchum_web_deploy.tar.gz -C .next\standalone .
}

Write-Host "[+] 1. Đang upload gói cài đặt mới lên VPS ($VpsUser@$VpsIp)..." -ForegroundColor Green
scp chumchum_web_deploy.tar.gz ${VpsUser}@${VpsIp}:/tmp/
scp deploy_vps.sh ${VpsUser}@${VpsIp}:/tmp/

Write-Host "[+] 2. Đang thực thi cài đặt và cấu hình Nginx/PM2 trên VPS..." -ForegroundColor Green
ssh -t ${VpsUser}@${VpsIp} "chmod +x /tmp/deploy_vps.sh && /tmp/deploy_vps.sh"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ĐÃ XONG! KIỂM TRA TRUY CẬP: https://kho.chumchumbakery.com" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
