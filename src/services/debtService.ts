import { executeQuery, executeNonQuery, sql } from '@/lib/db';
import {
  SupplierDebtSummary,
  SupplierDebtTransaction,
  SupplierDebtDetailReport,
  Supplier,
  SupplierOpeningDebtItem,
} from '@/types';
import { logAudit } from '@/lib/audit';

export async function getSupplierDebtSummary(
  fromDate: string,
  toDate: string,
  keyword: string = ''
): Promise<{
  suppliers: SupplierDebtSummary[];
  totals: {
    totalPayable: number;
    totalPurchased: number;
    totalPaid: number;
    suppliersInDebtCount: number;
  };
}> {
  // Query all active suppliers or partners with transactions
  const query = `
    WITH InvoicesWithTotal AS (
      SELECT 
        i.Id,
        i.Type,
        i.InvDate,
        i.Code,
        i.SupplierId,
        LOWER(LTRIM(RTRIM(i.Partner))) AS NormalizedPartner,
        i.Partner,
        i.ApprovalStatus,
        ISNULL((
          SELECT SUM(CASE WHEN d.Subtotal > 0 THEN d.Subtotal ELSE d.Amount * d.Price END)
          FROM InvoiceDetails d 
          WHERE d.InvoiceId = i.Id
        ), 0) AS TotalAmount
      FROM Invoices i
      WHERE i.Partner IS NOT NULL AND LTRIM(RTRIM(i.Partner)) <> ''
    ),
    VouchersWithSupplier AS (
      SELECT 
        v.Id,
        v.Type,
        v.VoucherDate,
        v.Code,
        v.SupplierId,
        LOWER(LTRIM(RTRIM(v.Partner))) AS NormalizedPartner,
        v.Partner,
        v.Amount
      FROM CashVouchers v
      WHERE v.Partner IS NOT NULL AND LTRIM(RTRIM(v.Partner)) <> ''
    ),
    ActiveSuppliers AS (
      SELECT 
        s.Id,
        LTRIM(RTRIM(s.Name)) AS Name,
        s.Phone,
        s.Address,
        LOWER(LTRIM(RTRIM(s.Name))) AS NormalizedName,
        ISNULL(o.OpeningDebt, 0) AS OpeningDebt,
        ISNULL(CONVERT(VARCHAR(10), o.OpeningDate, 120), '2000-01-01') AS OpeningDate
      FROM Suppliers s
      LEFT JOIN SupplierDebtOpening o ON o.SupplierId = s.Id
      WHERE s.IsActive = 1
    ),
    CanonicalSuppliers AS (
      SELECT 
        MIN(Id) AS Id,
        MAX(Name) AS Name,
        MAX(Phone) AS Phone,
        MAX(Address) AS Address,
        NormalizedName,
        MAX(OpeningDebt) AS InitialOpeningDebt,
        MAX(OpeningDate) AS InitialOpeningDate
      FROM ActiveSuppliers
      GROUP BY NormalizedName
    )
    SELECT 
      s.Id AS SupplierId,
      s.Name AS SupplierName,
      s.Phone,
      s.Address,
      s.InitialOpeningDebt,
      s.InitialOpeningDate,
      -- Dư nợ đầu kỳ (< FromDate)
      s.InitialOpeningDebt
      + ISNULL((
        SELECT SUM(i.TotalAmount)
        FROM InvoicesWithTotal i
        WHERE i.Type = 'in'
          AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'
          AND i.InvDate >= s.InitialOpeningDate AND i.InvDate < @FromDate
          AND (i.SupplierId = s.Id OR i.NormalizedPartner = s.NormalizedName)
      ), 0) 
      - ISNULL((
        SELECT SUM(i.TotalAmount)
        FROM InvoicesWithTotal i
        WHERE i.Type = 'out' 
          AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'
          AND i.InvDate >= s.InitialOpeningDate AND i.InvDate < @FromDate
          AND (i.SupplierId = s.Id OR i.NormalizedPartner = s.NormalizedName)
      ), 0)
      - ISNULL((
        SELECT SUM(v.Amount)
        FROM VouchersWithSupplier v
        WHERE v.Type = 'chi'
          AND v.VoucherDate >= s.InitialOpeningDate AND v.VoucherDate < @FromDate
          AND (v.SupplierId = s.Id OR v.NormalizedPartner = s.NormalizedName)
      ), 0)
      + ISNULL((
        SELECT SUM(v.Amount)
        FROM VouchersWithSupplier v
        WHERE v.Type = 'thu'
          AND v.VoucherDate >= s.InitialOpeningDate AND v.VoucherDate < @FromDate
          AND (v.SupplierId = s.Id OR v.NormalizedPartner = s.NormalizedName)
      ), 0) AS DauKy,

      -- Phát sinh TĂNG trong kỳ (Tiền hàng Nhập kho [FromDate, ToDate])
      ISNULL((
        SELECT SUM(i.TotalAmount)
        FROM InvoicesWithTotal i
        WHERE i.Type = 'in'
          AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'
          AND i.InvDate >= @FromDate AND i.InvDate <= @ToDate
          AND i.InvDate >= s.InitialOpeningDate
          AND (i.SupplierId = s.Id OR i.NormalizedPartner = s.NormalizedName)
      ), 0) AS TangTrongKy,

      -- Phát sinh GIẢM trong kỳ (Chi tiền mặt + Xuất trả [FromDate, ToDate])
      ISNULL((
        SELECT SUM(v.Amount)
        FROM VouchersWithSupplier v
        WHERE v.Type = 'chi'
          AND v.VoucherDate >= @FromDate AND v.VoucherDate <= @ToDate
          AND v.VoucherDate >= s.InitialOpeningDate
          AND (v.SupplierId = s.Id OR v.NormalizedPartner = s.NormalizedName)
      ), 0)
      + ISNULL((
        SELECT SUM(i.TotalAmount)
        FROM InvoicesWithTotal i
        WHERE i.Type = 'out'
          AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'
          AND i.InvDate >= @FromDate AND i.InvDate <= @ToDate
          AND i.InvDate >= s.InitialOpeningDate
          AND (i.SupplierId = s.Id OR i.NormalizedPartner = s.NormalizedName)
      ), 0)
      - ISNULL((
        SELECT SUM(v.Amount)
        FROM VouchersWithSupplier v
        WHERE v.Type = 'thu'
          AND v.VoucherDate >= @FromDate AND v.VoucherDate <= @ToDate
          AND v.VoucherDate >= s.InitialOpeningDate
          AND (v.SupplierId = s.Id OR v.NormalizedPartner = s.NormalizedName)
      ), 0) AS GiamTrongKy
    FROM CanonicalSuppliers s
    ORDER BY TangTrongKy DESC, s.Name ASC
  `;

  const rows = await executeQuery<any>(query, {
    FromDate: { type: sql.Date, value: fromDate },
    ToDate: { type: sql.Date, value: toDate },
  });

  const kw = keyword.trim().toLowerCase();

  const suppliers: SupplierDebtSummary[] = rows
    .map((r) => {
      const dauKy = Number(r.DauKy) || 0;
      const tangTrongKy = Number(r.TangTrongKy) || 0;
      const giamTrongKy = Number(r.GiamTrongKy) || 0;
      const cuoiKy = dauKy + tangTrongKy - giamTrongKy;

      let status: 'in_debt' | 'settled' | 'overpaid' = 'settled';
      if (cuoiKy > 100) status = 'in_debt';
      else if (cuoiKy < -100) status = 'overpaid';

      return {
        SupplierId: Number(r.SupplierId),
        SupplierName: r.SupplierName || '',
        Phone: r.Phone || '',
        Address: r.Address || '',
        DauKy: Math.round(dauKy),
        TangTrongKy: Math.round(tangTrongKy),
        GiamTrongKy: Math.round(giamTrongKy),
        CuoiKy: Math.round(cuoiKy),
        Status: status,
        InitialOpeningDebt: Number(r.InitialOpeningDebt) || 0,
        InitialOpeningDate: r.InitialOpeningDate !== '2000-01-01' ? r.InitialOpeningDate : undefined,
      };
    })
    .filter((s) => {
      // Exclude suppliers with absolutely 0 transactions
      const hasActivity = s.DauKy !== 0 || s.TangTrongKy !== 0 || s.GiamTrongKy !== 0 || s.CuoiKy !== 0;
      if (!hasActivity) return false;
      if (!kw) return true;
      return (
        s.SupplierName.toLowerCase().includes(kw) ||
        (s.Phone && s.Phone.toLowerCase().includes(kw))
      );
    });

  // Calculate overall totals
  let totalPayable = 0;
  let totalPurchased = 0;
  let totalPaid = 0;
  let suppliersInDebtCount = 0;

  for (const s of suppliers) {
    if (s.CuoiKy > 0) {
      totalPayable += s.CuoiKy;
      suppliersInDebtCount++;
    }
    totalPurchased += s.TangTrongKy;
    totalPaid += s.GiamTrongKy;
  }

  return {
    suppliers,
    totals: {
      totalPayable: Math.round(totalPayable),
      totalPurchased: Math.round(totalPurchased),
      totalPaid: Math.round(totalPaid),
      suppliersInDebtCount,
    },
  };
}

