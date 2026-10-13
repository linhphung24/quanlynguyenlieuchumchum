import { executeQuery, executeNonQuery, executeScalar, sql } from '@/lib/db';
import { Batch } from '@/types';

export async function deductBatchesFifo(
  exportInvoiceId: number,
  exportInvCode: string,
  exportInvDate: Date | string,
  items: Array<{ productName: string; qty: number; unit: string }>
): Promise<void> {
  const invDate = exportInvDate instanceof Date ? exportInvDate : new Date(exportInvDate);

  for (const item of items) {
    const pName = item.productName.trim();
    let remainingToDeduct = Number(item.qty);

    const dtBatches = await executeQuery<any>(
      `SELECT Id, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price, Unit 
       FROM Batches 
       WHERE LOWER(LTRIM(RTRIM(ProductName))) = LOWER(LTRIM(RTRIM(@ProductName))) AND RemainingQty > 0 
       ORDER BY InvoiceDate ASC, Id ASC`,
      {
        ProductName: { type: sql.NVarChar(255), value: pName },
      }
    );

    for (const r of dtBatches) {
      if (remainingToDeduct <= 0) break;

      const batchId = Number(r.Id);
      const bRemaining = Number(r.RemainingQty);
      const bCode = r.InvoiceCode || '';
      const bDate = r.InvoiceDate ? new Date(r.InvoiceDate) : new Date();
      const bPrice = Number(r.Price) || 0;
      const bUnit = r.Unit || 'kg';

      const take = Math.min(remainingToDeduct, bRemaining);
      const newRemaining = bRemaining - take;

      await executeNonQuery(
        `UPDATE Batches SET RemainingQty = @NewRemaining WHERE Id = @BatchId`,
        {
          NewRemaining: { type: sql.Decimal(18, 4), value: newRemaining },
          BatchId: { type: sql.Int, value: batchId },
        }
      );

      await executeNonQuery(
        `INSERT INTO BatchDeductions (BatchId, InvoiceId, QtyUsed, BatchInvCode, BatchInvDate, BatchPrice, BatchUnit)
         VALUES (@BatchId, @InvoiceId, @QtyUsed, @BatchInvCode, @BatchInvDate, @BatchPrice, @BatchUnit)`,
        {
          BatchId: { type: sql.Int, value: batchId },
          InvoiceId: { type: sql.Int, value: exportInvoiceId },
          QtyUsed: { type: sql.Decimal(18, 4), value: take },
          BatchInvCode: { type: sql.NVarChar(50), value: bCode },
          BatchInvDate: { type: sql.DateTime, value: bDate },
          BatchPrice: { type: sql.Decimal(18, 2), value: bPrice },
          BatchUnit: { type: sql.NVarChar(50), value: bUnit },
        }
      );

      remainingToDeduct -= take;
    }
  }

  // Cập nhật lại đơn giá và thành tiền của dòng chi tiết xuất kho theo đúng giá FIFO thực tế từ các lô đã trừ
  for (const item of items) {
    const pName = item.productName.trim();
    const stats = await executeQuery<any>(
      `SELECT 
         ISNULL(SUM(d.QtyUsed * d.BatchPrice), 0) AS TotalCost,
         ISNULL(SUM(d.QtyUsed), 0) AS TotalQty
       FROM BatchDeductions d
       INNER JOIN Batches b ON d.BatchId = b.Id
       WHERE d.InvoiceId = @InvoiceId 
         AND LOWER(LTRIM(RTRIM(b.ProductName))) = LOWER(LTRIM(RTRIM(@ProductName)))`,
      {
        InvoiceId: { type: sql.Int, value: exportInvoiceId },
        ProductName: { type: sql.NVarChar(255), value: pName },
      }
    );

    if (stats && stats.length > 0 && Number(stats[0].TotalQty) > 0) {
      const totalCost = Number(stats[0].TotalCost);
      const totalQty = Number(stats[0].TotalQty);
      const fifoUnitPrice = totalCost / totalQty;

      await executeNonQuery(
        `UPDATE InvoiceDetails 
         SET Price = @Price, Subtotal = @Subtotal 
         WHERE InvoiceId = @InvoiceId 
           AND LOWER(LTRIM(RTRIM(ProductName))) = LOWER(LTRIM(RTRIM(@ProductName)))`,
        {
          Price: { type: sql.Decimal(18, 2), value: fifoUnitPrice },
          Subtotal: { type: sql.Decimal(18, 2), value: totalCost },
          InvoiceId: { type: sql.Int, value: exportInvoiceId },
          ProductName: { type: sql.NVarChar(255), value: pName },
        }
      );
    }
  }
}

