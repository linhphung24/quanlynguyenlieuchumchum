# db_scripts/vps_migration - Chuyen CSDL ChumChumDB tu may chu local len VPS Ubuntu

Bo script + huong dan di kem tai `winforms/Huong_Dan_Cai_Dat_DB_Tren_VPS_Ubuntu.md`.
Doc file do truoc khi chay - moi buong co lenh cu the.

## Thu tu chay

| File | Chay tren | Noi dung |
|---|---|---|
| `01_backup_local.cmd` | May chu Windows cu (dang giu du lieu that) | Backup toan bo ChumChumDB ra `D:\SQLBackup\ChumChumDB_migration_*.bak` + VERIFYONLY |
| `02_restore_vps.sql` | VPS Ubuntu (qua sqlcmd) | Restore .bak vao `/var/opt/mssql/data/` (tu dong DROP DB cu neu co) |
| `03_create_app_login.sql` | VPS Ubuntu (qua sqlcmd) | Tao login `chumchum_app` (app dung) + `chumchum_backup` (task backup dung), KHONG dung sa |
| `04_backup_vps.sh` | VPS Ubuntu (cron) | Backup tu dong 1h sang, giu 14 ban, kem VERIFYONLY |

## Luu y quan trong

1. **Chinh sua mat khau trong `03_create_app_login.sql` truoc khi chay** (2 dong DECLARE dau file).
2. File .sql dung chu KHONG dau de tranh loi codepage khi chay bang sqlcmd tren Linux.
3. Tat ca lenh sqlcmd tren VPS can co co `-C` (tin certificate tu ky cua SQL Server, ODBC 18 yeu cau).
4. Script 02 se **DROP DATABASE ChumChumDB neu da ton tai** - chi chay tren VPS moi, khong chay tren may chu cu!
5. Sau khi chuyen xong: tai it nhat 1 file .bak tu VPS ve may ngoai (`scp`) de phong VPS chet.
