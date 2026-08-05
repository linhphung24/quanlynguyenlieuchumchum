using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;
using ClosedXML.Excel;

namespace ChumChumBakery.WinForms.Forms
{
    public class FrmStockOpening : UserControl
    {
        private StockOpeningService _service = new StockOpeningService();
        private BindingList<StockOpeningAdj> _data;
        
        private ComboBox cbMonth, cbYear;
        private DataGridView grid;
        private Button btnLoad, btnDownloadTemplate, btnImport, btnSave;

        public FrmStockOpening()
        {
            InitializeUI();
            LoadData();
        }

        private void InitializeUI()
        {
            this.Dock = DockStyle.Fill;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 10F);

            // Top Panel
            var pnlTop = new Panel { Dock = DockStyle.Top, Height = 100, Padding = new Padding(10) };
            
            var lblTitle = new Label { Text = "📦 KHAI BÁO TỒN ĐẦU KỲ", Font = new Font("Segoe UI", 14F, FontStyle.Bold), AutoSize = true, Location = new Point(10, 15) };
            
            var lblMonth = new Label { Text = "Tháng:", AutoSize = true, Location = new Point(20, 60) };
            cbMonth = new ComboBox { Location = new Point(80, 57), Width = 60, DropDownStyle = ComboBoxStyle.DropDownList };
            for (int i = 1; i <= 12; i++) cbMonth.Items.Add(i.ToString());
            cbMonth.SelectedItem = DateTime.Now.Month.ToString();
            
            var lblYear = new Label { Text = "Năm:", AutoSize = true, Location = new Point(160, 60) };
            cbYear = new ComboBox { Location = new Point(210, 57), Width = 80, DropDownStyle = ComboBoxStyle.DropDownList };
            for (int i = 2025; i <= 2030; i++) cbYear.Items.Add(i.ToString());
            cbYear.SelectedItem = DateTime.Now.Year.ToString();

            btnLoad = new Button { Text = "Xem", Width = 70, Height = 30, Location = new Point(310, 55), BackColor = Color.LightGray, FlatStyle = FlatStyle.Flat };
            btnLoad.FlatAppearance.BorderSize = 0;
            btnLoad.Click += (s, e) => LoadData();

            btnDownloadTemplate = new Button { Text = "Tải File Mẫu", Width = 110, Height = 35, Location = new Point(500, 52), BackColor = Color.FromArgb(33, 150, 243), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnDownloadTemplate.FlatAppearance.BorderSize = 0;
            btnDownloadTemplate.Click += BtnDownloadTemplate_Click;

            btnImport = new Button { Text = "Nhập từ Excel", Width = 130, Height = 35, Location = new Point(620, 52), BackColor = Color.FromArgb(255, 152, 0), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnImport.FlatAppearance.BorderSize = 0;
            btnImport.Click += BtnImport_Click;

            btnSave = new Button { Text = "Lưu Thay Đổi", Width = 120, Height = 35, Location = new Point(760, 52), BackColor = Color.FromArgb(76, 175, 80), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.FlatAppearance.BorderSize = 0;
            btnSave.Click += BtnSave_Click;

            pnlTop.Controls.AddRange(new Control[] { lblTitle, lblMonth, cbMonth, lblYear, cbYear, btnLoad, btnDownloadTemplate, btnImport, btnSave });

            // Grid
            grid = new DataGridView
            {
                Dock = DockStyle.Fill,
                AutoGenerateColumns = false,
                AllowUserToAddRows = false,
                AllowUserToDeleteRows = false,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
                BackgroundColor = Color.WhiteSmoke,
                EnableHeadersVisualStyles = false,
                SelectionMode = DataGridViewSelectionMode.CellSelect
            };
            grid.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(240, 240, 240);
            grid.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            grid.ColumnHeadersHeight = 35;
            grid.RowTemplate.Height = 30;

            grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "ProductCode", HeaderText = "Mã Hàng", ReadOnly = true, FillWeight = 80 });
            grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "ProductName", HeaderText = "Tên Sản Phẩm", ReadOnly = true, FillWeight = 200 });
            grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Unit", HeaderText = "ĐVT", ReadOnly = true, FillWeight = 60 });
            
            var colCurrentStock = new DataGridViewTextBoxColumn
            {
                DataPropertyName = "CurrentStock",
                HeaderText = "Tồn Hiện Tại",
                ReadOnly = true,
                DefaultCellStyle = new DataGridViewCellStyle { Format = "N2", Alignment = DataGridViewContentAlignment.MiddleRight, ForeColor = Color.DarkBlue }
            };
            grid.Columns.Add(colCurrentStock);

            var colQty = new DataGridViewTextBoxColumn 
            { 
                DataPropertyName = "AdjQty", 
                HeaderText = "Tồn Đầu Kỳ Khai Báo", 
                DefaultCellStyle = new DataGridViewCellStyle { Format = "N2", Alignment = DataGridViewContentAlignment.MiddleRight, BackColor = Color.LightYellow, Font = new Font("Segoe UI", 10F, FontStyle.Bold) }
            };
            grid.Columns.Add(colQty);

            grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "CreatedBy", HeaderText = "Người Tạo", ReadOnly = true, FillWeight = 80 });
            grid.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "UpdatedBy", HeaderText = "Người Sửa", ReadOnly = true, FillWeight = 80 });

            this.Controls.Add(grid);
            this.Controls.Add(pnlTop);
        }

        private void LoadData()
        {
            int m = int.Parse(cbMonth.SelectedItem.ToString());
            int y = int.Parse(cbYear.SelectedItem.ToString());
            var list = _service.GetOpeningStocks(m, y);
            _data = new BindingList<StockOpeningAdj>(list);
            grid.DataSource = _data;
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            grid.EndEdit();
            int m = int.Parse(cbMonth.SelectedItem.ToString());
            int y = int.Parse(cbYear.SelectedItem.ToString());
            try
            {
                _service.SaveOpeningStocks(m, y, _data.ToList());
                MessageBox.Show("Lưu dữ liệu tồn đầu kỳ thành công!", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi khi lưu: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void BtnDownloadTemplate_Click(object sender, EventArgs e)
        {
            using (var sfd = new SaveFileDialog { Filter = "Excel files (*.xlsx)|*.xlsx", FileName = $"MauTonDauKy_Thang{cbMonth.SelectedItem}_{cbYear.SelectedItem}.xlsx" })
            {
                if (sfd.ShowDialog() == DialogResult.OK)
                {
                    try
                    {
                        using (var wb = new XLWorkbook())
                        {
                            var ws = wb.Worksheets.Add("TonDauKy");
                            ws.Cell(1, 1).Value = "Mã Hàng";
                            ws.Cell(1, 2).Value = "Tên Sản Phẩm";
                            ws.Cell(1, 3).Value = "ĐVT";
                            ws.Cell(1, 4).Value = "Tồn Hiện Tại";
                            ws.Cell(1, 5).Value = "Tồn Đầu Kỳ Khai Báo (Sửa tại đây)";
                            
                            var headerRange = ws.Range(1, 1, 1, 5);
                            headerRange.Style.Font.Bold = true;
                            headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

                            ws.Cell(1, 5).Style.Fill.BackgroundColor = XLColor.LightYellow;

                            for (int i = 0; i < _data.Count; i++)
                            {
                                ws.Cell(i + 2, 1).Value = _data[i].ProductCode;
                                ws.Cell(i + 2, 2).Value = _data[i].ProductName;
                                ws.Cell(i + 2, 3).Value = _data[i].Unit;
                                ws.Cell(i + 2, 4).Value = _data[i].CurrentStock;
                                ws.Cell(i + 2, 5).Value = _data[i].AdjQty;
                                ws.Cell(i + 2, 5).Style.Fill.BackgroundColor = XLColor.LightYellow;
                            }
                            
                            ws.Columns().AdjustToContents();
                            wb.SaveAs(sfd.FileName);
                        }
                        MessageBox.Show("Tải file mẫu thành công! Đã xuất đầy đủ toàn bộ sản phẩm và tồn kho hiện tại.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Lỗi: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
            }
        }

        private void BtnImport_Click(object sender, EventArgs e)
        {
            using (var ofd = new OpenFileDialog { Filter = "Excel files (*.xlsx)|*.xlsx" })
            {
                if (ofd.ShowDialog() == DialogResult.OK)
                {
                    try
                    {
                        using (var wb = new XLWorkbook(ofd.FileName))
                        {
                            var ws = wb.Worksheet(1);
                            var rows = ws.RowsUsed().Skip(1); // Skip header

                            int count = 0;
                            foreach (var row in rows)
                            {
                                string code = row.Cell(1).GetString().Trim();
                                string name = row.Cell(2).GetString().Trim();
                                double qty = 0;

                                // If 5th column exists (new template), read cell 5, else read cell 4
                                var cellToRead = row.Cell(5).IsEmpty() && !row.Cell(4).IsEmpty() ? row.Cell(4) : row.Cell(5);
                                if (cellToRead.IsEmpty()) cellToRead = row.Cell(4);
                                
                                cellToRead.TryGetValue(out qty);

                                var item = _data.FirstOrDefault(d => (!string.IsNullOrEmpty(code) && d.ProductCode == code) || d.ProductName == name);
                                if (item != null)
                                {
                                    item.AdjQty = (decimal)qty;
                                    count++;
                                }
                            }
                            grid.Refresh();
                            MessageBox.Show($"Đã import thành công số liệu cho {count} mặt hàng!\nVui lòng bấm 'Lưu Thay Đổi' để xác nhận lưu vào CSDL.", "Thành công", MessageBoxButtons.OK, MessageBoxIcon.Information);
                        }
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Lỗi khi đọc file Excel: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
            }
        }
    }
}
