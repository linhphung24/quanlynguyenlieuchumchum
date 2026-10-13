@echo off
rem ============================================================
rem  01 - BACKUP LAN CUOI CUNG TREN MAY CHU WINDOWS TRUOC KHI
rem  CHUYEN CHUMCHUMDB LEN VPS (chay 1 lan, ngay truoc cutover)
rem  - Backup toan bo DB + VERIFYONLY (doc lai file vua ghi)
rem  - File ket qua: D:\SQLBackup\ChumChumDB_migration_yyyy-MM-dd_HHmm.bak
rem  - Chay xong chay lenh scp trong huong dan de copy len VPS
rem ============================================================
setlocal

rem ==== CAU HINH (sua theo may chu that) ====
set BACKUP_DIR=D:\SQLBackup
set SQLINSTANCE=localhost
rem ==========================================

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HHmm"') do set TS=%%i
set BAKFILE=%BACKUP_DIR%\ChumChumDB_migration_%TS%.bak

echo Dang backup ChumChumDB ra: %BAKFILE%
sqlcmd -S %SQLINSTANCE% -E -C -d master -Q "BACKUP DATABASE [ChumChumDB] TO DISK = N'%BAKFILE%' WITH INIT, CHECKSUM, STATS = 10; RESTORE VERIFYONLY FROM DISK = N'%BAKFILE%' WITH CHECKSUM;"

if errorlevel 1 (
    echo.
    echo [LOI] Backup that bai - KIEM TRA log tren man hinh, khong chay tiep cac buoc sau!
) else (
    echo.
    echo [OK] Backup + verify thanh cong.
    echo File can chuyen len VPS: %BAKFILE%
)

pause
endlocal
