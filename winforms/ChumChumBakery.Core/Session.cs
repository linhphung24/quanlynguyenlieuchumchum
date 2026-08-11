using ChumChumBakery.Core.Models;

namespace ChumChumBakery.Core
{
    public static class Session
    {
        public static User? CurrentUser { get; set; }
        public static List<string> CurrentPermissions { get; set; } = new List<string>();

        public static bool HasPermission(string permissionKey)
        {
            if (CurrentUser != null && CurrentUser.Role == "admin") return true; // Admin has all rights
            return CurrentPermissions.Contains(permissionKey);
        }
    }
}
