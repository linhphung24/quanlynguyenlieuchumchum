/**
 * SCRIPT CHUYỂN ĐỔI DỮ LIỆU TỪ SUPABASE (POSTGRESQL) SANG MICROSOFT SQL SERVER
 * Hướng dẫn chạy:
 * 1. Chạy script tạo CSDL d:\source_code\quanlynguyenlieuchumchum_new\sqlserver\ChumChumBakery_SQLServer.sql trong SSMS
 * 2. Cài mssql: npm install mssql
 * 3. Chạy node script: node sqlserver/migrate_data.js
 */

const { createClient } = require('@supabase/supabase-js');
const sql = require('mssql');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/) || env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const key = keyMatch ? keyMatch[1].trim() : '';
const sb = createClient(url, key);

const sqlConfig = {
  user: 'sa',
  password: 'chumchum123',
  server: 'localhost\\SQLEXPRESS',
  database: 'ChumChumDB',
  options: {
    trustServerCertificate: true
  }
};

async function fetchAll(table) {
  let allData = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await sb.from(table).select('*').range(from, from + step - 1);
    if (error) {
      console.error(`Lỗi fetch ${table}:`, error);
      break;
    }
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return allData;
}

async function migrate() {
  console.log('=== BẮT ĐẦU CHUYỂN ĐỔI DỮ LIỆU SANG SQL SERVER ===');
  
  let pool;
  try {
    pool = await sql.connect(sqlConfig);
    console.log('Kết nối thành công đến SQL Server (ChumChumDB).');
  } catch (err) {
    console.error('Lỗi kết nối SQL Server:', err);
    return;
  }
  
  console.log('0. Xóa dữ liệu cũ trong SQL Server để tránh lỗi trùng lặp...');
  try {
    await pool.request().query(`
      DELETE FROM BatchDeductions;
      DELETE FROM Batches;
      DELETE FROM InvoiceDetails;
      DELETE FROM Invoices;
      DELETE FROM Products;
    `);
    console.log('Đã làm sạch database SQL Server thành công.');
  } catch (err) {
    console.error('Lỗi khi làm sạch dữ liệu cũ (có thể table chưa có hoặc lỗi khóa ngoại):', err.message);
  }
  
  // 1. Migrate Products
  console.log('1. Migrating Products...');
  const products = await fetchAll('products');
  console.log(`Fetched ${products?.length || 0} products from Supabase.`);
  
  const seenProductNames = new Set();
  
  if (products && products.length > 0) {
    for (const p of products) {
      const request = pool.request();
      request.input('Id', sql.Int, p.id);
      request.input('Code', sql.NVarChar, p.code || null);
      
      let pName = p.name;
      let pCount = 1;
      while (seenProductNames.has(pName.toLowerCase())) {
        pName = `${p.name} (dup ${pCount})`;
        pCount++;
      }
      seenProductNames.add(pName.toLowerCase());
      
      request.input('Name', sql.NVarChar, pName);
      request.input('Category', sql.NVarChar, p.category);
      request.input('Unit', sql.NVarChar, p.unit);
      request.input('CostPrice', sql.Decimal(18,2), p.cost_price || 0);
      request.input('SellPrice', sql.Decimal(18,2), p.sell_price || 0);
      request.input('StockQty', sql.Decimal(18,2), p.stock_qty || 0);
      request.input('MinStock', sql.Decimal(18,2), p.min_stock || 0);
      request.input('Supplier', sql.NVarChar, p.supplier || '');
      request.input('Description', sql.NVarChar, p.description || null);
      request.input('IsActive', sql.Bit, p.is_active);
      request.input('CreatedBy', sql.NVarChar, p.created_by || '');
      request.input('UpdatedBy', sql.NVarChar, p.updated_by || null);
      request.input('CreatedAt', sql.DateTime2, p.created_at ? new Date(p.created_at) : new Date());
      request.input('UpdatedAt', sql.DateTime2, p.updated_at ? new Date(p.updated_at) : null);
      
      try {
        await request.query(`
          SET IDENTITY_INSERT Products ON;
          INSERT INTO Products (Id, Code, Name, Category, Unit, CostPrice, SellPrice, StockQty, MinStock, Supplier, Description, IsActive, CreatedBy, UpdatedBy, CreatedAt, UpdatedAt)
          VALUES (@Id, @Code, @Name, @Category, @Unit, @CostPrice, @SellPrice, @StockQty, @MinStock, @Supplier, @Description, @IsActive, @CreatedBy, @UpdatedBy, @CreatedAt, @UpdatedAt);
          SET IDENTITY_INSERT Products OFF;
        `);
      } catch (e) {
        console.error(`Lỗi thêm Product ${pName}:`, e.message);
      }
    }
  }

  // 2. Migrate Invoices & InvoiceDetails
  console.log('2. Migrating Invoices & InvoiceDetails...');
  const invoices = await fetchAll('invoices');
  console.log(`Fetched ${invoices?.length || 0} invoices from Supabase.`);
  
  const seenInvoiceCodes = new Set();
  
  if (invoices && invoices.length > 0) {
    for (const inv of invoices) {
      const request = pool.request();
      request.input('Id', sql.Int, inv.id);
      request.input('Type', sql.NVarChar, inv.type);
      request.input('InvDate', sql.Date, inv.inv_date);
      
      let invCode = inv.code;
      let iCount = 1;
      while (seenInvoiceCodes.has(invCode.toLowerCase())) {
        invCode = `${inv.code}_DUP${iCount}`;
        iCount++;
      }
      seenInvoiceCodes.add(invCode.toLowerCase());
      
      request.input('Code', sql.NVarChar, invCode);
      request.input('Partner', sql.NVarChar, inv.partner || '');
      request.input('Note', sql.NVarChar, inv.note || null);
      request.input('ImageUrl', sql.NVarChar, inv.image_url || null);
      request.input('CreatedBy', sql.NVarChar, inv.created_by || '');
      request.input('UpdatedBy', sql.NVarChar, inv.updated_by || null);
      request.input('CreatedAt', sql.DateTime2, inv.created_at ? new Date(inv.created_at) : new Date());
      request.input('UpdatedAt', sql.DateTime2, inv.updated_at ? new Date(inv.updated_at) : null);
      
      try {
        await request.query(`
          SET IDENTITY_INSERT Invoices ON;
          INSERT INTO Invoices (Id, Type, InvDate, Code, Partner, Note, ImageUrl, CreatedBy, UpdatedBy, CreatedAt, UpdatedAt)
          VALUES (@Id, @Type, @InvDate, @Code, @Partner, @Note, @ImageUrl, @CreatedBy, @UpdatedBy, @CreatedAt, @UpdatedAt);
          SET IDENTITY_INSERT Invoices OFF;
        `);
      } catch (e) {
        console.error(`Lỗi thêm Invoice ${invCode}:`, e.message);
      }
      
      if (inv.items && Array.isArray(inv.items)) {
        for (const item of inv.items) {
          const itemReq = pool.request();
          itemReq.input('InvoiceId', sql.Int, inv.id);
          itemReq.input('ProductName', sql.NVarChar, item.name || 'Sản phẩm xuất/Không tên');
          itemReq.input('Unit', sql.NVarChar, item.unit || 'kg');
          
          const amount = item.amount || item.qty || 0;
          const price = item.price || 0;
          
          itemReq.input('Amount', sql.Decimal(18,2), amount);
          itemReq.input('Price', sql.Decimal(18,2), price);
          itemReq.input('Subtotal', sql.Decimal(18,2), amount * price);
          itemReq.input('MfgDate', sql.Date, item.mfg_date ? new Date(item.mfg_date) : null);
          itemReq.input('ExpDate', sql.Date, item.exp_date ? new Date(item.exp_date) : null);
          
          try {
            await itemReq.query(`
              INSERT INTO InvoiceDetails (InvoiceId, ProductName, Unit, Amount, Price, Subtotal, MfgDate, ExpDate)
              VALUES (@InvoiceId, @ProductName, @Unit, @Amount, @Price, @Subtotal, @MfgDate, @ExpDate)
            `);
          } catch (e) {
             console.error(`Lỗi thêm chi tiết hóa đơn (Invoice: ${inv.id}):`, e.message);
          }
        }
      }
    }
  }

  // 3. Migrate Batches
  console.log('3. Migrating Batches...');
  const batches = await fetchAll('batches');
  console.log(`Fetched ${batches?.length || 0} batches from Supabase.`);
  
  if (batches && batches.length > 0) {
    for (const b of batches) {
      const request = pool.request();
      request.input('Id', sql.Int, b.id);
      request.input('ProductName', sql.NVarChar, b.product_name);
      request.input('InvoiceId', sql.Int, b.inv_id);
      request.input('InvoiceCode', sql.NVarChar, b.inv_code || '');
      request.input('InvoiceDate', sql.Date, b.inv_date);
      request.input('Quantity', sql.Decimal(18,2), b.quantity || 0);
      request.input('RemainingQty', sql.Decimal(18,2), b.remaining_qty || 0);
      request.input('Price', sql.Decimal(18,2), b.price || 0);
      request.input('Unit', sql.NVarChar, b.unit || 'kg');
      request.input('MfgDate', sql.Date, b.mfg_date ? new Date(b.mfg_date) : null);
      request.input('ExpDate', sql.Date, b.exp_date ? new Date(b.exp_date) : null);
      request.input('CreatedAt', sql.DateTime2, b.created_at ? new Date(b.created_at) : new Date());
      
      try {
        await request.query(`
          SET IDENTITY_INSERT Batches ON;
          INSERT INTO Batches (Id, ProductName, InvoiceId, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price, Unit, MfgDate, ExpDate, CreatedAt)
          VALUES (@Id, @ProductName, @InvoiceId, @InvoiceCode, @InvoiceDate, @Quantity, @RemainingQty, @Price, @Unit, @MfgDate, @ExpDate, @CreatedAt);
          SET IDENTITY_INSERT Batches OFF;
        `);
      } catch (e) {
        console.error(`Lỗi thêm Batch ${b.id}:`, e.message);
      }
    }
  }

  console.log('=== CHUYỂN ĐỔI DỮ LIỆU HOÀN TẤT ===');
  await pool.close();
}

migrate();
