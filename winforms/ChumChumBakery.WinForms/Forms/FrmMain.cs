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
            try { this.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch {}
            this.WindowState = FormWindowState.Maximized;
            SetupNavButtons();
            OpenSummaryReport();
        }

        private void SetupNavButtons()
        {
            AddNavButton("📦 Sản phẩm / Kho", 60, (s, e) => { lblTitle.Text = "📦 Quản lý Sản phẩm / Kho"; ShowPanel(new FrmProducts()); });
            AddNavButton("🧾 Hoá đơn Nhập / Xuất", 105, (s, e) => { lblTitle.Text = "🧾 Quản lý Hoá đơn Nhập / Xuất"; ShowPanel(new FrmInvoices()); });
            AddNavButton("📊 Tổng hợp tồn kho", 150, (s, e) => OpenSummaryReport());
            AddNavButton("📝 Tồn đầu kỳ / Kiểm kê", 195, (s, e) => { lblTitle.Text = "📝 Khai báo Tồn đầu kỳ"; ShowPanel(new FrmStockOpening()); });
            AddNavButton("🥖 Tính định mức", 240, (s, e) => { lblTitle.Text = "🥖 Tính định mức (Công thức)"; ShowPanel(new FrmRecipes()); });
            AddNavButton("🔐 Quản lý Tài khoản", 285, (s, e) => { lblTitle.Text = "🔐 Quản lý Tài khoản"; ShowPanel(new FrmUsers()); });
            AddNavButton("🏢 Nhà Cung Cấp", 330, (s, e) => { lblTitle.Text = "🏢 Danh sách Nhà Cung Cấp"; ShowPanel(new FrmSuppliers()); });
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
