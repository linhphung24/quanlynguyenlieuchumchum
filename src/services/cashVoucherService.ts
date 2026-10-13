import { executeQuery, executeNonQuery, executeScalar, sql } from '@/lib/db';
import {
  CashVoucher,
  CashVoucherDetail,
  CashReportData,
  CashReportItem,
  CashOpeningBalanceInfo,
} from '@/types';
import { logAudit } from '@/lib/audit';
import { isDateLocked } from './periodLockService';

function getNextSequence(maxCode?: string | null): number {
  if (!maxCode) return 1;
  const dashIndex = maxCode.lastIndexOf('-');
  if (dashIndex < 0) return 1;
  const seq = parseInt(maxCode.substring(dashIndex + 1), 10);
  if (isNaN(seq)) return 1;
  return seq + 1;
}

export async function nextCode(type: 'thu' | 'chi'): Promise<string> {
  const prefix = type === 'thu' ? 'PT-' : 'PC-';
  const scalar = await executeScalar<string>(
    `SELECT MAX(Code) FROM CashVouchers WHERE Type = @Type AND Code LIKE @Prefix + '%'`,
    {
      Type: { type: sql.NVarChar(10), value: type },
      Prefix: { type: sql.NVarChar(10), value: prefix },
    }
  );

  const seq = getNextSequence(scalar);
  return `${prefix}${seq.toString().padStart(4, '0')}`;
}

export async function getVouchers(
  fromDate: string,
  toDate: string,
  keyword: string = '',
  type: string = ''
): Promise<CashVoucher[]> {
  const hasKeyword = Boolean(keyword.trim());
  let queryText = 'SELECT * FROM CashVouchers WHERE 1=1';
  const params: Record<string, { type?: any; value: any }> = {};

  if (!hasKeyword) {
    queryText += ' AND VoucherDate >= @FromDate AND VoucherDate <= @ToDate';
    params.FromDate = { type: sql.Date, value: fromDate };
    params.ToDate = { type: sql.Date, value: toDate };
  } else {
    queryText += ` AND (
      Code LIKE @Keyword OR
      Partner LIKE @Keyword OR
      Reason LIKE @Keyword OR
      Receiver LIKE @Keyword
    )`;
    params.Keyword = { type: sql.NVarChar(255), value: `%${keyword.trim()}%` };
  }

  if (type) {
    queryText += ' AND Type = @Type';
    params.Type = { type: sql.NVarChar(10), value: type };
  }

  queryText += ' ORDER BY VoucherDate DESC, Id DESC';

  const rows = await executeQuery<any>(queryText, params);

  return rows.map((r) => ({
    Id: Number(r.Id),
    Type: r.Type,
    VoucherDate: r.VoucherDate ? new Date(r.VoucherDate).toISOString().split('T')[0] : '',
    Code: r.Code || '',
    Partner: r.Partner || '',
    SupplierId: r.SupplierId ? Number(r.SupplierId) : null,
    PartnerAddress: r.PartnerAddress || '',
    Receiver: r.Receiver || '',
    Reason: r.Reason || '',
    Amount: Number(r.Amount) || 0,
    PaymentMethod: r.PaymentMethod || 'Tiền mặt',
    AttachedDocs: r.AttachedDocs || '',
    Note: r.Note || '',
    CreatedBy: r.CreatedBy || '',
    UpdatedBy: r.UpdatedBy || '',
    CreatedAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : undefined,
    UpdatedAt: r.UpdatedAt ? new Date(r.UpdatedAt).toISOString() : undefined,
  }));
}

export async function getVoucherById(id: number): Promise<CashVoucher | null> {
  const rows = await executeQuery<any>(
    'SELECT * FROM CashVouchers WHERE Id = @Id',
    { Id: { type: sql.Int, value: id } }
  );

  if (rows.length === 0) return null;
  const r = rows[0];

  return {
    Id: Number(r.Id),
    Type: r.Type,
    VoucherDate: r.VoucherDate ? new Date(r.VoucherDate).toISOString().split('T')[0] : '',
    Code: r.Code || '',
    Partner: r.Partner || '',
    SupplierId: r.SupplierId ? Number(r.SupplierId) : null,
    PartnerAddress: r.PartnerAddress || '',
    Receiver: r.Receiver || '',
    Reason: r.Reason || '',
    Amount: Number(r.Amount) || 0,
    PaymentMethod: r.PaymentMethod || 'Tiền mặt',
    AttachedDocs: r.AttachedDocs || '',
    Note: r.Note || '',
    CreatedBy: r.CreatedBy || '',
    UpdatedBy: r.UpdatedBy || '',
    CreatedAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : undefined,
    UpdatedAt: r.UpdatedAt ? new Date(r.UpdatedAt).toISOString() : undefined,
  };
}

