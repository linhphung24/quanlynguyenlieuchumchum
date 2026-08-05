-- SCRIPT THÊM SẢN PHẨM MẪU VÀO BẢNG Products
USE [ChumChumDB];
GO
SET IDENTITY_INSERT [dbo].[Products] ON;
GO
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-OREO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (550, N'NL-OREO', N'Bánh oreo', N'Nguyên liệu', N'gói', 9000, 0, 10, 5, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-DAHEO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (551, N'NL-DAHEO', N'Bì lợn', N'Nguyên liệu', N'kg', 20000, 0, 0.5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0282')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (552, N'NL0282', N'Bơ cán 82% đông lạnh 2kg Grand Fermage', N'Nguyên liệu', N'thùng', 314814, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-BOQUA-DEO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (554, N'NL-BOQUA-DEO', N'Bơ quả cấp đông', N'Nguyên liệu', N'túi', 105000, 0, 4, 3, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0300')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (555, N'NL0300', N'Bơ hạt phỉ golden farm', N'Nguyên liệu', N'hộp', 87000, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-BO0026HL')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (556, N'NL-BO0026HL', N'Bơ New Anchor 4x5kg', N'Nguyên liệu', N'kg', 263890, 0, 7.3, 1, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0145')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (557, N'NL0145', N'Bơ ngọt dạng miếng (10 túi / thùng)', N'Nguyên liệu', N'thùng', 1350000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0190')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (558, N'NL0190', N'Bò xay', N'Nguyên liệu', N'kg', 190000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT040')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (559, N'N_BOT040', N'Bột su kem cremyvit 5kg/túi', N'Nguyên liệu', N'gói', 575100, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-BOTTAYAKI-NH')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (560, N'NL-BOTTAYAKI-NH', N'Bột vỏ bánh Taiyaki Nhật Bản túi 1kg', N'Nguyên liệu', N'gói', 73000, 0, 14, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT001')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (561, N'N_BOT001', N'Bột baking soda', N'Nguyên liệu', N'hộp', 35000, 0, 1, 1, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT003')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (562, N'N_BOT003', N'Bột bắp (25kg)', N'Nguyên liệu', N'kg', 23000, 0, 1, 25, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT005')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (563, N'N_BOT005', N'Bột biến tính', N'Nguyên liệu', N'kg', 50000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-GIAVIBOKHO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (564, N'NL-GIAVIBOKHO', N'Gia vị bò kho', N'Nguyên liệu', N'Gói', 10000, 0, 10, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT006')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (565, N'N_BOT006', N'Bột bông hồng 25kg', N'Nguyên liệu', N'kg', 17200, 0, 450, 25, N'DOANH NGHIỆP TƯ NHÂN MINH BẢO VIỆT NAM', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT007')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (566, N'N_BOT007', N'Bột cà ri', N'Nguyên liệu', N'gói', 170000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT009')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (567, N'N_BOT009', N'Bột cacao túi 1kg', N'Nguyên liệu', N'túi', 295000, 0, 4, 3, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT011')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (568, N'N_BOT011', N'Bột chanh 400g/túi', N'Nguyên liệu', N'gói', 120000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT013')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (569, N'N_BOT013', N'Bột chiên xù gói 1kg', N'Nguyên liệu', N'gói', 40000, 0, 1, 1, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT019')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (571, N'N_BOT019', N'Bột khoai tím (túi 500g)', N'Nguyên liệu', N'gói', 206000, 0, 0, 2, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT020')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (572, N'N_BOT020', N'Bột Kim Sơn', N'Nguyên liệu', N'bao', 820000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT021')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (573, N'N_BOT021', N'Bột làm bizonzon Thanh Hóa', N'Nguyên liệu', N'kg', 60000, 0, 19, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT023')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (574, N'N_BOT023', N'Bột mochi túi 1kg', N'Nguyên liệu', N'túi', 130000, 0, 8, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT024')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (575, N'N_BOT024', N'Bột mỳ 999 (bao 25kg)', N'Nguyên liệu', N'bao', 487500, 0, 32, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT025')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (576, N'N_BOT025', N'Bột mỳ Hàn Quốc Cona 1kg', N'Nguyên liệu', N'gói', 100000, 0, 20, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT026')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (577, N'N_BOT026', N'Bột mỳ nguyên cám Bods red mill 2,27kg/túi', N'Nguyên liệu', N'gói', 290000, 0, 20, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT027')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (578, N'N_BOT027', N'Bột năng túi 1kg', N'Nguyên liệu', N'gói', 30000, 0, 15, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT028')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (579, N'N_BOT028', N'Bột nấu chè 1kg', N'Nguyên liệu', N'gói', 47000, 0, 7, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT029')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (580, N'N_BOT029', N'Bột nếp làm bánh dẻo 10kg/túi', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT031')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (581, N'N_BOT031', N'Bột nếp Thái 1kg bizonzon', N'Nguyên liệu', N'gói', 40000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT032')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (582, N'N_BOT032', N'Bột nghệ', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT033')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (583, N'N_BOT033', N'Bột nổi làm bánh AB mauri', N'Nguyên liệu', N'gói', 93000, 0, 15, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT034')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (584, N'N_BOT034', N'Bột nổi UCC Bico hộp 1kg', N'Nguyên liệu', N'hộp', 62000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT035')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (585, N'N_BOT035', N'Bột oreo', N'Nguyên liệu', N'gói', 165000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N-BOT036')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (586, N'N-BOT036', N'Bột rau câu Sóc Vàng', N'Nguyên liệu', N'hộp', 55000, 0, 43, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT037')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (587, N'N_BOT037', N'Bột rong câu giòn - Agar', N'Nguyên liệu', N'gói', 4000, 0, 10, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT041')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (588, N'N_BOT041', N'Bột sư tử 1kg/túi', N'Nguyên liệu', N'gói', 35000, 0, 6, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT042')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (589, N'N_BOT042', N'Bột sữa Almer 941 túi 900g', N'Nguyên liệu', N'túi', 75000, 0, 72, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT043')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (591, N'N_BOT043', N'Bột sữa khoai môn', N'Nguyên liệu', N'gói', 206000, 0, 5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT044')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (592, N'N_BOT044', N'Bột sương sáo 50g/túi', N'Nguyên liệu', N'gói', 38000, 0, 17, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT045')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (593, N'N_BOT045', N'Bột tỏi', N'Nguyên liệu', N'hộp', 22000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT046')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (594, N'N_BOT046', N'Bột trà xanh matcha ĐL 500g', N'Nguyên liệu', N'túi', 375000, 0, 16, 1, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT047')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (595, N'N_BOT047', N'Bột trà xanh Uji Ceremonial 50g', N'Nguyên liệu', N'gói', 688000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT050')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (596, N'N_BOT050', N'Bột trộn sẵn bánh ẩm sô-cô-la túi 5kg', N'Nguyên liệu', N'gói', 106812, 0, 23, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-BOTRED-OV')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (597, N'NL-BOTRED-OV', N'Bột trộn sẵn bánh redvelvet túi 5kg', N'Nguyên liệu', N'gói', 98604, 0, 34, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-BOTTMGUMI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (598, N'NL-BOTTMGUMI', N'Bột trứng muối GUMI EGG túi 1kg', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-BOTXDX-MB')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (599, N'NL-BOTXDX-MB', N'Bột xe đạp xanh / blue2 (25kg)', N'Nguyên liệu', N'kg', 16200, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0274')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (600, N'NL0274', N'Cà chua', N'Nguyên liệu', N'kg', 20000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0162')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (601, N'NL0162', N'Cà phê phố đen', N'Nguyên liệu', N'hộp', 41000, 0, 9, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0155')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (602, N'NL0155', N'Cà ri đen', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0156')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (603, N'NL0156', N'Cam', N'Nguyên liệu', N'kg', 20000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0224')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (604, N'NL0224', N'Cam sấy khô', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0161')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (605, N'NL0161', N'Cam vàng TQ', N'Nguyên liệu', N'kg', 59000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0087')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (606, N'NL0087', N'Chân gà sả ớt tiến vua Sevifood túi 850g', N'Nguyên liệu', N'túi', 90210, 0, 93, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0227')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (607, N'NL0227', N'Chanh tươi', N'Nguyên liệu', N'Kg', 55000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0010')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (608, N'NL0010', N'Chất ổn định bico không màu (20kg)', N'Nguyên liệu', N'xô', 1020000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0158')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (609, N'NL0158', N'Cherry', N'Nguyên liệu', N'kg', 184000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0270')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (611, N'NL0270', N'Cơm dừa', N'Nguyên liệu', N'túi', 95000, 0, 5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_COMTUOI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (612, N'NL_COMTUOI', N'Cốm tươi (khau phạ)', N'Nguyên liệu', N'kg', 200000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-CHNM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (613, N'NL-CHNM', N'Cốm hạt nhiều màu', N'Nguyên liệu', N'hộp', 91000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0124')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (614, N'NL0124', N'Cốt café', N'Nguyên liệu', N'chai', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0183')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (615, N'NL0183', N'Cream Alternative Anchor 1L', N'Nguyên liệu', N'Hộp', 140000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0073')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (616, N'NL0073', N'Cream cheese Dairymont 2Kg', N'Nguyên liệu', N'hộp', 185000, 0, 5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0135')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (617, N'NL0135', N'Creamy (12 hộp)', N'Nguyên liệu', N'hộp', 68500, 0, 63, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0168')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (618, N'NL0168', N'Củ hành khô', N'Nguyên liệu', N'kg', 50000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0222')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (619, N'NL0222', N'Củ tỏi', N'Nguyên liệu', N'kg', 60000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0178')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (620, N'NL0178', N'Cùi bưởi 1kg', N'Nguyên liệu', N'túi', 70000, 0, 18, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0198')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (621, N'NL0198', N'Đá hút chân không lẻ', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0288')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (622, N'NL0288', N'Đá viên', N'Nguyên liệu', N'túi', 9000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0024')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (624, N'NL0024', N'Dấm trắng 500ml', N'Nguyên liệu', N'chai', 7500, 0, 13, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0148')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (626, N'NL0148', N'Đậu đỏ 3kg', N'Nguyên liệu', N'túi', 180000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0204')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (627, N'NL0204', N'Đậu đỏ lon', N'Nguyên liệu', N'hộp', 58000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0244')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (628, N'NL0244', N'Dầu hào', N'Nguyên liệu', N'chai', 63000, 0, 14, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0025')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (629, N'NL0025', N'Dầu hướng dương loại 1L', N'Nguyên liệu', N'l', 53005, 0, 26, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0122')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (631, N'NL0122', N'Dầu tê', N'Nguyên liệu', N'Chai', 47000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0150')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (634, N'NL0150', N'Dừa sấy vụn', N'Nguyên liệu', N'Túi', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0056')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (635, N'NL0056', N'Đường đen nữ hoàng Biên Hòa', N'Nguyên liệu', N'Kg', 48652, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0009')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (636, N'NL0009', N'Đường phèn', N'Nguyên liệu', N'kg', 300000, 0, 61, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0014')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (637, N'NL0014', N'Đường thốt nốt túi 1kg', N'Nguyên liệu', N'Túi', 45000, 0, 42, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0218')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (638, N'NL0218', N'Đường thốt nốt túi 2,5kg', N'Nguyên liệu', N'Túi', 44000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0106')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (639, N'NL0106', N'Đường trắng 50kg/bao', N'Nguyên liệu', N'Kg', 19500, 0, 1300, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0029')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (640, N'NL0029', N'Đường xay (túi 1kg)', N'Nguyên liệu', N'Túi', 38000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0210')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (641, N'NL0210', N'Falu mật ong can 2 lít', N'Nguyên liệu', N'Can', 222000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0302')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (642, N'NL0302', N'Gan gà', N'Nguyên liệu', N'Kg', 20000, 0, 8, 0, N'GÀ CHỢ TỰ KHOÁT-0377149958', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0126')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (643, N'NL0126', N'Gelatin bột LHP (1kg)', N'Nguyên liệu', N'Kg', 285000, 0, 11, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0026')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (644, N'NL0026', N'Gelatin lá loại 1kg', N'Nguyên liệu', N'Hộp', 660000, 0, 5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0250')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (645, N'NL0250', N'Gia vị gà', N'Nguyên liệu', N'Gói', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0249')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (646, N'NL0249', N'Gia vị phở bò', N'Nguyên liệu', N'Gói', 0, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0229')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (647, N'NL0229', N'Hành lá', N'Nguyên liệu', N'Kg', 40000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0035')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (648, N'NL0035', N'Hạnh nhân bột', N'Nguyên liệu', N'Kg', 255000, 0, 11.34, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0096')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (650, N'NL0096', N'Hạnh nhân lát (thùng 11,34)', N'Nguyên liệu', N'Thùng', 278000, 0, 22.68, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0166')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (651, N'NL0166', N'Hành phi lọ', N'Nguyên liệu', N'Lọ', 50000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0044')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (652, N'NL0044', N'Hành phi túi 1kg', N'Nguyên liệu', N'Túi', 88000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0185')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (653, N'NL0185', N'Hành tây', N'Nguyên liệu', N'Kg', 8000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0140')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (654, N'NL0140', N'Hạt bí xanh', N'Nguyên liệu', N'Kg', 130000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0226')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (655, N'NL0226', N'Hạt chia', N'Nguyên liệu', N'Túi', 60000, 0, 9, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0095')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (656, N'NL0095', N'Hạt dẻ cười túi 500g', N'Nguyên liệu', N'Túi', 180000, 0, 21, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0114')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (657, N'NL0114', N'Hạt điều', N'Nguyên liệu', N'Kg', 350000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0167')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (658, N'NL0167', N'Hạt tiêu', N'Nguyên liệu', N'Kg', 200000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0265')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (659, N'NL0265', N'Hồng trà Shan tuyết Peso', N'Nguyên liệu', N'Gói', 154000, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0285')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (660, N'NL0285', N'Hồng trà thượng hạng việt tuấn', N'Nguyên liệu', N'Túi', 103000, 0, 11, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0217')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (661, N'NL0217', N'Húng lìu', N'Nguyên liệu', N'Gói', 150000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0298')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (662, N'NL0298', N'Hương vani LAPATELIERE', N'Nguyên liệu', N'Chai', 390000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0299')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (663, N'NL0299', N'Hương vani LAWAIGDA', N'Nguyên liệu', N'Chai', 260000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0262')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (664, N'NL0262', N'Kem lá dứa phomai Nhất Hương', N'Nguyên liệu', N'Hộp', 47000, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0268')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (665, N'NL0268', N'Kem làm bánh vị mặn Rich''s', N'Nguyên liệu', N'Hộp', 89298, 0, 13, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-KEMSCL-OV')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (666, N'NL-KEMSCL-OV', N'Kem socola', N'Nguyên liệu', N'Thùng', 874000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0272')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (667, N'NL0272', N'Kem sữa Meadow Fresh 1L NZ', N'Nguyên liệu', N'Lít', 145800, 0, 12, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-KST36%')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (668, N'NL-KST36%', N'Kem sữa Tatua 36% 1L NZ Sky', N'Nguyên liệu', N'Lít', 160000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0074')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (669, N'NL0074', N'Kem sữa Tatua 36% 1LNZ HL', N'Nguyên liệu', N'Lít', 124500, 0, 72, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0084')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (670, N'NL0084', N'Kem sữa Whip & Cook ArlaPro', N'Nguyên liệu', N'Hộp', 128200, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0060')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (671, N'NL0060', N'Kem trứng 1kg', N'Nguyên liệu', N'Hộp', 70000, 0, 11, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0111')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (672, N'NL0111', N'Kem vivo (12 hộp)', N'Nguyên liệu', N'Thùng', 69000, 0, 212, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-KEMRICH-OV')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (673, N'NL-KEMRICH-OV', N'Kem béo thực vật RICH''s 454g', N'Nguyên liệu', N'Hộp', 31030, 0, 123, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0160')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (674, N'NL0160', N'Kẹo lạc', N'Nguyên liệu', N'Kg', 60000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0078')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (675, N'NL0078', N'Kẹo marshmallow trắng 500g', N'Nguyên liệu', N'Túi', 35000, 0, 9, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0059')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (676, N'NL0059', N'Khô gà', N'Nguyên liệu', N'Kg', 180000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0186')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (677, N'NL0186', N'Khoai lang', N'Nguyên liệu', N'Kg', 37000, 0, 1.6, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0216')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (678, N'NL0216', N'Lá dứa', N'Nguyên liệu', N'Kg', 60000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0175')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (679, N'NL0175', N'Lá oregano 100g', N'Nguyên liệu', N'Kg', 112000, 0, 3.25, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0147')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (680, N'NL0147', N'Lava nhân trứng muối chảy túi 3kg NTT', N'Nguyên liệu', N'Túi', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0188')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (681, N'NL0188', N'Lợn xay', N'Nguyên liệu', N'Kg', 120000, 0, 2.2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0121')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (682, N'NL0121', N'Lòng trắng trứng can 10Kg', N'Nguyên liệu', N'Kg', 220000, 0, 6.5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0258')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (683, N'NL0258', N'Lục trà nhài Leader', N'Nguyên liệu', N'Túi', 130000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0068')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (684, N'NL0068', N'Macca', N'Nguyên liệu', N'Bao', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0181')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (685, N'NL0181', N'Mắm tép', N'Nguyên liệu', N'Chai', 50000, 0, 6, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0134')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (686, N'NL0134', N'Mascarpone', N'Nguyên liệu', N'Gói', 269500, 0, 7, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0194')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (687, N'NL0194', N'Màu lỏng đỏ', N'Nguyên liệu', N'Kg', 146000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0193')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (688, N'NL0193', N'Màu lỏng nâu', N'Nguyên liệu', N'Kg', 146000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0197')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (689, N'NL0197', N'Màu lỏng vàng', N'Nguyên liệu', N'Kg', 157000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0195')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (690, N'NL0195', N'Màu lỏng xanh dương', N'Nguyên liệu', N'Kg', 146000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0196')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (691, N'NL0196', N'Màu lỏng xanh lá', N'Nguyên liệu', N'Kg', 45000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0089')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (692, N'NL0089', N'Màu nước đồng tiến Ivory', N'Nguyên liệu', N'Chai', 45000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0090')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (693, N'NL0090', N'Màu nước đồng tiến vàng tươi 600g', N'Nguyên liệu', N'Chai', 113000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0301')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (694, N'NL0301', N'Màu trắng SENSIENT', N'Nguyên liệu', N'Lọ', 176000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0283')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (695, N'NL0283', N'Mè xay 500g', N'Nguyên liệu', N'Kg', 200000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0023')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (696, N'NL0023', N'Men ông đầu bếp vàng (men ngọt)', N'Nguyên liệu', N'Túi', 64500, 0, 16, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0058')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (697, N'NL0058', N'Mì chính túi 1.8kg', N'Nguyên liệu', N'Kg', 55000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0125')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (698, N'NL0125', N'Mì chính túi 1 kg', N'Nguyên liệu', N'Túi', 115000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0191')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (699, N'NL0191', N'Miến', N'Nguyên liệu', N'Túi', 50000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0172')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (700, N'NL0172', N'Mít Thái', N'Nguyên liệu', N'Khay', 60000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0304')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (701, N'NL0304', N'Mỡ', N'Nguyên liệu', N'Kg', 60000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0109')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (702, N'NL0109', N'Mỡ đường', N'Nguyên liệu', N'Kg', 0, 0, 24, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0189')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (703, N'NL0189', N'Mọc', N'Nguyên liệu', N'Kg', 125000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0065')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (704, N'NL0065', N'Mochi miếng vị dâu', N'Nguyên liệu', N'Túi', 28000, 0, 17, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0066')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (705, N'NL0066', N'Mochi miếng vị dừa', N'Nguyên liệu', N'Túi', 28000, 0, 19, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0294')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (706, N'NL0294', N'Monin vải', N'Nguyên liệu', N'Chai', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PL-PMBAO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (707, N'PL-PMBAO', N'Phomai Mozzarella bào 1kg', N'Nguyên liệu', N'Túi', 178000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0278')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (708, N'NL0278', N'Mozzarella bào Argentina 1kg', N'Nguyên liệu', N'Kg', 148150, 0, 249, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0037')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (709, N'NL0037', N'Muối sấy Ngọc Yến 250g/túi', N'Nguyên liệu', N'Túi', 0, 0, 9, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0036')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (710, N'NL0036', N'Muối tinh 500gr', N'Nguyên liệu', N'Túi', 5000, 0, 68, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0082')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (711, N'NL0082', N'Mứt Berino chanh dây (1kg)', N'Nguyên liệu', N'Lọ', 94000, 0, 5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0083')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (712, N'NL0083', N'Mứt Berino dâu tây (1kg)', N'Nguyên liệu', N'Lọ', 77000, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0067')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (713, N'NL0067', N'Mứt nhân chuối nhãn vàng (5kg)', N'Nguyên liệu', N'Xô', 515000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0132')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (714, N'NL0132', N'Mứt xác việt quất Berrino 950G', N'Nguyên liệu', N'Hộp', 105000, 0, 8, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0295')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (715, N'NL0295', N'Mứt xoài TQ', N'Nguyên liệu', N'Hũ', 169000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0077')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (716, N'NL0077', N'Nấm hương', N'Nguyên liệu', N'Kg', 250000, 0, 1.5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0241')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (717, N'NL0241', N'Ngũ vị hương', N'Nguyên liệu', N'Hộp', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0103')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (718, N'NL0103', N'Nhân cốm tươi xào', N'Nguyên liệu', N'Kg', 240000, 0, 20, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0104')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (720, N'NL0104', N'Nhân dừa non', N'Nguyên liệu', N'Kg', 180000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0045')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (721, N'NL0045', N'Nhân hạt dẻ túi 1kg', N'Nguyên liệu', N'Túi', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0064')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (722, N'NL0064', N'Nhân kem vị sầu riêng', N'Nguyên liệu', N'Gói', 83000, 0, 22, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0063')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (723, N'NL0063', N'Nhân kem vị socola', N'Nguyên liệu', N'Túi', 83000, 0, 12, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0062')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (724, N'NL0062', N'Nhân kem vị trứng muối', N'Nguyên liệu', N'Gói', 91000, 0, 30, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0070')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (725, N'NL0070', N'Nhân phomai', N'Nguyên liệu', N'Túi', 83000, 0, 5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0151')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (726, N'NL0151', N'Nhân phomai cháy', N'Nguyên liệu', N'Túi', 82000, 0, 12, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0152')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (727, N'NL0152', N'Nhân sữa chua', N'Nguyên liệu', N'Túi', 83000, 0, 12, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0174')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (728, N'NL0174', N'Nhân trứng dẻo NTT', N'Nguyên liệu', N'Kg', 250000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0271')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (729, N'NL0271', N'Nho đen không hạt Úc', N'Nguyên liệu', N'Kg', 125000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0033')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (730, N'NL0033', N'Nho khô', N'Nguyên liệu', N'Kg', 115000, 0, 14.5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0076')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (731, N'NL0076', N'Nước cốt dừa (thùng 12 hộp)', N'Nguyên liệu', N'Hộp', 70000, 0, 24, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0057')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (732, N'NL0057', N'Nước mắm chai 1.2l', N'Nguyên liệu', N'Chai', 62000, 0, 8, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0075')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (733, N'NL0075', N'Nước mắm chai 750ml', N'Nguyên liệu', N'Chai', 55000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0200')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (734, N'NL0200', N'Nước nấu tàu hũ', N'Nguyên liệu', N'Túi', 45000, 0, 14, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0225')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (735, N'NL0225', N'Nước phủ bóng', N'Nguyên liệu', N'Xô', 997920, 0, 5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0048')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (736, N'NL0048', N'Nước quét mặt bánh can 2L', N'Nguyên liệu', N'Can', 250000, 0, 8, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0245')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (737, N'NL0245', N'Nước tương magi', N'Nguyên liệu', N'Chai', 35000, 0, 5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0296')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (738, N'NL0296', N'Oliu đen olive', N'Nguyên liệu', N'Hũ', 300000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0232')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (739, N'NL0232', N'Ớt bột Hàn Quốc', N'Nguyên liệu', N'Túi', 65000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0252')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (740, N'NL0252', N'Ớt khô', N'Nguyên liệu', N'Kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0248')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (741, N'NL0248', N'Ớt sừng', N'Nguyên liệu', N'Kg', 50000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0123')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (742, N'NL0123', N'Ớt trưng dầu', N'Nguyên liệu', N'Chai', 65000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0235')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (743, N'NL0235', N'Phomai Morazela chưa bào 5kg', N'Nguyên liệu', N'Kg', 170000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0246')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (744, N'NL0246', N'Phomai con bò cười vinamil', N'Nguyên liệu', N'Hộp', 33900, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0136')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (745, N'NL0136', N'Phomai lát', N'Nguyên liệu', N'Kg', 260000, 0, 7, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0003')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (746, N'NL0003', N'Phụ gia bánh mỳ ngọt ibis', N'Nguyên liệu', N'Túi', 46000, 0, 17, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0142')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (747, N'NL0142', N'Phụ gia bánh mỳ Unipan (1kg)', N'Nguyên liệu', N'Kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0133')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (748, N'NL0133', N'Quả anh đào không cuống', N'Nguyên liệu', N'Túi', 210000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0207')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (749, N'NL0207', N'Quả bơ', N'Nguyên liệu', N'Kg', 105000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0247')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (750, N'NL0247', N'Quả quất', N'Nguyên liệu', N'Kg', 30000, 0, 0.5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0032')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (751, N'NL0032', N'Quả việt quất khô', N'Nguyên liệu', N'Kg', 180000, 0, 26.02, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0149')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (752, N'NL0149', N'Quế', N'Nguyên liệu', N'Kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0307')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (753, N'NL0307', N'Riềng', N'Nguyên liệu', N'Kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0042')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (754, N'NL0042', N'Ruốc gà cay túi 1kg', N'Nguyên liệu', N'Túi', 250000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0043')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (755, N'NL0043', N'Ruốc rong biển túi 1kg', N'Nguyên liệu', N'Túi', 269000, 0, 7, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0180')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (756, N'NL0180', N'Ruốc trắng', N'Nguyên liệu', N'Kg', 550000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0277')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (757, N'NL0277', N'Rượu rum nội', N'Nguyên liệu', N'Chai', 130000, 0, 10, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-SAU-MHK')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (758, N'NL-SAU-MHK', N'Sầu riêng nguyên chất 1KG/TÚI', N'Nguyên liệu', N'Túi', 150000, 0, 41, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-OIBODUO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (759, N'NL-OIBODUO', N'Sauce ổi BODUO hũ 1kg', N'Nguyên liệu', N'Chai', 148000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-SDOTD')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (760, N'NL-SDOTD', N'Sữa đặc ông thọ đỏ 1284g', N'Nguyên liệu', N'Hộp', 75924, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-SENHUE')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (761, N'NL-SENHUE', N'Sen tươi', N'Nguyên liệu', N'Kg', 198000, 0, 24, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0130')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (762, N'NL0130', N'Sinh tố Berrino chanh dây 1L', N'Nguyên liệu', N'Chai', 108000, 0, 9, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0131')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (763, N'NL0131', N'Sinh tố Berrino dâu tây 1L', N'Nguyên liệu', N'Chai', 93000, 0, 7, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0286')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (764, N'NL0286', N'Sinh tố dâu osterberg', N'Nguyên liệu', N'Chai', 109000, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0293')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (765, N'NL0293', N'Sinh tố mãng cầu goldenfarm', N'Nguyên liệu', N'Chai', 125000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0292')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (766, N'NL0292', N'Sinh tố trái cây maomao', N'Nguyên liệu', N'Chai', 154000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0239')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (767, N'NL0239', N'Sinh tố việt quất', N'Nguyên liệu', N'Chai', 120000, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0238')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (768, N'NL0238', N'Sinh tố xoài Osterber', N'Nguyên liệu', N'Chai', 140000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0291')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (769, N'NL0291', N'Siro đào dingfong', N'Nguyên liệu', N'Chai', 81000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0259')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (770, N'NL0259', N'Siro Maulin vị dưa lưới 2,5kg', N'Nguyên liệu', N'Chai', 225000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0263')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (771, N'NL0263', N'Siro monin lá dứa 700ml', N'Nguyên liệu', N'Chai', 230000, 0, 5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0290')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (772, N'NL0290', N'Siro xoài dingfong', N'Nguyên liệu', N'Chai', 82000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0127')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (773, N'NL0127', N'Socola chíp trắng W13C (2.5kg)', N'Nguyên liệu', N'Kg', 144612, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0021')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (774, N'NL0021', N'Socola compound hạt đen 1kg van hauten', N'Nguyên liệu', N'Túi', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0017')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (775, N'NL0017', N'Socola dâu túi 1kg puratos carat', N'Nguyên liệu', N'Túi', 160000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0117')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (776, N'NL0117', N'Socola đen D013 thanh 2kg', N'Nguyên liệu', N'Kg', 133704, 0, 10, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0018')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (777, N'NL0018', N'Socola GanaFarm trắng CW005 (1kg)', N'Nguyên liệu', N'Túi', 96000, 0, -1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0027')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (778, N'NL0027', N'Socola hạt chíp đen D07C (2,5kg)', N'Nguyên liệu', N'Hộp', 142452, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0019')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (779, N'NL0019', N'Socola hương cam loại 1kg puratos carat', N'Nguyên liệu', N'Túi', 160000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0020')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (780, N'NL0020', N'Socola hương việt quất loại 1kg', N'Nguyên liệu', N'Túi', 160000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0022')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (781, N'NL0022', N'Socola nguyên chất trắng 1kg grand-place puratos', N'Nguyên liệu', N'Túi', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0016')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (782, N'NL0016', N'Socola nút grand-place puratos túi 1kg', N'Nguyên liệu', N'Túi', 430000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0128')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (783, N'NL0128', N'Socola sệt nâu M081 (4kg/xô)', N'Nguyên liệu', N'Kg', 144720, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0129')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (784, N'NL0129', N'Socola sệt trắng W082 (4kg/xô)', N'Nguyên liệu', N'Kg', 135540, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0047')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (785, N'NL0047', N'Sốt mayonnaise xô 3kg', N'Nguyên liệu', N'Xô', 225000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0071')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (786, N'NL0071', N'Sốt salat bánh mỳ ngọt', N'Nguyên liệu', N'Kg', 76500, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0041')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (787, N'NL0041', N'Sốt ướp xá xíu', N'Nguyên liệu', N'Lọ', 9000, 0, 40, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0069')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (788, N'NL0069', N'Sữa bột', N'Nguyên liệu', N'Bao', 125000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-SCA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (789, N'NL-SCA', N'Sữa chua ăn', N'Nguyên liệu', N'Hộp', 5750, 0, 20, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-SDNSPN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (790, N'NL-SDNSPN', N'Sữa đặc ngôi sao phương nam', N'Nguyên liệu', N'Hộp', 70000, 0, 6, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0002')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (791, N'NL0002', N'Sữa tươi H-milk tiệt trùng nguyên kem 3.5% (12h/thùng)', N'Nguyên liệu', N'Hộp', 24500, 0, 60, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-SUATUOI-KHS')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (792, N'NL-SUATUOI-KHS', N'Sữa tươi faciate (thùng 12H)', N'Nguyên liệu', N'Thùng', 335000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0289')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (793, N'NL0289', N'Sunup ổi', N'Nguyên liệu', N'Chai', 130000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0264')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (794, N'NL0264', N'Sunup vải', N'Nguyên liệu', N'Chai', 120000, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0139')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (795, N'NL0139', N'Táo đỏ', N'Nguyên liệu', N'Kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0280')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (796, N'NL0280', N'Táo đỏ 1,2kg', N'Nguyên liệu', N'Kg', 200000, 0, 7, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0038')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (797, N'NL0038', N'Thạch dừa thô loại 1kg/túi', N'Nguyên liệu', N'Túi', 79000, 0, 22, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0205')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (798, N'NL0205', N'Thạch nổ củ năng', N'Nguyên liệu', N'Lon', 63000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0201')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (799, N'NL0201', N'Thốt nốt rim', N'Nguyên liệu', N'Túi', 140000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0050')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (800, N'NL0050', N'Tinh bột khoai tây (400g)', N'Nguyên liệu', N'Túi', 47000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0163')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (801, N'NL0163', N'Tinh bột sắn 25kg', N'Nguyên liệu', N'Bao', 1300000, 0, 25, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0169')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (802, N'NL0169', N'Tinh chất lá dứa 6 lọ/lốc', N'Nguyên liệu', N'Lốc', 18000, 0, 93, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0221')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (803, N'NL0221', N'Tỏi bóc sẵn', N'Nguyên liệu', N'Kg', 45000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0011')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (804, N'NL0011', N'Top pop Bơ BOS lỏng 18kg HN', N'Nguyên liệu', N'Can', 1080000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0266')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (805, N'NL0266', N'Trà ô long xanh queen', N'Nguyên liệu', N'Gói', 374000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0256')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (806, N'NL0256', N'Trà Olong nhài việt tuấn', N'Nguyên liệu', N'Túi', 167000, 0, 10, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0253')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (807, N'NL0253', N'Trà thái xanh', N'Nguyên liệu', N'Túi', 68000, 0, 9, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0257')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (808, N'NL0257', N'Trà xanh nhài việt tuấn', N'Nguyên liệu', N'Túi', 143000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0105')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (809, N'NL0105', N'Trân châu đen 3q', N'Nguyên liệu', N'Túi', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0219')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (810, N'NL0219', N'Trân châu hoàng kim', N'Nguyên liệu', N'Túi', 43000, 0, 5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0202')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (811, N'NL0202', N'Trân châu sợi Toco', N'Nguyên liệu', N'Gói', 45000, 0, 14, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0209')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (812, N'NL0209', N'Trân châu trắng 3Q', N'Nguyên liệu', N'Túi', 58000, 0, 32, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0276')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (813, N'NL0276', N'Trứng cút', N'Nguyên liệu', N'Quả', 875, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0107')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (814, N'NL0107', N'Trứng muối 30q/khay', N'Nguyên liệu', N'Khay', 195000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0236')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (815, N'NL0236', N'Trứng muối vụn', N'Nguyên liệu', N'Túi', 280000, 0, 10, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0080')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (816, N'NL0080', N'Trứng muối (100q/túi)', N'Nguyên liệu', N'Túi', 370000, 0, 16, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0119')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (817, N'NL0119', N'Tương cà (can 2L)', N'Nguyên liệu', N'Can', 60000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0187')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (818, N'NL0187', N'Ức gà', N'Nguyên liệu', N'Kg', 70000, 0, 0, 0, N'NGA CHỢ TỰ KHOÁT- 0377143958', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0157')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (819, N'NL0157', N'Việt quất tươi (12h/khay)', N'Nguyên liệu', N'Khay', 299000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0091')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (820, N'NL0091', N'Vụn dừa sấy', N'Nguyên liệu', N'Túi', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0165')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (821, N'NL0165', N'Vừng lạc', N'Nguyên liệu', N'Lọ', 45000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0031')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (822, N'NL0031', N'Vừng trắng', N'Nguyên liệu', N'Kg', 70000, 0, 15, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0034')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (823, N'NL0034', N'Xả khô', N'Nguyên liệu', N'Kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0275')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (824, N'NL0275', N'Xà lách', N'Nguyên liệu', N'Kg', 34000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0228')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (825, N'NL0228', N'Xả tươi', N'Nguyên liệu', N'Kg', 20000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0297')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (826, N'NL0297', N'Xì dầu đặc biệt LEEKUMKEE (Can 2l)', N'Nguyên liệu', N'Can', 160000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0206')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (827, N'NL0206', N'Xoài cát chu', N'Nguyên liệu', N'Kg', 17000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0115')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (828, N'NL0115', N'Xoài sấy dẻo', N'Nguyên liệu', N'Kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0255')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (829, N'NL0255', N'Xôi lá nếp cốt dừa', N'Nguyên liệu', N'Túi', 58000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0055')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (830, N'NL0055', N'Hình socola bé trai gái', N'Nguyên liệu', N'Hộp', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0053')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (831, N'NL0053', N'Hình socola chúc mừng năm mới', N'Nguyên liệu', N'Hộp', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0054')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (832, N'NL0054', N'Hình socola gấu dâu', N'Nguyên liệu', N'Hộp', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0052')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (833, N'NL0052', N'Hình socola mừng thọ', N'Nguyên liệu', N'Hộp', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL0051')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (834, N'NL0051', N'Hình socola ông bà', N'Nguyên liệu', N'Hộp', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL-BDDV5')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (835, N'VL-BDDV5', N'Băng dính hàng dễ vỡ', N'Vật liệu', N'cuộn', 16000, 0, 119, 5, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL-BD5')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (836, N'VL-BD5', N'Băng dính trong cuộn to', N'Vật liệu', N'cuộn', 25000, 0, 39, 5, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL-BD2')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (837, N'VL-BD2', N'Băng dính trong nhỏ 2cm', N'Vật liệu', N'cuộn', 1700, 0, 7, 1, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL-BG8')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (838, N'VL-BG8', N'Bát giấy nâu size 8 làm maccaron', N'Nguyên liệu', N'cọc', 25000, 0, 1, 1, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL-BG10')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (839, N'VL-BG10', N'Bát giấy trắng size 10 làm bánh bao', N'Vật liệu', N'cọc', 32960, 0, 12, 1, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0160')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (840, N'VL0160', N'Bìa 35x45', N'Vật liệu', N'quả/cái', 8000, 0, 160, 5, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-BODAO-TANH')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (841, N'PK-BODAO-TANH', N'Bộ dao đĩa', N'Vật liệu', N'quả/cái', 3800, 0, 350, 100, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL-BODCCBS5-SKY')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (842, N'VL-BODCCBS5-SKY', N'Bộ dụng cụ cơ bản 5 set', N'Vật liệu', N'Bộ', 91000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL-BOHOKKAIDO-LN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (843, N'VL-BOHOKKAIDO-LN', N'Bơ hokkaido Vivo (10 kg/kiện)', N'Vật liệu', N'thùng', 950000, 0, 0, 2, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL-BONAMKIEU-SKY')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (844, N'VL-BONAMKIEU-SKY', N'Bơ Nam Kiều', N'Vật liệu', N'thùng', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-BUTBI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (845, N'PK-BUTBI', N'Bút bi', N'Vật liệu', N'Cái', 5000, 0, 25, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-BUTDA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (846, N'PK-BUTDA', N'Bút lông đen bé', N'Vật liệu', N'quả/cái', 15000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-BUTDADAU')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (847, N'PK-BUTDADAU', N'Bút lông xanh', N'Vật liệu', N'quả/cái', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0206')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (848, N'VL0206', N'Can nước rửa bát', N'Nguyên liệu', N'Can', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0123')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (849, N'VL0123', N'Chai đựng thạch dừa PET 500ml cổ 42 (dây 95c)', N'Vật liệu', N'quả/cái', 247000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0121')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (850, N'VL0121', N'Chai sữa chua uống (dây 240c)', N'Vật liệu', N'quả/cái', 1840, 0, 240, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0061')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (851, N'VL0061', N'Cốc cupcake size to', N'Vật liệu', N'quả/cái', 18000, 0, 9, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0132')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (852, N'VL0132', N'Cốc đựng set 4/6', N'Vật liệu', N'quả/cái', 2000, 0, 350, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0058')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (854, N'VL0058', N'Cốc giấy cupcake nhỏ', N'Vật liệu', N'cọc', 392, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0096')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (855, N'VL0096', N'Cốc giấy hoa nắp đen', N'Vật liệu', N'Chiếc', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0056')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (858, N'VL0056', N'Cốc giấy vuông', N'Vật liệu', N'Chiếc', 1680, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0161')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (859, N'VL0161', N'Cồn 70 độ', N'Vật liệu', N'chai', 38000, 0, 23, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0187')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (860, N'VL0187', N'Dây kẽm vàng buộc nơ', N'Vật liệu', N'Cuộn', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0183')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (861, N'VL0183', N'Dây thừng', N'Vật liệu', N'Cuộn', 32000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0107')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (862, N'VL0107', N'Đế chống tầng trắng size 12', N'Vật liệu', N'Chiếc', 8000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0108')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (863, N'VL0108', N'Đế chống tầng trắng size 16', N'Vật liệu', N'Chiếc', 10000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0109')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (864, N'VL0109', N'Đế chống tầng trắng size 20', N'Vật liệu', N'Chiếc', 13000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0110')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (865, N'VL0110', N'Đế chống tầng trong suốt size 16', N'Vật liệu', N'Chiếc', 8000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0213')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (866, N'VL0213', N'Đế đựng bánh lạnh size 9x9', N'Vật liệu', N'quả/cái', 1250, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0011')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (867, N'VL0011', N'Đế ép chữ nhật 30x40cm', N'Vật liệu', N'quả/cái', 4200, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0007')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (868, N'VL0007', N'Đế ngọc 24cm', N'Vật liệu', N'quả/cái', 1800, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0008')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (869, N'VL0008', N'Đế ngọc 26cm', N'Vật liệu', N'quả/cái', 2700, 0, 1297, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0009')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (870, N'VL0009', N'Đế ngọc 30cm', N'Vật liệu', N'Cái', 2400, 0, 50, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0010')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (871, N'VL0010', N'Đế ngọc 32cm', N'Vật liệu', N'Cái', 2700, 0, 150, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0128')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (872, N'VL0128', N'Đế trắng size 30', N'Vật liệu', N'Cái', 25000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0159')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (873, N'VL0159', N'Đế tròn size 20', N'Vật liệu', N'Cái', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0158')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (874, N'VL0158', N'Đế tròn size 26', N'Vật liệu', N'Cái', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0157')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (875, N'VL0157', N'Đế tròn size 28', N'Vật liệu', N'Cái', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0156')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (876, N'VL0156', N'Đế tròn size 35', N'Vật liệu', N'Cái', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0034')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (877, N'VL0034', N'Dĩa lẻ', N'Vật liệu', N'Túi', 80000, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0033')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (878, N'VL0033', N'Đĩa lẻ', N'Vật liệu', N'Túi', 28000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0143')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (879, N'VL0143', N'Găng tay nilong hộp', N'Vật liệu', N'Hộp', 17000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0153')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (880, N'VL0153', N'Găng tay nilong túi', N'Vật liệu', N'Túi', 5000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0178')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (881, N'VL0178', N'Ghim', N'Vật liệu', N'Hộp', 50000, 0, 16, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0165')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (882, N'VL0165', N'Giấy ăn to thùng 36g', N'Vật liệu', N'Gói', 15000, 0, 15, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0120')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (883, N'VL0120', N'Giấy ăn nhỏ thùng 20g', N'Vật liệu', N'Gói', 9000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0006')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (884, N'VL0006', N'Giấy decal nhiệt 100x75', N'Vật liệu', N'Cuộn', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0204')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (885, N'VL0204', N'Giấy gạo', N'Vật liệu', N'Tệp', 30000, 0, 6, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0004')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (886, N'VL0004', N'Giấy in date cookie', N'Vật liệu', N'Cuộn', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0005')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (887, N'VL0005', N'Giấy in date trà cam quế', N'Vật liệu', N'Cuộn', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0001')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (888, N'VL0001', N'Giấy in hóa đơn', N'Vật liệu', N'Cuộn', 6900, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0012')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (889, N'VL0012', N'Giấy lót khuôn', N'Vật liệu', N'Tập', 195000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0145')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (890, N'VL0145', N'Giấy vệ sinh (bịch 10 cuộn)', N'Vật liệu', N'Bịch', 110000, 0, 6, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0221')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (891, N'VL0221', N'Gum nặn bánh 600g', N'Vật liệu', N'Túi', 115000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0049')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (892, N'VL0049', N'Hộp 55C', N'Vật liệu', N'Chiếc', 530, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0072')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (893, N'VL0072', N'Hộp 6 ô đựng set 6 bánh trung thu', N'Vật liệu', N'Chiếc', 1850, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0098')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (894, N'VL0098', N'Hộp bánh trung thu đế đen nắp trong', N'Vật liệu', N'Chiếc', 1900, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0065')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (895, N'VL0065', N'Hộp bông lan ruốc ĐL', N'Vật liệu', N'Dây', 37500, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0063')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (896, N'VL0063', N'Hộp cá trung thu', N'Vật liệu', N'Chiếc', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0079')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (897, N'VL0079', N'Hộp caramen nhỏ', N'Vật liệu', N'Chiếc', 450, 0, 2700, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0090')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (898, N'VL0090', N'Hộp caramen to', N'Vật liệu', N'Chiếc', 800, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0025')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (899, N'VL0025', N'Hộp chuối (dây 100c)', N'Vật liệu', N'Dây', 157000, 0, 9, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0179')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (900, N'VL0179', N'Hộp crep trà xanh scl (DÂY 50C)', N'Vật liệu', N'Dây', 3800, 0, 50, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0219')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (901, N'VL0219', N'Hộp cửa sổ w1600 giấy crap', N'Vật liệu', N'Cái', 4200, 0, 50, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0218')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (902, N'VL0218', N'Hộp cửa sổ w700 giấy crap', N'Vật liệu', N'Cái', 2600, 0, 49, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0142')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (903, N'VL0142', N'Hộp đế nâu đựng RBB', N'Vật liệu', N'Cái', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0045')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (904, N'VL0045', N'Hộp đựng bánh bao 4c DP-53 (dây 50c)', N'Vật liệu', N'Chiếc', 1150, 0, 7, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0103')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (905, N'VL0103', N'Hộp đựng bánh bao nướng Quảng Đông (dây 50c)', N'Vật liệu', N'Dây', 185000, 0, 6, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0104')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (906, N'VL0104', N'Hộp đựng bánh bò to (dây 50)', N'Vật liệu', N'Dây', 90000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0102')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (907, N'VL0102', N'Hộp đựng bánh cuộn (dây 50c)', N'Vật liệu', N'Chiếc', 85000, 0, 7, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0082')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (908, N'VL0082', N'Hộp đựng bánh dẻo nhỏ', N'Vật liệu', N'Chiếc', 8000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0081')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (909, N'VL0081', N'Hộp đựng bánh dẻo to', N'Vật liệu', N'Chiếc', 10000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0105')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (910, N'VL0105', N'Hộp đựng bánh mì/bánh bao', N'Vật liệu', N'Chiếc', 2200, 0, 300, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0147')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (911, N'VL0147', N'Hộp đựng bánh thỏi vàng (dây 50c)', N'Vật liệu', N'Chiếc', 160000, 0, 16, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0043')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (912, N'VL0043', N'Hộp đựng bánh trung thu set 6 vị', N'Vật liệu', N'Chiếc', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'H-XY581')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (913, N'H-XY581', N'Hộp đựng cupcake hq/kem mặn', N'Vật liệu', N'Chiếc', 1500, 0, 250, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0037')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (914, N'VL0037', N'Hộp đựng Cupcake vani H17 (dây 100c)', N'Vật liệu', N'Cái', 50000, 0, 12, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0046')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (915, N'VL0046', N'Hộp đựng gato cắt C55 (dây 100c)', N'Vật liệu', N'Dây', 40000, 0, 7, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0076')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (916, N'VL0076', N'Hộp đựng maccaron đế nâu', N'Vật liệu', N'Chiếc', 2000, 0, 300, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0073')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (917, N'VL0073', N'Hộp đựng mochi 4 viên đế đen', N'Vật liệu', N'Chiếc', 3300, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0091')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (918, N'VL0091', N'Hộp đựng nước canh', N'Vật liệu', N'Chiếc', 600, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0074')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (919, N'VL0074', N'Hộp đựng ốc kem', N'Vật liệu', N'Dây', 50000, 0, 6, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0083')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (920, N'VL0083', N'Hộp đựng set hoa quả sấy dẻo JLH999', N'Vật liệu', N'Chiếc', 7500, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0047')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (921, N'VL0047', N'Hộp đựng su kem H50 (dây 100c)', N'Vật liệu', N'Chiếc', 450, 0, 6, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0112')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (923, N'VL0112', N'Hộp gato 24 (50c)', N'Vật liệu', N'Hộp', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0111')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (924, N'VL0111', N'Hộp gato 26 (60c)', N'Vật liệu', N'Hộp', 9000, 0, 813, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0113')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (925, N'VL0113', N'Hộp gato 30 (30c)', N'Vật liệu', N'Hộp', 10000, 0, 1940, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0116')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (926, N'VL0116', N'Hộp gato 30x40', N'Vật liệu', N'Hộp', 20000, 0, 20, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0114')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (927, N'VL0114', N'Hộp gato 32', N'Vật liệu', N'Hộp', 13000, 0, 1620, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0115')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (928, N'VL0115', N'Hộp gato 35x45', N'Vật liệu', N'Hộp', 15000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0144')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (929, N'VL0144', N'Hộp gato cắt giấy', N'Vật liệu', N'Hộp', 1700, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0067')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (930, N'VL0067', N'Hộp gato mini (dây 100c)', N'Vật liệu', N'Dây', 125000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0118')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (931, N'VL0118', N'Hộp gato nắp rời size 30', N'Vật liệu', N'Hộp', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0101')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (932, N'VL0101', N'Hộp giấy đựng bánh mỳ bơ đường', N'Vật liệu', N'Chiếc', 5000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0080')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (933, N'VL0080', N'Hộp giấy đựng da lợn đế trắng', N'Vật liệu', N'Chiếc', 1000, 0, 1900, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0078')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (934, N'VL0078', N'Hộp giấy đựng vỏ ốc quế', N'Vật liệu', N'Chiếc', 800, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0087')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (935, N'VL0087', N'Hộp giấy nâu 2 ngăn nắp trong', N'Vật liệu', N'Chiếc', 3920, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0026')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (937, N'VL0026', N'Hộp HT12 (dây 100c)', N'Vật liệu', N'Dây', 60000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0203')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (938, N'VL0203', N'Hộp mica 40x60', N'Vật liệu', N'Cái', 105000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0151')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (939, N'VL0151', N'Hộp mica size 22', N'Vật liệu', N'Bộ', 16000, 0, 150, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0182')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (940, N'VL0182', N'Hộp mica size 40', N'Vật liệu', N'Chiếc', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0044')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (941, N'VL0044', N'Hộp mouse cốc lẻ', N'Vật liệu', N'Chiếc', 2500, 0, 150, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0095')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (942, N'VL0095', N'Hộp nhựa chữ nhật 1000ml', N'Vật liệu', N'Chiếc', 2725, 0, 41, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0094')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (943, N'VL0094', N'Hộp nhựa chữ nhật 550ml', N'Vật liệu', N'Chiếc', 3000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0092')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (944, N'VL0092', N'Hộp nhựa chữ nhật 750ml', N'Vật liệu', N'Chiếc', 26000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0106')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (945, N'VL0106', N'Hộp nhựa đáy 4 ngăn đựng cơm', N'Vật liệu', N'Chiếc', 2250, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0217')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (946, N'VL0217', N'Hộp nhựa fk333 bao nướng/bơ tỏi 50c/túi', N'Vật liệu', N'Túi', 2000, 0, 99, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0100')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (947, N'VL0100', N'Hộp nhựa HX561', N'Vật liệu', N'Chiếc', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0093')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (948, N'VL0093', N'Hộp nhựa tròn cao 700ml', N'Vật liệu', N'Chiếc', 11600, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0086')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (949, N'VL0086', N'Hộp oval red/choco/bltm (dây 50c)', N'Vật liệu', N'Dây', 90000, 0, 5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0208')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (950, N'VL0208', N'Hộp pizza size 19', N'Vật liệu', N'Cái', 1450, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0209')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (951, N'VL0209', N'Hộp pizza size 31', N'Vật liệu', N'Cái', 2700, 0, 50, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0223')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (952, N'VL0223', N'Hộp quây tròn gato 2 tầng', N'Vật liệu', N'Chiếc', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0027')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (953, N'VL0027', N'Hộp Sandwich vuông gấu vàng (dây 50c)', N'Vật liệu', N'Dây', 78500, 0, 12, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0066')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (954, N'VL0066', N'Hộp tam giác đế đen', N'Vật liệu', N'Chiếc', 1600, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0181')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (955, N'VL0181', N'Hộp tart trứng (DÂY 50C)', N'Vật liệu', N'Chiếc', 80000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0070')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (956, N'VL0070', N'Hộp thiếc chữ nhật không nắp', N'Vật liệu', N'Chiếc', 6000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0068')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (957, N'VL0068', N'Hộp thiếc vuông nắp trong', N'Vật liệu', N'Chiếc', 9100, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0088')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (958, N'VL0088', N'Hộp tiramisu tròn', N'Vật liệu', N'Chiếc', 3000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0186')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (959, N'VL0186', N'Hộp tiramisu vuông', N'Vật liệu', N'Chiếc', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0119')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (960, N'VL0119', N'Hộp trà cam quế giấy detox', N'Vật liệu', N'Hộp', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0099')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (961, N'VL0099', N'Hộp tròn đế giấy nắp trong', N'Vật liệu', N'Chiếc', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0211')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (962, N'VL0211', N'Hộp tròn nhựa 600ml', N'Vật liệu', N'Cái', 1800, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0089')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (963, N'VL0089', N'Hộp vuông BLTM', N'Vật liệu', N'Chiếc', 3000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0085')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (964, N'VL0085', N'Hộp vuông to trong suốt W01', N'Vật liệu', N'Chiếc', 7200, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0084')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (965, N'VL0084', N'Hộp vuông trong suốt JLH10-6', N'Vật liệu', N'Chiếc', 2500, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0216')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (966, N'VL0216', N'Hũ đựng sốt liền nắp 2,5oz (50c/lốc)', N'Vật liệu', N'Lốc', 23000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0215')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (967, N'VL0215', N'Hũ đựng sốt liền nắp 2oz (50c/lốc)', N'Vật liệu', N'Lốc', 21000, 0, 18, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0152')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (968, N'VL0152', N'Hũ sữa chua nhựa', N'Vật liệu', N'Cái', 830, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0222')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (969, N'VL0222', N'Kéo', N'Vật liệu', N'Chiếc', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0162')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (970, N'VL0162', N'Khăn lau', N'Vật liệu', N'Cái', 15000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0210')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (971, N'VL0210', N'Khay nhựa', N'Vật liệu', N'Cái', 279783, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0071')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (972, N'VL0071', N'Khay thiếc tròn nhỏ', N'Vật liệu', N'Chiếc', 1000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0149')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (973, N'VL0149', N'Lọ 1000ml (72c/kiện)', N'Vật liệu', N'Cái', 8500, 0, 144, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0133')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (974, N'VL0133', N'Lọ dẹt 330ml', N'Vật liệu', N'Cái', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0134')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (975, N'VL0134', N'Lọ dẹt 500ml', N'Vật liệu', N'Cái', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0126')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (976, N'VL0126', N'Lọ tròn 1500ml (66c/kiện)', N'Vật liệu', N'Cái', 6800, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0127')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (977, N'VL0127', N'Lọ tròn 500ml (98c/kiện)', N'Vật liệu', N'Cái', 4600, 0, 98, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0125')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (978, N'VL0125', N'Lọ tròn 750ml (131c/thùng)', N'Vật liệu', N'Cái', 5000, 0, 131, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0205')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (979, N'VL0205', N'Lon 500ml (171c/kiện)', N'Vật liệu', N'Kiện', 3335, 0, 151, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0148')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (982, N'VL0148', N'Màng bọc thực phẩm', N'Vật liệu', N'Hộp', 200000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0039')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (983, N'VL0039', N'Nắp hộp gato red/choco', N'Vật liệu', N'Cái', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0172')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (984, N'VL0172', N'Nến chữ HPBĐ', N'Vật liệu', N'Bộ', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0038')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (985, N'VL0038', N'Nến số vàng', N'Vật liệu', N'Cái', 145, 0, 1954, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0141')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (986, N'VL0141', N'Nến tăm lẻ', N'Vật liệu', N'Vỉ', 1200, 0, 49, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0194')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (987, N'VL0194', N'Nến xoắn', N'Vật liệu', N'Hộp', 4000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0170')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (988, N'VL0170', N'Nhện nhựa PK', N'Vật liệu', N'Túi', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0192')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (989, N'VL0192', N'Nhiệt kế keo tròn', N'Vật liệu', N'Cái', 30000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0196')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (990, N'VL0196', N'Nơ trắng + hồng', N'Vật liệu', N'Cái', 12000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0146')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (991, N'VL0146', N'Nước rửa bát', N'Vật liệu', N'Túi', 16000, 0, 9, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0021')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (992, N'VL0021', N'Oto suvs PK', N'Vật liệu', N'Cái', 5000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0154')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (994, N'VL0154', N'Quây trong size 10', N'Vật liệu', N'Cuộn', 68000, 0, 5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0155')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (995, N'VL0155', N'Quây trong size 12', N'Vật liệu', N'Cuộn', 75000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0180')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (996, N'VL0180', N'Quây trong size 8', N'Vật liệu', N'Cuộn', 68000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL-HOP4N')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (997, N'VL-HOP4N', N'Set 4 (hộp 4 chi tiết)', N'Vật liệu', N'Bộ', 10000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL-HOP6N')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (998, N'VL-HOP6N', N'Set 6 (hộp 4 chi tiết)', N'Vật liệu', N'Bộ', 12000, 0, 40, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0117')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (999, N'VL0117', N'Thìa ăn chè 100c/túi', N'Vật liệu', N'Túi', 13000, 0, 25, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0175')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1000, N'VL0175', N'Thìa đĩa thêm (10c)', N'Vật liệu', N'Bộ', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0174')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1001, N'VL0174', N'Thìa đĩa thêm (5c)', N'Vật liệu', N'Bộ', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0024')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1002, N'VL0024', N'Thìa nhựa (2kg)', N'Vật liệu', N'Túi', 83000, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0184')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1003, N'VL0184', N'Túi bánh mỳ gối 50c/tập', N'Vật liệu', N'Tập', 2500, 0, 800, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0129')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1004, N'VL0129', N'Túi chéo bắt kem loại to (100c tập)', N'Vật liệu', N'Tập', 65000, 0, 44, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0042')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1005, N'VL0042', N'Túi đỏ happy everyday', N'Vật liệu', N'Chiếc', 14500, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0041')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1006, N'VL0041', N'Túi đỏ happy time', N'Vật liệu', N'Chiếc', 13600, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0191')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1007, N'VL0191', N'Túi đóng chè sỉ 1kg', N'Vật liệu', N'Kg', 140000, 0, 12, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0051')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1008, N'VL0051', N'Túi đựng bánh trung thu nâu', N'Vật liệu', N'Chiếc', 11000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0050')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1009, N'VL0050', N'Túi đựng cookie 500g', N'Vật liệu', N'Chiếc', 1320, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0173')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1010, N'VL0173', N'Túi gato sấy', N'Vật liệu', N'Cái', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0214')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1011, N'VL0214', N'Túi giữ nhiệt chum chum', N'Vật liệu', N'Cái', 4000, 0, 1080, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0054')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1012, N'VL0054', N'Túi hoa đựng set 4', N'Vật liệu', N'Chiếc', 12000, 0, 456, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0053')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1013, N'VL0053', N'Túi hoa đựng set 6', N'Vật liệu', N'Chiếc', 15000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0124')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1014, N'VL0124', N'Túi hút chân không', N'Vật liệu', N'Cái', 130000, 0, 136, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0212')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1015, N'VL0212', N'Túi hút chân không pizza', N'Vật liệu', N'Kg', 78000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0150')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1016, N'VL0150', N'Túi nilong đỏ', N'Vật liệu', N'Kg', 45000, 0, 10, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0140')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1017, N'VL0140', N'Túi nilong rác đen', N'Vật liệu', N'Kg', 35000, 0, 9, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0139')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1018, N'VL0139', N'Túi nilong trắng bé', N'Vật liệu', N'Tập', 45000, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0138')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1019, N'VL0138', N'Túi nilong trắng nhỡ', N'Vật liệu', N'Tập', 45000, 0, 7, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0136')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1020, N'VL0136', N'Túi nilong trắng to', N'Vật liệu', N'Tập', 45000, 0, 12, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0135')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1021, N'VL0135', N'Túi nilong vàng', N'Vật liệu', N'Tập', 45000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0137')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1022, N'VL0137', N'Túi nilong xanh', N'Vật liệu', N'Tập', 45000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0052')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1023, N'VL0052', N'Túi trắng giấy', N'Vật liệu', N'Chiếc', 4653, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0130')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1024, N'VL0130', N'Túi trắng to đựng mứt dừa', N'Vật liệu', N'Cái', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0190')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1025, N'VL0190', N'Túi zip bizonzon', N'Vật liệu', N'Chiếc', 105000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0207')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1026, N'VL0207', N'Túi zip trắng size to (22x28x10)', N'Vật liệu', N'Cái', 2500, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0028')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1027, N'VL0028', N'Vỏ mochi 2 cái X202 (dây 100c)', N'Vật liệu', N'Cái', 1400, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0188')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1028, N'VL0188', N'Bóng nhũ vàng/bạc/xanh dương', N'Vật liệu', N'Túi', 23000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0013')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1029, N'VL0013', N'Thẻ cắm hoạt hình', N'Vật liệu', N'Set', 3000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0015')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1030, N'VL0015', N'Thẻ meka happy birthday (túi 10c)', N'Vật liệu', N'Túi', 10000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0202')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1031, N'VL0202', N'Topper 8/3 PK', N'Vật liệu', N'Set', 16000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0017')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1032, N'VL0017', N'Set bi nhựa 4 cỡ', N'Vật liệu', N'Túi', 24500, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0201')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1033, N'VL0201', N'Set giấy 8/3 PK', N'Vật liệu', N'Set', 3000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0040')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1034, N'VL0040', N'Set khay kẹo nougat', N'Vật liệu', N'Set', 420000, 0, 10, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0199')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1035, N'VL0199', N'Set phi hành gia PK', N'Vật liệu', N'Set', 28000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0016')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1036, N'VL0016', N'Set tai thỏ', N'Vật liệu', N'Túi', 4000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0020')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1037, N'VL0020', N'Siêu nhân nhựa (7 con) PK', N'Vật liệu', N'Túi', 12000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0167')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1038, N'VL0167', N'Ông bà cụ nhựa PK', N'Vật liệu', N'Chiếc', 3500, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0198')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1039, N'VL0198', N'Khủng long to PK', N'Vật liệu', N'Cái', 9000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0023')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1040, N'VL0023', N'Khung thành cầu thủ PK', N'Vật liệu', N'Túi', 15000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0169')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1041, N'VL0169', N'Kurumi nhựa PK', N'Vật liệu', N'Chiếc', 3900, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0197')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1042, N'VL0197', N'Ruy băng 2cm PK', N'Vật liệu', N'Cây', 70000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0200')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1043, N'VL0200', N'Ruy von PK', N'Vật liệu', N'Cuộn', 6000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0019')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1044, N'VL0019', N'Kẹo bi trắng ngọc trai mix size gói 500g', N'Vật liệu', N'Gói', 82000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0035')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1045, N'VL0035', N'Kẹo đồng tiền PK', N'Vật liệu', N'Kg', 90000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0022')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1046, N'VL0022', N'Mèo kity đơn PK', N'Vật liệu', N'Con', 4000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0014')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1047, N'VL0014', N'Cành đào màu đỏ màu vàng', N'Vật liệu', N'Cái', 5500, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0168')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1048, N'VL0168', N'Cây dừa PK', N'Vật liệu', N'Bộ', 20000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0171')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1049, N'VL0171', N'Bi vàng nhựa PK', N'Vật liệu', N'gói', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0195')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1050, N'VL0195', N'Elsa PK', N'Vật liệu', N'Cái', 7000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0018')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1051, N'VL0018', N'Em bé múa bale tóc hồng cánh nhỏ', N'Vật liệu', N'Con', 6000, 0, 10, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL0032')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1052, N'VL0032', N'Quây hoa', N'Vật liệu', N'Cái', 5000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-MĐ')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1061, N'PK-MĐ', N'Mũ đại ', N'Nguyên liệu', N'g', 130000, 0, -1, 1, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-MT')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1074, N'PK-MT', N'Mũ trung ', N'Nguyên liệu', N'g', 110000, 0, -1, 1, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-SUAKHX')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1075, N'NL-SUAKHX', N'Sữa tiệt trùng nguyên kem 3.5% béo , nhãn hiệu Laciate,12L/1 thùng, xuất xứ Ba Lan ', N'Nguyên liệu', N'g', 335000, 0, 26, 12, N'Công ty TNHH MANY FOOD ', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL-CANTAY')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1076, N'NL-CANTAY', N'Cần tây ', N'Nguyên liệu', N'kg', 40000, 0, 0, 0, N'Rau', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_coctim')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1077, N'VL_coctim', N'Cốc tim làm set 4/6', N'Nguyên liệu', N'quả/cái', 2300, 0, 0, 2, N'Bình Thu', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_muivory')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1082, N'VL_muivory', N'Mũ ivory 3d mix siêu nhân / công chúa', N'Nguyên liệu', N'g', 135000, 0, 2, 1, N'Bình Thu', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_quaythanhchitiet')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1086, N'VL_quaythanhchitiet', N'Quây thành nhiều chi tiết', N'Nguyên liệu', N'gói', 78000, 0, 1, 1, N'Bình Thu', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_onghut')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1087, N'VL_onghut', N'Ống hút', N'Nguyên liệu', N'gói', 26000, 0, 26, 1, N'Long', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK_KHUNGLONGBE')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1106, N'PK_KHUNGLONGBE', N'Khủng long bé', N'Nguyên liệu', N'quả/cái', 5000, 0, 0, 0, N'Phụ kiện sinh nhật', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK_CUPBONGDA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1119, N'PK_CUPBONGDA', N'Cúp bóng đá-PK', N'Nguyên liệu', N'quả/cái', 5000, 0, 0, 0, N'Phụ kiện sinh nhật', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK_XECAUTO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1128, N'PK_XECAUTO', N'Xe cẩu to -PK', N'Nguyên liệu', N'quả/cái', 9000, 0, 0, 0, N'Phụ kiện sinh nhật', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK_BOMAYXUC')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1134, N'PK_BOMAYXUC', N'Bộ máy xúc -PK', N'Nguyên liệu', N'quả/cái', 10000, 0, 0, 0, N'Phụ kiện sinh nhật', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK_CINAMORO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1135, N'PK_CINAMORO', N'Cinamoro-PK', N'Nguyên liệu', N'quả/cái', 5000, 0, 0, 0, N'Phụ kiện sinh nhật', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK_BIENBAONHO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1143, N'PK_BIENBAONHO', N'Biển báo nhỏ -PK', N'Nguyên liệu', N'hộp', 4000, 0, 0, 0, N'Phụ kiện sinh nhật', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK_BIENBAOTO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1148, N'PK_BIENBAOTO', N'Biển báo to -PK', N'Nguyên liệu', N'quả/cái', 4000, 0, 0, 0, N'Phụ kiện sinh nhật', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK_OTO6C')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1151, N'PK_OTO6C', N'Ô tô 6c', N'Nguyên liệu', N'quả/cái', 12000, 0, 0, 0, N'Phụ kiện sinh nhật', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_CREAMCHEESE1.36')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1154, N'NL_CREAMCHEESE1.36', N'Cream cheese 1.36Kg', N'Nguyên liệu', N'hộp', 224500, 0, 59, 5, N'Hoàng Lê', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_OLONGQUEHOA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1161, N'NL_OLONGQUEHOA', N'Trà ô long quế hoa Việt Tuấn-Chè', N'Nguyên liệu', N'gói', 269000, 0, 3, 1, N'Tùng Freddo', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_MAUDEN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1176, N'NL_MAUDEN', N'Màu đồng tiến đen 600g', N'Nguyên liệu', N'hộp', 113000, 0, 0, 0, N'Công ty TNHH Thương Mại Thực Phẩm SKY', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_MAUHONGCANHSEN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1184, N'NL_MAUHONGCANHSEN', N'Màu đồng tiến hồng cánh sen', N'Nguyên liệu', N'hộp', 45000, 0, 0, 0, N'Công ty TNHH thương mại thực phẩm Sky', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_MAUDOCHEEY')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1189, N'NL_MAUDOCHEEY', N'Màu đỏ cherry', N'Nguyên liệu', N'hộp', 45000, 0, 1, 0, N'Công ty TNHH thương mại thực phầm sky', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_BOSUALACTIC')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1200, N'NL_BOSUALACTIC', N'Bơ sữa Lactic 25kg HN', N'Nguyên liệu', N'kg', 250000, 0, 0, 0, N'Công ty trách nhiệm hữu hạn T.M.A', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK_QUABONG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1215, N'PK_QUABONG', N'Quả bóng đá-PK', N'Nguyên liệu', N'quả/cái', 4000, 0, 0, 0, N'Phụ kiện sinh nhật', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK_BONGCHUM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1225, N'PK_BONGCHUM', N'Bóng chùm-PK', N'Nguyên liệu', N'gói', 24000, 0, 0, 2, N'Phụ kiện sinh nhật', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK_RUYCHANEL')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1231, N'PK_RUYCHANEL', N'Ruy chanel-PK', N'Nguyên liệu', N'gói', 20000, 0, 0, 0, N'Phụ kiện sinh nhật', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK_SAODUONG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1236, N'PK_SAODUONG', N'Sao đường-PK', N'Nguyên liệu', N'hộp', 35000, 0, 0, 0, N'Phụ kiện sinh nhật', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK_BIDUONGBAC')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1242, N'PK_BIDUONGBAC', N'Bi đường bạc', N'Nguyên liệu', N'hộp', 45000, 0, 0, 0, N'Phụ kiện sinh nhật', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'K-HBMO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1251, N'K-HBMO', N'Hộp đựng bánh mật ông 4c (trứng/donut )', N'Nguyên liệu', N'gói', 3500, 0, 200, 50, N'Công ty TNHH thương mại thực phẩm Sky', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT049')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1259, N'N_BOT049', N'Bột trộn bánh mỳ nguyên cám  Puravita 5kg', N'Nguyên liệu', N'kg', 99360, 0, 23, 0, N'Ong Vàng Food', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT048')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1263, N'N_BOT048', N'Bột trộn bánh mỳ Lúa Mạch Đen 5Kg', N'Nguyên liệu', N'kg', 121932, 0, 20, 0, N'Ong Vàng Food', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_DUACHUOT')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1267, N'NL_DUACHUOT', N'Dưa chuột', N'Nguyên liệu', N'kg', 23000, 0, 0, 0, N'Rau', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_TUINGUYENCAM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1273, N'VL_TUINGUYENCAM', N'Túi bánh mì nguyên cám', N'Nguyên liệu', N'túi', 2000, 0, 510, 1, N'Công ty TNHH Thương Mại Thực Phẩm Sky', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_TUIBANHMIXOAN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1281, N'VL_TUIBANHMIXOAN', N'Túi bánh mì xoắn', N'Nguyên liệu', N'túi', 1500, 0, 250, 1, N'Công ty TNHH Thương Mại Thực Phẩm Sky', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT014')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1285, N'N_BOT014', N'Bột chocolate ONE', N'Nguyên liệu', N'gói', 295000, 0, 2, 1, N'Tùng', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_FALUDAU')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1286, N'NL_FALUDAU', N'Falu Dâu can 2 lít', N'Nguyên liệu', N'hộp', 225000, 0, 2, 1, N'Tùng', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_TRAOLONGNUONG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1287, N'NL_TRAOLONGNUONG', N'Trà ô long nướng', N'Nguyên liệu', N'gói', 164000, 0, 5, 1, N'Nhất Hương', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_TRAOLONGKHOI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1288, N'NL_TRAOLONGKHOI', N'Trà ô long khói', N'Nguyên liệu', N'gói', 116000, 0, 2, 1, N'Nhất Hương', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_DETRONSIZE35')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1289, N'VL_DETRONSIZE35', N'Đế tròn bạc size 35 bánh 2 tầng', N'Nguyên liệu', N'quả/cái', 20000, 0, 10, 10, N'Phụ kiện sinh nhật', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SOCOLATHANH')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1290, N'NL_SOCOLATHANH', N'Sô-cô-la N.Chất đen Ghana thanh 1kg', N'Nguyên liệu', N'hộp', 397.22, 0, 7, 0, N'Ong Vàng', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_THITBAP')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1294, N'NL_THITBAP', N'Thịt bắp', N'Nguyên liệu', N'kg', 135000, 0, 0, 0, N'Tuyết Thịt Lợn', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_THITVAIGION')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1297, N'NL_THITVAIGION', N'Thịt vai giòn', N'Nguyên liệu', N'kg', 125000, 0, 7, 0, N'Tuyết Thịt Lợn', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_THITPHE')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1298, N'NL_THITPHE', N'Thịt Phệ', N'Nguyên liệu', N'kg', 90000, 0, 0, 0, N'Tuyết Thịt Lợn', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_GANGTAYDEN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1299, N'VL_GANGTAYDEN', N'Găng tay cao su đen', N'Vật liệu', N'hộp', 68000, 0, 13, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_GANGTAYTRANG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1300, N'VL_GANGTAYTRANG', N'Găng tay cao su trắng', N'Nguyên liệu', N'hộp', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NHANTHAPCAM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1301, N'NL_NHANTHAPCAM', N'Nhân thập cẩm', N'Nguyên liệu', N'kg', 250000, 0, 0, 1, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT022')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1302, N'N_BOT022', N'Bột mì Semola Divella 2kg (bột áo pizza)', N'Nguyên liệu', N'túi', 75000, 0, 5, 1, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT039')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1303, N'N_BOT039', N'Bột Semola Semolina dạng thô Divella', N'Nguyên liệu', N'túi', 45000, 0, 7, 1, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_KHOAIMON')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1304, N'NL_KHOAIMON', N'Khoai môn', N'Nguyên liệu', N'kg', 27000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NAMDONGCO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1305, N'NL_NAMDONGCO', N'Nấm đông cô', N'Nguyên liệu', N'kg', 100000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NAMDUIGA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1306, N'NL_NAMDUIGA', N'Nấm đùi gà', N'Nguyên liệu', N'kg', 33000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_BANHQUE')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1307, N'NL_BANHQUE', N'Bánh quế que socola', N'Nguyên liệu', N'túi', 15200, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_KEOTHAIKEM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1308, N'NL_KEOTHAIKEM', N'Kẹo thái kem', N'Nguyên liệu', N'gói', 15000, 0, 6, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_KEOSOCOLA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1309, N'NL_KEOSOCOLA', N'Kẹo socola popit', N'Nguyên liệu', N'túi', 6000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_KEODEOQUE')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1310, N'NL_KEODEOQUE', N'Kẹo dẻo que', N'Nguyên liệu', N'túi', 63000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_CAROT')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1311, N'NL_CAROT', N'Cà rốt', N'Nguyên liệu', N'kg', 14000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SUPLO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1312, N'NL_SUPLO', N'Súp lơ', N'Nguyên liệu', N'kg', 27500, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_TOMTUOI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1313, N'NL_TOMTUOI', N'Tôm tươi', N'Nguyên liệu', N'kg', 280000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_DAMBONG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1314, N'NL_DAMBONG', N'Dăm bông', N'Nguyên liệu', N'túi', 83000, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_KHAUTRANGNHUA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1316, N'VL_KHAUTRANGNHUA', N'Khẩu trang nhựa', N'Vật liệu', N'quả/cái', 3500, 0, 12, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NHANCHE')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1317, N'NL_NHANCHE', N'Quả nhãn - Chè', N'Nguyên liệu', N'kg', 60000, 0, 1.5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_CHANHLEO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1318, N'NL_CHANHLEO', N'Chanh leo tươi', N'Nguyên liệu', N'kg', 40000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SUABOTCOGAIHALAN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1319, N'NL_SUABOTCOGAIHALAN', N'Sữa bột Cô gái Hà Lan', N'Nguyên liệu', N'kg', 87000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_TUIOXI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1321, N'VL_TUIOXI', N'Túi ô xi trung thu', N'Nguyên liệu', N'gói', 50000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_MOCNHI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1322, N'NL_MOCNHI', N'Mộc nhĩ', N'Nguyên liệu', N'kg', 106000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_DUONGNAU')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1323, N'NL_DUONGNAU', N'Đường nâu', N'Nguyên liệu', N'kg', 22000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_HATLANH')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1324, N'NL_HATLANH', N'Hạt lanh', N'Nguyên liệu', N'kg', 90000, 0, 0, 0, N'Shoppe', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_PHOILUAMI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1325, N'NL_PHOILUAMI', N'Phôi lúa mì', N'Nguyên liệu', N'kg', 40000, 0, 90, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_DUASOI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1326, N'NL_DUASOI', N'Dừa sợi', N'Nguyên liệu', N'kg', 55000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SUABOTBEO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1327, N'NL_SUABOTBEO', N'Sữa bột béo tan nhanh NZ', N'Nguyên liệu', N'kg', 125000, 0, 50, 25, N'Hoàng Lê', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT002')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1337, N'N_BOT002', N'Bột bánh mì ngũ cốc (Kraftkorn mix export)', N'Nguyên liệu', N'gói', 1155000, 0, 0, 1, N'Nhất Hương', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NHOXANH')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1338, N'NL_NHOXANH', N'Nho Xanh', N'Nguyên liệu', N'kg', 170000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_TRAGAORANG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1339, N'NL_TRAGAORANG', N'Trà gạo rang', N'Nguyên liệu', N'túi', 130000, 0, 1, 0, N'Nhất Hương', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_MATONG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1377, N'NL_MATONG', N'Mật ong 1L', N'Nguyên liệu', N'l', 130000, 0, 12, 2, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SIRONHIETDOI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1378, N'NL_SIRONHIETDOI', N'Siro nhiệt đới', N'Nguyên liệu', N'hộp', 150000, 0, 3, 1, N'Tùng Freddo', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_MUTLONGNHAN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1382, N'NL_MUTLONGNHAN', N'Mứt long nhãn BODUO', N'Nguyên liệu', N'hộp', 165000, 0, 1, 1, N'Tùng Freddo', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SAUCEDUALUOI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1383, N'NL_SAUCEDUALUOI', N'Sauce dưa lưới BODUO', N'Nguyên liệu', N'hộp', 135000, 0, 1, 1, N'Tùng Freddo', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_TRANCHAUDEN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1384, N'NL_TRANCHAUDEN', N'Trân châu đen Queen', N'Nguyên liệu', N'gói', 72000, 0, 2, 1, N'Tùng Freddo', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_CAPASTELASICILIA3KG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1385, N'NL_CAPASTELASICILIA3KG', N'Cà Paste La Sicilia 3kg', N'Nguyên liệu', N'hộp', 180560, 0, 0, 1, N'Hoàng Lê', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_HOPVUONG40X40')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1386, N'NL_HOPVUONG40X40', N'Hộp vuông 40x40', N'Nguyên liệu', N'quả/cái', 11700, 0, 20, 5, N'Công ty TNHH Thương Mại Thực Phẩm Sky', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_DEEPCUONG40X40')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1387, N'NL_DEEPCUONG40X40', N'Đế ép vuông 40x40', N'Nguyên liệu', N'quả/cái', 6500, 0, 20, 5, N'Công ty TNHH Thương Mại Thực Phẩm Sky', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_XUCXICH')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1388, N'NL_XUCXICH', N'Xúc Xích', N'Nguyên liệu', N'kg', 120000, 0, 0, 0, N'Tuyết - Thịt Lợn', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT004')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1389, N'N_BOT004', N'Bột béo Kota', N'Nguyên liệu', N'gói', 83000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_TRAGAO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1390, N'NL_TRAGAO', N'Trà gạo', N'Nguyên liệu', N'kg', 238000, 0, 10, 1, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_TUIQUAYNL')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1391, N'VL_TUIQUAYNL', N'Túi quẩy ngàn lớp', N'Nguyên liệu', N'gói', 45000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_TUIZIPTRONG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1392, N'VL_TUIZIPTRONG', N'Túi zip trong size to', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_TUIDONGBANHCHUHY')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1394, N'VL_TUIDONGBANHCHUHY', N'Túi đóng bánh chữ Hỷ', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_TUIHUTCHANKHONGDA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1395, N'VL_TUIHUTCHANKHONGDA', N'Túi hút chân không đá', N'Nguyên liệu', N'kg', 130000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_TUIZIPSO2')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1396, N'VL_TUIZIPSO2', N'Túi zip số 2', N'Nguyên liệu', N'kg', 90000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_YENMACH')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1397, N'NL_YENMACH', N'Yến mạch', N'Nguyên liệu', N'kg', 50000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_HATOCCHO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1398, N'NL_HATOCCHO', N'Hạt óc chó', N'Nguyên liệu', N'kg', 190000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_HATNEM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1399, N'NL_HATNEM', N'Hạt nêm', N'Nguyên liệu', N'gói', 100000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NGONGOT')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1400, N'NL_NGONGOT', N'Bắp ngô ngọt', N'Nguyên liệu', N'kg', 40000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_MUITA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1401, N'NL_MUITA', N'Mùi ta', N'Nguyên liệu', N'kg', 150000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NGUYENCAMTHO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1403, N'NL_NGUYENCAMTHO', N'Nguyên cám thô', N'Nguyên liệu', N'túi', 150000, 0, 17, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SOCOLANEN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1405, N'NL_SOCOLANEN', N'Socola đen- Men mộc', N'Nguyên liệu', N'kg', 250000, 0, 6.5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_OLIUXANH')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1406, N'NL_OLIUXANH', N'Oliu xanh', N'Nguyên liệu', N'hộp', 400000, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_DUONGANKIENG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1407, N'NL_DUONGANKIENG', N'Đường ăn kiêng', N'Nguyên liệu', N'kg', 300000, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_VUNGDEN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1408, N'NL_VUNGDEN', N'Vừng đen (dup 1)', N'Nguyên liệu', N'kg', 130000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_HATQUINOA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1409, N'NL_HATQUINOA', N'hạt quinoa', N'Nguyên liệu', N'ml', 350000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SIRODAVINCI HAZELNUT')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1410, N'NL_SIRODAVINCI HAZELNUT', N'Siro Davinci Hazelnut', N'Nguyên liệu', N'hộp', 210000, 0, 1, 0, N'Tùng Ferrado', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SIROHANHNHANRANG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1411, N'NL_SIROHANHNHANRANG', N'Siro hạnh nhân rang', N'Nguyên liệu', N'hộp', 210000, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_BOMATCHA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1412, N'NL_BOMATCHA', N'Bơ matcha', N'Nguyên liệu', N'hộp', 165000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_QUADUALUOI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1414, N'NL_QUADUALUOI', N'Quả dưa lưới', N'Nguyên liệu', N'kg', 60000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_QUADUA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1415, N'NL_QUADUA', N'Quả dứa', N'Nguyên liệu', N'quả/cái', 20000, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_DAUOLIU')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1416, N'NL_DAUOLIU', N'Dầu oliu can 5l', N'Nguyên liệu', N'Can', 894450, 0, 2, 0, N'Hoàng Lê', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SOTNAMTRUFFLE')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1417, N'NL_SOTNAMTRUFFLE', N'Sốt nấm cục Truffle La Sicilia 500g', N'Nguyên liệu', N'hộp', 315000, 0, 0, 0, N'Hoàng Lê', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_TUIX23')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1418, N'NL_TUIX23', N'Túi 16x23', N'Nguyên liệu', N'kg', 85000, 0, 3, 0, N'shoppe', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_BANHQUYCHUNHAT')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1421, N'NL_BANHQUYCHUNHAT', N'Bánh quy chữ nhật Bedolf vị Caramen', N'Nguyên liệu', N'gói', 0, 0, 14, 0, N'Bakingtool-Phụ kiện sinh nhật', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_BANGDINHVANG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1422, N'VL_BANGDINHVANG', N'Băng dính vàng cuộn to', N'Nguyên liệu', N'cuộn', 0, 0, 44, 0, N'Công ty TNHH Sản xuất và Thương mại CHC TAPE', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_QUATAO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1423, N'NL_QUATAO', N'Quả táo', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_HUPET820')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1424, N'NL_HUPET820', N'Hũ pet 820ml(98c/kiện)', N'Nguyên liệu', N'quả/cái', 0, 0, 196, 0, N'Cppng ty TNHH Thương Mại vad Sản Xuất Nhựa Vạn Thông', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_HOPNHUANGAN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1425, N'NL_HOPNHUANGAN', N'Hộp nhựa trong 2 ngăn', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'Thanh An Trứng Muối', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_TRUNGGA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1426, N'NL_TRUNGGA', N'Trứng gà', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'Công ty TNHH đầu tư phát triển nông nghiệp Thascom', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT008')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1427, N'N_BOT008', N'Bột cacao Top bekery 0.5kg HN', N'Nguyên liệu', N'gói', 0, 0, 4, 0, N'Công ty trách nhiệm hữu hạn T.M.A', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SANTUYETPHAMAY')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1428, N'NL_SANTUYETPHAMAY', N'Shan tuyết pha máy ĐẬM VỊ', N'Nguyên liệu', N'gói', 0, 0, 4, 0, N'Tùng Freddo', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SAUCEXOAI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1429, N'NL_SAUCEXOAI', N'Sauce Xoài ngọt BODUO', N'Nguyên liệu', N'hộp', 0, 0, 0, 0, N'Tùng Freddo', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SOTVAI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1430, N'NL_SOTVAI', N'Sốt vải BODUO', N'Nguyên liệu', N'hộp', 0, 0, 0, 0, N'Tùng Freddo', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SIROCOC')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1431, N'NL_SIROCOC', N'Siro cóc Hestia', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Tùng Freddo', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SUAYENMACH')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1432, N'NL_SUAYENMACH', N'Sữa yến mạch Oatside Barista Blend', N'Nguyên liệu', N'hộp', 0, 0, 0, 0, N'Tùng Freddo', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_GIAYINANH')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1433, N'NL_GIAYINANH', N'Giấy in ảnh (dup 1)', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SUAFAMI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1457, N'NL_SUAFAMI', N'Sữa fami', N'Nguyên liệu', N'gói', 0, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'VL_GIAYINANHR')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1460, N'VL_GIAYINANHR', N'Giấy in ảnh', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT010')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1461, N'N_BOT010', N'Bột canh', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Phượng Hàng Khô', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT016')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1462, N'N_BOT016', N'Bột gạo', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'Phượng Hàng Khô', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT015')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1463, N'N_BOT015', N'Bột điều', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Phượng Hàng Khô', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_RAUTHOM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1465, N'NL_RAUTHOM', N'Rau thơm', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_LAC')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1466, N'NL_LAC', N'Lạc', N'Nguyên liệu', N'ml', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_THITBO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1467, N'NL_THITBO', N'Thịt bò', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'LÊ VĂN HÀO', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_MUTVOCAM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1468, N'NL_MUTVOCAM', N'Mứt vỏ cam', N'Nguyên liệu', N'kg', 0, 0, 4, 0, N'Công Ty TNHH Thực Phẩm Đức Long', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_PINTO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1469, N'NL_PINTO', N'Pin to', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'Wimart', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_PINNHO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1470, N'NL_PINNHO', N'Pin nhỏ', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'Winmart', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_DAOLAM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1471, N'NL_DAOLAM', N'Dao lam', N'Nguyên liệu', N'hộp', 0, 0, 2, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NHANCOMDUWAF')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1472, N'NL_NHANCOMDUWAF', N'Nhân cốm dừa', N'Nguyên liệu', N'gói', 0, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NHANDUWALUOI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1473, N'NL_NHANDUWALUOI', N'Nhân dừa lưới', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_BA ROI T.VINH.XK C.LAT 1KG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1474, N'NL_BA ROI T.VINH.XK C.LAT 1KG', N'BA ROI T.VINH.XK C.LAT 1KG', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Mega Market', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_D.BONG T.VINH VAI CAT KHUC 1KG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1475, N'NL_D.BONG T.VINH VAI CAT KHUC 1KG', N'D.BONG T.VINH VAI CAT KHUC 1KG', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Mega Market', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_DAM BONG CAT LAT LF 500G')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1476, N'NL_DAM BONG CAT LAT LF 500G', N'DAM BONG CAT LAT LF 500G', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Mega Market', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_D.BONG VAI VUONG C.LATDNA 500G')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1477, N'NL_D.BONG VAI VUONG C.LATDNA 500G', N'D.BONG VAI VUONG C.LATDNA 500G', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Mega Market', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_MUYTE')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1478, N'NL_MUYTE', N'Mũ y tế bọc bánh mỳ', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SIRUPSOCOLA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1479, N'NL_SIRUPSOCOLA', N'Sirup socola', N'Nguyên liệu', N'hộp', 0, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT012')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1480, N'N_BOT012', N'Bột chese', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_COSYYENMACH')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1481, N'NL_COSYYENMACH', N'Bánh cosy yến mạch', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Winmart', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_CREAMO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1482, N'NL_CREAMO', N'Bánh Cream vị kem', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Winmart', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_DAUXANH')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1483, N'NL_DAUXANH', N'Đậu xanh', N'Nguyên liệu', N'kg', 0, 0, 50, 0, N'Thắm Gạo', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_VMCSORRBAT')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1484, N'NL_VMCSORRBAT', N'VMC Sorbate-PGTP Việt Mỹ', N'Nguyên liệu', N'kg', 0, 0, 1, 0, N'Công ty cổ phẩm phân phối hoá chất Việt Mỹ', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_5410522581546')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1485, N'NL_5410522581546', N'Socola chip đen Vanhouen(1kg)', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Hộ kinh doanh May Shop', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NUOCDUONG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1486, N'NL_NUOCDUONG', N'Nước đường', N'Nguyên liệu', N'l', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NDMOCHI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1487, N'NDMOCHI', N'Đường mạch nha (maltose syrup82-25kg)', N'Nguyên liệu', N'kg', 0, 0, 175, 0, N'ong vàng food', N'xô 25kg', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'TO10G-MM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1488, N'TO10G-MM', N'Tương ớt 10G cholimex', N'Nguyên liệu', N'g', 0, 0, 0, 0, N'mega market', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'TC10G-MM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1489, N'TC10G-MM', N'Tương cà 10G cholimex', N'Nguyên liệu', N'g', 0, 0, 0, 0, N'mega market', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'khoaitaycong-MM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1490, N'khoaitaycong-MM', N'Khoai tây cọng (túi 2,5kg)', N'Nguyên liệu', N'túi', 0, 0, 0, 0, N'mega market', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'MISPAGHETTI-MM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1491, N'MISPAGHETTI-MM', N'Mì sợi spaghetti', N'Nguyên liệu', N'g', 0, 0, 0, 0, N'Mega market', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'BACON-MM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1492, N'BACON-MM', N'ba rọi xông khói', N'Nguyên liệu', N'g', 0, 0, 0, 0, N'MEGA MARKET', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SCUTH100ml-MM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1493, N'SCUTH100ml-MM', N'SCUTH 100ml*48', N'Nguyên liệu', N'g', 0, 0, 10, 0, N'mega market', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PHOFS512')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1494, N'PHOFS512', N'creamcheese KIRI', N'Nguyên liệu', N'hộp', 0, 0, 5, 0, N'Hoàng lê', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'HC-longhop')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1495, N'HC-longhop', N'hộp đựng set liên hoan đáy đen', N'Nguyên liệu', N'g', 0, 0, 0, 0, N'long tự khoát', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'duiga-mega')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1496, N'duiga-mega', N'Đùi gà tỏi CP', N'Nguyên liệu', N'g', 0, 0, 86, 0, N'MM mega market', N'túi 1.25kg', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'GAVIEN-MM mega')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1497, N'GAVIEN-MM mega', N'Gà Popcorn-tui 2.5kg', N'Nguyên liệu', N'g', 0, 0, 0, 0, N'MM mega market', N'túi 2.5kg', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'LC-cho')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1498, N'LC-cho', N'Lá chanh tươi', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'HN-Halimart')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1499, N'HN-Halimart', N'Hạnh nhân hạt', N'Nguyên liệu', N'kg', 0, 0, 17, 0, N'Halimart', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'camep-thanhdat')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1500, N'camep-thanhdat', N'nước cam ép chai 1l', N'Nguyên liệu', N'g', 0, 0, 9, 0, N'shop thành đạt', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'H4BTT-thanhan')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1501, N'H4BTT-thanhan', N'Hộp 4 bánh đế trắng có lót đen', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'Thanh An', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'DBDEO-bLan')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1502, N'DBDEO-bLan', N'Nước đường bánh dẻo', N'Nguyên liệu', N'chai', 0, 0, 3, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'Giayrut-thuyanh')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1503, N'Giayrut-thuyanh', N'Giấy ăn rút (thùng 4 túi)', N'Nguyên liệu', N'bịch', 0, 0, 0, 0, N'Thúy Anh', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'GDP558.1')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1504, N'GDP558.1', N'SCL nguyên chất đen C.phi 55%nút 1kg', N'Nguyên liệu', N'kg', 0, 0, 8, 0, N'ong vàng food', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'QMan')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1505, N'QMan', N'Mận tươi', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'X211')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1506, N'X211', N'Hộp chôm chôm (BLTM siêu sốt) (dây 50c)', N'Nguyên liệu', N'túi', 0, 0, 0, 0, N'sky', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_DAUTRANG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1507, N'NL_DAUTRANG', N'Đậu trắng', N'Nguyên liệu', N'kg', 0, 0, 100, 0, N'Phượng Hàng Khô', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_DAUDO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1509, N'NL_DAUDO', N'Đậu đỏ', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'Phượng Hàng Khô', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NHANSEN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1510, N'NL_NHANSEN', N'Nhân sen -NTT', N'Nguyên liệu', N'kg', 0, 0, 8, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NHANDAUXANH')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1511, N'NL_NHANDAUXANH', N'Nhân đậu xanh', N'Nguyên liệu', N'kg', 0, 0, 5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NHANDUA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1512, N'NL_NHANDUA', N'Nhân dứa', N'Nguyên liệu', N'kg', 0, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NHANKHOAIMON')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1513, N'NL_NHANKHOAIMON', N'Nhân khoai môn -NTT', N'Nguyên liệu', N'kg', 0, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NHANMOTAY')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1514, N'NL_NHANMOTAY', N'Nhân mơ tây', N'Nguyên liệu', N'kg', 0, 0, 5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NHANBANHMIDUALUOI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1515, N'NL_NHANBANHMIDUALUOI', N'Nhân bánh mỳ dừa lưới', N'Nguyên liệu', N'kg', 0, 0, 13, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_CHUOI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1516, N'NL_CHUOI', N'Chuối', N'Nguyên liệu', N'thùng', 0, 0, 6, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_LON350ML')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1517, N'NL_LON350ML', N'Lon 350ml', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'Công ty TNHH Thương Mại và Sản Xuất Nhựa Vạn Thông', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_BONEWZEALAND25KG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1518, N'NL_BONEWZEALAND25KG', N'Bơ lạt New Zealand 25kg', N'Nguyên liệu', N'kg', 0, 0, 25, 0, N'Công ty TNHH thương mại Hoàng Lê', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_MENTUOISAFVIET')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1519, N'NL_MENTUOISAFVIET', N'Men tươi Saf Viet', N'Nguyên liệu', N'kg', 0, 0, 10, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_RUOURUMPHACHE')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1520, N'NL_RUOURUMPHACHE', N'Rượu rum đen pha chế', N'Nguyên liệu', N'chai', 0, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_BOTVIETQUAT')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1521, N'NL_BOTVIETQUAT', N'Bột vị việt quất', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Tùng Freddo', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_QUYTTUI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1522, N'NL_QUYTTUI', N'Quýt túi', N'Nguyên liệu', N'túi', 0, 0, 0, 0, N'Winmart', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_DAUTUOI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1523, N'NL_DAUTUOI', N'Dâu tươi', N'Nguyên liệu', N'hộp', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_DUANON')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1524, N'NL_DUANON', N'Dừa non', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_BOTNEPTHAIMOCHICOM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1525, N'NL_BOTNEPTHAIMOCHICOM', N'Bôt nếp thái làm mochi cốm', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Hộ kinh doanh May shop', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP073445')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1526, N'SP073445', N'Kute bé ngựa áo xanh', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP073444')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1527, N'SP073444', N'Kute bé ngựa đứng áo hồng', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'BAKINGTOOL- PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP073443')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1528, N'SP073443', N'Kute bé ngựa hồng ngồi ôm quả táo', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP073442')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1529, N'SP073442', N'Kute bé ngựa xanh ngồi ôm bình sữa', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP073507')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1530, N'SP073507', N'Kute ngựa nâu bờm nâu', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP069471')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1531, N'SP069471', N'Bé gái đứng mũ hồng ôm thỏ sứ', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP069472')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1532, N'SP069472', N'Bé gái ngồi mũ xanh ôm gấu sứ', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP068032')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1533, N'SP068032', N'Bé gái thiên thần tai thỏ hồng sứ', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP069753')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1534, N'SP069753', N'Trang trí công chúa cầm váy hồng sứ', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP072463')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1535, N'SP072463', N'Set 3 nến thỏ trắng ngồi tai hồng', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP069185')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1536, N'SP069185', N'Nến gấu nâu', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP072056')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1537, N'SP072056', N'Set nến xoắn sao sắc màu vỉ 4 que', N'Nguyên liệu', N'Vỉ', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP072057')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1538, N'SP072057', N'Set nến xoắn tim sắc màu mới vỉ 4 que', N'Nguyên liệu', N'Vỉ', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP073292')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1539, N'SP073292', N'Nến cún yếm hồng mũ sinh nhật vàng (vỉ 3 que)', N'Nguyên liệu', N'Vỉ', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP072910')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1540, N'SP072910', N'Nến bóng bay I LOVE YOU', N'Nguyên liệu', N'Vỉ', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP071964')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1541, N'SP071964', N'Set 5 nến đám mây trắng (vỉ)', N'Nguyên liệu', N'Vỉ', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP072108')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1542, N'SP072108', N'Nến mũ sinh nhật set 3 cây', N'Nguyên liệu', N'Vỉ', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP071966')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1543, N'SP071966', N'Set 5 cây nến hình cây nên sắc màu', N'Nguyên liệu', N'Vỉ', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'SP071154')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1544, N'SP071154', N'Nến quả dâu tây màu đỏ', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'BAKINGTOOL - PHỤ KIỆN SINH NHẬT', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-B4C')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1546, N'PK-B4C', N'Bộ 4 Capybara', N'Nguyên liệu', N'Bộ', 0, 0, 0, 0, N'Công ty TNHH thương mại thực phẩm Sky', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'K-BBV')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1547, N'K-BBV', N'Bao bánh voan', N'Nguyên liệu', N'cuộn', 0, 0, 0, 0, N'Công ty TNHH thương mại thực phẩm Sky', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-CC')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1548, N'PK-CC', N'Chuột Capybara', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'Công ty TNHH thương mại thực phẩm Sky', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-MLUM')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1549, N'PK-MLUM', N'Máy lu, máy ủi, máy múc', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'CÔNG TY TNHH THƯƠNG MẠI TỰ PHẨM SKY', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-MX')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1550, N'PK-MX', N'Máy xúc (6 máy )', N'Nguyên liệu', N'túi', 0, 0, 0, 0, N'CÔNG TY TNHH THƯƠNG MẠI TỰ PHẨM SKY', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-BGT10CT')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1551, N'PK-BGT10CT', N'Bộ giao thông 10 chi tiết', N'Nguyên liệu', N'Bộ', 0, 0, 0, 0, N'CÔNG TY TNHH THƯƠNG MẠI TỰ PHẨM SKY', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-BGT5CT')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1552, N'PK-BGT5CT', N'Bộ giao thông 5 chi tiết', N'Nguyên liệu', N'Bộ', 0, 0, 0, 0, N'CÔNG TY TNHH THƯƠNG MẠI TỰ PHẨM SKY', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-KLBCX')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1553, N'PK-KLBCX', N'Khủng long bạo chú xanh', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'CÔNG TY TNHH THƯƠNG MẠI TỰ PHẨM SKY', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-NTCTĐN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1554, N'PK-NTCTĐN', N'Nàng tiên cá tóc đỏ nhẹ', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'CÔNG TY TNHH THƯƠNG MẠI TỰ PHẨM SKY', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-TENS')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1555, N'PK-TENS', N'Tượng Elsa nhẹ váy trắng', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'CÔNG TY TNHH THƯƠNG MẠI TỰ PHẨM SKY', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'K-KCS')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1556, N'K-KCS', N'Kem cream chese Anchor', N'Nguyên liệu', N'hộp', 0, 0, 0, 0, N'CÔNG TY TNHH THƯƠNG MẠI TỰ PHẨM SKY', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'K-MVMC')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1557, N'K-MVMC', N'Miếng vét màu cam', N'Nguyên liệu', N'quả/cái', 0, 0, 10, 0, N'CÔNG TY TNHH THƯƠNG MẠI TỰ PHẨM SKY', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'K-CBCN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1558, N'K-CBCN', N'Cắt bột chữ nhật', N'Nguyên liệu', N'quả/cái', 0, 0, 10, 0, N'CÔNG TY TNHH THƯƠNG MẠI TỰ PHẨM SKY', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'K-MVN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1559, N'K-MVN', N'Miếng vét nhựa', N'Nguyên liệu', N'quả/cái', 0, 0, 5, 0, N'CÔNG TY TNHH THƯƠNG MẠI TỰ PHẨM SKY', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'PK-BBNCB')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1560, N'PK-BBNCB', N'Búp bê nhỏ chibi (10 con)', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'CÔNG TY TNHH THƯƠNG MẠI TỰ PHẨM SKY', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_MUITAY')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1561, N'NL_MUITAY', N'Mùi tây', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'Hộ kinh doanh May Shop', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_VIETQUATTUOI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1562, N'NL_VIETQUATTUOI', N'Việt quất BLUEBERRY tươi', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'Hộ kinh doanh May Shop', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_LATHOMNGUYETQUE')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1563, N'NL_LATHOMNGUYETQUE', N'Lá thơm nguyệt quế Bayleave', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Hộ kinh doanh May Shop', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_MUITAYKHO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1564, N'NL_MUITAYKHO', N'Mùi tây khô', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Hộ kinh doanh May Shop', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_GIAVITAMUOPBOKHO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1565, N'NL_GIAVITAMUOPBOKHO', N'Gia vị tẩm ướp thịt bò khô', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Hộ kinh doanh May Shop', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT018')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1566, N'N_BOT018', N'Bột hành', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Hộ kinh doanh May Shop', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT038')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1567, N'N_BOT038', N'Bột sả', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Hộ kinh doanh May Shop', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_VIENGIAVIPHOGA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1568, N'NL_VIENGIAVIPHOGA', N'Viên gia vị phở gà Nosa Food hộp 75g', N'Nguyên liệu', N'hộp', 0, 0, 0, 0, N'Hộ kinh doanh May Shop', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_MUTATMY')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1569, N'NL_MUTATMY', N'Mù tạt Mỹ', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Hộ kinh doanh May Shop', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT017')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1570, N'N_BOT017', N'Bột gừng', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'Hộ kinh doanh May Shop', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_CUIDUA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1571, N'NL_CUIDUA', N'Cùi dừa', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'Dường - Cùi dừa Lĩnh Nam', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_MUTDUA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1572, N'NL_MUTDUA', N'Mứt dứa', N'Nguyên liệu', N'hộp', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_TRUNGATUOIWINMART')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1573, N'NL_TRUNGATUOIWINMART', N'Trứng gà tươi Winmart', N'Nguyên liệu', N'hộp', 0, 0, 0, 0, N'Wimart', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_KEONEN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1574, N'NL_KEONEN', N'Keo nến', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_CHUNVANG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1575, N'NL_CHUNVANG', N'Chun vàng', N'Nguyên liệu', N'túi', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_LO850ML')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1576, N'NL_LO850ML', N'Lọ 850ml (98c/kiện)', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'CÔNG TY TNHH THƯƠNG MẠI VÀ SẢN XUẤT NHỰA VẠN THÔNG', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NUOCTROTAU')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1577, N'NL_NUOCTROTAU', N'Nước tro tàu Bensfoods', N'Nguyên liệu', N'l', 0, 0, 12, 0, N'Ong Vàng Food', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_QUADAO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1578, N'NL_QUADAO', N'Quả đào', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'Winmart', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_BOT030')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1579, N'N_BOT030', N'Bột nếp Thái ( làm mochi -Mayshop)', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'Hộ kinh doanh May shop', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_DUONGVIETDAI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1580, N'NL_DUONGVIETDAI', N'Đường Việt Đài', N'Nguyên liệu', N'kg', 0, 0, 450, 0, N'Doanh nghiệp tư nhân Minh Bảo Việt Nam', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_CHERRYPOLEHNCORAL')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1581, N'NL_CHERRYPOLEHNCORAL', N'Cherry Polehn Coral', N'Nguyên liệu', N'thùng', 0, 0, 0, 0, N'Công ty TNHH Xuất Nhập khẩu Lan Fruits', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NHODENMEDOLY')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1582, N'NL_NHODENMEDOLY', N'Nho đen Medoly', N'Nguyên liệu', N'thùng', 0, 0, 0, 0, N'Công ty TNHH Xuất Nhập khẩu Lan Fruits', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_NHOSUA')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1583, N'NL_NHOSUA', N'Nho sữa 6H UNO', N'Nguyên liệu', N'thùng', 0, 0, 0, 0, N'Công ty TNHH Xuất Nhập khẩu Lan Fruits', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_HOP4NGAYDENDEGIAY')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1599, N'NL_HOP4NGAYDENDEGIAY', N'Hộp 4 ngăn đen đế giấy', N'Nguyên liệu', N'quả/cái', 0, 0, 0, 0, N'Thanh An', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_HOP1NGANDENDEGIAY')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1600, N'NL_HOP1NGANDENDEGIAY', N'Hộp 1 ngăn đen đế giấy', N'Nguyên liệu', N'quả/cái', 0, 0, 200, 0, N'Thanh An', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_THITNACVAI')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1601, N'NL_THITNACVAI', N'Thịt nạc vai', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_SOTUOPXAXIUTHAILAN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1602, N'NL_SOTUOPXAXIUTHAILAN', N'Sốt ướp xá xíu Thái Lan', N'Nguyên liệu', N'gói', 0, 0, 9, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_GOIOXY')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1603, N'NL_GOIOXY', N'Gói oxy', N'Nguyên liệu', N'gói', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_THỊTLONMONG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1604, N'NL_THỊTLONMONG', N'Thịt lợn mông', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'NL_CUGUNG')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1605, N'NL_CUGUNG', N'Củ gừng', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_RUOU001')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1606, N'N_RUOU001', N'Rượu sữa', N'Nguyên liệu', N'chai', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_DAU001')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1607, N'N_DAU001', N'Dầu hạt cải Oily 1L', N'Nguyên liệu', N'chai', 0, 0, 150, 0, N'Công ty TNHH Many Food', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_LAPSUON01')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1608, N'N_LAPSUON01', N'Lạp sườn', N'Nguyên liệu', N'kg', 0, 0, 5, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_PHAMMAUDO')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1609, N'N_PHAMMAUDO', N'Neelicol Ponccau 4R(Phẩm màu đỏ V103)', N'Nguyên liệu', N'kg', 0, 0, 1, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1610, N'N_', N'Đường Treha', N'Nguyên liệu', N'kg', 0, 0, 80, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N-nilon')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1611, N'N-nilon', N'Túi nilon đựng bánh dán miệng 20x17', N'Nguyên liệu', N'gói', 0, 0, 23, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_KHUONSOCOLA01')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1612, N'N_KHUONSOCOLA01', N'KHUÔN SOCOLA IN HÌNH - DORAEMON', N'Nguyên liệu', N'hộp', 0, 0, 0, 0, N'cÔNG TY TNHH ĐỒNG TIẾN VIỆT NAM', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_KHUÔNSOCOLA02')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1613, N'N_KHUÔNSOCOLA02', N'kHUÔN SOCOLA IN HÌNH - BABY GIRL', N'Nguyên liệu', N'hộp', 0, 0, 0, 0, N'CÔNG TY TNHH ĐỒNG TIẾN VIỆT NAM', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_KHUONSOCOLA03')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1614, N'N_KHUONSOCOLA03', N'KHUÔN SOCOLA IN HÌNH - BABY BOY', N'Nguyên liệu', N'hộp', 0, 0, 0, 0, N'CÔNG TY TNHH ĐỒNG TIẾN VIỆT NAM', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_KHUONSOCOLA04')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1615, N'N_KHUONSOCOLA04', N'KHUÔN SOCOLA IN HÌNH - KHỦNG LONG', N'Nguyên liệu', N'hộp', 0, 0, 0, 0, N'CÔNG TY TNHH ĐỒNG TIẾN VIỆT NAM', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_KHUONSOCOLA05')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1616, N'N_KHUONSOCOLA05', N'KHUÔN SOCOLA IN HÌNH - MẶT CƯỜI', N'Nguyên liệu', N'hộp', 0, 0, 0, 0, N'CÔNG TY TNHH ĐỒNG TIẾN VIỆT NAM', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_KHUONSOCOLA06')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1617, N'N_KHUONSOCOLA06', N'KHUÔN SOCOLA IN HÌNH - NGỰA PONY', N'Nguyên liệu', N'hộp', 0, 0, 0, 0, N'CÔNG TY TNHH ĐỒNG TIẾN VIỆT NAM', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'siro ngô')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1618, N'siro ngô', N'Siro ngô', N'Nguyên liệu', N'chai', 0, 0, 4, 0, N'', N'', 1, GETDATE());
END;
IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Code] = N'N_VUNGDEN')
BEGIN
    INSERT INTO [Products] ([Id], [Code], [Name], [Category], [Unit], [CostPrice], [SellPrice], [StockQty], [MinStock], [Supplier], [Description], [IsActive], [CreatedAt])
    VALUES (1619, N'N_VUNGDEN', N'Vừng đen', N'Nguyên liệu', N'kg', 0, 0, 0, 0, N'', N'', 1, GETDATE());
END;
GO
SET IDENTITY_INSERT [dbo].[Products] OFF;
GO
