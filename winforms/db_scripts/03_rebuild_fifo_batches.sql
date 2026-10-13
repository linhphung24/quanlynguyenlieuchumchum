/* ============================================================
   SCRIPT 03: REBUILD TOAN BO LO FIFO + LUOT TRU
   ------------------------------------------------------------
   Dich dung thu?at toan FifoBatchService.RebuildAllFifoBatches cua app:
     1. Xoa sach BatchDeductions + Batches
     2. Tao lo TONDAU tu khai bao ton dau (AdjQty > 0), gia = CostPrice
     3. Tao lo tu tung dong hoa don NHAP
     4. "Dien lai" FIFO: duyet hoa don XUAT DA DUYET theo thoi gian,
        tru dan lo cu nhat truoc, ghi BatchDeductions
   Lo hang la du lieu PHAI SINH - script khong doi du lieu goc
   (hoa don, ton dau khai bao). Chay lai bao nhieu lan cung duoc.
   Luu y: chay khi app DANG TAT (app cung tu rebuild moi lan khoi dong).
   ============================================================ */
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRAN;

    DELETE FROM BatchDeductions;
    DELETE FROM Batches;

    -- Dam bao hoa don dummy Id = 0 ton tai (cha cua cac lo TONDAU)
    IF NOT EXISTS (SELECT 1 FROM Invoices WHERE Id = 0)
    BEGIN
        SET IDENTITY_INSERT Invoices ON;
        INSERT INTO Invoices (Id, Type, InvDate, Code, Partner, CreatedBy)
        VALUES (0, 'in', '2000-01-01', 'TONDAU_DUMMY', 'System', 'System');
        SET IDENTITY_INSERT Invoices OFF;
    END

    -- 1. Lo ton dau ky
    INSERT INTO Batches (ProductName, InvoiceId, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price, Unit)
    SELECT s.ProductName, 0,
           'TONDAU-' + RIGHT('0' + CAST(s.[Month] AS VARCHAR), 2) + '/' + CAST(s.[Year] AS VARCHAR),
           CAST(CAST(s.[Year] AS VARCHAR) + '-' + RIGHT('0' + CAST(s.[Month] AS VARCHAR), 2) + '-01' AS DATETIME),
           s.AdjQty, s.AdjQty, ISNULL(p.CostPrice, 0), ISNULL(p.Unit, 'kg')
    FROM StockOpeningAdj s
    LEFT JOIN Products p ON s.ProductName = p.Name
    WHERE s.AdjQty > 0;

    DECLARE @tondau INT = @@ROWCOUNT;

    -- 2. Lo tu hoa don nhap
    INSERT INTO Batches (ProductName, InvoiceId, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price, Unit, MfgDate, ExpDate)
    SELECT d.ProductName, i.Id, i.Code, i.InvDate, d.Amount, d.Amount, d.Price, d.Unit, d.MfgDate, d.ExpDate
    FROM InvoiceDetails d
    INNER JOIN Invoices i ON d.InvoiceId = i.Id
    WHERE i.Type = 'in'
    ORDER BY i.InvDate ASC, i.Id ASC;

    DECLARE @lonhap INT = @@ROWCOUNT;

    -- 3. Replay FIFO hoa don xuat DA DUYET
    DECLARE @outInvId INT, @outCode NVARCHAR(50), @outDate DATE;
    DECLARE @pn NVARCHAR(255), @qty DECIMAL(18,2), @unit NVARCHAR(20);
    DECLARE @remaining DECIMAL(18,2);
    DECLARE @bId INT, @bRem DECIMAL(18,2), @bCode NVARCHAR(50), @bDate DATE, @bPrice DECIMAL(18,2), @bUnit NVARCHAR(20);
    DECLARE @take DECIMAL(18,2);

    DECLARE out_cur CURSOR LOCAL FAST_FORWARD FOR
        SELECT Id, Code, InvDate FROM Invoices
        WHERE Type = 'out' AND ISNULL(ApprovalStatus, 'approved') = 'approved'
        ORDER BY InvDate ASC, Id ASC;
    OPEN out_cur;
    FETCH NEXT FROM out_cur INTO @outInvId, @outCode, @outDate;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        DECLARE det_cur CURSOR LOCAL FAST_FORWARD FOR
            SELECT ProductName, Amount, ISNULL(Unit, 'kg') FROM InvoiceDetails WHERE InvoiceId = @outInvId;
        OPEN det_cur;
        FETCH NEXT FROM det_cur INTO @pn, @qty, @unit;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @remaining = @qty;
            DECLARE bat_cur CURSOR LOCAL FAST_FORWARD FOR
                SELECT Id, RemainingQty, InvoiceCode, InvoiceDate, Price, ISNULL(Unit, 'kg')
                FROM Batches
                WHERE LOWER(LTRIM(RTRIM(ProductName))) = LOWER(LTRIM(RTRIM(@pn))) AND RemainingQty > 0
                ORDER BY InvoiceDate ASC, Id ASC;
            OPEN bat_cur;
            FETCH NEXT FROM bat_cur INTO @bId, @bRem, @bCode, @bDate, @bPrice, @bUnit;
            WHILE @@FETCH_STATUS = 0 AND @remaining > 0
            BEGIN
                SET @take = CASE WHEN @remaining < @bRem THEN @remaining ELSE @bRem END;
                UPDATE Batches SET RemainingQty = @bRem - @take WHERE Id = @bId;
                INSERT INTO BatchDeductions (BatchId, InvoiceId, QtyUsed, BatchInvCode, BatchInvDate, BatchPrice, BatchUnit)
                VALUES (@bId, @outInvId, @take, @bCode, @bDate, @bPrice, @bUnit);
                SET @remaining = @remaining - @take;
                FETCH NEXT FROM bat_cur INTO @bId, @bRem, @bCode, @bDate, @bPrice, @bUnit;
            END
            CLOSE bat_cur; DEALLOCATE bat_cur;
            FETCH NEXT FROM det_cur INTO @pn, @qty, @unit;
        END
        CLOSE det_cur; DEALLOCATE det_cur;
        FETCH NEXT FROM out_cur INTO @outInvId, @outCode, @outDate;
    END
    CLOSE out_cur; DEALLOCATE out_cur;

