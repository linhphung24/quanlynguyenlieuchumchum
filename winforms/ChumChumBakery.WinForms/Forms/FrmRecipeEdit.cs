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
    public class FrmRecipeEdit : Form
    {
        private Recipe _recipe;
        private BindingList<RecipeIngredient> _ingredients;
        private RecipeService _service = new RecipeService();
        private ProductService _productService = new ProductService();
        private List<Product> _allProducts;
        
        private TextBox txtName;
        private NumericUpDown numYield;
        private DataGridView gridIng;
        private Button btnSave, btnCancel;
        
        public FrmRecipeEdit(Recipe r = null, List<RecipeIngredient> ingList = null)
        {
            _recipe = r ?? new Recipe();
            _ingredients = new BindingList<RecipeIngredient>(ingList ?? new List<RecipeIngredient>());
            _allProducts = _productService.GetAllProducts();
            
            InitializeUI();
            LoadData();
        }
        
        private void InitializeUI()
        {
            this.Text = _recipe.Id == 0 ? "Thêm Công Thức Mới" : "Sửa Công Thức";
            this.Size = new Size(600, 600);
            this.StartPosition = FormStartPosition.CenterParent;
            this.Font = new Font("Segoe UI", 10F);
            this.BackColor = Color.White;
            
            var pnlTop = new Panel { Dock = DockStyle.Top, Height = 100 };
            
            var lbl1 = new Label { Text = "Tên Công Thức:", AutoSize = true, Location = new Point(20, 20) };
            txtName = new TextBox { Location = new Point(150, 17), Width = 300 };
            
            var lbl2 = new Label { Text = "Sản lượng chuẩn:", AutoSize = true, Location = new Point(20, 60) };
            numYield = new NumericUpDown { Location = new Point(150, 57), Width = 100, Maximum = 9999, DecimalPlaces = 2, Value = 1 };
            var lbl3 = new Label { Text = "(Dùng làm mốc chia tỷ lệ tính toán)", AutoSize = true, Location = new Point(260, 60), ForeColor = Color.Gray };
            
            pnlTop.Controls.AddRange(new Control[] { lbl1, txtName, lbl2, numYield, lbl3 });
            
            var pnlBottom = new Panel { Dock = DockStyle.Bottom, Height = 60 };
            btnSave = new Button { Text = "Lưu lại", Width = 100, Height = 35, Location = new Point(190, 10), BackColor = Color.FromArgb(76, 175, 80), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.FlatAppearance.BorderSize = 0;
            btnSave.Click += BtnSave_Click;
            
            btnCancel = new Button { Text = "Hủy", Width = 100, Height = 35, Location = new Point(310, 10), BackColor = Color.LightGray, FlatStyle = FlatStyle.Flat };
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Click += (s, e) => { this.DialogResult = DialogResult.Cancel; this.Close(); };
            
            pnlBottom.Controls.AddRange(new Control[] { btnSave, btnCancel });
            
            gridIng = new DataGridView
            {
                Dock = DockStyle.Fill,
                AutoGenerateColumns = false,
                AllowUserToAddRows = true,
                AllowUserToDeleteRows = true,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
                BackgroundColor = Color.WhiteSmoke,
                EnableHeadersVisualStyles = false
            };
            gridIng.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(240, 240, 240);
            gridIng.ColumnHeadersHeight = 35;
            gridIng.RowTemplate.Height = 30;
            gridIng.DataError += (s, e) => e.ThrowException = false; // Bỏ qua lỗi format
            
            // Cột ComboBox chọn Nguyên liệu
            var colProd = new DataGridViewComboBoxColumn
            {
                DataPropertyName = "ProductName",
                HeaderText = "Nguyên Liệu",
                DataSource = _allProducts.Select(p => p.Name).ToList(),
                FillWeight = 200,
                FlatStyle = FlatStyle.Flat
            };
            
            var colAmt = new DataGridViewTextBoxColumn
            {
                DataPropertyName = "Amount",
                HeaderText = "Số lượng",
                DefaultCellStyle = new DataGridViewCellStyle { Format = "N2", Alignment = DataGridViewContentAlignment.MiddleRight }
            };
            
            var colUnit = new DataGridViewTextBoxColumn
            {
                DataPropertyName = "Unit",
                HeaderText = "ĐVT",
                FillWeight = 60
            };
            
            gridIng.Columns.AddRange(colProd, colAmt, colUnit);
            
            // Xử lý tự động điền ĐVT khi chọn nguyên liệu
            gridIng.CellValueChanged += GridIng_CellValueChanged;
            gridIng.CurrentCellDirtyStateChanged += (s, e) => 
            {
                if (gridIng.IsCurrentCellDirty) gridIng.CommitEdit(DataGridViewDataErrorContexts.Commit);
            };

            var pnlMiddle = new Panel { Dock = DockStyle.Fill, Padding = new Padding(10) };
            var lblGrid = new Label { Text = "Danh sách thành phần (Nguyên liệu):", Dock = DockStyle.Top, Height = 30, Font = new Font("Segoe UI", 10F, FontStyle.Bold) };
            pnlMiddle.Controls.Add(gridIng);
            pnlMiddle.Controls.Add(lblGrid);
            
            this.Controls.Add(pnlMiddle);
            this.Controls.Add(pnlTop);
            this.Controls.Add(pnlBottom);
        }
        
        private void GridIng_CellValueChanged(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex >= 0 && e.ColumnIndex == 0) // Cột ProductName
            {
                var val = gridIng.Rows[e.RowIndex].Cells[0].Value?.ToString();
                var prod = _allProducts.FirstOrDefault(p => p.Name == val);
                if (prod != null)
                {
                    gridIng.Rows[e.RowIndex].Cells[2].Value = prod.Unit; // Cột Unit
                }
            }
        }

        private void LoadData()
        {
            txtName.Text = _recipe.Name;
            numYield.Value = _recipe.BaseYield > 0 ? _recipe.BaseYield : 1;
            gridIng.DataSource = _ingredients;
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txtName.Text))
            {
                MessageBox.Show("Tên công thức không được để trống.", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            
            _recipe.Name = txtName.Text.Trim();
            _recipe.BaseYield = numYield.Value;
            
            var ings = _ingredients.Where(i => !string.IsNullOrWhiteSpace(i.ProductName) && i.Amount > 0).ToList();
            if (ings.Count == 0)
            {
                if (MessageBox.Show("Công thức chưa có nguyên liệu nào. Vẫn lưu?", "Cảnh báo", MessageBoxButtons.YesNo, MessageBoxIcon.Warning) == DialogResult.No)
                {
                    return;
                }
            }

            try
            {
                _service.SaveRecipe(_recipe, ings);
                this.DialogResult = DialogResult.OK;
                this.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi khi lưu: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
