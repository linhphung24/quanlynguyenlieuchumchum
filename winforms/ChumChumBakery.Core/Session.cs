using System;
using System.Collections.Generic;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.Core
{
    public static class Session
    {
        public static User? CurrentUser { get; set; }
        public static List<string> CurrentPermissions { get; set; } = new List<string>();
        private static readonly PermissionService _permissionService = new PermissionService();

        public static bool HasPermission(string featureKey, string action = "view")
        {
            if (CurrentUser == null) return false;
            
            var role = CurrentUser.Role ?? "";
            
            // Admin luôn có toàn quyền
            if (string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase)) return true;

            // Kiểm tra vai trò Kế toán (accountant hoặc ketoan)
            bool isAccountant = string.Equals(role, "accountant", StringComparison.OrdinalIgnoreCase) ||
                                string.Equals(role, "ketoan", StringComparison.OrdinalIgnoreCase);

            if (isAccountant)
            {
                // Kế toán được phép truy cập đầy đủ các chức năng nghiệp vụ Kho & Hóa đơn & Báo cáo
                if (featureKey is "Menu_Invoices" or "Menu_StockOpening" or "Menu_Batches" or 
                                  "Menu_SummaryReport" or "Menu_Recipes" or "Menu_Products" or "Menu_Suppliers")
                {
                    return true;
                }
            }

            // Mặc định gọi PermissionService kiểm tra theo Ma trận Phân quyền
            return _permissionService.HasPermission(role, featureKey, action);
        }
    }
}
