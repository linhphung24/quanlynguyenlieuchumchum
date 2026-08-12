using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using ChumChumBakery.Core.Data;
using ChumChumBakery.Core.Models;

namespace ChumChumBakery.Core.Services
{
    public class PermissionService
    {
        public static List<string> AllAvailablePermissions => new List<string>
        {
            "Menu_Products",
            "Menu_Invoices_Import",
            "Menu_Invoices_Export",
            "Menu_StockOpening",
            "Menu_Batches",
            "Menu_SummaryReport",
            "Menu_Recipes",
            "Menu_Suppliers",
            "Menu_Users",
            "Menu_RolePermissions"
        };

        public static string GetPermissionName(string key) => key switch
        {
            "Menu_Products" => "📦 Danh mục Sản phẩm / Kho",
            "Menu_Invoices_Import" => "📥 Hóa đơn Nhập kho",
            "Menu_Invoices_Export" => "📤 Hóa đơn Xuất kho",
            "Menu_StockOpening" => "📝 Tồn đầu kỳ / Kiểm kê",
            "Menu_Batches" => "🏷️ Quản lý Lô hàng FIFO",
            "Menu_SummaryReport" => "📊 Báo cáo Tổng hợp tồn kho",
            "Menu_Recipes" => "🥖 Công thức Bánh & Định mức",
            "Menu_Suppliers" => "🏢 Danh sách Nhà cung cấp",
            "Menu_Users" => "🔐 Quản lý Tài khoản & Người dùng",
            "Menu_RolePermissions" => "🔑 Ma trận Phân quyền Hệ thống",
            _ => key
        };

