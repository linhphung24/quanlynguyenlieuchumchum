using System;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.WinForms.Forms
{
    /// <summary>
    /// Xem chi tiết Phiếu thu / Phiếu chi (read-only): thông tin phiếu,
    /// các dòng hạch toán (Diễn giải / TK Nợ / TK Có / Số tiền) và tổng, kèm nút in.
    /// </summary>
    public class FrmVoucherDetailView : Form
    {
        private CashVoucher _voucher;

        public FrmVoucherDetailView(CashVoucher voucher)
        {
            _voucher = voucher;
            InitializeUI();
        }

        private void InitializeUI()
        {
            bool isThu = _voucher.Type == "thu";
            this.Text = $"{(isThu ? "Phiếu Thu" : "Phiếu Chi")} {_voucher.Code}";
            this.Size = new Size(720, 700);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 10F);

            var grpInfo = new GroupBox { Text = "Thông tin phiếu", Location = new Point(10, 10), Size = new Size(680, 330) };

            int y = 35;
            void AddRow(string labelText, string valueText, bool bold = false)
            {
                grpInfo.Controls.Add(new Label { Text = labelText + ":", Location = new Point(20, y), AutoSize = true, ForeColor = Color.Gray });
                grpInfo.Controls.Add(new Label
                {
                    Text = string.IsNullOrEmpty(valueText) ? "—" : valueText,
                    Location = new Point(180, y),
                    Size = new Size(470, 24),
                    Font = new Font("Segoe UI", 10F, bold ? FontStyle.Bold : FontStyle.Regular)
                });
                y += 32;
            }

            AddRow("Loại phiếu", isThu ? "💵 Phiếu thu" : "💸 Phiếu chi", true);
            AddRow("Số phiếu", _voucher.Code, true);
            AddRow("Ngày phiếu", _voucher.VoucherDate.ToString("dd/MM/yyyy"));
            AddRow("Đối tượng", _voucher.Partner);
            AddRow("Địa chỉ", _voucher.PartnerAddress);
            AddRow(isThu ? "Người nộp tiền" : "Người nhận tiền", _voucher.Receiver);
            AddRow(isThu ? "Lý do nộp tiền" : "Lý do rút tiền", _voucher.Reason);
            AddRow("Hình thức thanh toán", _voucher.PaymentMethod);
            AddRow("Kèm theo", _voucher.AttachedDocs);
            AddRow("Ghi chú", _voucher.Note);

            // Bảng dòng hạch toán
            var grpAcc = new GroupBox { Text = "Hạch toán", Location = new Point(10, 350), Size = new Size(680, 200) };

            var grid = new DataGridView
            {
                Location = new Point(15, 28),
                Size = new Size(650, 110),
                AutoGenerateColumns = false,
                AllowUserToAddRows = false,
                ReadOnly = true,
                BackgroundColor = Color.White,
                RowHeadersVisible = false,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                EnableHeadersVisualStyles = false
            };
            grid.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(240, 240, 240);
            grid.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            grid.ColumnHeadersHeight = 30;
            grid.RowTemplate.Height = 27;
            grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Description", HeaderText = "Diễn giải", Width = 320 });
            grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "DebitAccount", HeaderText = "TK Nợ", Width = 80 });
            grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "CreditAccount", HeaderText = "TK Có", Width = 80 });
            grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Amount", HeaderText = "Số tiền", Width = 155, DefaultCellStyle = new DataGridViewCellStyle { Format = "N0", Alignment = DataGridViewContentAlignment.MiddleRight } });

            var details = new CashVoucherService().GetVoucherDetails(_voucher.Id);
            grid.DataSource = details;
            grpAcc.Controls.Add(grid);

            grpAcc.Controls.Add(new Label
            {
                Text = $"Tổng cộng: {_voucher.Amount:N0} VNĐ",
                Location = new Point(15, 148),
                AutoSize = true,
                Font = new Font("Segoe UI", 10F, FontStyle.Bold),
                ForeColor = Color.DarkRed
            });
            grpAcc.Controls.Add(new Label
            {
                Text = AmountInWords.ToVietnameseWords(_voucher.Amount),
                Location = new Point(230, 149),
                Size = new Size(435, 24),
                Font = new Font("Segoe UI", 9F, FontStyle.Italic),
                ForeColor = Color.FromArgb(90, 90, 90)
            });

            var btnClose = new Button { Text = "Đóng", Location = new Point(480, 610), Width = 90, Height = 40, BackColor = Color.FromArgb(224, 224, 224), FlatStyle = FlatStyle.Flat };
            btnClose.FlatAppearance.BorderSize = 0;
            btnClose.DialogResult = DialogResult.Cancel;

            var btnPrint = new Button { Text = "🖨️ In Phiếu", Location = new Point(580, 610), Width = 110, Height = 40, BackColor = Color.FromArgb(33, 150, 243), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnPrint.FlatAppearance.BorderSize = 0;
            btnPrint.Click += (s, e) => Helpers.VoucherPrintHelper.PrintVoucher(_voucher, details);

            this.Controls.AddRange(new Control[] { grpInfo, grpAcc, btnClose, btnPrint });
            this.CancelButton = btnClose;
        }
    }
}
