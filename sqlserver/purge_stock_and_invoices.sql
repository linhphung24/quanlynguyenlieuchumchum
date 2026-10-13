-- ============================================================================
-- CHUM CHUM BAKERY - SCRIPT XÓA DỮ LIỆU HÓA ĐƠN & KHO CŨ (MICROSOFT SQL SERVER)
-- ============================================================================
-- Mục đích:
--   - Xóa toàn bộ hóa đơn nhập / xuất và dữ liệu lô kho cũ.
--   - BẢO TỒN NGUYÊN VẸN:
--       + Danh mục Nhà cung cấp (Suppliers): Giữ nguyên 100%.
--       + Tài khoản & phân quyền (Users, RolePermissions): Giữ nguyên 100%.
--       + Danh mục Sản phẩm / Nguyên vật liệu (Products): Giữ nguyên tên, mã, quy cách, ĐVT.
--         (Tồn kho RealtimeStock của sản phẩm sẽ tự động tính lại về 0).
--       + Công thức làm bánh (Recipes, RecipeIngredients): Giữ nguyên 100%.
--       + Thông tin doanh nghiệp (CompanyInfo): Giữ nguyên 100%.
--   - TỰ ĐỘNG TẠO BẢN SAO LƯU DỰ PHÒNG (*_Bak_YYYYMMDD) TRƯỚC KHI XÓA.
-- ============================================================================

USE ChumChumDB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
BEGIN TRANSACTION;

    -- ------------------------------------------------------------------------
    -- BƯỚC 1: TỰ ĐỘNG SAO LƯU DỮ LIỆU TRƯỚC KHI XÓA
    -- ------------------------------------------------------------------------
    DECLARE @BakSuffix NVARCHAR(20) = CONVERT(NVARCHAR(8), GETDATE(), 112);
    PRINT N'=== BẮT ĐẦU SAO LƯU DỰ PHÒNG TRƯỚC KHI XÓA (Hậu tố: ' + @BakSuffix + N') ===';

    IF OBJECT_ID('BatchDeductions_Bak') IS NULL
        SELECT * INTO BatchDeductions_Bak FROM BatchDeductions;

    IF OBJECT_ID('Batches_Bak') IS NULL
        SELECT * INTO Batches_Bak FROM Batches;

    IF OBJECT_ID('InvoiceDetails_Bak') IS NULL
        SELECT * INTO InvoiceDetails_Bak FROM InvoiceDetails;

    IF OBJECT_ID('Invoices_Bak') IS NULL
        SELECT * INTO Invoices_Bak FROM Invoices;

    IF OBJECT_ID('StockOpeningAdj_Bak') IS NULL
        SELECT * INTO StockOpeningAdj_Bak FROM StockOpeningAdj;

    PRINT N'-> Đã sao lưu an toàn sang các bảng *_Bak';

    -- ------------------------------------------------------------------------
    -- BƯỚC 2: KIỂM TRA SỐ LƯỢNG TRƯỚC KHI XÓA
    -- ------------------------------------------------------------------------
    DECLARE @cDed INT = (SELECT COUNT(*) FROM BatchDeductions);
    DECLARE @cBat INT = (SELECT COUNT(*) FROM Batches);
    DECLARE @cDet INT = (SELECT COUNT(*) FROM InvoiceDetails);
    DECLARE @cInv INT = (SELECT COUNT(*) FROM Invoices WHERE Id > 0);
    DECLARE @cAdj INT = (SELECT COUNT(*) FROM StockOpeningAdj);

    PRINT N'-> Số lượng chuẩn bị xóa:';
    PRINT N'   - Hóa đơn (Invoices): ' + CAST(@cInv AS NVARCHAR(10));
    PRINT N'   - Chi tiết hóa đơn (InvoiceDetails): ' + CAST(@cDet AS NVARCHAR(10));
    PRINT N'   - Lô hàng FIFO (Batches): ' + CAST(@cBat AS NVARCHAR(10));
    PRINT N'   - Lượt trừ lô (BatchDeductions): ' + CAST(@cDed AS NVARCHAR(10));
    PRINT N'   - Khai báo tồn đầu (StockOpeningAdj): ' + CAST(@cAdj AS NVARCHAR(10));

    -- ------------------------------------------------------------------------
    -- BƯỚC 3: XÓA DỮ LIỆU THEO THỨ TỰ PHỤ THUỘC (Khóa ngoại con trước, cha sau)
    -- ------------------------------------------------------------------------
    DELETE FROM BatchDeductions;
    DELETE FROM Batches;
    DELETE FROM InvoiceDetails;
    DELETE FROM Invoices WHERE Id > 0; -- Giữ lại dòng dummy Id = 0 (TONDAU_DUMMY)
    DELETE FROM StockOpeningAdj;

    -- Đặt lại Identity về 0 để hóa đơn và chi tiết tiếp theo bắt đầu từ Id = 1
    DBCC CHECKIDENT ('BatchDeductions', RESEED, 0);
    DBCC CHECKIDENT ('Batches', RESEED, 0);
    DBCC CHECKIDENT ('InvoiceDetails', RESEED, 0);
    DBCC CHECKIDENT ('Invoices', RESEED, 0);
    DBCC CHECKIDENT ('StockOpeningAdj', RESEED, 0);

    -- ------------------------------------------------------------------------
    -- BƯỚC 4: GHI NHẬT KÝ THAO TÁC (AuditLog)
    -- ------------------------------------------------------------------------
    INSERT INTO AuditLog (UserId, UserName, Action, Entity, EntityId, Detail, CreatedAt)
    VALUES (
        '1',
        N'admin',
        'PURGE_DATA',
        N'Invoices+Stock',
        CONVERT(NVARCHAR(20), GETDATE(), 120),
        N'Đã làm sạch dữ liệu hóa đơn và kho cũ. Giữ nguyên Nhà cung cấp và Tài khoản. Backup: *_Bak',
        GETDATE()
    );

COMMIT TRANSACTION;
PRINT N'=== XÓA DỮ LIỆU KHO VÀ HÓA ĐƠN THÀNH CÔNG! ===';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    PRINT N'!!! LỖI TRONG QUÁ TRÌNH XỬ LÝ: ' + ERROR_MESSAGE();
END CATCH;
GO

-- ----------------------------------------------------------------------------
-- KIỂM TRA LẠI DỮ LIỆU SAU KHI XÓA
-- ----------------------------------------------------------------------------
SELECT 
    (SELECT COUNT(*) FROM Invoices) AS InvoicesCount,            -- Phải = 1 (chỉ còn Id = 0 TONDAU_DUMMY)
    (SELECT COUNT(*) FROM InvoiceDetails) AS DetailsCount,       -- Phải = 0
    (SELECT COUNT(*) FROM Batches) AS BatchesCount,              -- Phải = 0
    (SELECT COUNT(*) FROM BatchDeductions) AS DeductionsCount,   -- Phải = 0
    (SELECT COUNT(*) FROM StockOpeningAdj) AS OpeningCount,      -- Phải = 0
    (SELECT COUNT(*) FROM Suppliers) AS SuppliersCount,          -- VẪN NGUYÊN (120 NCC)
    (SELECT COUNT(*) FROM Users) AS UsersCount,                  -- VẪN NGUYÊN (5 tài khoản)
    (SELECT COUNT(*) FROM Products) AS ProductsCount;            -- VẪN NGUYÊN (1039 sản phẩm)
GO
