using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;
using ChumChumBakery.Core;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.WinForms.Forms
{
    /// <summary>
    /// Màn hình danh sách Phiếu thu / Phiếu chi (bố cục theo MISA AMIS:
    /// bộ lọc ngày + tìm kiếm live + grid 1 bảng + dòng tổng dưới chân).
    /// defaultType: "thu" / "chi" khóa bộ lọc loại; "" = xem tất cả.
    /// </summary>
    public class FrmCashVouchers : UserControl
    {
        private CashVoucherService _service = new CashVoucherService();
        private DataGridView _grid;
        private DateTimePicker _dtpFrom, _dtpTo;
        private TextBox _txtSearch;
        private ComboBox _cbTypeFilter;
        private Button _btnAdd, _btnEdit, _btnDelete, _btnPrint;
        private Label _lblSummary;
        private string _defaultType;

        public FrmCashVouchers(string defaultType = "")
        {
            _defaultType = defaultType;
            InitializeUI();
            LoadVouchers();
        }

        private static string FeatureKeyFor(string type) => type == "thu" ? "Menu_Vouchers_Thu" : "Menu_Vouchers_Chi";

        private void InitializeUI()
        {
            this.Dock = DockStyle.Fill;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 10F);

            // Panel Top (tiêu đề & bộ lọc)
            var pnlTop = new Panel { Dock = DockStyle.Top, Height = 60, Padding = new Padding(10) };
            var lblTitle = new Label
            {
                Text = _defaultType == "thu" ? "💵 QUẢN LÝ PHIẾU THU"
                     : _defaultType == "chi" ? "💸 QUẢN LÝ PHIẾU CHI"
                     : "💰 QUẢN LÝ THU CHI",
                Font = new Font("Segoe UI", 14F, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(10, 15)
            };

            var lblFrom = new Label { Text = "Từ ngày:", AutoSize = true, Location = new Point(260, 20) };
            // Ép dd/MM/yyyy thay vì Short (Short phụ thuộc cài đặt vùng miền Windows của từng máy)
            _dtpFrom = new DateTimePicker { Format = DateTimePickerFormat.Custom, CustomFormat = "dd/MM/yyyy", Width = 110, Location = new Point(330, 17), Value = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1) };

            var lblTo = new Label { Text = "Đến ngày:", AutoSize = true, Location = new Point(455, 20) };
            _dtpTo = new DateTimePicker { Format = DateTimePickerFormat.Custom, CustomFormat = "dd/MM/yyyy", Width = 110, Location = new Point(525, 17), Value = new DateTime(DateTime.Now.Year, DateTime.Now.Month, DateTime.DaysInMonth(DateTime.Now.Year, DateTime.Now.Month)) };

            _txtSearch = new TextBox { Width = 140, Location = new Point(650, 19), PlaceholderText = "Số phiếu, đối tượng..." };
            _txtSearch.KeyDown += (s, e) => { if (e.KeyCode == Keys.Enter) { e.Handled = true; e.SuppressKeyPress = true; LoadVouchers(); } };
            // Tìm live khi gõ — tránh gõ xong quên Enter thấy lưới cũ tưởng thiếu dữ liệu
            _txtSearch.TextChanged += (s, e) => LoadVouchers();

            _cbTypeFilter = new ComboBox { Width = 100, Location = new Point(800, 19), DropDownStyle = ComboBoxStyle.DropDownList };
            _cbTypeFilter.Items.AddRange(new[] { "Tất cả", "Phiếu thu", "Phiếu chi" });

            // Set SelectedIndex TRƯỚC khi gắn handler — nếu không event nổ khi _grid chưa tạo
            if (_defaultType == "thu")
            {
                _cbTypeFilter.SelectedIndex = 1;
                _cbTypeFilter.Enabled = false;
            }
            else if (_defaultType == "chi")
            {
                _cbTypeFilter.SelectedIndex = 2;
                _cbTypeFilter.Enabled = false;
            }
            else
            {
                _cbTypeFilter.SelectedIndex = 0;
            }

            _cbTypeFilter.SelectedIndexChanged += (s, e) => LoadVouchers();

            var btnFilter = new Button { Text = "Lọc", Width = 50, Height = 30, Location = new Point(910, 16), BackColor = Color.FromArgb(224, 224, 224), FlatStyle = FlatStyle.Flat };
            btnFilter.FlatAppearance.BorderSize = 0;
            btnFilter.Click += (s, e) => LoadVouchers();

            // Nút thao tác xếp từ phải sang trái bắt đầu x=980
            int bx = 980;
            void PlaceTop(Control c) { c.Location = new Point(bx, c is ComboBox ? 19 : 12); bx += c.Width + 5; }

            _btnAdd = new Button { Text = "➕ Thêm", Width = 90, Height = 35, BackColor = Color.FromArgb(76, 175, 80), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            _btnAdd.FlatAppearance.BorderSize = 0;
            _btnAdd.Click += BtnAdd_Click;

            _btnEdit = new Button { Text = "Sửa", Width = 60, Height = 35, BackColor = Color.FromArgb(255, 152, 0), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Enabled = false };
            _btnEdit.FlatAppearance.BorderSize = 0;
            _btnEdit.Click += BtnEdit_Click;

            _btnDelete = new Button { Text = "Xóa", Width = 60, Height = 35, BackColor = Color.FromArgb(244, 67, 54), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            _btnDelete.FlatAppearance.BorderSize = 0;
            _btnDelete.Click += BtnDelete_Click;

            _btnPrint = new Button { Text = "🖨️ In", Width = 60, Height = 35, BackColor = Color.FromArgb(33, 150, 243), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            _btnPrint.FlatAppearance.BorderSize = 0;
            _btnPrint.Click += BtnPrint_Click;

            // Mở màn nhập thông tin công ty (Đơn vị / Địa chỉ / MST) — tự fill vào phiếu khi in
            var btnCompany = new Button { Text = "🏢 Công ty", Width = 90, Height = 35, BackColor = Color.FromArgb(121, 85, 72), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnCompany.FlatAppearance.BorderSize = 0;
            btnCompany.Click += (s, e) =>
            {
                using (var dlg = new FrmCompanyInfo())
                {
                    dlg.ShowDialog();
                }
            };

            var topButtons = new List<Control> { lblTitle, lblFrom, _dtpFrom, lblTo, _dtpTo, _txtSearch, _cbTypeFilter, btnFilter };

            // Ẩn nút khi không có quyền (giữ nguyên pattern màn Sản phẩm)
            if (!HasCreatePermissionAnywhere())
            {
                _btnAdd.Visible = false;
            }
            if (!HasDeletePermissionAnywhere())
            {
                _btnDelete.Visible = false;
            }

            if (_btnAdd.Visible) { topButtons.Add(_btnAdd); PlaceTop(_btnAdd); }
            topButtons.Add(_btnEdit); PlaceTop(_btnEdit);
            if (_btnDelete.Visible) { topButtons.Add(_btnDelete); PlaceTop(_btnDelete); }
            topButtons.Add(_btnPrint); PlaceTop(_btnPrint);
            topButtons.Add(btnCompany); PlaceTop(btnCompany);

            pnlTop.Controls.AddRange(topButtons.ToArray());

            // Dòng tổng dưới chân (tổng thu / tổng chi theo dữ liệu đang xem)
            var pnlSummary = new Panel { Dock = DockStyle.Bottom, Height = 36, BackColor = Color.FromArgb(253, 246, 236), Padding = new Padding(10, 6, 10, 6) };
            _lblSummary = new Label { Text = "", Dock = DockStyle.Fill, Font = new Font("Segoe UI", 10F, FontStyle.Bold), ForeColor = Color.FromArgb(139, 69, 19), TextAlign = ContentAlignment.MiddleLeft };
            pnlSummary.Controls.Add(_lblSummary);

            // Grid chính
            _grid = CreateGrid();
            _grid.SelectionChanged += Grid_SelectionChanged;
            _grid.CellDoubleClick += Grid_CellDoubleClick;
            var pnlGrid = new Panel { Dock = DockStyle.Fill, BackColor = Color.White, Padding = new Padding(5) };
            var lblGrid = new Label { Text = "Danh sách phiếu:", Font = new Font("Segoe UI", 10F, FontStyle.Bold), Dock = DockStyle.Top, Height = 25 };
            pnlGrid.Controls.Add(_grid);
            pnlGrid.Controls.Add(lblGrid);

            // Thứ tự Add quyết định docking: Fill trước, Bottom sau, Top cuối
            this.Controls.Add(pnlGrid);
            this.Controls.Add(pnlSummary);
            this.Controls.Add(pnlTop);
        }

        private DataGridView CreateGrid()
        {
            var grid = new DataGridView
            {
                Dock = DockStyle.Fill,
                AllowUserToAddRows = false,
                AllowUserToDeleteRows = false,
                ReadOnly = true,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
                BackgroundColor = Color.White,
                BorderStyle = BorderStyle.None,
                RowHeadersVisible = false,
                AllowUserToResizeRows = false,
                EnableHeadersVisualStyles = false
            };
            grid.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(240, 240, 240);
            grid.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            grid.ColumnHeadersHeight = 35;
            grid.RowTemplate.Height = 30;
            return grid;
        }

        // Chế độ "Tất cả" cho phép thêm/xóa nếu có quyền với ÍT NHẤT 1 loại phiếu
        private static bool HasCreatePermissionAnywhere() =>
            Session.HasPermission("Menu_Vouchers_Thu", "create") || Session.HasPermission("Menu_Vouchers_Chi", "create");

        private static bool HasDeletePermissionAnywhere() =>
            Session.HasPermission("Menu_Vouchers_Thu", "delete") || Session.HasPermission("Menu_Vouchers_Chi", "delete");

        private string GetFilteredType()
        {
            if (_defaultType == "thu") return "thu";
            if (_defaultType == "chi") return "chi";
            if (_cbTypeFilter.SelectedIndex == 1) return "thu";
            if (_cbTypeFilter.SelectedIndex == 2) return "chi";
            return "";
        }

        private void LoadVouchers()
        {
            if (_grid == null) return; // event filter có thể nổ trước khi lưới khởi tạo xong

            string keyword = _txtSearch?.Text.Trim() ?? "";
            var data = _service.GetVouchers(_dtpFrom.Value, _dtpTo.Value, keyword, GetFilteredType());

            _grid.DataSource = data;

            if (_grid.Columns["Id"] != null) _grid.Columns["Id"].Visible = false;
            if (_grid.Columns["Type"] != null) _grid.Columns["Type"].Visible = false;
            if (_grid.Columns["AttachedDocs"] != null) _grid.Columns["AttachedDocs"].Visible = false;
            if (_grid.Columns["ReceiverDisplay"] != null) _grid.Columns["ReceiverDisplay"].Visible = false;
            if (_grid.Columns["CreatedAt"] != null) _grid.Columns["CreatedAt"].Visible = false;
            if (_grid.Columns["UpdatedAt"] != null) _grid.Columns["UpdatedAt"].Visible = false;
            if (_grid.Columns["UpdatedBy"] != null) _grid.Columns["UpdatedBy"].Visible = false;

            if (_grid.Columns["VoucherDate"] != null) { _grid.Columns["VoucherDate"].HeaderText = "Ngày Phiếu"; _grid.Columns["VoucherDate"].DefaultCellStyle.Format = "dd/MM/yyyy"; _grid.Columns["VoucherDate"].FillWeight = 80; }
            if (_grid.Columns["Code"] != null) { _grid.Columns["Code"].HeaderText = "Số Phiếu"; _grid.Columns["Code"].FillWeight = 90; }
            if (_grid.Columns["TypeDisplay"] != null) { _grid.Columns["TypeDisplay"].HeaderText = "Loại"; _grid.Columns["TypeDisplay"].FillWeight = 70; _grid.Columns["TypeDisplay"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter; }
            if (_grid.Columns["Partner"] != null) { _grid.Columns["Partner"].HeaderText = "Đối Tượng"; _grid.Columns["Partner"].FillWeight = 140; }
            if (_grid.Columns["PartnerAddress"] != null) { _grid.Columns["PartnerAddress"].HeaderText = "Địa Chỉ"; _grid.Columns["PartnerAddress"].FillWeight = 140; }
            if (_grid.Columns["Receiver"] != null) { _grid.Columns["Receiver"].HeaderText = "Người Nhận / Nộp Tiền"; _grid.Columns["Receiver"].FillWeight = 120; }
            if (_grid.Columns["Amount"] != null) { _grid.Columns["Amount"].HeaderText = "Số Tiền"; _grid.Columns["Amount"].DefaultCellStyle.Format = "N0"; _grid.Columns["Amount"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight; _grid.Columns["Amount"].FillWeight = 110; }
            if (_grid.Columns["PaymentMethod"] != null) { _grid.Columns["PaymentMethod"].HeaderText = "Hình Thức"; _grid.Columns["PaymentMethod"].FillWeight = 80; }
            if (_grid.Columns["Note"] != null) { _grid.Columns["Note"].HeaderText = "Ghi Chú"; _grid.Columns["Note"].FillWeight = 130; }
            if (_grid.Columns["CreatedBy"] != null) { _grid.Columns["CreatedBy"].HeaderText = "Người Tạo"; _grid.Columns["CreatedBy"].FillWeight = 80; }

            UpdateSummary(data);
        }

        private void UpdateSummary(List<CashVoucher> data)
        {
            decimal tongThu = data.Where(v => v.Type == "thu").Sum(v => v.Amount);
            decimal tongChi = data.Where(v => v.Type == "chi").Sum(v => v.Amount);

            if (_defaultType == "thu")
            {
                _lblSummary.Text = $"💵 Tổng thu đang xem: {tongThu:N0} VNĐ  ({data.Count} phiếu)";
            }
            else if (_defaultType == "chi")
            {
                _lblSummary.Text = $"💸 Tổng chi đang xem: {tongChi:N0} VNĐ  ({data.Count} phiếu)";
            }
            else
            {
                decimal chenhLech = tongThu - tongChi;
                _lblSummary.Text = $"💵 Tổng thu: {tongThu:N0} VNĐ   |   💸 Tổng chi: {tongChi:N0} VNĐ   |   Chênh lệch: {chenhLech:N0} VNĐ   ({data.Count} phiếu)";
            }
        }

        private void Grid_SelectionChanged(object sender, EventArgs e)
        {
            if (_btnEdit != null)
            {
                _btnEdit.Enabled = _grid.SelectedRows.Count > 0 && _grid.SelectedRows[0].DataBoundItem is CashVoucher v
                    && Session.HasPermission(FeatureKeyFor(v.Type), "edit");
            }
        }

        private void BtnAdd_Click(object sender, EventArgs e)
        {
            // Màn cố định loại thì kiểm tra đúng loại đó; màn "Tất cả" cho phép nếu có quyền 1 trong 2
            if (!string.IsNullOrEmpty(_defaultType))
            {
                if (!Session.HasPermission(FeatureKeyFor(_defaultType), "create"))
                {
                    MessageBox.Show("Bạn không có quyền thêm mới phiếu loại này!", "Từ chối", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                    return;
                }
            }
            else if (!HasCreatePermissionAnywhere())
            {
                MessageBox.Show("Bạn không có quyền thêm mới phiếu thu chi!", "Từ chối", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                return;
            }

            using (var dlg = new FrmVoucherEdit(_defaultType))
            {
                if (dlg.ShowDialog() == DialogResult.OK)
                {
                    LoadVouchers();
                }
            }
        }

        private void BtnEdit_Click(object sender, EventArgs e)
        {
            if (_grid.SelectedRows.Count == 0)
            {
                MessageBox.Show("Vui lòng chọn một phiếu để sửa.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var voucher = (CashVoucher)_grid.SelectedRows[0].DataBoundItem;

            if (!Session.HasPermission(FeatureKeyFor(voucher.Type), "edit"))
            {
                MessageBox.Show("Bạn không có quyền sửa phiếu loại này!", "Từ chối truy cập", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                return;
            }

            int editedId = voucher.Id;
            using (var dlg = new FrmVoucherEdit(voucher))
            {
                if (dlg.ShowDialog() == DialogResult.OK)
                {
                    LoadVouchers();
                    SelectVoucherById(editedId);
                }
            }
        }

        // Chọn lại dòng phiếu vừa thao tác sau khi reload (selection mặc định nhảy về dòng đầu)
        private void SelectVoucherById(int voucherId)
        {
            foreach (DataGridViewRow row in _grid.Rows)
            {
                if (row.DataBoundItem is CashVoucher v && v.Id == voucherId)
                {
                    row.Selected = true;
                    var cell = row.Cells["VoucherDate"];
                    if (cell != null && cell.Visible)
                    {
                        _grid.CurrentCell = cell;
                    }
                    if (row.Index > 5) _grid.FirstDisplayedScrollingRowIndex = row.Index - 5;
                    break;
                }
            }
        }

        private void BtnDelete_Click(object sender, EventArgs e)
        {
            if (_grid.SelectedRows.Count == 0)
            {
                MessageBox.Show("Vui lòng chọn một phiếu để xóa.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var voucher = (CashVoucher)_grid.SelectedRows[0].DataBoundItem;

            if (!Session.HasPermission(FeatureKeyFor(voucher.Type), "delete"))
            {
                MessageBox.Show("Bạn không có quyền xóa phiếu loại này!", "Từ chối", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                return;
            }

            if (MessageBox.Show($"Bạn có chắc muốn xóa {voucher.TypeDisplay} '{voucher.Code}'?\nSố tiền: {voucher.Amount:N0} VNĐ — {voucher.Partner}",
                "Xác nhận xóa", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
            {
                try
                {
                    _service.DeleteVoucher(voucher.Id);
                    LoadVouchers();
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Lỗi khi xóa phiếu: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        private void BtnPrint_Click(object sender, EventArgs e)
        {
            if (_grid.SelectedRows.Count == 0)
            {
                MessageBox.Show("Vui lòng chọn một phiếu để in.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var voucher = (CashVoucher)_grid.SelectedRows[0].DataBoundItem;
            Helpers.VoucherPrintHelper.PrintVoucher(voucher);
        }

        private void Grid_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex >= 0 && _grid.SelectedRows.Count > 0)
            {
                var voucher = (CashVoucher)_grid.SelectedRows[0].DataBoundItem;
                using (var dlg = new FrmVoucherDetailView(voucher))
                {
                    dlg.ShowDialog();
                }
            }
        }
    }
}
