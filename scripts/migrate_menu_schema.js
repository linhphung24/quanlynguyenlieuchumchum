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
  console.log('Connected! Creating Menu & Recipe tables if not exist...');

  // 1. PosMenuItems table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PosMenuItems')
    BEGIN
      CREATE TABLE PosMenuItems (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(50) NOT NULL UNIQUE,
        Name NVARCHAR(255) NOT NULL,
        Category NVARCHAR(100) NOT NULL DEFAULT N'Bánh ngọt',
        Unit NVARCHAR(50) NOT NULL DEFAULT N'cái',
        Price DECIMAL(18,2) NOT NULL DEFAULT 0,
        CostPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
        ImageUrl NVARCHAR(500) NULL,
        Description NVARCHAR(MAX) NULL,
        RecipeId INT NULL FOREIGN KEY REFERENCES Recipes(Id),
        IsActive BIT NOT NULL DEFAULT 1,
        SortOrder INT NOT NULL DEFAULT 0,
        CreatedBy NVARCHAR(100) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedBy NVARCHAR(100) NULL,
        UpdatedAt DATETIME2 NULL
      );
      PRINT 'Created table PosMenuItems';
    END
  `);

  // 2. PosMenuItemRecipes table (Định mức nguyên vật liệu cho từng món)
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PosMenuItemRecipes')
    BEGIN
      CREATE TABLE PosMenuItemRecipes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        MenuItemId INT NOT NULL FOREIGN KEY REFERENCES PosMenuItems(Id) ON DELETE CASCADE,
        ProductId INT NULL,
        ProductName NVARCHAR(255) NOT NULL,
        Amount DECIMAL(18,4) NOT NULL DEFAULT 0,
        Unit NVARCHAR(50) NOT NULL DEFAULT 'g',
        CostPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
        Note NVARCHAR(255) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
      );
      PRINT 'Created table PosMenuItemRecipes';
    END
  `);

  // 3. Alter PosOrders to add ExportInvoiceId if not exists
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PosOrders') AND name = 'ExportInvoiceId')
    BEGIN
      ALTER TABLE PosOrders ADD ExportInvoiceId INT NULL;
      PRINT 'Added column ExportInvoiceId to PosOrders';
    END
  `);

  // 4. Alter PosOrderDetails to add MenuItemId if not exists
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PosOrderDetails') AND name = 'MenuItemId')
    BEGIN
      ALTER TABLE PosOrderDetails ADD MenuItemId INT NULL;
      PRINT 'Added column MenuItemId to PosOrderDetails';
    END
  `);

  // 5. Check if foreign key constraint on PosOrderDetails.ProductId exists and drop it to prevent conflicts
  const fkRes = await pool.request().query(`
    SELECT f.name AS FkName
    FROM sys.foreign_keys AS f
    INNER JOIN sys.foreign_key_columns AS fc ON f.object_id = fc.constraint_object_id
    INNER JOIN sys.tables AS t ON f.parent_object_id = t.object_id
    INNER JOIN sys.columns AS c ON fc.parent_object_id = c.object_id AND fc.parent_column_id = c.column_id
    WHERE t.name = 'PosOrderDetails' AND c.name = 'ProductId';
  `);
  if (fkRes.recordset.length > 0) {
    for (const row of fkRes.recordset) {
      console.log('Dropping FK constraint ' + row.FkName + ' from PosOrderDetails.ProductId...');
      await pool.request().query(`ALTER TABLE PosOrderDetails DROP CONSTRAINT [${row.FkName}]`);
    }
  }

  // 6. Seed initial Menu items if empty
  const countRes = await pool.request().query('SELECT COUNT(*) as cnt FROM PosMenuItems');
  if (countRes.recordset[0].cnt === 0) {
    console.log('Seeding initial Menu Bánh & Đồ uống...');
    
    // Initial menu items
    const menuItems = [
      { code: 'BM_CROISSANT', name: 'Bánh Croissant Bơ Pháp', cat: 'Bánh tươi & Mì', unit: 'cái', price: 35000, cost: 15000, desc: 'Bánh sừng bò ngàn lớp thơm lừng bơ Pháp cao cấp' },
      { code: 'BM_HOACUC', name: 'Bánh Mì Hoa Cúc Chum Chum', cat: 'Bánh tươi & Mì', unit: 'ổ', price: 65000, cost: 28000, desc: 'Bánh mì hoa cúc mềm mịn thơm hương hoa cam' },
      { code: 'BM_BOTOI', name: 'Bánh Mì Bơ Tỏi Phô Mai', cat: 'Bánh tươi & Mì', unit: 'cái', price: 42000, cost: 18000, desc: 'Bánh mì giòn vỏ đẫm sốt bơ tỏi và kem phô mai' },
      { code: 'BN_SUKEM', name: 'Bánh Su Kem Vani (Hộp 6c)', cat: 'Bánh ngọt', unit: 'hộp', price: 45000, cost: 20000, desc: 'Vỏ bánh mỏng giòn, nhân kem custard vani béo ngậy' },
      { code: 'BN_TIRAMISU', name: 'Bánh Tiramisu Hũ Thủy Tinh', cat: 'Bánh ngọt', unit: 'hũ', price: 48000, cost: 22000, desc: 'Lớp kem mascarpone hòa quyện cà phê espresso thơm đậm' },
      { code: 'BN_MOUSSE_DAU', name: 'Bánh Mousse Dâu Tây', cat: 'Bánh ngọt', unit: 'miếng', price: 45000, cost: 19000, desc: 'Mousse chua ngọt thanh mát với mứt dâu tây tươi' },
      { code: 'BN_RED_VELVET', name: 'Bánh Red Velvet Cream Cheese', cat: 'Bánh ngọt', unit: 'miếng', price: 50000, cost: 22000, desc: 'Cốt bánh nhung đỏ mềm mịn kèm kem phô mai đặc trưng' },
      { code: 'BN_BLTM', name: 'Bông Lan Trứng Muối Sốt Phô Mai', cat: 'Bánh ngọt', unit: 'hộp', price: 65000, cost: 30000, desc: 'Cốt bông lan mềm kết hợp chà bông gà, trứng muối và sốt phô mai chảy' },
      { code: 'BN_DONUT', name: 'Bánh Donut Socola Rắc Hạt', cat: 'Bánh ngọt', unit: 'cái', price: 25000, cost: 10000, desc: 'Bánh donut phủ socola đen Bỉ rắc hạnh nhân lát' },
      { code: 'BN_TART_TRUNG', name: 'Bánh Tart Trứng Bồ Đào Nha', cat: 'Bánh ngọt', unit: 'cái', price: 22000, cost: 9000, desc: 'Vỏ tart ngàn lớp giòn rụm với nhân trứng nướng caramel thơm nức' },
      { code: 'BK_BAP_MINI', name: 'Bánh Kem Bắp Mini (Size 12cm)', cat: 'Bánh kem', unit: 'cái', price: 120000, cost: 55000, desc: 'Bánh kem bắp ngọt thanh, cốt gato xốp mềm cùng kem bắp thơm lừng' },
      { code: 'BK_CHOCO_16', name: 'Bánh Kem Socola Trái Cây (16cm)', cat: 'Bánh kem', unit: 'cái', price: 220000, cost: 95000, desc: 'Bánh sinh nhật socola phủ ganache và trái cây tươi theo mùa' },
      { code: 'DU_CAFE_MUOI', name: 'Cà Phê Muối Kem Béo Chum Chum', cat: 'Cà phê', unit: 'ly', price: 35000, cost: 12000, desc: 'Cà phê pha phin truyền thống phủ lớp kem muối béo mặn hài hòa' },
      { code: 'DU_BAC_XIU', name: 'Bạc Xỉu Sữa Dừa Đá', cat: 'Cà phê', unit: 'ly', price: 32000, cost: 11000, desc: 'Cà phê sữa pha cốt dừa thơm béo, đậm đà' },
      { code: 'DU_TRA_DAO', name: 'Trà Đào Cam Sả Tươi', cat: 'Trà & Trà sữa', unit: 'ly', price: 39000, cost: 14000, desc: 'Trà đen đậm vị kết hợp đào miếng giòn ngọt, cam vàng và sả tươi' },
      { code: 'DU_TRA_SUA', name: 'Trà Sữa Nướng Trân Châu Hoàng Kim', cat: 'Trà & Trà sữa', unit: 'ly', price: 42000, cost: 15000, desc: 'Trà sữa ô long nướng thơm khói kèm trân châu hoàng kim dai giòn' },
      { code: 'DU_CAM_TUOI', name: 'Nước Ép Cam Tươi Nguyên Chất', cat: 'Nước ép', unit: 'ly', price: 40000, cost: 16000, desc: 'Cam sành vắt tươi 100%, bổ sung vitamin C tự nhiên' },
    ];

    for (let i = 0; i < menuItems.length; i++) {
      const it = menuItems[i];
      const insertItemSql = `
        INSERT INTO PosMenuItems (Code, Name, Category, Unit, Price, CostPrice, Description, IsActive, SortOrder, CreatedBy, CreatedAt)
        OUTPUT INSERTED.Id
        VALUES (@Code, @Name, @Category, @Unit, @Price, @CostPrice, @Description, 1, @SortOrder, 'system', GETDATE())
      `;
      const res = await pool.request()
        .input('Code', sql.NVarChar(50), it.code)
        .input('Name', sql.NVarChar(255), it.name)
        .input('Category', sql.NVarChar(100), it.cat)
        .input('Unit', sql.NVarChar(50), it.unit)
        .input('Price', sql.Decimal(18, 2), it.price)
        .input('CostPrice', sql.Decimal(18, 2), it.cost)
        .input('Description', sql.NVarChar(sql.MAX), it.desc)
        .input('SortOrder', sql.Int, i + 1)
        .query(insertItemSql);

      const newItemId = res.recordset[0].Id;

      // Sample BOM/recipes for popular items if matching materials exist in Products table
      if (it.code === 'DU_CAFE_MUOI') {
        // Find cafe or milk in Products
        const prodMatch = await pool.request().query("SELECT TOP 1 Id, Name, Unit, CostPrice FROM Products WHERE Name LIKE N'%cà phê%' OR Name LIKE N'%cafe%' OR Name LIKE N'%sữa%'");
        if (prodMatch.recordset.length > 0) {
          const p = prodMatch.recordset[0];
          await pool.request().query(`
            INSERT INTO PosMenuItemRecipes (MenuItemId, ProductId, ProductName, Amount, Unit, CostPrice, Note)
            VALUES (${newItemId}, ${p.Id}, N'${p.Name.replace(/'/g, "''")}', 0.03, N'${p.Unit || 'kg'}', ${p.CostPrice || 0}, N'Định mức cốt cà phê')
          `);
        }
      } else if (it.code === 'DU_TRA_DAO') {
        const prodMatch = await pool.request().query("SELECT TOP 1 Id, Name, Unit, CostPrice FROM Products WHERE Name LIKE N'%trà%' OR Name LIKE N'%đào%'");
        if (prodMatch.recordset.length > 0) {
          const p = prodMatch.recordset[0];
          await pool.request().query(`
            INSERT INTO PosMenuItemRecipes (MenuItemId, ProductId, ProductName, Amount, Unit, CostPrice, Note)
            VALUES (${newItemId}, ${p.Id}, N'${p.Name.replace(/'/g, "''")}', 0.05, N'${p.Unit || 'kg'}', ${p.CostPrice || 0}, N'Định mức trà đào')
          `);
        }
      } else if (it.code === 'BM_CROISSANT') {
        const prodMatch = await pool.request().query("SELECT TOP 1 Id, Name, Unit, CostPrice FROM Products WHERE Name LIKE N'%bơ%' OR Name LIKE N'%bột%'");
        if (prodMatch.recordset.length > 0) {
          const p = prodMatch.recordset[0];
          await pool.request().query(`
            INSERT INTO PosMenuItemRecipes (MenuItemId, ProductId, ProductName, Amount, Unit, CostPrice, Note)
            VALUES (${newItemId}, ${p.Id}, N'${p.Name.replace(/'/g, "''")}', 0.04, N'${p.Unit || 'kg'}', ${p.CostPrice || 0}, N'Bơ cán croissant')
          `);
        }
      }
    }
    console.log('Seeded ' + menuItems.length + ' menu items successfully!');
  }

  console.log('Menu migration completed successfully!');
  await pool.close();
}

migrate().catch((err) => {
  console.error('Migration Error:', err);
  process.exit(1);
});
