# Quy tắc Cơ sở dữ liệu

Tài liệu này lưu trữ các quy tắc khi làm việc với CSDL trong dự án.

## 1. Thông tin kết nối
- Hệ quản trị: SQL Server (Ví dụ)
- Port mặc định cần mở: 1433
- (Bạn có thể thêm IP Server và chuỗi kết nối mẫu vào đây để AI nhớ...)

## 2. Quy tắc thiết kế/viết code DB
- Tên bảng viết liền không dấu, viết hoa chữ cái đầu (Ví dụ: `NguyenLieu`, `ChiTietPhieuNhap`).
- Khóa chính luôn đặt tên là `Id` (Kiểu INT hoặc UNIQUEIDENTIFIER).
- Xóa dữ liệu: Khuyến khích sử dụng cột `IsDeleted` (BIT) thay vì dùng lệnh `DELETE` thẳng trong DB.
- (Thêm các quy tắc khác của bạn vào đây...)
