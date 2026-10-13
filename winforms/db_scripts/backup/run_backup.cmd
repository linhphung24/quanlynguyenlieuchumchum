@echo off
rem ============================================================
rem  CHAY BACKUP CHUMCHUMDB (duoc goi boi Task Scheduler 22h moi dem)
rem  - Tao backup vua + kiem chung (VERIFYONLY) qua backup_chumchumdb.sql
rem  - Tu XOA file .bak cu hon 14 ngay (sua so ngay tai /d -14)
rem  - Ghi log vao %BACKUP_DIR%\backup.log
rem ============================================================
setlocal

rem ==== CAU HINH (sua theo may chu that) ====
set BACKUP_DIR=D:\SQLBackup
set SQLINSTANCE=localhost
rem ==========================================

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo ============================================================ >> "%BACKUP_DIR%\backup.log"
echo [%DATE% %TIME%] Bat dau backup tu dong >> "%BACKUP_DIR%\backup.log"

rem -C = tin certificate SQL local (ODBC Driver 18 yeu cau)
sqlcmd -S %SQLINSTANCE% -E -C -d master -i "%~dp0backup_chumchumdb.sql" -v BackupDir="%BACKUP_DIR%" >> "%BACKUP_DIR%\backup.log" 2>&1

rem Xoa file backup cu hon 14 ngay (khi chua co file cu thi forfiles bao loi - bo qua)
forfiles /p "%BACKUP_DIR%" /m *.bak /d -14 /c "cmd /c echo Xoa file cu: @path >> "%BACKUP_DIR%\backup.log" & del @path" >> "%BACKUP_DIR%\backup.log" 2>NUL

echo [%DATE% %TIME%] Ket thuc >> "%BACKUP_DIR%\backup.log"
endlocal
