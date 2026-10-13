import { executeQuery, executeNonQuery, executeScalar, sql } from '@/lib/db';
import { StockOpeningAdj } from '@/types';
import { logAudit } from '@/lib/audit';
import { rebuildAllFifoBatches } from './fifoBatchService';

export async function getOpeningStocks(
  month: number,
  year: number
): Promise<StockOpeningAdj[]> {
  const queryText = `
    SELECT 
        p.Name AS ProductName, 
        p.Code AS ProductCode, 
        p.Category,
        ISNULL(s.CostPrice, ISNULL(p.CostPrice, 0)) AS CostPrice,
        p.Unit, 
        ISNULL(s.Id, 0) AS Id,
        (
            ISNULL((SELECT TOP 1 AdjQty FROM StockOpeningAdj WHERE ProductName = p.Name ORDER BY Year DESC, Month DESC), 0)
            + ISNULL((SELECT SUM(d.Amount) FROM InvoiceDetails d INNER JOIN Invoices i ON d.InvoiceId = i.Id WHERE (d.ProductId = p.Id OR d.ProductName = p.Name) AND i.Type = 'in' AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'), 0)
            - ISNULL((SELECT SUM(d.Amount) FROM InvoiceDetails d INNER JOIN Invoices i ON d.InvoiceId = i.Id WHERE (d.ProductId = p.Id OR d.ProductName = p.Name) AND i.Type = 'out' AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'), 0)
        ) AS CurrentStock,
        ISNULL(s.AdjQty, 0) AS AdjQty,
        ISNULL(s.CreatedBy, '') AS CreatedBy,
        ISNULL(s.UpdatedBy, '') AS UpdatedBy,
        @Year AS Year,
        @Month AS Month
    FROM Products p
    LEFT JOIN StockOpeningAdj s ON p.Name = s.ProductName AND s.Year = @Year AND s.Month = @Month
    WHERE p.IsActive = 1
    ORDER BY p.Category, p.Name
  `;

  const rows = await executeQuery<any>(queryText, {
    Year: { type: sql.Int, value: year },
    Month: { type: sql.Int, value: month },
  });

  const monthPad = String(month).padStart(2, '0');
  const defaultInvDate = `${year}-${monthPad}-01`;

  return rows.map((r) => {
    const cat = r.Category || 'Nguyên liệu';
    const wh = cat === 'Vật liệu' ? 'Kho Vật liệu' : 'Kho Nguyên liệu';
    return {
      Id: Number(r.Id),
      ProductName: r.ProductName || '',
      ProductCode: r.ProductCode || '',
      Category: cat,
      CostPrice: Number(r.CostPrice) || 0,
      Unit: r.Unit || 'kg',
      Warehouse: wh,
      VoucherCode: 'OPN',
      InvDate: defaultInvDate,
      BatchNo: '',
      ExpDate: null,
      Specification: '',
      Location: '',
      Year: Number(r.Year),
      Month: Number(r.Month),
      CurrentStock: Number(r.CurrentStock) || 0,
      AdjQty: Number(r.AdjQty) || 0,
      CreatedBy: r.CreatedBy || '',
      UpdatedBy: r.UpdatedBy || '',
    };
  });
}

export async function getOpeningPeriod(): Promise<{
  month: number;
  year: number;
  exists: boolean;
}> {
  const rows = await executeQuery<any>(
    'SELECT TOP 1 Year, Month FROM StockOpeningAdj ORDER BY Year ASC, Month ASC'
  );

  if (rows.length > 0) {
    return {
      month: Number(rows[0].Month),
      year: Number(rows[0].Year),
      exists: true,
    };
  }

  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    exists: false,
  };
}

