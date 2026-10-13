import { executeQuery, sql } from '@/lib/db';
import { getSupplierDebtSummary } from './debtService';
import { getPeriodStatus } from './periodLockService';
import { getCashOpeningBalance } from './cashVoucherService';

export interface CashFlowDataPoint {
  date: string;
  thu: number;
  chi: number;
  net: number;
}

export interface AccountingDashboardData {
  period: {
    fromDate: string;
    toDate: string;
  };
  cashFlow: {
    openingBalance: number;
    totalThu: number;
    totalChi: number;
    netCash: number;
    closingBalance: number;
    dailyData: CashFlowDataPoint[];
  };
  debt: {
    totalPayable: number;
    totalPurchased: number;
    totalPaid: number;
    suppliersInDebtCount: number;
    topSuppliers: {
      id: number;
      name: string;
      phone: string;
      debt: number;
    }[];
  };
  inventory: {
    totalStockValue: number;
    totalItems: number;
    lowStockCount: number;
    totalImportInPeriod: number;
    totalExportInPeriod: number;
  };
  recentActivities: {
    recentVouchers: {
      id: number;
      code: string;
      date: string;
      type: 'thu' | 'chi';
      partner: string;
      reason: string;
      amount: number;
    }[];
    pendingInvoicesCount: number;
    periodLock: {
      isLocked: boolean;
      lockedBy?: string;
      lockedAt?: string;
    };
  };
}

