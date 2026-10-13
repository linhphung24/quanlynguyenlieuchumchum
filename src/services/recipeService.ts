import { executeQuery, executeNonQuery, executeScalar, sql } from '@/lib/db';
import { Recipe, RecipeIngredient } from '@/types';
import { logAudit } from '@/lib/audit';

export async function getAllRecipes(): Promise<Recipe[]> {
  const rows = await executeQuery<any>('SELECT * FROM Recipes ORDER BY Name');
  return rows.map((r) => ({
    Id: Number(r.Id),
    Name: r.Name || '',
    BaseYield: Number(r.BaseYield) || 1,
    CreatedBy: r.CreatedBy || '',
    UpdatedBy: r.UpdatedBy || '',
    CreatedAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : undefined,
    UpdatedAt: r.UpdatedAt ? new Date(r.UpdatedAt).toISOString() : undefined,
  }));
}

export async function getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]> {
  const rows = await executeQuery<any>(
    'SELECT * FROM RecipeIngredients WHERE RecipeId = @RecipeId ORDER BY Id',
    { RecipeId: { type: sql.Int, value: recipeId } }
  );

  return rows.map((r) => ({
    Id: Number(r.Id),
    RecipeId: Number(r.RecipeId),
    ProductName: r.ProductName || '',
    Amount: Number(r.Amount) || 0,
    Unit: r.Unit || 'g',
    Price: Number(r.Price) || 0,
  }));
}

export async function saveRecipe(
  recipe: Partial<Recipe>,
  ingredients: RecipeIngredient[],
  currentUser: string = 'system'
): Promise<number> {
  let recipeId = recipe.Id || 0;

  if (recipeId === 0) {
    const insertSql = `
      INSERT INTO Recipes (Name, BaseYield, CreatedBy, CreatedAt)
      OUTPUT INSERTED.Id
      VALUES (@Name, @BaseYield, @CreatedBy, GETDATE())
    `;

    recipeId = (await executeScalar<number>(insertSql, {
      Name: { type: sql.NVarChar(255), value: recipe.Name || '' },
      BaseYield: { type: sql.Decimal(18, 4), value: recipe.BaseYield || 1 },
      CreatedBy: { type: sql.NVarChar(100), value: currentUser },
    }))!;

    await logAudit(currentUser, currentUser, 'CREATE', 'Recipe', String(recipeId), `Thêm công thức bánh: ${recipe.Name}`);
  } else {
    const updateSql = `
      UPDATE Recipes
      SET Name = @Name, BaseYield = @BaseYield, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE()
      WHERE Id = @Id
    `;

    await executeNonQuery(updateSql, {
      Name: { type: sql.NVarChar(255), value: recipe.Name || '' },
      BaseYield: { type: sql.Decimal(18, 4), value: recipe.BaseYield || 1 },
      UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
      Id: { type: sql.Int, value: recipeId },
    });

    await executeNonQuery('DELETE FROM RecipeIngredients WHERE RecipeId = @RecipeId', {
      RecipeId: { type: sql.Int, value: recipeId },
    });

    await logAudit(currentUser, currentUser, 'UPDATE', 'Recipe', String(recipeId), `Sửa công thức bánh: ${recipe.Name}`);
  }

  const insertIngSql = `
    INSERT INTO RecipeIngredients (RecipeId, ProductName, Amount, Unit, Price)
    VALUES (@RecipeId, @ProductName, @Amount, @Unit, @Price)
  `;

  for (const item of ingredients) {
    await executeNonQuery(insertIngSql, {
      RecipeId: { type: sql.Int, value: recipeId },
      ProductName: { type: sql.NVarChar(255), value: item.ProductName },
      Amount: { type: sql.Decimal(18, 4), value: Number(item.Amount) || 0 },
      Unit: { type: sql.NVarChar(50), value: item.Unit || 'g' },
      Price: { type: sql.Decimal(18, 2), value: Number(item.Price) || 0 },
    });
  }

  return recipeId;
}

export async function deleteRecipe(id: number, currentUser: string = 'system'): Promise<void> {
  await executeNonQuery('DELETE FROM RecipeIngredients WHERE RecipeId = @Id', {
    Id: { type: sql.Int, value: id },
  });
  await executeNonQuery('DELETE FROM Recipes WHERE Id = @Id', {
    Id: { type: sql.Int, value: id },
  });

  await logAudit(currentUser, currentUser, 'DELETE', 'Recipe', String(id), `Xóa công thức bánh ID: ${id}`);
}