        public void EnsureTableExists()
        {
            try
            {
                // Fix schema mismatch if previous agent created the old table
                var sqlCheckCol = "SELECT COL_LENGTH('RolePermissions', 'CanView')";
                var colObj = DatabaseHelper.ExecuteScalar(sqlCheckCol);
                if (colObj == null || colObj == DBNull.Value)
                {
                    DatabaseHelper.ExecuteNonQuery("IF EXISTS (SELECT * FROM sys.tables WHERE name = 'RolePermissions') DROP TABLE RolePermissions");
                }

                var sqlCreate = @"
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RolePermissions')
BEGIN
    CREATE TABLE RolePermissions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Role NVARCHAR(20) NOT NULL,
        FeatureKey NVARCHAR(50) NOT NULL,
        FeatureName NVARCHAR(100) NOT NULL,
        CanView BIT NOT NULL DEFAULT 1,
        CanCreate BIT NOT NULL DEFAULT 0,
        CanEdit BIT NOT NULL DEFAULT 0,
        CanDelete BIT NOT NULL DEFAULT 0,
        CONSTRAINT UQ_RoleFeature UNIQUE (Role, FeatureKey)
    );
END";
                DatabaseHelper.ExecuteNonQuery(sqlCreate);

                var countObj = DatabaseHelper.ExecuteScalar("SELECT COUNT(*) FROM RolePermissions");
                int count = countObj != null && countObj != DBNull.Value ? Convert.ToInt32(countObj) : 0;

                if (count == 0)
                {
                    SeedDefaultPermissions();
                }
                else
                {
                    var ketoanCount = DatabaseHelper.ExecuteScalar("SELECT COUNT(*) FROM RolePermissions WHERE Role = 'ketoan' AND FeatureKey = 'Menu_Invoices_Import'");
                    if (ketoanCount != null && Convert.ToInt32(ketoanCount) == 0)
                    {
                        DatabaseHelper.ExecuteNonQuery("DELETE FROM RolePermissions");
                        var sqlMigrate = @"
                        INSERT INTO RolePermissions (Role, FeatureKey, FeatureName, CanView, CanCreate, CanEdit, CanDelete) VALUES
                        (N'ketoan', N'Menu_Products', N'📦 Danh mục Sản phẩm / Kho', 1, 1, 1, 0),
                        (N'ketoan', N'Menu_Invoices_Import', N'📥 Hóa đơn Nhập kho', 1, 1, 1, 1),
                        (N'ketoan', N'Menu_Invoices_Export', N'📤 Hóa đơn Xuất kho', 1, 1, 1, 1),
                        (N'ketoan', N'Menu_StockOpening', N'📝 Tồn đầu kỳ / Kiểm kê', 1, 1, 1, 1),
                        (N'ketoan', N'Menu_Batches', N'🏷️ Quản lý Lô hàng FIFO', 1, 1, 1, 1),
                        (N'ketoan', N'Menu_SummaryReport', N'📊 Báo cáo Tổng hợp tồn kho', 1, 1, 1, 0),
                        (N'ketoan', N'Menu_Recipes', N'🥖 Công thức Bánh & Định mức', 1, 0, 0, 0),
                        (N'ketoan', N'Menu_Suppliers', N'🏢 Danh sách Nhà cung cấp', 1, 0, 0, 0),
                        (N'ketoan', N'Menu_Users', N'🔐 Quản lý Tài khoản', 0, 0, 0, 0),
                        (N'ketoan', N'Menu_RolePermissions', N'🔑 Ma trận Phân quyền', 0, 0, 0, 0),

                        (N'thukho', N'Menu_Products', N'📦 Danh mục Sản phẩm / Kho', 1, 0, 0, 0),
                        (N'thukho', N'Menu_Invoices_Import', N'📥 Hóa đơn Nhập kho', 1, 1, 0, 0),
                        (N'thukho', N'Menu_Invoices_Export', N'📤 Hóa đơn Xuất kho', 1, 1, 0, 0),
                        (N'thukho', N'Menu_StockOpening', N'📝 Tồn đầu kỳ / Kiểm kê', 1, 0, 0, 0),
                        (N'thukho', N'Menu_Batches', N'🏷️ Quản lý Lô hàng FIFO', 1, 0, 0, 0),
                        (N'thukho', N'Menu_SummaryReport', N'📊 Báo cáo Tổng hợp tồn kho', 1, 0, 0, 0),
                        (N'thukho', N'Menu_Recipes', N'🥖 Công thức Bánh & Định mức', 0, 0, 0, 0),
                        (N'thukho', N'Menu_Suppliers', N'🏢 Danh sách Nhà cung cấp', 0, 0, 0, 0),
                        (N'thukho', N'Menu_Users', N'🔐 Quản lý Tài khoản', 0, 0, 0, 0),
                        (N'thukho', N'Menu_RolePermissions', N'🔑 Ma trận Phân quyền', 0, 0, 0, 0);";
                        DatabaseHelper.ExecuteNonQuery(sqlMigrate);
                    }
                }
            }
            catch { }
        }

