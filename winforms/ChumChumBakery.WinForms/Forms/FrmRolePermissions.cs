using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.Windows.Forms;
using ChumChumBakery.Core;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.WinForms.Forms
{
    public class FrmRolePermissions : UserControl
    {
        private PermissionService _service = new PermissionService();
        private DataGridView _grid;
        private Button _btnSave;
        private DataTable _dtMatrix;

        private string[] _roles = new[] { "admin", "manager", "ketoan", "thukho", "staff" };

        public FrmRolePermissions()
        {
            InitializeUI();
            LoadData();
        }

        private void InitializeUI()
        {
            this.Dock = DockStyle.Fill;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 10F);

            var pnlTop = new Panel { Dock = DockStyle.Top, Height = 60, BackColor = Color.White };
            var lblTitle = new Label { Text = "🔑 MA TRẬN PHÂN QUYỀN CHỨC NĂNG", Font = new Font("Segoe UI", 14F, FontStyle.Bold), ForeColor = Color.FromArgb(139, 69, 19), AutoSize = true, Location = new Point(20, 15) };
            pnlTop.Controls.Add(lblTitle);

            _btnSave = new Button { Text = "Lưu Cấu Hình", Location = new Point(500, 15), Width = 150, Height = 35, BackColor = Color.FromArgb(76, 175, 80), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            _btnSave.FlatAppearance.BorderSize = 0;
            _btnSave.Click += BtnSave_Click;
            pnlTop.Controls.Add(_btnSave);

            var pnlGrid = new Panel { Dock = DockStyle.Fill, Padding = new Padding(20) };
            
            _grid = new DataGridView
            {
                Dock = DockStyle.Fill,
                AllowUserToAddRows = false,
                AllowUserToDeleteRows = false,
                AllowUserToResizeRows = false,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
                BackgroundColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle,
                RowHeadersVisible = false,
                EnableHeadersVisualStyles = false,
                SelectionMode = DataGridViewSelectionMode.CellSelect
            };
            _grid.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(240, 240, 240);
            _grid.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            _grid.ColumnHeadersHeight = 40;
            _grid.RowTemplate.Height = 35;
            
            _grid.CellContentClick += Grid_CellContentClick;
            _grid.CurrentCellDirtyStateChanged += Grid_CurrentCellDirtyStateChanged;

            pnlGrid.Controls.Add(_grid);

            this.Controls.Add(pnlGrid);
            this.Controls.Add(pnlTop);
        }

        private void LoadData()
        {
            _dtMatrix = new DataTable();
            _dtMatrix.Columns.Add("PermissionKey", typeof(string));
            _dtMatrix.Columns.Add("Chức Năng", typeof(string));
            foreach (var r in _roles)
            {
                _dtMatrix.Columns.Add(r, typeof(bool));
            }

            var allPerms = PermissionService.AllAvailablePermissions;
            var rolePerms = new Dictionary<string, List<string>>();
            foreach (var r in _roles)
            {
                rolePerms[r] = _service.GetPermissions(r);
            }

            foreach (var p in allPerms)
            {
                var row = _dtMatrix.NewRow();
                row["PermissionKey"] = p;
                row["Chức Năng"] = PermissionService.GetPermissionName(p);
                foreach (var r in _roles)
                {
                    row[r] = rolePerms[r].Contains(p);
                }
                _dtMatrix.Rows.Add(row);
            }

            _grid.DataSource = _dtMatrix;
            _grid.Columns["PermissionKey"].Visible = false;
            
            _grid.Columns["Chức Năng"].ReadOnly = true;
            _grid.Columns["Chức Năng"].FillWeight = 200;
            _grid.Columns["Chức Năng"].DefaultCellStyle.BackColor = Color.WhiteSmoke;

            foreach (var r in _roles)
            {
                _grid.Columns[r].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
                if (r == "admin")
                {
                    _grid.Columns[r].ReadOnly = true;
                    _grid.Columns[r].ToolTipText = "Admin luôn có toàn quyền";
                }
            }
        }

        private void Grid_CurrentCellDirtyStateChanged(object sender, EventArgs e)
        {
            if (_grid.IsCurrentCellDirty)
            {
                _grid.CommitEdit(DataGridViewDataErrorContexts.Commit);
            }
        }

        private void Grid_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.ColumnIndex > 1 && e.RowIndex >= 0)
            {
                string role = _grid.Columns[e.ColumnIndex].Name;
                if (role == "admin")
                {
                    MessageBox.Show("Tài khoản admin mặc định có tất cả các quyền và không thể thay đổi.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    // Re-check it
                    _grid.Rows[e.RowIndex].Cells[e.ColumnIndex].Value = true;
                }
            }
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            try
            {
                _grid.EndEdit();
                
                var newPerms = new Dictionary<string, List<string>>();
                foreach (var r in _roles)
                {
                    newPerms[r] = new List<string>();
                }

                foreach (DataRow row in _dtMatrix.Rows)
                {
                    string key = row["PermissionKey"].ToString();
                    foreach (var r in _roles)
                    {
                        if (Convert.ToBoolean(row[r]))
                        {
                            newPerms[r].Add(key);
                        }
                    }
                }

                foreach (var r in _roles)
                {
                    _service.SavePermissions(r, newPerms[r]);
                }
                
                // Update current session if logged in
                if (Session.CurrentUser != null)
                {
                    Session.CurrentPermissions = _service.GetPermissions(Session.CurrentUser.Role);
                }

                MessageBox.Show("Đã lưu cấu hình phân quyền thành công! Một số thay đổi sẽ có tác dụng ngay khi nhân viên load lại trang.", "Thành công", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi khi lưu: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
