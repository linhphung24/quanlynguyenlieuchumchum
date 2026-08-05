using System;
using System.Drawing;
using System.Windows.Forms;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;
using System.Linq;

namespace ChumChumBakery.WinForms.Forms
{
    public class FrmRecipes : UserControl
    {
        private RecipeService _service = new RecipeService();
        private DataGridView _gridRecipes;
        private DataGridView _gridIngredients;
        private NumericUpDown _numTargetQty;
        private Button _btnCalculate, _btnAdd, _btnEdit, _btnDelete;

        public FrmRecipes()
        {
            InitializeUI();
            LoadRecipes();
        }

        private void InitializeUI()
        {
            this.Dock = DockStyle.Fill;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 10F);

            // Header Panel
            var pnlTop = new Panel { Dock = DockStyle.Top, Height = 60, Padding = new Padding(10) };
            var lblTitle = new Label { Text = "🥖 TÍNH ĐỊNH MỨC & CÔNG THỨC", Font = new Font("Segoe UI", 14F, FontStyle.Bold), AutoSize = true, Location = new Point(10, 15) };
            
            _btnAdd = new Button { Text = "Thêm CT", Width = 90, Height = 35, BackColor = Color.FromArgb(76, 175, 80), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Location = new Point(600, 12) };
            _btnAdd.FlatAppearance.BorderSize = 0;
            _btnAdd.Click += BtnAdd_Click;

            _btnEdit = new Button { Text = "Sửa", Width = 70, Height = 35, BackColor = Color.FromArgb(33, 150, 243), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Location = new Point(700, 12) };
            _btnEdit.FlatAppearance.BorderSize = 0;
            _btnEdit.Click += BtnEdit_Click;

            _btnDelete = new Button { Text = "Xóa", Width = 70, Height = 35, BackColor = Color.FromArgb(244, 67, 54), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Location = new Point(780, 12) };
            _btnDelete.FlatAppearance.BorderSize = 0;
            _btnDelete.Click += BtnDelete_Click;

            pnlTop.Controls.AddRange(new Control[] { lblTitle, _btnAdd, _btnEdit, _btnDelete });

            // Split Container
            var splitContainer = new SplitContainer
            {
                Dock = DockStyle.Fill,
                Orientation = Orientation.Vertical,
                SplitterDistance = 400,
                BackColor = Color.LightGray
            };

            // Trái: Grid Công thức
            _gridRecipes = CreateGrid();
            _gridRecipes.SelectionChanged += GridRecipes_SelectionChanged;
            var pnlMaster = new Panel { Dock = DockStyle.Fill, BackColor = Color.White, Padding = new Padding(5) };
            var lblMaster = new Label { Text = "Danh sách Công thức:", Font = new Font("Segoe UI", 10F, FontStyle.Bold), Dock = DockStyle.Top, Height = 25 };
            pnlMaster.Controls.Add(_gridRecipes);
            pnlMaster.Controls.Add(lblMaster);
            splitContainer.Panel1.Controls.Add(pnlMaster);

            // Phải: Grid Nguyên liệu & Máy tính
            _gridIngredients = CreateGrid();
            
            var pnlCalc = new Panel { Dock = DockStyle.Top, Height = 60, BackColor = Color.FromArgb(245, 245, 245) };
            var lblCalc = new Label { Text = "SL muốn làm:", AutoSize = true, Location = new Point(10, 20), Font = new Font("Segoe UI", 10F, FontStyle.Bold) };
            _numTargetQty = new NumericUpDown { Location = new Point(110, 17), Width = 100, Maximum = 999999, DecimalPlaces = 2, Value = 1 };
            _btnCalculate = new Button { Text = "Tính toán", Width = 90, Height = 30, Location = new Point(220, 15), BackColor = Color.FromArgb(255, 152, 0), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            _btnCalculate.FlatAppearance.BorderSize = 0;
            _btnCalculate.Click += BtnCalculate_Click;
            
            pnlCalc.Controls.AddRange(new Control[] { lblCalc, _numTargetQty, _btnCalculate });

            var pnlDetail = new Panel { Dock = DockStyle.Fill, BackColor = Color.White, Padding = new Padding(5) };
            var lblDetail = new Label { Text = "Nguyên liệu (chuẩn):", Font = new Font("Segoe UI", 10F, FontStyle.Bold), Dock = DockStyle.Top, Height = 25 };
            pnlDetail.Controls.Add(_gridIngredients);
            pnlDetail.Controls.Add(lblDetail);
            pnlDetail.Controls.Add(pnlCalc);

            splitContainer.Panel2.Controls.Add(pnlDetail);

            this.Controls.Add(splitContainer);
            this.Controls.Add(pnlTop);
        }

        private DataGridView CreateGrid()
        {
            var grid = new DataGridView
            {
                Dock = DockStyle.Fill,
                AllowUserToAddRows = false,
                AllowUserToDeleteRows = false,
                ReadOnly = true,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
                BackgroundColor = Color.White,
                BorderStyle = BorderStyle.None,
                RowHeadersVisible = false,
                AllowUserToResizeRows = false,
                EnableHeadersVisualStyles = false
            };
            grid.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(240, 240, 240);
            grid.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            grid.ColumnHeadersHeight = 35;
            grid.RowTemplate.Height = 30;
            return grid;
        }

