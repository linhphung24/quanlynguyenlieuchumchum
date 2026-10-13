using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using ChumChumBakery.Core.Data;
using ChumChumBakery.Core.Models;

namespace ChumChumBakery.Core.Services
{
    /// <summary>
    /// Phiếu thu / phiếu chi tiền mặt (bảng CashVouchers, Type = 'thu' / 'chi').
    /// Đánh số phiếu kiểu sổ quỹ: PT-0001 / PC-0001 tăng dần theo từng loại.
    /// </summary>
    public class CashVoucherService
    {
        public List<CashVoucher> GetVouchers(DateTime fromDate, DateTime toDate, string keyword = "", string type = "")
        {
            var result = new List<CashVoucher>();
            // Đã gõ từ khóa tìm kiếm thì tìm toàn bộ theo từ khóa, bỏ qua khoảng ngày —
            // tránh tìm phiếu cũ không thấy vì bộ lọc đang giới hạn tháng hiện tại
            bool hasKeyword = !string.IsNullOrEmpty(keyword);
            string sql = "SELECT * FROM CashVouchers WHERE 1=1";

            var parameters = new List<SqlParameter>();

            if (!hasKeyword)
            {
                sql += " AND VoucherDate >= @FromDate AND VoucherDate <= @ToDate";
                parameters.Add(new SqlParameter("@FromDate", fromDate.Date.ToString("yyyy-MM-dd")));
                parameters.Add(new SqlParameter("@ToDate", toDate.Date.ToString("yyyy-MM-dd")));
            }

            if (hasKeyword)
            {
                sql += @" AND (
                    Code LIKE @Keyword OR
                    Partner LIKE @Keyword OR
                    Reason LIKE @Keyword OR
                    Receiver LIKE @Keyword
                )";
                parameters.Add(new SqlParameter("@Keyword", "%" + keyword + "%"));
            }

            if (!string.IsNullOrEmpty(type))
            {
                sql += " AND Type = @Type";
                parameters.Add(new SqlParameter("@Type", type));
            }

            sql += " ORDER BY VoucherDate DESC, Id DESC";

            var dt = DatabaseHelper.ExecuteQuery(sql, parameters.ToArray());
            foreach (DataRow row in dt.Rows)
            {
                result.Add(MapRow(row));
            }
            return result;
        }

        public CashVoucher GetVoucherById(int id)
        {
            var dt = DatabaseHelper.ExecuteQuery("SELECT * FROM CashVouchers WHERE Id = @Id",
                new SqlParameter("@Id", id));
            if (dt.Rows.Count == 0)
                throw new Exception($"Không tìm thấy phiếu thu chi ID {id}.");
            return MapRow(dt.Rows[0]);
        }

        // Kiểm tra trùng số phiếu (trừ chính phiếu đang sửa)
        public bool CodeExists(string code, int excludeId = 0)
        {
            object scalar = DatabaseHelper.ExecuteScalar(
                "SELECT COUNT(*) FROM CashVouchers WHERE Code = @Code AND Id <> @ExcludeId",
                new SqlParameter("@Code", code),
                new SqlParameter("@ExcludeId", excludeId));
            return scalar != null && Convert.ToInt32(scalar) > 0;
        }

        // Số phiếu tiếp theo của từng loại (PT-0001 / PC-0001) — form gọi để điền sẵn
        public string NextCode(string type)
        {
            string prefix = type == "thu" ? "PT-" : "PC-";
            object scalar = DatabaseHelper.ExecuteScalar(
                "SELECT MAX(Code) FROM CashVouchers WHERE Type = @Type AND Code LIKE @Prefix + '%'",
                new SqlParameter("@Type", type),
                new SqlParameter("@Prefix", prefix));
            return prefix + (GetNextSequence(scalar?.ToString()) ).ToString("0000");
        }

        // Lưu phiếu kiểu đơn giản (không bảng dòng) — 1 dòng hạch toán lấy từ lý do + số tiền
        public int SaveVoucher(CashVoucher voucher)
        {
            return SaveVoucher(voucher, new List<CashVoucherDetail>
            {
                new CashVoucherDetail { Description = voucher.Reason, Amount = voucher.Amount }
            });
        }

