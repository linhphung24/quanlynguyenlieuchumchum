# DB Scripts - Chạy trên máy chủ thật (production)

> 📦 Thư mục `vps_migration/` chứa bộ script chuyển CSDL lên VPS Ubuntu
> (backup → restore → tạo login → backup tự động), kèm hướng dẫn tại
> `winforms/Huong_Dan_Cai_Dat_DB_Tren_VPS_Ubuntu.md`.

## Mục đích

Máy local hiện là **bản copy dữ liệu test** mang từ máy chủ về. Mọi script thay đổi dữ liệu
đã chạy khi test sẽ được viết lại tại thư mục này, đánh số theo **thứ tự bắt buộc** để chạy
lại trên máy chủ thật sau khi kết thúc test.

## Quy tắc

1. Chạy bằng **SSMS**, theo đúng thứ tự số file (01 → 02 → ...).
2. Chạy khi **app đang tắt** trên toàn bộ máy (script khóa bảng trong giây lát).
3. Script luôn **idempotent** (chạy lại không gây hại) và **in ra kết quả kiểm chứng**.
4. Script 02 có chế độ **dry-run**: mặc định `@Execute = 0` chỉ xem trước, đổi thành `1` mới áp dụng.
5. Từ nay mọi thay đổi dữ liệu mới sẽ được bổ sung thành file số tiếp theo tại đây.

## Danh sách hiện tại

| File | Loại | Nội dung | Đã chạy trên máy test |
|---|---|---|---|
| `01_add_invoice_approval_columns.sql` | Schema + backfill | Thêm cột `ApprovalStatus` / `ApprovedBy` / `ApprovedAt` cho bảng `Invoices` (chức năng duyệt hóa đơn xuất); toàn bộ hóa đơn cũ = đã duyệt | ✅ 02/09 |
| `02_zero_auto_materialized_opening_stock.sql` | Dữ liệu | Zero các dòng tồn đầu kỳ bị **tự động sinh** (= đúng bằng Nhập − Xuất, do bug cũ của nút "Lưu Thay Đổi"), kèm backup toàn bảng + audit log. Với dữ liệu test đã zero đúng 58 dòng | ✅ 01/09 |
| `03_rebuild_fifo_batches.sql` | Dữ liệu phái sinh | Xóa & dựng lại toàn bộ lô FIFO + lượt trừ từ (tồn đầu + hóa đơn nhập + hóa đơn xuất **đã duyệt**). Bản chất là "diễn lại" — không làm mất dữ liệu gốc | ✅ 01/09 |
| `04_purge_all_stock_invoice_data.sql` | Dữ liệu | Xóa sạch toàn bộ dữ liệu kho + hóa đơn để nhập mới: `BatchDeductions`, `Batches`, `InvoiceDetails`, `Invoices` (giữ dummy `TONDAU` Id=0), `StockOpeningAdj`; reseed ID về 1, backup 5 bảng `*_Bak_20260925`. Giữ nguyên danh mục SP, công thức, NCC, user, AuditLog | ⏳ 25/09 |
| `05_add_cash_vouchers_table.sql` | Schema | Tạo bảng `CashVouchers` cho chức năng mới **Phiếu Thu / Phiếu Chi** (bố cục MISA: Type thu/chi, số phiếu PT-0001/PC-0001, số tiền bằng chữ). Bảng mới rỗng, không đụng dữ liệu cũ. Phân quyền `Menu_Vouchers_Thu`/`Chi` app tự bổ sung lúc khởi động. **Chạy trên đúng DB ChumChumDB** (sqlcmd thêm `-d ChumChumDB`) | ✅ 28/09 |
| `06_add_cash_voucher_details.sql` | Schema | Tạo bảng `CashVoucherDetails` — các **dòng hạch toán** (Diễn giải / TK Nợ / TK Có / Số tiền) của phiếu thu chi theo form MISA; backfill mỗi phiếu cũ 1 dòng phái sinh từ Lý do + Số tiền. **Chạy trên đúng DB ChumChumDB** | ✅ 28/09 |
| `07_add_company_info.sql` | Schema | Tạo bảng `CompanyInfo` (1 dòng Id=1): Tên / Địa chỉ / MST / Điện thoại công ty — **tự fill vào mẫu phiếu thu chi khi in** (mẫu 02-TT TT 132/2018). Sửa trực tiếp trong app, nút "🏢 Công ty" trên màn Thu chi. **Chạy trên đúng DB ChumChumDB** | ✅ 28/09 |

## Ghi chú

- App mới cũng **tự chạy migration cột duyệt + rebuild FIFO mỗi lần khởi động**, nên tối thiểu
  production chỉ cần chạy **01 + 02** bằng SSMS rồi mở app. Chạy thêm 03 để kiểm chứng độc lập.
- Backup phục hồi của script 02: bảng `StockOpeningAdj_Bak_20260901` (tên giữ nguyên khi chạy
  trên production). Muốn hoàn tác dòng nào: copy lại AdjQty từ bảng này theo Id.
- Sau khi chạy xong 02 + 03 trên production, đối chiếu: số dòng bị zero + tổng lô TONDAU giảm
  đúng bằng số dòng zero (trừ dòng khai âm vốn không tạo lô).
