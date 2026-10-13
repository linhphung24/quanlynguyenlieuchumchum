using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Printing;
using System.Linq;
using System.Windows.Forms;
using ChumChumBakery.Core.Models;

namespace ChumChumBakery.WinForms.Helpers
{
    public static class InvoicePrintHelper
    {
        // Trạng thái in giữa các trang (dòng đang in, số trang) — phải giữ qua các lần gọi PrintPage
        private class PrintState
        {
            public Invoice Invoice;
            public List<InvoiceDetail> Details;
            public int RowIndex;
            public int PageNo;
        }

        public static void PrintInvoice(Invoice invoice, List<InvoiceDetail> details)
        {
            var printDoc = new PrintDocument
            {
                DocumentName = $"Hoa don {invoice.Code}"
            };
            var state = new PrintState { Invoice = invoice, Details = details };

            // Xem trước và in thật đều chạy lại chuỗi sự kiện — reset trạng thái mỗi lượt
            printDoc.BeginPrint += (s, ev) => { state.RowIndex = 0; state.PageNo = 0; };
            printDoc.PrintPage += (s, ev) => DrawInvoicePage(ev, state);

            // Mặc định A4 dọc, lề hẹp. Nếu bỏ qua, máy in nhiệt (khổ ~80mm) thành máy mặc định
            // sẽ cắt mất phần bên phải của bảng rộng 720 đơn vị
            printDoc.DefaultPageSettings.Landscape = false;
            printDoc.DefaultPageSettings.Margins = new Margins(30, 30, 40, 40);
            var a4 = printDoc.PrinterSettings.PaperSizes.Cast<PaperSize>().FirstOrDefault(p => p.Kind == PaperKind.A4);
            if (a4 != null) printDoc.DefaultPageSettings.PaperSize = a4;

            // Cho chọn máy in trước — nút In trong cửa sổ xem trước sẽ dùng đúng máy đã chọn
            using (var printDlg = new PrintDialog
            {
                Document = printDoc,
                UseEXDialog = true,
                AllowSelection = false,
                AllowCurrentPage = false
            })
            {
                if (printDlg.ShowDialog() != DialogResult.OK) return;
            }

            var previewDlg = new PrintPreviewDialog
            {
                Document = printDoc,
                Width = 850,
                Height = 700,
                StartPosition = FormStartPosition.CenterScreen,
                Text = $"Xem trước bản in - Hóa đơn {invoice.Code}"
            };

            previewDlg.ShowDialog();
        }