COMMIT TRAN;
PRINT '=== REBUILD XONG: lo ton dau = ' + CAST(@tondau AS VARCHAR) + ', lo nhap = ' + CAST(@lonhap AS VARCHAR) + ' ===';

-- KIEM CHUNG: so sanh 2 nguon ton kho (cong thuc app vs tong lo)
IF OBJECT_ID('tempdb..#io2') IS NOT NULL DROP TABLE #io2;
SELECT d.ProductName,
       SUM(CASE WHEN i.Type = 'in' THEN d.Amount ELSE 0 END) AS TongNhap,
       SUM(CASE WHEN i.Type = 'out' THEN d.Amount ELSE 0 END) AS TongXuat
INTO #io2
FROM InvoiceDetails d JOIN Invoices i ON d.InvoiceId = i.Id
GROUP BY d.ProductName;

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
SELECT COUNT(*) AS SoSPLechHaiNguon
FROM formula f
LEFT JOIN (SELECT ProductName, SUM(RemainingQty) AS TonLo FROM Batches GROUP BY ProductName) bs
       ON bs.ProductName = f.Name
WHERE ABS(f.Ton - ISNULL(bs.TonLo, 0)) > 0.005;
-- Ghi chu: SP "lech" la nhom xuat vuot nhap (ton am, FIFO bo sot phan thieu)
-- - ton tai san theo du lieu, khong phai loi script. Dung de doi chieu truoc/sau.
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    PRINT '!!! LOI: ' + ERROR_MESSAGE();
END CATCH;