export async function getVoucherDetails(voucherId: number): Promise<CashVoucherDetail[]> {
  const rows = await executeQuery<any>(
    'SELECT * FROM CashVoucherDetails WHERE VoucherId = @VoucherId ORDER BY Id',
    { VoucherId: { type: sql.Int, value: voucherId } }
  );

  return rows.map((r) => ({
    Id: Number(r.Id),
    VoucherId: Number(r.VoucherId),
    Description: r.Description || '',
    DebitAccount: r.DebitAccount || '',
    CreditAccount: r.CreditAccount || '',
    Amount: Number(r.Amount) || 0,
  }));
}

export async function saveVoucher(
  voucher: Partial<CashVoucher>,
  details: CashVoucherDetail[],
  currentUser: string = 'system'
): Promise<number> {
  if (await isDateLocked(voucher.VoucherDate)) {
    const d = new Date(voucher.VoucherDate!);
    throw new Error(
      `Kỳ kế toán tháng ${d.getMonth() + 1}/${d.getFullYear()} đã được khóa sổ. Không thể tạo phiếu thu/chi trong kỳ này!`
    );
  }

  let vCode = voucher.Code;
  if (!vCode || !vCode.trim()) {
    vCode = await nextCode(voucher.Type || 'chi');
  }

  const normalizedDetails =
    details && details.length > 0
      ? details
      : [
          {
            Description: voucher.Reason || '',
            Amount: voucher.Amount || 0,
            DebitAccount: '',
            CreditAccount: '',
          },
        ];

  const totalAmount = normalizedDetails.reduce((sum, d) => sum + Number(d.Amount || 0), 0);

  let resolvedSupplierId = voucher.SupplierId || null;
  if (!resolvedSupplierId && voucher.Partner?.trim()) {
    try {
      const match = await executeScalar<number>(
        'SELECT TOP 1 Id FROM Suppliers WHERE LOWER(LTRIM(RTRIM(Name))) = LOWER(LTRIM(RTRIM(@Partner)))',
        { Partner: { type: sql.NVarChar(255), value: voucher.Partner.trim() } }
      );
      if (match) resolvedSupplierId = match;
    } catch {}
  }

  const insertSql = `
    INSERT INTO CashVouchers (Type, VoucherDate, Code, Partner, SupplierId, PartnerAddress, Receiver, Reason, Amount, PaymentMethod, AttachedDocs, Note, CreatedBy, CreatedAt)
    OUTPUT INSERTED.Id
    VALUES (@Type, @VoucherDate, @Code, @Partner, @SupplierId, @PartnerAddress, @Receiver, @Reason, @Amount, @PaymentMethod, @AttachedDocs, @Note, @CreatedBy, GETDATE())
  `;

  const newId = await executeScalar<number>(insertSql, {
    Type: { type: sql.NVarChar(10), value: voucher.Type || 'chi' },
    VoucherDate: { type: sql.Date, value: voucher.VoucherDate },
    Code: { type: sql.NVarChar(50), value: vCode },
    Partner: { type: sql.NVarChar(255), value: voucher.Partner || '' },
    SupplierId: { type: sql.Int, value: resolvedSupplierId },
    PartnerAddress: { type: sql.NVarChar(255), value: voucher.PartnerAddress || null },
    Receiver: { type: sql.NVarChar(255), value: voucher.Receiver || null },
    Reason: { type: sql.NVarChar(500), value: voucher.Reason || '' },
    Amount: { type: sql.Decimal(18, 2), value: totalAmount },
    PaymentMethod: { type: sql.NVarChar(30), value: voucher.PaymentMethod || 'Tiền mặt' },
    AttachedDocs: { type: sql.NVarChar(100), value: voucher.AttachedDocs || null },
    Note: { type: sql.NVarChar(sql.MAX), value: voucher.Note || null },
    CreatedBy: { type: sql.NVarChar(100), value: currentUser },
  });

  const detailInsertSql = `
    INSERT INTO CashVoucherDetails (VoucherId, Description, DebitAccount, CreditAccount, Amount)
    VALUES (@VoucherId, @Description, @DebitAccount, @CreditAccount, @Amount)
  `;

  for (const d of normalizedDetails) {
    await executeNonQuery(detailInsertSql, {
      VoucherId: { type: sql.Int, value: newId },
      Description: { type: sql.NVarChar(500), value: d.Description || '' },
      DebitAccount: { type: sql.NVarChar(20), value: d.DebitAccount || null },
      CreditAccount: { type: sql.NVarChar(20), value: d.CreditAccount || null },
      Amount: { type: sql.Decimal(18, 2), value: Number(d.Amount) || 0 },
    });
  }

  await logAudit(
    currentUser,
    currentUser,
    'CREATE',
    'CashVoucher',
    String(newId),
    `Tạo ${voucher.Type === 'thu' ? 'phiếu thu' : 'phiếu chi'} ${vCode}: ${totalAmount.toLocaleString('vi-VN')} đ — ${voucher.Partner || ''} — ${voucher.Reason || ''}`
  );

  return newId!;
}

