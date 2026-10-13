/**
 * Chum Chum Bakery - Script Xóa dữ liệu Hóa đơn & Kho (Giữ nguyên Nhà cung cấp, Tài khoản, Sản phẩm)
 *
 * Cách sử dụng:
 *   1. Xem trước số liệu (không xóa gì):
 *      node scripts/purge_stock_and_invoices.js --dry-run
 *
 *   2. Thực hiện xóa toàn bộ hóa đơn & kho:
 *      node scripts/purge_stock_and_invoices.js --execute
 *
 *   3. Chỉ xóa hóa đơn cũ trước một ngày nhất định (ví dụ trước ngày 01/10/2026):
 *      node scripts/purge_stock_and_invoices.js --execute --before 2026-10-01
 *
 *   4. Phục hồi lại dữ liệu từ bản backup gần nhất:
 *      node scripts/purge_stock_and_invoices.js --restore
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Đọc file .env.local nếu có
const envPath = path.resolve(process.cwd(), '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [k, ...v] = trimmed.split('=');
      if (k) env[k.trim()] = v.join('=').trim();
    }
  });
}

const config = {
  user: process.env.MSSQL_USER || env.MSSQL_USER || 'chumchum_app',
  password: process.env.MSSQL_PASSWORD || env.MSSQL_PASSWORD || 'Chumchum123@',
  server: process.env.MSSQL_SERVER || env.MSSQL_SERVER || '103.163.214.101',
  database: process.env.MSSQL_DATABASE || env.MSSQL_DATABASE || 'ChumChumDB',
  options: {
    encrypt: (process.env.MSSQL_ENCRYPT || env.MSSQL_ENCRYPT) !== 'false',
    trustServerCertificate: true,
    connectTimeout: 15000,
    requestTimeout: 60000,
  }
};

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || (!args.includes('--execute') && !args.includes('--restore'));
const isRestore = args.includes('--restore');
const beforeIndex = args.indexOf('--before');
const beforeDate = beforeIndex !== -1 && args[beforeIndex + 1] ? args[beforeIndex + 1] : null;

function getTodayStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

async function main() {
  console.log('================================================================');
  console.log(' CHUM CHUM BAKERY - QUẢN LÝ DỮ LIỆU KHO & HÓA ĐƠN');
  console.log('================================================================');
  console.log(`Kết nối máy chủ: ${config.server} | CSDL: ${config.database}`);

  let pool;
  try {
    pool = await sql.connect(config);
  } catch (err) {
    console.error('Lỗi kết nối cơ sở dữ liệu:', err.message);
    process.exit(1);
  }

  try {
    if (isRestore) {
      await handleRestore(pool);
      return;
    }

    if (isDryRun) {
      await handleDryRun(pool);
      return;
    }

    await handleExecute(pool);
  } catch (err) {
    console.error('Có lỗi xảy ra trong quá trình xử lý:', err);
  } finally {
    await pool.close();
  }
}

async function handleDryRun(pool) {
  console.log('\n[CHẾ ĐỘ XEM TRƯỚC - DRY RUN] (Chưa có dữ liệu nào bị thay đổi)\n');

  const stats = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM Invoices WHERE Id > 0) AS InvoicesCount,
      (SELECT COUNT(*) FROM InvoiceDetails) AS InvoiceDetailsCount,
      (SELECT COUNT(*) FROM Batches) AS BatchesCount,
      (SELECT COUNT(*) FROM BatchDeductions) AS BatchDeductionsCount,
      (SELECT COUNT(*) FROM StockOpeningAdj) AS StockOpeningAdjCount,
      (SELECT COUNT(*) FROM Suppliers) AS SuppliersCount,
      (SELECT COUNT(*) FROM Users) AS UsersCount,
      (SELECT COUNT(*) FROM Products) AS ProductsCount,
      (SELECT COUNT(*) FROM Recipes) AS RecipesCount
  `);
  const row = stats.recordset[0];

  console.log('----------------------------------------------------------------');
  console.log('1. CÁC DỮ LIỆU SẼ ĐƯỢC XÓA (KHO & HÓA ĐƠN):');
  console.log(`   - Hóa đơn (Invoices):           ${row.InvoicesCount} chứng từ (giữ lại dummy Id=0)`);
  console.log(`   - Chi tiết hóa đơn (Details):   ${row.InvoiceDetailsCount} dòng`);
  console.log(`   - Lô hàng FIFO (Batches):       ${row.BatchesCount} lô`);
  console.log(`   - Trừ lô FIFO (Deductions):     ${row.BatchDeductionsCount} lượt`);
  console.log(`   - Khai báo tồn đầu (Opening):   ${row.StockOpeningAdjCount} dòng`);
  if (beforeDate) {
    const beforeCount = await pool.request()
      .input('BeforeDate', sql.Date, beforeDate)
      .query('SELECT COUNT(*) AS Cnt FROM Invoices WHERE Id > 0 AND InvDate < @BeforeDate');
    console.log(`   * Lưu ý: Đang đặt lọc --before ${beforeDate} => Sẽ xóa ${beforeCount.recordset[0].Cnt} HĐ trước ngày này.`);
  }

  console.log('\n2. CÁC DỮ LIỆU ĐƯỢC BẢO TỒN NGUYÊN VẸN 100%:');
  console.log(`   - Nhà cung cấp (Suppliers):     ${row.SuppliersCount} đối tác (GIỮ NGUYÊN)`);
  console.log(`   - Tài khoản đăng nhập (Users):  ${row.UsersCount} người dùng (GIỮ NGUYÊN)`);
  console.log(`   - Danh mục NVL / Hàng hóa:      ${row.ProductsCount} mặt hàng (GIỮ NGUYÊN danh mục, tồn kho tự động về 0)`);
  console.log(`   - Công thức bánh (Recipes):     ${row.RecipesCount} công thức (GIỮ NGUYÊN)`);
  console.log('----------------------------------------------------------------');
  console.log('\nĐể thực hiện xóa chính thức (tự động sao lưu trước khi xóa), chạy lệnh:');
  console.log('   node scripts/purge_stock_and_invoices.js --execute\n');
}

async function handleExecute(pool) {
  const stamp = getTodayStamp();
  console.log(`\n[THỰC HIỆN XÓA CHÍNH THỨC] - Ngày thực hiện: ${stamp}`);
  console.log('Đang bắt đầu giao dịch và tự động sao lưu dữ liệu...\n');

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const request = new sql.Request(transaction);

    // Bước 1: Sao lưu sang các bảng backup
    const bakInvoices = `Invoices_Bak_${stamp}`;
    const bakDetails = `InvoiceDetails_Bak_${stamp}`;
    const bakBatches = `Batches_Bak_${stamp}`;
    const bakDeductions = `BatchDeductions_Bak_${stamp}`;
    const bakOpening = `StockOpeningAdj_Bak_${stamp}`;

    await request.query(`
      IF OBJECT_ID('${bakInvoices}') IS NULL
        SELECT * INTO [${bakInvoices}] FROM Invoices;
      IF OBJECT_ID('${bakDetails}') IS NULL
        SELECT * INTO [${bakDetails}] FROM InvoiceDetails;
      IF OBJECT_ID('${bakBatches}') IS NULL
        SELECT * INTO [${bakBatches}] FROM Batches;
      IF OBJECT_ID('${bakDeductions}') IS NULL
        SELECT * INTO [${bakDeductions}] FROM BatchDeductions;
      IF OBJECT_ID('${bakOpening}') IS NULL
        SELECT * INTO [${bakOpening}] FROM StockOpeningAdj;
    `);
    console.log(`+ Bước 1: Đã sao lưu dữ liệu sang các bảng dự phòng *_Bak_${stamp}`);

    // Bước 2: Đếm số lượng trước khi xóa
    const countRes = await request.query(`
      SELECT 
        (SELECT COUNT(*) FROM Invoices WHERE Id > 0) AS InvCount,
        (SELECT COUNT(*) FROM InvoiceDetails) AS DetCount,
        (SELECT COUNT(*) FROM Batches) AS BatCount,
        (SELECT COUNT(*) FROM BatchDeductions) AS DedCount,
        (SELECT COUNT(*) FROM StockOpeningAdj) AS AdjCount
    `);
    const c = countRes.recordset[0];

    // Bước 3: Thực hiện xóa
    if (beforeDate) {
      console.log(`+ Bước 2: Xóa các hóa đơn trước ngày ${beforeDate}...`);
      await request.input('BeforeDate', sql.Date, beforeDate).query(`
        -- Xóa lượt trừ lô liên quan
        DELETE FROM BatchDeductions 
        WHERE InvoiceId IN (SELECT Id FROM Invoices WHERE Id > 0 AND InvDate < @BeforeDate)
           OR BatchId IN (SELECT Id FROM Batches WHERE InvoiceDate < @BeforeDate);

        -- Xóa lô hàng trước ngày
        DELETE FROM Batches WHERE InvoiceDate < @BeforeDate;

        -- Xóa chi tiết hóa đơn
        DELETE FROM InvoiceDetails 
        WHERE InvoiceId IN (SELECT Id FROM Invoices WHERE Id > 0 AND InvDate < @BeforeDate);

        -- Xóa hóa đơn
        DELETE FROM Invoices WHERE Id > 0 AND InvDate < @BeforeDate;
      `);
    } else {
      console.log('+ Bước 2: Xóa toàn bộ hóa đơn & dữ liệu kho (giữ dummy Id=0)...');
      await request.query(`
        DELETE FROM BatchDeductions;
        DELETE FROM Batches;
        DELETE FROM InvoiceDetails;
        DELETE FROM Invoices WHERE Id > 0;
        DELETE FROM StockOpeningAdj;

        -- Đặt lại Identity về 0 (để số tiếp theo bắt đầu từ 1)
        DBCC CHECKIDENT ('BatchDeductions', RESEED, 0);
        DBCC CHECKIDENT ('Batches', RESEED, 0);
        DBCC CHECKIDENT ('InvoiceDetails', RESEED, 0);
        DBCC CHECKIDENT ('Invoices', RESEED, 0);
        DBCC CHECKIDENT ('StockOpeningAdj', RESEED, 0);
      `);
    }

    // Bước 4: Ghi AuditLog
    await request.query(`
      INSERT INTO AuditLog (UserId, UserName, Action, Entity, EntityId, Detail, CreatedAt)
      VALUES (
        '1',
        N'admin',
        'PURGE_DATA',
        N'Invoices+Stock',
        '${stamp}',
        N'Đã xóa dữ liệu hóa đơn và kho cũ (${c.InvCount} HĐ, ${c.DetCount} chi tiết, ${c.BatCount} lô, ${c.AdjCount} tồn đầu). Bảng backup: *_Bak_${stamp}',
        GETDATE()
      )
    `);
    console.log('+ Bước 3: Đã ghi nhận lịch sử vào AuditLog');

    await transaction.commit();
    console.log('\n================================================================');
    console.log('✅ HOÀN TẤT THÀNH CÔNG! DỮ LIỆU KHO VÀ HÓA ĐƠN ĐÃ ĐƯỢC LÀM SẠCH.');
    console.log('================================================================');
    console.log(`- Toàn bộ danh mục Nhà cung cấp và Tài khoản người dùng vẫn GIỮ NGUYÊN.`);
    console.log(`- Tồn kho các sản phẩm tự động trở về 0.`);
    console.log(`- Bản sao lưu phục hồi được lưu tại các bảng: *_Bak_${stamp}`);
    console.log('================================================================\n');
  } catch (err) {
    await transaction.rollback();
    console.error('❌ Lỗi khi thực hiện xóa, đã ROLLBACK an toàn:', err.message);
    throw err;
  }
}

async function handleRestore(pool) {
  const stamp = getTodayStamp();
  console.log(`\n[CHẾ ĐỘ PHỤC HỒI DỮ LIỆU - RESTORE]`);
  console.log(`Đang kiểm tra các bảng sao lưu *_Bak_${stamp}...`);

  const check = await pool.request().query(`
    SELECT 
      OBJECT_ID('Invoices_Bak_${stamp}') AS HasInvoices,
      OBJECT_ID('InvoiceDetails_Bak_${stamp}') AS HasDetails
  `);

  if (!check.recordset[0].HasInvoices) {
    console.error(`Không tìm thấy bảng Invoices_Bak_${stamp}! Vui lòng kiểm tra lại tên bảng backup.`);
    return;
  }

  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const request = new sql.Request(transaction);

    await request.query(`
      DELETE FROM BatchDeductions;
      DELETE FROM Batches;
      DELETE FROM InvoiceDetails;
      DELETE FROM Invoices;
      DELETE FROM StockOpeningAdj;

      SET IDENTITY_INSERT Invoices ON;
      INSERT INTO Invoices (Id, Type, InvDate, Code, Partner, Note, ImageUrl, CreatedBy, UpdatedBy, CreatedAt, UpdatedAt)
      SELECT Id, Type, InvDate, Code, Partner, Note, ImageUrl, CreatedBy, UpdatedBy, CreatedAt, UpdatedAt
      FROM [Invoices_Bak_${stamp}];
      SET IDENTITY_INSERT Invoices OFF;

      SET IDENTITY_INSERT InvoiceDetails ON;
      INSERT INTO InvoiceDetails (Id, InvoiceId, ProductId, ProductName, Unit, Amount, Price, Subtotal, MfgDate, ExpDate)
      SELECT Id, InvoiceId, ProductId, ProductName, Unit, Amount, Price, Subtotal, MfgDate, ExpDate
      FROM [InvoiceDetails_Bak_${stamp}];
      SET IDENTITY_INSERT InvoiceDetails OFF;

      IF OBJECT_ID('Batches_Bak_${stamp}') IS NOT NULL
      BEGIN
        SET IDENTITY_INSERT Batches ON;
        INSERT INTO Batches (Id, ProductName, InvoiceId, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price, Unit, MfgDate, ExpDate, CreatedAt)
        SELECT Id, ProductName, InvoiceId, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price, Unit, MfgDate, ExpDate, CreatedAt
        FROM [Batches_Bak_${stamp}];
        SET IDENTITY_INSERT Batches OFF;
      END

      IF OBJECT_ID('BatchDeductions_Bak_${stamp}') IS NOT NULL
      BEGIN
        SET IDENTITY_INSERT BatchDeductions ON;
        INSERT INTO BatchDeductions (Id, BatchId, InvoiceId, QtyUsed, BatchInvCode, BatchInvDate, BatchPrice, BatchUnit, CreatedAt)
        SELECT Id, BatchId, InvoiceId, QtyUsed, BatchInvCode, BatchInvDate, BatchPrice, BatchUnit, CreatedAt
        FROM [BatchDeductions_Bak_${stamp}];
        SET IDENTITY_INSERT BatchDeductions OFF;
      END

      IF OBJECT_ID('StockOpeningAdj_Bak_${stamp}') IS NOT NULL
      BEGIN
        SET IDENTITY_INSERT StockOpeningAdj ON;
        INSERT INTO StockOpeningAdj (Id, ProductName, Year, Month, AdjQty, UpdatedBy, UpdatedAt)
        SELECT Id, ProductName, Year, Month, AdjQty, UpdatedBy, UpdatedAt
        FROM [StockOpeningAdj_Bak_${stamp}];
        SET IDENTITY_INSERT StockOpeningAdj OFF;
      END
    `);

    await transaction.commit();
    console.log('✅ Đã phục hồi dữ liệu từ bản sao lưu thành công!');
  } catch (err) {
    await transaction.rollback();
    console.error('❌ Lỗi khi phục hồi dữ liệu:', err.message);
  }
}

main();
