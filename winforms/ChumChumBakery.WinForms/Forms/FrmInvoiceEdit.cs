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

        public FrmInvoiceEdit(string fixedType = "")
        {
            _fixedType = fixedType;
            InitializeUI();
            LoadData();
        }

        private void InitializeUI()
        {
            this.Text = "Tạo Hóa Đơn Mới";
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
            grpInfo.Controls.Add(cbType);

            grpInfo.Controls.Add(new Label { Text = "Ngày:", Location = new Point(230, 30), AutoSize = true });
            dtInvDate = new DateTimePicker { Location = new Point(280, 27), Width = 120, Format = DateTimePickerFormat.Short };
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
            gridDetails.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Unit", HeaderText = "ĐVT", Width = 80 });
            gridDetails.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Amount", HeaderText = "Số lượng", Width = 100 });
            gridDetails.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Price", HeaderText = "Đơn giá", Width = 120 });
            gridDetails.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Subtotal", HeaderText = "Thành tiền", Width = 120 });
            gridDetails.DataSource = _details;

            // Buttons
            var btnSave = new Button { Text = "Lưu Hóa Đơn", Location = new Point(650, 510), Width = 120, Height = 40, BackColor = Color.FromArgb(76, 175, 80), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.FlatAppearance.BorderSize = 0;
            btnSave.Click += BtnSave_Click;

            this.Controls.AddRange(new Control[] { grpInfo, grpAdd, gridDetails, btnSave });
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
                    MessageBox.Show($"Sản phẩm '{d.ProductName}' có đơn giá không hợp lệ (bằng 0 hoặc nhỏ hơn 0). Vui lòng kiểm tra lại!", "Cảnh báo Validation", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }
            }

            var inv = new Invoice
            {
                Type = cbType.SelectedIndex == 0 ? "in" : "out",
                InvDate = dtInvDate.Value,
                Code = "HD-" + DateTime.Now.ToString("yyMMddHHmmss"), // Include seconds to prevent unique key violation
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

                _invoiceService.SaveInvoice(inv, _details.ToList());
                MessageBox.Show("Thêm hóa đơn thành công!", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
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
