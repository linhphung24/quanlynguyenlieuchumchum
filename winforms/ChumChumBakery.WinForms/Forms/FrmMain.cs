using System;
using System.Drawing;
using System.Windows.Forms;

namespace ChumChumBakery.WinForms.Forms
{
    public partial class FrmMain : Form
    {
        public FrmMain()
        {
            InitializeComponent();
            SetupNavButtons();
            OpenSummaryReport();
        }

        private void SetupNavButtons()
        {
            AddNavButton("📦 Sản phẩm / Kho", 60, (s, e) => ShowPanel(new Label { Text = "Quản lý Sản phẩm / Kho", Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleCenter, Font = new Font("Segoe UI", 16) }));
            AddNavButton("🧾 Hoá đơn Nhập / Xuất", 105, (s, e) => ShowPanel(new Label { Text = "Quản lý Hoá đơn", Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleCenter, Font = new Font("Segoe UI", 16) }));
            AddNavButton("📊 Tổng hợp tồn kho", 150, (s, e) => OpenSummaryReport());
            AddNavButton("🥖 Công thức & Sản xuất", 195, (s, e) => ShowPanel(new Label { Text = "Công thức Bánh & Nhật ký Sản xuất", Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleCenter, Font = new Font("Segoe UI", 16) }));
            AddNavButton("👥 Quản lý Nhân sự", 240, (s, e) => ShowPanel(new Label { Text = "Quản lý Nhân sự Tiệm bánh", Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleCenter, Font = new Font("Segoe UI", 16) }));
        }

        private void AddNavButton(string text, int top, EventHandler onClick)
        {
            var btn = new Button
            {
                Text = "   " + text,
                Top = top,
                Left = 0,
                Width = 240,
                Height = 42,
                FlatStyle = FlatStyle.Flat,
                ForeColor = Color.FromArgb(245, 230, 204),
                BackColor = Color.Transparent,
                TextAlign = ContentAlignment.MiddleLeft,
                Cursor = Cursors.Hand,
                Font = new Font("Segoe UI", 9.5F, FontStyle.Regular)
            };
            btn.FlatAppearance.BorderSize = 0;
            btn.FlatAppearance.MouseOverBackColor = Color.FromArgb(61, 31, 10);
            btn.Click += onClick;
            pnlSidebar.Controls.Add(btn);
        }

        private void ShowPanel(Control c)
        {
            pnlContent.Controls.Clear();
            c.Dock = DockStyle.Fill;
            pnlContent.Controls.Add(c);
        }

        private void OpenSummaryReport()
        {
            lblTitle.Text = "📊 Báo cáo Tổng hợp tồn kho";
            ShowPanel(new FrmSummaryReport());
        }
    }
}
