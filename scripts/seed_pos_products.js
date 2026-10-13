const sql = require('mssql');

const config = {
  user: process.env.MSSQL_USER || 'chumchum_app',
  password: process.env.MSSQL_PASSWORD || 'Chumchum123@',
  server: process.env.MSSQL_SERVER || '103.163.214.101',
  database: process.env.MSSQL_DATABASE || 'ChumChumDB',
  options: { encrypt: true, trustServerCertificate: true },
};

const items = [
  { code: 'BM_CROISSANT', name: 'Bánh Croissant Bơ Pháp', cat: 'Bánh tươi & Mì', unit: 'cái', cost: 15000, price: 35000, qty: 50 },
  { code: 'BM_HOACUC', name: 'Bánh Mì Hoa Cúc Chum Chum', cat: 'Bánh tươi & Mì', unit: 'ổ', cost: 28000, price: 65000, qty: 30 },
  { code: 'BM_BOTOI', name: 'Bánh Mì Bơ Tỏi Phô Mai', cat: 'Bánh tươi & Mì', unit: 'cái', cost: 18000, price: 42000, qty: 40 },
  { code: 'BN_SUKEM', name: 'Bánh Su Kem Vani (Hộp 6c)', cat: 'Bánh ngọt', unit: 'hộp', cost: 20000, price: 45000, qty: 60 },
  { code: 'BN_TIRAMISU', name: 'Bánh Tiramisu Hũ Thủy Tinh', cat: 'Bánh ngọt', unit: 'hũ', cost: 22000, price: 48000, qty: 35 },
  { code: 'BN_MOUSSE_DAU', name: 'Bánh Mousse Dâu Tây', cat: 'Bánh ngọt', unit: 'miếng', cost: 19000, price: 45000, qty: 40 },
  { code: 'BN_RED_VELVET', name: 'Bánh Red Velvet Cream Cheese', cat: 'Bánh ngọt', unit: 'miếng', cost: 22000, price: 50000, qty: 25 },
  { code: 'BN_BLTM', name: 'Bông Lan Trứng Muối Sốt Phô Mai', cat: 'Bánh ngọt', unit: 'hộp', cost: 30000, price: 65000, qty: 50 },
  { code: 'BN_DONUT', name: 'Bánh Donut Socola Rắc Hạt', cat: 'Bánh ngọt', unit: 'cái', cost: 10000, price: 25000, qty: 45 },
  { code: 'BN_TART_TRUNG', name: 'Bánh Tart Trứng Bồ Đào Nha', cat: 'Bánh ngọt', unit: 'cái', cost: 9000, price: 22000, qty: 80 },
  { code: 'BK_BAP_MINI', name: 'Bánh Kem Bắp Mini (Size 12cm)', cat: 'Bánh kem', unit: 'cái', cost: 55000, price: 120000, qty: 15 },
  { code: 'BK_CHOCO_16', name: 'Bánh Kem Socola Trái Cây (16cm)', cat: 'Bánh kem', unit: 'cái', cost: 95000, price: 220000, qty: 10 },
  { code: 'DU_CAFE_MUOI', name: 'Cà Phê Muối Kem Béo Chum Chum', cat: 'Đồ uống', unit: 'ly', cost: 12000, price: 35000, qty: 100 },
  { code: 'DU_BAC_XIU', name: 'Bạc Xỉu Sữa Dừa Đá', cat: 'Đồ uống', unit: 'ly', cost: 11000, price: 32000, qty: 100 },
  { code: 'DU_TRA_DAO', name: 'Trà Đào Cam Sả Tươi', cat: 'Đồ uống', unit: 'ly', cost: 14000, price: 39000, qty: 100 },
  { code: 'DU_TRA_SUA', name: 'Trà Sữa Nướng Trân Châu Hoàng Kim', cat: 'Đồ uống', unit: 'ly', cost: 15000, price: 42000, qty: 100 },
  { code: 'DU_CAM_TUOI', name: 'Nước Ép Cam Tươi Nguyên Chất', cat: 'Đồ uống', unit: 'ly', cost: 16000, price: 40000, qty: 100 },
];

async function seed() {
  const pool = await sql.connect(config);
  for (const it of items) {
    const existing = await pool.request().query(`SELECT Id FROM Products WHERE Code = '${it.code}' OR Name = N'${it.name}'`);
    if (existing.recordset.length === 0) {
      await pool.request().query(`
        INSERT INTO Products (Code, Name, Category, Unit, CostPrice, SellPrice, StockQty, MinStock, IsActive)
        VALUES ('${it.code}', N'${it.name}', N'${it.cat}', N'${it.unit}', ${it.cost}, ${it.price}, ${it.qty}, 5, 1)
      `);
      console.log('Inserted: ' + it.name);
    }
  }
  console.log('Seeded POS menu products successfully!');
  await pool.close();
}

seed().catch(console.error);
