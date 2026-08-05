using System;
using System.Collections.Generic;
using System.Data;
using ChumChumBakery.Core.Data;
using System.Data.SqlClient;

namespace ChumChumBakery.Core.Services
{
    public class TongHopRow
    {
        public int STT { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = "Khác";
        public string Unit { get; set; } = "kg";
        public decimal DonGia { get; set; }

        public decimal TonDau { get; set; }
        public decimal TienDau => TonDau * DonGia;

        public decimal Nhap { get; set; }
        public decimal TienNhap { get; set; }

        public decimal Xuat { get; set; }
        public decimal TienXuat { get; set; }

        public decimal TonCuoi { get; set; }
        public decimal TienCuoi => TonCuoi * DonGia;

        public bool TonDauAuto { get; set; } = true;
    }

    public class SummaryReportService
    {
        public List<TongHopRow> GetInventorySummary(int year, int month)
        {
            var result = new List<TongHopRow>();

            var startStr = $"{year}-{month:D2}-01";
            var lastDay = DateTime.DaysInMonth(year, month);
            var endStr = $"{year}-{month:D2}-{lastDay:D2}";

            // 1. Query danh sách sản phẩm active
            var dtProducts = DatabaseHelper.ExecuteQuery(
                "SELECT Id, Code, Name, Category, Unit, CostPrice FROM Products WHERE IsActive = 1 ORDER BY Category, Name");

            // 2. Query hoá đơn nhập/xuất trong tháng
            var dtInMonth = DatabaseHelper.ExecuteQuery(
                @"SELECT i.Type, d.ProductName, d.Amount, d.Price, d.Unit 
                  FROM InvoiceDetails d 
                  INNER JOIN Invoices i ON d.InvoiceId = i.Id 
                  WHERE i.InvDate >= @Start AND i.InvDate <= @End",
                new SqlParameter("@Start", startStr),
                new SqlParameter("@End", endStr));

            // 3. Query stock_opening_adj (điều chỉnh tồn đầu)
            var dtAdj = DatabaseHelper.ExecuteQuery(
                "SELECT ProductName, AdjQty FROM StockOpeningAdj WHERE Year = @Year AND Month = @Month",
                new SqlParameter("@Year", year),
                new SqlParameter("@Month", month));

            var adjMap = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
            foreach (DataRow r in dtAdj.Rows)
            {
                var pName = r["ProductName"].ToString()?.Trim() ?? "";
                var qty = Convert.ToDecimal(r["AdjQty"]);
                adjMap[pName] = qty;
            }

            // 4. Query batches tồn hiện tại
            var dtBatches = DatabaseHelper.ExecuteQuery(
                "SELECT ProductName, SUM(RemainingQty) AS TotalBatch FROM Batches WHERE RemainingQty > 0.005 GROUP BY ProductName");
            var batchMap = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
            foreach (DataRow r in dtBatches.Rows)
            {
                var pName = r["ProductName"].ToString()?.Trim() ?? "";
                var qty = Convert.ToDecimal(r["TotalBatch"]);
                batchMap[pName] = qty;
            }

            // 5. Query hoá đơn SAU kỳ
            var dtAfter = DatabaseHelper.ExecuteQuery(
                @"SELECT i.Type, d.ProductName, d.Amount 
                  FROM InvoiceDetails d 
                  INNER JOIN Invoices i ON d.InvoiceId = i.Id 
                  WHERE i.InvDate > @End",
                new SqlParameter("@End", endStr));

            var futureMap = new Dictionary<string, (decimal fn, decimal fx)>(StringComparer.OrdinalIgnoreCase);
            foreach (DataRow r in dtAfter.Rows)
            {
                var pName = r["ProductName"].ToString()?.Trim() ?? "";
                var type = r["Type"].ToString();
                var amt = Convert.ToDecimal(r["Amount"]);
                if (!futureMap.ContainsKey(pName)) futureMap[pName] = (0, 0);

                var cur = futureMap[pName];
                if (type == "in") futureMap[pName] = (cur.fn + amt, cur.fx);
                else futureMap[pName] = (cur.fn, cur.fx + amt);
            }

            // 6. Gom phát sinh trong tháng theo sản phẩm (case-insensitive)
            var pmap = new Dictionary<string, (decimal nhap, decimal tienNhap, decimal xuat, decimal tienXuat)>(StringComparer.OrdinalIgnoreCase);
            foreach (DataRow r in dtInMonth.Rows)
            {
                var pName = r["ProductName"].ToString()?.Trim() ?? "";
                var type = r["Type"].ToString();
                var amt = Convert.ToDecimal(r["Amount"]);
                var price = Convert.ToDecimal(r["Price"]);
                var subtotal = amt * price;

                if (!pmap.ContainsKey(pName)) pmap[pName] = (0, 0, 0, 0);

                var cur = pmap[pName];
                if (type == "in") pmap[pName] = (cur.nhap + amt, cur.tienNhap + subtotal, cur.xuat, cur.tienXuat);
                else pmap[pName] = (cur.nhap, cur.tienNhap, cur.xuat + amt, cur.tienXuat + subtotal);
            }

            // 7. Tổng hợp dữ liệu từng dòng
            int stt = 1;
            foreach (DataRow r in dtProducts.Rows)
            {
                var pName = r["Name"].ToString()?.Trim() ?? "";
                var donGia = Convert.ToDecimal(r["CostPrice"]);
                var category = r["Category"].ToString() ?? "Khác";
                var unit = r["Unit"].ToString() ?? "kg";
                var code = r["Code"].ToString() ?? "";

                var e = pmap.ContainsKey(pName) ? pmap[pName] : (0, 0, 0, 0);
                var batchQty = batchMap.ContainsKey(pName) ? batchMap[pName] : 0;
                var fut = futureMap.ContainsKey(pName) ? futureMap[pName] : (0, 0);
                var hasAdj = adjMap.ContainsKey(pName);

                decimal tonDau, tonCuoi;
                if (hasAdj)
                {
                    tonDau = adjMap[pName];
                    tonCuoi = tonDau + e.nhap - e.xuat;
                }
                else
                {
                    tonCuoi = batchQty + fut.fx - fut.fn;
                    tonDau = tonCuoi - e.nhap + e.xuat;
                }

                if (tonDau == 0 && tonCuoi == 0 && e.nhap == 0 && e.xuat == 0) continue;

                result.Add(new TongHopRow
                {
                    STT = stt++,
                    Code = code,
                    Name = pName,
                    Category = category,
                    Unit = unit,
                    DonGia = donGia,
                    TonDau = tonDau,
                    Nhap = e.nhap,
                    TienNhap = e.tienNhap > 0 ? e.tienNhap : e.nhap * donGia,
                    Xuat = e.xuat,
                    TienXuat = e.tienXuat > 0 ? e.tienXuat : e.xuat * donGia,
                    TonCuoi = tonCuoi,
                    TonDauAuto = !hasAdj
                });
            }

            return result;
        }
    }
}
