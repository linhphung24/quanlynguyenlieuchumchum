import { executeQuery, executeNonQuery, sql } from '@/lib/db';
import { Supplier } from '@/types';
import { logAudit } from '@/lib/audit';

export async function getAllSuppliers(keyword: string = ''): Promise<Supplier[]> {
  let queryText = 'SELECT * FROM Suppliers WHERE IsActive = 1';
  const params: Record<string, { type?: any; value: any }> = {};

  if (keyword.trim()) {
    queryText += ' AND (Name LIKE @Keyword OR Phone LIKE @Keyword)';
    params.Keyword = { type: sql.NVarChar(255), value: `%${keyword.trim()}%` };
  }

  queryText += ' ORDER BY Name';

  const rows = await executeQuery<any>(queryText, params);

  return rows.map((r) => ({
    Id: Number(r.Id),
    Name: r.Name || '',
    Phone: r.Phone || '',
    Address: r.Address || '',
    Note: r.Note || '',
    IsActive: Boolean(r.IsActive),
    CreatedBy: r.CreatedBy || '',
    UpdatedBy: r.UpdatedBy || '',
    CreatedAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : undefined,
    UpdatedAt: r.UpdatedAt ? new Date(r.UpdatedAt).toISOString() : undefined,
  }));
}

export async function saveSupplier(
  supplier: Partial<Supplier>,
  currentUser: string = 'system'
): Promise<void> {
  if (!supplier.Id || supplier.Id === 0) {
    const insertSql = `
      INSERT INTO Suppliers (Name, Phone, Address, Note, CreatedBy, CreatedAt)
      VALUES (@Name, @Phone, @Address, @Note, @CreatedBy, GETDATE())
    `;

    await executeNonQuery(insertSql, {
      Name: { type: sql.NVarChar(255), value: supplier.Name || '' },
      Phone: { type: sql.NVarChar(50), value: supplier.Phone || '' },
      Address: { type: sql.NVarChar(255), value: supplier.Address || '' },
      Note: { type: sql.NVarChar(sql.MAX), value: supplier.Note || '' },
      CreatedBy: { type: sql.NVarChar(100), value: currentUser },
    });

    await logAudit(currentUser, currentUser, 'CREATE', 'Supplier', supplier.Name || '', `Thêm nhà cung cấp: ${supplier.Name}`);
  } else {
    const updateSql = `
      UPDATE Suppliers
      SET Name = @Name, Phone = @Phone, Address = @Address, Note = @Note, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE()
      WHERE Id = @Id
    `;

    await executeNonQuery(updateSql, {
      Name: { type: sql.NVarChar(255), value: supplier.Name || '' },
      Phone: { type: sql.NVarChar(50), value: supplier.Phone || '' },
      Address: { type: sql.NVarChar(255), value: supplier.Address || '' },
      Note: { type: sql.NVarChar(sql.MAX), value: supplier.Note || '' },
      UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
      Id: { type: sql.Int, value: supplier.Id },
    });

    await logAudit(currentUser, currentUser, 'UPDATE', 'Supplier', String(supplier.Id), `Sửa nhà cung cấp: ${supplier.Name}`);
  }
}

export async function deleteSupplier(id: number, currentUser: string = 'system'): Promise<void> {
  await executeNonQuery('UPDATE Suppliers SET IsActive = 0, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE() WHERE Id = @Id', {
    Id: { type: sql.Int, value: id },
    UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
  });

  await logAudit(currentUser, currentUser, 'DELETE', 'Supplier', String(id), `Xóa nhà cung cấp ID: ${id}`);
}
