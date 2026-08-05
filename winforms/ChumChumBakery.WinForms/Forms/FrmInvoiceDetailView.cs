using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;
using ChumChumBakery.WinForms.Helpers;

namespace ChumChumBakery.WinForms.Forms
{
    public class FrmInvoiceDetailView : Form
    {
        private Invoice _invoice;
        private List<InvoiceDetail> _details;
        private InvoiceService _service = new InvoiceService();

        public FrmInvoiceDetailView(Invoice invoice)
        {
            _invoice = invoice;
            _details = _service.GetInvoiceDetails(invoice.Id);

            InitializeUI();
        }

        private void InitializeUI()
        {
            this.Text = $"Chi tiết Hóa đơn {_invoice.Code}";
            this.Size = new Size(800, 600);
            this.StartPosition = FormStartPosition.CenterParent;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 10F);

            // Header GroupBox
            var grpHeader = new GroupBox { Text = "Thông tin chung", Location = new Point(15, 10), Size = new Size(755, 100) };

            grpHeader.Controls.Add(new Label { Text = $"Mã HĐ: {_invoice.Code}", Font = new Font("Segoe UI", 11F, FontStyle.Bold), Location = new Point(20, 25), AutoSize = true });
            grpHeader.Controls.Add(new Label { Text = $"Loại: {(_invoice.Type == "in" ? "Nhập kho" : "Xuất kho")}", Location = new Point(250, 25), AutoSize = true });
            grpHeader.Controls.Add(new Label { Text = $"Ngày: {_invoice.InvDate:dd/MM/yyyy}", Location = new Point(450, 25), AutoSize = true });

            grpHeader.Controls.Add(new Label { Text = $"Đối tác: {_invoice.Partner}", Location = new Point(20, 60), AutoSize = true });
            grpHeader.Controls.Add(new Label { Text = $"Ghi chú: {_invoice.Note}", Location = new Point(350, 60), AutoSize = true });

            // DataGridView
            var grid = new DataGridView
            {
                Location = new Point(15, 120),
                Size = new Size(755, 370),
                AutoGenerateColumns = false,
                AllowUserToAddRows = false,
                AllowUserToDeleteRows = false,
                ReadOnly = true,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
                BackgroundColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle,
                RowHeadersVisible = false
            };
            grid.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(240, 240, 240);
            grid.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            grid.ColumnHeadersHeight = 35;
            grid.RowTemplate.Height = 30;

            grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "ProductName", HeaderText = "Tên Sản Phẩm / Nguyên Liệu", FillWeight = 200 });
            grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Unit", HeaderText = "ĐVT", FillWeight = 60 });
            grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Amount", HeaderText = "Số Lượng", FillWeight = 80, DefaultCellStyle = { Alignment = DataGridViewContentAlignment.MiddleCenter, Format = "N2" } });
            grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Price", HeaderText = "Đơn Giá", FillWeight = 100, DefaultCellStyle = { Alignment = DataGridViewContentAlignment.MiddleRight, Format = "N0" } });
            grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Subtotal", HeaderText = "Thành Tiền", FillWeight = 110, DefaultCellStyle = { Alignment = DataGridViewContentAlignment.MiddleRight, Format = "N0" } });

            grid.DataSource = _details;

            // Buttons
            var btnPrint = new Button
            {
                Text = "🖨️ In Hóa Đơn",
                Location = new Point(530, 505),
                Width = 120,
                Height = 40,
                BackColor = Color.FromArgb(33, 150, 243),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            btnPrint.FlatAppearance.BorderSize = 0;
            btnPrint.Click += (s, e) => InvoicePrintHelper.PrintInvoice(_invoice, _details);

            var btnClose = new Button
            {
                Text = "Đóng",
                Location = new Point(660, 505),
                Width = 110,
                Height = 40,
                BackColor = Color.Gray,
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            btnClose.FlatAppearance.BorderSize = 0;
            btnClose.Click += (s, e) => this.Close();

            this.Controls.AddRange(new Control[] { grpHeader, grid, btnPrint, btnClose });
        }
    }
}
