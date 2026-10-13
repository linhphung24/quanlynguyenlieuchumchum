/* ============================================================
   SCRIPT 05: TAO BANG PHIEU THU CHI (CashVouchers)
   - Bang moi cho chuc nang Phieu Thu / Phieu Chi (bo cuc kieu MISA AMIS)
   - Type = 'thu' / 'chi'; so phieu danh rieng tung loai: PT-0001 / PC-0001
   - Chi tao bang moi (rong), khong doi du lieu cu
   !! CHAY TREN DATABASE ChumChumDB: trong SSMS chon dung DB o dropdown
   truoc khi F5; con sqlcmd thi them -d ChumChumDB (mac dinh login la master).
   Idempotent: chay lai khong gay hai.
   (App moi cung tu chay migration nay khi khoi dong. Phan quyen
    Menu_Vouchers_Thu / Menu_Vouchers_Chi cho cac role cung duoc
    app tu boa sung idempotent moi lan khoi dong.)
   ============================================================ */
SET NOCOUNT ON;

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CashVouchers' and xtype='U')
BEGIN
    CREATE TABLE CashVouchers (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Type NVARCHAR(10) NOT NULL,            -- 'thu' / 'chi'
        VoucherDate DATETIME NOT NULL,         -- ngay phieu
        Code NVARCHAR(50) NOT NULL,            -- PT-0001 / PC-0001
        Partner NVARCHAR(255) NOT NULL,        -- doi tuong
        PartnerAddress NVARCHAR(255) NULL,     -- dia chi
        Receiver NVARCHAR(255) NULL,           -- nguoi nhan tien (chi) / nguoi nop tien (thu)
        Reason NVARCHAR(500) NOT NULL,         -- ly do nop / rut tien
        Amount DECIMAL(18,2) NOT NULL,
        PaymentMethod NVARCHAR(30) NULL,       -- Tien mat / Chuyen khoan / The
        AttachedDocs NVARCHAR(100) NULL,       -- kem theo (chung tu goc)
        Note NVARCHAR(MAX) NULL,
        CreatedBy NVARCHAR(100) NULL,
        CreatedAt DATETIME NULL,
        UpdatedBy NVARCHAR(100) NULL,
        UpdatedAt DATETIME NULL
    );
END
GO

PRINT '=== KIEM CHUNG 1: CAU TRUC BANG CashVouchers ===';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'CashVouchers'
ORDER BY ORDINAL_POSITION;
-- Ky vong: 16 cot (Id, Type, VoucherDate, Code, Partner, PartnerAddress,
-- Receiver, Reason, Amount, PaymentMethod, AttachedDocs, Note,
-- CreatedBy, CreatedAt, UpdatedBy, UpdatedAt)

PRINT '=== KIEM CHUNG 2: DU LIEU ===';
SELECT COUNT(*) AS SoPhieuHienCo FROM CashVouchers;
-- Ky vong: 0 (bang moi tao, chua co du lieu)

PRINT '=== KIEM CHUNG 3: PHAN QUYEN Menu_Vouchers (app tu boa sung khi khoi dong) ===';
SELECT Role, FeatureKey, CanView, CanCreate, CanEdit, CanDelete
FROM RolePermissions
WHERE FeatureKey IN ('Menu_Vouchers_Thu', 'Menu_Vouchers_Chi')
ORDER BY Role, FeatureKey;
-- Ky vong tren may da chay app ban moi: 10 dong
-- (admin / manager / ketoan = 1,1,1,1 ; thukho / staff = 0,0,0,0)
-- Neu chua co dong nao: mo app ban moi 1 lan, app tu insert.
