# Đây là script ví dụ để chạy test tự động.
# Bạn có thể viết code PowerShell vào đây để tự động build app, gọi lệnh dotnet test, hoặc kiểm tra kết nối DB.

Write-Host "Bắt đầu chạy script test tự động..."
Write-Host "Đang kiểm tra kết nối mạng/cơ sở dữ liệu..."

# Giả lập kết quả
$testResult = $true

if ($testResult) {
    Write-Host "[PASS] Tất cả các test đã vượt qua."
} else {
    Write-Host "[FAIL] Phát hiện lỗi trong quá trình test."
}