        public void SeedDefaultPermissions()
        {
            var sqlSeed = @"
-- Admin
INSERT INTO RolePermissions (Role, FeatureKey, FeatureName, CanView, CanCreate, CanEdit, CanDelete) VALUES
(N'admin', N'Menu_Products', N'📦 Danh mục Sản phẩm / Kho', 1, 1, 1, 1),
(N'admin', N'Menu_Invoices_Import', N'📥 Hóa đơn Nhập kho', 1, 1, 1, 1),
(N'admin', N'Menu_Invoices_Export', N'📤 Hóa đơn Xuất kho', 1, 1, 1, 1),
(N'admin', N'Menu_StockOpening', N'📝 Tồn đầu kỳ / Kiểm kê', 1, 1, 1, 1),
(N'admin', N'Menu_Batches', N'🏷️ Quản lý Lô hàng FIFO', 1, 1, 1, 1),
(N'admin', N'Menu_SummaryReport', N'📊 Báo cáo Tổng hợp tồn kho', 1, 1, 1, 1),
(N'admin', N'Menu_Recipes', N'🥖 Công thức Bánh & Định mức', 1, 1, 1, 1),
(N'admin', N'Menu_Suppliers', N'🏢 Danh sách Nhà cung cấp', 1, 1, 1, 1),
(N'admin', N'Menu_Users', N'🔐 Quản lý Tài khoản', 1, 1, 1, 1),
(N'admin', N'Menu_RolePermissions', N'🔑 Ma trận Phân quyền', 1, 1, 1, 1),

-- Manager
(N'manager', N'Menu_Products', N'📦 Danh mục Sản phẩm / Kho', 1, 1, 1, 1),
(N'manager', N'Menu_Invoices_Import', N'📥 Hóa đơn Nhập kho', 1, 1, 1, 1),
(N'manager', N'Menu_Invoices_Export', N'📤 Hóa đơn Xuất kho', 1, 1, 1, 1),
(N'manager', N'Menu_StockOpening', N'📝 Tồn đầu kỳ / Kiểm kê', 1, 1, 1, 1),
(N'manager', N'Menu_Batches', N'🏷️ Quản lý Lô hàng FIFO', 1, 1, 1, 1),
(N'manager', N'Menu_SummaryReport', N'📊 Báo cáo Tổng hợp tồn kho', 1, 1, 1, 1),
(N'manager', N'Menu_Recipes', N'🥖 Công thức Bánh & Định mức', 1, 1, 1, 1),
(N'manager', N'Menu_Suppliers', N'🏢 Danh sách Nhà cung cấp', 1, 1, 1, 1),
(N'manager', N'Menu_Users', N'🔐 Quản lý Tài khoản', 1, 0, 0, 0),
(N'manager', N'Menu_RolePermissions', N'🔑 Ma trận Phân quyền', 1, 0, 0, 0),

-- Kế toán (ketoan) - Có toàn quyền Nhập & Xuất
(N'ketoan', N'Menu_Products', N'📦 Danh mục Sản phẩm / Kho', 1, 1, 1, 0),
(N'ketoan', N'Menu_Invoices_Import', N'📥 Hóa đơn Nhập kho', 1, 1, 1, 1),
(N'ketoan', N'Menu_Invoices_Export', N'📤 Hóa đơn Xuất kho', 1, 1, 1, 1),
(N'ketoan', N'Menu_StockOpening', N'📝 Tồn đầu kỳ / Kiểm kê', 1, 1, 1, 1),
(N'ketoan', N'Menu_Batches', N'🏷️ Quản lý Lô hàng FIFO', 1, 1, 1, 1),
(N'ketoan', N'Menu_SummaryReport', N'📊 Báo cáo Tổng hợp tồn kho', 1, 1, 1, 0),
(N'ketoan', N'Menu_Recipes', N'🥖 Công thức Bánh & Định mức', 1, 0, 0, 0),
(N'ketoan', N'Menu_Suppliers', N'🏢 Danh sách Nhà cung cấp', 1, 0, 0, 0),
(N'ketoan', N'Menu_Users', N'🔐 Quản lý Tài khoản', 0, 0, 0, 0),
(N'ketoan', N'Menu_RolePermissions', N'🔑 Ma trận Phân quyền', 0, 0, 0, 0),

-- Thủ kho (thukho) - Chỉ xem và nhập xuất kho
(N'thukho', N'Menu_Products', N'📦 Danh mục Sản phẩm / Kho', 1, 0, 0, 0),
(N'thukho', N'Menu_Invoices_Import', N'📥 Hóa đơn Nhập kho', 1, 1, 0, 0),
(N'thukho', N'Menu_Invoices_Export', N'📤 Hóa đơn Xuất kho', 1, 1, 0, 0),
(N'thukho', N'Menu_StockOpening', N'📝 Tồn đầu kỳ / Kiểm kê', 1, 0, 0, 0),
(N'thukho', N'Menu_Batches', N'🏷️ Quản lý Lô hàng FIFO', 1, 0, 0, 0),
(N'thukho', N'Menu_SummaryReport', N'📊 Báo cáo Tổng hợp tồn kho', 1, 0, 0, 0),
(N'thukho', N'Menu_Recipes', N'🥖 Công thức Bánh & Định mức', 0, 0, 0, 0),
(N'thukho', N'Menu_Suppliers', N'🏢 Danh sách Nhà cung cấp', 0, 0, 0, 0),
(N'thukho', N'Menu_Users', N'🔐 Quản lý Tài khoản', 0, 0, 0, 0),
(N'thukho', N'Menu_RolePermissions', N'🔑 Ma trận Phân quyền', 0, 0, 0, 0),

-- Staff
(N'staff', N'Menu_Products', N'📦 Danh mục Sản phẩm / Kho', 1, 0, 0, 0),
(N'staff', N'Menu_Invoices_Import', N'📥 Hóa đơn Nhập kho', 1, 1, 0, 0),
(N'staff', N'Menu_Invoices_Export', N'📤 Hóa đơn Xuất kho', 1, 1, 0, 0),
(N'staff', N'Menu_StockOpening', N'📝 Tồn đầu kỳ / Kiểm kê', 1, 0, 0, 0),
(N'staff', N'Menu_Batches', N'🏷️ Quản lý Lô hàng FIFO', 1, 0, 0, 0),
(N'staff', N'Menu_SummaryReport', N'📊 Báo cáo Tổng hợp tồn kho', 1, 0, 0, 0),
(N'staff', N'Menu_Recipes', N'🥖 Công thức Bánh & Định mức', 1, 0, 0, 0),
(N'staff', N'Menu_Suppliers', N'🏢 Danh sách Nhà cung cấp', 0, 0, 0, 0),
(N'staff', N'Menu_Users', N'🔐 Quản lý Tài khoản', 0, 0, 0, 0),
(N'staff', N'Menu_RolePermissions', N'🔑 Ma trận Phân quyền', 0, 0, 0, 0);";
            try { DatabaseHelper.ExecuteNonQuery(sqlSeed); } catch { }
        }

