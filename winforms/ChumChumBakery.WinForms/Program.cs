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

            // Cấu hình định dạng số tiếng Việt: Dấu chấm (.) ngăn cách hàng nghìn, dấu phẩy (,) ngăn cách thập phân
            var viCulture = new System.Globalization.CultureInfo("vi-VN");
            viCulture.NumberFormat.NumberGroupSeparator = ".";
            viCulture.NumberFormat.NumberDecimalSeparator = ",";
            viCulture.NumberFormat.CurrencyGroupSeparator = ".";
            viCulture.NumberFormat.CurrencyDecimalSeparator = ",";

            System.Globalization.CultureInfo.DefaultThreadCurrentCulture = viCulture;
            System.Globalization.CultureInfo.DefaultThreadCurrentUICulture = viCulture;
            System.Threading.Thread.CurrentThread.CurrentCulture = viCulture;
            System.Threading.Thread.CurrentThread.CurrentUICulture = viCulture;

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

            try
            {
                string createTbl = @"
                    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Suppliers' and xtype='U')
                    BEGIN
                        CREATE TABLE Suppliers (
                            Id INT IDENTITY(1,1) PRIMARY KEY,
                            Name NVARCHAR(255) NOT NULL,
                            Phone NVARCHAR(50) NULL,
                            Address NVARCHAR(255) NULL,
                            Note NVARCHAR(500) NULL,
                            IsActive BIT DEFAULT 1
                        );
                    END

                    INSERT INTO Suppliers (Name, Phone, Address, Note, IsActive)
                    SELECT DISTINCT Supplier, '', '', N'Tự động đồng bộ từ Sản phẩm', 1
                    FROM Products
                    WHERE Supplier IS NOT NULL 
                      AND LTRIM(RTRIM(Supplier)) <> ''
                      AND Supplier NOT IN (SELECT Name FROM Suppliers);

                    -- Tự động đảm bảo tất cả các bảng chính đều có 4 cột vết kiểm toán: CreatedBy, CreatedAt, UpdatedBy, UpdatedAt
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Products' AND COLUMN_NAME='CreatedBy') ALTER TABLE Products ADD CreatedBy NVARCHAR(100) NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Products' AND COLUMN_NAME='CreatedAt') ALTER TABLE Products ADD CreatedAt DATETIME NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Products' AND COLUMN_NAME='UpdatedBy') ALTER TABLE Products ADD UpdatedBy NVARCHAR(100) NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Products' AND COLUMN_NAME='UpdatedAt') ALTER TABLE Products ADD UpdatedAt DATETIME NULL;

                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Invoices' AND COLUMN_NAME='CreatedBy') ALTER TABLE Invoices ADD CreatedBy NVARCHAR(100) NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Invoices' AND COLUMN_NAME='CreatedAt') ALTER TABLE Invoices ADD CreatedAt DATETIME NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Invoices' AND COLUMN_NAME='UpdatedBy') ALTER TABLE Invoices ADD UpdatedBy NVARCHAR(100) NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Invoices' AND COLUMN_NAME='UpdatedAt') ALTER TABLE Invoices ADD UpdatedAt DATETIME NULL;

                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Recipes' AND COLUMN_NAME='CreatedBy') ALTER TABLE Recipes ADD CreatedBy NVARCHAR(100) NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Recipes' AND COLUMN_NAME='CreatedAt') ALTER TABLE Recipes ADD CreatedAt DATETIME NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Recipes' AND COLUMN_NAME='UpdatedBy') ALTER TABLE Recipes ADD UpdatedBy NVARCHAR(100) NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Recipes' AND COLUMN_NAME='UpdatedAt') ALTER TABLE Recipes ADD UpdatedAt DATETIME NULL;

                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Suppliers' AND COLUMN_NAME='CreatedBy') ALTER TABLE Suppliers ADD CreatedBy NVARCHAR(100) NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Suppliers' AND COLUMN_NAME='CreatedAt') ALTER TABLE Suppliers ADD CreatedAt DATETIME NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Suppliers' AND COLUMN_NAME='UpdatedBy') ALTER TABLE Suppliers ADD UpdatedBy NVARCHAR(100) NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Suppliers' AND COLUMN_NAME='UpdatedAt') ALTER TABLE Suppliers ADD UpdatedAt DATETIME NULL;

                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Users' AND COLUMN_NAME='CreatedBy') ALTER TABLE Users ADD CreatedBy NVARCHAR(100) NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Users' AND COLUMN_NAME='CreatedAt') ALTER TABLE Users ADD CreatedAt DATETIME NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Users' AND COLUMN_NAME='UpdatedBy') ALTER TABLE Users ADD UpdatedBy NVARCHAR(100) NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Users' AND COLUMN_NAME='UpdatedAt') ALTER TABLE Users ADD UpdatedAt DATETIME NULL;

                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='StockOpeningAdj' AND COLUMN_NAME='CreatedBy') ALTER TABLE StockOpeningAdj ADD CreatedBy NVARCHAR(100) NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='StockOpeningAdj' AND COLUMN_NAME='CreatedAt') ALTER TABLE StockOpeningAdj ADD CreatedAt DATETIME NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='StockOpeningAdj' AND COLUMN_NAME='UpdatedBy') ALTER TABLE StockOpeningAdj ADD UpdatedBy NVARCHAR(100) NULL;
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='StockOpeningAdj' AND COLUMN_NAME='UpdatedAt') ALTER TABLE StockOpeningAdj ADD UpdatedAt DATETIME NULL;
                ";
                ChumChumBakery.Core.Data.DatabaseHelper.ExecuteNonQuery(createTbl);

                var fifo = new ChumChumBakery.Core.Services.FifoBatchService();
                fifo.RebuildAllFifoBatches();
            }
            catch { }



            var login = new Forms.FrmLogin();
            if (login.ShowDialog() == DialogResult.OK)
            {
                Application.Run(new FrmMain());
            }
        }
    }
}
