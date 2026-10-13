using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;
using ChumChumBakery.Core;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.WinForms.Forms
{
    /// <summary>
    /// Form thêm / sửa Phiếu thu, Phiếu chi theo bố cục form MISA AMIS:
    /// khối thông tin 2 cột (Đối tượng, Người nhận tiền, Địa chỉ, Lý do...
    /// | Ngày phiếu, Số phiếu, Hình thức, Kèm theo), bảng dòng hạch toán
    /// (Diễn giải / TK Nợ / TK Có / Số tiền), dòng Tổng cộng và
    /// "Số tiền bằng chữ" tự tính theo tổng các dòng.
    /// </summary>
    public class FrmVoucherEdit : Form
    {
        private CashVoucherService _service = new CashVoucherService();
        private SupplierService _supplierService = new SupplierService();
        private List<Supplier> _suppliers = new List<Supplier>();
        private BindingList<CashVoucherDetail> _details = new BindingList<CashVoucherDetail>();

        // Khối thông tin
        private ComboBox cbType;
        private ComboBox cbPartner;
        private TextBox txtReceiver;
        private TextBox txtAddress;
        private TextBox txtReason;
        private DateTimePicker dtVoucherDate;
        private TextBox txtCode;
        private ComboBox cbMethod;
        private TextBox txtAttached;

        // Khối hạch toán
        private TextBox txtLineDesc;
        private TextBox txtLineDebit;
        private TextBox txtLineCredit;
        private NumericUpDown numLineAmount;
        private DataGridView gridDetails;
        private Label lblReceiver;
        private Label lblReason;
        private Label lblTotal;
        private TextBox txtAmountWords;
        private TextBox txtNote;
        private Button btnSave;

        private string _fixedType;
        private CashVoucher _editingVoucher;

        // Form bị chặn mở do không đủ quyền
        private bool _editBlocked;

        public FrmVoucherEdit(string fixedType = "")
        {
            _fixedType = fixedType;
            InitializeUI();
            LoadData();
        }

        public FrmVoucherEdit(CashVoucher voucherToEdit)
        {
            _fixedType = voucherToEdit.Type;
            _editingVoucher = voucherToEdit;

            // Kiểm tra lại quyền sửa theo loại phiếu (admin luôn qua)
            if (!Session.HasPermission(FeatureKeyFor(voucherToEdit.Type), "edit"))
            {
                _editBlocked = true;
                this.Shown += (s, e) =>
                {
                    MessageBox.Show(
                        "Bạn không có quyền sửa phiếu thu chi loại này!",
                        "Từ chối truy cập", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                    this.DialogResult = DialogResult.Cancel;
                    this.Close();
                };
                return;
            }

            InitializeUI();
            LoadData();
            LoadForEdit();
        }

        private static string FeatureKeyFor(string type) => type == "thu" ? "Menu_Vouchers_Thu" : "Menu_Vouchers_Chi";

        private string CurrentType => cbType.SelectedIndex == 0 ? "thu" : "chi";

        private void InitializeUI()
        {
            this.Text = GetTitleText();
            this.Size = new Size(820, 690);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 10F);

            // ===== Khối thông tin phiếu (2 cột như MISA) =====
            var grpInfo = new GroupBox { Text = "Thông tin phiếu", Location = new Point(10, 10), Size = new Size(785, 195) };

            // Cột trái: Đối tượng → Người nhận tiền → Địa chỉ → Lý do
            grpInfo.Controls.Add(new Label { Text = "Đối tượng:", Location = new Point(20, 33), AutoSize = true });
            cbPartner = new ComboBox { Location = new Point(115, 30), Width = 265 };
            cbPartner.AutoCompleteMode = AutoCompleteMode.SuggestAppend;
            cbPartner.AutoCompleteSource = AutoCompleteSource.ListItems;
            // Chọn NCC trong danh sách thì tự điền địa chỉ
            cbPartner.SelectedIndexChanged += (s, e) =>
            {
                string name = cbPartner.SelectedItem?.ToString() ?? "";
                var sup = _suppliers.FirstOrDefault(x => x.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
                if (sup != null && !string.IsNullOrWhiteSpace(sup.Address))
                {
                    txtAddress.Text = sup.Address;
                }
            };
            grpInfo.Controls.Add(cbPartner);

            lblReceiver = new Label { Text = "Người nhận tiền:", Location = new Point(20, 71), AutoSize = true };
            grpInfo.Controls.Add(lblReceiver);
            txtReceiver = new TextBox { Location = new Point(115, 68), Width = 265 };
            grpInfo.Controls.Add(txtReceiver);

            grpInfo.Controls.Add(new Label { Text = "Địa chỉ:", Location = new Point(20, 109), AutoSize = true });
            txtAddress = new TextBox { Location = new Point(115, 106), Width = 265 };
            grpInfo.Controls.Add(txtAddress);

            lblReason = new Label { Text = "Lý do rút tiền:", Location = new Point(20, 147), AutoSize = true };
            grpInfo.Controls.Add(lblReason);
            txtReason = new TextBox { Location = new Point(115, 144), Width = 265 };
            grpInfo.Controls.Add(txtReason);

            // Cột phải: Loại phiếu + Ngày phiếu / Số phiếu + Hình thức / Kèm theo
            grpInfo.Controls.Add(new Label { Text = "Loại phiếu:", Location = new Point(410, 33), AutoSize = true });
            cbType = new ComboBox { Location = new Point(520, 30), Width = 245, DropDownStyle = ComboBoxStyle.DropDownList };
            cbType.Items.AddRange(new[] { "Phiếu thu", "Phiếu chi" });
            // Set SelectedIndex trước, gắn handler sau — nếu không event nổ khi các control phía dưới chưa tạo
            cbType.SelectedIndex = _fixedType == "thu" ? 0 : 1;
            cbType.Enabled = string.IsNullOrEmpty(_fixedType) && _editingVoucher == null;
            grpInfo.Controls.Add(cbType);

            grpInfo.Controls.Add(new Label { Text = "Ngày phiếu:", Location = new Point(410, 71), AutoSize = true });
            dtVoucherDate = new DateTimePicker { Location = new Point(520, 68), Width = 120, Format = DateTimePickerFormat.Custom, CustomFormat = "dd/MM/yyyy" };
            grpInfo.Controls.Add(dtVoucherDate);

            grpInfo.Controls.Add(new Label { Text = "Số phiếu:", Location = new Point(410, 109), AutoSize = true });
            txtCode = new TextBox { Location = new Point(520, 106), Width = 120 };
            grpInfo.Controls.Add(txtCode);

            grpInfo.Controls.Add(new Label { Text = "Hình thức:", Location = new Point(410, 147), AutoSize = true });
            cbMethod = new ComboBox { Location = new Point(520, 144), Width = 120, DropDownStyle = ComboBoxStyle.DropDownList };
            cbMethod.Items.AddRange(new[] { "Tiền mặt", "Chuyển khoản", "Thẻ" });
            cbMethod.SelectedIndex = 0;
            grpInfo.Controls.Add(cbMethod);

            grpInfo.Controls.Add(new Label { Text = "Kèm theo:", Location = new Point(660, 109), AutoSize = true });
            txtAttached = new TextBox { Location = new Point(660, 131), Width = 105 };
            grpInfo.Controls.Add(txtAttached);

            // ===== Khối hạch toán: bảng dòng Diễn giải / TK Nợ / TK Có / Số tiền =====
            var grpAcc = new GroupBox { Text = "Hạch toán", Location = new Point(10, 215), Size = new Size(785, 330) };

            grpAcc.Controls.Add(new Label { Text = "Diễn giải:", Location = new Point(15, 33), AutoSize = true });
            txtLineDesc = new TextBox { Location = new Point(85, 30), Width = 230 };
            grpAcc.Controls.Add(txtLineDesc);

            grpAcc.Controls.Add(new Label { Text = "TK Nợ:", Location = new Point(320, 33), AutoSize = true });
            txtLineDebit = new TextBox { Location = new Point(375, 30), Width = 60, TextAlign = HorizontalAlignment.Center };
            grpAcc.Controls.Add(txtLineDebit);

            grpAcc.Controls.Add(new Label { Text = "TK Có:", Location = new Point(440, 33), AutoSize = true });
            txtLineCredit = new TextBox { Location = new Point(490, 30), Width = 60, TextAlign = HorizontalAlignment.Center };
            grpAcc.Controls.Add(txtLineCredit);

            grpAcc.Controls.Add(new Label { Text = "Số tiền:", Location = new Point(555, 33), AutoSize = true });
            numLineAmount = new NumericUpDown
            {
                Location = new Point(615, 30),
                Width = 130,
                Maximum = 999999999999,
                Increment = 1000,
                ThousandsSeparator = true
            };
            grpAcc.Controls.Add(numLineAmount);

            gridDetails = new DataGridView
            {
                Location = new Point(15, 65),
                Size = new Size(755, 160),
                AutoGenerateColumns = false,
                AllowUserToAddRows = false,
                AllowUserToDeleteRows = false,
                ReadOnly = true,
                BackgroundColor = Color.White,
                RowHeadersVisible = false,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                MultiSelect = false,
                EnableHeadersVisualStyles = false
            };
            gridDetails.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(240, 240, 240);
            gridDetails.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            gridDetails.ColumnHeadersHeight = 32;
            gridDetails.RowTemplate.Height = 28;
            gridDetails.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Description", HeaderText = "Diễn giải", Width = 380 });
            gridDetails.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "DebitAccount", HeaderText = "TK Nợ", Width = 90 });
            gridDetails.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "CreditAccount", HeaderText = "TK Có", Width = 90 });
            gridDetails.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Amount", HeaderText = "Số tiền", Width = 180, DefaultCellStyle = new DataGridViewCellStyle { Format = "N0", Alignment = DataGridViewContentAlignment.MiddleRight } });
            gridDetails.DataSource = _details;
            gridDetails.KeyDown += (s, e) =>
            {
                if (e.KeyCode == Keys.Delete) { RemoveSelectedLine(); e.Handled = true; }
            };
            grpAcc.Controls.Add(gridDetails);

            var btnAddLine = new Button { Text = "➕ Thêm dòng", Location = new Point(15, 232), Width = 105, Height = 32, BackColor = Color.FromArgb(33, 150, 243), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnAddLine.FlatAppearance.BorderSize = 0;
            btnAddLine.Click += (s, e) => AddLine();

            var btnRemoveLine = new Button { Text = "Xóa dòng", Location = new Point(125, 232), Width = 85, Height = 32, BackColor = Color.FromArgb(255, 152, 0), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnRemoveLine.FlatAppearance.BorderSize = 0;
            btnRemoveLine.Click += (s, e) => RemoveSelectedLine();

            grpAcc.Controls.Add(new Label { Text = "Tổng cộng:", Location = new Point(520, 238), AutoSize = true, Font = new Font("Segoe UI", 10F, FontStyle.Bold) });
            lblTotal = new Label
            {
                Text = "0 đ",
                Location = new Point(605, 238),
                Size = new Size(165, 20),
                TextAlign = ContentAlignment.MiddleRight,
                Font = new Font("Segoe UI", 10F, FontStyle.Bold),
                ForeColor = Color.DarkRed
            };
            grpAcc.Controls.Add(lblTotal);

            grpAcc.Controls.Add(new Label { Text = "Số tiền bằng chữ:", Location = new Point(15, 275), AutoSize = true, ForeColor = Color.FromArgb(90, 90, 90) });
            txtAmountWords = new TextBox
            {
                Location = new Point(145, 271),
                Width = 625,
                ReadOnly = true,
                BackColor = Color.WhiteSmoke,
                Font = new Font("Segoe UI", 9.5F, FontStyle.Italic)
            };
            grpAcc.Controls.Add(txtAmountWords);

            grpAcc.Controls.AddRange(new Control[] { btnAddLine, btnRemoveLine });

            // ===== Ghi chú + nút =====
            this.Controls.Add(new Label { Text = "Ghi chú:", Location = new Point(15, 555), AutoSize = true });
            txtNote = new TextBox { Location = new Point(80, 551), Width = 715 };
            this.Controls.Add(txtNote);

            var btnCancel = new Button { Text = "Hủy", Location = new Point(600, 595), Width = 90, Height = 40, BackColor = Color.FromArgb(224, 224, 224), FlatStyle = FlatStyle.Flat };
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.DialogResult = DialogResult.Cancel;

            // Nút Lưu xanh dương đậm kiểu MISA AMIS
            btnSave = new Button { Text = "Lưu Phiếu Chi", Location = new Point(700, 595), Width = 95, Height = 40, BackColor = Color.FromArgb(0, 120, 212), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.FlatAppearance.BorderSize = 0;
            btnSave.Click += BtnSave_Click;

            this.Controls.AddRange(new Control[] { grpInfo, grpAcc, btnCancel, btnSave });
            this.AcceptButton = btnSave;
            this.CancelButton = btnCancel;

            // Gắn handler đổi loại phiếu SAU khi mọi control đã tạo xong
            cbType.SelectedIndexChanged += (s, e) => UpdateTypeDependentUi();

            UpdateTypeDependentUi();
            UpdateTotalAndWords();
        }

        private string GetTitleText()
        {
            if (_editingVoucher != null)
                return $"Sửa {(_editingVoucher.Type == "thu" ? "Phiếu Thu" : "Phiếu Chi")} {_editingVoucher.Code}";
            return "Thêm mới Phiếu Chi";
        }

        // Nhãn / tiêu đề / số phiếu đổi theo loại phiếu (thu ↔ chi)
        private void UpdateTypeDependentUi()
        {
            bool isThu = CurrentType == "thu";
            lblReceiver.Text = isThu ? "Người nộp tiền:" : "Người nhận tiền:";
            lblReason.Text = isThu ? "Lý do nộp tiền:" : "Lý do rút tiền:";
            btnSave.Text = isThu ? "Lưu Phiếu Thu" : "Lưu Phiếu Chi";
            if (_editingVoucher == null)
            {
                this.Text = isThu ? "Thêm mới Phiếu Thu" : "Thêm mới Phiếu Chi";
                try { txtCode.Text = _service.NextCode(CurrentType); } catch { txtCode.Text = ""; }
            }
        }

        // Tổng tiền + số tiền bằng chữ tính từ các dòng hạch toán
        private void UpdateTotalAndWords()
        {
            decimal total = _details.Sum(d => d.Amount);
            lblTotal.Text = total.ToString("N0") + " đ";
            txtAmountWords.Text = total > 0 ? AmountInWords.ToVietnameseWords(total) : "";
        }

        private void LoadData()
        {
            _suppliers = _supplierService.GetAllSuppliers("");
            cbPartner.Items.Clear();
            foreach (var s in _suppliers)
            {
                cbPartner.Items.Add(s.Name);
            }
        }

        private void LoadForEdit()
        {
            cbType.SelectedIndex = _editingVoucher.Type == "thu" ? 0 : 1;
            dtVoucherDate.Value = _editingVoucher.VoucherDate;
            txtCode.Text = _editingVoucher.Code ?? "";
            cbPartner.Text = _editingVoucher.Partner ?? "";
            txtAddress.Text = _editingVoucher.PartnerAddress ?? "";
            txtReceiver.Text = _editingVoucher.Receiver ?? "";
            txtReason.Text = _editingVoucher.Reason ?? "";
            txtAttached.Text = _editingVoucher.AttachedDocs ?? "";
            txtNote.Text = _editingVoucher.Note ?? "";
            numLineAmount.Value = 0;

            int methodIndex = cbMethod.Items.IndexOf(_editingVoucher.PaymentMethod ?? "");
            cbMethod.SelectedIndex = methodIndex >= 0 ? methodIndex : 0;

            _details.Clear();
            foreach (var d in _service.GetVoucherDetails(_editingVoucher.Id))
            {
                _details.Add(d);
            }

            this.Text = $"Sửa {(CurrentType == "thu" ? "Phiếu Thu" : "Phiếu Chi")} {_editingVoucher.Code}";
            btnSave.Text = CurrentType == "thu" ? "Lưu Phiếu Thu" : "Lưu Phiếu Chi";
            UpdateTotalAndWords();
        }

        private void AddLine()
        {
            decimal amount = numLineAmount.Value;
            if (amount <= 0)
            {
                MessageBox.Show("Vui lòng nhập Số tiền của dòng lớn hơn 0.", "Cảnh báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                numLineAmount.Focus();
                return;
            }

            string desc = txtLineDesc.Text.Trim();
            if (string.IsNullOrWhiteSpace(desc))
            {
                desc = txtReason.Text.Trim(); // bỏ trống diễn giải thì lấy luôn lý do phiếu
            }

            _details.Add(new CashVoucherDetail
            {
                Description = desc,
                DebitAccount = txtLineDebit.Text.Trim(),
                CreditAccount = txtLineCredit.Text.Trim(),
                Amount = amount
            });

            txtLineDesc.Clear();
            txtLineDebit.Clear();
            txtLineCredit.Clear();
            numLineAmount.Value = 0;
            txtLineDesc.Focus();

            UpdateTotalAndWords();
        }

        private void RemoveSelectedLine()
        {
            if (gridDetails.CurrentRow != null && gridDetails.CurrentRow.DataBoundItem is CashVoucherDetail d)
            {
                _details.Remove(d);
                UpdateTotalAndWords();
            }
        }

        protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
        {
            // Đang ở hàng nhập dòng hạch toán: Enter = thêm dòng
            bool inEntryRow = ActiveControl == txtLineDesc || ActiveControl == txtLineDebit
                || ActiveControl == txtLineCredit || ActiveControl == numLineAmount;
            if (keyData == Keys.Enter && inEntryRow)
            {
                AddLine();
                return true;
            }
            if (keyData == Keys.Enter && ActiveControl != btnSave && ActiveControl != null)
            {
                SelectNextControl(ActiveControl, true, true, true, true);
                return true;
            }
            return base.ProcessCmdKey(ref msg, keyData);
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txtReason.Text.Trim()))
            {
                MessageBox.Show("Vui lòng nhập Lý do nộp / rút tiền.", "Cảnh báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtReason.Focus();
                return;
            }

            if (_details.Count == 0)
            {
                MessageBox.Show("Vui lòng thêm ít nhất 1 dòng hạch toán (Diễn giải / TK Nợ / TK Có / Số tiền).", "Cảnh báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtLineDesc.Focus();
                return;
            }

            foreach (var d in _details)
            {
                if (d.Amount <= 0)
                {
                    MessageBox.Show($"Dòng '{d.Description}' có số tiền không hợp lệ (phải lớn hơn 0).", "Cảnh báo Validation", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }
            }

            string code = txtCode.Text.Trim();
            if (string.IsNullOrWhiteSpace(code))
            {
                MessageBox.Show("Số phiếu không được để trống.", "Cảnh báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtCode.Focus();
                return;
            }

            try
            {
                int excludeId = _editingVoucher?.Id ?? 0;
                if (_service.CodeExists(code, excludeId))
                {
                    MessageBox.Show($"Số phiếu '{code}' đã tồn tại. Vui lòng dùng số phiếu khác.",
                        "Cảnh báo trùng số phiếu", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    txtCode.Focus();
                    return;
                }

                string partnerName = cbPartner.Text.Trim();
                // Đối tượng lạ thì tự thêm vào danh sách NCC (giống luồng hóa đơn)
                if (!string.IsNullOrEmpty(partnerName))
                {
                    if (!_suppliers.Any(s => s.Name.Equals(partnerName, StringComparison.OrdinalIgnoreCase)))
                    {
                        _supplierService.SaveSupplier(new Supplier { Name = partnerName });
                    }
                }

                var voucher = new CashVoucher
                {
                    Id = _editingVoucher?.Id ?? 0,
                    Type = CurrentType,
                    VoucherDate = dtVoucherDate.Value.Date,
                    Code = code,
                    Partner = partnerName,
                    PartnerAddress = txtAddress.Text.Trim(),
                    Receiver = txtReceiver.Text.Trim(),
                    Reason = txtReason.Text.Trim(),
                    PaymentMethod = cbMethod.Text,
                    AttachedDocs = txtAttached.Text.Trim(),
                    Note = txtNote.Text.Trim()
                    // Amount do service tính = tổng các dòng hạch toán
                };

                if (_editingVoucher != null)
                {
                    _service.UpdateVoucher(voucher, _details.ToList());
                    MessageBox.Show("Cập nhật phiếu thành công!", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                else
                {
                    _service.SaveVoucher(voucher, _details.ToList());
                    MessageBox.Show("Đã lưu phiếu thành công!", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }

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
