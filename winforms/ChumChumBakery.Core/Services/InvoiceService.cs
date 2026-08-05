using System;
using System.Collections.Generic;
using System.Data;
using ChumChumBakery.Core.Data;
using ChumChumBakery.Core.Models;
using System.Data.SqlClient;

namespace ChumChumBakery.Core.Services
{
    public class InvoiceService
    {
        public List<Invoice> GetAllInvoices(DateTime fromDate, DateTime toDate)
        {
            var result = new List<Invoice>();
            string sql = @"
                SELECT i.*, 
                       ISNULL((SELECT SUM(d.Subtotal) FROM InvoiceDetails d WHERE d.InvoiceId = i.Id), 0) AS TotalAmount
                FROM Invoices i
                WHERE i.InvDate >= @FromDate AND i.InvDate <= @ToDate
                ORDER BY i.InvDate DESC, i.Id DESC";
                
            var dt = DatabaseHelper.ExecuteQuery(sql,
                new SqlParameter("@FromDate", fromDate.ToString("yyyy-MM-dd")),
                new SqlParameter("@ToDate", toDate.ToString("yyyy-MM-dd"))
            );
            
            foreach (DataRow row in dt.Rows)
            {
                result.Add(new Invoice
                {
                    Id = Convert.ToInt32(row["Id"]),
                    Type = row["Type"]?.ToString(),
                    InvDate = Convert.ToDateTime(row["InvDate"]),
                    Code = row["Code"]?.ToString(),
                    Partner = row["Partner"]?.ToString(),
                    Note = row["Note"]?.ToString(),
                    ImageUrl = row["ImageUrl"]?.ToString(),
                    CreatedBy = row["CreatedBy"] != DBNull.Value ? row["CreatedBy"]?.ToString() ?? "" : "",
                    UpdatedBy = row["UpdatedBy"] != DBNull.Value ? row["UpdatedBy"]?.ToString() ?? "" : "",
                    TotalAmount = Convert.ToDecimal(row["TotalAmount"])
                });
            }
            
            return result;
        }

        public List<InvoiceDetail> GetInvoiceDetails(int invoiceId)
        {
            var result = new List<InvoiceDetail>();
            string sql = "SELECT * FROM InvoiceDetails WHERE InvoiceId = @InvoiceId";
            
            var dt = DatabaseHelper.ExecuteQuery(sql, new SqlParameter("@InvoiceId", invoiceId));
            
            foreach (DataRow row in dt.Rows)
            {
                result.Add(new InvoiceDetail
                {
                    Id = Convert.ToInt32(row["Id"]),
                    InvoiceId = Convert.ToInt32(row["InvoiceId"]),
                    ProductId = row["ProductId"] != DBNull.Value ? Convert.ToInt32(row["ProductId"]) : (int?)null,
                    ProductName = row["ProductName"]?.ToString(),
                    Unit = row["Unit"]?.ToString(),
                    Amount = Convert.ToDecimal(row["Amount"]),
                    Price = Convert.ToDecimal(row["Price"]),
                    MfgDate = row["MfgDate"] != DBNull.Value ? Convert.ToDateTime(row["MfgDate"]) : (DateTime?)null,
                    ExpDate = row["ExpDate"] != DBNull.Value ? Convert.ToDateTime(row["ExpDate"]) : (DateTime?)null
                });
            }
            
            return result;
        }
        
        public void DeleteInvoice(int id)
        {
            using (var conn = new SqlConnection(DatabaseHelper.ConnectionString))
            {
                conn.Open();
                using (var tx = conn.BeginTransaction())
                {
                    try
                    {
                        AuditLogService.LogAction("DELETE", "Invoice", id.ToString(), $"Xóa hóa đơn ID: {id}", tx);

                        string sql = "DELETE FROM Invoices WHERE Id = @Id";
                        using (var cmd = new SqlCommand(sql, conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Id", id);
                            cmd.ExecuteNonQuery();
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

        public void SaveInvoice(Invoice invoice, List<InvoiceDetail> details)
        {
            using (var conn = new SqlConnection(DatabaseHelper.ConnectionString))
            {
                conn.Open();
                using (var tx = conn.BeginTransaction())
                {
                    try
                    {
                        string sqlMaster = @"
                            INSERT INTO Invoices (Type, InvDate, Code, Partner, Note, CreatedBy, CreatedAt)
                            OUTPUT INSERTED.Id
                            VALUES (@Type, @InvDate, @Code, @Partner, @Note, @CreatedBy, GETDATE())";

                        int newId;
                        using (var cmd = new SqlCommand(sqlMaster, conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Type", invoice.Type);
                            cmd.Parameters.AddWithValue("@InvDate", invoice.InvDate);
                            cmd.Parameters.AddWithValue("@Code", invoice.Code);
                            cmd.Parameters.AddWithValue("@Partner", invoice.Partner);
                            cmd.Parameters.AddWithValue("@Note", invoice.Note);
                            cmd.Parameters.AddWithValue("@CreatedBy", Session.CurrentUser?.Username ?? "");
                            newId = (int)cmd.ExecuteScalar();
                        }

                        string sqlDetail = @"
                            INSERT INTO InvoiceDetails (InvoiceId, ProductId, ProductName, Unit, Amount, Price)
                            VALUES (@InvoiceId, @ProductId, @ProductName, @Unit, @Amount, @Price)";

                        foreach (var d in details)
                        {
                            using (var cmd = new SqlCommand(sqlDetail, conn, tx))
                            {
                                cmd.Parameters.AddWithValue("@InvoiceId", newId);
                                cmd.Parameters.AddWithValue("@ProductId", d.ProductId.HasValue ? (object)d.ProductId.Value : DBNull.Value);
                                cmd.Parameters.AddWithValue("@ProductName", d.ProductName);
                                cmd.Parameters.AddWithValue("@Unit", d.Unit);
                                cmd.Parameters.AddWithValue("@Amount", d.Amount);
                                cmd.Parameters.AddWithValue("@Price", d.Price);
                                cmd.ExecuteNonQuery();
                            }
                        }

                        AuditLogService.LogAction("CREATE", "Invoice", newId.ToString(), $"Tạo hóa đơn {invoice.Code}", tx);

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
    }
}
