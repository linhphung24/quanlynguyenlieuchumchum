# Hướng dẫn chuyển CSDL ChumChumDB lên VPS Ubuntu (SQL Server 2022 Express)

Tài liệu này hướng dẫn chuyển **toàn bộ dữ liệu SQL Server đang chạy trên máy local/máy chủ ở tiệm** lên một **VPS Ubuntu chạy trên Internet**, để các máy trạm đều kết nối về VPS thay vì chạy DB tại local.

- Kiến trúc sau khi chuyển: `Máy trạm (WinForms) ──Internet (mã hóa TLS)──▶ VPS Ubuntu ──▶ SQL Server 2022 Express`
- Bộ script đi kèm: `db_scripts/vps_migration/` (đọc README trong đó để biết thứ tự chạy).
- Tài liệu này **thay thế** cho `Huong_Dan_Cai_Dat_Mang_Noi_Bo_LAN.md` khi dùng VPS.

> ⚠️ **Lưu ý trước khi bắt đầu**
> 1. Cần **publish lại app** trước khi cutover (xem Bước 7) — bản mới đã bật `Encrypt=True` để mật khẩu SQL không đi trên mạng dạng rõ.
> 2. Kết nối qua Internet có độ trễ (~30–60ms/lần truy vấn), app sẽ **chậm hơn một chút** so với chạy trong LAN — đây là điều bình thường.
> 3. Nên làm vào **buổi tối / ngày nghỉ** để không gián đoạn bán hàng. Giữ nguyên máy chủ cũ 1–2 tuần trước khi bỏ hẳn.

---

## Yêu cầu VPS

| Hạng mục | Tối thiểu khuyến nghị |
|---|---|
| Hệ điều hành | Ubuntu 22.04 LTS (64-bit) |
| CPU | 2 vCPU |
| RAM | 4 GB (SQL Server Express giới hạn ~1.4 GB bộ nhớ đệm — đủ cho dữ liệu hiện tại) |
| Ổ cứng | 40 GB SSD |
| Mạng | 1 IP công khai, mở được cổng 1433 |

---

## BƯỚC 1: Cài SQL Server 2022 Express trên VPS

SSH vào VPS rồi chạy lần lượt:

```bash
# 1. Thêm kho phần mềm của Microsoft
curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | sudo gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg
curl -fsSL https://packages.microsoft.com/config/ubuntu/22.04/mssql-server-2022.list | sudo tee /etc/apt/sources.list.d/mssql-server-2022.list
sudo apt-get update

# 2. Cài SQL Server
sudo apt-get install -y mssql-server

# 3. Cấu hình lần đầu: chọn edition "2) Express", đặt MẬT KHẨU SA MẠNH (ghi ra nơi an toàn!)
sudo /opt/mssql/bin/mssql-conf setup

# 4. Kiểm tra dịch vụ đang chạy
systemctl status mssql-server --no-pager
```

Cài công cụ dòng lệnh `sqlcmd` (mssql-tools18):

```bash
curl -fsSL https://packages.microsoft.com/config/ubuntu/22.04/prod.list | sudo tee /etc/apt/sources.list.d/msprod.list
sudo apt-get update
sudo apt-get install -y mssql-tools18 unixodbc-dev
echo 'export PATH="$PATH:/opt/mssql-tools18/bin"' >> ~/.bashrc && source ~/.bashrc

# Kiểm tra đăng nhập được (nhập mật khẩu SA khi được hỏi)
sqlcmd -S localhost -U sa -C -Q "SELECT @@VERSION;"
```

> Mọi lệnh `sqlcmd` đều phải có cờ `-C` (tin chứng chỉ tự ký của SQL Server — ODBC Driver 18 yêu cầu).

## BƯỚC 2: Mở tường lửa cho cổng 1433

```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 1433/tcp   # SQL Server
sudo ufw enable
sudo ufw status
```

**Tại bảng điều khiển của nhà cung cấp VPS** (VinaHost, Vultr, DigitalOcean, Azdigi…) cũng phải mở cổng **TCP 1433** trong *Firewall / Security Group / Network Policy* — bước này hay bị bỏ sót nhất.

