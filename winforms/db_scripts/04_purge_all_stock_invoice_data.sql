/* ============================================================
   SCRIPT 04: XOA TOAN BO DU LIEU KHO + HOA DON DE NHAP MOI
   ------------------------------------------------------------
   Nen can: chuan bi nhap lai toan bo du lieu (ton dau ky + hoa don)
   tu dau sau khi ket thuc ky test.

   Cac bang BI XOA (theo thu tu phu thuoc):
     1. BatchDeductions  - luot tru FIFO (du lieu phai sinh)
     2. Batches          - lo FIFO (du lieu phai sinh)
     3. InvoiceDetails   - chi tiet dong hang hoa don
     4. Invoices         - hoa don nhap/xuat (GIU dong dummy Id = 0 TONDAU_DUMMY)
     5. StockOpeningAdj  - khai bao ton dau ky

   Cac bang GIU NGUYEN:
     - Products (danh muc nguyen lieu): ton hien thi tren app la cot
       RealtimeStock tinh tu ton dau + hoa don -> tu dong ve 0 sau khi
       xoa, KHONG can chinh sua gi them
     - Recipes/RecipeIngredients, Suppliers, Users, RolePermissions
     - AuditLog: giu lich su truy vet (ke ca dong audit lan xoa nay)

   Sau khi xoa: ID cac bang tren chay lai tu 1 (DBCC CHECKIDENT RESEED).
   App tu rebuild FIFO moi lan khoi dong nen khong can chay them script 03.

   Hoan tac: du lieu cu con nguyen trong cac bang *_Bak_20260925,
   INSERT lai tu bang backup (nho bat IDENTITY_INSERT) roi mo app.

   Chay khi app DANG TAT (SSMS). Chay lai bao nhieu lan cung duoc:
   bang backup chi tao lan dau tien, cac lan sau khong ghi de.
   ============================================================ */
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRAN;

    -- 0. Backup du lieu cu (diem phuc hoi) - chi tao 1 lan, khong ghi de
    IF OBJECT_ID('BatchDeductions_Bak_20260925') IS NULL
        SELECT * INTO BatchDeductions_Bak_20260925 FROM BatchDeductions;
    IF OBJECT_ID('Batches_Bak_20260925') IS NULL
        SELECT * INTO Batches_Bak_20260925 FROM Batches;
    IF OBJECT_ID('InvoiceDetails_Bak_20260925') IS NULL
        SELECT * INTO InvoiceDetails_Bak_20260925 FROM InvoiceDetails;
    IF OBJECT_ID('Invoices_Bak_20260925') IS NULL
        SELECT * INTO Invoices_Bak_20260925 FROM Invoices;
    IF OBJECT_ID('StockOpeningAdj_Bak_20260925') IS NULL
        SELECT * INTO StockOpeningAdj_Bak_20260925 FROM StockOpeningAdj;
    PRINT '=== DA BACKUP 5 BANG THANH *_Bak_20260925 ===';

    -- 1. In so dong truoc khi xoa
    DECLARE @c1 INT = (SELECT COUNT(*) FROM BatchDeductions);
    DECLARE @c2 INT = (SELECT COUNT(*) FROM Batches);
    DECLARE @c3 INT = (SELECT COUNT(*) FROM InvoiceDetails);
    DECLARE @c4 INT = (SELECT COUNT(*) FROM Invoices);
    DECLARE @c5 INT = (SELECT COUNT(*) FROM StockOpeningAdj);
    PRINT '=== TRUOC KHI XOA: BatchDeductions=' + CAST(@c1 AS VARCHAR)
        + ', Batches=' + CAST(@c2 AS VARCHAR)
        + ', InvoiceDetails=' + CAST(@c3 AS VARCHAR)
        + ', Invoices=' + CAST(@c4 AS VARCHAR)
        + ', StockOpeningAdj=' + CAST(@c5 AS VARCHAR) + ' ===';

    -- 2. Xoa theo thu tu phu thuoc (con truoc, cha sau)
    DELETE FROM BatchDeductions;
    DELETE FROM Batches;
    DELETE FROM InvoiceDetails;
    DELETE FROM Invoices WHERE Id > 0;   -- giu dong TONDAU_DUMMY Id = 0
    DELETE FROM StockOpeningAdj;

    -- 3. ID nhap moi chay lai tu 1
    DBCC CHECKIDENT ('BatchDeductions', RESEED, 0);
    DBCC CHECKIDENT ('Batches', RESEED, 0);
    DBCC CHECKIDENT ('InvoiceDetails', RESEED, 0);
    DBCC CHECKIDENT ('Invoices', RESEED, 0);
    DBCC CHECKIDENT ('StockOpeningAdj', RESEED, 0);

    -- 4. Ghi audit (chi lan dau co du lieu; chay lai khong ghi them)
    IF (@c1 + @c2 + @c3 + @c4 + @c5) > 0
    BEGIN
        INSERT INTO AuditLog (UserId, UserName, Action, Entity, EntityId, Detail, CreatedAt)
        VALUES ('0', N'zcode-fix', 'PURGE', N'Kho+HoaDon', N'2026-09-25',
                N'Xoa toan bo du lieu de nhap moi: hoa don=' + CAST(@c4 AS NVARCHAR(10))
              + N', chi tiet=' + CAST(@c3 AS NVARCHAR(10))
              + N', lo FIFO=' + CAST(@c2 AS NVARCHAR(10))
              + N', luot tru=' + CAST(@c1 AS NVARCHAR(10))
              + N', ton dau ky=' + CAST(@c5 AS NVARCHAR(10))
              + N'. Giu dummy TONDAU Id=0. Backup: *_Bak_20260925',
                GETDATE());
        PRINT '=== DA XOA + RESEED ID + GHI AUDIT ===';
    END
    ELSE
        PRINT '=== DU LIEU DA SACH TU TRUOC - KHONG CO GI DE XOA ===';

