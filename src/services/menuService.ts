import { executeQuery, executeNonQuery, executeScalar, sql } from '@/lib/db';
import { PosMenuItem, PosMenuItemRecipe } from '@/types';
import { logAudit } from '@/lib/audit';

export async function getAllMenuItems(
  search: string = '',
  category: string = '',
  onlyActive: boolean = false
): Promise<PosMenuItem[]> {
  let queryText = `
    SELECT m.*,
           (SELECT COUNT(*) FROM PosMenuItemRecipes r WHERE r.MenuItemId = m.Id) AS RecipeCount,
           ISNULL((
             SELECT SUM(r.Amount * ISNULL(p.CostPrice, r.CostPrice))
             FROM PosMenuItemRecipes r 
             LEFT JOIN Products p ON (r.ProductId = p.Id OR LOWER(LTRIM(RTRIM(r.ProductName))) = LOWER(LTRIM(RTRIM(p.Name))))
             WHERE r.MenuItemId = m.Id
           ), m.CostPrice) AS CalculatedCostPrice
    FROM PosMenuItems m
    WHERE 1=1
  `;

  const params: Record<string, { type?: any; value: any }> = {};

  if (onlyActive) {
    queryText += ` AND m.IsActive = 1`;
  }

  if (category && category !== 'Tất cả') {
    queryText += ` AND m.Category = @Category`;
    params.Category = { type: sql.NVarChar(100), value: category };
  }

  if (search.trim()) {
    queryText += ` AND (m.Name LIKE @Search OR m.Code LIKE @Search)`;
    params.Search = { type: sql.NVarChar(255), value: `%${search.trim()}%` };
  }

  queryText += ` ORDER BY m.Category, m.SortOrder ASC, m.Name ASC`;

  const rows = await executeQuery<any>(queryText, params);

  return rows.map((r) => ({
    Id: Number(r.Id),
    Code: r.Code || '',
    Name: r.Name || '',
    Category: r.Category || 'Khác',
    Unit: r.Unit || 'cái',
    Price: Number(r.Price) || 0,
    CostPrice: Number(r.CalculatedCostPrice) > 0 ? Number(r.CalculatedCostPrice) : Number(r.CostPrice) || 0,
    ImageUrl: r.ImageUrl || null,
    Description: r.Description || '',
    RecipeId: r.RecipeId ? Number(r.RecipeId) : null,
    IsActive: Boolean(r.IsActive),
    SortOrder: Number(r.SortOrder) || 0,
    CreatedBy: r.CreatedBy || '',
    CreatedAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : undefined,
    UpdatedBy: r.UpdatedBy || '',
    UpdatedAt: r.UpdatedAt ? new Date(r.UpdatedAt).toISOString() : undefined,
    RecipeCount: Number(r.RecipeCount) || 0,
  }));
}

export async function getMenuItemById(id: number): Promise<PosMenuItem | null> {
  const rows = await executeQuery<any>(
    `SELECT * FROM PosMenuItems WHERE Id = @Id`,
    { Id: { type: sql.Int, value: id } }
  );

  if (rows.length === 0) return null;
  const m = rows[0];

  // Fetch recipe ingredients
  const recipeRows = await executeQuery<any>(
    `SELECT r.*, 
            p.CostPrice AS MaterialCostPrice,
            p.StockQty AS MaterialStockQty,
            p.Unit AS MaterialUnit
     FROM PosMenuItemRecipes r
     LEFT JOIN Products p ON (r.ProductId = p.Id OR LOWER(LTRIM(RTRIM(r.ProductName))) = LOWER(LTRIM(RTRIM(p.Name))))
     WHERE r.MenuItemId = @MenuItemId
     ORDER BY r.Id ASC`,
    { MenuItemId: { type: sql.Int, value: id } }
  );

  const recipes: PosMenuItemRecipe[] = recipeRows.map((r) => ({
    Id: Number(r.Id),
    MenuItemId: Number(r.MenuItemId),
    ProductId: r.ProductId ? Number(r.ProductId) : null,
    ProductName: r.ProductName || '',
    Amount: Number(r.Amount) || 0,
    Unit: r.Unit || r.MaterialUnit || 'g',
    CostPrice: Number(r.MaterialCostPrice) > 0 ? Number(r.MaterialCostPrice) : Number(r.CostPrice) || 0,
    Note: r.Note || '',
    CreatedAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : undefined,
  }));

  return {
    Id: Number(m.Id),
    Code: m.Code || '',
    Name: m.Name || '',
    Category: m.Category || 'Khác',
    Unit: m.Unit || 'cái',
    Price: Number(m.Price) || 0,
    CostPrice: Number(m.CostPrice) || 0,
    ImageUrl: m.ImageUrl || null,
    Description: m.Description || '',
    RecipeId: m.RecipeId ? Number(m.RecipeId) : null,
    IsActive: Boolean(m.IsActive),
    SortOrder: Number(m.SortOrder) || 0,
    CreatedBy: m.CreatedBy || '',
    CreatedAt: m.CreatedAt ? new Date(m.CreatedAt).toISOString() : undefined,
    UpdatedBy: m.UpdatedBy || '',
    UpdatedAt: m.UpdatedAt ? new Date(m.UpdatedAt).toISOString() : undefined,
    Recipes: recipes,
    RecipeCount: recipes.length,
  };
}