        private void LoadRecipes()
        {
            var data = _service.GetAllRecipes();
            _gridRecipes.DataSource = data;

            if (_gridRecipes.Columns["Id"] != null) _gridRecipes.Columns["Id"].Visible = false;
            if (_gridRecipes.Columns["CreatedBy"] != null) _gridRecipes.Columns["CreatedBy"].Visible = false;
            if (_gridRecipes.Columns["UpdatedBy"] != null) _gridRecipes.Columns["UpdatedBy"].Visible = false;
            if (_gridRecipes.Columns["CreatedAt"] != null) _gridRecipes.Columns["CreatedAt"].Visible = false;
            if (_gridRecipes.Columns["UpdatedAt"] != null) _gridRecipes.Columns["UpdatedAt"].Visible = false;

            if (_gridRecipes.Columns["Name"] != null) { _gridRecipes.Columns["Name"].HeaderText = "Tên Công Thức"; _gridRecipes.Columns["Name"].FillWeight = 200; }
            if (_gridRecipes.Columns["BaseYield"] != null) { _gridRecipes.Columns["BaseYield"].HeaderText = "Sản lượng (chuẩn)"; _gridRecipes.Columns["BaseYield"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter; }
            
            if (data.Count == 0) _gridIngredients.DataSource = null;
        }

        private void GridRecipes_SelectionChanged(object sender, EventArgs e)
        {
            if (_gridRecipes.SelectedRows.Count > 0)
            {
                var recipe = (Recipe)_gridRecipes.SelectedRows[0].DataBoundItem;
                _numTargetQty.Value = recipe.BaseYield > 0 ? recipe.BaseYield : 1;
                LoadRecipeIngredients(recipe.Id);
            }
        }

        private void LoadRecipeIngredients(int recipeId)
        {
            var details = _service.GetRecipeIngredients(recipeId);
            
            // Set required amount to standard amount initially
            foreach (var d in details) d.RequiredAmount = d.Amount;
            
            _gridIngredients.DataSource = details;

            if (_gridIngredients.Columns["Id"] != null) _gridIngredients.Columns["Id"].Visible = false;
            if (_gridIngredients.Columns["RecipeId"] != null) _gridIngredients.Columns["RecipeId"].Visible = false;
            if (_gridIngredients.Columns["Price"] != null) _gridIngredients.Columns["Price"].Visible = false;

            if (_gridIngredients.Columns["ProductName"] != null) { _gridIngredients.Columns["ProductName"].HeaderText = "Nguyên Liệu"; _gridIngredients.Columns["ProductName"].FillWeight = 200; }
            if (_gridIngredients.Columns["Amount"] != null) { _gridIngredients.Columns["Amount"].HeaderText = "SL Chuẩn"; _gridIngredients.Columns["Amount"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter; _gridIngredients.Columns["Amount"].DefaultCellStyle.Format = "N2"; }
            if (_gridIngredients.Columns["Unit"] != null) { _gridIngredients.Columns["Unit"].HeaderText = "ĐVT"; _gridIngredients.Columns["Unit"].FillWeight = 60; }
            if (_gridIngredients.Columns["RequiredAmount"] != null) 
            { 
                _gridIngredients.Columns["RequiredAmount"].HeaderText = "Cần Chuẩn Bị"; 
                _gridIngredients.Columns["RequiredAmount"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter; 
                _gridIngredients.Columns["RequiredAmount"].DefaultCellStyle.Format = "N2";
                _gridIngredients.Columns["RequiredAmount"].DefaultCellStyle.BackColor = Color.LightYellow;
                _gridIngredients.Columns["RequiredAmount"].DefaultCellStyle.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            }
        }

        private void BtnCalculate_Click(object sender, EventArgs e)
        {
            if (_gridRecipes.SelectedRows.Count == 0) return;
            var recipe = (Recipe)_gridRecipes.SelectedRows[0].DataBoundItem;
            
            if (recipe.BaseYield <= 0)
            {
                MessageBox.Show("Sản lượng chuẩn của công thức phải lớn hơn 0 để tính toán.", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            var ratio = _numTargetQty.Value / recipe.BaseYield;
            
            var details = (System.Collections.Generic.List<RecipeIngredient>)_gridIngredients.DataSource;
            foreach (var d in details)
            {
                d.RequiredAmount = d.Amount * ratio;
            }
            _gridIngredients.Refresh();
        }

        private void BtnAdd_Click(object sender, EventArgs e)
        {
            var frm = new FrmRecipeEdit();
            if (frm.ShowDialog() == DialogResult.OK)
            {
                LoadRecipes();
            }
        }

        private void BtnEdit_Click(object sender, EventArgs e)
        {
            if (_gridRecipes.SelectedRows.Count == 0) return;
            var recipe = (Recipe)_gridRecipes.SelectedRows[0].DataBoundItem;
            
            var details = _service.GetRecipeIngredients(recipe.Id);
            var frm = new FrmRecipeEdit(recipe, details);
            if (frm.ShowDialog() == DialogResult.OK)
            {
                LoadRecipes();
            }
        }

        private void BtnDelete_Click(object sender, EventArgs e)
        {
            if (_gridRecipes.SelectedRows.Count == 0) return;
            var recipe = (Recipe)_gridRecipes.SelectedRows[0].DataBoundItem;
            
            if (MessageBox.Show($"Bạn có chắc muốn xóa công thức '{recipe.Name}'?", "Xác nhận", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
            {
                _service.DeleteRecipe(recipe.Id);
                LoadRecipes();
            }
        }
    }
}
