import { executeQuery, executeNonQuery, sql } from '@/lib/db';
import { CompanyInfo } from '@/types';
import { logAudit } from '@/lib/audit';

export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const rows = await executeQuery<any>('SELECT TOP 1 * FROM CompanyInfo ORDER BY Id');
    if (rows.length > 0) {
      const r = rows[0];
      return {
        Id: Number(r.Id),
        Name: r.Name || 'CHUM CHUM BAKERY',
        Address: r.Address || '',
        TaxCode: r.TaxCode || '',
        Phone: r.Phone || '',
        UpdatedBy: r.UpdatedBy || '',
        UpdatedAt: r.UpdatedAt ? new Date(r.UpdatedAt).toISOString() : undefined,
      };
    }
  } catch (err) {
    console.error('Error fetching company info:', err);
  }

  return {
    Id: 1,
    Name: 'CHUM CHUM BAKERY',
    Address: '',
    TaxCode: '',
    Phone: '',
  };
}

export async function saveCompanyInfo(
  info: Partial<CompanyInfo>,
  currentUser: string = 'system'
): Promise<void> {
  const sqlUpsert = `
    IF EXISTS (SELECT 1 FROM CompanyInfo WHERE Id = 1)
        UPDATE CompanyInfo SET Name = @Name, Address = @Address, TaxCode = @TaxCode,
            Phone = @Phone, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE()
        WHERE Id = 1
    ELSE
        INSERT INTO CompanyInfo (Id, Name, Address, TaxCode, Phone, UpdatedBy, UpdatedAt)
        VALUES (1, @Name, @Address, @TaxCode, @Phone, @UpdatedBy, GETDATE())
  `;

  await executeNonQuery(sqlUpsert, {
    Name: { type: sql.NVarChar(255), value: info.Name || 'CHUM CHUM BAKERY' },
    Address: { type: sql.NVarChar(255), value: info.Address || '' },
    TaxCode: { type: sql.NVarChar(50), value: info.TaxCode || '' },
    Phone: { type: sql.NVarChar(50), value: info.Phone || '' },
    UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
  });

  await logAudit(
    currentUser,
    currentUser,
    'UPDATE',
    'CompanyInfo',
    '1',
    `Cập nhật thông tin công ty: ${info.Name || ''}`
  );
}
