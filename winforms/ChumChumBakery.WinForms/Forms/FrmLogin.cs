using System;
using System.Drawing;
using System.Windows.Forms;
using ChumChumBakery.Core;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.WinForms.Forms
{
    public class FrmLogin : Form
    {
        private TextBox txtUser, txtPass;
        private Button btnLogin;
        private UserService _userService = new UserService();

        public FrmLogin()
        {
            this.Text = "Đăng nhập hệ thống - Chum Chum Bakery";
            this.Size = new Size(400, 300);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 10F);

            var lblTitle = new Label { Text = "ĐĂNG NHẬP", Font = new Font("Segoe UI", 16F, FontStyle.Bold), AutoSize = true, Location = new Point(130, 20) };
            
            var lblUser = new Label { Text = "Tài khoản:", Location = new Point(40, 80), AutoSize = true };
            txtUser = new TextBox { Location = new Point(130, 77), Width = 200 };

            var lblPass = new Label { Text = "Mật khẩu:", Location = new Point(40, 130), AutoSize = true };
            txtPass = new TextBox { Location = new Point(130, 127), Width = 200, PasswordChar = '*' };

            btnLogin = new Button { Text = "Đăng Nhập", Location = new Point(130, 180), Width = 200, Height = 40, BackColor = Color.FromArgb(139, 69, 19), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnLogin.FlatAppearance.BorderSize = 0;
            btnLogin.Click += BtnLogin_Click;

            var lblHint = new Label { Text = "(admin / admin123 | nhanvien / 123456)", Location = new Point(130, 230), AutoSize = true, ForeColor = Color.Gray, Font = new Font("Segoe UI", 8F) };

            this.Controls.AddRange(new Control[] { lblTitle, lblUser, txtUser, lblPass, txtPass, btnLogin, lblHint });
            
            this.AcceptButton = btnLogin;
        }

        private void BtnLogin_Click(object sender, EventArgs e)
        {
            var user = _userService.Authenticate(txtUser.Text, txtPass.Text);
            if (user != null)
            {
                Session.CurrentUser = user;
                this.DialogResult = DialogResult.OK;
                this.Close();
            }
            else
            {
                MessageBox.Show("Sai tài khoản hoặc mật khẩu!", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
