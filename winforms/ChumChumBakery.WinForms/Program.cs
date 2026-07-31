using System;
using System.Windows.Forms;
using ChumChumBakery.Core.Data;
using ChumChumBakery.WinForms.Forms;

namespace ChumChumBakery.WinForms
{
    internal static class Program
    {
        [STAThread]
        static void Main()
        {
            ApplicationConfiguration.Initialize();

            // Load cấu hình kết nối SQL Server
            var config = AppConfigHelper.LoadConfig();
            AppConfigHelper.ApplyConnectionString(config);

            // Kiểm tra kết nối thử
            bool canConnect = false;
            try
            {
                using var conn = DatabaseHelper.GetConnection();
                canConnect = (conn.State == System.Data.ConnectionState.Open);
            }
            catch { }

            // Nếu chưa kết nối được (ví dụ cài trên máy trạm khác chưa cấu hình IP máy chủ)
            if (!canConnect)
            {
                using var dlg = new FrmConnection();
                if (dlg.ShowDialog() != DialogResult.OK)
                {
                    return; // Người dùng đóng form kết nối mà chưa kết nối thành công
                }
            }

            Application.Run(new FrmMain());
        }
    }
}