export async function getSupplierDebtDetail(
  supplierId: number,
  fromDate: string,
  toDate: string
): Promise<SupplierDebtDetailReport | null> {
  // Get supplier info
  const supRows = await executeQuery<any>(
    'SELECT Id, Name, Phone, Address, Note FROM Suppliers WHERE Id = @Id',
    { Id: { type: sql.Int, value: supplierId } }
  );

  let supplierName = '';
  let phone = '';
  let address = '';

  if (supRows.length > 0) {
    supplierName = supRows[0].Name;
    phone = supRows[0].Phone || '';
    address = supRows[0].Address || '';
  } else {
    return null;
  }

  const normalizedName = supplierName.trim().toLowerCase();

  // 1. Get Opening Debt from SupplierDebtOpening if exists
  const openingRow = await executeQuery<any>(
    `SELECT TOP 1 
        ISNULL(OpeningDebt, 0) AS OpeningDebt, 
        CONVERT(VARCHAR(10), OpeningDate, 120) AS OpeningDate, 
        Note 
     FROM SupplierDebtOpening 
     WHERE SupplierId = @SupplierId 
        OR SupplierId IN (
          SELECT Id FROM Suppliers WHERE LOWER(LTRIM(RTRIM(Name))) = @NormalizedName
        )`,
    {
      SupplierId: { type: sql.Int, value: supplierId },
      NormalizedName: { type: sql.NVarChar(255), value: normalizedName },
    }
  );

  const initialOpeningDebt = Number(openingRow[0]?.OpeningDebt) || 0;
  const initialOpeningDate = openingRow[0]?.OpeningDate || '2000-01-01';
  const initialOpeningNote = openingRow[0]?.Note || '';

  // 1. Calculate Beginning Balance (Dư đầu kỳ < fromDate)
  const dauKyQuery = `
    SELECT 
      @InitialOpeningDebt
      + ISNULL((
        SELECT SUM(d.Amount * d.Price)
        FROM Invoices i
        JOIN InvoiceDetails d ON i.Id = d.InvoiceId
        WHERE i.Type = 'in'
          AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'
          AND i.InvDate >= @InitialOpeningDate AND i.InvDate < @FromDate
          AND (i.SupplierId = @SupplierId OR LOWER(LTRIM(RTRIM(i.Partner))) = @NormalizedName)
      ), 0)
      - ISNULL((
        SELECT SUM(d.Amount * d.Price)
        FROM Invoices i
        JOIN InvoiceDetails d ON i.Id = d.InvoiceId
        WHERE i.Type = 'out' AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'
          AND i.InvDate >= @InitialOpeningDate AND i.InvDate < @FromDate
          AND (i.SupplierId = @SupplierId OR LOWER(LTRIM(RTRIM(i.Partner))) = @NormalizedName)
      ), 0)
      - ISNULL((
        SELECT SUM(v.Amount)
        FROM CashVouchers v
        WHERE v.Type = 'chi'
          AND v.VoucherDate >= @InitialOpeningDate AND v.VoucherDate < @FromDate
          AND (v.SupplierId = @SupplierId OR LOWER(LTRIM(RTRIM(v.Partner))) = @NormalizedName)
      ), 0)
      + ISNULL((
        SELECT SUM(v.Amount)
        FROM CashVouchers v
        WHERE v.Type = 'thu'
          AND v.VoucherDate >= @InitialOpeningDate AND v.VoucherDate < @FromDate
          AND (v.SupplierId = @SupplierId OR LOWER(LTRIM(RTRIM(v.Partner))) = @NormalizedName)
      ), 0) AS DauKy
  `;

  const dauKyRes = await executeQuery<any>(dauKyQuery, {
    SupplierId: { type: sql.Int, value: supplierId },
    NormalizedName: { type: sql.NVarChar(255), value: normalizedName },
    FromDate: { type: sql.Date, value: fromDate },
    InitialOpeningDebt: { type: sql.Decimal(18, 2), value: initialOpeningDebt },
    InitialOpeningDate: { type: sql.Date, value: initialOpeningDate },
  });

  const dauKy = Math.round(Number(dauKyRes[0]?.DauKy) || 0);

  // 2. Fetch Invoices in period
  const invoicesQuery = `
    SELECT 
      i.Id,
      i.Type,
      i.InvDate,
      i.Code,
      i.Note,
      ISNULL((
        SELECT SUM(CASE WHEN d.Subtotal > 0 THEN d.Subtotal ELSE d.Amount * d.Price END)
        FROM InvoiceDetails d WHERE d.InvoiceId = i.Id
      ), 0) AS TotalAmount
    FROM Invoices i
    WHERE i.InvDate >= @FromDate AND i.InvDate <= @ToDate
      AND i.InvDate >= @InitialOpeningDate
      AND (i.SupplierId = @SupplierId OR LOWER(LTRIM(RTRIM(i.Partner))) = @NormalizedName)
      AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'
  `;

  const invoicesRes = await executeQuery<any>(invoicesQuery, {
    SupplierId: { type: sql.Int, value: supplierId },
    NormalizedName: { type: sql.NVarChar(255), value: normalizedName },
    FromDate: { type: sql.Date, value: fromDate },
    ToDate: { type: sql.Date, value: toDate },
    InitialOpeningDate: { type: sql.Date, value: initialOpeningDate },
  });

  // 3. Fetch CashVouchers in period
  const vouchersQuery = `
    SELECT 
      v.Id,
      v.Type,
      v.VoucherDate,
      v.Code,
      v.Reason,
      v.Amount
    FROM CashVouchers v
    WHERE v.VoucherDate >= @FromDate AND v.VoucherDate <= @ToDate
      AND v.VoucherDate >= @InitialOpeningDate
      AND (v.SupplierId = @SupplierId OR LOWER(LTRIM(RTRIM(v.Partner))) = @NormalizedName)
  `;

  const vouchersRes = await executeQuery<any>(vouchersQuery, {
    SupplierId: { type: sql.Int, value: supplierId },
    NormalizedName: { type: sql.NVarChar(255), value: normalizedName },
    FromDate: { type: sql.Date, value: fromDate },
    ToDate: { type: sql.Date, value: toDate },
    InitialOpeningDate: { type: sql.Date, value: initialOpeningDate },
  });

  // 4. Combine and Sort all transactions
  interface RawTx {
    id: number | string;
    docType: 'nhap_kho' | 'xuat_kho' | 'phieu_chi' | 'phieu_thu';
    docTypeName: string;
    docDate: string;
    docCode: string;
    description: string;
    increase: number;
    decrease: number;
  }

  const rawTxList: RawTx[] = [];

  for (const inv of invoicesRes) {
    const isImport = inv.Type === 'in';
    const amount = Number(inv.TotalAmount) || 0;
    rawTxList.push({
      id: `inv-${inv.Id}`,
      docType: isImport ? 'nhap_kho' : 'xuat_kho',
      docTypeName: isImport ? 'Phiếu Nhập kho' : 'Phiếu Xuất trả',
      docDate: inv.InvDate ? new Date(inv.InvDate).toISOString().split('T')[0] : '',
      docCode: inv.Code || '',
      description: inv.Note || (isImport ? 'Nhập kho nguyên vật liệu' : 'Xuất kho trả hàng NCC'),
      increase: isImport ? amount : 0,
      decrease: isImport ? 0 : amount,
    });
  }

  for (const vou of vouchersRes) {
    const isChi = vou.Type === 'chi';
    const amount = Number(vou.Amount) || 0;
    rawTxList.push({
      id: `vou-${vou.Id}`,
      docType: isChi ? 'phieu_chi' : 'phieu_thu',
      docTypeName: isChi ? 'Phiếu Chi tiền mặt' : 'Phiếu Thu tiền mặt',
      docDate: vou.VoucherDate ? new Date(vou.VoucherDate).toISOString().split('T')[0] : '',
      docCode: vou.Code || '',
      description: vou.Reason || (isChi ? 'Chi thanh toán tiền hàng' : 'Thu hoàn tiền NCC'),
      increase: isChi ? 0 : amount,
      decrease: isChi ? amount : 0,
    });
  }

  // Sort chronologically: Date ASC, then Code ASC
  rawTxList.sort((a, b) => {
    if (a.docDate !== b.docDate) return a.docDate.localeCompare(b.docDate);
    return a.docCode.localeCompare(b.docCode);
  });

  // Calculate Running Balance
  let running = dauKy;
  let totalIncrease = 0;
  let totalDecrease = 0;

  const transactions: SupplierDebtTransaction[] = rawTxList.map((t) => {
    running = running + t.increase - t.decrease;
    totalIncrease += t.increase;
    totalDecrease += t.decrease;

    return {
      Id: t.id,
      DocType: t.docType,
      DocTypeName: t.docTypeName,
      DocDate: t.docDate,
      DocCode: t.docCode,
      Description: t.description,
      AmountIncrease: Math.round(t.increase),
      AmountDecrease: Math.round(t.decrease),
      RunningBalance: Math.round(running),
    };
  });

  return {
    SupplierId: supplierId,
    SupplierName: supplierName,
    Phone: phone,
    Address: address,
    FromDate: fromDate,
    ToDate: toDate,
    DauKy: dauKy,
    TangTrongKy: Math.round(totalIncrease),
    GiamTrongKy: Math.round(totalDecrease),
    CuoiKy: Math.round(running),
    InitialOpeningDebt: initialOpeningDebt,
    InitialOpeningDate: initialOpeningDate !== '2000-01-01' ? initialOpeningDate : undefined,
    InitialOpeningNote: initialOpeningNote || undefined,
    Transactions: transactions,
  };
}

