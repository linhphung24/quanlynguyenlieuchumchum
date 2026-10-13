/* ============================================================
   SCRIPT 01: THEM COT DUYET HOA DON XUAT CHO BANG INVOICES
   - ApprovalStatus: pending / approved / rejected (NULL = approved,
     tuong thich du lieu cu va app chua nang cap)
   - ApprovedBy / ApprovedAt: nguoi va thoi diem duyet
   - Backfill: moi hoa don cu = 'approved' (ton kho khong doi)
   Idempotent: chay lai khong gay hai.
   (App moi cung tu chay migration nay khi khoi dong.)
   ============================================================ */
SET NOCOUNT ON;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Invoices' AND COLUMN_NAME = 'ApprovalStatus')
    ALTER TABLE Invoices ADD ApprovalStatus NVARCHAR(20) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Invoices' AND COLUMN_NAME = 'ApprovedBy')
    ALTER TABLE Invoices ADD ApprovedBy NVARCHAR(100) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Invoices' AND COLUMN_NAME = 'ApprovedAt')
    ALTER TABLE Invoices ADD ApprovedAt DATETIME NULL;
GO

UPDATE Invoices SET ApprovalStatus = 'approved' WHERE ApprovalStatus IS NULL;

PRINT '=== KIEM CHUNG: PHAN BO TRANG THAI DUYET ===';
SELECT ApprovalStatus, COUNT(*) AS SoHoaDon FROM Invoices GROUP BY ApprovalStatus;
-- Ky vong: toan bo 'approved' (du lieu lich su chua co chuc nang duyet)
