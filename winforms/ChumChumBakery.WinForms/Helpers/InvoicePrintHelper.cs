using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Printing;
using System.Windows.Forms;
using ChumChumBakery.Core.Models;

namespace ChumChumBakery.WinForms.Helpers
{
    public static class InvoicePrintHelper
    {
        public static void PrintInvoice(Invoice invoice, List<InvoiceDetail> details)
        {
            var printDoc = new PrintDocument();
            printDoc.PrintPage += (sender, e) => DrawInvoicePage(e, invoice, details);

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

        private static void DrawInvoicePage(PrintPageEventArgs e, Invoice invoice, List<InvoiceDetail> details)
        {
            var g = e.Graphics;
            if (g == null) return;

            var fontTitle = new Font("Segoe UI", 16F, FontStyle.Bold);
            var fontHeader = new Font("Segoe UI", 12F, FontStyle.Bold);
            var fontBold = new Font("Segoe UI", 10F, FontStyle.Bold);
            var fontRegular = new Font("Segoe UI", 10F, FontStyle.Regular);
            var fontSmall = new Font("Segoe UI", 9F, FontStyle.Italic);

            int startX = 40;
            int startY = 40;
            int totalWidth = 720;

            // Header Store Info
            g.DrawString("CHUM CHUM BAKERY", fontHeader, Brushes.SaddleBrown, startX, startY);
            g.DrawString("Chuyên Nguyên Liệu & Bánh Ngọt Premium", fontSmall, Brushes.Gray, startX, startY + 22);

            // Title
            string titleText = invoice.Type == "in" ? "PHIẾU NHẬP KHO NGUYÊN LIỆU" : "PHIẾU XUẤT KHO NGUYÊN LIỆU";
            var sizeTitle = g.MeasureString(titleText, fontTitle);
            g.DrawString(titleText, fontTitle, Brushes.DarkSlateGray, startX + (totalWidth - sizeTitle.Width) / 2, startY + 60);

            // Invoice Info Header
            int curY = startY + 110;
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

            // Table Columns
            int colStt = startX;
            int colName = startX + 40;
            int colUnit = startX + 360;
            int colAmount = startX + 430;
            int colPrice = startX + 510;
            int colSubtotal = startX + 610;

            // Draw Table Header
            g.FillRectangle(Brushes.LightGray, startX, curY, totalWidth, 30);
            g.DrawRectangle(Pens.Black, startX, curY, totalWidth, 30);

            g.DrawString("STT", fontBold, Brushes.Black, colStt + 5, curY + 6);
            g.DrawString("Tên Sản Phẩm / Nguyên Liệu", fontBold, Brushes.Black, colName + 5, curY + 6);
            g.DrawString("ĐVT", fontBold, Brushes.Black, colUnit + 5, curY + 6);
            g.DrawString("SL", fontBold, Brushes.Black, colAmount + 5, curY + 6);
            g.DrawString("Đơn Giá", fontBold, Brushes.Black, colPrice + 5, curY + 6);
            g.DrawString("Thành Tiền", fontBold, Brushes.Black, colSubtotal + 5, curY + 6);

            curY += 30;

            // Draw Items
            decimal grandTotal = 0;
            int stt = 1;
            foreach (var d in details)
            {
                g.DrawRectangle(Pens.Black, startX, curY, totalWidth, 26);

                g.DrawString(stt.ToString(), fontRegular, Brushes.Black, colStt + 5, curY + 4);
                g.DrawString(d.ProductName, fontRegular, Brushes.Black, colName + 5, curY + 4);
                g.DrawString(d.Unit, fontRegular, Brushes.Black, colUnit + 5, curY + 4);
                g.DrawString(d.Amount.ToString("N2"), fontRegular, Brushes.Black, colAmount + 5, curY + 4);
                g.DrawString(d.Price.ToString("N0"), fontRegular, Brushes.Black, colPrice + 5, curY + 4);
                g.DrawString(d.Subtotal.ToString("N0"), fontRegular, Brushes.Black, colSubtotal + 5, curY + 4);

                grandTotal += d.Subtotal;
                stt++;
                curY += 26;
            }

            // Total row
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
