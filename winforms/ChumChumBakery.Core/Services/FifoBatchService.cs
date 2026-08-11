using System;
using System.Collections.Generic;
using System.Data;
using ChumChumBakery.Core.Data;
using ChumChumBakery.Core.Models;
using System.Data.SqlClient;

namespace ChumChumBakery.Core.Services
{
    public class FifoBatchService
    {
        /**
         * Tự động trừ lô FIFO khi tạo Hoá đơn xuất kho
         */
        public void DeductBatchesFifo(int exportInvoiceId, string exportInvCode, DateTime exportInvDate, List<(string productName, decimal qty, string unit)> items)
        {
            foreach (var item in items)
            {
                var pName = item.productName.Trim();
                var remainingToDeduct = item.qty;

                // Query danh sách các lô còn hàng xếp theo inv_date ASC, id ASC (FIFO)
                var dtBatches = DatabaseHelper.ExecuteQuery(
                    @"SELECT Id, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price, Unit 
                      FROM Batches 
                      WHERE LOWER(TRIM(ProductName)) = LOWER(TRIM(@ProductName)) AND RemainingQty > 0 
                      ORDER BY InvoiceDate ASC, Id ASC",
                    new SqlParameter("@ProductName", pName));

                foreach (DataRow r in dtBatches.Rows)
                {
                    if (remainingToDeduct <= 0) break;

                    var batchId = Convert.ToInt32(r["Id"]);
                    var bRemaining = Convert.ToDecimal(r["RemainingQty"]);
                    var bCode = r["InvoiceCode"].ToString() ?? "";
                    var bDate = Convert.ToDateTime(r["InvoiceDate"]);
                    var bPrice = Convert.ToDecimal(r["Price"]);
                    var bUnit = r["Unit"].ToString() ?? "kg";

                    var take = Math.Min(remainingToDeduct, bRemaining);
                    var newRemaining = bRemaining - take;

                    // Cập nhật remaining_qty trong bảng Batches
                    DatabaseHelper.ExecuteNonQuery(
                        "UPDATE Batches SET RemainingQty = @NewRemaining WHERE Id = @BatchId",
                        new SqlParameter("@NewRemaining", newRemaining),
                        new SqlParameter("@BatchId", batchId));

                    // Ghi dòng trừ batch vào BatchDeductions
                    DatabaseHelper.ExecuteNonQuery(
                        @"INSERT INTO BatchDeductions (BatchId, InvoiceId, QtyUsed, BatchInvCode, BatchInvDate, BatchPrice, BatchUnit)
                          VALUES (@BatchId, @InvoiceId, @QtyUsed, @BatchInvCode, @BatchInvDate, @BatchPrice, @BatchUnit)",
                        new SqlParameter("@BatchId", batchId),
                        new SqlParameter("@InvoiceId", exportInvoiceId),
                        new SqlParameter("@QtyUsed", take),
                        new SqlParameter("@BatchInvCode", bCode),
                        new SqlParameter("@BatchInvDate", bDate),
                        new SqlParameter("@BatchPrice", bPrice),
                        new SqlParameter("@BatchUnit", bUnit));

                    remainingToDeduct -= take;
                }
            }
        }

        /**
         * Khôi phục số lượng tồn lô khi xoá Hoá đơn xuất
         */
        public void RestoreBatchDeductions(int exportInvoiceId)
        {
            var dtDeductions = DatabaseHelper.ExecuteQuery(
                "SELECT BatchId, QtyUsed FROM BatchDeductions WHERE InvoiceId = @InvoiceId",
                new SqlParameter("@InvoiceId", exportInvoiceId));

            foreach (DataRow r in dtDeductions.Rows)
            {
                var batchId = Convert.ToInt32(r["BatchId"]);
                var qtyUsed = Convert.ToDecimal(r["QtyUsed"]);

                DatabaseHelper.ExecuteNonQuery(
                    "UPDATE Batches SET RemainingQty = RemainingQty + @QtyUsed WHERE Id = @BatchId",
                    new SqlParameter("@QtyUsed", qtyUsed),
                    new SqlParameter("@BatchId", batchId));
            }

            DatabaseHelper.ExecuteNonQuery(
                "DELETE FROM BatchDeductions WHERE InvoiceId = @InvoiceId",
                new SqlParameter("@InvoiceId", exportInvoiceId));
        }

