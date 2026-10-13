import { executeQuery, executeNonQuery, executeScalar, sql } from '@/lib/db';
import { Invoice, InvoiceDetail } from '@/types';
import { logAudit } from '@/lib/audit';
import {
  addBatchesFromInvoice,
  deductBatchesFifo,
  rebuildAllFifoBatches,
} from './fifoBatchService';
import { isDateLocked } from './periodLockService';

function normalizeName(name?: string | null): string {
  return (name || '').trim().toLowerCase();
}

async function ensureSubtotalsUpdated(): Promise<void> {
  try {
    await executeNonQuery(
      'UPDATE InvoiceDetails SET Subtotal = Amount * Price WHERE Subtotal = 0 OR Subtotal IS NULL;'
    );
  } catch {}
}

export async function getAllInvoices(
  fromDate: string,
  toDate: string,
  keyword: string = '',
  type: string = ''
): Promise<Invoice[]> {
  await ensureSubtotalsUpdated();

  const hasKeyword = Boolean(keyword.trim());
  let queryText = `
    SELECT i.*, 
           ISNULL((SELECT SUM(CASE WHEN d.Subtotal > 0 THEN d.Subtotal ELSE d.Amount * d.Price END) 
                   FROM InvoiceDetails d WHERE d.InvoiceId = i.Id), 0) AS TotalAmount
    FROM Invoices i
    WHERE 1=1
  `;

  const params: Record<string, { type?: any; value: any }> = {};

  if (!hasKeyword) {
    queryText += ` AND i.InvDate >= @FromDate AND i.InvDate <= @ToDate`;
    params.FromDate = { type: sql.Date, value: fromDate };
    params.ToDate = { type: sql.Date, value: toDate };
  } else {
    queryText += ` AND (
      i.Code LIKE @Keyword OR 
      i.Partner LIKE @Keyword OR 
      EXISTS (SELECT 1 FROM InvoiceDetails d LEFT JOIN Products p ON d.ProductId = p.Id WHERE d.InvoiceId = i.Id AND (d.ProductName LIKE @Keyword OR p.Code LIKE @Keyword))
    )`;
    params.Keyword = { type: sql.NVarChar(255), value: `%${keyword.trim()}%` };
  }

  if (type) {
    queryText += ` AND i.Type = @Type`;
    params.Type = { type: sql.NVarChar(10), value: type };
  }

  queryText += ` ORDER BY i.InvDate DESC, i.Id DESC`;

  const rows = await executeQuery<any>(queryText, params);

  return rows.map((row) => ({
    Id: Number(row.Id),
    Type: row.Type,
    InvDate: row.InvDate ? new Date(row.InvDate).toISOString().split('T')[0] : '',
    Code: row.Code || '',
    Partner: row.Partner || '',
    SupplierId: row.SupplierId ? Number(row.SupplierId) : null,
    Note: row.Note || '',
    ImageUrl: row.ImageUrl || '',
    CreatedBy: row.CreatedBy || '',
    UpdatedBy: row.UpdatedBy || '',
    CreatedAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : undefined,
    UpdatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : undefined,
    ApprovalStatus: row.ApprovalStatus || 'approved',
    ApprovedBy: row.ApprovedBy || '',
    ApprovedAt: row.ApprovedAt ? new Date(row.ApprovedAt).toISOString() : undefined,
    TotalAmount: Number(row.TotalAmount) || 0,
  }));
}

export async function getInvoiceById(id: number): Promise<Invoice | null> {
  const rows = await executeQuery<any>(
    `SELECT i.*, 
            ISNULL((SELECT SUM(CASE WHEN d.Subtotal > 0 THEN d.Subtotal ELSE d.Amount * d.Price END) 
                    FROM InvoiceDetails d WHERE d.InvoiceId = i.Id), 0) AS TotalAmount
     FROM Invoices i WHERE i.Id = @Id`,
    { Id: { type: sql.Int, value: id } }
  );

  if (rows.length === 0) return null;
  const row = rows[0];

  return {
    Id: Number(row.Id),
    Type: row.Type,
    InvDate: row.InvDate ? new Date(row.InvDate).toISOString().split('T')[0] : '',
    Code: row.Code || '',
    Partner: row.Partner || '',
    SupplierId: row.SupplierId ? Number(row.SupplierId) : null,
    Note: row.Note || '',
    ImageUrl: row.ImageUrl || '',
    CreatedBy: row.CreatedBy || '',
    UpdatedBy: row.UpdatedBy || '',
    CreatedAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : undefined,
    UpdatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : undefined,
    ApprovalStatus: row.ApprovalStatus || 'approved',
    ApprovedBy: row.ApprovedBy || '',
    ApprovedAt: row.ApprovedAt ? new Date(row.ApprovedAt).toISOString() : undefined,
    TotalAmount: Number(row.TotalAmount) || 0,
  };
}

