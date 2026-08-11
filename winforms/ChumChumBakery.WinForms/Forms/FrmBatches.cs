using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.WinForms.Forms
{
    public class FrmBatches : UserControl
    {
        private FifoBatchService _service = new FifoBatchService();
        private DataGridView _grid;
        private TextBox _txtSearch;
        private ComboBox _cbStatus;
        private Label _lblSummary;

        public FrmBatches()
        {
            InitializeUI();
            LoadData();
        }

        private void InitializeUI()
        {
            this.Dock = DockStyle.Fill;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 10F);

            // Top Panel
            var pnlTop = new Panel { Dock = DockStyle.Top, Height = 80, Padding = new Padding(10) };
            
            var lblTitle = new Label { Text = "📦 QUẢN LÝ LÔ HÀNG & HẠN SỬ DỤNG (FIFO)", Font = new Font("Segoe UI", 14F, FontStyle.Bold), AutoSize = true, Location = new Point(10, 10) };
            
            var lblSearch = new Label { Text = "Tìm kiếm:", AutoSize = true, Location = new Point(10, 48) };
            _txtSearch = new TextBox { Location = new Point(85, 45), Width = 250, PlaceholderText = "Mã/Tên SP, mã HĐ..." };
            _txtSearch.TextChanged += (s, e) => LoadData();

            var lblStatus = new Label { Text = "Trạng thái:", AutoSize = true, Location = new Point(350, 48) };
            _cbStatus = new ComboBox { Location = new Point(430, 45), Width = 150, DropDownStyle = ComboBoxStyle.DropDownList };
            _cbStatus.Items.Add("Chỉ Lô Còn Hàng");
            _cbStatus.Items.Add("Tất Cả Các Lô");
            _cbStatus.Items.Add("Chỉ Lô Đã Xuất Hết");
            _cbStatus.SelectedIndex = 0;
            _cbStatus.SelectedIndexChanged += (s, e) => LoadData();

            _lblSummary = new Label { Text = "Tổng tồn lô: 0.00 | Giá trị: 0 VNĐ", AutoSize = true, Font = new Font("Segoe UI", 10F, FontStyle.Bold), ForeColor = Color.DarkGreen, Location = new Point(610, 48) };

            pnlTop.Controls.AddRange(new Control[] { lblTitle, lblSearch, _txtSearch, lblStatus, _cbStatus, _lblSummary });

            // Grid
            _grid = new DataGridView
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
            _grid.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(240, 240, 240);
            _grid.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            _grid.ColumnHeadersHeight = 35;
            _grid.RowTemplate.Height = 30;

            this.Controls.Add(_grid);
            this.Controls.Add(pnlTop);
        }

        private void LoadData()
        {
            string statusFilter = "active";
            if (_cbStatus.SelectedIndex == 1) statusFilter = "all";
            else if (_cbStatus.SelectedIndex == 2) statusFilter = "empty";

            var data = _service.GetAllBatches(_txtSearch.Text.Trim(), statusFilter);
            _grid.DataSource = data;

            if (_grid.Columns["Id"] != null) _grid.Columns["Id"].Visible = false;
            if (_grid.Columns["InvoiceId"] != null) _grid.Columns["InvoiceId"].Visible = false;

            if (_grid.Columns["InvoiceCode"] != null) { _grid.Columns["InvoiceCode"].HeaderText = "Mã HĐ Nhập"; _grid.Columns["InvoiceCode"].FillWeight = 90; }
            if (_grid.Columns["InvoiceDate"] != null) { _grid.Columns["InvoiceDate"].HeaderText = "Ngày Nhập"; _grid.Columns["InvoiceDate"].DefaultCellStyle.Format = "dd/MM/yyyy"; _grid.Columns["InvoiceDate"].FillWeight = 90; }
            if (_grid.Columns["ProductCode"] != null) { _grid.Columns["ProductCode"].HeaderText = "Mã SP"; _grid.Columns["ProductCode"].FillWeight = 80; }
            if (_grid.Columns["ProductName"] != null) { _grid.Columns["ProductName"].HeaderText = "Tên Nguyên Liệu"; _grid.Columns["ProductName"].FillWeight = 180; }
            if (_grid.Columns["Unit"] != null) { _grid.Columns["Unit"].HeaderText = "ĐVT"; _grid.Columns["Unit"].FillWeight = 50; }
            if (_grid.Columns["Quantity"] != null) { _grid.Columns["Quantity"].HeaderText = "SL Nhập"; _grid.Columns["Quantity"].DefaultCellStyle.Format = "N2"; _grid.Columns["Quantity"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight; }
            if (_grid.Columns["RemainingQty"] != null) { _grid.Columns["RemainingQty"].HeaderText = "SL Tồn Lô"; _grid.Columns["RemainingQty"].DefaultCellStyle.Format = "N2"; _grid.Columns["RemainingQty"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight; _grid.Columns["RemainingQty"].DefaultCellStyle.Font = new Font("Segoe UI", 10F, FontStyle.Bold); }
            if (_grid.Columns["Price"] != null) { _grid.Columns["Price"].HeaderText = "Giá Nhập"; _grid.Columns["Price"].DefaultCellStyle.Format = "N0"; _grid.Columns["Price"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight; }
            if (_grid.Columns["MfgDate"] != null) { _grid.Columns["MfgDate"].HeaderText = "NSX"; _grid.Columns["MfgDate"].DefaultCellStyle.Format = "dd/MM/yyyy"; }
            if (_grid.Columns["ExpDate"] != null) { _grid.Columns["ExpDate"].HeaderText = "HSD"; _grid.Columns["ExpDate"].DefaultCellStyle.Format = "dd/MM/yyyy"; }

            // Thống kê tổng
            decimal totalQty = 0;
            decimal totalValue = 0;
            foreach (var b in data)
            {
                totalQty += b.RemainingQty;
                totalValue += (b.RemainingQty * b.Price);
            }
            _lblSummary.Text = $"Tổng tồn các lô: {totalQty:N2} | Tổng giá trị: {totalValue:N0} VNĐ";
        }
    }
}
