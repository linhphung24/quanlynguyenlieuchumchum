using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.WinForms.Forms
{
    public class FrmInvoiceEdit : Form
    {
        private InvoiceService _invoiceService = new InvoiceService();
        private ProductService _productService = new ProductService();
        private FifoBatchService _fifoService = new FifoBatchService();
        
        private ComboBox cbType;
        private DateTimePicker dtInvDate;
        private ComboBox cbPartner;
        private TextBox txtPartner; // Keeping reference for compatibility
        private TextBox txtNote;
        
        private ComboBox cbProducts;
        private TextBox txtAmount;
        private TextBox txtPrice;
        private Button btnAddItem;
        private DataGridView gridDetails;
        
        private BindingList<InvoiceDetail> _details = new BindingList<InvoiceDetail>();
        private List<Product> _allProducts = new List<Product>();
        private SupplierService _supplierService = new SupplierService();

        private string _fixedType;

        // Hóa đơn đang sửa (null = đang ở chế độ tạo mới)
        private Invoice _editingInvoice;

        // Form bị chặn mở do không đủ quyền sửa
        private bool _editBlocked;

        public FrmInvoiceEdit(string fixedType = "")
        {
            _fixedType = fixedType;
            InitializeUI();
            LoadData();
        }

        public FrmInvoiceEdit(Invoice invoiceToEdit)
        {
            _fixedType = invoiceToEdit.Type;
            _editingInvoice = invoiceToEdit;

            // Chỉ admin hoặc NGƯỜI TẠO hóa đơn (khi hóa đơn xuất còn chờ duyệt/từ chối) được sửa
            bool isAdmin = string.Equals(Core.Session.CurrentUser?.Role ?? "", "admin", StringComparison.OrdinalIgnoreCase);
            bool isCreatorPending = invoiceToEdit.Type == "out"
                && (invoiceToEdit.ApprovalStatus == "pending" || invoiceToEdit.ApprovalStatus == "rejected")
                && string.Equals(invoiceToEdit.CreatedBy ?? "", Core.Session.CurrentUser?.Username ?? "", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin && !isCreatorPending)
            {
                _editBlocked = true;
                this.Shown += (s, e) =>
                {
                    MessageBox.Show(
                        "Bạn chỉ được sửa hóa đơn XUẤT do chính mình tạo và đang CHỜ DUYỆT / TỪ CHỐI.\nHóa đơn đã duyệt chỉ QUẢN TRỊ VIÊN được sửa.",
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

        private void InitializeUI()
        {
            this.Text = _editingInvoice != null ? $"Sửa Hóa Đơn {_editingInvoice.Code}" : "Tạo Hóa Đơn Mới";
            this.Size = new Size(800, 600);
            this.StartPosition = FormStartPosition.CenterParent;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 10F);

            // Header info
            var grpInfo = new GroupBox { Text = "Thông tin chung", Location = new Point(10, 10), Size = new Size(760, 100) };
            
            grpInfo.Controls.Add(new Label { Text = "Loại HĐ:", Location = new Point(20, 30), AutoSize = true });
            cbType = new ComboBox { Location = new Point(90, 27), Width = 120, DropDownStyle = ComboBoxStyle.DropDownList };
            cbType.Items.AddRange(new[] { "Nhập kho", "Xuất kho" });
            
            if (_fixedType == "in")
            {
                cbType.SelectedIndex = 0;
                cbType.Enabled = false;
            }
            else if (_fixedType == "out")
            {
                cbType.SelectedIndex = 1;
                cbType.Enabled = false;
            }
            else
            {
                cbType.SelectedIndex = 0;
                cbType.Enabled = true;
            }
            // Chế độ sửa: khóa luôn loại hóa đơn (đổi loại tương đương xóa + tạo mới)
            if (_editingInvoice != null) cbType.Enabled = false;
            grpInfo.Controls.Add(cbType);

            grpInfo.Controls.Add(new Label { Text = "Ngày:", Location = new Point(230, 30), AutoSize = true });
            dtInvDate = new DateTimePicker { Location = new Point(280, 27), Width = 120, Format = DateTimePickerFormat.Custom, CustomFormat = "dd/MM/yyyy" };
            grpInfo.Controls.Add(dtInvDate);

            grpInfo.Controls.Add(new Label { Text = "Đối tác:", Location = new Point(420, 30), AutoSize = true });
            cbPartner = new ComboBox { Location = new Point(480, 27), Width = 260 };
            cbPartner.AutoCompleteMode = AutoCompleteMode.SuggestAppend;
            cbPartner.AutoCompleteSource = AutoCompleteSource.ListItems;
            grpInfo.Controls.Add(cbPartner);

            grpInfo.Controls.Add(new Label { Text = "Ghi chú:", Location = new Point(20, 65), AutoSize = true });
            txtNote = new TextBox { Location = new Point(90, 62), Width = 650 };
            grpInfo.Controls.Add(txtNote);

            // Add detail panel
            var grpAdd = new GroupBox { Text = "Thêm Sản Phẩm", Location = new Point(10, 120), Size = new Size(760, 70) };
            
            cbProducts = new ComboBox { Location = new Point(20, 30), Width = 300, DropDownStyle = ComboBoxStyle.DropDown };
            cbProducts.AutoCompleteMode = AutoCompleteMode.None;
            cbProducts.TextUpdate += CbProducts_TextUpdate;
            cbProducts.SelectedIndexChanged += (s, e) => {
                if (cbProducts.SelectedItem is Product p)
                {
                    if (cbType.SelectedIndex == 0)
                    {
                        txtPrice.Text = p.CostPrice.ToString("0.##");
                    }
                    else
                    {
                        decimal fifoPrice = _fifoService.GetOldestBatchPrice(p.Name, p.SellPrice);
                        txtPrice.Text = fifoPrice.ToString("0.##");
                    }
                }
            };
            grpAdd.Controls.Add(cbProducts);

            grpAdd.Controls.Add(new Label { Text = "SL:", Location = new Point(340, 33), AutoSize = true });
            txtAmount = new TextBox { Location = new Point(370, 30), Width = 80 };
            grpAdd.Controls.Add(txtAmount);

            grpAdd.Controls.Add(new Label { Text = "Đơn giá:", Location = new Point(470, 33), AutoSize = true });
            txtPrice = new TextBox { Location = new Point(530, 30), Width = 100 };
            grpAdd.Controls.Add(txtPrice);

            btnAddItem = new Button { Text = "Thêm", Location = new Point(650, 28), Width = 90, BackColor = Color.FromArgb(33, 150, 243), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnAddItem.FlatAppearance.BorderSize = 0;
            btnAddItem.Click += BtnAddItem_Click;
            grpAdd.Controls.Add(btnAddItem);

            // Grid
            gridDetails = new DataGridView
            {
                Location = new Point(10, 200),
                Size = new Size(760, 300),
                AutoGenerateColumns = false,
                AllowUserToAddRows = false,
                BackgroundColor = Color.WhiteSmoke,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                MultiSelect = false
            };
            gridDetails.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "ProductCode", HeaderText = "Mã SP", Width = 100 });
            gridDetails.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "ProductName", HeaderText = "Sản phẩm", Width = 250 });
            gridDetails.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Unit", HeaderText = "ĐVT Mặc định", Width = 90, ReadOnly = true });
            gridDetails.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Amount", HeaderText = "Số lượng", Width = 100 });
            gridDetails.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Price", HeaderText = "Đơn giá", Width = 120 });
            gridDetails.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Subtotal", HeaderText = "Thành tiền", Width = 120 });
            gridDetails.DataSource = _details;
            gridDetails.KeyDown += (s, e) =>
            {
                if (e.KeyCode == Keys.Delete) { RemoveSelectedItem(); e.Handled = true; }
            };

            // Buttons
            var btnReloadUnits = new Button { Text = "🔄 Nạp Lại ĐVT", Location = new Point(360, 510), Width = 150, Height = 40, BackColor = Color.FromArgb(0, 150, 136), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnReloadUnits.FlatAppearance.BorderSize = 0;
            btnReloadUnits.Click += (s, e) => ReloadUnitsFromCatalog();

            var btnRemoveItem = new Button { Text = "Xóa Dòng", Location = new Point(520, 510), Width = 120, Height = 40, BackColor = Color.FromArgb(255, 152, 0), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnRemoveItem.FlatAppearance.BorderSize = 0;
            btnRemoveItem.Click += (s, e) => RemoveSelectedItem();

            var btnSave = new Button { Text = "Lưu Hóa Đơn", Location = new Point(650, 510), Width = 120, Height = 40, BackColor = Color.FromArgb(76, 175, 80), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.FlatAppearance.BorderSize = 0;
            btnSave.Click += BtnSave_Click;

            this.Controls.AddRange(new Control[] { grpInfo, grpAdd, gridDetails, btnReloadUnits, btnRemoveItem, btnSave });
        }

        private void ReloadUnitsFromCatalog()
        {
            try
            {
                _allProducts = _productService.GetAllProducts("");
                cbProducts.Items.Clear();
                foreach (var p in _allProducts) { cbProducts.Items.Add(p); }

                int count = 0;
                for (int i = 0; i < _details.Count; i++)
                {
                    var d = _details[i];
                    var p = _allProducts.FirstOrDefault(prod =>
                        (d.ProductId > 0 && prod.Id == d.ProductId) ||
                        string.Equals(RemoveDiacritics(prod.Name).Trim(), RemoveDiacritics(d.ProductName ?? "").Trim(), StringComparison.OrdinalIgnoreCase));

                    if (p != null)
                    {
                        if (d.Unit != p.Unit || d.ProductId != p.Id)
                        {
                            count++;
                            d.Unit = p.Unit;
                            d.ProductId = p.Id;
                            d.ProductCode = p.Code;
                            _details[i] = d;
                        }
                    }
                }
                gridDetails.Refresh();

                MessageBox.Show($"Đã đồng bộ lại ĐVT từ danh mục sản phẩm!\n- Cập nhật: {count} dòng thay đổi ĐVT.\n- Danh mục: {_allProducts.Count} sản phẩm.",
                    "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi khi nạp lại đơn vị tính: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void RemoveSelectedItem()
        {
            if (gridDetails.CurrentRow != null && gridDetails.CurrentRow.DataBoundItem is InvoiceDetail d)
            {
                _details.Remove(d);
            }
        }

        private void LoadForEdit()
        {
            dtInvDate.Value = _editingInvoice.InvDate;
            cbPartner.Text = _editingInvoice.Partner ?? "";
            txtNote.Text = _editingInvoice.Note ?? "";

            foreach (var d in _invoiceService.GetInvoiceDetails(_editingInvoice.Id))
            {
                _details.Add(d);
            }
        }

        private void LoadData()
        {
            _allProducts = _productService.GetAllProducts("");
            cbProducts.Items.Clear();
            foreach (var p in _allProducts) { cbProducts.Items.Add(p); }

            var suppliers = _supplierService.GetAllSuppliers("");
            foreach (var s in suppliers)
            {
                cbPartner.Items.Add(s.Name);
            }
        }

        private void BtnAddItem_Click(object sender, EventArgs e)
        {
            // Validate Số lượng
            if (!decimal.TryParse(txtAmount.Text.Trim(), out decimal amt) || amt <= 0)
            {
                MessageBox.Show("Vui lòng nhập Số lượng hợp lệ (lớn hơn 0).", "Cảnh báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtAmount.Focus();
                return;
            }

            // Validate Đơn giá
            if (!decimal.TryParse(txtPrice.Text.Trim(), out decimal price) || price <= 0)
            {
                MessageBox.Show("Vui lòng nhập Đơn giá hợp lệ (lớn hơn 0).", "Cảnh báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtPrice.Focus();
                return;
            }

            Product selectedProduct = null;
            if (cbProducts.SelectedItem is Product p)
            {
                selectedProduct = p;
            }
            else
            {
                string typedName = RemoveDiacritics(cbProducts.Text.Trim());
                selectedProduct = _allProducts.FirstOrDefault(x => 
                    RemoveDiacritics(x.Name).Equals(typedName, StringComparison.OrdinalIgnoreCase) || 
                    RemoveDiacritics(x.Code).Equals(typedName, StringComparison.OrdinalIgnoreCase));
            }

            if (selectedProduct == null)
            {
                MessageBox.Show("Vui lòng chọn hoặc nhập đúng tên sản phẩm có trong danh mục.", "Cảnh báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                cbProducts.Focus();
                return;
            }

            // Chống thêm trùng sản phẩm: hỏi gộp số lượng vào dòng cũ hay thêm dòng riêng
            var existing = _details.FirstOrDefault(d =>
                d.ProductId == selectedProduct.Id ||
                string.Equals((d.ProductName ?? "").Trim(), selectedProduct.Name.Trim(), StringComparison.OrdinalIgnoreCase));

            if (existing != null)
            {
                bool samePrice = existing.Price == price;
                var choice = MessageBox.Show(
                    $"Sản phẩm '{selectedProduct.Name}' đã có trong hóa đơn (SL hiện có: {existing.Amount:0.##}, đơn giá: {existing.Price:0.##}).\n\n" +
                    (samePrice
                        ? $"Yes: gộp thêm {amt:0.##} vào dòng hiện có\nNo: vẫn thêm thành dòng riêng"
                        : $"Đơn giá vừa nhập ({price:0.##}) khác dòng hiện có.\nYes: gộp số lượng và GIỮ nguyên đơn giá cũ\nNo: thêm dòng riêng (hợp lệ khi nhập 2 lô khác giá)"),
                    "Sản phẩm đã có trong hóa đơn", MessageBoxButtons.YesNo, MessageBoxIcon.Question);

                if (choice == DialogResult.Yes)
                {
                    existing.Amount += amt;
                    // Gán lại để BindingList báo lưới refresh (Subtotal là property tính toán)
                    _details[_details.IndexOf(existing)] = existing;
                    txtAmount.Clear();
                    txtPrice.Clear();
                    cbProducts.Focus();
                    return;
                }
            }

            _details.Add(new InvoiceDetail
            {
                ProductId = selectedProduct.Id,
                ProductCode = selectedProduct.Code,
                ProductName = selectedProduct.Name,
                Unit = selectedProduct.Unit,
                Amount = amt,
                Price = price
            });

            txtAmount.Clear();
            txtPrice.Clear();
            cbProducts.Focus();
        }

        private string RemoveDiacritics(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return text;
            text = text.ToLowerInvariant().Replace('đ', 'd');
            var formD = text.Normalize(System.Text.NormalizationForm.FormD);
            var sb = new System.Text.StringBuilder();
            foreach (char ch in formD)
            {
                var uc = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(ch);
                if (uc != System.Globalization.UnicodeCategory.NonSpacingMark)
                {
                    sb.Append(ch);
                }
            }
            return sb.ToString().Normalize(System.Text.NormalizationForm.FormC);
        }

        private bool _isFiltering = false;

        private void CbProducts_TextUpdate(object sender, EventArgs e)
        {
            if (_isFiltering) return;
            
            string keyword = cbProducts.Text;
            string search = RemoveDiacritics(keyword);
            
            var filtered = string.IsNullOrWhiteSpace(search) 
                ? _allProducts 
                : _allProducts.Where(p => 
                    RemoveDiacritics(p.Name).Contains(search) || 
                    RemoveDiacritics(p.Code).Contains(search)).ToList();
                    
            _isFiltering = true;
            
            cbProducts.Items.Clear();
            
            if (filtered.Count > 0)
            {
                foreach (var p in filtered) { cbProducts.Items.Add(p); }
                cbProducts.DroppedDown = true;
            }
            else
            {
                cbProducts.Items.Add("Không tìm thấy kết quả");
                cbProducts.DroppedDown = true;
            }
            
            cbProducts.Text = keyword;
            cbProducts.SelectionStart = keyword.Length;
            Cursor.Current = Cursors.Default;
            
            _isFiltering = false;
        }

        protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
        {
            if (keyData == Keys.Enter && !gridDetails.Focused)
            {
                if (this.ActiveControl == txtPrice || this.ActiveControl == btnAddItem)
                {
                    BtnAddItem_Click(this, EventArgs.Empty);
                    return true;
                }

                this.SelectNextControl(this.ActiveControl, true, true, true, true);
                return true;
            }
            return base.ProcessCmdKey(ref msg, keyData);
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (_details.Count == 0)
            {
                MessageBox.Show("Vui lòng thêm ít nhất 1 sản phẩm vào hóa đơn.", "Cảnh báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            // Validate toàn bộ các dòng trước khi lưu
            foreach (var d in _details)
            {
                if (d.Amount <= 0)
                {
                    MessageBox.Show($"Sản phẩm '{d.ProductName}' có số lượng không hợp lệ (bằng 0 hoặc nhỏ hơn 0). Vui lòng kiểm tra lại!", "Cảnh báo Validation", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }
                if (d.Price <= 0)
                {
                    // Tạo mới: yêu cầu giá > 0. Sửa: cho giữ nguyên dòng giá 0 lịch sử
                    // để không chặn việc sửa toàn bộ hóa đơn cũ (vd HĐ18 có dòng tặng kèm giá 0)
                    if (_editingInvoice == null || d.Price < 0)
                    {
                        MessageBox.Show($"Sản phẩm '{d.ProductName}' có đơn giá không hợp lệ (bằng 0 hoặc nhỏ hơn 0). Vui lòng kiểm tra lại!", "Cảnh báo Validation", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        return;
                    }
                }
            }

            var inv = new Invoice
            {
                Type = cbType.SelectedIndex == 0 ? "in" : "out",
                InvDate = dtInvDate.Value,
                // Giữ nguyên mã khi sửa; mã mới chỉ sinh khi tạo
                Code = _editingInvoice != null ? _editingInvoice.Code : "HD-" + DateTime.Now.ToString("yyMMddHHmmss"),
                Partner = cbPartner.Text.Trim(),
                Note = txtNote.Text
            };

            try
            {
                string partnerName = inv.Partner;
                if (!string.IsNullOrEmpty(partnerName))
                {
                    var suppliers = _supplierService.GetAllSuppliers("");
                    if (!suppliers.Any(s => s.Name.Equals(partnerName, StringComparison.OrdinalIgnoreCase)))
                    {
                        _supplierService.SaveSupplier(new Supplier { Name = partnerName });
                    }
                }

                // Chặn xuất vượt tồn (FIFO không đủ hàng để trừ).
                // Hóa đơn xuất CHƯA DUYỆT thì chưa tính vào kho nên bỏ qua kiểm tra ở đây —
                // sẽ được kiểm tra đầy đủ ở bước kế toán duyệt (PreviewApprovalViolations).
                List<string> warnings;
                bool editingUnapprovedOut = _editingInvoice != null
                    && _editingInvoice.Type == "out"
                    && _editingInvoice.ApprovalStatus != "approved";
                bool willBeCounted = inv.Type != "out"
                    || Core.Session.HasPermission("Menu_Invoices_Export", "edit");

                if (_editingInvoice != null && !editingUnapprovedOut)
                {
                    warnings = _invoiceService.ValidateFifoTimeline(_editingInvoice.Id, inv.InvDate, inv.Type, _details.ToList());
                }
                else if (_editingInvoice == null && inv.Type == "out" && willBeCounted)
                {
                    warnings = _invoiceService.ValidateFifoTimeline(0, inv.InvDate, inv.Type, _details.ToList());
                }
                else
                {
                    warnings = new List<string>();
                }

                if (warnings.Count > 0)
                {
                    var proceed = MessageBox.Show(
                        "Hóa đơn này khiến các sản phẩm sau bị âm kho:\n\n• " + string.Join("\n• ", warnings) +
                        "\n\nLưu ý: một số sản phẩm có thể đã âm sẵn từ dữ liệu lịch sử (chưa khai tồn đầu kỳ).\n\n" +
                        "Nhấn [CÓ] để LƯU hóa đơn ngay.\nNhấn [KHÔNG] để quay lại chỉnh sửa tiếp (chưa lưu gì).",
                        "Cảnh báo tồn kho", MessageBoxButtons.YesNo, MessageBoxIcon.Warning,
                        MessageBoxDefaultButton.Button1);
                    if (proceed != DialogResult.Yes)
                    {
                        return;
                    }
                }

                if (_editingInvoice != null)
                {
                    _invoiceService.UpdateInvoice(_editingInvoice.Id, inv, _details.ToList());
                    string doneMsg = editingUnapprovedOut
                        ? "Đã cập nhật hóa đơn — hóa đơn VẪN CHỜ DUYỆT (chưa tính vào tồn kho)."
                        : "Cập nhật hóa đơn thành công! Lô hàng đã được tính lại theo FIFO.";
                    MessageBox.Show(doneMsg, "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                else
                {
                    string status = _invoiceService.SaveInvoice(inv, _details.ToList());
                    if (status == "pending")
                    {
                        MessageBox.Show("Đã lưu hóa đơn xuất — CHỜ KẾ TOÁN DUYỆT.\nHóa đơn CHƯA được tính vào tồn kho cho đến khi được duyệt.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                    else
                    {
                        MessageBox.Show("Thêm hóa đơn thành công!", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
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
