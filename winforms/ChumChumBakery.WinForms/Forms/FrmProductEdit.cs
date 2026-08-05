using System;
using System.Drawing;
using System.Windows.Forms;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.WinForms.Forms
{
    public class FrmProductEdit : Form
    {
        private Product _product;
        private ProductService _service = new ProductService();
        
        private TextBox txtCode, txtName, txtCategory, txtUnit, txtSupplier, txtDescription;
        private NumericUpDown numCostPrice, numSellPrice, numStockQty, numMinStock;
        private Button btnSave, btnCancel;

        public FrmProductEdit(Product product = null)
        {
            _product = product ?? new Product();
            InitializeUI();
            LoadData();
        }

        private void InitializeUI()
        {
            this.Text = _product.Id == 0 ? "Thêm Sản Phẩm Mới" : "Sửa Sản Phẩm";
            this.Size = new Size(500, 500);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Font = new Font("Segoe UI", 10F);
            this.BackColor = Color.White;

            int y = 20;
            int gap = 35;
            
            // Hàm helper tạo control
            void AddRow(string labelText, Control inputControl)
            {
                var lbl = new Label { Text = labelText, AutoSize = true, Location = new Point(30, y + 4) };
                inputControl.Location = new Point(150, y);
                inputControl.Width = 300;
                this.Controls.Add(lbl);
                this.Controls.Add(inputControl);
                y += gap;
            }

            txtCode = new TextBox(); AddRow("Mã SP:", txtCode);
            txtName = new TextBox(); AddRow("Tên Sản Phẩm (*):", txtName);
            txtCategory = new TextBox(); AddRow("Danh Mục:", txtCategory);
            txtUnit = new TextBox(); AddRow("ĐVT:", txtUnit);
            
            numCostPrice = new NumericUpDown { Maximum = 999999999, DecimalPlaces = 0, Increment = 1000, ThousandsSeparator = true }; AddRow("Giá Nhập:", numCostPrice);
            numSellPrice = new NumericUpDown { Maximum = 999999999, DecimalPlaces = 0, Increment = 1000, ThousandsSeparator = true }; AddRow("Giá Bán:", numSellPrice);
            numStockQty = new NumericUpDown { Maximum = 99999, DecimalPlaces = 2 }; AddRow("Tồn Kho:", numStockQty);
            numMinStock = new NumericUpDown { Maximum = 99999, DecimalPlaces = 2 }; AddRow("Tồn Tối Thiểu:", numMinStock);
            
            txtSupplier = new TextBox(); AddRow("Nhà Cung Cấp:", txtSupplier);
            txtDescription = new TextBox { Multiline = true, Height = 60 }; AddRow("Ghi chú:", txtDescription);
            
            y += 20;
            
            btnSave = new Button { Text = "Lưu lại", Width = 100, Height = 35, Location = new Point(240, y), BackColor = Color.FromArgb(76, 175, 80), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.FlatAppearance.BorderSize = 0;
            btnSave.Click += BtnSave_Click;
            
            btnCancel = new Button { Text = "Hủy bỏ", Width = 100, Height = 35, Location = new Point(350, y), BackColor = Color.FromArgb(224, 224, 224), FlatStyle = FlatStyle.Flat };
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Click += (s, e) => { this.DialogResult = DialogResult.Cancel; this.Close(); };
            
            this.Controls.Add(btnSave);
            this.Controls.Add(btnCancel);
            
            this.AcceptButton = btnSave;
            this.CancelButton = btnCancel;
        }

        private void LoadData()
        {
            txtCode.Text = _product.Code;
            txtName.Text = _product.Name;
            txtCategory.Text = _product.Category;
            txtUnit.Text = _product.Unit;
            numCostPrice.Value = _product.CostPrice;
            numSellPrice.Value = _product.SellPrice;
            numStockQty.Value = _product.StockQty;
            numMinStock.Value = _product.MinStock;
            txtSupplier.Text = _product.Supplier;
            txtDescription.Text = _product.Description;
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txtName.Text))
            {
                MessageBox.Show("Vui lòng nhập tên sản phẩm!", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                txtName.Focus();
                return;
            }

            _product.Code = txtCode.Text.Trim();
            _product.Name = txtName.Text.Trim();
            _product.Category = string.IsNullOrWhiteSpace(txtCategory.Text) ? "Khác" : txtCategory.Text.Trim();
            _product.Unit = string.IsNullOrWhiteSpace(txtUnit.Text) ? "kg" : txtUnit.Text.Trim();
            _product.CostPrice = numCostPrice.Value;
            _product.SellPrice = numSellPrice.Value;
            _product.StockQty = numStockQty.Value;
            _product.MinStock = numMinStock.Value;
            _product.Supplier = txtSupplier.Text.Trim();
            _product.Description = txtDescription.Text.Trim();

            try
            {
                _service.SaveProduct(_product);
                this.DialogResult = DialogResult.OK;
                this.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi khi lưu sản phẩm: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
