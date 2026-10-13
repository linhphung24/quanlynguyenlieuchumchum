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
        private ProductService _productService = new ProductService();
        private List<StockOpeningAdj> _fullList = new List<StockOpeningAdj>();
        private BindingList<StockOpeningAdj> _data;

        // Snapshot giá trị AdjQty lúc load (gồm cả mặc định = tồn hiện tại của SP chưa khai).
        // Khi lưu chỉ ghi những dòng người dùng thật sự chỉnh sửa — nếu lưu cả list như trước,
        // mỗi lần "Lưu Thay Đổi" sẽ tự sinh khai báo = tồn hiện tại cho MỌI sản phẩm chưa khai
        // (nguyên nhân gây đếm đôi hàng loạt ngày 31/08: 58 dòng tồn đầu sai).
        private Dictionary<string, decimal> _loadedAdjQty = new Dictionary<string, decimal>();
        
        private TextBox txtSearch;
        private DataGridView grid;
        private Button btnLoad, btnDownloadTemplate, btnImport, btnSave;

        // Kỳ khai báo tồn đầu gốc (tự xác định, không cho người dùng chọn nữa)
        private int _periodMonth, _periodYear;

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
            var pnlTop = new Panel { Dock = DockStyle.Top, Height = 125, Padding = new Padding(10) };
            
            var lblTitle = new Label { Text = "📦 TỒN ĐẦU — KHAI BÁO BAN ĐẦU & BỔ SUNG", Font = new Font("Segoe UI", 14F, FontStyle.Bold), AutoSize = true, Location = new Point(10, 15) };

            // Tồn đầu theo nghiệp vụ chỉ khai MỘT LẦN lúc bắt đầu dùng phần mềm (kỳ gốc),
            // bổ sung sau này vẫn về đúng kỳ gốc — bỏ hẳn bộ chọn tháng/năm để tránh nhầm lẫn
            var (periodMonth, periodYear, periodExists) = _service.GetOpeningPeriod();
            _periodMonth = periodMonth;
            _periodYear = periodYear;

            var lblPeriodHint = new Label
            {
                Text = periodExists
                    ? $"Tồn đầu chỉ khai 1 lần khi bắt đầu dùng phần mềm. Kỳ gốc: {periodMonth:D2}/{periodYear} — nhập số cần bổ sung rồi bấm Lưu."
                    : "Chưa có khai báo tồn đầu nào — lần lưu đầu tiên sẽ trở thành kỳ gốc.",
                AutoSize = true,
                ForeColor = Color.Gray,
                Location = new Point(20, 92)
            };

            btnLoad = new Button { Text = "Tải Lại", Width = 70, Height = 30, Location = new Point(20, 55), BackColor = Color.LightGray, FlatStyle = FlatStyle.Flat };
            btnLoad.FlatAppearance.BorderSize = 0;
            btnLoad.Click += (s, e) => LoadData();

            var lblSearch = new Label { Text = "Tìm:", AutoSize = true, Location = new Point(110, 60) };
            txtSearch = new TextBox { Location = new Point(145, 57), Width = 220, PlaceholderText = "Tìm tên hoặc mã SP..." };
            txtSearch.TextChanged += (s, e) => ApplySearchFilter();

            btnDownloadTemplate = new Button { Text = "Tải File Mẫu", Width = 110, Height = 35, Location = new Point(400, 52), BackColor = Color.FromArgb(33, 150, 243), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnDownloadTemplate.FlatAppearance.BorderSize = 0;
            btnDownloadTemplate.Click += BtnDownloadTemplate_Click;

            btnImport = new Button { Text = "Nhập từ Excel", Width = 120, Height = 35, Location = new Point(520, 52), BackColor = Color.FromArgb(255, 152, 0), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnImport.FlatAppearance.BorderSize = 0;
            btnImport.Click += BtnImport_Click;

            btnSave = new Button { Text = "Lưu Thay Đổi", Width = 120, Height = 35, Location = new Point(650, 52), BackColor = Color.FromArgb(76, 175, 80), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.FlatAppearance.BorderSize = 0;
            btnSave.Click += BtnSave_Click;

            pnlTop.Controls.AddRange(new Control[] { lblTitle, btnLoad, lblSearch, txtSearch, btnDownloadTemplate, btnImport, btnSave, lblPeriodHint });

            if (!Core.Session.HasPermission("Menu_StockOpening", "create") && !Core.Session.HasPermission("Menu_StockOpening", "edit"))
            {
                btnImport.Visible = false;
                btnSave.Visible = false;
            }

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
                HeaderText = "Tồn Đầu Kỳ Khai Báo (0 = chưa khai)",
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
            int m = _periodMonth;
            int y = _periodYear;
            _fullList = _service.GetOpeningStocks(m, y);

            _loadedAdjQty = new Dictionary<string, decimal>();
            foreach (var x in _fullList) _loadedAdjQty[x.ProductName] = x.AdjQty;

            ApplySearchFilter();
        }

        private void ApplySearchFilter()
        {
            string keyword = txtSearch?.Text?.Trim().ToLower() ?? "";
            var filtered = string.IsNullOrEmpty(keyword)
                ? _fullList
                : _fullList.Where(x => (x.ProductName?.ToLower().Contains(keyword) == true) || (x.ProductCode?.ToLower().Contains(keyword) == true)).ToList();

            _data = new BindingList<StockOpeningAdj>(filtered);
            grid.DataSource = _data;
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            grid.EndEdit();
            int m = _periodMonth;
            int y = _periodYear;

            // Chỉ lưu các dòng người dùng thật sự chỉnh sửa (khác giá trị lúc load)
            var changed = _fullList
                .Where(x => !_loadedAdjQty.TryGetValue(x.ProductName, out var def) || x.AdjQty != def)
                .ToList();

            if (changed.Count == 0)
            {
                MessageBox.Show("Không có thay đổi nào để lưu.\nLưu ý: các dòng chưa chỉnh sửa sẽ KHÔNG được ghi khai báo (tránh tự sinh tồn đầu sai).", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            // Cảnh báo nguy cơ đếm đôi trước khi lưu
            var warnings = _service.GetDoubleCountWarnings(m, y, changed);
            if (warnings.Count > 0)
            {
                int maxShow = Math.Min(warnings.Count, 10);
                var shown = string.Join("\n• ", warnings.Take(maxShow));
                var more = warnings.Count > maxShow ? $"\n• ... và {warnings.Count - maxShow} sản phẩm khác" : "";
                var proceed = MessageBox.Show(
                    "Cảnh báo khai tồn đầu kỳ:\n\n• " + shown + more +
                    "\n\nChỉ bấm [CÓ] nếu bạn CHẮC CHẮN số này là tồn thực tế đầu kỳ (hàng tồn từ kỳ trước).\n" +
                    "Nhấn [KHÔNG] để quay lại kiểm tra (chưa lưu gì).",
                    "Cảnh báo đếm đôi", MessageBoxButtons.YesNo, MessageBoxIcon.Warning,
                    MessageBoxDefaultButton.Button2);
                if (proceed != DialogResult.Yes) return;
            }

            try
            {
                _service.SaveOpeningStocks(m, y, changed);
                MessageBox.Show($"Đã lưu khai báo tồn đầu kỳ cho {changed.Count} sản phẩm (chỉ các dòng thay đổi).", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                LoadData();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi khi lưu: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void BtnDownloadTemplate_Click(object sender, EventArgs e)
        {
            using (var sfd = new SaveFileDialog { Filter = "Excel files (*.xlsx)|*.xlsx", FileName = $"MauTonDauKy_Ky{_periodMonth:D2}-{_periodYear}.xlsx" })
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

                            for (int i = 0; i < _fullList.Count; i++)
                            {
                                ws.Cell(i + 2, 1).Value = _fullList[i].ProductCode;
                                ws.Cell(i + 2, 2).Value = _fullList[i].ProductName;
                                ws.Cell(i + 2, 3).Value = _fullList[i].Unit;
                                ws.Cell(i + 2, 4).Value = _fullList[i].CurrentStock;
                                ws.Cell(i + 2, 5).Value = _fullList[i].AdjQty;
                                ws.Cell(i + 2, 5).Style.Fill.BackgroundColor = XLColor.LightYellow;
                            }
                            
                            ws.Columns().AdjustToContents();
                            wb.SaveAs(sfd.FileName);
                        }
                        MessageBox.Show("Tải file mẫu thành công!\n\nLưu ý: có thể THÊM DÒNG MỚI cho sản phẩm chưa có trong danh mục — điền đủ Mã Hàng, Tên Sản Phẩm, ĐVT và số lượng ở cột 5; khi Nhập từ Excel app sẽ tự tạo sản phẩm đó.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
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
                if (ofd.ShowDialog() != DialogResult.OK) return;

                try
                {
                    using (var wb = new XLWorkbook(ofd.FileName))
                    {
                        var ws = wb.Worksheet(1);
                        var rows = ws.RowsUsed().Skip(1); // Skip header

                        // Người dùng có thể THÊM DÒNG MỚI cho sản phẩm chưa có trong danh mục
                        // (điền Mã + Tên + ĐVT + cột 5) — app sẽ tự tạo sản phẩm đó.
                        bool canCreateProduct = Core.Session.HasPermission("Menu_Products", "create");

                        int updated = 0, created = 0, skippedNoPerm = 0, skippedNoName = 0;
                        var touched = new List<StockOpeningAdj>();

                        foreach (var row in rows)
                        {
                            string code = row.Cell(1).GetString().Trim();
                            string name = row.Cell(2).GetString().Trim();
                            string unit = row.Cell(3).GetString().Trim();
                            double qty = 0;

                            // If 5th column exists (new template), read cell 5, else read cell 4
                            var cellToRead = row.Cell(5).IsEmpty() && !row.Cell(4).IsEmpty() ? row.Cell(4) : row.Cell(5);
                            if (cellToRead.IsEmpty()) cellToRead = row.Cell(4);

                            cellToRead.TryGetValue(out qty);

                            if (string.IsNullOrEmpty(name) && string.IsNullOrEmpty(code)) continue; // dòng trống

                            var item = _fullList.FirstOrDefault(d =>
                                (!string.IsNullOrEmpty(code) && d.ProductCode == code) ||
                                (!string.IsNullOrEmpty(name) && string.Equals((d.ProductName ?? "").Trim(), name, StringComparison.OrdinalIgnoreCase)));

                            if (item != null)
                            {
                                item.AdjQty = (decimal)qty;
                                touched.Add(item);
                                updated++;
                                continue;
                            }

                            // Sản phẩm chưa có trong danh mục
                            if (string.IsNullOrEmpty(name))
                            {
                                skippedNoName++;
                                continue;
                            }
                            if (!canCreateProduct)
                            {
                                skippedNoPerm++;
                                continue;
                            }

                            var newProduct = new Product
                            {
                                Code = code,
                                Name = name,
                                Unit = string.IsNullOrWhiteSpace(unit) ? "kg" : unit
                            };
                            int newId = _productService.SaveProduct(newProduct);
                            if (newId > 0)
                            {
                                var adj = new StockOpeningAdj
                                {
                                    ProductName = name,
                                    ProductCode = code,
                                    Unit = newProduct.Unit,
                                    AdjQty = (decimal)qty
                                };
                                _fullList.Add(adj);
                                touched.Add(adj);
                                created++;
                            }
                        }

                        // LƯU NGAY số liệu vừa nhập (kèm tồn đầu của sản phẩm mới tạo)
                        // — không bắt người dùng bấm "Lưu Thay Đổi" lần nữa, tránh mất số liệu
                        bool saved = false;
                        if (touched.Count > 0)
                        {
                            var warnings = _service.GetDoubleCountWarnings(_periodMonth, _periodYear, touched);
                            if (warnings.Count > 0)
                            {
                                int maxShow = Math.Min(warnings.Count, 10);
                                var shown = string.Join("\n• ", warnings.Take(maxShow));
                                var more = warnings.Count > maxShow ? $"\n• ... và {warnings.Count - maxShow} sản phẩm khác" : "";
                                var ok = MessageBox.Show(
                                    "Cảnh báo khai tồn đầu kỳ:\n\n• " + shown + more +
                                    "\n\nNhấn [CÓ] để LƯU NGAY, [KHÔNG] để bỏ qua không lưu.",
                                    "Cảnh báo đếm đôi", MessageBoxButtons.YesNo, MessageBoxIcon.Warning,
                                    MessageBoxDefaultButton.Button2);
                                if (ok == DialogResult.Yes) saved = TrySaveImported(touched);
                            }
                            else
                            {
                                saved = TrySaveImported(touched);
                            }
                        }

                        if (saved) LoadData();
                        else ApplySearchFilter();

                        var msg = saved
                            ? $"Đã nhập và LƯU NGAY số liệu cho {updated} sản phẩm có sẵn."
                            : $"Đã điền số liệu cho {updated} sản phẩm có sẵn vào lưới (CHƯA LƯU).";
                        if (created > 0) msg += saved
                            ? $"\nĐã TẠO MỚI {created} sản phẩm + khai báo tồn đầu luôn."
                            : $"\nĐã TẠO MỚI {created} sản phẩm (tồn đầu CHƯA lưu).";
                        if (skippedNoPerm > 0) msg += $"\n⚠ {skippedNoPerm} dòng là sản phẩm chưa có trong danh mục nhưng bạn không có quyền tạo sản phẩm — đã bỏ qua.";
                        if (skippedNoName > 0) msg += $"\n⚠ {skippedNoName} dòng thiếu tên sản phẩm — đã bỏ qua.";
                        MessageBox.Show(msg, "Nhập từ Excel", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Lỗi khi đọc file Excel: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        // Lưu danh sách vừa nhập từ Excel (MERGE + audit + rebuild FIFO). Tra ve true neu luu thanh cong.
        private bool TrySaveImported(List<StockOpeningAdj> items)
        {
            try
            {
                _service.SaveOpeningStocks(_periodMonth, _periodYear, items);
                return true;
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi khi lưu số liệu vừa nhập: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return false;
            }
        }
    }
}