        public List<Batch> GetAllBatches(string search = "", string statusFilter = "active")
        {
            var result = new List<Batch>();
            string sql = @"
                SELECT b.* 
                FROM Batches b
                WHERE (b.ProductName LIKE @Search OR b.InvoiceCode LIKE @Search)";

            if (statusFilter == "active")
            {
                sql += " AND b.RemainingQty > 0.001";
            }
            else if (statusFilter == "empty")
            {
                sql += " AND b.RemainingQty <= 0.001";
            }

            sql += " ORDER BY b.InvoiceDate DESC, b.Id DESC";

            var dt = DatabaseHelper.ExecuteQuery(sql, new SqlParameter("@Search", "%" + search + "%"));

            foreach (DataRow r in dt.Rows)
            {
                result.Add(new Batch
                {
                    Id = Convert.ToInt32(r["Id"]),
                    ProductName = r["ProductName"]?.ToString() ?? "",
                    InvoiceId = Convert.ToInt32(r["InvoiceId"]),
                    InvoiceCode = r["InvoiceCode"]?.ToString() ?? "",
                    InvoiceDate = Convert.ToDateTime(r["InvoiceDate"]),
                    Quantity = Convert.ToDecimal(r["Quantity"]),
                    RemainingQty = Convert.ToDecimal(r["RemainingQty"]),
                    Price = Convert.ToDecimal(r["Price"]),
                    Unit = r["Unit"]?.ToString() ?? "kg",
                    MfgDate = r["MfgDate"] != DBNull.Value ? Convert.ToDateTime(r["MfgDate"]) : (DateTime?)null,
                    ExpDate = r["ExpDate"] != DBNull.Value ? Convert.ToDateTime(r["ExpDate"]) : (DateTime?)null
                });
            }

            return result;
        }

        public void RebuildAllFifoBatches()
        {
            DatabaseHelper.ExecuteNonQuery("DELETE FROM BatchDeductions; DELETE FROM Batches;");

            // 1. Tải các Lô Tồn Đầu Kỳ từ Khai Báo Tồn Đầu Kỳ (vào ngày mùng 1 của tháng)
            DatabaseHelper.ExecuteNonQuery(@"
                INSERT INTO Batches (ProductName, InvoiceId, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price, Unit)
                SELECT 
                    s.ProductName, 
                    0 AS InvoiceId, 
                    'TONDAU-' + RIGHT('0' + CAST(s.Month AS VARCHAR), 2) + '/' + CAST(s.Year AS VARCHAR) AS InvoiceCode, 
                    CAST(CAST(s.Year AS VARCHAR) + '-' + RIGHT('0' + CAST(s.Month AS VARCHAR), 2) + '-01' AS DATETIME) AS InvoiceDate, 
                    s.AdjQty AS Quantity, 
                    s.AdjQty AS RemainingQty, 
                    ISNULL(p.CostPrice, 0) AS Price, 
                    ISNULL(p.Unit, 'kg') AS Unit
                FROM StockOpeningAdj s
                LEFT JOIN Products p ON s.ProductName = p.Name
                WHERE s.AdjQty > 0;");

            // 2. Tải lại toàn bộ Lô từ các Hóa đơn Nhập kho (Type = 'in')
            DatabaseHelper.ExecuteNonQuery(@"
                INSERT INTO Batches (ProductName, InvoiceId, InvoiceCode, InvoiceDate, Quantity, RemainingQty, Price, Unit, MfgDate, ExpDate)
                SELECT d.ProductName, i.Id, i.Code, i.InvDate, d.Amount, d.Amount, d.Price, d.Unit, d.MfgDate, d.ExpDate
                FROM InvoiceDetails d
                INNER JOIN Invoices i ON d.InvoiceId = i.Id
                WHERE i.Type = 'in'
                ORDER BY i.InvDate ASC, i.Id ASC");

            // 3. Duyệt qua tất cả Hóa đơn Xuất kho (Type = 'out') theo thời gian để trừ FIFO
            var dtOutInvoices = DatabaseHelper.ExecuteQuery(@"
                SELECT i.Id, i.Code, i.InvDate
                FROM Invoices i
                WHERE i.Type = 'out'
                ORDER BY i.InvDate ASC, i.Id ASC");

            foreach (DataRow r in dtOutInvoices.Rows)
            {
                int invId = Convert.ToInt32(r["Id"]);
                string code = r["Code"]?.ToString() ?? "";
                DateTime date = Convert.ToDateTime(r["InvDate"]);

                var dtDetails = DatabaseHelper.ExecuteQuery(
                    "SELECT ProductName, Amount, Unit FROM InvoiceDetails WHERE InvoiceId = @InvoiceId",
                    new SqlParameter("@InvoiceId", invId));

                var items = new List<(string productName, decimal qty, string unit)>();
                foreach (DataRow dr in dtDetails.Rows)
                {
                    items.Add((dr["ProductName"]?.ToString() ?? "", Convert.ToDecimal(dr["Amount"]), dr["Unit"]?.ToString() ?? "kg"));
                }

                DeductBatchesFifo(invId, code, date, items);
            }
        }
    }
}
