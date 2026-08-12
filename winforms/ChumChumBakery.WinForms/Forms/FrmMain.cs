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
        }

        private Button _activeButton = null;

        private void SetupNavButtons()
        {
            pnlSidebar.Controls.Clear();
            pnlSidebar.AutoScroll = true;

            int currentY = 60; // vị trí bắt đầu bên dưới Logo

            string role = Core.Session.CurrentUser?.Role ?? "staff";

            // NHÓM 1: QUẢN LÝ NHẬP XUẤT KHO
            currentY = AddGroupHeader("📦 QUẢN LÝ NHẬP XUẤT", currentY);
            if (Core.Session.HasPermission("Menu_Invoices"))
            {
                AddNavButton("🧾 Hóa đơn Nhập / Xuất", ref currentY, (s, e) => { lblTitle.Text = "🧾 Quản lý Hóa đơn Nhập / Xuất"; ShowPanel(new FrmInvoices(), (Button)s); });
            }
            
            if (Core.Session.HasPermission("Menu_StockOpening"))
            {
                AddNavButton("📝 Tồn đầu kỳ / Kiểm kê", ref currentY, (s, e) => { lblTitle.Text = "📝 Khai báo Tồn đầu kỳ"; ShowPanel(new FrmStockOpening(), (Button)s); });
            }
            
            if (Core.Session.HasPermission("Menu_Batches"))
            {
                AddNavButton("🏷️ Lô hàng & FIFO", ref currentY, (s, e) => { lblTitle.Text = "🏷️ Quản lý Lô hàng & Hạn sử dụng (FIFO)"; ShowPanel(new FrmBatches(), (Button)s); });
            }

            currentY += 10;

            // NHÓM 2: BÁO CÁO & ĐỊNH MỨC
            currentY = AddGroupHeader("📊 BÁO CÁO & THỐNG KÊ", currentY);
            
            Button btnReport = null;
            if (Core.Session.HasPermission("Menu_SummaryReport"))
            {
                btnReport = AddNavButton("📊 Tổng hợp tồn kho", ref currentY, (s, e) => OpenSummaryReport((Button)s));
            }
            
            if (Core.Session.HasPermission("Menu_Recipes"))
            {
                AddNavButton("🥖 Tính định mức (Công thức)", ref currentY, (s, e) => { lblTitle.Text = "🥖 Tính định mức (Công thức)"; ShowPanel(new FrmRecipes(), (Button)s); });
            }

            // NHÓM 3: DANH MỤC & HỆ THỐNG
            bool hasProducts = Core.Session.HasPermission("Menu_Products");
            bool hasSuppliers = Core.Session.HasPermission("Menu_Suppliers");
            bool hasUsers = Core.Session.HasPermission("Menu_Users");
            bool hasRoles = Core.Session.HasPermission("Menu_RolePermissions");

            if (hasProducts || hasSuppliers || hasUsers || hasRoles)
            {
                currentY += 10;
                currentY = AddGroupHeader("⚙️ DANH MỤC HỆ THỐNG", currentY);
                if (hasProducts)
                {
                    AddNavButton("📦 Danh mục Sản phẩm", ref currentY, (s, e) => { lblTitle.Text = "📦 Quản lý Danh mục Sản phẩm / Kho"; ShowPanel(new FrmProducts(), (Button)s); });
                }
                if (hasSuppliers)
                {
                    AddNavButton("🏢 Danh sách Nhà Cung Cấp", ref currentY, (s, e) => { lblTitle.Text = "🏢 Danh sách Nhà Cung Cấp"; ShowPanel(new FrmSuppliers(), (Button)s); });
                }
                if (hasUsers)
                {
                    AddNavButton("🔐 Quản lý Tài khoản", ref currentY, (s, e) => { lblTitle.Text = "🔐 Quản lý Tài khoản"; ShowPanel(new FrmUsers(), (Button)s); });
                }
                if (hasRoles)
                {
                    AddNavButton("🔑 Ma trận Phân quyền", ref currentY, (s, e) => { lblTitle.Text = "🔑 Ma trận Phân quyền Chức năng"; ShowPanel(new FrmPermissionMatrix(), (Button)s); });
                }
            }

            // Mặc định chọn báo cáo tổng hợp nếu có quyền, nếu không chọn cái đầu tiên
            if (btnReport != null)
            {
                OpenSummaryReport(btnReport);
            }
        }

        private int AddGroupHeader(string text, int top)
        {
            var lbl = new Label
            {
                Text = text,
                Top = top,
                Left = 12,
                Width = 216,
                Height = 25,
                ForeColor = Color.FromArgb(220, 180, 120),
                Font = new Font("Segoe UI", 8.5F, FontStyle.Bold),
                TextAlign = ContentAlignment.BottomLeft
            };
            pnlSidebar.Controls.Add(lbl);
            return top + 28;
        }

        private Button AddNavButton(string text, ref int top, EventHandler onClick)
        {
            var btn = new Button
            {
                Text = "   " + text,
                Top = top,
                Left = 0,
                Width = 240,
                Height = 38,
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
            top += 40;
            return btn;
        }

        private void ShowPanel(Control c, Button btn = null)
        {
            if (btn != null)
            {
                if (_activeButton != null)
                {
                    _activeButton.BackColor = Color.Transparent;
                    _activeButton.Font = new Font("Segoe UI", 9.5F, FontStyle.Regular);
                }
                _activeButton = btn;
                _activeButton.BackColor = Color.FromArgb(85, 45, 15);
                _activeButton.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);
            }

            pnlContent.Controls.Clear();
            c.Dock = DockStyle.Fill;
            pnlContent.Controls.Add(c);
        }

        private void OpenSummaryReport(Button btn = null)
        {
            lblTitle.Text = "📊 Báo cáo Tổng hợp tồn kho";
            ShowPanel(new FrmSummaryReport(), btn);
        }
    }
}
