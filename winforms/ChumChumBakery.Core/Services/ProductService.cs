using System;
using System.Collections.Generic;
using System.Data;
using ChumChumBakery.Core.Data;
using ChumChumBakery.Core.Models;
using System.Data.SqlClient;

namespace ChumChumBakery.Core.Services
{
    public class ProductService
    {
        public List<Product> GetAllProducts(string search = "")
        {
            var result = new List<Product>();
            string sql = @"
                SELECT p.*,
                       (
                           ISNULL((SELECT TOP 1 AdjQty FROM StockOpeningAdj WHERE ProductName = p.Name ORDER BY Year DESC, Month DESC), 0)
                           + ISNULL((SELECT SUM(d.Amount) FROM InvoiceDetails d INNER JOIN Invoices i ON d.InvoiceId = i.Id WHERE (d.ProductId = p.Id OR d.ProductName = p.Name) AND i.Type = 'in'), 0)
                           - ISNULL((SELECT SUM(d.Amount) FROM InvoiceDetails d INNER JOIN Invoices i ON d.InvoiceId = i.Id WHERE (d.ProductId = p.Id OR d.ProductName = p.Name) AND i.Type = 'out'), 0)
                       ) AS RealtimeStock
                FROM Products p
                WHERE p.IsActive = 1";
            
            if (!string.IsNullOrEmpty(search))
            {
                sql += " AND (p.Name LIKE @Search OR p.Code LIKE @Search)";
            }
            
            sql += " ORDER BY p.Category, p.Name";
            
            var parameters = new List<SqlParameter>();
            if (!string.IsNullOrEmpty(search))
            {
                parameters.Add(new SqlParameter("@Search", "%" + search + "%"));
            }

            var dt = DatabaseHelper.ExecuteQuery(sql, parameters.ToArray());
            
            foreach (DataRow row in dt.Rows)
            {
                result.Add(new Product
                {
                    Id = Convert.ToInt32(row["Id"]),
                    Code = row["Code"]?.ToString(),
                    Name = row["Name"]?.ToString(),
                    Category = row["Category"]?.ToString(),
                    Unit = row["Unit"]?.ToString(),
                    CostPrice = Convert.ToDecimal(row["CostPrice"]),
                    SellPrice = Convert.ToDecimal(row["SellPrice"]),
                    StockQty = Convert.ToDecimal(row["RealtimeStock"]),
                    MinStock = Convert.ToDecimal(row["MinStock"]),
                    Supplier = row["Supplier"]?.ToString(),
                    Description = row["Description"]?.ToString(),
                    IsActive = Convert.ToBoolean(row["IsActive"]),
                    CreatedBy = row["CreatedBy"] != DBNull.Value ? row["CreatedBy"]?.ToString() ?? "" : "",
                    UpdatedBy = row["UpdatedBy"] != DBNull.Value ? row["UpdatedBy"]?.ToString() ?? "" : ""
                });
            }
            
            return result;
        }

        public void SaveProduct(Product p)
        {
            string currentUser = Session.CurrentUser?.Username ?? "system";
            if (p.Id == 0)
            {
                // Thêm mới
                string sql = @"
                    INSERT INTO Products (Code, Name, Category, Unit, CostPrice, SellPrice, StockQty, MinStock, Supplier, Description, IsActive, CreatedBy, CreatedAt)
                    VALUES (@Code, @Name, @Category, @Unit, @CostPrice, @SellPrice, @StockQty, @MinStock, @Supplier, @Description, 1, @CreatedBy, GETDATE())";
                    
                DatabaseHelper.ExecuteNonQuery(sql,
                    new SqlParameter("@Code", p.Code ?? (object)DBNull.Value),
                    new SqlParameter("@Name", p.Name),
                    new SqlParameter("@Category", p.Category ?? "Khác"),
                    new SqlParameter("@Unit", p.Unit ?? "kg"),
                    new SqlParameter("@CostPrice", p.CostPrice),
                    new SqlParameter("@SellPrice", p.SellPrice),
                    new SqlParameter("@StockQty", p.StockQty),
                    new SqlParameter("@MinStock", p.MinStock),
                    new SqlParameter("@Supplier", p.Supplier ?? ""),
                    new SqlParameter("@Description", p.Description ?? ""),
                    new SqlParameter("@CreatedBy", currentUser)
                );
            }
            else
            {
                // Cập nhật
                string sql = @"
                    UPDATE Products 
                    SET Code = @Code, Name = @Name, Category = @Category, Unit = @Unit, 
                        CostPrice = @CostPrice, SellPrice = @SellPrice, MinStock = @MinStock,
                        Supplier = @Supplier, Description = @Description, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE()
                    WHERE Id = @Id";
                    
                DatabaseHelper.ExecuteNonQuery(sql,
                    new SqlParameter("@Code", p.Code ?? (object)DBNull.Value),
                    new SqlParameter("@Name", p.Name),
                    new SqlParameter("@Category", p.Category ?? "Khác"),
                    new SqlParameter("@Unit", p.Unit ?? "kg"),
                    new SqlParameter("@CostPrice", p.CostPrice),
                    new SqlParameter("@SellPrice", p.SellPrice),
                    new SqlParameter("@MinStock", p.MinStock),
                    new SqlParameter("@Supplier", p.Supplier ?? ""),
                    new SqlParameter("@Description", p.Description ?? ""),
                    new SqlParameter("@UpdatedBy", currentUser),
                    new SqlParameter("@Id", p.Id)
                );
            }
        }

        public void DeleteProduct(int id)
        {
            // Xóa mềm
            string sql = "UPDATE Products SET IsActive = 0 WHERE Id = @Id";
            DatabaseHelper.ExecuteNonQuery(sql, new SqlParameter("@Id", id));
        }
    }
}
