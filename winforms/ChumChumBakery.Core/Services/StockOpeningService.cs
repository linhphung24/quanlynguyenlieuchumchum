using System;
using System.Collections.Generic;
using System.Data;
using ChumChumBakery.Core.Data;
using ChumChumBakery.Core.Models;
using System.Data.SqlClient;

namespace ChumChumBakery.Core.Services
{
    public class StockOpeningService
    {
        public List<StockOpeningAdj> GetOpeningStocks(int month, int year)
        {
            var result = new List<StockOpeningAdj>();
            string sql = @"
                SELECT 
                    p.Name AS ProductName, 
                    p.Code AS ProductCode, 
                    p.Unit, 
                    ISNULL(s.Id, 0) AS Id,
                    (
                        ISNULL((SELECT TOP 1 AdjQty FROM StockOpeningAdj WHERE ProductName = p.Name ORDER BY Year DESC, Month DESC), 0)
                        + ISNULL((SELECT SUM(d.Amount) FROM InvoiceDetails d INNER JOIN Invoices i ON d.InvoiceId = i.Id WHERE (d.ProductId = p.Id OR d.ProductName = p.Name) AND i.Type = 'in'), 0)
                        - ISNULL((SELECT SUM(d.Amount) FROM InvoiceDetails d INNER JOIN Invoices i ON d.InvoiceId = i.Id WHERE (d.ProductId = p.Id OR d.ProductName = p.Name) AND i.Type = 'out'), 0)
                    ) AS CurrentStock,
                    ISNULL(
                        s.AdjQty, 
                        (
                            ISNULL((SELECT TOP 1 AdjQty FROM StockOpeningAdj WHERE ProductName = p.Name ORDER BY Year DESC, Month DESC), 0)
                            + ISNULL((SELECT SUM(d.Amount) FROM InvoiceDetails d INNER JOIN Invoices i ON d.InvoiceId = i.Id WHERE (d.ProductId = p.Id OR d.ProductName = p.Name) AND i.Type = 'in'), 0)
                            - ISNULL((SELECT SUM(d.Amount) FROM InvoiceDetails d INNER JOIN Invoices i ON d.InvoiceId = i.Id WHERE (d.ProductId = p.Id OR d.ProductName = p.Name) AND i.Type = 'out'), 0)
                        )
                    ) AS AdjQty,
                    ISNULL(s.CreatedBy, '') AS CreatedBy,
                    ISNULL(s.UpdatedBy, '') AS UpdatedBy,
                    @Year AS Year,
                    @Month AS Month
                FROM Products p
                LEFT JOIN StockOpeningAdj s ON p.Name = s.ProductName AND s.Year = @Year AND s.Month = @Month
                WHERE p.IsActive = 1
                ORDER BY p.Category, p.Name";

            var pYear = new SqlParameter("@Year", year);
            var pMonth = new SqlParameter("@Month", month);
            var dt = DatabaseHelper.ExecuteQuery(sql, pYear, pMonth);

            foreach (DataRow row in dt.Rows)
            {
                result.Add(new StockOpeningAdj
                {
                    Id = Convert.ToInt32(row["Id"]),
                    ProductName = row["ProductName"]?.ToString() ?? "",
                    ProductCode = row["ProductCode"]?.ToString() ?? "",
                    Unit = row["Unit"]?.ToString() ?? "",
                    Year = Convert.ToInt32(row["Year"]),
                    Month = Convert.ToInt32(row["Month"]),
                    CurrentStock = Convert.ToDecimal(row["CurrentStock"]),
                    AdjQty = Convert.ToDecimal(row["AdjQty"]),
                    CreatedBy = row["CreatedBy"] != DBNull.Value ? row["CreatedBy"]?.ToString() ?? "" : "",
                    UpdatedBy = row["UpdatedBy"] != DBNull.Value ? row["UpdatedBy"]?.ToString() ?? "" : ""
                });
            }

            return result;
        }

        public void SaveOpeningStocks(int month, int year, List<StockOpeningAdj> stocks)
        {
            string currentUser = Session.CurrentUser?.Username ?? "system";
            using (var conn = new SqlConnection(DatabaseHelper.ConnectionString))
            {
                conn.Open();
                using (var tx = conn.BeginTransaction())
                {
                    try
                    {
                        string upsertSql = @"
                            MERGE StockOpeningAdj AS target
                            USING (SELECT @ProductName AS ProductName, @Year AS Year, @Month AS Month, @AdjQty AS AdjQty, @UpdatedBy AS UpdatedBy) AS source
                            ON (target.ProductName = source.ProductName AND target.Year = source.Year AND target.Month = source.Month)
                            WHEN MATCHED THEN
                                UPDATE SET AdjQty = source.AdjQty, UpdatedBy = source.UpdatedBy, UpdatedAt = GETDATE()
                            WHEN NOT MATCHED THEN
                                INSERT (ProductName, Year, Month, AdjQty, CreatedBy, CreatedAt, UpdatedBy, UpdatedAt)
                                VALUES (source.ProductName, source.Year, source.Month, source.AdjQty, source.UpdatedBy, GETDATE(), source.UpdatedBy, GETDATE());";

                        foreach (var s in stocks)
                        {
                            using (var cmd = new SqlCommand(upsertSql, conn, tx))
                            {
                                cmd.Parameters.AddWithValue("@ProductName", s.ProductName);
                                cmd.Parameters.AddWithValue("@Year", year);
                                cmd.Parameters.AddWithValue("@Month", month);
                                cmd.Parameters.AddWithValue("@AdjQty", s.AdjQty);
                                cmd.Parameters.AddWithValue("@UpdatedBy", currentUser);
                                cmd.ExecuteNonQuery();
                            }
                        }

                        tx.Commit();

                        // Cập nhật lại danh sách Lô FIFO bao gồm Lô Tồn Đầu Kỳ
                        var fifo = new FifoBatchService();
                        fifo.RebuildAllFifoBatches();
                    }
                    catch
                    {
                        tx.Rollback();
                        throw;
                    }
                }
            }
        }
    }
}
