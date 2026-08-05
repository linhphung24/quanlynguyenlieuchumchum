using System;
using System.Windows.Forms;
using ChumChumBakery.Core.Data;
using System.Data.SqlClient;

namespace ChumChumBakery.WinForms.Forms
{
    public partial class FrmConnection : Form
    {
        public bool IsConnectedSuccessfully { get; private set; } = false;

        public FrmConnection()
        {
            InitializeComponent();
            SetupHandlers();
            LoadCurrentConfig();
        }

        private void SetupHandlers()
        {
            chkWindowsAuth.CheckedChanged += (s, e) =>
            {
                txtUsername.Enabled = !chkWindowsAuth.Checked;
                txtPassword.Enabled = !chkWindowsAuth.Checked;
            };

            btnTest.Click += (s, e) => TestConnection(showSuccessMessage: true);
            btnSave.Click += (s, e) => SaveAndProceed();
        }

        private void LoadCurrentConfig()
        {
            var config = AppConfigHelper.LoadConfig();
            txtServer.Text = config.Server;
            txtDatabase.Text = config.Database;
            chkWindowsAuth.Checked = config.IntegratedSecurity;
            txtUsername.Text = config.Username;
            txtPassword.Text = config.Password;

            txtUsername.Enabled = !config.IntegratedSecurity;
            txtPassword.Enabled = !config.IntegratedSecurity;
        }

        private DbConfig GetFormConfig()
        {
            return new DbConfig
            {
                Server = txtServer.Text.Trim(),
                Database = txtDatabase.Text.Trim(),
                IntegratedSecurity = chkWindowsAuth.Checked,
                Username = txtUsername.Text.Trim(),
                Password = txtPassword.Text
            };
        }

        private bool TestConnection(bool showSuccessMessage)
        {
            var config = GetFormConfig();
            var connStr = AppConfigHelper.BuildConnectionString(config);

            try
            {
                using var conn = new SqlConnection(connStr);
                conn.Open();
                if (showSuccessMessage)
                {
                    MessageBox.Show("⚡ Kết nối tới Máy chủ SQL Server thành công!", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                return true;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"❌ Không thể kết nối tới SQL Server Server:\n{ex.Message}\n\nVui lòng kiểm tra lại địa chỉ IP, tên CSDL hoặc cấu hình Tường lửa (Firewall) trên máy chủ.", "Lỗi Kết Nối", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return false;
            }
        }

        private void SaveAndProceed()
        {
            if (TestConnection(showSuccessMessage: false))
            {
                var config = GetFormConfig();
                AppConfigHelper.SaveConfig(config);
                IsConnectedSuccessfully = true;
                this.DialogResult = DialogResult.OK;
                this.Close();
            }
        }
    }
}