export async function getInvoiceDetails(invoiceId: number): Promise<InvoiceDetail[]> {
  const rows = await executeQuery<any>(
    `SELECT d.*, p.Code as ProductCode 
     FROM InvoiceDetails d 
     LEFT JOIN Products p ON d.ProductId = p.Id 
     WHERE d.InvoiceId = @InvoiceId`,
    {
      InvoiceId: { type: sql.Int, value: invoiceId },
    }
  );

  return rows.map((r) => ({
    Id: Number(r.Id),
    InvoiceId: Number(r.InvoiceId),
    ProductId: r.ProductId ? Number(r.ProductId) : null,
    ProductCode: r.ProductCode || '',
    ProductName: r.ProductName || '',
    Unit: r.Unit || 'kg',
    Amount: Number(r.Amount) || 0,
    Price: Number(r.Price) || 0,
    Subtotal: (Number(r.Amount) || 0) * (Number(r.Price) || 0),
    MfgDate: r.MfgDate ? new Date(r.MfgDate).toISOString().split('T')[0] : null,
    ExpDate: r.ExpDate ? new Date(r.ExpDate).toISOString().split('T')[0] : null,
  }));
}

export async function deleteInvoice(id: number, currentUser: string = 'system'): Promise<void> {
  const inv = await getInvoiceById(id);
  if (!inv) return;

  if (await isDateLocked(inv.InvDate)) {
    const d = new Date(inv.InvDate);
    throw new Error(
      `Kỳ kế toán tháng ${d.getMonth() + 1}/${d.getFullYear()} đã được khóa sổ. Không thể xóa chứng từ trong kỳ này!`
    );
  }

  await logAudit(currentUser, currentUser, 'DELETE', 'Invoice', String(id), `Xóa hóa đơn ID: ${id}`);

  await executeNonQuery(`DELETE FROM BatchDeductions WHERE InvoiceId = @Id`, {
    Id: { type: sql.Int, value: id },
  });
  await executeNonQuery(
    `DELETE FROM BatchDeductions WHERE BatchId IN (SELECT Id FROM Batches WHERE InvoiceId = @Id)`,
    { Id: { type: sql.Int, value: id } }
  );
  await executeNonQuery(`DELETE FROM Batches WHERE InvoiceId = @Id`, {
    Id: { type: sql.Int, value: id },
  });
  await executeNonQuery(`DELETE FROM InvoiceDetails WHERE InvoiceId = @Id`, {
    Id: { type: sql.Int, value: id },
  });
  await executeNonQuery(`DELETE FROM Invoices WHERE Id = @Id`, {
    Id: { type: sql.Int, value: id },
  });

  try {
    await rebuildAllFifoBatches();
  } catch (err) {
    console.error('Rebuild FIFO error after delete:', err);
  }
}

