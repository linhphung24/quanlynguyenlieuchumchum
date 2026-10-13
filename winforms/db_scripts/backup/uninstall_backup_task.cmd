@echo off
rem Go bo task backup (chay bang "Run as administrator")
schtasks /Delete /F /TN "ChumChumDB Daily Backup 22h"
echo Da go task (neu o tren khong bao loi).
pause
