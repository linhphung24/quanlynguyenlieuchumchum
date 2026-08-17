using System;
using System.ComponentModel;
using System.Drawing;
using System.Windows.Forms;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.WinForms.Forms
{
    public class FrmSuppliers : UserControl
    {
        private SupplierService _service = new SupplierService();
        private DataGridView _grid;
        private TextBox _txtSearch, _txtName, _txtPhone, _txtAddress, _txtNote;
        private Button _btnSave, _btnDelete, _btnSearch;
        private int _currentId = 0;

        public FrmSuppliers()
        {
            InitializeUI();
            LoadData();
        }

        private void InitializeUI()
        {
            this.Dock = DockStyle.Fill;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 10F);

            // Left panel - Form
            var pnlLeft = new Panel { Dock = DockStyle.Left, Width = 300, BackColor = Color.FromArgb(245, 245, 245), Padding = new Padding(15) };
            
            pnlLeft.Controls.Add(new Label { Text = "Tên Nhà Cung Cấp:", AutoSize = true, Location = new Point(15, 20) });
            _txtName = new TextBox { Location = new Point(15, 45), Width = 270 };
            pnlLeft.Controls.Add(_txtName);

            pnlLeft.Controls.Add(new Label { Text = "Điện Thoại:", AutoSize = true, Location = new Point(15, 80) });
            _txtPhone = new TextBox { Location = new Point(15, 105), Width = 270 };
            pnlLeft.Controls.Add(_txtPhone);

            pnlLeft.Controls.Add(new Label { Text = "Địa Chỉ:", AutoSize = true, Location = new Point(15, 140) });
            _txtAddress = new TextBox { Location = new Point(15, 165), Width = 270 };
            pnlLeft.Controls.Add(_txtAddress);

            pnlLeft.Controls.Add(new Label { Text = "Ghi Chú:", AutoSize = true, Location = new Point(15, 200) });
            _txtNote = new TextBox { Location = new Point(15, 225), Width = 270, Multiline = true, Height = 60 };
            pnlLeft.Controls.Add(_txtNote);

            _btnSave = new Button { Text = "Lưu Mới", Location = new Point(15, 300), Width = 130, Height = 35, BackColor = Color.FromArgb(33, 150, 243), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            _btnSave.FlatAppearance.BorderSize = 0;
            _btnSave.Click += BtnSave_Click;
            pnlLeft.Controls.Add(_btnSave);

            _btnDelete = new Button { Text = "Xóa", Location = new Point(155, 300), Width = 130, Height = 35, BackColor = Color.FromArgb(244, 67, 54), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Enabled = false };
            _btnDelete.FlatAppearance.BorderSize = 0;
            _btnDelete.Click += BtnDelete_Click;
            pnlLeft.Controls.Add(_btnDelete);

            var btnClear = new Button { Text = "Hủy Chọn", Location = new Point(15, 345), Width = 270, Height = 30, BackColor = Color.LightGray, FlatStyle = FlatStyle.Flat };
            btnClear.FlatAppearance.BorderSize = 0;
            btnClear.Click += (s, e) => ClearForm();
            pnlLeft.Controls.Add(btnClear);

            if (!Core.Session.HasPermission("Menu_Suppliers", "create") && !Core.Session.HasPermission("Menu_Suppliers", "edit"))
            {
                _btnSave.Visible = false;
            }
            if (!Core.Session.HasPermission("Menu_Suppliers", "delete"))
            {
                _btnDelete.Visible = false;
            }

            // Right panel - Grid
            var pnlRight = new Panel { Dock = DockStyle.Fill, Padding = new Padding(10) };
            
            var pnlSearch = new Panel { Dock = DockStyle.Top, Height = 40 };
            _txtSearch = new TextBox { Location = new Point(0, 5), Width = 300 };
            _txtSearch.PlaceholderText = "Tìm theo tên hoặc số điện thoại...";
            _btnSearch = new Button { Text = "Tìm kiếm", Location = new Point(310, 3), Width = 100, Height = 30, BackColor = Color.FromArgb(224, 224, 224), FlatStyle = FlatStyle.Flat };
            _btnSearch.FlatAppearance.BorderSize = 0;
            _btnSearch.Click += (s, e) => LoadData();
            pnlSearch.Controls.Add(_txtSearch);
            pnlSearch.Controls.Add(_btnSearch);

            _grid = new DataGridView
            {
                Dock = DockStyle.Fill,
                AutoGenerateColumns = false,
                AllowUserToAddRows = false,
                AllowUserToDeleteRows = false,
                ReadOnly = true,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
                BackgroundColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle,
                RowHeadersVisible = false,
                EnableHeadersVisualStyles = false
            };
            _grid.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(240, 240, 240);
            _grid.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            _grid.ColumnHeadersHeight = 35;
            _grid.RowTemplate.Height = 30;

            _grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Name", HeaderText = "Tên Nhà Cung Cấp", FillWeight = 150 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Phone", HeaderText = "Điện Thoại", FillWeight = 90 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Address", HeaderText = "Địa Chỉ", FillWeight = 130 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Note", HeaderText = "Ghi Chú", FillWeight = 120 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "CreatedBy", HeaderText = "Người Tạo", FillWeight = 80 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "UpdatedBy", HeaderText = "Người Sửa", FillWeight = 80 });

            _grid.SelectionChanged += Grid_SelectionChanged;

            pnlRight.Controls.Add(_grid);
            pnlRight.Controls.Add(pnlSearch);

            this.Controls.Add(pnlRight);
            this.Controls.Add(pnlLeft);
        }

        private void LoadData()
        {
            var data = _service.GetAllSuppliers(_txtSearch.Text);
            _grid.DataSource = new BindingList<Supplier>(data);
        }

        private void Grid_SelectionChanged(object sender, EventArgs e)
        {
            if (_grid.SelectedRows.Count > 0)
            {
                var s = (Supplier)_grid.SelectedRows[0].DataBoundItem;
                _currentId = s.Id;
                _txtName.Text = s.Name;
                _txtPhone.Text = s.Phone;
                _txtAddress.Text = s.Address;
                _txtNote.Text = s.Note;
                _btnSave.Text = "Cập Nhật";
                _btnDelete.Enabled = true;
            }
            else
            {
                ClearForm();
            }
        }

        private void ClearForm()
        {
            _currentId = 0;
            _txtName.Clear();
            _txtPhone.Clear();
            _txtAddress.Clear();
            _txtNote.Clear();
            _btnSave.Text = "Lưu Mới";
            _btnDelete.Enabled = false;
            _grid.ClearSelection();
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(_txtName.Text))
            {
                MessageBox.Show("Vui lòng nhập tên nhà cung cấp.");
                return;
            }

            var s = new Supplier
            {
                Id = _currentId,
                Name = _txtName.Text,
                Phone = _txtPhone.Text,
                Address = _txtAddress.Text,
                Note = _txtNote.Text
            };

            try
            {
                _service.SaveSupplier(s);
                LoadData();
                ClearForm();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi: " + ex.Message);
            }
        }

        private void BtnDelete_Click(object sender, EventArgs e)
        {
            if (_currentId > 0 && MessageBox.Show("Bạn có chắc muốn xóa?", "Xác nhận", MessageBoxButtons.YesNo) == DialogResult.Yes)
            {
                try
                {
                    _service.DeleteSupplier(_currentId);
                    LoadData();
                    ClearForm();
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Lỗi: " + ex.Message);
                }
            }
        }
    }
}