export async function getSupplierOpeningDebts(): Promise<SupplierOpeningDebtItem[]> {
  const query = `
    SELECT 
      s.Id AS SupplierId,
      s.Name AS SupplierName,
      s.Phone,
      s.Address,
      ISNULL(o.OpeningDebt, 0) AS OpeningDebt,
      ISNULL(CONVERT(VARCHAR(10), o.OpeningDate, 120), '2026-01-01') AS OpeningDate,
      o.Note,
      CONVERT(VARCHAR(19), o.UpdatedAt, 120) AS UpdatedAt,
      o.UpdatedBy
    FROM Suppliers s
    LEFT JOIN SupplierDebtOpening o ON o.SupplierId = s.Id
    WHERE s.IsActive = 1
    ORDER BY s.Name ASC
  `;
  const rows = await executeQuery<any>(query);
  return rows.map((r) => ({
    SupplierId: Number(r.SupplierId),
    SupplierName: r.SupplierName || '',
    Phone: r.Phone || '',
    Address: r.Address || '',
    OpeningDebt: Number(r.OpeningDebt) || 0,
    OpeningDate: r.OpeningDate || '2026-01-01',
    Note: r.Note || '',
    UpdatedAt: r.UpdatedAt || undefined,
    UpdatedBy: r.UpdatedBy || undefined,
  }));
}

