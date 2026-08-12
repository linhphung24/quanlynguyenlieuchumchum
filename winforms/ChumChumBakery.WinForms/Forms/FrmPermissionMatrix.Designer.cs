namespace ChumChumBakery.WinForms.Forms
{
    partial class FrmPermissionMatrix
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Component Designer generated code

        private void InitializeComponent()
        {
            this.pnlTop = new System.Windows.Forms.Panel();
            this.lblTitle = new System.Windows.Forms.Label();
            this.lblRole = new System.Windows.Forms.Label();
            this.cbRoleFilter = new System.Windows.Forms.ComboBox();
            this.btnSave = new System.Windows.Forms.Button();
            this.gridMatrix = new System.Windows.Forms.DataGridView();
            this.pnlTop.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.gridMatrix)).BeginInit();
            this.SuspendLayout();
            // 
            // pnlTop
            // 
            this.pnlTop.BackColor = System.Drawing.Color.White;
            this.pnlTop.Controls.Add(this.btnSave);
            this.pnlTop.Controls.Add(this.cbRoleFilter);
            this.pnlTop.Controls.Add(this.lblRole);
            this.pnlTop.Controls.Add(this.lblTitle);
            this.pnlTop.Dock = System.Windows.Forms.DockStyle.Top;
            this.pnlTop.Location = new System.Drawing.Point(12, 12);
            this.pnlTop.Name = "pnlTop";
            this.pnlTop.Size = new System.Drawing.Size(1016, 65);
            this.pnlTop.TabIndex = 0;
            // 
            // lblTitle
            // 
            this.lblTitle.AutoSize = true;
            this.lblTitle.Font = new System.Drawing.Font("Segoe UI", 11F, System.Drawing.FontStyle.Bold);
            this.lblTitle.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(61)))), ((int)(((byte)(31)))), ((int)(((byte)(10)))));
            this.lblTitle.Location = new System.Drawing.Point(14, 22);
            this.lblTitle.Name = "lblTitle";
            this.lblTitle.Size = new System.Drawing.Size(225, 20);
            this.lblTitle.TabIndex = 0;
            this.lblTitle.Text = "🛡 MA TRẬN PHÂN QUYỀN HỆ THỐNG";
            // 
            // lblRole
            // 
            this.lblRole.AutoSize = true;
            this.lblRole.Location = new System.Drawing.Point(280, 24);
            this.lblRole.Name = "lblRole";
            this.lblRole.Size = new System.Drawing.Size(53, 17);
            this.lblRole.TabIndex = 1;
            this.lblRole.Text = "Vai trò:";
            // 
            // cbRoleFilter
            // 
            this.cbRoleFilter.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbRoleFilter.FormattingEnabled = true;
            this.cbRoleFilter.Location = new System.Drawing.Point(340, 20);
            this.cbRoleFilter.Name = "cbRoleFilter";
            this.cbRoleFilter.Size = new System.Drawing.Size(180, 25);
            this.cbRoleFilter.TabIndex = 2;
            // 
            // btnSave
            // 
            this.btnSave.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(200)))), ((int)(((byte)(119)))), ((int)(((byte)(58)))));
            this.btnSave.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnSave.Font = new System.Drawing.Font("Segoe UI", 9.5F, System.Drawing.FontStyle.Bold);
            this.btnSave.ForeColor = System.Drawing.Color.White;
            this.btnSave.Location = new System.Drawing.Point(540, 16);
            this.btnSave.Name = "btnSave";
            this.btnSave.Size = new System.Drawing.Size(210, 32);
            this.btnSave.TabIndex = 3;
            this.btnSave.Text = "💾 Lưu Ma trận Phân quyền";
            this.btnSave.UseVisualStyleBackColor = false;
            // 
            // gridMatrix
            // 
            this.gridMatrix.AllowUserToAddRows = false;
            this.gridMatrix.AllowUserToDeleteRows = false;
            this.gridMatrix.AutoSizeColumnsMode = System.Windows.Forms.DataGridViewAutoSizeColumnsMode.Fill;
            this.gridMatrix.BackgroundColor = System.Drawing.Color.White;
            this.gridMatrix.BorderStyle = System.Windows.Forms.BorderStyle.None;
            this.gridMatrix.Dock = System.Windows.Forms.DockStyle.Fill;
            this.gridMatrix.Font = new System.Drawing.Font("Segoe UI", 9.5F);
            this.gridMatrix.Location = new System.Drawing.Point(12, 77);
            this.gridMatrix.Name = "gridMatrix";
            this.gridMatrix.RowHeadersVisible = false;
            this.gridMatrix.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
            this.gridMatrix.Size = new System.Drawing.Size(1016, 600);
            this.gridMatrix.TabIndex = 1;
            // 
            // FrmPermissionMatrix
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 17F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(253)))), ((int)(((byte)(246)))), ((int)(((byte)(236)))));
            this.Controls.Add(this.gridMatrix);
            this.Controls.Add(this.pnlTop);
            this.Font = new System.Drawing.Font("Segoe UI", 9.75F);
            this.Name = "FrmPermissionMatrix";
            this.Padding = new System.Windows.Forms.Padding(12);
            this.Size = new System.Drawing.Size(1040, 689);
            this.pnlTop.ResumeLayout(false);
            this.pnlTop.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.gridMatrix)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Panel pnlTop;
        private System.Windows.Forms.Label lblTitle;
        private System.Windows.Forms.Label lblRole;
        private System.Windows.Forms.ComboBox cbRoleFilter;
        private System.Windows.Forms.Button btnSave;
        private System.Windows.Forms.DataGridView gridMatrix;
    }
}
