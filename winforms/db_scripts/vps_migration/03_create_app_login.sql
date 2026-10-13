/* ============================================================
   03 - TAO LOGIN RIENG CHO APP VA CHO TASK BACKUP TREN VPS
   (thay viec dung tai khoan sa cho app)

   ==> CHINH 2 MAT KHAU MANH TRUOC KHI CHAY (moi batch DECLARE lai):
       - @app_pwd o batch 1  (login app WinForms dung)
       - @bak_pwd o batch 3   (login task backup tu dong dung)
   Mat khau manh = tu 15 ky tu tro len, co chu hoa + chu thuong + so + ky tu dac biet.
   Khong dung lai cung mot mat khau cho 2 login.

   Vi du lenh chay tren VPS:
     sqlcmd -S localhost -U sa -C -i 03_create_app_login.sql

   - chumchum_app    : db_owner tren ChumChumDB (app tu chay migration
                       + rebuild FIFO moi khi khoi dong nen can quyen day du)
   - chumchum_backup : chi duoc quyen doc + backup
   ============================================================ */
SET NOCOUNT ON;
GO

-- ===== 1. LOGIN CHO APP =====
DECLARE @app_pwd NVARCHAR(128) = N'DOI_MAT_KHAU_APP_O_DAY';

IF SUSER_ID(N'chumchum_app') IS NULL
BEGIN
    EXEC(N'CREATE LOGIN chumchum_app WITH PASSWORD = N''' + @app_pwd + N''', CHECK_POLICY = ON;');
    PRINT N'Da tao login chumchum_app';
END
ELSE
    PRINT N'Login chumchum_app da ton tai - bo qua';
GO

USE [ChumChumDB];
GO
IF DATABASE_PRINCIPAL_ID(N'chumchum_app') IS NULL
    CREATE USER chumchum_app FOR LOGIN chumchum_app;

IF NOT EXISTS (SELECT 1 FROM sys.database_role_members DRM
               JOIN sys.database_principals R ON DRM.role_principal_id = R.principal_id
               JOIN sys.database_principals M ON DRM.member_principal_id = M.principal_id
               WHERE R.name = N'db_owner' AND M.name = N'chumchum_app')
    ALTER ROLE db_owner ADD MEMBER chumchum_app;

PRINT N'chumchum_app = db_owner tren ChumChumDB';
GO

-- ===== 2. LOGIN CHO TASK BACKUP TU DONG =====
DECLARE @bak_pwd NVARCHAR(128) = N'DOI_MAT_KHAU_BACKUP_O_DAY';

IF SUSER_ID(N'chumchum_backup') IS NULL
BEGIN
    EXEC(N'CREATE LOGIN chumchum_backup WITH PASSWORD = N''' + @bak_pwd + N''', CHECK_POLICY = ON;');
    PRINT N'Da tao login chumchum_backup';
END
ELSE
    PRINT N'Login chumchum_backup da ton tai - bo qua';
GO

USE [ChumChumDB];
GO
IF DATABASE_PRINCIPAL_ID(N'chumchum_backup') IS NULL
    CREATE USER chumchum_backup FOR LOGIN chumchum_backup;

IF NOT EXISTS (SELECT 1 FROM sys.database_role_members DRM
               JOIN sys.database_principals R ON DRM.role_principal_id = R.principal_id
               JOIN sys.database_principals M ON DRM.member_principal_id = M.principal_id
               WHERE R.name = N'db_datareader' AND M.name = N'chumchum_backup')
    ALTER ROLE db_datareader ADD MEMBER chumchum_backup;

-- quyen backup = db_backupoperator (role co san tren moi phien ban SQL Server)
IF NOT EXISTS (SELECT 1 FROM sys.database_role_members DRM
               JOIN sys.database_principals R ON DRM.role_principal_id = R.principal_id
               JOIN sys.database_principals M ON DRM.member_principal_id = M.principal_id
               WHERE R.name = N'db_backupoperator' AND M.name = N'chumchum_backup')
    ALTER ROLE db_backupoperator ADD MEMBER chumchum_backup;

PRINT N'chumchum_backup = doc + quyen backup tren ChumChumDB';
GO

-- ===== 3. KIEM CHUNG =====
SELECT DP.name AS UserName, R.name AS RoleName
FROM sys.database_principals DP
JOIN sys.database_role_members DRM ON DP.principal_id = DRM.member_principal_id
JOIN sys.database_principals R ON DRM.role_principal_id = R.principal_id
WHERE DP.name IN (N'chumchum_app', N'chumchum_backup')
ORDER BY DP.name, R.name;
PRINT N'=== TAO LOGIN THANH CONG - LUU MAT KHAU APP VAO NOI AN TOAN (se nhap tai FrmConnection) ===';
GO
