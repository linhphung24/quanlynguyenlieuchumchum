import { executeQuery, sql } from '@/lib/db';
import { TongHopRow } from '@/types';

export async function getInventorySummary(year: number, month: number): Promise<TongHopRow[]> {
  const result: TongHopRow[] = [];

  const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // 1. Query danh sách sản phẩm active
  const dtProducts = await executeQuery<any>(
    'SELECT Id, Code, Name, Category, Unit, CostPrice FROM Products WHERE IsActive = 1 ORDER BY Category, Name'
  );

  // 2. Query hoá đơn nhập/xuất trong tháng (xuất chỉ tính hóa đơn ĐÃ DUYỆT)
  const dtInMonth = await executeQuery<any>(
    `SELECT i.Type, d.ProductName, d.Amount, d.Price, d.Unit
     FROM InvoiceDetails d
     INNER JOIN Invoices i ON d.InvoiceId = i.Id
     WHERE i.InvDate >= @Start AND i.InvDate <= @End
       AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'`,
    {
      Start: { type: sql.Date, value: startStr },
      End: { type: sql.Date, value: endStr },
    }
  );

  // 3. Query stock_opening_adj (điều chỉnh tồn đầu)
  const dtAdj = await executeQuery<any>(
    'SELECT ProductName, AdjQty, CostPrice FROM StockOpeningAdj WHERE Year = @Year AND Month = @Month',
    {
      Year: { type: sql.Int, value: year },
      Month: { type: sql.Int, value: month },
    }
  );

  const adjMap = new Map<string, { qty: number; costPrice: number | null }>();
  for (const r of dtAdj) {
    const pName = (r.ProductName || '').toLowerCase().trim();
    adjMap.set(pName, {
      qty: Number(r.AdjQty) || 0,
      costPrice: r.CostPrice !== null && r.CostPrice !== undefined ? Number(r.CostPrice) : null,
    });
  }

  // 4. Query batches tồn hiện tại
  const dtBatches = await executeQuery<any>(
    'SELECT ProductName, SUM(RemainingQty) AS TotalBatch FROM Batches WHERE RemainingQty > 0.005 GROUP BY ProductName'
  );
  const batchMap = new Map<string, number>();
  for (const r of dtBatches) {
    const pName = (r.ProductName || '').toLowerCase().trim();
    batchMap.set(pName, Number(r.TotalBatch) || 0);
  }

  // 5. Query hoá đơn SAU kỳ (xuất chỉ tính đã duyệt)
  const dtAfter = await executeQuery<any>(
    `SELECT i.Type, d.ProductName, d.Amount
     FROM InvoiceDetails d
     INNER JOIN Invoices i ON d.InvoiceId = i.Id
     WHERE i.InvDate > @End
       AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'`,
    {
      End: { type: sql.Date, value: endStr },
    }
  );

  const futureMap = new Map<string, { fn: number; fx: number }>();
  for (const r of dtAfter) {
    const pName = (r.ProductName || '').toLowerCase().trim();
    const type = r.Type;
    const amt = Number(r.Amount) || 0;
    if (!futureMap.has(pName)) futureMap.set(pName, { fn: 0, fx: 0 });
    const cur = futureMap.get(pName)!;
    if (type === 'in') cur.fn += amt;
    else cur.fx += amt;
  }

  // 6. Gom phát sinh trong tháng theo sản phẩm (case-insensitive)
  const pmap = new Map<
    string,
    { nhap: number; tienNhap: number; xuat: number; tienXuat: number }
  >();
  for (const r of dtInMonth) {
    const pName = (r.ProductName || '').toLowerCase().trim();
    const type = r.Type;
    const amt = Number(r.Amount) || 0;
    const price = Number(r.Price) || 0;
    const subtotal = amt * price;

    if (!pmap.has(pName))
      pmap.set(pName, { nhap: 0, tienNhap: 0, xuat: 0, tienXuat: 0 });

    const cur = pmap.get(pName)!;
    if (type === 'in') {
      cur.nhap += amt;
      cur.tienNhap += subtotal;
    } else {
      cur.xuat += amt;
      cur.tienXuat += subtotal;
    }
  }

  // 7. Tổng hợp dữ liệu từng dòng
  let stt = 1;
  for (const r of dtProducts) {
    const pName = (r.Name || '').trim();
    const key = pName.toLowerCase();
    const donGia = Number(r.CostPrice) || 0;
    const category = r.Category || 'Khác';
    const unit = r.Unit || 'kg';
    const code = r.Code || '';

    const e = pmap.get(key) || { nhap: 0, tienNhap: 0, xuat: 0, tienXuat: 0 };
    const batchQty = batchMap.get(key) || 0;
    const fut = futureMap.get(key) || { fn: 0, fx: 0 };
    const hasAdj = adjMap.has(key);

    let tonDau: number;
    let tonCuoi: number;
    let donGiaDau = donGia;

    if (hasAdj) {
      const adjInfo = adjMap.get(key)!;
      tonDau = adjInfo.qty;
      if (adjInfo.costPrice !== null && adjInfo.costPrice > 0) {
        donGiaDau = adjInfo.costPrice;
      }
      tonCuoi = tonDau + e.nhap - e.xuat;
    } else {
      tonCuoi = batchQty + fut.fx - fut.fn;
      tonDau = tonCuoi - e.nhap + e.xuat;
    }

    if (
      Math.abs(tonDau) < 0.001 &&
      Math.abs(tonCuoi) < 0.001 &&
      Math.abs(e.nhap) < 0.001 &&
      Math.abs(e.xuat) < 0.001
    ) {
      continue;
    }

    result.push({
      STT: stt++,
      Code: code,
      Name: pName,
      Category: category,
      Unit: unit,
      DonGia: donGia,
      TonDau: tonDau,
      TienDau: tonDau * donGiaDau,
      Nhap: e.nhap,
      TienNhap: e.tienNhap > 0 ? e.tienNhap : e.nhap * donGia,
      Xuat: e.xuat,
      TienXuat: e.tienXuat > 0 ? e.tienXuat : e.xuat * donGia,
      TonCuoi: tonCuoi,
      TienCuoi: tonCuoi * donGia,
      TonDauAuto: !hasAdj,
    });
  }

  return result;
}

