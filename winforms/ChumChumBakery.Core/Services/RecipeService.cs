using System;
using System.Collections.Generic;
using System.Data;
using ChumChumBakery.Core.Data;
using ChumChumBakery.Core.Models;
using System.Data.SqlClient;

namespace ChumChumBakery.Core.Services
{
    public class RecipeService
    {
        public List<Recipe> GetAllRecipes()
        {
            var result = new List<Recipe>();
            var dt = DatabaseHelper.ExecuteQuery("SELECT * FROM Recipes ORDER BY Name");
            foreach (DataRow row in dt.Rows)
            {
                result.Add(new Recipe
                {
                    Id = Convert.ToInt32(row["Id"]),
                    Name = row["Name"]?.ToString() ?? "",
                    BaseYield = Convert.ToDecimal(row["BaseYield"]),
                    CreatedBy = row["CreatedBy"] != DBNull.Value ? row["CreatedBy"]?.ToString() ?? "" : "",
                    UpdatedBy = row["UpdatedBy"] != DBNull.Value ? row["UpdatedBy"]?.ToString() ?? "" : ""
                });
            }
            return result;
        }

        public List<RecipeIngredient> GetRecipeIngredients(int recipeId)
        {
            var result = new List<RecipeIngredient>();
            var dt = DatabaseHelper.ExecuteQuery("SELECT * FROM RecipeIngredients WHERE RecipeId = @RecipeId", new SqlParameter("@RecipeId", recipeId));
            foreach (DataRow row in dt.Rows)
            {
                result.Add(new RecipeIngredient
                {
                    Id = Convert.ToInt32(row["Id"]),
                    RecipeId = Convert.ToInt32(row["RecipeId"]),
                    ProductName = row["ProductName"]?.ToString() ?? "",
                    Amount = Convert.ToDecimal(row["Amount"]),
                    Unit = row["Unit"]?.ToString() ?? "g",
                    Price = Convert.ToDecimal(row["Price"])
                });
            }
            return result;
        }

        public void SaveRecipe(Recipe recipe, List<RecipeIngredient> ingredients)
        {
            using (var conn = new SqlConnection(DatabaseHelper.ConnectionString))
            {
                conn.Open();
                using (var tx = conn.BeginTransaction())
                {
                    try
                    {
                        int recipeId = recipe.Id;
                        string currentUser = Session.CurrentUser?.Username ?? "system";
                        if (recipe.Id == 0)
                        {
                            string insertRecipe = "INSERT INTO Recipes (Name, BaseYield, CreatedBy, CreatedAt) OUTPUT INSERTED.Id VALUES (@Name, @BaseYield, @CreatedBy, GETDATE())";
                            using (var cmd = new SqlCommand(insertRecipe, conn, tx))
                            {
                                cmd.Parameters.AddWithValue("@Name", recipe.Name);
                                cmd.Parameters.AddWithValue("@BaseYield", recipe.BaseYield);
                                cmd.Parameters.AddWithValue("@CreatedBy", currentUser);
                                recipeId = (int)cmd.ExecuteScalar();
                            }
                        }
                        else
                        {
                            string updateRecipe = "UPDATE Recipes SET Name = @Name, BaseYield = @BaseYield, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE() WHERE Id = @Id";
                            using (var cmd = new SqlCommand(updateRecipe, conn, tx))
                            {
                                cmd.Parameters.AddWithValue("@Name", recipe.Name);
                                cmd.Parameters.AddWithValue("@BaseYield", recipe.BaseYield);
                                cmd.Parameters.AddWithValue("@UpdatedBy", currentUser);
                                cmd.Parameters.AddWithValue("@Id", recipe.Id);
                                cmd.ExecuteNonQuery();
                            }

                            // Xóa nguyên liệu cũ
                            string deleteIng = "DELETE FROM RecipeIngredients WHERE RecipeId = @RecipeId";
                            using (var cmd = new SqlCommand(deleteIng, conn, tx))
                            {
                                cmd.Parameters.AddWithValue("@RecipeId", recipeId);
                                cmd.ExecuteNonQuery();
                            }
                        }

                        // Thêm nguyên liệu mới
                        string insertIng = "INSERT INTO RecipeIngredients (RecipeId, ProductName, Amount, Unit, Price) VALUES (@RecipeId, @ProductName, @Amount, @Unit, @Price)";
                        foreach (var item in ingredients)
                        {
                            using (var cmd = new SqlCommand(insertIng, conn, tx))
                            {
                                cmd.Parameters.AddWithValue("@RecipeId", recipeId);
                                cmd.Parameters.AddWithValue("@ProductName", item.ProductName);
                                cmd.Parameters.AddWithValue("@Amount", item.Amount);
                                cmd.Parameters.AddWithValue("@Unit", item.Unit);
                                cmd.Parameters.AddWithValue("@Price", item.Price);
                                cmd.ExecuteNonQuery();
                            }
                        }

                        tx.Commit();
                    }
                    catch
                    {
                        tx.Rollback();
                        throw;
                    }
                }
            }
        }

        public void DeleteRecipe(int id)
        {
            // Bảng RecipeIngredients đã cấu hình CASCADE DELETE trong CSDL
            string sql = "DELETE FROM Recipes WHERE Id = @Id";
            DatabaseHelper.ExecuteNonQuery(sql, new SqlParameter("@Id", id));
        }
    }
}
