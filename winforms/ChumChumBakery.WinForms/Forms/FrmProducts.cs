using System;
using System.Drawing;
using System.Windows.Forms;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.WinForms.Forms
{
    public class FrmProducts : UserControl
    {
        private ProductService _service = new ProductService();
        private DataGridView _grid;
        private TextBox _txtSearch;
        private Button _btnAdd, _btnEdit, _btnDelete;

        public FrmProducts()
        {
            InitializeUI();
            LoadData();
        }

        private void InitializeUI()
        {
            this.Dock = DockStyle.Fill;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 10F);

            var pnlTop = new Panel { Dock = DockStyle.Top, Height = 60, Padding = new Padding(10) };
            
            var lblTitle = new Label { Text = "📦 QUẢN LÝ SẢN PHẨM / KHO", Font = new Font("Segoe UI", 14F, FontStyle.Bold), AutoSize = true, Location = new Point(10, 15) };
            
            var lblSearch = new Label { Text = "Tìm kiếm:", AutoSize = true, Location = new Point(350, 20) };
            _txtSearch = new TextBox { Width = 250, Location = new Point(420, 17) };
            _txtSearch.TextChanged += (s, e) => LoadData();

            _btnAdd = new Button { Text = "Thêm mới", Width = 100, Height = 35, BackColor = Color.FromArgb(76, 175, 80), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Location = new Point(700, 12) };
            _btnAdd.FlatAppearance.BorderSize = 0;
            _btnAdd.Click += BtnAdd_Click;

            _btnEdit = new Button { Text = "Sửa", Width = 80, Height = 35, BackColor = Color.FromArgb(33, 150, 243), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Location = new Point(810, 12) };
            _btnEdit.FlatAppearance.BorderSize = 0;
            _btnEdit.Click += BtnEdit_Click;

            _btnDelete = new Button { Text = "Xóa", Width = 80, Height = 35, BackColor = Color.FromArgb(244, 67, 54), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Location = new Point(900, 12) };
            _btnDelete.FlatAppearance.BorderSize = 0;
            _btnDelete.Click += BtnDelete_Click;

            pnlTop.Controls.Add(lblTitle);
            pnlTop.Controls.Add(lblSearch);
            pnlTop.Controls.Add(_txtSearch);
            pnlTop.Controls.Add(_btnAdd);
            pnlTop.Controls.Add(_btnEdit);
            pnlTop.Controls.Add(_btnDelete);

            if (!Core.Session.HasPermission("Menu_Products", "create")) _btnAdd.Visible = false;
            if (!Core.Session.HasPermission("Menu_Products", "edit")) _btnEdit.Visible = false;
            if (!Core.Session.HasPermission("Menu_Products", "delete")) _btnDelete.Visible = false;

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
                AllowUserToResizeRows = false
            };

            // Grid styling
            _grid.EnableHeadersVisualStyles = false;
            _grid.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(240, 240, 240);
            _grid.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            _grid.ColumnHeadersHeight = 40;
            _grid.RowTemplate.Height = 35;

            this.Controls.Add(_grid);
            this.Controls.Add(pnlTop);
        }

        private void LoadData()
        {
            var data = _service.GetAllProducts(_txtSearch.Text.Trim());
            _grid.DataSource = data;

            // Format columns
            if (_grid.Columns["Id"] != null) _grid.Columns["Id"].Visible = false;
            if (_grid.Columns["IsActive"] != null) _grid.Columns["IsActive"].Visible = false;
            
            if (_grid.Columns["Code"] != null) { _grid.Columns["Code"].HeaderText = "Mã SP"; _grid.Columns["Code"].FillWeight = 80; }
            if (_grid.Columns["Name"] != null) { _grid.Columns["Name"].HeaderText = "Tên Sản Phẩm"; _grid.Columns["Name"].FillWeight = 200; }
            if (_grid.Columns["Category"] != null) { _grid.Columns["Category"].HeaderText = "Danh Mục"; _grid.Columns["Category"].FillWeight = 100; }
            if (_grid.Columns["Unit"] != null) { _grid.Columns["Unit"].HeaderText = "ĐVT"; _grid.Columns["Unit"].FillWeight = 60; }
            
            if (_grid.Columns["CostPrice"] != null) 
            { 
                _grid.Columns["CostPrice"].HeaderText = "Giá Nhập"; 
                _grid.Columns["CostPrice"].DefaultCellStyle.Format = "N0"; 
                _grid.Columns["CostPrice"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight;
            }
            if (_grid.Columns["SellPrice"] != null) 
            { 
                _grid.Columns["SellPrice"].HeaderText = "Giá Bán"; 
                _grid.Columns["SellPrice"].DefaultCellStyle.Format = "N0"; 
                _grid.Columns["SellPrice"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight;
            }
            if (_grid.Columns["StockQty"] != null) 
            { 
                _grid.Columns["StockQty"].HeaderText = "Tồn Kho"; 
                _grid.Columns["StockQty"].DefaultCellStyle.Format = "N2"; 
                _grid.Columns["StockQty"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            }
            if (_grid.Columns["MinStock"] != null) 
            { 
                _grid.Columns["MinStock"].HeaderText = "Tồn Tối Thiểu"; 
                _grid.Columns["MinStock"].DefaultCellStyle.Format = "N2";
                _grid.Columns["MinStock"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            }
            if (_grid.Columns["Supplier"] != null) { _grid.Columns["Supplier"].HeaderText = "NCC"; }
            if (_grid.Columns["CreatedBy"] != null) { _grid.Columns["CreatedBy"].HeaderText = "Người Tạo"; _grid.Columns["CreatedBy"].FillWeight = 80; }
            if (_grid.Columns["UpdatedBy"] != null) { _grid.Columns["UpdatedBy"].HeaderText = "Người Sửa"; _grid.Columns["UpdatedBy"].FillWeight = 80; }
            if (_grid.Columns["CreatedAt"] != null) { _grid.Columns["CreatedAt"].Visible = false; }
            if (_grid.Columns["UpdatedAt"] != null) { _grid.Columns["UpdatedAt"].Visible = false; }
            if (_grid.Columns["Description"] != null) { _grid.Columns["Description"].HeaderText = "Mô Tả"; _grid.Columns["Description"].Visible = false; }
        }

        private void BtnAdd_Click(object sender, EventArgs e)
        {
            var frm = new FrmProductEdit();
            if (frm.ShowDialog() == DialogResult.OK)
            {
                LoadData();
            }
        }

        private void BtnEdit_Click(object sender, EventArgs e)
        {
            if (_grid.SelectedRows.Count == 0)
            {
                MessageBox.Show("Vui lòng chọn một sản phẩm để sửa.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            
            var product = (Product)_grid.SelectedRows[0].DataBoundItem;
            var frm = new FrmProductEdit(product);
            if (frm.ShowDialog() == DialogResult.OK)
            {
                LoadData();
            }
        }

        private void BtnDelete_Click(object sender, EventArgs e)
        {
            if (_grid.SelectedRows.Count == 0)
            {
                MessageBox.Show("Vui lòng chọn một sản phẩm để xóa.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var product = (Product)_grid.SelectedRows[0].DataBoundItem;
            if (MessageBox.Show($"Bạn có chắc muốn xóa sản phẩm '{product.Name}'?", "Xác nhận xóa", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
            {
                _service.DeleteProduct(product.Id);
                LoadData();
            }
        }
    }
}
