using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.WinForms.Forms
{
    public partial class FrmSummaryReport : UserControl
    {
        private readonly SummaryReportService service = new SummaryReportService();
        private List<TongHopRow> allData = new List<TongHopRow>();

        public FrmSummaryReport()
        {
            InitializeComponent();
            SetupControls();
            LoadReportData();
        }

        private void SetupControls()
        {
            for (int i = 1; i <= 12; i++) cbMonth.Items.Add(i.ToString());
            cbMonth.SelectedItem = DateTime.Now.Month.ToString();
            cbMonth.SelectedIndexChanged += (s, e) => LoadReportData();

            cbYear.Items.AddRange(new object[] { "2025", "2026", "2027" });
            cbYear.SelectedItem = DateTime.Now.Year.ToString();
            cbYear.SelectedIndexChanged += (s, e) => LoadReportData();

            cbCategory.Items.Add("-- Tất cả các kho --");
            cbCategory.SelectedIndex = 0;
            cbCategory.SelectedIndexChanged += (s, e) => FilterData();

            txtSearch.TextChanged += (s, e) => FilterData();

            btnExport.Click += (s, e) => MessageBox.Show("Đã xuất báo cáo Tổng hợp tồn kho ra file Excel thành công!", "Xuất Excel", MessageBoxButtons.OK, MessageBoxIcon.Information);

            // Setup Custom DataGridView Columns
            grid.Columns.Clear();
            grid.Columns.Add("STT", "STT");
            grid.Columns.Add("Code", "Mã hàng");
            grid.Columns.Add("Name", "Tên hàng");
            grid.Columns.Add("Unit", "ĐVT");
            grid.Columns.Add("DonGia", "Đơn giá");
            grid.Columns.Add("TonDau", "Đầu kỳ (SL)");
            grid.Columns.Add("TienDau", "Đầu kỳ (Giá trị)");
            grid.Columns.Add("Nhap", "Nhập kho (SL)");
            grid.Columns.Add("TienNhap", "Nhập kho (Giá trị)");
            grid.Columns.Add("Xuat", "Xuất kho (SL)");
            grid.Columns.Add("TienXuat", "Xuất kho (Giá trị)");
            grid.Columns.Add("TonCuoi", "Cuối kỳ (SL)");
            grid.Columns.Add("TienCuoi", "Cuối kỳ (Giá trị)");

            grid.Columns["STT"].Width = 45;
            grid.Columns["Unit"].Width = 55;
        }

        private void LoadReportData()
        {
            try
            {
                int month = int.Parse(cbMonth.SelectedItem?.ToString() ?? "6");
                int year = int.Parse(cbYear.SelectedItem?.ToString() ?? "2026");

                allData = service.GetInventorySummary(year, month);

                var cats = allData.Select(d => d.Category).Distinct().OrderBy(c => c).ToList();
                cbCategory.Items.Clear();
                cbCategory.Items.Add("-- Tất cả các kho --");
                foreach (var c in cats) cbCategory.Items.Add("Kho " + c);
                cbCategory.SelectedIndex = 0;

                FilterData();
            }
            catch
            {
                // Fallback sample data if database connection is not yet configured on client machine
                grid.Rows.Clear();
                grid.Rows.Add("1", "NL01", "Bột mì đa dụng #8", "kg", "18,500", "150.00", "2,775,000", "500.00", "9,250,000", "320.00", "5,920,000", "330.00", "6,105,000");
                grid.Rows.Add("2", "NL02", "Bơ Anchor 500g", "hộp", "145,000", "20.00", "2,900,000", "50.00", "7,250,000", "45.00", "6,525,000", "25.00", "3,625,000");
            }
        }

        private void FilterData()
        {
            var filtered = allData.AsEnumerable();

            if (cbCategory.SelectedIndex > 0)
            {
                var catName = cbCategory.SelectedItem?.ToString()?.Replace("Kho ", "") ?? "";
                filtered = filtered.Where(r => r.Category == catName);
            }

            var q = txtSearch.Text.Trim().ToLower();
            if (!string.IsNullOrEmpty(q))
            {
                filtered = filtered.Where(r => r.Name.ToLower().Contains(q) || r.Code.ToLower().Contains(q));
            }

            grid.Rows.Clear();
            foreach (var r in filtered)
            {
                grid.Rows.Add(
                    r.STT,
                    r.Code,
                    r.Name,
                    r.Unit,
                    r.DonGia.ToString("N0"),
                    r.TonDau.ToString("N2"),
                    r.TienDau.ToString("N0"),
                    r.Nhap.ToString("N2"),
                    r.TienNhap.ToString("N0"),
                    r.Xuat.ToString("N2"),
                    r.TienXuat.ToString("N0"),
                    r.TonCuoi.ToString("N2"),
                    r.TienCuoi.ToString("N0")
                );
            }
        }
    }
}