export async function validateFifoTimeline(
  excludeInvoiceId: number,
  newInvDateStr: string,
  newType: 'in' | 'out',
  newDetails: InvoiceDetail[]
): Promise<string[]> {
  const violations: string[] = [];
  const events: Array<{
    key: string;
    display: string;
    date: Date;
    isSupply: boolean;
    qty: number;
  }> = [];

  const dtOpening = await executeQuery<any>(
    'SELECT ProductName, AdjQty, Year, Month FROM StockOpeningAdj WHERE AdjQty > 0'
  );
  for (const r of dtOpening) {
    events.push({
      key: normalizeName(r.ProductName),
      display: r.ProductName || '',
      date: new Date(Number(r.Year), Number(r.Month) - 1, 1),
      isSupply: true,
      qty: Number(r.AdjQty),
    });
  }

  const dtLines = await executeQuery<any>(
    `SELECT d.ProductName, d.Amount, i.Type, i.InvDate
     FROM InvoiceDetails d INNER JOIN Invoices i ON d.InvoiceId = i.Id
     WHERE i.Id <> @ExcludeId
       AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'`,
    {
      ExcludeId: { type: sql.Int, value: excludeInvoiceId },
    }
  );
  for (const r of dtLines) {
    events.push({
      key: normalizeName(r.ProductName),
      display: r.ProductName || '',
      date: new Date(r.InvDate),
      isSupply: r.Type === 'in',
      qty: Number(r.Amount),
    });
  }

  const newDate = new Date(newInvDateStr);
  for (const d of newDetails) {
    events.push({
      key: normalizeName(d.ProductName),
      display: d.ProductName || '',
      date: newDate,
      isSupply: newType === 'in',
      qty: Number(d.Amount),
    });
  }

  const keysToCheck = new Set(newDetails.map((d) => normalizeName(d.ProductName)));

  const grouped = new Map<string, typeof events>();
  for (const ev of events) {
    if (!keysToCheck.has(ev.key)) continue;
    if (!grouped.has(ev.key)) grouped.set(ev.key, []);
    grouped.get(ev.key)!.push(ev);
  }

  for (const [, list] of grouped) {
    list.sort((a, b) => {
      const cmp = a.date.getTime() - b.date.getTime();
      if (cmp !== 0) return cmp;
      return (b.isSupply ? 1 : 0) - (a.isSupply ? 1 : 0);
    });

    let balance = 0;
    for (const e of list) {
      balance += e.isSupply ? e.qty : -e.qty;
      if (balance < -0.005) {
        const dStr = e.date.toLocaleDateString('vi-VN');
        violations.push(
          `Sản phẩm '${e.display}': tồn kho sẽ bị âm ${Math.abs(balance).toFixed(2)} vào ngày ${dStr}. Hãy kiểm tra lại số lượng hoặc hóa đơn nhập.`
        );
        break;
      }
    }
  }

  return violations;
}

export async function saveInvoice(
  invoice: Partial<Invoice>,
  details: InvoiceDetail[],
  currentUser: string = 'system',
  isApprover: boolean = false
): Promise<{ status: string; id: number }> {
  if (await isDateLocked(invoice.InvDate)) {
    const d = new Date(invoice.InvDate!);
    throw new Error(
      `Kỳ kế toán tháng ${d.getMonth() + 1}/${d.getFullYear()} đã được khóa sổ. Không thể tạo chứng từ trong kỳ này!`
    );
  }

  const status =
    invoice.ApprovalStatus || (isApprover ? 'approved' : 'pending');

  let resolvedSupplierId = invoice.SupplierId || null;
  if (!resolvedSupplierId && invoice.Partner?.trim()) {
    try {
      const match = await executeScalar<number>(
        'SELECT TOP 1 Id FROM Suppliers WHERE LOWER(LTRIM(RTRIM(Name))) = LOWER(LTRIM(RTRIM(@Partner)))',
        { Partner: { type: sql.NVarChar(255), value: invoice.Partner.trim() } }
      );
      if (match) resolvedSupplierId = match;
    } catch {}
  }

  const insertMasterSql = `
    INSERT INTO Invoices (Type, InvDate, Code, Partner, SupplierId, Note, ImageUrl, CreatedBy, CreatedAt, ApprovalStatus, ApprovedBy, ApprovedAt)
    OUTPUT INSERTED.Id
    VALUES (@Type, @InvDate, @Code, @Partner, @SupplierId, @Note, @ImageUrl, @CreatedBy, GETDATE(), @ApprovalStatus,
            CASE WHEN @ApprovalStatus = 'approved' THEN @CreatedBy ELSE NULL END,
            CASE WHEN @ApprovalStatus = 'approved' THEN GETDATE() ELSE NULL END)
  `;

  const newId = await executeScalar<number>(insertMasterSql, {
    Type: { type: sql.NVarChar(10), value: invoice.Type },
    InvDate: { type: sql.Date, value: invoice.InvDate },
    Code: { type: sql.NVarChar(50), value: invoice.Code },
    Partner: { type: sql.NVarChar(255), value: invoice.Partner || '' },
    SupplierId: { type: sql.Int, value: resolvedSupplierId },
    Note: { type: sql.NVarChar(sql.MAX), value: invoice.Note || '' },
    ImageUrl: { type: sql.NVarChar(sql.MAX), value: invoice.ImageUrl || '' },
    CreatedBy: { type: sql.NVarChar(100), value: currentUser },
    ApprovalStatus: { type: sql.NVarChar(20), value: status },
  });

  const insertDetailSql = `
    INSERT INTO InvoiceDetails (InvoiceId, ProductId, ProductName, Unit, Amount, Price, Subtotal, MfgDate, ExpDate)
    VALUES (@InvoiceId, @ProductId, @ProductName, @Unit, @Amount, @Price, @Subtotal, @MfgDate, @ExpDate)
  `;

  const activeProducts = await executeQuery<{ Id: number; Name: string; Unit: string }>(
    `SELECT Id, Name, Unit FROM Products WHERE IsActive = 1`
  );
  const prodMapByName = new Map(activeProducts.map((p) => [p.Name.toLowerCase().trim(), p]));
  const prodMapById = new Map(activeProducts.map((p) => [p.Id, p]));

  for (const d of details) {
    const trimmedName = d.ProductName?.toLowerCase().trim() || '';
    const matched = (d.ProductId ? prodMapById.get(d.ProductId) : undefined) ||
                    prodMapByName.get(trimmedName);
    const resolvedProdId = matched ? matched.Id : (d.ProductId || null);
    const resolvedUnit = matched?.Unit ? matched.Unit : (d.Unit || 'kg');

    await executeNonQuery(insertDetailSql, {
      InvoiceId: { type: sql.Int, value: newId },
      ProductId: { type: sql.Int, value: resolvedProdId },
      ProductName: { type: sql.NVarChar(255), value: d.ProductName },
      Unit: { type: sql.NVarChar(50), value: resolvedUnit },
      Amount: { type: sql.Decimal(18, 4), value: d.Amount },
      Price: { type: sql.Decimal(18, 2), value: d.Price },
      Subtotal: { type: sql.Decimal(18, 2), value: d.Amount * d.Price },
      MfgDate: { type: sql.Date, value: d.MfgDate || null },
      ExpDate: { type: sql.Date, value: d.ExpDate || null },
    });
  }

  await logAudit(
    currentUser,
    currentUser,
    status === 'approved' ? 'CREATE' : 'CREATE_PENDING',
    'Invoice',
    String(newId),
    `Tạo hóa đơn ${invoice.Code}${status === 'pending' ? ' (chờ duyệt)' : ''}`
  );

  if (status === 'approved') {
    try {
      if (invoice.Type === 'in') {
        await addBatchesFromInvoice(newId!);
      } else {
        const items = details.map((d) => ({
          productName: d.ProductName,
          qty: d.Amount,
          unit: d.Unit || 'kg',
        }));
        await deductBatchesFifo(newId!, invoice.Code!, invoice.InvDate!, items);
      }
    } catch (err) {
      console.error('FIFO processing error after save:', err);
    }
  }

  return { status, id: newId! };
}