        public List<string> GetPermissions(string role)
        {
            EnsureTableExists();

            if (string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase))
                return AllAvailablePermissions;

            var list = new List<string>();
            try
            {
                var dt = DatabaseHelper.ExecuteQuery(
                    "SELECT FeatureKey FROM RolePermissions WHERE Role = @Role AND CanView = 1",
                    new SqlParameter("@Role", role));

                foreach (DataRow r in dt.Rows)
                {
                    var fk = r["FeatureKey"].ToString() ?? "";
                    if (!string.IsNullOrEmpty(fk)) list.Add(fk);
                }
            }
            catch { }

            if (list.Count == 0)
            {
                return AllAvailablePermissions;
            }

            return list;
        }

        public List<RolePermission> GetFullPermissionsMatrix(string? roleFilter = null)
        {
            EnsureTableExists();

            var list = new List<RolePermission>();
            try
            {
                var sql = "SELECT Id, Role, FeatureKey, FeatureName, CanView, CanCreate, CanEdit, CanDelete FROM RolePermissions";
                SqlParameter[]? p = null;

                if (!string.IsNullOrEmpty(roleFilter))
                {
                    sql += " WHERE Role = @Role";
                    p = new[] { new SqlParameter("@Role", roleFilter) };
                }
                sql += " ORDER BY Role, Id";

                var dt = DatabaseHelper.ExecuteQuery(sql, p);
                foreach (DataRow r in dt.Rows)
                {
                    list.Add(new RolePermission
                    {
                        Id = Convert.ToInt32(r["Id"]),
                        Role = r["Role"].ToString() ?? "",
                        FeatureKey = r["FeatureKey"].ToString() ?? "",
                        FeatureName = r["FeatureName"].ToString() ?? "",
                        CanView = Convert.ToBoolean(r["CanView"]),
                        CanCreate = Convert.ToBoolean(r["CanCreate"]),
                        CanEdit = Convert.ToBoolean(r["CanEdit"]),
                        CanDelete = Convert.ToBoolean(r["CanDelete"])
                    });
                }
            }
            catch { }

            if (list.Count == 0)
            {
                var roles = new[] { "admin", "manager", "ketoan", "thukho", "staff" };
                int autoId = 1;
                foreach (var r in roles)
                {
                    if (!string.IsNullOrEmpty(roleFilter) && !r.Equals(roleFilter, StringComparison.OrdinalIgnoreCase))
                        continue;

                    foreach (var key in AllAvailablePermissions)
                    {
                        bool isView = true;
                        bool isCreate = (r == "admin" || r == "manager" || (r == "ketoan" && (key.Contains("Invoice") || key.Contains("Product"))) || ((r == "staff" || r == "thukho") && key.Contains("Invoice")));
                        bool isEdit = (r == "admin" || r == "manager" || (r == "ketoan" && (key.Contains("Invoice") || key.Contains("Product"))));
                        bool isDelete = (r == "admin" || r == "manager" || (r == "ketoan" && key.Contains("Invoice")));

                        list.Add(new RolePermission
                        {
                            Id = autoId++,
                            Role = r,
                            FeatureKey = key,
                            FeatureName = GetPermissionName(key),
                            CanView = isView,
                            CanCreate = isCreate,
                            CanEdit = isEdit,
                            CanDelete = isDelete
                        });
                    }
                }
            }

            return list;
        }

        public bool HasPermission(string role, string featureKey, string action = "view")
        {
            EnsureTableExists();

            if (string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase))
                return true;

            try
            {
                var sql = "SELECT CanView, CanCreate, CanEdit, CanDelete FROM RolePermissions WHERE Role = @Role AND FeatureKey = @FeatureKey";
                var dt = DatabaseHelper.ExecuteQuery(sql,
                    new SqlParameter("@Role", role),
                    new SqlParameter("@FeatureKey", featureKey));

                if (dt.Rows.Count > 0)
                {
                    var row = dt.Rows[0];
                    return action.ToLower() switch
                    {
                        "view" => Convert.ToBoolean(row["CanView"]),
                        "create" => Convert.ToBoolean(row["CanCreate"]),
                        "edit" => Convert.ToBoolean(row["CanEdit"]),
                        "delete" => Convert.ToBoolean(row["CanDelete"]),
                        _ => false
                    };
                }
            }
            catch { }

            return false;
        }

        public void SavePermissionItem(string role, string featureKey, string featureName, bool canView, bool canCreate, bool canEdit, bool canDelete)
        {
            EnsureTableExists();
            var sql = @"IF EXISTS (SELECT 1 FROM RolePermissions WHERE Role = @Role AND FeatureKey = @FeatureKey)
                            UPDATE RolePermissions 
                            SET CanView = @CanView, CanCreate = @CanCreate, CanEdit = @CanEdit, CanDelete = @CanDelete 
                            WHERE Role = @Role AND FeatureKey = @FeatureKey
                        ELSE
                            INSERT INTO RolePermissions (Role, FeatureKey, FeatureName, CanView, CanCreate, CanEdit, CanDelete)
                            VALUES (@Role, @FeatureKey, @FeatureName, @CanView, @CanCreate, @CanEdit, @CanDelete)";

            DatabaseHelper.ExecuteNonQuery(sql,
                new SqlParameter("@Role", role),
                new SqlParameter("@FeatureKey", featureKey),
                new SqlParameter("@FeatureName", featureName),
                new SqlParameter("@CanView", canView),
                new SqlParameter("@CanCreate", canCreate),
                new SqlParameter("@CanEdit", canEdit),
                new SqlParameter("@CanDelete", canDelete));
        }

        public void SavePermissions(string role, List<string> permissionKeys)
        {
            EnsureTableExists();
            foreach (var key in AllAvailablePermissions)
            {
                bool canView = permissionKeys.Contains(key);
                SavePermissionItem(role, key, GetPermissionName(key), canView, canView, canView, false);
            }
        }
    }
}
