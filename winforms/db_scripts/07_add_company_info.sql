/* ============================================================
   SCRIPT 07: TAO BANG CompanyInfo (THONG TIN CONG TY IN CHUNG TU)
   - Luu 1 dong duy nhat Id=1: Ten (Don vi), Dia chi, Ma so thue,
     Dien thoai — tu dong dien vao mau phieu thu chi khi in
     (VD mau 02-TT theo Thong tu 132/2018/TT-BTC)
   - Bang moi rong, khong doi du lieu cu; app tu tao bang khi khoi dong
   - Nhap/sua thong tin truc tiep trong app: man Phiếu Thu/Chi > nut
     "Cong ty" — khong can Sua SQL
   !! CHAY TREN DATABASE ChumChumDB: trong SSMS chon dung DB o dropdown
   truoc khi F5; con sqlcmd thi them -d ChumChumDB.
   Idempotent: chay lai khong gay hai.
   ============================================================ */
SET NOCOUNT ON;

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CompanyInfo' and xtype='U')
BEGIN
    CREATE TABLE CompanyInfo (
        Id INT NOT NULL PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        Address NVARCHAR(255) NULL,
        TaxCode NVARCHAR(50) NULL,
        Phone NVARCHAR(50) NULL,
        UpdatedBy NVARCHAR(100) NULL,
        UpdatedAt DATETIME NULL
    );

    -- Mac dinh ten cua hang de ban in khong bao loi thieu Don vi
    INSERT INTO CompanyInfo (Id, Name, Address, TaxCode, Phone, UpdatedBy, UpdatedAt)
    VALUES (1, N'CHUM CHUM BAKERY', NULL, NULL, NULL, N'System', GETDATE());
END
GO

PRINT '=== KIEM CHUNG: BANG CompanyInfo ===';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'CompanyInfo'
ORDER BY ORDINAL_POSITION;
-- Ky vong: 7 cot (Id, Name, Address, TaxCode, Phone, UpdatedBy, UpdatedAt)

SELECT Id, Name, Address, TaxCode, Phone FROM CompanyInfo;
-- Ky vong: 1 dong Id=1, Name = CHUM CHUM BAKERY