COMMIT TRAN;

-- KIEM CHUNG 1: so dong con lai cua tung bang
PRINT '=== KIEM CHUNG: SO DONG CON LAI (Invoices phai = 1: dummy TONDAU) ===';
SELECT
    (SELECT COUNT(*) FROM BatchDeductions) AS BatchDeductions,
    (SELECT COUNT(*) FROM Batches)         AS Batches,
    (SELECT COUNT(*) FROM InvoiceDetails)  AS InvoiceDetails,
    (SELECT COUNT(*) FROM Invoices)        AS Invoices,
    (SELECT COUNT(*) FROM StockOpeningAdj) AS StockOpeningAdj;

-- KIEM CHUNG 2: dummy TONDAU con nguyen (cha cua lo ton dau khi nhap lai)
IF EXISTS (SELECT 1 FROM Invoices WHERE Id = 0)
    PRINT '=== OK: hoa don dummy TONDAU Id = 0 con nguyen ===';
ELSE
    PRINT '!!! CANH BAO: thieu dummy TONDAU Id = 0 - mo app se tu tao lai ===';

-- KIEM CHUNG 3: cong thuc ton cua app phai = 0 cho moi SP (dung lai
-- cong thuc kiem chung cua script 03 de doc lap voi buoc xoa)
;WITH formula AS (
    SELECT p.Name,
           ISNULL((SELECT TOP 1 s.AdjQty FROM StockOpeningAdj s
                    WHERE s.ProductName = p.Name ORDER BY s.[Year] DESC, s.[Month] DESC), 0)
         + ISNULL((SELECT SUM(CASE WHEN i.Type = 'in' THEN d.Amount ELSE -d.Amount END)
                   FROM InvoiceDetails d JOIN Invoices i ON d.InvoiceId = i.Id
                   WHERE d.ProductName = p.Name
                     AND (i.Type = 'in' OR ISNULL(i.ApprovalStatus, 'approved') = 'approved')), 0) AS Ton
    FROM Products p WHERE p.IsActive = 1
)
SELECT COUNT(*) AS SoSPTonKhac0 FROM formula WHERE ABS(Ton) > 0.005;
-- Ket qua mong doi = 0

-- (TUY CHON) Cot Products.StockQty la du lieu cu, app khong con dung de hien
-- thi (dung RealtimeStock). Bo comment neu muon don phan tu:
-- UPDATE Products SET StockQty = 0, UpdatedAt = GETDATE();
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    PRINT '!!! LOI: ' + ERROR_MESSAGE();
END CATCH;
