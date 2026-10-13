/* ============================================================
   SCRIPT 02: ZERO CAC DONG TON DAU KY BI TU DONG SINH (DEM DOI)
   ------------------------------------------------------------
   Nen can: phien ban app cu, nut "Luu Thay Doi" man Ton dau ky
   ghi TOAN BO danh sach (ke ca o dien san mac dinh = ton hien tai),
   tao khai bao ton dau = dung bang ton hien tai cho moi SP chua khai.
   Ket qua: ton bi dem doi (ton dau + hoa don nhap cung so do).

   Tieu chi nhan dien dong BI TU DONG SINH ( chac chan khong phai khai tay):
     - Thuoc KY GOC (ky som nhat co khai bao ton dau)
     - Tao tu man hinh app (CreatedAt IS NOT NULL; dong go-live nhap
       bang script co CreatedAt NULL va KHONG bi anh huong)
     - AdjQty DUNG BANG (TongNhap - TongXuat) toan bo theo ten SP
       = "anh chup ton tai thoi diem luu", ke ca gia tri am (vd -2)

   Cach dung:
     1) @Execute = 0 (mac dinh): DRY RUN - in ra danh sach se bi zero
        va danh sach can ra soat, KHONG thay doi gi.
     2) Xem ky danh sach in ra. Dong vao nhom "can ra soat" la khai
        tay co the dung - script KHONG tu dong zero nhom nay.
     3) Doi @Execute = 1 chay lai de AP DUNG (backup truoc, zero sau).

   Hoan tac: copy lai AdjQty tu bang backup StockOpeningAdj_Bak_20260901 theo Id,
   sau do chay lai script 03 (rebuild FIFO).
   ============================================================ */
SET NOCOUNT ON;
DECLARE @Execute BIT = 0;          -- 0 = dry run, 1 = ap dung
DECLARE @Operator  NVARCHAR(50) = N'zcode-fix';

-- Ky goc = ky som nhat co khai bao
DECLARE @Y INT, @M INT;
SELECT TOP 1 @Y = [Year], @M = [Month] FROM StockOpeningAdj ORDER BY [Year], [Month];
PRINT '=== KY GOC XAC DINH: ' + CAST(@M AS VARCHAR(2)) + '/' + CAST(@Y AS VARCHAR(4)) + ' ===';

BEGIN TRY
    -- 1. Backup toan bo bang (diem phuc hoi) - chi tao 1 lan
    IF OBJECT_ID('StockOpeningAdj_Bak_20260901') IS NULL
    BEGIN
        SELECT * INTO StockOpeningAdj_Bak_20260901 FROM StockOpeningAdj;
        PRINT '=== DA BACKUP TOAN BO StockOpeningAdj -> StockOpeningAdj_Bak_20260901 ===';
    END
    ELSE
        PRINT '=== BANG BACKUP DA TON TAI, GIU NGUYEN (khong ghi de) ===';

    -- 2. Nhap/xuat toan bo theo ten SP
    IF OBJECT_ID('tempdb..#io') IS NOT NULL DROP TABLE #io;
    SELECT d.ProductName,
           SUM(CASE WHEN i.Type = 'in' THEN d.Amount ELSE 0 END) AS TongNhap,
           SUM(CASE WHEN i.Type = 'out' THEN d.Amount ELSE 0 END) AS TongXuat
    INTO #io
    FROM InvoiceDetails d JOIN Invoices i ON d.InvoiceId = i.Id
    GROUP BY d.ProductName;

    -- 3. Tap se bi zero
    IF OBJECT_ID('tempdb..#fix') IS NOT NULL DROP TABLE #fix;
    SELECT s.Id, s.ProductName, s.AdjQty,
           ISNULL(io.TongNhap, 0) AS TongNhap, ISNULL(io.TongXuat, 0) AS TongXuat,
           CONVERT(varchar(16), s.CreatedAt, 120) AS CreatedAt
    INTO #fix
    FROM StockOpeningAdj s
    LEFT JOIN #io io ON io.ProductName = s.ProductName
    WHERE s.[Year] = @Y AND s.[Month] = @M
      AND s.CreatedAt IS NOT NULL
      AND s.AdjQty <> 0
      AND s.AdjQty = ISNULL(io.TongNhap, 0) - ISNULL(io.TongXuat, 0);

    DECLARE @n INT = (SELECT COUNT(*) FROM #fix);
    PRINT '=== SO DONG SE BI ZERO (tu dong sinh = ton snapshot): ' + CAST(@n AS VARCHAR) + ' ===';
    SELECT * FROM #fix ORDER BY ProductName;

    IF @n > 0 AND @Execute = 1
    BEGIN
        UPDATE s SET s.AdjQty = 0, s.UpdatedBy = @Operator, s.UpdatedAt = GETDATE()
        FROM StockOpeningAdj s JOIN #fix f ON s.Id = f.Id;

        INSERT INTO AuditLog (UserId, UserName, Action, Entity, EntityId, Detail, CreatedAt)
        VALUES ('0', @Operator, 'FIX', 'StockOpeningAdj',
                CAST(@M AS VARCHAR(2)) + '-' + CAST(@Y AS VARCHAR(4)),
                N'Zero ' + CAST(@n AS NVARCHAR(10)) + N' dong ton dau ky ' + CAST(@M AS NVARCHAR(2)) + '/' + CAST(@Y AS NVARCHAR(4))
                    + N' bi tu dong sinh (= ton hien tai snapshot). Backup: StockOpeningAdj_Bak_20260901',
                GETDATE());

        PRINT '=== DA ZERO ' + CAST(@n AS VARCHAR) + ' DONG + GHI AUDIT. CHAY TIEP SCRIPT 03 DE REBUILD FIFO ===';
    END
    ELSE IF @n > 0
        PRINT '=== DRY RUN: CHUA THAY DOI GI. Doi @Execute = 1 roi chay lai de ap dung ===';
    ELSE
        PRINT '=== KHONG CO DONG NAO KHOP TIEU CHI - KHONG CAN THAY DOI ===';

    -- 4. Bao cao cac dong man hinh con lai co gia tri (KHONG tu zero - team ra soat)
    PRINT '=== BAO CAO: DONG TON DAU TAO TU APP CON LAI (can team ra soat thu cong) ===';
    SELECT s.Id, s.ProductName, s.AdjQty,
           CONVERT(varchar(16), s.CreatedAt, 120) AS CreatedAt,
           ISNULL(io.TongNhap, 0) AS TongNhap, ISNULL(io.TongXuat, 0) AS TongXuat
    FROM StockOpeningAdj s
    LEFT JOIN #io io ON io.ProductName = s.ProductName
    WHERE s.[Year] = @Y AND s.[Month] = @M
      AND s.CreatedAt IS NOT NULL
      AND s.AdjQty <> 0
      AND s.AdjQty <> ISNULL(io.TongNhap, 0) - ISNULL(io.TongXuat, 0)
    ORDER BY s.ProductName;
END TRY
BEGIN CATCH
    PRINT '!!! LOI: ' + ERROR_MESSAGE();
END CATCH;