> 🔒 **Nếu tiệm có IP Internet cố định** (hỏi nhà mạng), hãy giới hạn thay vì mở cho cả thế giới:
> ```bash
> sudo ufw delete allow 1433/tcp
> sudo ufw allow from IP_TIEM_CUA_BAN to any port 1433 proto tcp
> ```

## BƯỚC 3: Backup dữ liệu trên máy chủ cũ & chép lên VPS

Trên **máy Windows đang giữ dữ liệu thật**:

1. Chép thư mục `db_scripts/vps_migration` từ bản phát hành vào máy.
2. Nhấp đúp **`01_backup_local.cmd`** (mặc định backup ra `D:\SQLBackup\ChumChumDB_migration_<ngày>.bak`; nếu máy chủ khác, sửa 2 dòng `BACKUP_DIR` / `SQLINSTANCE` trong file).
3. Đợi thông báo `[OK] Backup + verify thanh cong`.

Chép file `.bak` lên VPS (chạy trong **PowerShell / CMD trên máy Windows** — Windows 10 trở lên có sẵn lệnh `scp`):

```powershell
scp D:\SQLBackup\ChumChumDB_migration_<ngày>.bak ten_dang_nhap_ssh@IP_VPS:/tmp/
```

Trên **VPS**, đưa file vào nơi SQL Server đọc được:

```bash
sudo mkdir -p /var/opt/mssql/backup
sudo mv /tmp/ChumChumDB_migration_*.bak /var/opt/mssql/backup/ChumChumDB.bak
sudo chown mssql:mssql /var/opt/mssql/backup/ChumChumDB.bak
```

## BƯỚC 4: Restore CSDL trên VPS

Chép 2 file script `02_restore_vps.sql`, `03_create_app_login.sql` lên VPS (scp như trên, vào `~/`), rồi chạy:

```bash
sqlcmd -S localhost -U sa -C -i 02_restore_vps.sql
```

Kết thúc phải thấy dòng `=== RESTORE CHUMCHUMDB TREN VPS THANH CONG ===` và `state_desc = ONLINE`.

> Nếu báo lỗi *logical file name*: bỏ comment nhóm `RESTORE FILELISTONLY` trong script, chạy xem tên thật của file Data/Log rồi sửa 2 biến `@mdf` / `@ldf` cho khớp.

## BƯỚC 5: Tạo tài khoản riêng cho app (không dùng sa)

1. Mở `03_create_app_login.sql`, **sửa 2 mật khẩu** tại các dòng `DECLARE @app_pwd` / `DECLARE @bak_pwd` (mật khẩu mạnh: ≥15 ký tự, đủ hoa/thường/số/ký tự đặc biệt; **ghi nhớ mật khẩu `@app_pwd` — máy trạm sẽ nhập nó**).
2. Chạy:

```bash
sqlcmd -S localhost -U sa -C -i 03_create_app_login.sql
```

Sẽ tạo:
- `chumchum_app` — login app WinForms dùng (toàn quyền trên ChumChumDB vì app tự chạy migration khi khởi động).
- `chumchum_backup` — login chỉ có quyền backup, cho task tự động ở Bước 6.

## BƯỚC 6: Backup tự động hằng ngày trên VPS

Chép `04_backup_vps.sh` lên VPS rồi làm theo hướng dẫn cài đặt in ngay trong đầu file đó (tóm tắt):

```bash
sudo mkdir -p /opt/mssql-backup
sudo cp 04_backup_vps.sh /opt/mssql-backup/backup.sh
sudo chmod 700 /opt/mssql-backup/backup.sh

# Lưu mật khẩu login chumchum_backup (đổi chuỗi bên dưới!)
sudo tee /etc/mssql-backup.conf >/dev/null <<< 'BACKUP_PASSWORD=mat_khau_chumchum_backup'
sudo chmod 600 /etc/mssql-backup.conf

# Đặt lịch chạy 01h00 hằng ngày
echo '0 1 * * * root /opt/mssql-backup/backup.sh >> /var/log/mssql-backup.log 2>&1' | sudo tee /etc/cron.d/mssql-backup

# Chay thu lan dau va kiem tra
sudo /opt/mssql-backup/backup.sh && ls -lh /var/backups/mssql/
```

