using System;
using System.Collections.Generic;
using System.Data;
using ChumChumBakery.Core.Data;
using Microsoft.Data.SqlClient;

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
    }
}