export async function updateVoucher(
  id: number,
  voucher: Partial<CashVoucher>,
  details: CashVoucherDetail[],
  currentUser: string = 'system'
): Promise<void> {
  if (await isDateLocked(voucher.VoucherDate)) {
    const d = new Date(voucher.VoucherDate!);
    throw new Error(
      `Kỳ kế toán tháng ${d.getMonth() + 1}/${d.getFullYear()} đã được khóa sổ. Không thể sửa phiếu thu/chi trong kỳ này!`
    );
  }

  const normalizedDetails =
    details && details.length > 0
      ? details
      : [
          {
            Description: voucher.Reason || '',
            Amount: voucher.Amount || 0,
            DebitAccount: '',
            CreditAccount: '',
          },
        ];

  const totalAmount = normalizedDetails.reduce((sum, d) => sum + Number(d.Amount || 0), 0);

  let resolvedSupplierId = voucher.SupplierId || null;
  if (!resolvedSupplierId && voucher.Partner?.trim()) {
    try {
      const match = await executeScalar<number>(
        'SELECT TOP 1 Id FROM Suppliers WHERE LOWER(LTRIM(RTRIM(Name))) = LOWER(LTRIM(RTRIM(@Partner)))',
        { Partner: { type: sql.NVarChar(255), value: voucher.Partner.trim() } }
      );
      if (match) resolvedSupplierId = match;
    } catch {}
  }

  const updateSql = `
    UPDATE CashVouchers SET
        Type = @Type, VoucherDate = @VoucherDate, Code = @Code, Partner = @Partner, SupplierId = @SupplierId,
        PartnerAddress = @PartnerAddress, Receiver = @Receiver, Reason = @Reason,
        Amount = @Amount, PaymentMethod = @PaymentMethod, AttachedDocs = @AttachedDocs,
        Note = @Note, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE()
    WHERE Id = @Id
  `;

  await executeNonQuery(updateSql, {
    Type: { type: sql.NVarChar(10), value: voucher.Type || 'chi' },
    VoucherDate: { type: sql.Date, value: voucher.VoucherDate },
    Code: { type: sql.NVarChar(50), value: voucher.Code },
    Partner: { type: sql.NVarChar(255), value: voucher.Partner || '' },
    SupplierId: { type: sql.Int, value: resolvedSupplierId },
    PartnerAddress: { type: sql.NVarChar(255), value: voucher.PartnerAddress || null },
    Receiver: { type: sql.NVarChar(255), value: voucher.Receiver || null },
    Reason: { type: sql.NVarChar(500), value: voucher.Reason || '' },
    Amount: { type: sql.Decimal(18, 2), value: totalAmount },
    PaymentMethod: { type: sql.NVarChar(30), value: voucher.PaymentMethod || 'Tiền mặt' },
    AttachedDocs: { type: sql.NVarChar(100), value: voucher.AttachedDocs || null },
    Note: { type: sql.NVarChar(sql.MAX), value: voucher.Note || null },
    UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
    Id: { type: sql.Int, value: id },
  });

  await executeNonQuery('DELETE FROM CashVoucherDetails WHERE VoucherId = @Id', {
    Id: { type: sql.Int, value: id },
  });

  const detailInsertSql = `
    INSERT INTO CashVoucherDetails (VoucherId, Description, DebitAccount, CreditAccount, Amount)
    VALUES (@VoucherId, @Description, @DebitAccount, @CreditAccount, @Amount)
  `;

  for (const d of normalizedDetails) {
    await executeNonQuery(detailInsertSql, {
      VoucherId: { type: sql.Int, value: id },
      Description: { type: sql.NVarChar(500), value: d.Description || '' },
      DebitAccount: { type: sql.NVarChar(20), value: d.DebitAccount || null },
      CreditAccount: { type: sql.NVarChar(20), value: d.CreditAccount || null },
      Amount: { type: sql.Decimal(18, 2), value: Number(d.Amount) || 0 },
    });
  }

  await logAudit(
    currentUser,
    currentUser,
    'UPDATE',
    'CashVoucher',
    String(id),
    `Sửa ${voucher.Type === 'thu' ? 'phiếu thu' : 'phiếu chi'} ${voucher.Code}: ${totalAmount.toLocaleString('vi-VN')} đ`
  );
}

