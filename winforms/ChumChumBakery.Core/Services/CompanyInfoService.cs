using System;
using System.Data;
using ChumChumBakery.Core.Data;
using ChumChumBakery.Core.Models;

namespace ChumChumBakery.Core.Services
{
    /// <summary>
    /// Đọc / lưu thông tin công ty in trên chứng từ (bảng CompanyInfo, 1 dòng Id=1).
    /// </summary>
    public class CompanyInfoService
    {
        public CompanyInfo Get()
        {
            try
            {
                var dt = DatabaseHelper.ExecuteQuery("SELECT TOP 1 * FROM CompanyInfo ORDER BY Id");
                if (dt.Rows.Count > 0) return MapRow(dt.Rows[0]);
            }
            catch { }
            // Chưa khai báo hoặc lỗi DB: trả về mặc định để bản in vẫn ra tên cửa hàng
            return new CompanyInfo();
        }

        public void Save(CompanyInfo info)
        {
            info.UpdatedBy = Session.CurrentUser?.Username ?? "";
            var sql = @"
                IF EXISTS (SELECT 1 FROM CompanyInfo WHERE Id = 1)
                    UPDATE CompanyInfo SET Name = @Name, Address = @Address, TaxCode = @TaxCode,
                        Phone = @Phone, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE()
                    WHERE Id = 1
                ELSE
                    INSERT INTO CompanyInfo (Id, Name, Address, TaxCode, Phone, UpdatedBy, UpdatedAt)
                    VALUES (1, @Name, @Address, @TaxCode, @Phone, @UpdatedBy, GETDATE())";

            DatabaseHelper.ExecuteNonQuery(sql,
                new System.Data.SqlClient.SqlParameter("@Name", info.Name ?? ""),
                new System.Data.SqlClient.SqlParameter("@Address", info.Address ?? ""),
                new System.Data.SqlClient.SqlParameter("@TaxCode", info.TaxCode ?? ""),
                new System.Data.SqlClient.SqlParameter("@Phone", info.Phone ?? ""),
                new System.Data.SqlClient.SqlParameter("@UpdatedBy", info.UpdatedBy ?? ""));
        }

        private static CompanyInfo MapRow(DataRow row)
        {
            return new CompanyInfo
            {
                Id = Convert.ToInt32(row["Id"]),
                Name = row["Name"]?.ToString() ?? "",
                Address = row["Address"] != DBNull.Value ? row["Address"]?.ToString() ?? "" : "",
                TaxCode = row["TaxCode"] != DBNull.Value ? row["TaxCode"]?.ToString() ?? "" : "",
                Phone = row["Phone"] != DBNull.Value ? row["Phone"]?.ToString() ?? "" : "",
                UpdatedBy = row["UpdatedBy"] != DBNull.Value ? row["UpdatedBy"]?.ToString() ?? "" : "",
                UpdatedAt = row["UpdatedAt"] != DBNull.Value ? Convert.ToDateTime(row["UpdatedAt"]) : (DateTime?)null
            };
        }
    }
}