export async function getAccountingDashboard(
  fromDate: string,
  toDate: string
): Promise<AccountingDashboardData> {
  // 1. Quỹ tiền mặt (Cash on Hand)
  // 1.1 Tồn quỹ đầu kỳ (trước fromDate)
  const openingInfo = await getCashOpeningBalance();
  const initOpeningAmount = openingInfo ? openingInfo.OpeningAmount : 0;
  const initOpeningDate = openingInfo ? openingInfo.OpeningDate : '2000-01-01';

  let openingCash = 0;
  if (fromDate >= initOpeningDate) {
    const priorVouchers = await executeQuery<any>(
      `SELECT 
          ISNULL(SUM(CASE WHEN Type = 'thu' THEN Amount ELSE -Amount END), 0) AS Diff
       FROM CashVouchers
       WHERE VoucherDate >= @InitDate AND VoucherDate < @FromDate`,
      {
        InitDate: { type: sql.Date, value: initOpeningDate },
        FromDate: { type: sql.Date, value: fromDate },
      }
    );
    openingCash = initOpeningAmount + (Number(priorVouchers[0]?.Diff) || 0);
  } else {
    const priorVouchers = await executeQuery<any>(
      `SELECT 
          ISNULL(SUM(CASE WHEN Type = 'thu' THEN Amount ELSE -Amount END), 0) AS Diff
       FROM CashVouchers
       WHERE VoucherDate < @FromDate`,
      {
        FromDate: { type: sql.Date, value: fromDate },
      }
    );
    openingCash = Number(priorVouchers[0]?.Diff) || 0;
  }

  // 1.2 Thu / Chi trong kỳ
  const inPeriodCashRows = await executeQuery<any>(
    `SELECT 
        Type,
        VoucherDate,
        Amount
     FROM CashVouchers
     WHERE VoucherDate >= @FromDate AND VoucherDate <= @ToDate
     ORDER BY VoucherDate ASC`,
    {
      FromDate: { type: sql.Date, value: fromDate },
      ToDate: { type: sql.Date, value: toDate },
    }
  );

  let totalThu = 0;
  let totalChi = 0;
  const dailyMap = new Map<string, { thu: number; chi: number }>();

  for (const r of inPeriodCashRows) {
    const dStr = r.VoucherDate ? new Date(r.VoucherDate).toISOString().split('T')[0] : '';
    const amt = Number(r.Amount) || 0;
    if (!dailyMap.has(dStr)) {
      dailyMap.set(dStr, { thu: 0, chi: 0 });
    }
    const dayObj = dailyMap.get(dStr)!;
    if (r.Type === 'thu') {
      totalThu += amt;
      dayObj.thu += amt;
    } else {
      totalChi += amt;
      dayObj.chi += amt;
    }
  }

  const dailyData: CashFlowDataPoint[] = Array.from(dailyMap.entries()).map(([date, val]) => ({
    date,
    thu: Math.round(val.thu),
    chi: Math.round(val.chi),
    net: Math.round(val.thu - val.chi),
  }));

  const netCash = Math.round(totalThu - totalChi);
  const closingCash = Math.round(openingCash + netCash);

  // 2. Công nợ Nhà cung cấp
  const debtResult = await getSupplierDebtSummary(fromDate, toDate);
  const topSuppliers = debtResult.suppliers
    .filter((s) => s.CuoiKy > 0)
    .sort((a, b) => b.CuoiKy - a.CuoiKy)
    .slice(0, 5)
    .map((s) => ({
      id: s.SupplierId,
      name: s.SupplierName,
      phone: s.Phone || '',
      debt: Math.round(s.CuoiKy),
    }));

  // 3. Tồn kho & Giá trị tài sản
  const stockValRows = await executeQuery<any>(
    `SELECT 
        ISNULL(SUM(RemainingQty * Price), 0) AS TotalStockVal
     FROM Batches
     WHERE RemainingQty > 0.005`
  );
  const totalStockValue = Math.round(Number(stockValRows[0]?.TotalStockVal) || 0);

  const prodCountRows = await executeQuery<any>(
    `SELECT 
        COUNT(*) AS TotalCount,
        ISNULL(SUM(CASE WHEN StockQty < MinStock AND MinStock > 0 THEN 1 ELSE 0 END), 0) AS LowStockCount
     FROM Products
     WHERE IsActive = 1`
  );
  const totalItems = Number(prodCountRows[0]?.TotalCount) || 0;
  const lowStockCount = Number(prodCountRows[0]?.LowStockCount) || 0;

  // 4. Nhập / Xuất kho trong kỳ (Giá trị tiền)
  const invPeriodRows = await executeQuery<any>(
    `SELECT 
        i.Type,
        ISNULL(SUM(d.Amount * d.Price), 0) AS PeriodAmount
     FROM InvoiceDetails d
     INNER JOIN Invoices i ON d.InvoiceId = i.Id
     WHERE i.InvDate >= @FromDate AND i.InvDate <= @ToDate
       AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'
     GROUP BY i.Type`,
    {
      FromDate: { type: sql.Date, value: fromDate },
      ToDate: { type: sql.Date, value: toDate },
    }
  );

  let totalImportInPeriod = 0;
  let totalExportInPeriod = 0;
  for (const r of invPeriodRows) {
    if (r.Type === 'in') totalImportInPeriod = Math.round(Number(r.PeriodAmount) || 0);
    else totalExportInPeriod = Math.round(Number(r.PeriodAmount) || 0);
  }

  // 5. Hoạt động gần đây & Trạng thái chứng từ
  const recentVoucherRows = await executeQuery<any>(
    `SELECT TOP 6 Id, Code, VoucherDate, Type, Partner, Reason, Amount
     FROM CashVouchers
     ORDER BY VoucherDate DESC, Id DESC`
  );

  const recentVouchers = recentVoucherRows.map((r) => ({
    id: Number(r.Id),
    code: r.Code || '',
    date: r.VoucherDate ? new Date(r.VoucherDate).toISOString().split('T')[0] : '',
    type: r.Type as 'thu' | 'chi',
    partner: r.Partner || '',
    reason: r.Reason || '',
    amount: Math.round(Number(r.Amount) || 0),
  }));

  const pendingRows = await executeQuery<any>(
    `SELECT COUNT(*) AS PendingCount
     FROM Invoices
     WHERE ApprovalStatus = 'pending'`
  );
  const pendingInvoicesCount = Number(pendingRows[0]?.PendingCount) || 0;

  // Period Lock Status of toDate
  const toD = new Date(toDate);
  const periodLock = await getPeriodStatus(toD.getFullYear(), toD.getMonth() + 1);

  return {
    period: { fromDate, toDate },
    cashFlow: {
      openingBalance: Math.round(openingCash),
      totalThu: Math.round(totalThu),
      totalChi: Math.round(totalChi),
      netCash,
      closingBalance: closingCash,
      dailyData,
    },
    debt: {
      totalPayable: Math.round(debtResult.totals.totalPayable),
      totalPurchased: Math.round(debtResult.totals.totalPurchased),
      totalPaid: Math.round(debtResult.totals.totalPaid),
      suppliersInDebtCount: debtResult.totals.suppliersInDebtCount,
      topSuppliers,
    },
    inventory: {
      totalStockValue,
      totalItems,
      lowStockCount,
      totalImportInPeriod,
      totalExportInPeriod,
    },
    recentActivities: {
      recentVouchers,
      pendingInvoicesCount,
      periodLock,
    },
  };
}
