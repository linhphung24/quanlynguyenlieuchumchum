using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.WinForms.Forms
{
    public partial class FrmPermissionMatrix : UserControl
    {
        private readonly PermissionService service = new PermissionService();
        private List<RolePermission> allPermissions = new List<RolePermission>();

        public FrmPermissionMatrix()
        {
            InitializeComponent();
            SetupControls();
            LoadPermissionData();
        }

        private void SetupControls()
        {
            cbRoleFilter.Items.Clear();
            cbRoleFilter.Items.Add("-- Tất cả các vai trò --");
            cbRoleFilter.Items.Add("admin");
            cbRoleFilter.Items.Add("manager");
            cbRoleFilter.Items.Add("accountant");
            cbRoleFilter.Items.Add("staff");
            cbRoleFilter.SelectedIndex = 0;
            cbRoleFilter.SelectedIndexChanged += (s, e) => FilterData();

            btnSave.Click += (s, e) => SavePermissions();

            // Custom Columns DataGridView
            gridMatrix.Columns.Clear();

            var colId = new DataGridViewTextBoxColumn { Name = "Id", HeaderText = "ID", Visible = false };
            var colKey = new DataGridViewTextBoxColumn { Name = "FeatureKey", HeaderText = "Key", Visible = false };
            var colRawRole = new DataGridViewTextBoxColumn { Name = "RawRole", HeaderText = "RawRole", Visible = false };
            var colRole = new DataGridViewTextBoxColumn { Name = "Role", HeaderText = "Vai trò", ReadOnly = true, Width = 150 };
            var colFeature = new DataGridViewTextBoxColumn { Name = "FeatureName", HeaderText = "Chức năng / Màn hình", ReadOnly = true, Width = 260 };

            var colView = new DataGridViewCheckBoxColumn { Name = "CanView", HeaderText = "👁 Xem (Access)", Width = 110 };
            var colCreate = new DataGridViewCheckBoxColumn { Name = "CanCreate", HeaderText = "➕ Thêm (Create)", Width = 110 };
            var colEdit = new DataGridViewCheckBoxColumn { Name = "CanEdit", HeaderText = "✏ Sửa (Edit)", Width = 110 };
            var colDelete = new DataGridViewCheckBoxColumn { Name = "CanDelete", HeaderText = "🗑 Xoá (Delete)", Width = 110 };

            gridMatrix.Columns.AddRange(new DataGridViewColumn[] { colId, colKey, colRawRole, colRole, colFeature, colView, colCreate, colEdit, colDelete });
            gridMatrix.RowHeadersVisible = false;
        }

        private void LoadPermissionData()
        {
            try
            {
                allPermissions = service.GetFullPermissionsMatrix();
                FilterData();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Không thể tải ma trận phân quyền từ SQL Server:\n" + ex.Message, "Lỗi Database", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void FilterData()
        {
            gridMatrix.Rows.Clear();
            var filtered = allPermissions.AsEnumerable();

            if (cbRoleFilter.SelectedIndex > 0)
            {
                var role = cbRoleFilter.SelectedItem?.ToString() ?? "";
                filtered = filtered.Where(p => p.Role.Equals(role, StringComparison.OrdinalIgnoreCase));
            }

            foreach (var p in filtered)
            {
                var roleLabel = p.Role switch
                {
                    "admin" => "👑 Admin (Quản trị)",
                    "manager" => "💼 Manager (Quản lý)",
                    "accountant" => "📊 Accountant (Kế toán)",
                    "staff" => "👥 Staff (Nhân viên)",
                    _ => p.Role
                };

                gridMatrix.Rows.Add(p.Id, p.FeatureKey, p.Role, roleLabel, p.FeatureName, p.CanView, p.CanCreate, p.CanEdit, p.CanDelete);
            }
        }

        private void SavePermissions()
        {
            try
            {
                gridMatrix.EndEdit();
                int count = 0;

                foreach (DataGridViewRow row in gridMatrix.Rows)
                {
                    if (row.Cells["RawRole"].Value == null || row.Cells["FeatureKey"].Value == null) continue;

                    string role = row.Cells["RawRole"].Value.ToString() ?? "";
                    string featureKey = row.Cells["FeatureKey"].Value.ToString() ?? "";
                    string featureName = row.Cells["FeatureName"].Value?.ToString() ?? "";
                    bool canView = Convert.ToBoolean(row.Cells["CanView"].Value);
                    bool canCreate = Convert.ToBoolean(row.Cells["CanCreate"].Value);
                    bool canEdit = Convert.ToBoolean(row.Cells["CanEdit"].Value);
                    bool canDelete = Convert.ToBoolean(row.Cells["CanDelete"].Value);

                    service.SavePermissionItem(role, featureKey, featureName, canView, canCreate, canEdit, canDelete);
                    count++;
                }

                MessageBox.Show($"💾 Đã cập nhật thành công {count} quy định trong Ma trận Phân quyền!", "Lưu Phân Quyền", MessageBoxButtons.OK, MessageBoxIcon.Information);
                LoadPermissionData();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi khi lưu Ma trận Phân quyền:\n" + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