export async function restoreBatchDeductions(exportInvoiceId: number): Promise<void> {
  const dtDeductions = await executeQuery<any>(
    `SELECT BatchId, QtyUsed FROM BatchDeductions WHERE InvoiceId = @InvoiceId`,
    {
      InvoiceId: { type: sql.Int, value: exportInvoiceId },
    }
  );

  for (const r of dtDeductions) {
    const batchId = Number(r.BatchId);
    const qtyUsed = Number(r.QtyUsed);

    await executeNonQuery(
      `UPDATE Batches SET RemainingQty = RemainingQty + @QtyUsed WHERE Id = @BatchId`,
      {
        QtyUsed: { type: sql.Decimal(18, 4), value: qtyUsed },
        BatchId: { type: sql.Int, value: batchId },
      }
    );
  }

  await executeNonQuery(
    `DELETE FROM BatchDeductions WHERE InvoiceId = @InvoiceId`,
    {
      InvoiceId: { type: sql.Int, value: exportInvoiceId },
    }
  );
}

export async function getAllBatches(
  search: string = '',
  statusFilter: string = 'active'
): Promise<Batch[]> {
  let queryText = `
    SELECT b.*, p.Code as ProductCode 
    FROM Batches b
    LEFT JOIN Products p ON b.ProductName = p.Name
    WHERE (b.ProductName LIKE @Search OR b.InvoiceCode LIKE @Search OR p.Code LIKE @Search)
  `;

  if (statusFilter === 'active') {
    queryText += ` AND b.RemainingQty > 0.001`;
  } else if (statusFilter === 'empty') {
    queryText += ` AND b.RemainingQty <= 0.001`;
  }

  queryText += ` ORDER BY b.InvoiceDate DESC, b.Id DESC`;

  const rows = await executeQuery<any>(queryText, {
    Search: { type: sql.NVarChar(255), value: `%${search.trim()}%` },
  });

  return rows.map((r) => ({
    Id: Number(r.Id),
    ProductCode: r.ProductCode || '',
    ProductName: r.ProductName || '',
    InvoiceId: Number(r.InvoiceId),
    InvoiceCode: r.InvoiceCode || '',
    InvoiceDate: r.InvoiceDate ? new Date(r.InvoiceDate).toISOString() : '',
    Quantity: Number(r.Quantity) || 0,
    RemainingQty: Number(r.RemainingQty) || 0,
    Price: Number(r.Price) || 0,
    Unit: r.Unit || 'kg',
    MfgDate: r.MfgDate ? new Date(r.MfgDate).toISOString() : null,
    ExpDate: r.ExpDate ? new Date(r.ExpDate).toISOString() : null,
  }));
}

export interface FifoPriceResult {
  price: number;
  batchCode?: string;
  batchDate?: string;
  remainingQty?: number;
  unit?: string;
  hasBatch: boolean;
  batchesUsed?: Array<{
    batchCode: string;
    qty: number;
    price: number;
  }>;
}

export async function getFifoPriceForProduct(
  productName: string,
  qty: number = 0,
  fallbackPrice: number = 0
): Promise<FifoPriceResult> {
  const pName = productName.trim();
  const batches = await executeQuery<any>(
    `SELECT Id, InvoiceCode, InvoiceDate, RemainingQty, Price, Unit 
     FROM Batches 
     WHERE LOWER(LTRIM(RTRIM(ProductName))) = LOWER(LTRIM(RTRIM(@ProductName))) AND RemainingQty > 0 
     ORDER BY InvoiceDate ASC, Id ASC`,
    {
      ProductName: { type: sql.NVarChar(255), value: pName },
    }
  );

  if (!batches || batches.length === 0) {
    return {
      price: fallbackPrice,
      hasBatch: false,
    };
  }

  const oldest = batches[0];

  // Nếu số lượng <= 0, trả về giá của lô cũ nhất
  if (qty <= 0) {
    return {
      price: Number(oldest.Price) || fallbackPrice,
      batchCode: oldest.InvoiceCode || '',
      batchDate: oldest.InvoiceDate ? new Date(oldest.InvoiceDate).toISOString() : '',
      remainingQty: Number(oldest.RemainingQty) || 0,
      unit: oldest.Unit || 'kg',
      hasBatch: true,
    };
  }

  // Nếu có số lượng xuất cụ thể, tính bình quân FIFO theo các lô sẽ trừ
  let rem = qty;
  let totalCost = 0;
  let totalDeducted = 0;
  const batchesUsed: Array<{ batchCode: string; qty: number; price: number }> = [];

  for (const b of batches) {
    if (rem <= 0) break;
    const bQty = Number(b.RemainingQty);
    const bPrice = Number(b.Price) || 0;
    const take = Math.min(rem, bQty);

    totalCost += take * bPrice;
    totalDeducted += take;
    rem -= take;

    batchesUsed.push({
      batchCode: b.InvoiceCode || '',
      qty: take,
      price: bPrice,
    });
  }

  const calculatedPrice = totalDeducted > 0 ? totalCost / totalDeducted : (Number(oldest.Price) || fallbackPrice);

  return {
    price: calculatedPrice,
    batchCode: oldest.InvoiceCode || '',
    batchDate: oldest.InvoiceDate ? new Date(oldest.InvoiceDate).toISOString() : '',
    remainingQty: Number(oldest.RemainingQty) || 0,
    unit: oldest.Unit || 'kg',
    hasBatch: true,
    batchesUsed,
  };
}