export async function saveMenuItem(
  item: Partial<PosMenuItem>,
  recipes: PosMenuItemRecipe[] = [],
  currentUser: string = 'system'
): Promise<number> {
  let itemId = item.Id || 0;

  // Calculate estimated cost price from recipe ingredients if provided
  let calculatedCost = Number(item.CostPrice) || 0;
  if (recipes.length > 0) {
    let sumCost = 0;
    for (const r of recipes) {
      sumCost += (Number(r.Amount) || 0) * (Number(r.CostPrice) || 0);
    }
    if (sumCost > 0) {
      calculatedCost = Math.round(sumCost);
    }
  }

  if (itemId === 0) {
    // Generate code if empty
    let code = (item.Code || '').trim();
    if (!code) {
      const today = new Date();
      const seq = Math.floor(1000 + Math.random() * 9000);
      code = `MN-${seq}`;
    }

    const insertSql = `
      INSERT INTO PosMenuItems (
        Code, Name, Category, Unit, Price, CostPrice, ImageUrl, Description, RecipeId,
        IsActive, SortOrder, CreatedBy, CreatedAt
      )
      OUTPUT INSERTED.Id
      VALUES (
        @Code, @Name, @Category, @Unit, @Price, @CostPrice, @ImageUrl, @Description, @RecipeId,
        @IsActive, @SortOrder, @CreatedBy, GETDATE()
      )
    `;

    itemId = (await executeScalar<number>(insertSql, {
      Code: { type: sql.NVarChar(50), value: code },
      Name: { type: sql.NVarChar(255), value: item.Name || '' },
      Category: { type: sql.NVarChar(100), value: item.Category || 'Bánh ngọt' },
      Unit: { type: sql.NVarChar(50), value: item.Unit || 'cái' },
      Price: { type: sql.Decimal(18, 2), value: Number(item.Price) || 0 },
      CostPrice: { type: sql.Decimal(18, 2), value: calculatedCost },
      ImageUrl: { type: sql.NVarChar(500), value: item.ImageUrl || null },
      Description: { type: sql.NVarChar(sql.MAX), value: item.Description || '' },
      RecipeId: { type: sql.Int, value: item.RecipeId || null },
      IsActive: { type: sql.Bit, value: item.IsActive !== false },
      SortOrder: { type: sql.Int, value: Number(item.SortOrder) || 0 },
      CreatedBy: { type: sql.NVarChar(100), value: currentUser },
    }))!;

    await logAudit(currentUser, currentUser, 'CREATE', 'PosMenuItem', String(itemId), `Thêm món menu: ${item.Name}`);
  } else {
    const updateSql = `
      UPDATE PosMenuItems
      SET Code = @Code,
          Name = @Name,
          Category = @Category,
          Unit = @Unit,
          Price = @Price,
          CostPrice = @CostPrice,
          ImageUrl = @ImageUrl,
          Description = @Description,
          RecipeId = @RecipeId,
          IsActive = @IsActive,
          SortOrder = @SortOrder,
          UpdatedBy = @UpdatedBy,
          UpdatedAt = GETDATE()
      WHERE Id = @Id
    `;

    await executeNonQuery(updateSql, {
      Id: { type: sql.Int, value: itemId },
      Code: { type: sql.NVarChar(50), value: item.Code },
      Name: { type: sql.NVarChar(255), value: item.Name || '' },
      Category: { type: sql.NVarChar(100), value: item.Category || 'Bánh ngọt' },
      Unit: { type: sql.NVarChar(50), value: item.Unit || 'cái' },
      Price: { type: sql.Decimal(18, 2), value: Number(item.Price) || 0 },
      CostPrice: { type: sql.Decimal(18, 2), value: calculatedCost },
      ImageUrl: { type: sql.NVarChar(500), value: item.ImageUrl || null },
      Description: { type: sql.NVarChar(sql.MAX), value: item.Description || '' },
      RecipeId: { type: sql.Int, value: item.RecipeId || null },
      IsActive: { type: sql.Bit, value: item.IsActive !== false },
      SortOrder: { type: sql.Int, value: Number(item.SortOrder) || 0 },
      UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
    });

    await logAudit(currentUser, currentUser, 'UPDATE', 'PosMenuItem', String(itemId), `Cập nhật món menu: ${item.Name}`);
  }

  // Save recipe ingredients
  await executeNonQuery(`DELETE FROM PosMenuItemRecipes WHERE MenuItemId = @MenuItemId`, {
    MenuItemId: { type: sql.Int, value: itemId },
  });

  if (recipes && recipes.length > 0) {
    const insertRecipeSql = `
      INSERT INTO PosMenuItemRecipes (MenuItemId, ProductId, ProductName, Amount, Unit, CostPrice, Note, CreatedAt)
      VALUES (@MenuItemId, @ProductId, @ProductName, @Amount, @Unit, @CostPrice, @Note, GETDATE())
    `;

    for (const r of recipes) {
      if (!r.ProductName || Number(r.Amount) <= 0) continue;
      await executeNonQuery(insertRecipeSql, {
        MenuItemId: { type: sql.Int, value: itemId },
        ProductId: { type: sql.Int, value: r.ProductId || null },
        ProductName: { type: sql.NVarChar(255), value: r.ProductName.trim() },
        Amount: { type: sql.Decimal(18, 4), value: Number(r.Amount) || 0 },
        Unit: { type: sql.NVarChar(50), value: r.Unit || 'g' },
        CostPrice: { type: sql.Decimal(18, 2), value: Number(r.CostPrice) || 0 },
        Note: { type: sql.NVarChar(255), value: r.Note || '' },
      });
    }
  }

  return itemId;
}