export async function getDoubleCountWarnings(
  month: number,
  year: number,
  changed: StockOpeningAdj[]
): Promise<string[]> {
  const warnings: string[] = [];
  if (!changed || changed.length === 0) return warnings;

  const periodStart = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
  const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const dt = await executeQuery<any>(
    `SELECT p.Name, p.CreatedAt,
            ISNULL((SELECT SUM(d.Amount) FROM InvoiceDetails d INNER JOIN Invoices i ON d.InvoiceId = i.Id
                     WHERE i.Type = 'in' AND i.InvDate >= @Start AND i.InvDate <= @End
                       AND d.ProductName = p.Name), 0) AS NhapTrongKy
     FROM Products p WHERE p.IsActive = 1`,
    {
      Start: { type: sql.Date, value: startStr },
      End: { type: sql.Date, value: endStr },
    }
  );

  const info = new Map<string, { created: Date; imported: number }>();
  for (const r of dt) {
    const name = (r.Name || '').toLowerCase().trim();
    if (name && !info.has(name)) {
      info.set(name, {
        created: r.CreatedAt ? new Date(r.CreatedAt) : new Date(0),
        imported: Number(r.NhapTrongKy) || 0,
      });
    }
  }

  for (const s of changed) {
    if (Number(s.AdjQty) <= 0) continue;
    const nameKey = (s.ProductName || '').toLowerCase().trim();
    const inf = info.get(nameKey);
    if (!inf) continue;

    if (inf.created.getTime() > periodStart.getTime()) {
      warnings.push(
        `'${s.ProductName}': sản phẩm được tạo ngày ${inf.created.toLocaleDateString('vi-VN')} (sau ngày bắt đầu kỳ). Chỉ khai tồn đầu nếu hàng này thực tế đã có từ trước đó.`
      );
    }

    if (inf.imported > 0) {
      warnings.push(
        `'${s.ProductName}': đã có nhập ${inf.imported.toFixed(2)} trong kỳ — số nhập đã nằm trong tồn hiện tại, khai thêm ${Number(s.AdjQty).toFixed(2)} tồn đầu có thể bị ĐẾM ĐÔI.`
      );
    }
  }

  return warnings;
}

export async function saveOpeningStocks(
  month: number,
  year: number,
  stocks: StockOpeningAdj[],
  currentUser: string = 'system'
): Promise<void> {
  const upsertSql = `
    MERGE StockOpeningAdj AS target
    USING (SELECT @ProductName AS ProductName, @Year AS Year, @Month AS Month, @AdjQty AS AdjQty, @CostPrice AS CostPrice, @UpdatedBy AS UpdatedBy) AS source
    ON (target.ProductName = source.ProductName AND target.Year = source.Year AND target.Month = source.Month)
    WHEN MATCHED THEN
        UPDATE SET AdjQty = source.AdjQty, CostPrice = source.CostPrice, UpdatedBy = source.UpdatedBy, UpdatedAt = GETDATE()
    WHEN NOT MATCHED THEN
        INSERT (ProductName, Year, Month, AdjQty, CostPrice, CreatedBy, CreatedAt, UpdatedBy, UpdatedAt)
        VALUES (source.ProductName, source.Year, source.Month, source.AdjQty, source.CostPrice, source.UpdatedBy, GETDATE(), source.UpdatedBy, GETDATE());
  `;

  for (const s of stocks) {
    const costPriceVal = s.CostPrice !== undefined && s.CostPrice !== null ? Number(s.CostPrice) : null;
    await executeNonQuery(upsertSql, {
      ProductName: { type: sql.NVarChar(255), value: s.ProductName },
      Year: { type: sql.Int, value: year },
      Month: { type: sql.Int, value: month },
      AdjQty: { type: sql.Decimal(18, 4), value: Number(s.AdjQty) || 0 },
      CostPrice: { type: sql.Decimal(18, 2), value: costPriceVal },
      UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
    });

    const priceLog = costPriceVal !== null ? ` (Giá: ${costPriceVal.toLocaleString('vi-VN')} đ)` : '';
    await logAudit(
      currentUser,
      currentUser,
      'UPDATE_OPENING',
      'StockOpeningAdj',
      s.ProductName,
      `Khai tồn đầu kỳ '${s.ProductName}' tháng ${String(month).padStart(2, '0')}/${year} = ${Number(s.AdjQty).toFixed(2)}${priceLog}`
    );
  }

  try {
    await rebuildAllFifoBatches();
  } catch (err) {
    console.error('Rebuild FIFO error after saving opening stocks:', err);
  }
}

export async function deleteOpeningStock(
  productName: string,
  month: number,
  year: number,
  currentUser: string = 'system'
): Promise<void> {
  await executeNonQuery(
    `UPDATE StockOpeningAdj SET AdjQty = 0, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE()
     WHERE ProductName = @ProductName AND Year = @Year AND Month = @Month`,
    {
      ProductName: { type: sql.NVarChar(255), value: productName },
      Year: { type: sql.Int, value: year },
      Month: { type: sql.Int, value: month },
      UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
    }
  );

  await logAudit(
    currentUser,
    currentUser,
    'DELETE_OPENING',
    'StockOpeningAdj',
    productName,
    `Xóa khai báo tồn đầu kỳ '${productName}' tháng ${String(month).padStart(2, '0')}/${year}`
  );

  try {
    await rebuildAllFifoBatches();
  } catch (err) {
    console.error('Rebuild FIFO error after deleting opening stock:', err);
  }
}