export async function saveSupplierOpeningDebt(
  supplierId: number,
  openingDebt: number,
  openingDate: string = '2026-01-01',
  note: string = '',
  currentUser: string = 'system'
): Promise<void> {
  const query = `
    MERGE SupplierDebtOpening AS target
    USING (SELECT @SupplierId AS SupplierId) AS source
    ON (target.SupplierId = source.SupplierId)
    WHEN MATCHED THEN
      UPDATE SET 
        OpeningDebt = @OpeningDebt,
        OpeningDate = @OpeningDate,
        Note = @Note,
        UpdatedBy = @UpdatedBy,
        UpdatedAt = GETDATE()
    WHEN NOT MATCHED THEN
      INSERT (SupplierId, OpeningDate, OpeningDebt, Note, CreatedBy, CreatedAt, UpdatedBy, UpdatedAt)
      VALUES (@SupplierId, @OpeningDate, @OpeningDebt, @Note, @UpdatedBy, GETDATE(), @UpdatedBy, GETDATE());
  `;

  await executeNonQuery(query, {
    SupplierId: { type: sql.Int, value: supplierId },
    OpeningDebt: { type: sql.Decimal(18, 2), value: openingDebt },
    OpeningDate: { type: sql.Date, value: openingDate },
    Note: { type: sql.NVarChar(500), value: note || null },
    UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
  });

  await logAudit(
    currentUser,
    currentUser,
    'UPDATE_OPENING_DEBT',
    'SupplierDebtOpening',
    String(supplierId),
    `Khai báo số dư đầu kỳ công nợ NCC ID ${supplierId}: ${openingDebt.toLocaleString('vi-VN')} đ (Ngày: ${openingDate})`
  );
}

export async function saveBulkSupplierOpeningDebts(
  items: { supplierId: number; openingDebt: number; openingDate: string; note?: string }[],
  currentUser: string = 'system'
): Promise<void> {
  for (const item of items) {
    await saveSupplierOpeningDebt(
      item.supplierId,
      item.openingDebt,
      item.openingDate || '2026-01-01',
      item.note || '',
      currentUser
    );
  }
}
