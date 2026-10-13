@echo off
rem ============================================================
rem  CAI TASK SCHEDULER: BACKUP CHUMCHUMDB 22H MOI DEM
rem  - CHAY FILE NAY BANG "Run as administrator" (phai quyen admin)
rem  - Task chay ngam duoi tai khoan SYSTEM, khong can dang nhap
rem ============================================================

schtasks /Create /F /TN "ChumChumDB Daily Backup 22h" /TR "\"%~dp0run_backup.cmd\"" /SC DAILY /ST 22:00 /RU SYSTEM /RL HIGHEST

if %ERRORLEVEL% EQU 0 (
    echo.
    echo === DA CAI TASK THANH CONG ===
    echo Task "ChumChumDB Daily Backup 22h" se chay 22:00 moi dem.
    echo Kiem tra: schtasks /Query /TN "ChumChumDB Daily Backup 22h"
    echo Chay thu ngay: schtasks /Run /TN "ChumChumDB Daily Backup 22h"
) else (
    echo.
    echo !!! CAI TASK THAT BAI - kiem tra quyen administrator
)
pause
