SET NOCOUNT ON;

PRINT '=== 1. DEM SO DONG CHI TIET 3 HOA DON DA SUA (audit: 9 / 25 / 41 dong) ===';
SELECT d.InvoiceId, COUNT(*) AS SoDong, SUM(d.Amount) AS TongSL, SUM(d.Subtotal) AS TongTien
FROM InvoiceDetails d WHERE d.InvoiceId IN (167, 290, 313)
GROUP BY d.InvoiceId;

PRINT '=== 2. CHI TIET HOA DON 167 (9 dong) ===';
SELECT d.Id, d.ProductId, d.ProductName, d.Unit, d.Amount, d.Price, d.Subtotal
FROM InvoiceDetails d WHERE d.InvoiceId = 167 ORDER BY d.Id;

PRINT '=== 3. CHI TIET HOA DON 290 (25 dong) - 8 dong dau ===';
SELECT TOP 8 d.Id, d.ProductId, d.ProductName, d.Unit, d.Amount, d.Price
FROM InvoiceDetails d WHERE d.InvoiceId = 290 ORDER BY d.Id;

PRINT '=== 4. CHI TIET HOA DON 313 (41 dong) - 8 dong dau ===';
SELECT TOP 8 d.Id, d.ProductId, d.ProductName, d.Unit, d.Amount, d.Price
FROM InvoiceDetails d WHERE d.InvoiceId = 313 ORDER BY d.Id;

PRINT '=== 5. DONG TRUNG LAP TRONG CUNG 1 HOA DON (sau khi sua) ===';
SELECT d.InvoiceId, d.ProductName, COUNT(*) AS SoLan, SUM(d.Amount) AS TongSL
FROM InvoiceDetails d
GROUP BY d.InvoiceId, d.ProductName
HAVING COUNT(*) > 1 AND d.InvoiceId IN (167, 290, 313);

PRINT '=== 6. BATCHES TUONG UNG 3 HOA DON NAY (neu la hoa don nhap) ===';
SELECT b.InvoiceId, COUNT(*) AS SoLo FROM Batches b WHERE b.InvoiceId IN (167, 290, 313) GROUP BY b.InvoiceId;
