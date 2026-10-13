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
                        -- SP chua khai bao gio thi hien 0 thay vi ton hien tai:
                        -- pre-fill bang ton hien tai khien nguoi dung hieu lam la da tu khai
                        -- bang dung so vua nhap (vu ton dau = hoa don nhap)
                        0
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

        /**
         * Kỳ khai báo tồn đầu GỐC — theo nghiệp vụ, tồn đầu chỉ khai MỘT LẦN khi bắt đầu
         * dùng phần mềm (kể cả bổ sung sau này đều về đúng kỳ gốc), không phải theo tháng.
         * Trả về kỳ sớm nhất đã có khai báo; nếu DB chưa có khai báo nào thì trả về tháng hiện tại.
         */
        public (int Month, int Year, bool Exists) GetOpeningPeriod()
        {
            var dt = DatabaseHelper.ExecuteQuery(
                "SELECT TOP 1 Year, Month FROM StockOpeningAdj ORDER BY Year ASC, Month ASC");
            if (dt.Rows.Count > 0)
            {
                return (Convert.ToInt32(dt.Rows[0]["Month"]),
                        Convert.ToInt32(dt.Rows[0]["Year"]),
                        true);
            }
            return (DateTime.Now.Month, DateTime.Now.Year, false);
        }

        /**
         * Cảnh báo đếm đôi khi khai tồn đầu kỳ:
         * (a) sản phẩm được tạo SAU ngày bắt đầu dùng phần mềm — chỉ hợp lệ nếu hàng
         *     thực tế đã tồn tại từ trước (nhập danh mục muộn); nếu hàng chỉ đến qua
         *     hóa đơn nhập sau này thì KHÔNG được khai (đếm đôi);
         * (b) sản phẩm đã có hóa đơn nhập — số nhập đã nằm trong tồn, khai thêm tồn đầu
         *     sẽ nhân đôi (đúng lỗi từng xảy ra ngày 31/08).
         */
        public List<string> GetDoubleCountWarnings(int month, int year, List<StockOpeningAdj> changed)
        {
            var warnings = new List<string>();
            if (changed == null || changed.Count == 0) return warnings;

            var periodStart = new DateTime(year, month, 1);
            var lastDay = DateTime.DaysInMonth(year, month);
            var startStr = $"{year}-{month:D2}-01";
            var endStr = $"{year}-{month:D2}-{lastDay:D2}";

            // 1 query cho toàn bộ sản phẩm: ngày tạo + tổng nhập trong kỳ
            var dt = DatabaseHelper.ExecuteQuery(@"
                SELECT p.Name, p.CreatedAt,
                       ISNULL((SELECT SUM(d.Amount) FROM InvoiceDetails d INNER JOIN Invoices i ON d.InvoiceId = i.Id
                                WHERE i.Type = 'in' AND i.InvDate >= @Start AND i.InvDate <= @End
                                  AND d.ProductName = p.Name), 0) AS NhapTrongKy
                FROM Products p WHERE p.IsActive = 1",
                new SqlParameter("@Start", startStr),
                new SqlParameter("@End", endStr));

            var info = new Dictionary<string, (DateTime created, decimal imported)>(StringComparer.OrdinalIgnoreCase);
            foreach (DataRow r in dt.Rows)
            {
                var name = r["Name"]?.ToString() ?? "";
                if (name != "" && !info.ContainsKey(name))
                {
                    info[name] = (Convert.ToDateTime(r["CreatedAt"]), Convert.ToDecimal(r["NhapTrongKy"]));
                }
            }

            foreach (var s in changed)
            {
                if (s.AdjQty <= 0) continue;
                if (!info.TryGetValue(s.ProductName, out var inf)) continue;

                if (inf.created.Date > periodStart)
                {
                    warnings.Add($"'{s.ProductName}': sản phẩm được thêm vào danh mục ngày {inf.created:dd/MM/yyyy} (sau ngày bắt đầu dùng phần mềm). Chỉ khai tồn đầu nếu hàng này thực tế đã tồn tại từ trước đó — nếu hàng chỉ đến qua hóa đơn nhập thì KHÔNG khai.");
                }

                if (inf.imported > 0)
                {
                    warnings.Add($"'{s.ProductName}': đã có nhập {inf.imported:0.##} trong kỳ — số nhập đã nằm trong tồn hiện tại, khai thêm {s.AdjQty:0.##} tồn đầu có thể bị ĐẾM ĐÔI.");
                }
            }

            return warnings;
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
                        // Đọc giá trị hiện tại TRƯỚC khi ghi để audit log ghi được cũ -> mới
                        var oldValues = new Dictionary<string, decimal>();
                        var existedRows = new HashSet<string>();
                        using (var cmdOld = new SqlCommand(
                            "SELECT AdjQty FROM StockOpeningAdj WHERE ProductName = @N AND Year = @Y AND Month = @M", conn, tx))
                        {
                            var pN = cmdOld.Parameters.Add("@N", SqlDbType.NVarChar, 255);
                            var pY = cmdOld.Parameters.Add("@Y", SqlDbType.Int);
                            var pM = cmdOld.Parameters.Add("@M", SqlDbType.Int);
                            foreach (var s in stocks)
                            {
                                pN.Value = s.ProductName;
                                pY.Value = year;
                                pM.Value = month;
                                var r = cmdOld.ExecuteScalar();
                                if (r != null && r != DBNull.Value)
                                {
                                    oldValues[s.ProductName] = Convert.ToDecimal(r);
                                    existedRows.Add(s.ProductName);
                                }
                                else
                                {
                                    oldValues[s.ProductName] = 0;
                                }
                            }
                        }

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

                            // Audit log từng dòng khai báo: cũ -> mới, ai thay đổi
                            bool existed = existedRows.Contains(s.ProductName);
                            if (!existed || oldValues[s.ProductName] != s.AdjQty)
                            {
                                AuditLogService.LogAction(
                                    existed ? "UPDATE" : "DECLARE",
                                    "StockOpeningAdj",
                                    s.ProductName,
                                    $"Khai tồn đầu kỳ '{s.ProductName}' tháng {month:D2}/{year}: {(existed ? oldValues[s.ProductName].ToString("0.##") : "(chưa có)")} -> {s.AdjQty:0.##}",
                                    tx);
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
