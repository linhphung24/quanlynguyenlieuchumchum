using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using ChumChumBakery.Core.Data;

namespace ChumChumBakery.Core.Services
{
    public class PermissionService
    {
        public PermissionService()
        {
            InitializeDatabase();
        }

        private void InitializeDatabase()
        {
            // Tự động tạo bảng RolePermissions nếu chưa tồn tại
            string sqlCheck = "IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RolePermissions' AND xtype='U') BEGIN " +
                              "CREATE TABLE RolePermissions (" +
                              "RoleName VARCHAR(50) NOT NULL, " +
                              "PermissionKey VARCHAR(100) NOT NULL, " +
                              "PRIMARY KEY (RoleName, PermissionKey)" +
                              ") END";
            DatabaseHelper.ExecuteNonQuery(sqlCheck);
            
            // Seed dữ liệu nếu bảng rỗng
            var dt = DatabaseHelper.ExecuteQuery("SELECT TOP 1 * FROM RolePermissions");
            if (dt.Rows.Count == 0)
            {
                SeedDefaultPermissions();
            }
        }

        private void SeedDefaultPermissions()
        {
            var defaultPerms = new Dictionary<string, List<string>>
            {
                { "admin", new List<string> { "Menu_Invoices", "Menu_StockOpening", "Menu_Batches", "Menu_SummaryReport", "Menu_Recipes", "Menu_Products", "Menu_Suppliers", "Menu_Users", "Menu_RolePermissions" } },
                { "manager", new List<string> { "Menu_Invoices", "Menu_StockOpening", "Menu_Batches", "Menu_SummaryReport", "Menu_Recipes", "Menu_Products", "Menu_Suppliers" } },
                { "ketoan", new List<string> { "Menu_Invoices", "Menu_StockOpening", "Menu_Batches", "Menu_SummaryReport", "Menu_Suppliers" } },
                { "thukho", new List<string> { "Menu_Invoices", "Menu_Batches", "Menu_SummaryReport" } },
                { "staff", new List<string> { "Menu_Invoices", "Menu_Batches", "Menu_SummaryReport" } }
            };

            foreach (var kvp in defaultPerms)
            {
                SavePermissions(kvp.Key, kvp.Value);
            }
        }

        public List<string> GetPermissions(string role)
        {
            var perms = new List<string>();
            if (string.IsNullOrEmpty(role)) return perms;

            var dt = DatabaseHelper.ExecuteQuery("SELECT PermissionKey FROM RolePermissions WHERE RoleName = @Role", new SqlParameter("@Role", role));
            foreach (DataRow row in dt.Rows)
            {
                perms.Add(row["PermissionKey"].ToString() ?? "");
            }
            return perms;
        }

        public void SavePermissions(string role, List<string> permissionKeys)
        {
            using (var conn = new SqlConnection(DatabaseHelper.ConnectionString))
            {
                conn.Open();
                using (var tx = conn.BeginTransaction())
                {
                    try
                    {
                        using (var cmdDel = new SqlCommand("DELETE FROM RolePermissions WHERE RoleName = @Role", conn, tx))
                        {
                            cmdDel.Parameters.AddWithValue("@Role", role);
                            cmdDel.ExecuteNonQuery();
                        }

                        string sqlIns = "INSERT INTO RolePermissions (RoleName, PermissionKey) VALUES (@Role, @Key)";
                        foreach (var k in permissionKeys)
                        {
                            using (var cmdIns = new SqlCommand(sqlIns, conn, tx))
                            {
                                cmdIns.Parameters.AddWithValue("@Role", role);
                                cmdIns.Parameters.AddWithValue("@Key", k);
                                cmdIns.ExecuteNonQuery();
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
        
        public static List<string> AllAvailablePermissions => new List<string>
        {
            "Menu_Invoices", 
            "Menu_StockOpening", 
            "Menu_Batches", 
            "Menu_SummaryReport", 
            "Menu_Recipes", 
            "Menu_Products", 
            "Menu_Suppliers", 
            "Menu_Users",
            "Menu_RolePermissions"
        };

        public static string GetPermissionName(string key)
        {
            return key switch
            {
                "Menu_Invoices" => "Hóa đơn Nhập / Xuất",
                "Menu_StockOpening" => "Tồn đầu kỳ / Kiểm kê",
                "Menu_Batches" => "Lô hàng & HSD (FIFO)",
                "Menu_SummaryReport" => "Báo cáo Tổng hợp tồn kho",
                "Menu_Recipes" => "Tính định mức (Công thức)",
                "Menu_Products" => "Danh mục Sản phẩm",
                "Menu_Suppliers" => "Danh sách Nhà Cung Cấp",
                "Menu_Users" => "Quản lý Tài khoản",
                "Menu_RolePermissions" => "Ma trận Phân quyền",
                _ => key
            };
        }
    }
}