        public int SaveVoucher(CashVoucher voucher, List<CashVoucherDetail> details)
        {
            voucher.VoucherDate = voucher.VoucherDate.Date;
            voucher.CreatedBy = Session.CurrentUser?.Username ?? "";
            NormalizeDetails(voucher, details);

            using (var conn = new SqlConnection(DatabaseHelper.ConnectionString))
            {
                conn.Open();
                using (var tx = conn.BeginTransaction())
                {
                    try
                    {
                        // Sinh số phiếu tự động nếu người dùng bỏ trống
                        if (string.IsNullOrWhiteSpace(voucher.Code))
                        {
                            voucher.Code = NextCodeInsideTx(conn, tx, voucher.Type);
                        }

                        string sql = @"
                            INSERT INTO CashVouchers (Type, VoucherDate, Code, Partner, PartnerAddress, Receiver, Reason, Amount, PaymentMethod, AttachedDocs, Note, CreatedBy, CreatedAt)
                            OUTPUT INSERTED.Id
                            VALUES (@Type, @VoucherDate, @Code, @Partner, @PartnerAddress, @Receiver, @Reason, @Amount, @PaymentMethod, @AttachedDocs, @Note, @CreatedBy, GETDATE())";

                        int newId;
                        using (var cmd = new SqlCommand(sql, conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Type", voucher.Type);
                            cmd.Parameters.AddWithValue("@VoucherDate", voucher.VoucherDate);
                            cmd.Parameters.AddWithValue("@Code", voucher.Code);
                            cmd.Parameters.AddWithValue("@Partner", (object?)voucher.Partner ?? "");
                            cmd.Parameters.AddWithValue("@PartnerAddress", (object?)voucher.PartnerAddress ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Receiver", (object?)voucher.Receiver ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Reason", voucher.Reason ?? "");
                            cmd.Parameters.AddWithValue("@Amount", voucher.Amount);
                            cmd.Parameters.AddWithValue("@PaymentMethod", (object?)voucher.PaymentMethod ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@AttachedDocs", (object?)voucher.AttachedDocs ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Note", (object?)voucher.Note ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@CreatedBy", voucher.CreatedBy);
                            newId = Convert.ToInt32(cmd.ExecuteScalar());
                        }

                        InsertDetails(conn, tx, newId, details);

                        AuditLogService.LogAction("CREATE", "CashVoucher", newId.ToString(),
                            $"Tạo {(voucher.Type == "thu" ? "phiếu thu" : "phiếu chi")} {voucher.Code}: {voucher.Amount:N0} đồng — {voucher.Partner} — {voucher.Reason}", tx);

                        tx.Commit();
                        return newId;
                    }
                    catch
                    {
                        tx.Rollback();
                        throw;
                    }
                }
            }
        }

        public void UpdateVoucher(CashVoucher voucher)
        {
            UpdateVoucher(voucher, new List<CashVoucherDetail>
            {
                new CashVoucherDetail { Description = voucher.Reason, Amount = voucher.Amount }
            });
        }

        public void UpdateVoucher(CashVoucher voucher, List<CashVoucherDetail> details)
        {
            voucher.VoucherDate = voucher.VoucherDate.Date;
            voucher.UpdatedBy = Session.CurrentUser?.Username ?? "";
            NormalizeDetails(voucher, details);

            using (var conn = new SqlConnection(DatabaseHelper.ConnectionString))
            {
                conn.Open();
                using (var tx = conn.BeginTransaction())
                {
                    try
                    {
                        string sql = @"
                            UPDATE CashVouchers SET
                                Type = @Type, VoucherDate = @VoucherDate, Code = @Code, Partner = @Partner,
                                PartnerAddress = @PartnerAddress, Receiver = @Receiver, Reason = @Reason,
                                Amount = @Amount, PaymentMethod = @PaymentMethod, AttachedDocs = @AttachedDocs,
                                Note = @Note, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE()
                            WHERE Id = @Id";

                        using (var cmd = new SqlCommand(sql, conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Id", voucher.Id);
                            cmd.Parameters.AddWithValue("@Type", voucher.Type);
                            cmd.Parameters.AddWithValue("@VoucherDate", voucher.VoucherDate);
                            cmd.Parameters.AddWithValue("@Code", voucher.Code);
                            cmd.Parameters.AddWithValue("@Partner", (object?)voucher.Partner ?? "");
                            cmd.Parameters.AddWithValue("@PartnerAddress", (object?)voucher.PartnerAddress ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Receiver", (object?)voucher.Receiver ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Reason", voucher.Reason ?? "");
                            cmd.Parameters.AddWithValue("@Amount", voucher.Amount);
                            cmd.Parameters.AddWithValue("@PaymentMethod", (object?)voucher.PaymentMethod ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@AttachedDocs", (object?)voucher.AttachedDocs ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Note", (object?)voucher.Note ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@UpdatedBy", voucher.UpdatedBy);
                            cmd.ExecuteNonQuery();
                        }

                        // Thay toàn bộ dòng hạch toán: xóa hết rồi chèn lại (pattern UpdateInvoice)
                        using (var cmd = new SqlCommand("DELETE FROM CashVoucherDetails WHERE VoucherId = @Id", conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Id", voucher.Id);
                            cmd.ExecuteNonQuery();
                        }
                        InsertDetails(conn, tx, voucher.Id, details);

                        AuditLogService.LogAction("UPDATE", "CashVoucher", voucher.Id.ToString(),
                            $"Sửa {(voucher.Type == "thu" ? "phiếu thu" : "phiếu chi")} {voucher.Code}: {voucher.Amount:N0} đồng — {voucher.Partner}", tx);

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

        public void DeleteVoucher(int id)
        {
            using (var conn = new SqlConnection(DatabaseHelper.ConnectionString))
            {
                conn.Open();
                using (var tx = conn.BeginTransaction())
                {
                    try
                    {
                        string code = "", type = "";
                        using (var cmd = new SqlCommand("SELECT Code, Type FROM CashVouchers WHERE Id = @Id", conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Id", id);
                            using (var reader = cmd.ExecuteReader())
                            {
                                if (reader.Read())
                                {
                                    code = reader["Code"]?.ToString() ?? "";
                                    type = reader["Type"]?.ToString() ?? "";
                                }
                            }
                        }

                        using (var cmd = new SqlCommand("DELETE FROM CashVoucherDetails WHERE VoucherId = @Id", conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Id", id);
                            cmd.ExecuteNonQuery();
                        }

                        using (var cmd = new SqlCommand("DELETE FROM CashVouchers WHERE Id = @Id", conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@Id", id);
                            cmd.ExecuteNonQuery();
                        }

                        AuditLogService.LogAction("DELETE", "CashVoucher", id.ToString(),
                            $"Xóa {(type == "thu" ? "phiếu thu" : "phiếu chi")} {code} (ID: {id})", tx);

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

        public List<CashVoucherDetail> GetVoucherDetails(int voucherId)
        {
            var result = new List<CashVoucherDetail>();
            var dt = DatabaseHelper.ExecuteQuery(
                "SELECT * FROM CashVoucherDetails WHERE VoucherId = @VoucherId ORDER BY Id",
                new SqlParameter("@VoucherId", voucherId));
            foreach (DataRow row in dt.Rows)
            {
                result.Add(new CashVoucherDetail
                {
                    Id = Convert.ToInt32(row["Id"]),
                    VoucherId = Convert.ToInt32(row["VoucherId"]),
                    Description = row["Description"]?.ToString() ?? "",
                    DebitAccount = row["DebitAccount"] != DBNull.Value ? row["DebitAccount"]?.ToString() ?? "" : "",
                    CreditAccount = row["CreditAccount"] != DBNull.Value ? row["CreditAccount"]?.ToString() ?? "" : "",
                    Amount = Convert.ToDecimal(row["Amount"])
                });
            }
            return result;
        }

        // Số tiền của phiếu luôn bằng tổng các dòng hạch toán
        private static void NormalizeDetails(CashVoucher voucher, List<CashVoucherDetail> details)
        {
            if (details == null || details.Count == 0)
            {
                details = new List<CashVoucherDetail>
                {
                    new CashVoucherDetail { Description = voucher.Reason, Amount = voucher.Amount }
                };
            }
            voucher.Amount = 0;
            foreach (var d in details)
            {
                voucher.Amount += d.Amount;
            }
        }

        private static void InsertDetails(SqlConnection conn, SqlTransaction tx, int voucherId, List<CashVoucherDetail> details)
        {
            const string sql = @"
                INSERT INTO CashVoucherDetails (VoucherId, Description, DebitAccount, CreditAccount, Amount)
                VALUES (@VoucherId, @Description, @DebitAccount, @CreditAccount, @Amount)";

            foreach (var d in details)
            {
                using (var cmd = new SqlCommand(sql, conn, tx))
                {
                    cmd.Parameters.AddWithValue("@VoucherId", voucherId);
                    cmd.Parameters.AddWithValue("@Description", (object?)d.Description ?? "");
                    cmd.Parameters.AddWithValue("@DebitAccount", (object?)d.DebitAccount ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@CreditAccount", (object?)d.CreditAccount ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@Amount", d.Amount);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        // Lấy mã lớn nhất của loại phiếu rồi +1 (đệm 4 số, vd PT-0042 → PT-0043)
        private static string NextCodeInsideTx(SqlConnection conn, SqlTransaction tx, string type)
        {
            string prefix = type == "thu" ? "PT-" : "PC-";
            object scalar;
            using (var cmd = new SqlCommand(
                "SELECT MAX(Code) FROM CashVouchers WHERE Type = @Type AND Code LIKE @Prefix + '%'", conn, tx))
            {
                cmd.Parameters.AddWithValue("@Type", type);
                cmd.Parameters.AddWithValue("@Prefix", prefix);
                scalar = cmd.ExecuteScalar();
            }
            return prefix + GetNextSequence(scalar?.ToString()).ToString("0000");
        }

        // Tách phần số khỏi "PT-0042" → 43 (mã lỗi định dạng thì coi như 0, bắt đầu lại 0001)
        private static int GetNextSequence(string? maxCode)
        {
            if (string.IsNullOrEmpty(maxCode)) return 1;
            int dashIndex = maxCode.LastIndexOf('-');
            if (dashIndex < 0 || !int.TryParse(maxCode.Substring(dashIndex + 1), out int seq)) return 1;
            return seq + 1;
        }

        private static CashVoucher MapRow(DataRow row)
        {
            return new CashVoucher
            {
                Id = Convert.ToInt32(row["Id"]),
                Type = row["Type"]?.ToString() ?? "chi",
                VoucherDate = Convert.ToDateTime(row["VoucherDate"]),
                Code = row["Code"]?.ToString() ?? "",
                Partner = row["Partner"]?.ToString() ?? "",
                PartnerAddress = row["PartnerAddress"] != DBNull.Value ? row["PartnerAddress"]?.ToString() ?? "" : "",
                Receiver = row["Receiver"] != DBNull.Value ? row["Receiver"]?.ToString() ?? "" : "",
                Reason = row["Reason"]?.ToString() ?? "",
                Amount = Convert.ToDecimal(row["Amount"]),
                PaymentMethod = row["PaymentMethod"] != DBNull.Value ? row["PaymentMethod"]?.ToString() ?? "" : "",
                AttachedDocs = row["AttachedDocs"] != DBNull.Value ? row["AttachedDocs"]?.ToString() ?? "" : "",
                Note = row["Note"] != DBNull.Value ? row["Note"]?.ToString() ?? "" : "",
                CreatedBy = row["CreatedBy"] != DBNull.Value ? row["CreatedBy"]?.ToString() ?? "" : "",
                UpdatedBy = row["UpdatedBy"] != DBNull.Value ? row["UpdatedBy"]?.ToString() ?? "" : "",
                CreatedAt = row["CreatedAt"] != DBNull.Value ? Convert.ToDateTime(row["CreatedAt"]) : DateTime.Now,
                UpdatedAt = row["UpdatedAt"] != DBNull.Value ? Convert.ToDateTime(row["UpdatedAt"]) : (DateTime?)null
            };
        }
    }
}