export async function deleteMenuItem(id: number, currentUser: string = 'system'): Promise<void> {
  const item = await getMenuItemById(id);
  const name = item?.Name || String(id);

  await executeNonQuery(`DELETE FROM PosMenuItemRecipes WHERE MenuItemId = @Id`, {
    Id: { type: sql.Int, value: id },
  });

  await executeNonQuery(`DELETE FROM PosMenuItems WHERE Id = @Id`, {
    Id: { type: sql.Int, value: id },
  });

  await logAudit(currentUser, currentUser, 'DELETE', 'PosMenuItem', String(id), `Xóa món menu: ${name}`);
}

export async function toggleMenuItemActive(id: number, isActive: boolean, currentUser: string = 'system'): Promise<void> {
  await executeNonQuery(
    `UPDATE PosMenuItems SET IsActive = @IsActive, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE() WHERE Id = @Id`,
    {
      Id: { type: sql.Int, value: id },
      IsActive: { type: sql.Bit, value: isActive },
      UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
    }
  );
}

export async function getMenuCategories(): Promise<string[]> {
  const rows = await executeQuery<{ Category: string }>(`
    SELECT DISTINCT Category 
    FROM PosMenuItems 
    WHERE Category IS NOT NULL AND Category <> ''
    ORDER BY Category ASC
  `);
  return rows.map((r) => r.Category);
}
