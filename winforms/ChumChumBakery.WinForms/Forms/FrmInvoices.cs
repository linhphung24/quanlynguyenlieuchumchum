using System;
using System.Drawing;
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
        private Button _btnSearch, _btnAdd, _btnDelete, _btnPrint;

        public FrmInvoices()
        {
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
            _dtpFrom = new DateTimePicker { Format = DateTimePickerFormat.Short, Width = 110, Location = new Point(320, 17), Value = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1) };
            
            var lblTo = new Label { Text = "Đến ngày:", AutoSize = true, Location = new Point(440, 20) };
            _dtpTo = new DateTimePicker { Format = DateTimePickerFormat.Short, Width = 110, Location = new Point(510, 17), Value = new DateTime(DateTime.Now.Year, DateTime.Now.Month, DateTime.DaysInMonth(DateTime.Now.Year, DateTime.Now.Month)) };
            
            _txtSearch = new TextBox { Width = 150, Location = new Point(630, 19), PlaceholderText = "Mã HĐ, đối tác, SP..." };
            _txtSearch.KeyDown += (s, e) => { if (e.KeyCode == Keys.Enter) { e.Handled = true; e.SuppressKeyPress = true; LoadInvoices(); } };
            
            _cbTypeFilter = new ComboBox { Width = 90, Location = new Point(790, 19), DropDownStyle = ComboBoxStyle.DropDownList };
            _cbTypeFilter.Items.AddRange(new[] { "Tất cả", "Nhập kho", "Xuất kho" });
            _cbTypeFilter.SelectedIndex = 0;
            _cbTypeFilter.SelectedIndexChanged += (s, e) => LoadInvoices();

            _btnSearch = new Button { Text = "Lọc", Width = 50, Height = 30, Location = new Point(890, 16), BackColor = Color.FromArgb(224, 224, 224), FlatStyle = FlatStyle.Flat };
            _btnSearch.FlatAppearance.BorderSize = 0;
            _btnSearch.Click += (s, e) => LoadInvoices();

            _btnAdd = new Button { Text = "Thêm Mới", Width = 90, Height = 35, BackColor = Color.FromArgb(76, 175, 80), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Location = new Point(950, 12) };
            _btnAdd.FlatAppearance.BorderSize = 0;
            _btnAdd.Click += BtnAdd_Click;

            _btnDelete = new Button { Text = "Xóa", Width = 60, Height = 35, BackColor = Color.FromArgb(244, 67, 54), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Location = new Point(1050, 12) };
            _btnDelete.FlatAppearance.BorderSize = 0;
            _btnDelete.Click += BtnDelete_Click;

            _btnPrint = new Button { Text = "🖨️ In", Width = 60, Height = 35, BackColor = Color.FromArgb(33, 150, 243), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Location = new Point(1120, 12) };
            _btnPrint.FlatAppearance.BorderSize = 0;
            _btnPrint.Click += BtnPrint_Click;

            pnlTop.Controls.AddRange(new Control[] { lblTitle, lblFrom, _dtpFrom, lblTo, _dtpTo, _txtSearch, _cbTypeFilter, _btnSearch, _btnAdd, _btnDelete, _btnPrint });

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
            _gridInvoices.DataSource = data;

            if (_gridInvoices.Columns["Id"] != null) _gridInvoices.Columns["Id"].Visible = false;
            if (_gridInvoices.Columns["Type"] != null) _gridInvoices.Columns["Type"].Visible = false;
            if (_gridInvoices.Columns["ImageUrl"] != null) _gridInvoices.Columns["ImageUrl"].Visible = false;
            
            if (_gridInvoices.Columns["InvDate"] != null) { _gridInvoices.Columns["InvDate"].HeaderText = "Ngày"; _gridInvoices.Columns["InvDate"].DefaultCellStyle.Format = "dd/MM/yyyy"; _gridInvoices.Columns["InvDate"].FillWeight = 80; }
            if (_gridInvoices.Columns["Code"] != null) { _gridInvoices.Columns["Code"].HeaderText = "Mã HĐ"; _gridInvoices.Columns["Code"].FillWeight = 100; }
            if (_gridInvoices.Columns["TypeDisplay"] != null) { _gridInvoices.Columns["TypeDisplay"].HeaderText = "Loại"; _gridInvoices.Columns["TypeDisplay"].FillWeight = 80; }
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

        private void GridInvoices_SelectionChanged(object sender, EventArgs e)
        {
            if (_gridInvoices.SelectedRows.Count > 0)
            {
                var invoice = (Invoice)_gridInvoices.SelectedRows[0].DataBoundItem;
                LoadInvoiceDetails(invoice.Id);
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
            using (var dlg = new FrmInvoiceEdit())
            {
                if (dlg.ShowDialog() == DialogResult.OK)
                {
                    LoadInvoices();
                }
            }
        }

        private void BtnDelete_Click(object sender, EventArgs e)
        {
            if (Session.CurrentUser?.Role != "admin")
            {
                MessageBox.Show("Chỉ tài khoản Admin mới có quyền xóa hóa đơn!", "Từ chối truy cập", MessageBoxButtons.OK, MessageBoxIcon.Stop);
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