> 📌 **Tải backup về máy ngoài định kỳ**: VPS có thể chết/mất. Hằng tuần chạy trên máy Windows:
> ```powershell
> scp ten_dang_nhap_ssh@IP_VPS:/var/backups/mssql/ChumChumDB_*.bak D:\SQLBackup\VPS\
> ```

## BƯỚC 7: Publish lại app & cấu hình máy trạm

1. Trên máy dev, chạy `publish_release.bat` để đóng gói bản mới (bản này có `Encrypt=True`).
2. Copy thư mục `publish_release` đến các máy trạm như hiện tại.
3. Trên **mỗi máy trạm**, mở app → màn hình **Cấu hình Kết nối** (`FrmConnection`) hiện ra (nếu không tự hiện thì vào menu Cấu hình kết nối):
   - **Tên Máy chủ / IP**: `IP_VPS` (ví dụ `103.1.2.3`)
   - **Tên CSDL**: `ChumChumDB`
   - Bỏ chọn *Windows Authentication* (chọn SQL Authentication)
   - **Tài khoản**: `chumchum_app` — **Mật khẩu**: mật khẩu đã đặt ở Bước 5
4. Bấm **⚡ Kiểm tra Kết nối** → thành công → **💾 Lưu & Vào Ứng dụng**. Thông tin được lưu vào `connection.json` cạnh file exe.

## BƯỚC 8: Sau khi chuyển xong

- [ ] Vận hành thật trên VPS **1–2 tuần**; máy chủ cũ giữ nguyên, **tắt task backup cũ** (`db_scripts/backup/uninstall_backup_task.cmd`) để không nhầm lẫn dữ liệu.
- [ ] Hằng tuần tải 1 file `.bak` từ VPS về máy ngoài (lệnh scp ở Bước 6).
- [ ] Khi đã ổn định: có thể **vô hiệu hóa login `sa`** để giảm nguy cơ bị dò mật khẩu — chạy trên VPS:
  ```bash
  sqlcmd -S localhost -U sa -C -Q "ALTER LOGIN sa DISABLE;"
  ```
  (lúc đó mọi việc điều hành qua 2 login đã tạo; nếu cần dùng lại: đăng nhập bằng `chumchum_app` rồi `ALTER LOGIN sa ENABLE`).
- [ ] Bật cập nhật tự động cho Ubuntu: `sudo apt-get install -y unattended-upgrades`.

---

## Sự cố thường gặp

| Hiện tượng | Nguyên nhân / cách xử lý |
|---|---|
| FrmConnection báo "không thể kết nối" | Theo thứ tự: (1) IP/sai mật khẩu; (2) chưa mở 1433 trong **ufw**; (3) chưa mở 1433 ở **firewall nhà cung cấp VPS**; (4) `systemctl status mssql-server` có chạy không |
| Kết nối được nhưng chậm | Độ trễ Internet là bình thường; nếu quá chậm, kiểm tra chất lượng đường truyền ở tiệm |
| Timeout khi lưu hóa đơn | Bản app cũ timeout 8s — phải dùng bản publish mới (timeout 15s) |
| `sqlcmd` báo certificate error | Thiếu cờ `-C` trong lệnh |
| Backup tự động không chạy | `cat /var/log/mssql-backup.log`; kiểm tra `/etc/mssql-backup.conf` có `BACKUP_PASSWORD` đúng chưa |
| Restore lỗi logical file name | Xem hướng dẫn `RESTORE FILELISTONLY` ở Bước 4 |

## Checklist bảo mật

- Mật khẩu `sa`, `chumchum_app`, `chumchum_backup` đều khác nhau và đều mạnh.
- App kết nối bằng `chumchum_app`, không dùng `sa`.
- Nếu có IP cố định ở tiệm → giới hạn ufw chỉ nhận 1433 từ IP đó.
- Hằng tuần có 1 bản backup nằm **ngoài** VPS.
- `sudo apt-get update && sudo apt-get upgrade` định kỳ cho VPS.
