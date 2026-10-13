using System;
using System.Drawing;
using System.Windows.Forms;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.WinForms.Forms
{
    /// <summary>
    /// Nhập thông tin công ty (Đơn vị / Địa chỉ / MST / Điện thoại) —
    /// lưu 1 lần, tự điền vào mẫu phiếu thu chi mỗi lần in.
    /// </summary>
    public class FrmCompanyInfo : Form
    {
        private CompanyInfoService _service = new CompanyInfoService();
        private TextBox txtName;
        private TextBox txtAddress;
        private TextBox txtTaxCode;
        private TextBox txtPhone;

        public FrmCompanyInfo()
        {
            InitializeUI();
            LoadData();
        }

        private void InitializeUI()
        {
            this.Text = "Thông tin Công ty (in trên phiếu)";
            this.Size = new Size(520, 340);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 10F);

            var grp = new GroupBox { Text = "Thông tin công ty", Location = new Point(10, 10), Size = new Size(485, 220) };

            grp.Controls.Add(new Label { Text = "Tên công ty (Đơn vị):", Location = new Point(20, 33), AutoSize = true });
            txtName = new TextBox { Location = new Point(180, 30), Width = 285 };
            grp.Controls.Add(txtName);

            grp.Controls.Add(new Label { Text = "Địa chỉ:", Location = new Point(20, 71), AutoSize = true });
            txtAddress = new TextBox { Location = new Point(180, 68), Width = 285 };
            grp.Controls.Add(txtAddress);

            grp.Controls.Add(new Label { Text = "Mã số thuế:", Location = new Point(20, 109), AutoSize = true });
            txtTaxCode = new TextBox { Location = new Point(180, 106), Width = 285 };
            grp.Controls.Add(txtTaxCode);

            grp.Controls.Add(new Label { Text = "Điện thoại:", Location = new Point(20, 147), AutoSize = true });
            txtPhone = new TextBox { Location = new Point(180, 144), Width = 285 };
            grp.Controls.Add(txtPhone);

            grp.Controls.Add(new Label
            {
                Text = "Thông tin này được tự động điền vào Đơn vị / Địa chỉ trên bản in phiếu thu, phiếu chi.",
                Location = new Point(20, 180),
                Size = new Size(450, 34),
                ForeColor = Color.Gray,
                Font = new Font("Segoe UI", 8.5F, FontStyle.Italic)
            });

            var btnCancel = new Button { Text = "Hủy", Location = new Point(300, 245), Width = 90, Height = 40, BackColor = Color.FromArgb(224, 224, 224), FlatStyle = FlatStyle.Flat };
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.DialogResult = DialogResult.Cancel;

            var btnSave = new Button { Text = "💾 Lưu", Location = new Point(400, 245), Width = 95, Height = 40, BackColor = Color.FromArgb(76, 175, 80), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.FlatAppearance.BorderSize = 0;
            btnSave.Click += BtnSave_Click;

            this.Controls.AddRange(new Control[] { grp, btnCancel, btnSave });
            this.CancelButton = btnCancel;
            this.AcceptButton = btnSave;
        }

        private void LoadData()
        {
            var info = _service.Get();
            txtName.Text = info.Name;
            txtAddress.Text = info.Address;
            txtTaxCode.Text = info.TaxCode;
            txtPhone.Text = info.Phone;
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txtName.Text.Trim()))
            {
                MessageBox.Show("Vui lòng nhập Tên công ty (in làm Đơn vị trên phiếu).", "Cảnh báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtName.Focus();
                return;
            }

            try
            {
                _service.Save(new CompanyInfo
                {
                    Name = txtName.Text.Trim(),
                    Address = txtAddress.Text.Trim(),
                    TaxCode = txtTaxCode.Text.Trim(),
                    Phone = txtPhone.Text.Trim()
                });
                MessageBox.Show("Đã lưu thông tin công ty. Các phiếu in sau sẽ tự động dùng thông tin này.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                this.DialogResult = DialogResult.OK;
                this.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
