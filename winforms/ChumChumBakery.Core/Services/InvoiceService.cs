using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using ChumChumBakery.Core.Data;
using ChumChumBakery.Core.Models;
using System.Data.SqlClient;

namespace ChumChumBakery.Core.Services
{
    public class InvoiceService
    {
        private void EnsureSubtotalsUpdated()
        {
            try
            {
                var sql = "UPDATE InvoiceDetails SET Subtotal = Amount * Price WHERE Subtotal = 0 OR Subtotal IS NULL;";
                DatabaseHelper.ExecuteNonQuery(sql);
            }
            catch { }
        }

        public List<Invoice> GetAllInvoices(DateTime fromDate, DateTime toDate, string keyword = "", string type = "")
        {
            EnsureSubtotalsUpdated();

            var result = new List<Invoice>();
            // Đã gõ từ khóa tìm kiếm thì tìm toàn bộ theo từ khóa, bỏ qua khoảng ngày —
            // tránh tìm mã hóa đơn cũ không thấy vì bộ lọc đang giới hạn tháng hiện tại
            bool hasKeyword = !string.IsNullOrEmpty(keyword);
            string sql = @"
                SELECT i.*, 
                       ISNULL((SELECT SUM(CASE WHEN d.Subtotal > 0 THEN d.Subtotal ELSE d.Amount * d.Price END) 
                               FROM InvoiceDetails d WHERE d.InvoiceId = i.Id), 0) AS TotalAmount
                FROM Invoices i
                WHERE 1=1
            ";

            var parameters = new List<SqlParameter>();

            if (!hasKeyword)
            {
                sql += " AND i.InvDate >= @FromDate AND i.InvDate <= @ToDate";
                parameters.Add(new SqlParameter("@FromDate", fromDate.ToString("yyyy-MM-dd")));
                parameters.Add(new SqlParameter("@ToDate", toDate.ToString("yyyy-MM-dd")));
            }

            if (hasKeyword)
            {
                sql += @" AND (
                    i.Code LIKE @Keyword OR 
                    i.Partner LIKE @Keyword OR 
                    EXISTS (SELECT 1 FROM InvoiceDetails d LEFT JOIN Products p ON d.ProductId = p.Id WHERE d.InvoiceId = i.Id AND (d.ProductName LIKE @Keyword OR p.Code LIKE @Keyword))
                )";
                parameters.Add(new SqlParameter("@Keyword", "%" + keyword + "%"));
            }

            if (!string.IsNullOrEmpty(type))
            {
                sql += " AND i.Type = @Type";
                parameters.Add(new SqlParameter("@Type", type));
            }

            sql += " ORDER BY i.InvDate DESC, i.Id DESC";
            
