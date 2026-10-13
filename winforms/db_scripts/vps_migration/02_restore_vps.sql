/* ============================================================
   02 - RESTORE CHUMCHUMDB TREN VPS UBUNTU (chay qua sqlcmd)
   Vi du lenh chay tren VPS:
     sqlcmd -S localhost -U sa -C -i 02_restore_vps.sql
   (se duoc hoi mat khau SA)

   CAN THAN: script SE DROP DATABASE ChumChumDB neu da ton tai
   ==> chi chay tren VPS moi, dung chay tren may chu cu!

   Neu RESTORE bao loi "logical file name" thi bo comment nhom
   RESTORE FILELISTONLY o giua file, chay xem ten thuc te roi sua
   2 dong MOVE + 2 bien @mdf / @ldf cho khop.
   ============================================================ */
SET NOCOUNT ON;
GO

-- Xoa DB cu neu co (chi an toan tren VPS moi)
IF DB_ID(N'ChumChumDB') IS NOT NULL
BEGIN
    PRINT N'DROP DATABASE ChumChumDB cu truoc khi restore...';
    ALTER DATABASE ChumChumDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ChumChumDB;
END
GO

-- Bo comment 4 dong duoi neu can xem ten logic file trong .bak:
-- RESTORE FILELISTONLY FROM DISK = N'/var/opt/mssql/backup/ChumChumDB.bak';
-- GO

DECLARE @bak NVARCHAR(520) = N'/var/opt/mssql/backup/ChumChumDB.bak';
DECLARE @mdf NVARCHAR(128) = N'ChumChumDB';      -- ten logic file DATA
DECLARE @ldf NVARCHAR(128) = N'ChumChumDB_log';  -- ten logic file LOG

RESTORE DATABASE [ChumChumDB]
FROM DISK = @bak
WITH
    MOVE @mdf TO N'/var/opt/mssql/data/ChumChumDB.mdf',
    MOVE @ldf TO N'/var/opt/mssql/data/ChumChumDB_log.ldf',
    RECOVERY, REPLACE, STATS = 5;
GO

-- Kiem chung sau restore
SELECT name, state_desc, recovery_model_desc, create_date
FROM sys.databases WHERE name = N'ChumChumDB';

EXEC ChumChumDB.dbo.sp_spaceused @oneresultset = 1;
PRINT N'=== RESTORE CHUMCHUMDB TREN VPS THANH CONG ===';
GO
