# Backup tự động ChumChumDB — 22h mỗi đêm

SQL Server đang dùng là **Express** (không có SQL Agent) nên dùng giải pháp
**Windows Task Scheduler + sqlcmd** — chuẩn và chạy ổn định trên mọi bản SQL.

## Cài đặt trên máy chủ (production)

1. Copy nguyên thư mục `db_scripts/backup/` sang máy chủ, ví dụ `D:\Scripts\backup\`.
2. Mở `run_backup.cmd` bằng Notepad, sửa 2 dòng cấu hình nếu cần:
   - `set BACKUP_DIR=D:\SQLBackup` — nơi chứa file backup (nên để ổ **khác** ổ chứa data,
     tốt nhất là ổ ngoài hoặc thư mục mạng (network share) nếu có).
   - `set SQLINSTANCE=localhost` — giữ nguyên nếu SQL chạy ngay trên máy chủ.
3. **Chuột phải `install_backup_task.cmd` → Run as administrator** → xong sẽ có task
   `ChumChumDB Daily Backup 22h` chạy 22:00 hằng đêm.
4. Kiểm chứng ngay không cần đợi 22h:
   - Chạy thử trực tiếp: double-click `run_backup.cmd`, rồi xem `D:\SQLBackup` có file
     `ChumChumDB_yyyy-MM-dd_HHmm.bak` + xem `backup.log`.
   - Hoặc chạy qua task: `schtasks /Run /TN "ChumChumDB Daily Backup 22h"`.

## Tính năng

- **Full backup mỗi đêm 22:00**, tên file kèm ngày giờ → không ghi đè nhau.
- **Tự kiểm chứng** sau khi ghi (CHECKSUM + VERIFYONLY) — file hỏng sẽ bị phát hiện trong log.
- **Tự xóa backup cũ hơn 14 ngày** (sửa trong `run_backup.cmd`: `/d -14` thành số ngày muốn giữ).
- Log đầy đủ tại `D:\SQLBackup\backup.log`.
- DB hiện ~16 MB nên mỗi bản backup rất nhẹ, giữ 14 ngày chỉ tốn ~200-300 MB.

## Khôi phục (khi cần)

```sql
RESTORE DATABASE ChumChumDB FROM DISK = 'D:\SQLBackup\ChumChumDB_2026-09-02_2200.bak'
WITH REPLACE, RECOVERY;
```

(Khi đang có người dùng, chạy trong SSMS với câu lệnh trên sau khi đóng app ở các máy.)

## Gỡ bỏ

Chạy `uninstall_backup_task.cmd` với quyền administrator.

## Khuyến nghị thêm

- Backup nằm trên **cùng máy chủ** vẫn mất nếu hỏng cả ổ đĩa/máy. Nên định kỳ
  (tuần) copy thư mục `D:\SQLBackup` sang máy khác hoặc USB/ổ mạng.
- Muốn đổi giờ: gỡ task rồi sửa `/ST 22:00` trong `install_backup_task.cmd` thành giờ khác.