export async function updateInvoice(
  invoiceId: number,
  invoice: Partial<Invoice>,
  details: InvoiceDetail[],
  currentUser: string = 'system'
): Promise<void> {
  if (await isDateLocked(invoice.InvDate)) {
    const d = new Date(invoice.InvDate!);
    throw new Error(
      `Kỳ kế toán tháng ${d.getMonth() + 1}/${d.getFullYear()} đã được khóa sổ. Không thể sửa chứng từ trong kỳ này!`
    );
  }

  await logAudit(
    currentUser,
    currentUser,
    'UPDATE',
    'Invoice',
    String(invoiceId),
    `Sửa hóa đơn ${invoice.Code}: ngày ${invoice.InvDate}, ${details.length} dòng chi tiết`
  );

  let resolvedSupplierId = invoice.SupplierId || null;
  if (!resolvedSupplierId && invoice.Partner?.trim()) {
    try {
      const match = await executeScalar<number>(
        'SELECT TOP 1 Id FROM Suppliers WHERE LOWER(LTRIM(RTRIM(Name))) = LOWER(LTRIM(RTRIM(@Partner)))',
        { Partner: { type: sql.NVarChar(255), value: invoice.Partner.trim() } }
      );
      if (match) resolvedSupplierId = match;
    } catch {}
  }

  const updateMasterSql = `
    UPDATE Invoices
    SET Type = @Type, InvDate = @InvDate, Code = @Code, Partner = @Partner, SupplierId = @SupplierId, Note = @Note,
        ImageUrl = @ImageUrl, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE()
    WHERE Id = @Id
  `;

  await executeNonQuery(updateMasterSql, {
    Type: { type: sql.NVarChar(10), value: invoice.Type },
    InvDate: { type: sql.Date, value: invoice.InvDate },
    Code: { type: sql.NVarChar(50), value: invoice.Code },
    Partner: { type: sql.NVarChar(255), value: invoice.Partner || '' },
    SupplierId: { type: sql.Int, value: resolvedSupplierId },
    Note: { type: sql.NVarChar(sql.MAX), value: invoice.Note || '' },
    ImageUrl: { type: sql.NVarChar(sql.MAX), value: invoice.ImageUrl || '' },
    UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
    Id: { type: sql.Int, value: invoiceId },
  });

  await executeNonQuery(`DELETE FROM InvoiceDetails WHERE InvoiceId = @Id`, {
    Id: { type: sql.Int, value: invoiceId },
  });

  const insertDetailSql = `
    INSERT INTO InvoiceDetails (InvoiceId, ProductId, ProductName, Unit, Amount, Price, Subtotal, MfgDate, ExpDate)
    VALUES (@InvoiceId, @ProductId, @ProductName, @Unit, @Amount, @Price, @Subtotal, @MfgDate, @ExpDate)
  `;

  const activeProducts = await executeQuery<{ Id: number; Name: string; Unit: string }>(
    `SELECT Id, Name, Unit FROM Products WHERE IsActive = 1`
  );
  const prodMapByName = new Map(activeProducts.map((p) => [p.Name.toLowerCase().trim(), p]));
  const prodMapById = new Map(activeProducts.map((p) => [p.Id, p]));

  for (const d of details) {
    const trimmedName = d.ProductName?.toLowerCase().trim() || '';
    const matched = (d.ProductId ? prodMapById.get(d.ProductId) : undefined) ||
                    prodMapByName.get(trimmedName);
    const resolvedProdId = matched ? matched.Id : (d.ProductId || null);
    const resolvedUnit = matched?.Unit ? matched.Unit : (d.Unit || 'kg');

    await executeNonQuery(insertDetailSql, {
      InvoiceId: { type: sql.Int, value: invoiceId },
      ProductId: { type: sql.Int, value: resolvedProdId },
      ProductName: { type: sql.NVarChar(255), value: d.ProductName },
      Unit: { type: sql.NVarChar(50), value: resolvedUnit },
      Amount: { type: sql.Decimal(18, 4), value: d.Amount },
      Price: { type: sql.Decimal(18, 2), value: d.Price },
      Subtotal: { type: sql.Decimal(18, 2), value: d.Amount * d.Price },
      MfgDate: { type: sql.Date, value: d.MfgDate || null },
      ExpDate: { type: sql.Date, value: d.ExpDate || null },
    });
  }

  try {
    await rebuildAllFifoBatches();
  } catch (err) {
    console.error('Rebuild FIFO error after update:', err);
  }
}