export async function deleteVoucher(id: number, currentUser: string = 'system'): Promise<void> {
  const row = await executeQuery<any>(
    'SELECT Code, Type, VoucherDate FROM CashVouchers WHERE Id = @Id',
    { Id: { type: sql.Int, value: id } }
  );

  if (row.length > 0 && (await isDateLocked(row[0].VoucherDate))) {
    const d = new Date(row[0].VoucherDate);
    throw new Error(
      `Kỳ kế toán tháng ${d.getMonth() + 1}/${d.getFullYear()} đã được khóa sổ. Không thể xóa phiếu thu/chi trong kỳ này!`
    );
  }

  const code = row.length > 0 ? row[0].Code : '';
  const type = row.length > 0 ? row[0].Type : '';

  await executeNonQuery('DELETE FROM CashVoucherDetails WHERE VoucherId = @Id', {
    Id: { type: sql.Int, value: id },
  });
  await executeNonQuery('DELETE FROM CashVouchers WHERE Id = @Id', {
    Id: { type: sql.Int, value: id },
  });

  await logAudit(
    currentUser,
    currentUser,
    'DELETE',
    'CashVoucher',
    String(id),
    `Xóa ${type === 'thu' ? 'phiếu thu' : 'phiếu chi'} ${code} (ID: ${id})`
  );
}

export async function getCashOpeningBalance(): Promise<CashOpeningBalanceInfo | null> {
  const rows = await executeQuery<any>(
    `SELECT TOP 1 
        Id,
        CONVERT(VARCHAR(10), OpeningDate, 120) AS OpeningDate,
        OpeningAmount,
        Note,
        UpdatedBy,
        CONVERT(VARCHAR(19), UpdatedAt, 120) AS UpdatedAt
     FROM CashOpeningBalance 
     ORDER BY OpeningDate DESC, Id DESC`
  );
  if (rows.length === 0) return null;
  return {
    Id: Number(rows[0].Id),
    OpeningDate: rows[0].OpeningDate,
    OpeningAmount: Number(rows[0].OpeningAmount) || 0,
    Note: rows[0].Note || '',
    UpdatedBy: rows[0].UpdatedBy || '',
    UpdatedAt: rows[0].UpdatedAt || '',
  };
}

