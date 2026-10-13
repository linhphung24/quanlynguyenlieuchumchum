SET NOCOUNT ON;

PRINT '=== 1. CAC HOA DON DA DUOC SUA (UpdatedBy KHONG NULL) ===';
SELECT Id, Type, CONVERT(varchar(10), InvDate, 103) AS InvDate, Code, Partner,
       UpdatedBy, CONVERT(varchar(16), UpdatedAt, 120) AS UpdatedAt
FROM Invoices WHERE UpdatedBy IS NOT NULL ORDER BY UpdatedAt DESC;

PRINT '=== 2. AUDIT LOG UPDATE HOA DON ===';
SELECT Id, EntityId, Detail, CONVERT(varchar(16), CreatedAt, 120) AS At
FROM AuditLog WHERE Action = 'UPDATE' AND Entity = 'Invoice' ORDER BY Id DESC;

PRINT '=== 3. HOA DON 5 HOA DON CUOI (theo Id) ===';
SELECT Id, Type, CONVERT(varchar(10), InvDate, 103) AS InvDate, Code,
       CONVERT(varchar(16), CreatedAt, 120) AS CreatedAt, CreatedBy,
       ISNULL(UpdatedBy,'') AS UpdatedBy
FROM Invoices ORDER BY Id DESC;

PRINT '=== 4. KHOANG THOI GIAN DU LIEU ===';
SELECT CONVERT(varchar(10), MIN(InvDate), 103) AS NgayCuNhat,
       CONVERT(varchar(10), MAX(InvDate), 103) AS NgayMoiNhat
FROM Invoices;

PRINT '=== 5. BOT TOI - KIEM TRA DONG TRUNG HD CO CON? ===';
SELECT d.Id, d.InvoiceId, i.Type, CONVERT(varchar(10), i.InvDate, 103) AS InvDate, i.Code, d.Amount, d.Price
FROM InvoiceDetails d INNER JOIN Invoices i ON d.InvoiceId = i.Id
WHERE d.ProductName = N'B'+NCHAR(7887)+N't t'+NCHAR(7883)
ORDER BY d.InvoiceId;