            var dt = DatabaseHelper.ExecuteQuery(sql, parameters.ToArray());
            
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
                    // NULL = dữ liệu cũ / tạo từ bản chưa có chức năng duyệt -> coi như đã duyệt
                    ApprovalStatus = row["ApprovalStatus"] != DBNull.Value ? row["ApprovalStatus"]?.ToString() ?? "approved" : "approved",
                    ApprovedBy = row["ApprovedBy"] != DBNull.Value ? row["ApprovedBy"]?.ToString() ?? "" : "",
                    TotalAmount = Convert.ToDecimal(row["TotalAmount"])
                });
            }
            
            return result;
        }

        public List<InvoiceDetail> GetInvoiceDetails(int invoiceId)
        {
            var result = new List<InvoiceDetail>();
            string sql = "SELECT d.*, p.Code as ProductCode FROM InvoiceDetails d LEFT JOIN Products p ON d.ProductId = p.Id WHERE d.InvoiceId = @InvoiceId";
            
            var dt = DatabaseHelper.ExecuteQuery(sql, new SqlParameter("@InvoiceId", invoiceId));
            
            foreach (DataRow row in dt.Rows)
            {
                result.Add(new InvoiceDetail
                {
                    Id = Convert.ToInt32(row["Id"]),
                    InvoiceId = Convert.ToInt32(row["InvoiceId"]),
                    ProductId = row["ProductId"] != DBNull.Value ? Convert.ToInt32(row["ProductId"]) : (int?)null,
                    ProductCode = row["ProductCode"]?.ToString() ?? "",
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

                        // Xóa các liên kết khóa ngoại trước
                        using (var cmd = new SqlCommand("DELETE FROM BatchDeductions WHERE InvoiceId = @Id", conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Id", id);
                            cmd.ExecuteNonQuery();
                        }
                        
                        using (var cmd = new SqlCommand("DELETE FROM BatchDeductions WHERE BatchId IN (SELECT Id FROM Batches WHERE InvoiceId = @Id)", conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Id", id);
                            cmd.ExecuteNonQuery();
                        }
                        
                        using (var cmd = new SqlCommand("DELETE FROM Batches WHERE InvoiceId = @Id", conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Id", id);
                            cmd.ExecuteNonQuery();
                        }
                        
                        using (var cmd = new SqlCommand("DELETE FROM InvoiceDetails WHERE InvoiceId = @Id", conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Id", id);
                            cmd.ExecuteNonQuery();
                        }

                        string sql = "DELETE FROM Invoices WHERE Id = @Id";
                        using (var cmd = new SqlCommand(sql, conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Id", id);
                            cmd.ExecuteNonQuery();
                        }
                        tx.Commit();

                        // Rebuild all batches to maintain FIFO integrity after a historical delete
                        try {
                            new FifoBatchService().RebuildAllFifoBatches();
                        } catch { }
                    }
                    catch
                    {
                        tx.Rollback();
                        throw;
                    }
                }
            }
        }

        // Chuẩn hóa tên sản phẩm theo cách Batches ghép khi trừ FIFO (LOWER + TRIM)
        private static string NormalizeName(string? name) => (name ?? "").Trim().ToLowerInvariant();

        /**
         * Mô phỏng lại dòng thời gian FIFO với trạng thái MỚI của hóa đơn đang lưu
         * (excludeInvoiceId = 0 khi tạo mới). Trả về danh sách cảnh báo nếu có sản phẩm
         * bị âm kho tại thời điểm nào đó — khi đó RebuildAllFifoBatches sẽ âm thầm bỏ sót
         * phần thiếu, làm lệch tồn kho giữa hóa đơn và lô hàng nên phải chặn trước khi lưu.
         */
        public List<string> ValidateFifoTimeline(int excludeInvoiceId, DateTime newInvDate, string newType, List<InvoiceDetail> newDetails)
        {
            var violations = new List<string>();

            // Sự kiện: (key sản phẩm, tên hiển thị, ngày, là nhập?, số lượng)
            var events = new List<(string key, string display, DateTime date, bool isSupply, decimal qty)>();

            var dtOpening = DatabaseHelper.ExecuteQuery(
                "SELECT ProductName, AdjQty, Year, Month FROM StockOpeningAdj WHERE AdjQty > 0");
            foreach (DataRow r in dtOpening.Rows)
            {
                events.Add((NormalizeName(r["ProductName"]?.ToString()),
                            r["ProductName"]?.ToString() ?? "",
                            new DateTime(Convert.ToInt32(r["Year"]), Convert.ToInt32(r["Month"]), 1),
                            true,
                            Convert.ToDecimal(r["AdjQty"])));
            }

            var dtLines = DatabaseHelper.ExecuteQuery(
                @"SELECT d.ProductName, d.Amount, i.Type, i.InvDate
                  FROM InvoiceDetails d INNER JOIN Invoices i ON d.InvoiceId = i.Id
                  WHERE i.Id <> @ExcludeId
                    AND (i.Type = 'in' OR ISNULL(i.ApprovalStatus, 'approved') = 'approved')",
                new SqlParameter("@ExcludeId", excludeInvoiceId));
            foreach (DataRow r in dtLines.Rows)
            {
                events.Add((NormalizeName(r["ProductName"]?.ToString()),
                            r["ProductName"]?.ToString() ?? "",
                            Convert.ToDateTime(r["InvDate"]),
                            r["Type"]?.ToString() == "in",
                            Convert.ToDecimal(r["Amount"])));
            }

            foreach (var d in newDetails)
            {
                events.Add((NormalizeName(d.ProductName), d.ProductName ?? "", newInvDate, newType == "in", d.Amount));
            }

            // Chỉ kiểm tra các sản phẩm có mặt trong hóa đơn đang lưu — âm kho của sản phẩm
            // khác là tồn đọng lịch sử, không liên quan và không được phép chặn hóa đơn này
            var keysToCheck = new HashSet<string>(newDetails.Select(d => NormalizeName(d.ProductName)));

            // Duyệt từng sản phẩm theo thời gian; cùng ngày tính nhập trước xuất (thiên vị FIFO)
            foreach (var grp in events.GroupBy(e => e.key).Where(g => keysToCheck.Contains(g.Key)))
            {
                decimal balance = 0;
                foreach (var e in grp.OrderBy(x => x.date).ThenByDescending(x => x.isSupply))
                {
                    balance += e.isSupply ? e.qty : -e.qty;
                    if (balance < -0.005m)
                    {
                        violations.Add($"Sản phẩm '{e.display}': tồn kho sẽ bị âm {Math.Abs(balance):N2} vào ngày {e.date:dd/MM/yyyy}. Hãy giảm số lượng, dời ngày hóa đơn, hoặc kiểm tra lại các hóa đơn nhập.");
                        break;
                    }
                }
            }

            return violations;
        }

        public void UpdateInvoice(int invoiceId, Invoice invoice, List<InvoiceDetail> details)
        {
            using (var conn = new SqlConnection(DatabaseHelper.ConnectionString))
            {
                conn.Open();
                using (var tx = conn.BeginTransaction())
                {
                    try
                    {
                        AuditLogService.LogAction("UPDATE", "Invoice", invoiceId.ToString(),
                            $"Sửa hóa đơn {invoice.Code}: ngày {invoice.InvDate:dd/MM/yyyy}, {details.Count} dòng chi tiết", tx);

                        string sqlMaster = @"
                            UPDATE Invoices
                            SET Type = @Type, InvDate = @InvDate, Code = @Code, Partner = @Partner, Note = @Note,
                                UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE()
                            WHERE Id = @Id";

                        using (var cmd = new SqlCommand(sqlMaster, conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Type", invoice.Type);
                            cmd.Parameters.AddWithValue("@InvDate", invoice.InvDate);
                            cmd.Parameters.AddWithValue("@Code", invoice.Code);
                            cmd.Parameters.AddWithValue("@Partner", invoice.Partner);
                            cmd.Parameters.AddWithValue("@Note", invoice.Note ?? "");
                            cmd.Parameters.AddWithValue("@UpdatedBy", Session.CurrentUser?.Username ?? "");
                            cmd.Parameters.AddWithValue("@Id", invoiceId);
                            cmd.ExecuteNonQuery();
                        }

                        using (var cmd = new SqlCommand("DELETE FROM InvoiceDetails WHERE InvoiceId = @Id", conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Id", invoiceId);
                            cmd.ExecuteNonQuery();
                        }

                        string sqlDetail = @"
                            INSERT INTO InvoiceDetails (InvoiceId, ProductId, ProductName, Unit, Amount, Price, Subtotal, MfgDate, ExpDate)
                            VALUES (@InvoiceId, @ProductId, @ProductName, @Unit, @Amount, @Price, @Subtotal, @MfgDate, @ExpDate)";

                        foreach (var d in details)
                        {
                            using (var cmd = new SqlCommand(sqlDetail, conn, tx))
                            {
                                cmd.Parameters.AddWithValue("@InvoiceId", invoiceId);
                                cmd.Parameters.AddWithValue("@ProductId", d.ProductId.HasValue ? (object)d.ProductId.Value : DBNull.Value);
                                cmd.Parameters.AddWithValue("@ProductName", d.ProductName);
                                cmd.Parameters.AddWithValue("@Unit", d.Unit);
                                cmd.Parameters.AddWithValue("@Amount", d.Amount);
                                cmd.Parameters.AddWithValue("@Price", d.Price);
                                cmd.Parameters.AddWithValue("@Subtotal", d.Amount * d.Price);
                                cmd.Parameters.AddWithValue("@MfgDate", d.MfgDate.HasValue ? (object)d.MfgDate.Value : DBNull.Value);
                                cmd.Parameters.AddWithValue("@ExpDate", d.ExpDate.HasValue ? (object)d.ExpDate.Value : DBNull.Value);
                                cmd.ExecuteNonQuery();
                            }
                        }

                        tx.Commit();

                        // Lô hàng là dữ liệu phái sinh từ hóa đơn: rebuild toàn bộ FIFO sau khi sửa
                        // để đảm bảo nhất quán (cùng cơ chế với luồng xóa hóa đơn)
                        try
                        {
                            new FifoBatchService().RebuildAllFifoBatches();
                        }
                        catch { }
                    }
                    catch
                    {
                        tx.Rollback();
                        throw;
                    }
                }
            }
        }

        /**
         * Lưu hóa đơn mới. Trả về trạng thái duyệt của hóa đơn sau khi lưu:
         * "approved" (tính vào kho ngay) hoặc "pending" (chờ kế toán duyệt).
         * Quy tắc: hóa đơn nhập luôn approved; hóa đơn xuất do người có quyền
         * sửa hóa đơn xuất (kế toán/admin/manager) tạo thì duyệt ngay,
         * do thủ kho/staff tạo thì chờ duyệt và CHƯA trừ kho.
         */
        public string SaveInvoice(Invoice invoice, List<InvoiceDetail> details)
        {
            string currentUser = Session.CurrentUser?.Username ?? "";
            bool approver = Session.HasPermission("Menu_Invoices_Export", "edit");
            string status = invoice.Type != "out"
                ? "approved"
                : (approver ? "approved" : "pending");

            using (var conn = new SqlConnection(DatabaseHelper.ConnectionString))
            {
                conn.Open();
                using (var tx = conn.BeginTransaction())
                {
                    try
                    {
                        string sqlMaster = @"
                            INSERT INTO Invoices (Type, InvDate, Code, Partner, Note, CreatedBy, CreatedAt, ApprovalStatus, ApprovedBy, ApprovedAt)
                            OUTPUT INSERTED.Id
                            VALUES (@Type, @InvDate, @Code, @Partner, @Note, @CreatedBy, GETDATE(), @ApprovalStatus,
                                    CASE WHEN @ApprovalStatus = 'approved' AND @Type = 'out' THEN @CreatedBy ELSE NULL END,
                                    CASE WHEN @ApprovalStatus = 'approved' AND @Type = 'out' THEN GETDATE() ELSE NULL END)";

                        int newId;
                        using (var cmd = new SqlCommand(sqlMaster, conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Type", invoice.Type);
                            cmd.Parameters.AddWithValue("@InvDate", invoice.InvDate);
                            cmd.Parameters.AddWithValue("@Code", invoice.Code);
                            cmd.Parameters.AddWithValue("@Partner", invoice.Partner);
                            cmd.Parameters.AddWithValue("@Note", invoice.Note);
                            cmd.Parameters.AddWithValue("@CreatedBy", currentUser);
                            cmd.Parameters.AddWithValue("@ApprovalStatus", status);
                            newId = (int)cmd.ExecuteScalar();
                        }

                        string sqlDetail = @"
                            INSERT INTO InvoiceDetails (InvoiceId, ProductId, ProductName, Unit, Amount, Price, Subtotal)
                            VALUES (@InvoiceId, @ProductId, @ProductName, @Unit, @Amount, @Price, @Subtotal)";

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
                                cmd.Parameters.AddWithValue("@Subtotal", d.Amount * d.Price);
                                cmd.ExecuteNonQuery();
                            }
                        }

                        AuditLogService.LogAction(status == "approved" ? "CREATE" : "CREATE_PENDING", "Invoice", newId.ToString(),
                            $"Tạo hóa đơn {invoice.Code}" + (status == "pending" ? " (chờ duyệt)" : ""), tx);

                        tx.Commit();

                        // Chỉ hóa đơn ĐƯỢC TÍNH mới ảnh hưởng lô hàng
                        if (status == "approved")
                        {
                            try
                            {
                                var fifo = new FifoBatchService();
                                if (invoice.Type == "in")
                                {
                                    fifo.AddBatchesFromInvoice(newId);
                                }
                                else
                                {
                                    var items = new List<(string productName, decimal qty, string unit)>();
                                    foreach (var d in details)
                                    {
                                        items.Add((d.ProductName, d.Amount, d.Unit));
                                    }
                                    fifo.DeductBatchesFifo(newId, invoice.Code, invoice.InvDate, items);
                                }
                            }
                            catch { }
                        }
                    }
                    catch
                    {
                        tx.Rollback();
                        throw;
                    }
                }
            }
            return status;
        }

        /**
         * Xem trước vi phạm tồn kho nếu duyệt hóa đơn xuất này (mô phỏng FIFO với hóa đơn được tính).
         */
        public List<string> PreviewApprovalViolations(int invoiceId)
        {
            var inv = GetInvoiceById(invoiceId);
            var details = GetInvoiceDetails(invoiceId);
            return ValidateFifoTimeline(invoiceId, inv.InvDate, "out", details);
        }

        /**
         * Duyệt / từ chối hóa đơn xuất. Duyệt => hóa đơn bắt đầu được tính vào kho
         * (rebuild FIFO); từ chối => ngừng tính (kho được hoàn lại qua rebuild).
         */
        public void ApplyApproval(int invoiceId, bool approve)
        {
            string currentUser = Session.CurrentUser?.Username ?? "";
            string status = approve ? "approved" : "rejected";

            using (var conn = new SqlConnection(DatabaseHelper.ConnectionString))
            {
                conn.Open();
                using (var tx = conn.BeginTransaction())
                {
                    try
                    {
                        string code = "";
                        using (var cmd = new SqlCommand("SELECT Code FROM Invoices WHERE Id = @Id", conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Id", invoiceId);
                            var r = cmd.ExecuteScalar();
                            code = r?.ToString() ?? invoiceId.ToString();
                        }

                        using (var cmd = new SqlCommand(@"
                            UPDATE Invoices
                            SET ApprovalStatus = @Status, ApprovedBy = @User, ApprovedAt = GETDATE()
                            WHERE Id = @Id AND Type = 'out'", conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Status", status);
                            cmd.Parameters.AddWithValue("@User", currentUser);
                            cmd.Parameters.AddWithValue("@Id", invoiceId);
                            int rows = cmd.ExecuteNonQuery();
                            if (rows == 0) throw new Exception("Chỉ hóa đơn xuất kho mới có thao tác duyệt.");
                        }

                        AuditLogService.LogAction(approve ? "APPROVE" : "REJECT", "Invoice", invoiceId.ToString(),
                            (approve ? "Duyệt hóa đơn xuất " : "Từ chối hóa đơn xuất ") + code, tx);

                        tx.Commit();
                    }
                    catch
                    {
                        tx.Rollback();
                        throw;
                    }
                }
            }

            // Hóa đơn xuất bắt đầu / ngừng được tính => tính lại toàn bộ FIFO
            try { new FifoBatchService().RebuildAllFifoBatches(); } catch { }
        }

        public Invoice GetInvoiceById(int invoiceId)
        {
            var dt = DatabaseHelper.ExecuteQuery("SELECT * FROM Invoices WHERE Id = @Id",
                new SqlParameter("@Id", invoiceId));
            if (dt.Rows.Count == 0) throw new Exception("Không tìm thấy hóa đơn ID " + invoiceId);
            var row = dt.Rows[0];
            return new Invoice
            {
                Id = Convert.ToInt32(row["Id"]),
                Type = row["Type"]?.ToString(),
                InvDate = Convert.ToDateTime(row["InvDate"]),
                Code = row["Code"]?.ToString() ?? "",
                Partner = row["Partner"]?.ToString() ?? "",
                Note = row["Note"]?.ToString() ?? "",
                ApprovalStatus = row["ApprovalStatus"] != DBNull.Value ? row["ApprovalStatus"]?.ToString() ?? "approved" : "approved"
            };
        }
    }
}