export async function saveCashOpeningBalance(
  openingDate: string,
  openingAmount: number,
  note: string = '',
  currentUser: string = 'system'
): Promise<void> {
  const existing = await executeScalar<number>('SELECT TOP 1 Id FROM CashOpeningBalance ORDER BY Id DESC');
  if (existing) {
    await executeNonQuery(
      `UPDATE CashOpeningBalance 
       SET OpeningDate = @OpeningDate, 
           OpeningAmount = @OpeningAmount, 
           Note = @Note, 
           UpdatedBy = @UpdatedBy, 
           UpdatedAt = GETDATE()
       WHERE Id = @Id`,
      {
        Id: { type: sql.Int, value: existing },
        OpeningDate: { type: sql.Date, value: openingDate },
        OpeningAmount: { type: sql.Decimal(18, 2), value: openingAmount },
        Note: { type: sql.NVarChar(500), value: note || null },
        UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
      }
    );
  } else {
    await executeNonQuery(
      `INSERT INTO CashOpeningBalance (OpeningDate, OpeningAmount, Note, CreatedBy, CreatedAt, UpdatedBy, UpdatedAt)
       VALUES (@OpeningDate, @OpeningAmount, @Note, @UpdatedBy, GETDATE(), @UpdatedBy, GETDATE())`,
      {
        OpeningDate: { type: sql.Date, value: openingDate },
        OpeningAmount: { type: sql.Decimal(18, 2), value: openingAmount },
        Note: { type: sql.NVarChar(500), value: note || null },
        UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
      }
    );
  }

  await logAudit(
    currentUser,
    currentUser,
    'UPDATE_OPENING_CASH',
    'CashOpeningBalance',
    String(existing || 1),
    `Khai báo tồn quỹ tiền mặt đầu kỳ: ${openingAmount.toLocaleString('vi-VN')} đ (Ngày chốt: ${openingDate})`
  );
}

export async function getCashReport(
  fromDate: string,
  toDate: string,
  keyword: string = ''
): Promise<CashReportData> {
  const openingInfo = await getCashOpeningBalance();
  const initOpeningAmount = openingInfo ? openingInfo.OpeningAmount : 0;
  const initOpeningDate = openingInfo ? openingInfo.OpeningDate : '2000-01-01';

  // 1. Tính Tồn Quỹ Đầu Kỳ (< fromDate)
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

  // 2. Lấy danh sách giao dịch thu/chi trong kỳ [fromDate, toDate]
  let query = `
    SELECT Id, Type, VoucherDate, Code, Partner, Receiver, Reason, Amount, PaymentMethod
    FROM CashVouchers
    WHERE VoucherDate >= @FromDate AND VoucherDate <= @ToDate
  `;
  const params: Record<string, { type?: any; value: any }> = {
    FromDate: { type: sql.Date, value: fromDate },
    ToDate: { type: sql.Date, value: toDate },
  };

  if (keyword.trim()) {
    query += ` AND (
      Code LIKE @Keyword OR 
      Partner LIKE @Keyword OR 
      Receiver LIKE @Keyword OR 
      Reason LIKE @Keyword
    )`;
    params.Keyword = { type: sql.NVarChar(255), value: `%${keyword.trim()}%` };
  }

  query += ` ORDER BY VoucherDate ASC, Id ASC`;

  const rows = await executeQuery<any>(query, params);

  let running = Math.round(openingCash);
  let totalThu = 0;
  let totalChi = 0;

  const items: CashReportItem[] = rows.map((r) => {
    const isThu = r.Type === 'thu';
    const amt = Number(r.Amount) || 0;
    const thuAmt = isThu ? amt : 0;
    const chiAmt = isThu ? 0 : amt;

    running = running + thuAmt - chiAmt;
    totalThu += thuAmt;
    totalChi += chiAmt;

    return {
      Id: Number(r.Id),
      VoucherDate: r.VoucherDate ? new Date(r.VoucherDate).toISOString().split('T')[0] : '',
      Code: r.Code || '',
      Type: r.Type,
      Partner: r.Partner || '',
      Receiver: r.Receiver || '',
      Reason: r.Reason || '',
      PaymentMethod: r.PaymentMethod || 'Tiền mặt',
      ThuAmount: Math.round(thuAmt),
      ChiAmount: Math.round(chiAmt),
      RunningBalance: Math.round(running),
    };
  });

  const netCash = totalThu - totalChi;
  const closingCash = openingCash + netCash;

  return {
    fromDate,
    toDate,
    openingCash: Math.round(openingCash),
    totalThu: Math.round(totalThu),
    totalChi: Math.round(totalChi),
    netCash: Math.round(netCash),
    closingCash: Math.round(closingCash),
    initialOpeningCash: openingInfo ? openingInfo.OpeningAmount : undefined,
    initialOpeningDate: openingInfo ? openingInfo.OpeningDate : undefined,
    items,
  };
}