export async function getOldestBatchPrice(
  productName: string,
  fallbackPrice: number
): Promise<number> {
  const res = await getFifoPriceForProduct(productName, 0, fallbackPrice);
  return res.price;
}

export async function addBatchesFromInvoice(invoiceId: number): Promise<void> {
  const sqlInsert = `
    INSERT INTO Batches (ProductName, InvoiceId, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price, Unit, MfgDate, ExpDate)
    SELECT d.ProductName, i.Id, i.Code, i.InvDate, d.Amount, d.Amount, d.Price, d.Unit, d.MfgDate, d.ExpDate
    FROM InvoiceDetails d
    INNER JOIN Invoices i ON d.InvoiceId = i.Id
    WHERE i.Id = @InvoiceId AND i.Type = 'in' AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'
  `;

  await executeNonQuery(sqlInsert, {
    InvoiceId: { type: sql.Int, value: invoiceId },
  });
}

export async function rebuildAllFifoBatches(): Promise<void> {
  await executeNonQuery('DELETE FROM BatchDeductions; DELETE FROM Batches;');

  // Ensure dummy invoice 0 exists for StockOpeningAdj
  await executeNonQuery(`
    IF NOT EXISTS (SELECT 1 FROM Invoices WHERE Id = 0)
    BEGIN
        SET IDENTITY_INSERT Invoices ON;
        INSERT INTO Invoices (Id, Type, InvDate, Code, Partner, CreatedBy, ApprovalStatus) VALUES (0, 'in', '2000-01-01', 'TONDAU_DUMMY', 'System', 'System', 'approved');
        SET IDENTITY_INSERT Invoices OFF;
    END
  `);

  // 1. Tải các Lô Tồn Đầu Kỳ từ Khai Báo Tồn Đầu Kỳ (vào ngày mùng 1 của tháng)
  await executeNonQuery(`
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
    WHERE s.AdjQty > 0;
  `);

  // 2. Tải lại toàn bộ Lô từ các Hóa đơn Nhập kho ĐÃ ĐƯỢC DUYỆT (Type = 'in')
  await executeNonQuery(`
    INSERT INTO Batches (ProductName, InvoiceId, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price, Unit, MfgDate, ExpDate)
    SELECT d.ProductName, i.Id, i.Code, i.InvDate, d.Amount, d.Amount, d.Price, d.Unit, d.MfgDate, d.ExpDate
    FROM InvoiceDetails d
    INNER JOIN Invoices i ON d.InvoiceId = i.Id
    WHERE i.Type = 'in' AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'
    ORDER BY i.InvDate ASC, i.Id ASC;
  `);

  // 3. Duyệt qua tất cả Hóa đơn Xuất kho ĐÃ DUYỆT (Type = 'out') theo thời gian để trừ FIFO
  const dtOutInvoices = await executeQuery<any>(`
    SELECT i.Id, i.Code, i.InvDate
    FROM Invoices i
    WHERE i.Type = 'out' AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'
    ORDER BY i.InvDate ASC, i.Id ASC;
  `);

  for (const r of dtOutInvoices) {
    const invId = Number(r.Id);
    const code = r.Code || '';
    const date = r.InvDate ? new Date(r.InvDate) : new Date();

    const dtDetails = await executeQuery<any>(
      `SELECT ProductName, Amount, Unit FROM InvoiceDetails WHERE InvoiceId = @InvoiceId`,
      {
        InvoiceId: { type: sql.Int, value: invId },
      }
    );

    const items = dtDetails.map((dr) => ({
      productName: dr.ProductName || '',
      qty: Number(dr.Amount) || 0,
      unit: dr.Unit || 'kg',
    }));

    await deductBatchesFifo(invId, code, date, items);
  }
}
