import { executeQuery, executeScalar, executeNonQuery, sql } from '@/lib/db';
import { Product } from '@/types';
import { logAudit } from '@/lib/audit';

export async function getAllProducts(search: string = ''): Promise<Product[]> {
  let queryText = `
    SELECT p.*,
           (
               ISNULL((SELECT TOP 1 AdjQty FROM StockOpeningAdj WHERE ProductName = p.Name ORDER BY Year DESC, Month DESC), 0)
               + ISNULL((SELECT SUM(d.Amount) FROM InvoiceDetails d INNER JOIN Invoices i ON d.InvoiceId = i.Id WHERE (d.ProductId = p.Id OR d.ProductName = p.Name) AND i.Type = 'in' AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'), 0)
               - ISNULL((SELECT SUM(d.Amount) FROM InvoiceDetails d INNER JOIN Invoices i ON d.InvoiceId = i.Id WHERE (d.ProductId = p.Id OR d.ProductName = p.Name) AND i.Type = 'out' AND ISNULL(i.ApprovalStatus, 'approved') = 'approved'), 0)
           ) AS RealtimeStock
    FROM Products p
    WHERE p.IsActive = 1
  `;

  const params: Record<string, { type?: any; value: any }> = {};

  if (search.trim()) {
    queryText += ` AND (p.Name LIKE @Search OR p.Code LIKE @Search)`;
    params.Search = { type: sql.NVarChar(255), value: `%${search.trim()}%` };
  }

  queryText += ` ORDER BY p.Category, p.Name`;

  const rows = await executeQuery<any>(queryText, params);

  return rows.map((row) => ({
    Id: row.Id,
    Code: row.Code || '',
    Name: row.Name || '',
    Category: row.Category || 'Khác',
    Unit: row.Unit || 'kg',
    CostPrice: Number(row.CostPrice) || 0,
    SellPrice: Number(row.SellPrice) || 0,
    StockQty: Number(row.RealtimeStock) || 0,
    MinStock: Number(row.MinStock) || 0,
    Supplier: row.Supplier || '',
    Description: row.Description || '',
    IsActive: Boolean(row.IsActive),
    CreatedBy: row.CreatedBy || '',
    UpdatedBy: row.UpdatedBy || '',
    CreatedAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : undefined,
    UpdatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : undefined,
  }));
}

export async function saveProduct(
  p: Partial<Product>,
  currentUser: string = 'system'
): Promise<number> {
  if (!p.Id || p.Id === 0) {
    const insertSql = `
      INSERT INTO Products (Code, Name, Category, Unit, CostPrice, SellPrice, StockQty, MinStock, Supplier, Description, IsActive, CreatedBy, CreatedAt)
      OUTPUT INSERTED.Id
      VALUES (@Code, @Name, @Category, @Unit, @CostPrice, @SellPrice, @StockQty, @MinStock, @Supplier, @Description, 1, @CreatedBy, GETDATE())
    `;

    const newId = await executeScalar<number>(insertSql, {
      Code: { type: sql.NVarChar(50), value: p.Code || null },
      Name: { type: sql.NVarChar(255), value: p.Name || '' },
      Category: { type: sql.NVarChar(100), value: p.Category || 'Khác' },
      Unit: { type: sql.NVarChar(50), value: p.Unit || 'kg' },
      CostPrice: { type: sql.Decimal(18, 2), value: p.CostPrice || 0 },
      SellPrice: { type: sql.Decimal(18, 2), value: p.SellPrice || 0 },
      StockQty: { type: sql.Decimal(18, 4), value: p.StockQty || 0 },
      MinStock: { type: sql.Decimal(18, 4), value: p.MinStock || 0 },
      Supplier: { type: sql.NVarChar(255), value: p.Supplier || '' },
      Description: { type: sql.NVarChar(sql.MAX), value: p.Description || '' },
      CreatedBy: { type: sql.NVarChar(100), value: currentUser },
    });

    await logAudit(
      currentUser,
      currentUser,
      'CREATE',
      'Product',
      String(newId),
      `Thêm sản phẩm: ${p.Code || ''} - ${p.Name}`
    );

    return newId || 0;
  } else {
    const updateSql = `
      DECLARE @OldName NVARCHAR(255);
      DECLARE @OldUnit NVARCHAR(50);
      SELECT @OldName = Name, @OldUnit = Unit FROM Products WHERE Id = @Id;
      
      UPDATE Products 
      SET Code = @Code, Name = @Name, Category = @Category, Unit = @Unit, 
          CostPrice = @CostPrice, SellPrice = @SellPrice, MinStock = @MinStock,
          Supplier = @Supplier, Description = @Description, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE()
      WHERE Id = @Id;
      
      IF (ISNULL(@OldName, '') <> ISNULL(@Name, ''))
      BEGIN
          UPDATE InvoiceDetails SET ProductName = @Name WHERE ProductId = @Id;
          UPDATE Batches SET ProductName = @Name WHERE ProductName = @OldName;
          UPDATE StockOpeningAdj SET ProductName = @Name WHERE ProductName = @OldName;
          UPDATE RecipeIngredients SET ProductName = @Name WHERE ProductName = @OldName;
      END

      IF (ISNULL(@OldUnit, '') <> ISNULL(@Unit, ''))
      BEGIN
          UPDATE InvoiceDetails SET Unit = @Unit WHERE ProductId = @Id OR ProductName = @Name;
          UPDATE Batches SET Unit = @Unit WHERE ProductName = @Name;
          UPDATE BatchDeductions SET BatchUnit = @Unit WHERE BatchId IN (SELECT Id FROM Batches WHERE ProductName = @Name);
          UPDATE RecipeIngredients SET Unit = @Unit WHERE ProductName = @Name;
      END
    `;

    await executeNonQuery(updateSql, {
      Code: { type: sql.NVarChar(50), value: p.Code || null },
      Name: { type: sql.NVarChar(255), value: p.Name || '' },
      Category: { type: sql.NVarChar(100), value: p.Category || 'Khác' },
      Unit: { type: sql.NVarChar(50), value: p.Unit || 'kg' },
      CostPrice: { type: sql.Decimal(18, 2), value: p.CostPrice || 0 },
      SellPrice: { type: sql.Decimal(18, 2), value: p.SellPrice || 0 },
      MinStock: { type: sql.Decimal(18, 4), value: p.MinStock || 0 },
      Supplier: { type: sql.NVarChar(255), value: p.Supplier || '' },
      Description: { type: sql.NVarChar(sql.MAX), value: p.Description || '' },
      UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
      Id: { type: sql.Int, value: p.Id },
    });

    await logAudit(
      currentUser,
      currentUser,
      'UPDATE',
      'Product',
      String(p.Id),
      `Cập nhật sản phẩm: ${p.Code || ''} - ${p.Name}`
    );

    return 0;
  }
}

export async function deleteProduct(id: number, currentUser: string = 'system'): Promise<void> {
  const sqlDelete = `UPDATE Products SET IsActive = 0, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE() WHERE Id = @Id`;
  await executeNonQuery(sqlDelete, {
    Id: { type: sql.Int, value: id },
    UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
  });

  await logAudit(currentUser, currentUser, 'DELETE', 'Product', String(id), `Xóa mềm sản phẩm ID: ${id}`);
}
