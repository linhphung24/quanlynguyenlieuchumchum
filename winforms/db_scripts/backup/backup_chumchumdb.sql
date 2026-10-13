/* ============================================================
   BACKUP CHUMCHUMDB - chay boi run_backup.cmd (Task Scheduler 22h)
   - File backup: ChumChumDB_yyyy-MM-dd_HHmm.bak trong thu%c $(BackupDir)
   - CHECKSUM + VERIFYONLY dam bao file vua ghi doc duoc
   Khong dung WITH COMPRESSION (Express khong ho tro; DB nho nen khong can)
   ============================================================ */
SET NOCOUNT ON;
DECLARE @file NVARCHAR(520) = N'$(BackupDir)' + N'\ChumChumDB_' + FORMAT(GETDATE(), 'yyyy-MM-dd_HHmm') + N'.bak';

PRINT N'Bat dau backup: ' + @file;
PRINT N'Thoi diem: ' + CONVERT(VARCHAR(19), GETDATE(), 120);

BACKUP DATABASE [ChumChumDB] TO DISK = @file WITH INIT, CHECKSUM, STATS = 10;

RESTORE VERIFYONLY FROM DISK = @file WITH CHECKSUM;
PRINT N'=== BACKUP THANH CONG + VERIFY OK: ' + @file + N' ===';
