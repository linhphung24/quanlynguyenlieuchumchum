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
    public class FrmInvoices : UserControl
    {
        private InvoiceService _service = new InvoiceService();
        private DataGridView _gridInvoices;
        private DataGridView _gridDetails;
        private DateTimePicker _dtpFrom, _dtpTo;
        private TextBox _txtSearch;
        private ComboBox _cbTypeFilter;
        private Button _btnSearch, _btnAdd, _btnEdit, _btnDelete, _btnPrint;
        private ComboBox _cbStatusFilter;
        private Button _btnApprove;
        private string _defaultType;

        // Sửa hóa đơn là quyền riêng của admin theo yêu cầu nghiệp vụ
        // (không phụ thuộc ma trận phân quyền — ketoan vẫn bị chặn)
        private static bool IsAdmin => string.Equals(Core.Session.CurrentUser?.Role ?? "", "admin", StringComparison.OrdinalIgnoreCase);

        // Người được duyệt hóa đơn xuất: kế toán / admin / manager (theo ma trận edit)
        private static bool IsExportApprover => Core.Session.HasPermission("Menu_Invoices_Export", "edit");

        public FrmInvoices(string defaultType = "")
        {
            _defaultType = defaultType;
            InitializeUI();
            LoadInvoices();
        }

        private void InitializeUI()
        {
            this.Dock = DockStyle.Fill;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 10F);

            // Panel Top (Header & Controls)
            var pnlTop = new Panel { Dock = DockStyle.Top, Height = 60, Padding = new Padding(10) };
            var lblTitle = new Label { Text = "🧾 QUẢN LÝ HÓA ĐƠN", Font = new Font("Segoe UI", 14F, FontStyle.Bold), AutoSize = true, Location = new Point(10, 15) };
            
            var lblFrom = new Label { Text = "Từ ngày:", AutoSize = true, Location = new Point(250, 20) };
            // Ép dd/MM/yyyy thay vì Short (Short phụ thuộc cài đặt vùng miền Windows của từng máy)
            _dtpFrom = new DateTimePicker { Format = DateTimePickerFormat.Custom, CustomFormat = "dd/MM/yyyy", Width = 110, Location = new Point(320, 17), Value = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1) };
            
            var lblTo = new Label { Text = "Đến ngày:", AutoSize = true, Location = new Point(440, 20) };
            _dtpTo = new DateTimePicker { Format = DateTimePickerFormat.Custom, CustomFormat = "dd/MM/yyyy", Width = 110, Location = new Point(510, 17), Value = new DateTime(DateTime.Now.Year, DateTime.Now.Month, DateTime.DaysInMonth(DateTime.Now.Year, DateTime.Now.Month)) };
            
            _txtSearch = new TextBox { Width = 150, Location = new Point(630, 19), PlaceholderText = "Mã HĐ, đối tác, SP..." };
            _txtSearch.KeyDown += (s, e) => { if (e.KeyCode == Keys.Enter) { e.Handled = true; e.SuppressKeyPress = true; LoadInvoices(); } };
            // Tìm live khi gõ (như màn Lô hàng) — tránh bẫy gõ xong quên Enter thấy lưới cũ tưởng thiếu dữ liệu
            _txtSearch.TextChanged += (s, e) => LoadInvoices();
            
            _cbTypeFilter = new ComboBox { Width = 90, Location = new Point(790, 19), DropDownStyle = ComboBoxStyle.DropDownList };
            _cbTypeFilter.Items.AddRange(new[] { "Tất cả", "Nhập kho", "Xuất kho" });
            
            if (_defaultType == "in")
            {
                _cbTypeFilter.SelectedIndex = 1;
                _cbTypeFilter.Enabled = false; // Khóa filter nếu xem chuyên Nhập
            }
            else if (_defaultType == "out")
            {
                _cbTypeFilter.SelectedIndex = 2;
                _cbTypeFilter.Enabled = false; // Khóa filter nếu xem chuyên Xuất
            }
            else
            {
                _cbTypeFilter.SelectedIndex = 0;
            }

            _cbTypeFilter.SelectedIndexChanged += (s, e) => LoadInvoices();

            _btnSearch = new Button { Text = "Lọc", Width = 50, Height = 30, Location = new Point(890, 16), BackColor = Color.FromArgb(224, 224, 224), FlatStyle = FlatStyle.Flat };
            _btnSearch.FlatAppearance.BorderSize = 0;
            _btnSearch.Click += (s, e) => LoadInvoices();

            _btnAdd = new Button { Text = "Thêm Mới", Width = 90, Height = 35, BackColor = Color.FromArgb(76, 175, 80), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            _btnAdd.FlatAppearance.BorderSize = 0;
            _btnAdd.Click += BtnAdd_Click;

            var topButtons = new List<Control> { lblTitle, lblFrom, _dtpFrom, lblTo, _dtpTo, _txtSearch, _cbTypeFilter, _btnSearch };

            // Xếp nút từ trái sang phải bắt đầu x=950
            int bx = 950;
            void PlaceTop(Control c) { c.Location = new Point(bx, c is ComboBox ? 19 : 12); bx += c.Width + 5; }

            if (_defaultType == "out")
            {
                _cbStatusFilter = new ComboBox { Width = 95, DropDownStyle = ComboBoxStyle.DropDownList };
                _cbStatusFilter.Items.AddRange(new[] { "Tất cả", "Chờ duyệt", "Đã duyệt", "Từ chối" });
                _cbStatusFilter.SelectedIndex = 0;
                _cbStatusFilter.SelectedIndexChanged += (s, e) => LoadInvoices();
                topButtons.Add(_cbStatusFilter);
                PlaceTop(_cbStatusFilter);
            }

            topButtons.Add(_btnAdd);
            PlaceTop(_btnAdd);

            // Nút Sửa hiển thị cho mọi vai trò, bật/tắt theo dòng đang chọn:
            // admin sửa được mọi hóa đơn; người tạo sửa được hóa đơn XUẤT của chính mình
            // khi còn CHỜ DUYỆT / TỪ CHỐI (chưa tính vào kho nên sửa an toàn)
            _btnEdit = new Button { Text = "Sửa", Width = 60, Height = 35, BackColor = Color.FromArgb(255, 152, 0), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Enabled = false };
            _btnEdit.FlatAppearance.BorderSize = 0;
            _btnEdit.Click += BtnEdit_Click;
            topButtons.Add(_btnEdit);
            PlaceTop(_btnEdit);

            if (_defaultType == "out" && IsExportApprover)
            {
                _btnApprove = new Button { Text = "✔ Duyệt / Từ chối", Width = 120, Height = 35, BackColor = Color.FromArgb(121, 85, 72), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
                _btnApprove.FlatAppearance.BorderSize = 0;
                _btnApprove.Click += BtnApprove_Click;
                topButtons.Add(_btnApprove);
                PlaceTop(_btnApprove);
            }

            _btnDelete = new Button { Text = "Xóa", Width = 60, Height = 35, BackColor = Color.FromArgb(244, 67, 54), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            _btnDelete.FlatAppearance.BorderSize = 0;
            _btnDelete.Click += BtnDelete_Click;
            topButtons.Add(_btnDelete);
            PlaceTop(_btnDelete);

            _btnPrint = new Button { Text = "🖨️ In", Width = 60, Height = 35, BackColor = Color.FromArgb(33, 150, 243), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            _btnPrint.FlatAppearance.BorderSize = 0;
            _btnPrint.Click += BtnPrint_Click;
            topButtons.Add(_btnPrint);
            PlaceTop(_btnPrint);

            pnlTop.Controls.AddRange(topButtons.ToArray());

            // Split Container
            var splitContainer = new SplitContainer
            {
                Dock = DockStyle.Fill,
                Orientation = Orientation.Horizontal,
                SplitterDistance = 300,
                BackColor = Color.LightGray
            };

            // Master Grid (Invoices)
            _gridInvoices = CreateGrid();
            _gridInvoices.SelectionChanged += GridInvoices_SelectionChanged;
            _gridInvoices.CellDoubleClick += GridInvoices_CellDoubleClick;
            _gridInvoices.CellFormatting += GridInvoices_CellFormatting;
            var pnlMaster = new Panel { Dock = DockStyle.Fill, BackColor = Color.White, Padding = new Padding(5) };
            var lblMaster = new Label { Text = "Danh sách hóa đơn:", Font = new Font("Segoe UI", 10F, FontStyle.Bold), Dock = DockStyle.Top, Height = 25 };
            pnlMaster.Controls.Add(_gridInvoices);
            pnlMaster.Controls.Add(lblMaster);
            splitContainer.Panel1.Controls.Add(pnlMaster);

            // Detail Grid (Invoice Details)
            _gridDetails = CreateGrid();
            var pnlDetail = new Panel { Dock = DockStyle.Fill, BackColor = Color.White, Padding = new Padding(5) };
            var lblDetail = new Label { Text = "Chi tiết hóa đơn:", Font = new Font("Segoe UI", 10F, FontStyle.Bold), Dock = DockStyle.Top, Height = 25 };
            pnlDetail.Controls.Add(_gridDetails);
            pnlDetail.Controls.Add(lblDetail);
            splitContainer.Panel2.Controls.Add(pnlDetail);

            this.Controls.Add(splitContainer);
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

        private void LoadInvoices()
        {
            string type = "";
            if (_cbTypeFilter != null) {
                if (_cbTypeFilter.SelectedIndex == 1) type = "in";
                else if (_cbTypeFilter.SelectedIndex == 2) type = "out";
            }
            string keyword = _txtSearch?.Text.Trim() ?? "";

            var data = _service.GetAllInvoices(_dtpFrom.Value, _dtpTo.Value, keyword, type);

            // Lọc trạng thái duyệt (chỉ màn hình hóa đơn xuất)
            if (_cbStatusFilter != null && _cbStatusFilter.SelectedIndex > 0)
            {
                string st = _cbStatusFilter.SelectedIndex == 1 ? "pending"
                          : _cbStatusFilter.SelectedIndex == 2 ? "approved"
                          : "rejected";
                data = data.Where(x => x.Type == "out" && x.ApprovalStatus == st).ToList();
            }

            _gridInvoices.DataSource = data;

            if (_gridInvoices.Columns["Id"] != null) _gridInvoices.Columns["Id"].Visible = false;
            if (_gridInvoices.Columns["Type"] != null) _gridInvoices.Columns["Type"].Visible = false;
            if (_gridInvoices.Columns["ImageUrl"] != null) _gridInvoices.Columns["ImageUrl"].Visible = false;
            if (_gridInvoices.Columns["ApprovalStatus"] != null) _gridInvoices.Columns["ApprovalStatus"].Visible = false;
            if (_gridInvoices.Columns["ApprovedBy"] != null) _gridInvoices.Columns["ApprovedBy"].Visible = false;
            if (_gridInvoices.Columns["ApprovedAt"] != null) _gridInvoices.Columns["ApprovedAt"].Visible = false;
            if (_gridInvoices.Columns["IsCounted"] != null) _gridInvoices.Columns["IsCounted"].Visible = false;
            
            if (_gridInvoices.Columns["InvDate"] != null) { _gridInvoices.Columns["InvDate"].HeaderText = "Ngày"; _gridInvoices.Columns["InvDate"].DefaultCellStyle.Format = "dd/MM/yyyy"; _gridInvoices.Columns["InvDate"].FillWeight = 80; }
            if (_gridInvoices.Columns["Code"] != null) { _gridInvoices.Columns["Code"].HeaderText = "Mã HĐ"; _gridInvoices.Columns["Code"].FillWeight = 100; }
            if (_gridInvoices.Columns["TypeDisplay"] != null) { _gridInvoices.Columns["TypeDisplay"].HeaderText = "Loại"; _gridInvoices.Columns["TypeDisplay"].FillWeight = 80; }
            if (_gridInvoices.Columns["StatusDisplay"] != null)
            {
                _gridInvoices.Columns["StatusDisplay"].HeaderText = "Trạng thái";
                _gridInvoices.Columns["StatusDisplay"].FillWeight = 80;
                _gridInvoices.Columns["StatusDisplay"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            }
            if (_gridInvoices.Columns["Partner"] != null) { _gridInvoices.Columns["Partner"].HeaderText = "Đối Tác"; _gridInvoices.Columns["Partner"].FillWeight = 150; }
            if (_gridInvoices.Columns["TotalAmount"] != null) { _gridInvoices.Columns["TotalAmount"].HeaderText = "Tổng Tiền"; _gridInvoices.Columns["TotalAmount"].DefaultCellStyle.Format = "N0"; _gridInvoices.Columns["TotalAmount"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight; }
            if (_gridInvoices.Columns["CreatedBy"] != null) { _gridInvoices.Columns["CreatedBy"].HeaderText = "Người Tạo"; _gridInvoices.Columns["CreatedBy"].FillWeight = 80; }
            if (_gridInvoices.Columns["UpdatedBy"] != null) { _gridInvoices.Columns["UpdatedBy"].HeaderText = "Người Sửa"; _gridInvoices.Columns["UpdatedBy"].FillWeight = 80; }
            if (_gridInvoices.Columns["CreatedAt"] != null) { _gridInvoices.Columns["CreatedAt"].Visible = false; }
            if (_gridInvoices.Columns["UpdatedAt"] != null) { _gridInvoices.Columns["UpdatedAt"].Visible = false; }
            if (_gridInvoices.Columns["Note"] != null) { _gridInvoices.Columns["Note"].HeaderText = "Ghi Chú"; _gridInvoices.Columns["Note"].FillWeight = 150; }
            
            if (data.Count == 0)
            {
                _gridDetails.DataSource = null;
            }
        }

        // Admin sửa mọi hóa đơn; người tạo sửa hóa đơn xuất của mình khi chưa được duyệt
        // (pending/rejected — chưa tính vào tồn kho). Hóa đơn đã duyệt chỉ admin sửa.
        private static bool CanEditInvoice(Invoice inv)
        {
            if (IsAdmin) return true;
            return inv.Type == "out"
                && (inv.ApprovalStatus == "pending" || inv.ApprovalStatus == "rejected")
                && string.Equals(inv.CreatedBy ?? "", Core.Session.CurrentUser?.Username ?? "", StringComparison.OrdinalIgnoreCase);
        }

        private void GridInvoices_SelectionChanged(object sender, EventArgs e)
        {
            if (_gridInvoices.SelectedRows.Count > 0)
            {
                var invoice = (Invoice)_gridInvoices.SelectedRows[0].DataBoundItem;
                LoadInvoiceDetails(invoice.Id);
                if (_btnEdit != null) _btnEdit.Enabled = CanEditInvoice(invoice);
            }
            else
            {
                if (_btnEdit != null) _btnEdit.Enabled = false;
            }
        }

        private void LoadInvoiceDetails(int invoiceId)
        {
            var details = _service.GetInvoiceDetails(invoiceId);
            _gridDetails.DataSource = details;

            if (_gridDetails.Columns["Id"] != null) _gridDetails.Columns["Id"].Visible = false;
            if (_gridDetails.Columns["InvoiceId"] != null) _gridDetails.Columns["InvoiceId"].Visible = false;
            if (_gridDetails.Columns["ProductId"] != null) _gridDetails.Columns["ProductId"].Visible = false;

            if (_gridDetails.Columns["ProductCode"] != null) { _gridDetails.Columns["ProductCode"].HeaderText = "Mã Sản Phẩm"; _gridDetails.Columns["ProductCode"].FillWeight = 80; }
            if (_gridDetails.Columns["ProductName"] != null) { _gridDetails.Columns["ProductName"].HeaderText = "Tên Sản Phẩm"; _gridDetails.Columns["ProductName"].FillWeight = 180; }
            if (_gridDetails.Columns["Unit"] != null) { _gridDetails.Columns["Unit"].HeaderText = "ĐVT"; _gridDetails.Columns["Unit"].FillWeight = 60; }
            if (_gridDetails.Columns["Amount"] != null) { _gridDetails.Columns["Amount"].HeaderText = "Số Lượng"; _gridDetails.Columns["Amount"].DefaultCellStyle.Format = "N2"; _gridDetails.Columns["Amount"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter; }
            if (_gridDetails.Columns["Price"] != null) { _gridDetails.Columns["Price"].HeaderText = "Đơn Giá"; _gridDetails.Columns["Price"].DefaultCellStyle.Format = "N0"; _gridDetails.Columns["Price"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight; }
            if (_gridDetails.Columns["Subtotal"] != null) { _gridDetails.Columns["Subtotal"].HeaderText = "Thành Tiền"; _gridDetails.Columns["Subtotal"].DefaultCellStyle.Format = "N0"; _gridDetails.Columns["Subtotal"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight; }
            if (_gridDetails.Columns["MfgDate"] != null) { _gridDetails.Columns["MfgDate"].HeaderText = "NSX"; _gridDetails.Columns["MfgDate"].DefaultCellStyle.Format = "dd/MM/yyyy"; }
            if (_gridDetails.Columns["ExpDate"] != null) { _gridDetails.Columns["ExpDate"].HeaderText = "HSD"; _gridDetails.Columns["ExpDate"].DefaultCellStyle.Format = "dd/MM/yyyy"; }
        }

        private void BtnAdd_Click(object sender, EventArgs e)
        {
            // Kiểm tra quyền thêm (nếu admin thì được thêm bất kỳ, nếu vào màn hình cụ thể thì truyền type)
            string featureKey = _defaultType == "in" ? "Menu_Invoices_Import" : 
                                _defaultType == "out" ? "Menu_Invoices_Export" : 
                                "Menu_Invoices_Import"; // default check
            
            if (_defaultType != "" && !Session.HasPermission(featureKey, "create"))
            {
                MessageBox.Show("Bạn không có quyền thêm mới hóa đơn loại này!", "Từ chối", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                return;
            }

            using (var dlg = new FrmInvoiceEdit(_defaultType))
            {
                if (dlg.ShowDialog() == DialogResult.OK)
                {
                    LoadInvoices();
                }
            }
        }

        private void BtnEdit_Click(object sender, EventArgs e)
        {
            if (_gridInvoices.SelectedRows.Count == 0)
            {
                MessageBox.Show("Vui lòng chọn một hóa đơn để sửa.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var invoice = (Invoice)_gridInvoices.SelectedRows[0].DataBoundItem;

            // Kiểm tra lại quyền lúc click (nút có thể bật từ selection cũ)
            if (!CanEditInvoice(invoice))
            {
                MessageBox.Show(
                    "Bạn chỉ được sửa hóa đơn XUẤT do chính mình tạo và đang CHỜ DUYỆT / TỪ CHỐI.\n" +
                    "Hóa đơn đã duyệt chỉ QUẢN TRỊ VIÊN được sửa.",
                    "Từ chối truy cập", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                return;
            }

            int editedId = invoice.Id;
            using (var dlg = new FrmInvoiceEdit(invoice))
            {
                if (dlg.ShowDialog() == DialogResult.OK)
                {
                    LoadInvoices();
                    SelectInvoiceById(editedId);
                }
            }
        }

        // Chọn lại dòng hóa đơn vừa thao tác để lưới chi tiết hiển thị ngay nó
        // (sau khi LoadInvoices rebind, selection mặc định nhảy về dòng đầu tiên)
        private void SelectInvoiceById(int invoiceId)
        {
            foreach (DataGridViewRow row in _gridInvoices.Rows)
            {
                if (row.DataBoundItem is Invoice inv && inv.Id == invoiceId)
                {
                    row.Selected = true;
                    // CurrentCell phải là ô VISIBLE — set vào cột ẩn sẽ throw
                    // InvalidOperationException "Current cell cannot be set to an invisible cell"
                    var cell = row.Cells["InvDate"];
                    if (cell != null && cell.Visible)
                    {
                        _gridInvoices.CurrentCell = cell;
                    }
                    if (row.Index > 5) _gridInvoices.FirstDisplayedScrollingRowIndex = row.Index - 5;
                    break;
                }
            }
        }

        // Tô màu hóa đơn xuất theo trạng thái duyệt: cam = chờ duyệt, đỏ nhạt = từ chối
        private void GridInvoices_CellFormatting(object sender, DataGridViewCellFormattingEventArgs e)
        {
            if (e.RowIndex < 0) return;
            if (!(_gridInvoices.Rows[e.RowIndex].DataBoundItem is Invoice inv) || inv.Type != "out") return;

            if (inv.ApprovalStatus == "pending")
            {
                _gridInvoices.Rows[e.RowIndex].DefaultCellStyle.BackColor = Color.FromArgb(255, 243, 224);
                _gridInvoices.Rows[e.RowIndex].DefaultCellStyle.ForeColor = Color.FromArgb(150, 90, 0);
            }
            else if (inv.ApprovalStatus == "rejected")
            {
                _gridInvoices.Rows[e.RowIndex].DefaultCellStyle.BackColor = Color.FromArgb(255, 228, 225);
                _gridInvoices.Rows[e.RowIndex].DefaultCellStyle.ForeColor = Color.FromArgb(150, 30, 30);
            }
        }

        private void BtnApprove_Click(object sender, EventArgs e)
        {
            if (!IsExportApprover)
            {
                MessageBox.Show("Chỉ kế toán / quản trị mới được duyệt hóa đơn xuất!", "Từ chối truy cập", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                return;
            }

            if (_gridInvoices.SelectedRows.Count == 0)
            {
                MessageBox.Show("Vui lòng chọn một hóa đơn xuất để duyệt.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var invoice = (Invoice)_gridInvoices.SelectedRows[0].DataBoundItem;
            if (invoice.Type != "out")
            {
                MessageBox.Show("Chỉ hóa đơn xuất kho cần duyệt.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            bool approve;
            if (invoice.ApprovalStatus == "approved")
            {
                MessageBox.Show("Hóa đơn này đã được duyệt rồi.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            else if (invoice.ApprovalStatus == "rejected")
            {
                var re = MessageBox.Show($"Hóa đơn {invoice.Code} đang bị TỪ CHỐI.\nDuyệt lại (bắt đầu tính vào tồn kho)?", "Duyệt lại", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
                if (re != DialogResult.Yes) return;
                approve = true;
            }
            else
            {
                var r = MessageBox.Show(
                    $"Duyệt hóa đơn xuất {invoice.Code}?\n\n" +
                    "[CÓ] = DUYỆT — hóa đơn bắt đầu được tính vào tồn kho\n" +
                    "[KHÔNG] = TỪ CHỐI — không tính vào tồn kho\n" +
                    "[HỦY] = không làm gì",
                    "Duyệt hóa đơn xuất", MessageBoxButtons.YesNoCancel, MessageBoxIcon.Question);
                if (r == DialogResult.Cancel) return;
                approve = r == DialogResult.Yes;
            }

            try
            {
                if (approve)
                {
                    // Cảnh báo âm kho nếu duyệt (khóa chặn kèm lựa chọn ghi đè như luồng sửa)
                    var violations = _service.PreviewApprovalViolations(invoice.Id);
                    if (violations.Count > 0)
                    {
                        var ok = MessageBox.Show(
                            "Duyệt hóa đơn này sẽ khiến các sản phẩm sau bị âm kho:\n\n• " + string.Join("\n• ", violations) +
                            "\n\nVẫn duyệt chứ?",
                            "Cảnh báo tồn kho", MessageBoxButtons.YesNo, MessageBoxIcon.Warning,
                            MessageBoxDefaultButton.Button2);
                        if (ok != DialogResult.Yes) return;
                    }
                }

                _service.ApplyApproval(invoice.Id, approve);
                LoadInvoices();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi khi duyệt: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void BtnDelete_Click(object sender, EventArgs e)
        {
            string featureKey = _defaultType == "in" ? "Menu_Invoices_Import" : 
                                _defaultType == "out" ? "Menu_Invoices_Export" : 
                                "Menu_Invoices_Import"; // default check

            if (!Session.HasPermission(featureKey, "delete"))
            {
                MessageBox.Show("Bạn không có quyền xóa hóa đơn loại này!", "Từ chối truy cập", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                return;
            }

            if (_gridInvoices.SelectedRows.Count == 0)
            {
                MessageBox.Show("Vui lòng chọn một hóa đơn để xóa.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var invoice = (Invoice)_gridInvoices.SelectedRows[0].DataBoundItem;
            if (MessageBox.Show($"Bạn có chắc muốn xóa hóa đơn '{invoice.Code}'?\nLưu ý: Các chi tiết hóa đơn cũng sẽ bị xóa.", "Xác nhận xóa", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
            {
                try
                {
                    _service.DeleteInvoice(invoice.Id);
                    LoadInvoices();
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Lỗi khi xóa hóa đơn: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        private void GridInvoices_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex >= 0 && _gridInvoices.SelectedRows.Count > 0)
            {
                var invoice = (Invoice)_gridInvoices.SelectedRows[0].DataBoundItem;
                using (var dlg = new FrmInvoiceDetailView(invoice))
                {
                    dlg.ShowDialog();
                }
            }
        }

        private void BtnPrint_Click(object sender, EventArgs e)
        {
            if (_gridInvoices.SelectedRows.Count > 0)
            {
                var invoice = (Invoice)_gridInvoices.SelectedRows[0].DataBoundItem;
                var details = _service.GetInvoiceDetails(invoice.Id);
                Helpers.InvoicePrintHelper.PrintInvoice(invoice, details);
            }
            else
            {
                MessageBox.Show("Vui lòng chọn một hóa đơn để in.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }
    }
}