export interface StockCardItem {
  InvoiceId: number;
  InvDate: string;
  Code: string;
  Type: 'in' | 'out';
  Partner: string;
  Note: string;
  Unit: string;
  Price: number;
  QtyIn: number;
  QtyOut: number;
  RunningBalance: number;
}

export interface StockCardReport {
  ProductName: string;
  ProductCode?: string;
  Category?: string;
  Unit: string;
  CostPrice: number;
  FromDate: string;
  ToDate: string;
  OpeningBalance: number;
  TotalIn: number;
  TotalOut: number;
  ClosingBalance: number;
  Transactions: StockCardItem[];
}

export async function getStockCardReport(
  productName: string,
  fromDate: string,
  toDate: string
): Promise<StockCardReport | null> {
  const normName = productName.trim().toLowerCase();

  const prodRows = await executeQuery<any>(
    `SELECT TOP 1 Id, Code, Name, Category, Unit, CostPrice 
     FROM Products 
     WHERE LOWER(LTRIM(RTRIM(Name))) = @Name`,
    { Name: { type: sql.NVarChar(255), value: normName } }
  );

  const product = prodRows.length > 0 ? prodRows[0] : null;
  const unit = product?.Unit || 'kg';
  const code = product?.Code || '';
  const category = product?.Category || '';
  const costPrice = Number(product?.CostPrice) || 0;

  // 1. Opening balance before fromDate
  const openRows = await executeQuery<any>(
    `SELECT ISNULL(SUM(CASE WHEN i.Type = 'in' THEN d.Amount ELSE -d.Amount END), 0) AS OpeningQty
     FROM InvoiceDetails d
     INNER JOIN Invoices i ON d.InvoiceId = i.Id
     WHERE LOWER(LTRIM(RTRIM(d.ProductName))) = @Name
       AND i.InvDate < @FromDate
       AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'`,
    {
      Name: { type: sql.NVarChar(255), value: normName },
      FromDate: { type: sql.Date, value: fromDate },
    }
  );
  const openingBalance = Number(openRows[0]?.OpeningQty) || 0;

  // 2. Transactions during period
  const transRows = await executeQuery<any>(
    `SELECT i.Id AS InvoiceId, i.InvDate, i.Code, i.Type, i.Partner, i.Note, d.Amount, d.Price, d.Unit
     FROM InvoiceDetails d
     INNER JOIN Invoices i ON d.InvoiceId = i.Id
     WHERE LOWER(LTRIM(RTRIM(d.ProductName))) = @Name
       AND i.InvDate >= @FromDate AND i.InvDate <= @ToDate
       AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'
     ORDER BY i.InvDate ASC, i.Id ASC`,
    {
      Name: { type: sql.NVarChar(255), value: normName },
      FromDate: { type: sql.Date, value: fromDate },
      ToDate: { type: sql.Date, value: toDate },
    }
  );

  let running = openingBalance;
  let totalIn = 0;
  let totalOut = 0;

  const transactions: StockCardItem[] = transRows.map((r) => {
    const isSupply = r.Type === 'in';
    const amt = Number(r.Amount) || 0;
    const qtyIn = isSupply ? amt : 0;
    const qtyOut = isSupply ? 0 : amt;

    running += isSupply ? amt : -amt;
    totalIn += qtyIn;
    totalOut += qtyOut;

    return {
      InvoiceId: Number(r.InvoiceId),
      InvDate: r.InvDate ? new Date(r.InvDate).toISOString().split('T')[0] : '',
      Code: r.Code || '',
      Type: r.Type,
      Partner: r.Partner || '',
      Note: r.Note || '',
      Unit: r.Unit || unit,
      Price: Number(r.Price) || 0,
      QtyIn: qtyIn,
      QtyOut: qtyOut,
      RunningBalance: running,
    };
  });

  return {
    ProductName: product ? product.Name : productName,
    ProductCode: code,
    Category: category,
    Unit: unit,
    CostPrice: costPrice,
    FromDate: fromDate,
    ToDate: toDate,
    OpeningBalance: openingBalance,
    TotalIn: totalIn,
    TotalOut: totalOut,
    ClosingBalance: running,
    Transactions: transactions,
  };
}
