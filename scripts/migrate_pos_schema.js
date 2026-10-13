const sql = require('mssql');

const config = {
  user: process.env.MSSQL_USER || 'chumchum_app',
  password: process.env.MSSQL_PASSWORD || 'Chumchum123@',
  server: process.env.MSSQL_SERVER || '103.163.214.101',
  database: process.env.MSSQL_DATABASE || 'ChumChumDB',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 15000,
    requestTimeout: 30000,
  },
};

async function migrate() {
  console.log('Connecting to MSSQL at ' + config.server + '...');
  const pool = await sql.connect(config);
  console.log('Connected! Creating POS tables if not exist...');

  // 1. PosFloors
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PosFloors')
    BEGIN
      CREATE TABLE PosFloors (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        SortOrder INT NOT NULL DEFAULT 1,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
      );
      PRINT 'Created table PosFloors';
    END
  `);

  // 2. PosTables
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PosTables')
    BEGIN
      CREATE TABLE PosTables (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FloorId INT NOT NULL FOREIGN KEY REFERENCES PosFloors(Id) ON DELETE CASCADE,
        Code NVARCHAR(50) NOT NULL UNIQUE,
        Name NVARCHAR(100) NOT NULL,
        Capacity INT NOT NULL DEFAULT 4,
        Status NVARCHAR(20) NOT NULL DEFAULT 'available' CHECK (Status IN ('available', 'occupied', 'billing', 'reserved')),
        CurrentOrderId INT NULL,
        SortOrder INT NOT NULL DEFAULT 1,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
      );
      PRINT 'Created table PosTables';
    END
  `);

  // 3. PosShifts
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PosShifts')
    BEGIN
      CREATE TABLE PosShifts (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ShiftCode NVARCHAR(50) NOT NULL UNIQUE,
        CashierId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
        CashierName NVARCHAR(100) NOT NULL,
        OpenedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        ClosedAt DATETIME2 NULL,
        OpeningCash DECIMAL(18,2) NOT NULL DEFAULT 0,
        ClosingCashActual DECIMAL(18,2) NULL,
        TotalCashSales DECIMAL(18,2) NOT NULL DEFAULT 0,
        TotalQRSales DECIMAL(18,2) NOT NULL DEFAULT 0,
        TotalOtherSales DECIMAL(18,2) NOT NULL DEFAULT 0,
        TotalPaidIn DECIMAL(18,2) NOT NULL DEFAULT 0,
        TotalPaidOut DECIMAL(18,2) NOT NULL DEFAULT 0,
        CashDifference DECIMAL(18,2) NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'open' CHECK (Status IN ('open', 'closed')),
        Notes NVARCHAR(MAX) NULL
      );
      PRINT 'Created table PosShifts';
    END
  `);

  // 4. PosOrders
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PosOrders')
    BEGIN
      CREATE TABLE PosOrders (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OrderCode NVARCHAR(50) NOT NULL UNIQUE,
        ShiftId INT NULL FOREIGN KEY REFERENCES PosShifts(Id),
        TableId INT NULL FOREIGN KEY REFERENCES PosTables(Id),
        TableName NVARCHAR(100) NULL,
        OrderType NVARCHAR(20) NOT NULL DEFAULT 'dine_in' CHECK (OrderType IN ('dine_in', 'takeaway', 'delivery')),
        CustomerName NVARCHAR(100) NULL,
        CustomerPhone NVARCHAR(20) NULL,
        Subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
        DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        VatAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        FinalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        PaymentMethod NVARCHAR(20) NULL CHECK (PaymentMethod IN ('cash', 'qr_transfer', 'card', 'split')),
        CashReceived DECIMAL(18,2) NOT NULL DEFAULT 0,
        CashChange DECIMAL(18,2) NOT NULL DEFAULT 0,
        PaymentStatus NVARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (PaymentStatus IN ('unpaid', 'paid', 'cancelled')),
        OrderStatus NVARCHAR(20) NOT NULL DEFAULT 'serving' CHECK (OrderStatus IN ('serving', 'completed', 'cancelled')),
        TransactionRef NVARCHAR(100) NULL,
        PaidAt DATETIME2 NULL,
        CreatedBy NVARCHAR(100) NOT NULL DEFAULT '',
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NULL
      );
      PRINT 'Created table PosOrders';
    END
  `);

  // 5. PosOrderDetails
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PosOrderDetails')
    BEGIN
      CREATE TABLE PosOrderDetails (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL FOREIGN KEY REFERENCES PosOrders(Id) ON DELETE CASCADE,
        ProductId INT NULL FOREIGN KEY REFERENCES Products(Id),
        ProductCode NVARCHAR(50) NULL,
        ProductName NVARCHAR(255) NOT NULL,
        Unit NVARCHAR(20) NOT NULL DEFAULT N'cái',
        Quantity DECIMAL(18,2) NOT NULL DEFAULT 1,
        Price DECIMAL(18,2) NOT NULL DEFAULT 0,
        Discount DECIMAL(18,2) NOT NULL DEFAULT 0,
        Subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
        Note NVARCHAR(255) NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'served' CHECK (Status IN ('ordered', 'served', 'cancelled')),
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
      );
      PRINT 'Created table PosOrderDetails';
    END
  `);

  // 6. PosReceiptTemplates
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PosReceiptTemplates')
    BEGIN
      CREATE TABLE PosReceiptTemplates (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TemplateName NVARCHAR(100) NOT NULL DEFAULT N'Mẫu in chuẩn K80',
        PaperSize NVARCHAR(10) NOT NULL DEFAULT 'k80' CHECK (PaperSize IN ('k80', 'k57')),
        ShopName NVARCHAR(255) NOT NULL DEFAULT N'CHUM CHUM BAKERY',
        ShopAddress NVARCHAR(255) NOT NULL DEFAULT N'Số 18 Ngõ 120 Trần Cung, Cầu Giấy, Hà Nội',
        ShopPhone NVARCHAR(50) NOT NULL DEFAULT N'0988.123.456',
        WifiInfo NVARCHAR(100) NULL DEFAULT N'WiFi: ChumChum_Bakery / Pass: chumchum68',
        HeaderTitle NVARCHAR(100) NOT NULL DEFAULT N'PHIẾU THANH TOÁN',
        FooterMessage NVARCHAR(MAX) NULL DEFAULT N'Cảm ơn Quý khách & Hẹn gặp lại!',
        ShowLogo BIT NOT NULL DEFAULT 1,
        ShowCashier BIT NOT NULL DEFAULT 1,
        ShowTable BIT NOT NULL DEFAULT 1,
        ShowCustomer BIT NOT NULL DEFAULT 0,
        ShowItemNote BIT NOT NULL DEFAULT 1,
        ShowQrCode BIT NOT NULL DEFAULT 1,
        QrType NVARCHAR(20) NOT NULL DEFAULT 'vietqr',
        CustomQrUrl NVARCHAR(500) NULL,
        IsDefault BIT NOT NULL DEFAULT 1,
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
      );
      PRINT 'Created table PosReceiptTemplates';
    END
  `);

  // 7. PosPaymentSettings
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PosPaymentSettings')
    BEGIN
      CREATE TABLE PosPaymentSettings (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        BankBin NVARCHAR(20) NOT NULL DEFAULT '970422',
        BankName NVARCHAR(100) NOT NULL DEFAULT 'MBBank',
        AccountNumber NVARCHAR(50) NOT NULL DEFAULT '0988123456',
        AccountHolder NVARCHAR(150) NOT NULL DEFAULT 'CHUM CHUM BAKERY',
        QrPrefix NVARCHAR(20) NOT NULL DEFAULT 'CCB',
        WebhookSecret NVARCHAR(255) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
      );
      PRINT 'Created table PosPaymentSettings';
    END
  `);

  // 8. Seed default data if empty
  const floorCount = await pool.request().query('SELECT COUNT(*) as cnt FROM PosFloors');
  if (floorCount.recordset[0].cnt === 0) {
    console.log('Seeding initial floors and tables...');
    await pool.request().query(`
      INSERT INTO PosFloors (Name, SortOrder) VALUES 
      (N'Tầng 1 (Quầy bánh)', 1),
      (N'Tầng 2 (Ngồi lại)', 2),
      (N'Mang về & Đặt trước', 3);
    `);

    const f1 = await pool.request().query("SELECT Id FROM PosFloors WHERE Name LIKE N'%Tầng 1%'");
    const f2 = await pool.request().query("SELECT Id FROM PosFloors WHERE Name LIKE N'%Tầng 2%'");
    const f3 = await pool.request().query("SELECT Id FROM PosFloors WHERE Name LIKE N'%Mang về%'");

    const f1Id = f1.recordset[0].Id;
    const f2Id = f2.recordset[0].Id;
    const f3Id = f3.recordset[0].Id;

    await pool.request().query(`
      INSERT INTO PosTables (FloorId, Code, Name, Capacity, SortOrder) VALUES
      (${f1Id}, 'B01', N'Bàn 01', 2, 1),
      (${f1Id}, 'B02', N'Bàn 02', 2, 2),
      (${f1Id}, 'B03', N'Bàn 03', 4, 3),
      (${f1Id}, 'B04', N'Bàn 04', 4, 4),
      (${f1Id}, 'B05', N'Bàn 05', 6, 5),
      (${f1Id}, 'B06', N'Bàn 06', 4, 6),

      (${f2Id}, 'T201', N'Bàn 201', 4, 1),
      (${f2Id}, 'T202', N'Bàn 202', 4, 2),
      (${f2Id}, 'T203', N'Bàn 203', 4, 3),
      (${f2Id}, 'T204', N'Bàn 204', 6, 4),
      (${f2Id}, 'T205', N'Bàn 205', 2, 5),
      (${f2Id}, 'T206', N'Bàn 206', 8, 6),

      (${f3Id}, 'MV01', N'Mang về 01', 1, 1),
      (${f3Id}, 'MV02', N'Mang về 02', 1, 2),
      (${f3Id}, 'MV03', N'Mang về 03', 1, 3);
    `);
    console.log('Seeded default floors and tables!');
  }

  // Seed default Receipt Template if empty
  const tplCount = await pool.request().query('SELECT COUNT(*) as cnt FROM PosReceiptTemplates');
  if (tplCount.recordset[0].cnt === 0) {
    console.log('Seeding default Receipt Template...');
    await pool.request().query(`
      INSERT INTO PosReceiptTemplates (TemplateName, PaperSize, ShopName, ShopAddress, ShopPhone, WifiInfo, HeaderTitle, FooterMessage)
      VALUES (N'Mẫu in chuẩn K80', 'k80', N'CHUM CHUM BAKERY', N'Số 18 Ngõ 120 Trần Cung, Cầu Giấy, Hà Nội', N'0988.123.456', N'WiFi: ChumChum / Pass: chumchum68', N'PHIẾU THANH TOÁN', N'Cảm ơn Quý khách & Hẹn gặp lại!');
    `);
  }

  // Seed default PosPaymentSettings if empty
  const payCount = await pool.request().query('SELECT COUNT(*) as cnt FROM PosPaymentSettings');
  if (payCount.recordset[0].cnt === 0) {
    console.log('Seeding default VietQR settings...');
    await pool.request().query(`
      INSERT INTO PosPaymentSettings (BankBin, BankName, AccountNumber, AccountHolder, QrPrefix)
      VALUES ('970422', 'MBBank', '0988123456', 'TIEM BANH CHUM CHUM', 'CCB');
    `);
  }

  console.log('POS Database Migration Completed Successfully!');
  await pool.close();
}

migrate().catch((err) => {
  console.error('Migration Error:', err);
  process.exit(1);
});