        private static void DrawInvoicePage(PrintPageEventArgs e, PrintState state)
        {
            var g = e.Graphics;
            if (g == null) return;

            var invoice = state.Invoice;
            var details = state.Details;

            var fontTitle = new Font("Segoe UI", 16F, FontStyle.Bold);
            var fontHeader = new Font("Segoe UI", 12F, FontStyle.Bold);
            var fontBold = new Font("Segoe UI", 10F, FontStyle.Bold);
            var fontRegular = new Font("Segoe UI", 10F, FontStyle.Regular);
            var fontSmall = new Font("Segoe UI", 9F, FontStyle.Italic);

            int startX = 40;
            int startY = 40;
            int totalWidth = 720;
            const int rowHeight = 26;

            // Table Columns
            int colStt = startX;
            int colName = startX + 40;
            int colUnit = startX + 360;
            int colAmount = startX + 430;
            int colPrice = startX + 510;
            int colSubtotal = startX + 610;

            state.PageNo++;
            int curY;

            if (state.PageNo == 1)
            {
                // Header Store Info
                g.DrawString("CHUM CHUM BAKERY", fontHeader, Brushes.SaddleBrown, startX, startY);
                g.DrawString("Chuyên Nguyên Liệu & Bánh Ngọt Premium", fontSmall, Brushes.Gray, startX, startY + 22);

                // Hóa đơn xuất chưa duyệt: đóng dấu đỏ để tránh nhầm phiếu đã tính kho
                if (invoice.Type == "out" && invoice.ApprovalStatus != "approved")
                {
                    string stamp = invoice.ApprovalStatus == "rejected"
                        ? "ĐÃ TỪ CHỐI — KHÔNG TÍNH VÀO KHO"
                        : "CHỜ DUYỆT — CHƯA TÍNH VÀO KHO";
                    using (var fontStamp = new Font("Segoe UI", 10F, FontStyle.Bold))
                    {
                        g.DrawString(stamp, fontStamp, Brushes.Red, startX + 440, startY);
                    }
                }

                // Title
                string titleText = invoice.Type == "in" ? "PHIẾU NHẬP KHO NGUYÊN LIỆU" : "PHIẾU XUẤT KHO NGUYÊN LIỆU";
                var sizeTitle = g.MeasureString(titleText, fontTitle);
                g.DrawString(titleText, fontTitle, Brushes.DarkSlateGray, startX + (totalWidth - sizeTitle.Width) / 2, startY + 60);

                // Invoice Info Header
                curY = startY + 110;
                g.DrawString($"Mã hóa đơn: {invoice.Code}", fontBold, Brushes.Black, startX, curY);
                g.DrawString($"Ngày lập: {invoice.InvDate:dd/MM/yyyy}", fontRegular, Brushes.Black, startX + 450, curY);

                curY += 25;
                g.DrawString($"Đối tác / Đơn vị: {invoice.Partner}", fontRegular, Brushes.Black, startX, curY);

                curY += 25;
                if (!string.IsNullOrEmpty(invoice.Note))
                {
                    g.DrawString($"Ghi chú: {invoice.Note}", fontRegular, Brushes.Black, startX, curY);
                    curY += 25;
                }

                curY += 10;
            }
            else
            {
                // Trang tiếp theo: header rút gọn kèm số trang
                g.DrawString($"Hóa đơn {invoice.Code} - trang {state.PageNo}", fontBold, Brushes.Black, startX, 40);
                g.DrawString($"Ngày lập: {invoice.InvDate:dd/MM/yyyy}", fontRegular, Brushes.Black, startX + 450, 40);
                curY = 70;
            }

            // Table Header (vẽ lại đầu bảng ở mọi trang)
            g.FillRectangle(Brushes.LightGray, startX, curY, totalWidth, 30);
            g.DrawRectangle(Pens.Black, startX, curY, totalWidth, 30);

            g.DrawString("STT", fontBold, Brushes.Black, colStt + 5, curY + 6);
            g.DrawString("Tên Sản Phẩm / Nguyên Liệu", fontBold, Brushes.Black, colName + 5, curY + 6);
            g.DrawString("ĐVT", fontBold, Brushes.Black, colUnit + 5, curY + 6);
            g.DrawString("SL", fontBold, Brushes.Black, colAmount + 5, curY + 6);
            g.DrawString("Đơn Giá", fontBold, Brushes.Black, colPrice + 5, curY + 6);
            g.DrawString("Thành Tiền", fontBold, Brushes.Black, colSubtotal + 5, curY + 6);

            curY += 30;

            // Giới hạn dưới có thể in (lấy nhỏ hơn giữa lề và vùng in được của máy)
            int bottomLimit = Math.Min(e.MarginBounds.Bottom, (int)e.PageSettings.PrintableArea.Bottom);

            // Khối cuối trang: dòng tổng (30) + khoảng trống (50) + 3 ô chữ ký (~45)
            const int footerSpace = 30 + 50 + 45;

            while (state.RowIndex < details.Count)
            {
                bool isLastRow = state.RowIndex == details.Count - 1;
                int needed = rowHeight + (isLastRow ? footerSpace : 0);

                // Hết chỗ cho dòng này (và khối cuối nếu đây là dòng cuối) => sang trang mới
                if (curY + needed > bottomLimit)
                {
                    e.HasMorePages = true;
                    return;
                }

                var d = details[state.RowIndex];
                g.DrawRectangle(Pens.Black, startX, curY, totalWidth, rowHeight);

                g.DrawString((state.RowIndex + 1).ToString(), fontRegular, Brushes.Black, colStt + 5, curY + 4);
                g.DrawString(d.ProductName, fontRegular, Brushes.Black, colName + 5, curY + 4);
                g.DrawString(d.Unit, fontRegular, Brushes.Black, colUnit + 5, curY + 4);
                g.DrawString(d.Amount.ToString("N2"), fontRegular, Brushes.Black, colAmount + 5, curY + 4);
                g.DrawString(d.Price.ToString("N0"), fontRegular, Brushes.Black, colPrice + 5, curY + 4);
                g.DrawString(d.Subtotal.ToString("N0"), fontRegular, Brushes.Black, colSubtotal + 5, curY + 4);

                state.RowIndex++;
                curY += rowHeight;
            }

            // Hết dòng: vẽ tổng cộng + chữ ký (đã bảo đảm đủ chỗ nhờ needed ở dòng cuối)
            decimal grandTotal = details.Sum(d => d.Subtotal);
            g.DrawRectangle(Pens.Black, startX, curY, totalWidth, 30);
            g.DrawString("TỔNG CỘNG TIỀN:", fontBold, Brushes.Black, colName + 5, curY + 6);
            g.DrawString(grandTotal.ToString("N0") + " VNĐ", fontBold, Brushes.DarkRed, colSubtotal + 5, curY + 6);

            curY += 50;

            // Signatures
            g.DrawString("Người Lập Phiếu", fontBold, Brushes.Black, startX + 40, curY);
            g.DrawString("(Ký, ghi rõ họ tên)", fontSmall, Brushes.Gray, startX + 30, curY + 20);

            g.DrawString("Người Giao / Nhận", fontBold, Brushes.Black, startX + 290, curY);
            g.DrawString("(Ký, ghi rõ họ tên)", fontSmall, Brushes.Gray, startX + 280, curY + 20);

            g.DrawString("Thủ Kho", fontBold, Brushes.Black, startX + 560, curY);
            g.DrawString("(Ký, ghi rõ họ tên)", fontSmall, Brushes.Gray, startX + 550, curY + 20);
        }
    }
}
