using System;
using System.ComponentModel;
using System.Drawing;
using System.Windows.Forms;
using ChumChumBakery.Core;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.WinForms.Forms
{
    public class FrmUsers : UserControl
    {
        private UserService _service = new UserService();
        private DataGridView _grid;
        private TextBox _txtUsername, _txtFullName, _txtPassword;
        private ComboBox _cbRole;
        private Button _btnSave, _btnDelete;
        private int _currentId = 0;
        private bool _isAdmin;

        public FrmUsers()
        {
            _isAdmin = Session.CurrentUser?.Role == "admin";
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
            
            pnlLeft.Controls.Add(new Label { Text = "Tài khoản:", AutoSize = true, Location = new Point(15, 20) });
            _txtUsername = new TextBox { Location = new Point(15, 45), Width = 270 };
            pnlLeft.Controls.Add(_txtUsername);

            pnlLeft.Controls.Add(new Label { Text = "Họ tên:", AutoSize = true, Location = new Point(15, 80) });
            _txtFullName = new TextBox { Location = new Point(15, 105), Width = 270 };
            pnlLeft.Controls.Add(_txtFullName);

            pnlLeft.Controls.Add(new Label { Text = "Mật khẩu (để trống nếu không đổi):", AutoSize = true, Location = new Point(15, 140) });
            _txtPassword = new TextBox { Location = new Point(15, 165), Width = 270, PasswordChar = '*' };
            pnlLeft.Controls.Add(_txtPassword);

            pnlLeft.Controls.Add(new Label { Text = "Phân quyền:", AutoSize = true, Location = new Point(15, 200) });
            _cbRole = new ComboBox { Location = new Point(15, 225), Width = 270, DropDownStyle = ComboBoxStyle.DropDownList };
            _cbRole.Items.AddRange(new[] { "admin", "manager", "staff", "ketoan", "thukho" });
            pnlLeft.Controls.Add(_cbRole);

            _btnSave = new Button { Text = "Lưu Mới", Location = new Point(15, 280), Width = 130, Height = 35, BackColor = Color.FromArgb(33, 150, 243), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            _btnSave.FlatAppearance.BorderSize = 0;
            _btnSave.Click += BtnSave_Click;
            pnlLeft.Controls.Add(_btnSave);

            _btnDelete = new Button { Text = "Xóa", Location = new Point(155, 280), Width = 130, Height = 35, BackColor = Color.FromArgb(244, 67, 54), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Enabled = false };
            _btnDelete.FlatAppearance.BorderSize = 0;
            _btnDelete.Click += BtnDelete_Click;
            pnlLeft.Controls.Add(_btnDelete);

            var btnClear = new Button { Text = "Hủy Chọn", Location = new Point(15, 325), Width = 270, Height = 30, BackColor = Color.LightGray, FlatStyle = FlatStyle.Flat };
            btnClear.FlatAppearance.BorderSize = 0;
            btnClear.Click += (s, e) => ClearForm();
            pnlLeft.Controls.Add(btnClear);

            if (!_isAdmin)
            {
                pnlLeft.Enabled = false; // Disable form for non-admins
                var lblWarn = new Label { Text = "Chỉ Admin mới có quyền sửa đổi tài khoản.", ForeColor = Color.Red, AutoSize = true, Location = new Point(15, 380) };
                pnlLeft.Controls.Add(lblWarn);
            }

            // Right panel - Grid
            var pnlRight = new Panel { Dock = DockStyle.Fill, Padding = new Padding(10) };

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

            _grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Username", HeaderText = "Tài Khoản", FillWeight = 100 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "FullName", HeaderText = "Họ Tên", FillWeight = 160 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Role", HeaderText = "Quyền", FillWeight = 80 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "CreatedBy", HeaderText = "Người Tạo", FillWeight = 80 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "UpdatedBy", HeaderText = "Người Sửa", FillWeight = 80 });

            _grid.SelectionChanged += Grid_SelectionChanged;
            pnlRight.Controls.Add(_grid);

            // Add controls in correct Z-Order for Docking (Fill must be added FIRST or SendToBack)
            this.Controls.Add(pnlRight);
            this.Controls.Add(pnlLeft);
        }

        private void LoadData()
        {
            var data = _service.GetAllUsers();
            _grid.DataSource = new BindingList<User>(data);
        }

        private void Grid_SelectionChanged(object sender, EventArgs e)
        {
            if (_grid.SelectedRows.Count > 0)
            {
                var u = (User)_grid.SelectedRows[0].DataBoundItem;
                _currentId = u.Id;
                _txtUsername.Text = u.Username;
                _txtFullName.Text = u.FullName;
                _cbRole.SelectedItem = u.Role;
                _txtPassword.Clear();
                _btnSave.Text = "Cập Nhật";
                
                // Không cho xóa chính mình
                _btnDelete.Enabled = (Session.CurrentUser?.Id != u.Id && _isAdmin);
            }
            else
            {
                ClearForm();
            }
        }

        private void ClearForm()
        {
            _currentId = 0;
            _txtUsername.Clear();
            _txtFullName.Clear();
            _txtPassword.Clear();
            _cbRole.SelectedIndex = -1;
            _btnSave.Text = "Lưu Mới";
            _btnDelete.Enabled = false;
            _grid.ClearSelection();
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(_txtUsername.Text) || string.IsNullOrWhiteSpace(_txtFullName.Text) || _cbRole.SelectedIndex == -1)
            {
                MessageBox.Show("Vui lòng nhập đủ thông tin.");
                return;
            }

            var u = new User
            {
                Id = _currentId,
                Username = _txtUsername.Text,
                FullName = _txtFullName.Text,
                Role = _cbRole.SelectedItem.ToString()
            };

            try
            {
                _service.SaveUser(u, _txtPassword.Text);
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
            if (_currentId > 0 && MessageBox.Show("Bạn có chắc muốn xóa tài khoản này?", "Xác nhận", MessageBoxButtons.YesNo) == DialogResult.Yes)
            {
                try
                {
                    _service.DeleteUser(_currentId);
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
