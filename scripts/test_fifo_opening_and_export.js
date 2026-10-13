const sql = require('mssql');

const config = {
  user: process.env.MSSQL_USER || 'chumchum_app',
  password: process.env.MSSQL_PASSWORD || 'Chumchum123@',
  server: process.env.MSSQL_SERVER || '103.163.214.101',
  database: process.env.MSSQL_DATABASE || 'ChumChumDB',
  options: { encrypt: true, trustServerCertificate: true },
};

async function runTest() {
  console.log('=== BẮT ĐẦU KIỂM TRA NGHIỆP VỤ TỒN ĐẦU CÓ GIÁ & XUẤT KHO FIFO ===');
  const pool = await sql.connect(config);

  const testProdName = 'TEST_FIFO_BOT_MI_' + Date.now();
  const testMonth = 10;
  const testYear = 2026;

  try {
    await pool.request().query(`
      DELETE FROM BatchDeductions WHERE BatchId IN (SELECT Id FROM Batches WHERE ProductName LIKE 'TEST_FIFO_%');
      DELETE FROM Batches WHERE ProductName LIKE 'TEST_FIFO_%';
      DELETE FROM InvoiceDetails WHERE ProductName LIKE 'TEST_FIFO_%';
      DELETE FROM Invoices WHERE Code LIKE 'XK-TEST-%' OR Code LIKE 'HD-NHAP-TEST%';
      DELETE FROM StockOpeningAdj WHERE ProductName LIKE 'TEST_FIFO_%';
      DELETE FROM Products WHERE Name LIKE 'TEST_FIFO_%';
    `);

    // 1. Tạo sản phẩm test
    console.log(`\n1. Tạo sản phẩm thử nghiệm: '${testProdName}'...`);
    const prodRes = await pool.request().query(`
      INSERT INTO Products (Code, Name, Category, Unit, CostPrice, SellPrice, StockQty, MinStock, IsActive)
      OUTPUT INSERTED.Id
      VALUES ('TEST-${Date.now()}', '${testProdName}', 'Nguyên liệu', 'kg', 10000, 15000, 0, 10, 1)
    `);
    const prodId = prodRes.recordset[0].Id;
    console.log(`-> Tạo thành công Product Id: ${prodId}`);

    // 2. Khai báo tồn đầu kỳ có đơn giá: 100 kg, đơn giá 25.000 đ
    console.log(`\n2. Khai báo tồn đầu kỳ: 100 kg với đơn giá 25.000 đ...`);
    await pool.request().query(`
      MERGE StockOpeningAdj AS target
      USING (SELECT '${testProdName}' AS ProductName, ${testYear} AS Year, ${testMonth} AS Month, 100 AS AdjQty, 25000 AS CostPrice, 'test' AS UpdatedBy) AS source
      ON (target.ProductName = source.ProductName AND target.Year = source.Year AND target.Month = source.Month)
      WHEN MATCHED THEN
          UPDATE SET AdjQty = source.AdjQty, CostPrice = source.CostPrice, UpdatedBy = source.UpdatedBy, UpdatedAt = GETDATE()
      WHEN NOT MATCHED THEN
          INSERT (ProductName, Year, Month, AdjQty, CostPrice, CreatedBy, CreatedAt, UpdatedBy, UpdatedAt)
          VALUES (source.ProductName, source.Year, source.Month, source.AdjQty, source.CostPrice, source.UpdatedBy, GETDATE(), source.UpdatedBy, GETDATE());
    `);

    // 3. Tái tạo lô (rebuildAllFifoBatches logic)
    console.log(`\n3. Tạo lô tồn đầu trong Batches...`);
    await pool.request().query(`
      INSERT INTO Batches (ProductName, InvoiceId, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price, Unit)
      SELECT 
          s.ProductName, 
          0 AS InvoiceId, 
          'TONDAU-' + RIGHT('0' + CAST(s.Month AS VARCHAR), 2) + '/' + CAST(s.Year AS VARCHAR) AS InvoiceCode, 
          CAST(CAST(s.Year AS VARCHAR) + '-' + RIGHT('0' + CAST(s.Month AS VARCHAR), 2) + '-01' AS DATETIME) AS InvoiceDate, 
          s.AdjQty AS Quantity, 
          s.AdjQty AS RemainingQty, 
          ISNULL(NULLIF(s.CostPrice, 0), ISNULL(p.CostPrice, 0)) AS Price, 
          ISNULL(p.Unit, 'kg') AS Unit
      FROM StockOpeningAdj s
      LEFT JOIN Products p ON s.ProductName = p.Name
      WHERE s.ProductName = '${testProdName}' AND s.AdjQty > 0;
    `);

    const batch1 = await pool.request().query(`
      SELECT Id, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price 
      FROM Batches WHERE ProductName = '${testProdName}'
    `);
    console.log('-> Lô tồn đầu trong Batches:', batch1.recordset[0]);
    if (batch1.recordset[0].Price !== 25000) {
      throw new Error(`Giá lô tồn đầu không đúng! Mong đợi: 25000, Thực tế: ${batch1.recordset[0].Price}`);
    }
    console.log('=> THÀNH CÔNG: Lô tồn đầu đã nhận chính xác đơn giá khai báo 25.000 đ!');

    // 4. Tạo một lô nhập mới ngày 05/10/2026: 50 kg với giá 30.000 đ
    console.log(`\n4. Tạo thêm một lô nhập kho mới ngày 05/10/2026: 50 kg giá 30.000 đ...`);
    const invInRes = await pool.request().query(`
      INSERT INTO Invoices (Type, InvDate, Code, Partner, CreatedBy, ApprovalStatus)
      OUTPUT INSERTED.Id
      VALUES ('in', '2026-10-05', 'HD-NHAP-TEST', 'NCC Test', 'test', 'approved')
    `);
    const invInId = invInRes.recordset[0].Id;
    await pool.request().query(`
      INSERT INTO InvoiceDetails (InvoiceId, ProductId, ProductName, Unit, Amount, Price, Subtotal)
      VALUES (${invInId}, ${prodId}, '${testProdName}', 'kg', 50, 30000, 1500000)
    `);
    await pool.request().query(`
      INSERT INTO Batches (ProductName, InvoiceId, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price, Unit)
      VALUES ('${testProdName}', ${invInId}, 'HD-NHAP-TEST', '2026-10-05', 50, 50, 30000, 'kg')
    `);

    // 5. Kiểm tra xuất kho đợt 1: Xuất 60 kg vào ngày 06/10/2026
    console.log(`\n5. Kiểm tra xuất kho đợt 1 (Xuất 60 kg):`);
    console.log('   Theo FIFO, 60 kg này phải trừ vào lô cũ nhất (Lô tồn đầu 100 kg giá 25.000 đ)...');
    
    // Tạo hóa đơn xuất 1
    const invOut1Res = await pool.request().query(`
      INSERT INTO Invoices (Type, InvDate, Code, Partner, CreatedBy, ApprovalStatus)
      OUTPUT INSERTED.Id
      VALUES ('out', '2026-10-06', 'XK-TEST-01', 'Bếp bánh', 'test', 'approved')
    `);
    const invOut1Id = invOut1Res.recordset[0].Id;
    await pool.request().query(`
      INSERT INTO InvoiceDetails (InvoiceId, ProductId, ProductName, Unit, Amount, Price, Subtotal)
      VALUES (${invOut1Id}, ${prodId}, '${testProdName}', 'kg', 60, 0, 0)
    `);

    // Thực hiện trừ lô FIFO
    const batchesForDeduct1 = await pool.request().query(`
      SELECT Id, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price, Unit 
      FROM Batches 
      WHERE ProductName = '${testProdName}' AND RemainingQty > 0 
      ORDER BY InvoiceDate ASC, Id ASC
    `);

    let remainingToDeduct = 60;
    for (const r of batchesForDeduct1.recordset) {
      if (remainingToDeduct <= 0) break;
      const take = Math.min(remainingToDeduct, r.RemainingQty);
      await pool.request().query(`
        UPDATE Batches SET RemainingQty = RemainingQty - ${take} WHERE Id = ${r.Id};
        INSERT INTO BatchDeductions (BatchId, InvoiceId, QtyUsed, BatchInvCode, BatchInvDate, BatchPrice, BatchUnit)
        VALUES (${r.Id}, ${invOut1Id}, ${take}, '${r.InvoiceCode}', '${r.InvoiceDate.toISOString().slice(0, 10)}', ${r.Price}, '${r.Unit}');
      `);
      remainingToDeduct -= take;
    }

    // Cập nhật lại đơn giá xuất kho theo BatchDeductions
    const stats1 = await pool.request().query(`
      SELECT 
         ISNULL(SUM(d.QtyUsed * d.BatchPrice), 0) AS TotalCost,
         ISNULL(SUM(d.QtyUsed), 0) AS TotalQty
       FROM BatchDeductions d
       INNER JOIN Batches b ON d.BatchId = b.Id
       WHERE d.InvoiceId = ${invOut1Id} AND b.ProductName = '${testProdName}'
    `);
    const totalCost1 = Number(stats1.recordset[0].TotalCost);
    const totalQty1 = Number(stats1.recordset[0].TotalQty);
    const fifoPrice1 = totalCost1 / totalQty1;

    await pool.request().query(`
      UPDATE InvoiceDetails 
      SET Price = ${fifoPrice1}, Subtotal = ${totalCost1} 
      WHERE InvoiceId = ${invOut1Id} AND ProductName = '${testProdName}';
    `);

    const checkDetail1 = await pool.request().query(`
      SELECT Price, Subtotal FROM InvoiceDetails WHERE InvoiceId = ${invOut1Id}
    `);
    console.log('-> Dòng chi tiết phiếu xuất 1 sau khi trừ FIFO:', checkDetail1.recordset[0]);
    if (checkDetail1.recordset[0].Price !== 25000 || checkDetail1.recordset[0].Subtotal !== 1500000) {
      throw new Error(`Đơn giá hoặc thành tiền đợt 1 sai!`);
    }
    console.log('=> THÀNH CÔNG: Phiếu xuất đợt 1 đã lấy chính xác giá lô cũ tồn đầu = 25.000 đ, Thành tiền = 1.500.000 đ!');

    // 6. Kiểm tra xuất kho đợt 2: Xuất 60 kg vào ngày 07/10/2026
    console.log(`\n6. Kiểm tra xuất kho đợt 2 (Xuất tiếp 60 kg):`);
    console.log('   Hiện tại lô tồn đầu còn lại 40 kg (giá 25.000 đ).');
    console.log('   Lô nhập 2 có 50 kg (giá 30.000 đ).');
    console.log('   Theo FIFO: phải lấy 40 kg giá 25.000 đ + 20 kg giá 30.000 đ.');
    console.log('   Tổng chi phí = 40*25.000 + 20*30.000 = 1.600.000 đ => Giá bình quân xuất = 26.666,67 đ');

    const invOut2Res = await pool.request().query(`
      INSERT INTO Invoices (Type, InvDate, Code, Partner, CreatedBy, ApprovalStatus)
      OUTPUT INSERTED.Id
      VALUES ('out', '2026-10-07', 'XK-TEST-02', 'Bếp bánh', 'test', 'approved')
    `);
    const invOut2Id = invOut2Res.recordset[0].Id;
    await pool.request().query(`
      INSERT INTO InvoiceDetails (InvoiceId, ProductId, ProductName, Unit, Amount, Price, Subtotal)
      VALUES (${invOut2Id}, ${prodId}, '${testProdName}', 'kg', 60, 0, 0)
    `);

    // Thực hiện trừ lô FIFO đợt 2
    const batchesForDeduct2 = await pool.request().query(`
      SELECT Id, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price, Unit 
      FROM Batches 
      WHERE ProductName = '${testProdName}' AND RemainingQty > 0 
      ORDER BY InvoiceDate ASC, Id ASC
    `);

    remainingToDeduct = 60;
    for (const r of batchesForDeduct2.recordset) {
      if (remainingToDeduct <= 0) break;
      const take = Math.min(remainingToDeduct, r.RemainingQty);
      await pool.request().query(`
        UPDATE Batches SET RemainingQty = RemainingQty - ${take} WHERE Id = ${r.Id};
        INSERT INTO BatchDeductions (BatchId, InvoiceId, QtyUsed, BatchInvCode, BatchInvDate, BatchPrice, BatchUnit)
        VALUES (${r.Id}, ${invOut2Id}, ${take}, '${r.InvoiceCode}', '${r.InvoiceDate.toISOString().slice(0, 10)}', ${r.Price}, '${r.Unit}');
      `);
      remainingToDeduct -= take;
    }

    // Cập nhật lại đơn giá xuất kho theo BatchDeductions
    const stats2 = await pool.request().query(`
      SELECT 
         ISNULL(SUM(d.QtyUsed * d.BatchPrice), 0) AS TotalCost,
         ISNULL(SUM(d.QtyUsed), 0) AS TotalQty
       FROM BatchDeductions d
       INNER JOIN Batches b ON d.BatchId = b.Id
       WHERE d.InvoiceId = ${invOut2Id} AND b.ProductName = '${testProdName}'
    `);
    const totalCost2 = Number(stats2.recordset[0].TotalCost);
    const totalQty2 = Number(stats2.recordset[0].TotalQty);
    const fifoPrice2 = totalCost2 / totalQty2;

    await pool.request().query(`
      UPDATE InvoiceDetails 
      SET Price = ${fifoPrice2}, Subtotal = ${totalCost2} 
      WHERE InvoiceId = ${invOut2Id} AND ProductName = '${testProdName}';
    `);

    const checkDetail2 = await pool.request().query(`
      SELECT Price, Subtotal FROM InvoiceDetails WHERE InvoiceId = ${invOut2Id}
    `);
    console.log('-> Dòng chi tiết phiếu xuất 2 sau khi trừ FIFO:', checkDetail2.recordset[0]);
    if (Math.abs(checkDetail2.recordset[0].Subtotal - 1600000) > 1) {
      throw new Error(`Thành tiền xuất đợt 2 không khớp 1.600.000 đ!`);
    }
    console.log(`=> THÀNH CÔNG: Đợt 2 xuất qua 2 lô đúng FIFO: Thành tiền = 1.600.000 đ, Giá bình quân = ${checkDetail2.recordset[0].Price} đ!`);

    // 7. Kiểm tra trạng thái tồn các lô
    const remainingBatches = await pool.request().query(`
      SELECT InvoiceCode, Quantity, RemainingQty, Price 
      FROM Batches WHERE ProductName = '${testProdName}' 
      ORDER BY InvoiceDate ASC
    `);
    console.log('\n7. Tình trạng tồn các lô sau 2 đợt xuất:');
    console.table(remainingBatches.recordset);

    const tonDauBatch = remainingBatches.recordset.find(b => b.InvoiceCode.startsWith('TONDAU'));
    const nhapBatch = remainingBatches.recordset.find(b => b.InvoiceCode === 'HD-NHAP-TEST');

    if (tonDauBatch.RemainingQty !== 0) {
      throw new Error(`Lô tồn đầu phải hết (RemainingQty = 0), thực tế: ${tonDauBatch.RemainingQty}`);
    }
    if (nhapBatch.RemainingQty !== 30) {
      throw new Error(`Lô nhập sau phải còn lại 30 kg, thực tế: ${nhapBatch.RemainingQty}`);
    }
    console.log('=> Lô cũ tồn đầu đã xuất hết (0 kg), Lô mới nhập còn đúng 30 kg! HOÀN TOÀN CHÍNH XÁC THEO FIFO!');

    // Dọn dẹp dữ liệu test
    console.log('\n8. Dọn dẹp dữ liệu test...');
    await pool.request().query(`
      DELETE FROM BatchDeductions WHERE InvoiceId IN (${invOut1Id}, ${invOut2Id});
      DELETE FROM Batches WHERE ProductName = '${testProdName}';
      DELETE FROM InvoiceDetails WHERE InvoiceId IN (${invInId}, ${invOut1Id}, ${invOut2Id});
      DELETE FROM Invoices WHERE Id IN (${invInId}, ${invOut1Id}, ${invOut2Id});
      DELETE FROM StockOpeningAdj WHERE ProductName = '${testProdName}';
      DELETE FROM Products WHERE Id = ${prodId};
    `);
    console.log('-> Đã dọn dẹp sạch dữ liệu test.');

    console.log('\n🎉 TOÀN BỘ CÁC BÀI TEST NGHIỆP VỤ ĐÃ VƯỢT QUA 100%! 🎉');
  } catch (err) {
    console.error('LỖI TEST:', err);
    process.exit(1);
  } finally {
    await pool.close();
  }
}

runTest();
