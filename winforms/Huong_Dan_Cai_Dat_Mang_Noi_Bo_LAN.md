# Hướng dẫn Triển khai Ứng dụng WinForms trong Mạng Nội bộ (LAN)

Tài liệu này hướng dẫn chi tiết cách thiết lập **Máy chủ CSDL (SQL Server)** và **Máy trạm (Client)** để nhiều máy tính trong cùng tiệm bánh / công ty có thể dùng chung ứng dụng **Chum Chum Bakery**.

---

## BƯỚC 1: CẤU HÌNH MÁY CHỦ (SERVER) CHỨA DỮ LIỆU SQL SERVER

### 1.1 Khởi tạo CSDL trên máy chủ SQL Server
1. Mở **SQL Server Management Studio (SSMS)** trên máy chủ.
2. Mở file script `d:\source_code\quanlynguyenlieuchumchum_new\sqlserver\ChumChumBakery_SQLServer.sql` và nhấn **Execute** để khởi tạo database `ChumChumDB`.

### 1.2 Bật giao thức TCP/IP trên SQL Server
1. Mở **SQL Server Configuration Manager** trên Windows.
2. Vào mục **SQL Server Network Configuration** -> **Protocols for MSSQLSERVER** (hoặc `SQLEXPRESS`).
3. Nhấp đúp vào **TCP/IP** -> chuyển thành **Enabled**.
4. Chuyển sang tab **IP Addresses** -> cuộn xuống mục **IPAll** -> đặt **TCP Port** = `1433`.
5. Khởi động lại dịch vụ SQL Server (Restart Service).

### 1.3 Mở Cổng 1433 trên Tường lửa Windows (Windows Firewall)
1. Mở **Windows Defender Firewall with Advanced Security**.
2. Chọn **Inbound Rules** -> **New Rule...**
3. Chọn **Port** -> bấm Next.
4. Chọn **TCP**, nhập cổng `1433` vào ô **Specific local ports**.
5. Chọn **Allow the connection** -> Next -> Đặt tên rule: `SQL Server LAN Port 1433` -> Finish.

---

## BƯỚC 2: ĐÓNG GÓI & CHÉP ỨNG DỤNG SANG MÁY TRẠM (CLIENT)

1. Thư mục cài đặt đã được đóng gói sẵn tại:
   `d:\source_code\quanlynguyenlieuchumchum_new\winforms\publish_release`
2. Bạn chỉ cần copy toàn bộ thư mục `publish_release` này sang bất kỳ máy tính máy trạm nào trong mạng LAN (qua USB hoặc ổ đĩa chia sẻ nội bộ).
3. Mở file `ChumChumBakery.WinForms.exe` trên máy trạm để chạy phần mềm.

---

## BƯỚC 3: KẾT NỐI MÁY TRẠM VỀ MÁY CHỦ SỬ DỤNG LẦN ĐẦU

1. Khi mở ứng dụng `ChumChumBakery.WinForms.exe` lần đầu trên máy trạm, màn hình **Cấu hình Kết nối Máy chủ LAN** (`FrmConnection`) sẽ tự động xuất hiện.
2. Nhập các thông tin:
   - **Tên Máy chủ / IP (Mạng LAN)**: Nhập IP của máy chủ SQL Server (Ví dụ: `192.168.1.100` hoặc `192.168.1.150`).
   - **Tên Cơ sở dữ liệu**: `ChumChumDB`
   - **Chế độ Xác thực**: Bỏ chọn *Windows Authentication*, chọn SQL Authentication.
   - **Tài khoản / Mật khẩu**: Nhập tài khoản SQL Server (Mặc định `sa` và mật khẩu SQL Server của máy chủ).
3. Bấm **⚡ Kiểm tra Kết nối** -> Thông báo thành công -> Bấm **💾 Lưu & Vào Ứng Dụng**.

---

## BÀN GIAO FILE & ĐƯỜNG DẪN

- 📦 **Thư mục đóng gói phần mềm**: `d:\source_code\quanlynguyenlieuchumchum_new\winforms\publish_release`
- ⚡ **File chạy ứng dụng**: `d:\source_code\quanlynguyenlieuchumchum_new\winforms\publish_release\ChumChumBakery.WinForms.exe`
- 🗄 **Script CSDL SQL Server**: `d:\source_code\quanlynguyenlieuchumchum_new\sqlserver\ChumChumBakery_SQLServer.sql`