export async function applyApproval(
  invoiceId: number,
  statusOrApprove: boolean | 'approved' | 'rejected' | 'pending',
  currentUser: string = 'system'
): Promise<void> {
  const status: 'approved' | 'rejected' | 'pending' =
    typeof statusOrApprove === 'boolean'
      ? statusOrApprove
        ? 'approved'
        : 'rejected'
      : statusOrApprove;

  const invRows = await executeQuery<{ Code: string; Type: string }>(
    `SELECT Code, Type FROM Invoices WHERE Id = @Id`,
    { Id: { type: sql.Int, value: invoiceId } }
  );
  const code = invRows[0]?.Code || '';
  const type = invRows[0]?.Type || 'out';

  const sqlApprove = `
    UPDATE Invoices
    SET ApprovalStatus = @Status,
        ApprovedBy = CASE WHEN @Status = 'approved' THEN @ApprovedBy ELSE NULL END,
        ApprovedAt = CASE WHEN @Status = 'approved' THEN GETDATE() ELSE NULL END,
        UpdatedAt = GETDATE()
    WHERE Id = @Id
  `;

  await executeNonQuery(sqlApprove, {
    Status: { type: sql.NVarChar(20), value: status },
    ApprovedBy: { type: sql.NVarChar(100), value: currentUser },
    Id: { type: sql.Int, value: invoiceId },
  });

  const actionText =
    status === 'approved'
      ? 'Kế toán duyệt'
      : status === 'rejected'
      ? 'Kế toán từ chối'
      : 'Kế toán chuyển về chờ duyệt';

  await logAudit(
    currentUser,
    currentUser,
    status === 'approved'
      ? 'APPROVE_INVOICE'
      : status === 'rejected'
      ? 'REJECT_INVOICE'
      : 'RESET_APPROVAL_INVOICE',
    'Invoice',
    String(invoiceId),
    `${actionText} hóa đơn ${type === 'in' ? 'nhập' : 'xuất'} kho ${code || ''} (ID: ${invoiceId})`
  );

  try {
    await rebuildAllFifoBatches();
  } catch (err) {
    console.error('Rebuild FIFO error after approval:', err);
  }
}
