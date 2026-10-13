/* ============================================================
   SCRIPT 06: TAO BANG CashVoucherDetails (DONG HACH TOAN PHIEU THU CHI)
   - Moi phieu thu/chi co nhieu dong hach toan:
     Description = Dien giai, DebitAccount = TK No, CreditAccount = TK Co, Amount
   - So tien cua phieu (CashVouchers.Amount) luon bang tong cac dong
   - Bang moi rong, khong doi du lieu cu; app tu tao bang nay khi khoi dong
   !! CHAY TREN DATABASE ChumChumDB: trong SSMS chon dung DB o dropdown
   truoc khi F5; con sqlcmd thi them -d ChumChumDB (mac dinh login la master).
   Idempotent: chay lai khong gay hai.
   ============================================================ */
SET NOCOUNT ON;

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CashVoucherDetails' and xtype='U')
BEGIN
    CREATE TABLE CashVoucherDetails (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        VoucherId INT NOT NULL,
        Description NVARCHAR(500) NOT NULL,
        DebitAccount NVARCHAR(20) NULL,
        CreditAccount NVARCHAR(20) NULL,
        Amount DECIMAL(18,2) NOT NULL
    );

    -- Phieu da co truoc khi co bang dong: tao 1 dong phai sinh
    -- (Dien giai = Ly do, So tien = Amount) de moi phieu deu co dong hach toan
    INSERT INTO CashVoucherDetails (VoucherId, Description, DebitAccount, CreditAccount, Amount)
    SELECT Id, Reason, NULL, NULL, Amount
    FROM CashVouchers
    WHERE NOT EXISTS (SELECT 1 FROM CashVoucherDetails d WHERE d.VoucherId = CashVouchers.Id);
END
GO

PRINT '=== KIEM CHUNG 1: CAU TRUC BANG CashVoucherDetails ===';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'CashVoucherDetails'
ORDER BY ORDINAL_POSITION;
-- Ky vong: 6 cot (Id, VoucherId, Description, DebitAccount, CreditAccount, Amount)

PRINT '=== KIEM CHUNG 2: MOI PHIEU DA CO DONG HACH TOAN ===';
SELECT v.Code, v.Amount AS TongPhieu, COUNT(d.Id) AS SoDong, ISNULL(SUM(d.Amount), 0) AS TongDong
FROM CashVouchers v
LEFT JOIN CashVoucherDetails d ON d.VoucherId = v.Id
GROUP BY v.Code, v.Amount;
-- Ky vong: moi phieu co SoDong >= 1 va TongDong = TongPhieu
