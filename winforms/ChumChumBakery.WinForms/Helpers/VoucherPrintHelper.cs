using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Printing;
using System.Linq;
using System.Windows.Forms;
using ChumChumBakery.Core.Models;
using ChumChumBakery.Core.Services;

namespace ChumChumBakery.WinForms.Helpers
{
    /// <summary>
    /// In Phiếu thu / Phiếu chi theo mẫu 01-TT / 02-TT kèm theo Thông tư
    /// 132/2018/TT-BTC (ngày 28/12/2018 của Bộ Tài chính):
    /// Đơn vị + Địa chỉ (trái, tự fill từ bảng CompanyInfo), Mẫu số +
    /// dòng Ban hành (phải), 4 ô ký: Giám đốc, Kế toán trưởng, Thủ quỹ,
    /// Người nhận/nộp tiền, và dòng "Đã nhận đủ số tiền (viết bằng chữ)".
    /// </summary>
    public static class VoucherPrintHelper
    {
        public static void PrintVoucher(CashVoucher voucher, List<CashVoucherDetail> details = null, CompanyInfo company = null)
        {
            // Không truyền dòng hạch toán thì tự đọc từ DB (in nhanh từ màn danh sách);
            // mẫu TT132 không in dòng TK — dòng hạch toán chỉ lưu/report nội bộ
            details ??= new CashVoucherService().GetVoucherDetails(voucher.Id);
            company ??= new CompanyInfoService().Get();

            var printDoc = new PrintDocument
            {
                DocumentName = $"{(voucher.Type == "thu" ? "Phieu thu" : "Phieu chi")} {voucher.Code}"
            };

            // Mặc định A4 dọc, lề hẹp — nếu bỏ qua, máy in nhiệt (khổ ~80mm) thành máy mặc định
            // sẽ cắt mất phần bên phải của phiếu rộng 720 đơn vị
            printDoc.DefaultPageSettings.Landscape = false;
            printDoc.DefaultPageSettings.Margins = new Margins(30, 30, 40, 40);
            var a4 = printDoc.PrinterSettings.PaperSizes.Cast<PaperSize>().FirstOrDefault(p => p.Kind == PaperKind.A4);
            if (a4 != null) printDoc.DefaultPageSettings.PaperSize = a4;

            printDoc.PrintPage += (s, ev) =>
            {
                if (ev.Graphics != null) DrawVoucher(ev.Graphics, voucher, details, company);
            };

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
                Text = $"Xem trước bản in - {(voucher.Type == "thu" ? "Phiếu thu" : "Phiếu chi")} {voucher.Code}"
            };

            previewDlg.ShowDialog();
        }

        // Tách riêng phần vẽ (public để render thử ra ảnh kiểm chứng bố cục mà không cần máy in)
        public static void DrawVoucher(Graphics g, CashVoucher voucher, List<CashVoucherDetail> details = null, CompanyInfo company = null)
        {
            bool isThu = voucher.Type == "thu";
            company ??= new CompanyInfo();

            var fontTitle = new Font("Segoe UI", 16F, FontStyle.Bold);
            var fontBold = new Font("Segoe UI", 10F, FontStyle.Bold);
            var fontRegular = new Font("Segoe UI", 10F, FontStyle.Regular);
            var fontSmallItalic = new Font("Segoe UI", 8F, FontStyle.Italic);
            var fontWords = new Font("Segoe UI", 10F, FontStyle.Italic);

            int startX = 40;
            int startY = 40;
            int totalWidth = 720;
            int rightX = startX + totalWidth; // mép phải của phiếu
            string dots = new string('.', 40);

            // ===== Khối trên trái: Đơn vị / Địa chỉ (tự fill từ CompanyInfo) =====
            g.DrawString("Đơn vị:", fontBold, Brushes.Black, startX, startY);
            g.DrawString(string.IsNullOrWhiteSpace(company.Name) ? "CHUM CHUM BAKERY" : company.Name,
                fontBold, Brushes.Black, startX + 60, startY);

            string address = string.IsNullOrWhiteSpace(company.Address) ? dots : company.Address;
            g.DrawString("Địa chỉ:", fontBold, Brushes.Black, startX, startY + 24);
            g.DrawString(address, fontRegular, Brushes.Black, startX + 60, startY + 24);

            // ===== Khối trên phải: Mẫu số + Ban hành theo TT 132/2018 =====
            var formCode = new Font("Segoe UI", 11F, FontStyle.Bold);
            string mauSo = $"Mẫu số {(isThu ? "01" : "02")}-TT";
            var sizeMauSo = g.MeasureString(mauSo, formCode);
            g.DrawString(mauSo, formCode, Brushes.Black, rightX - sizeMauSo.Width, startY);

            void RightAlign(string text, Font font, float y)
            {
                var size = g.MeasureString(text, font);
                g.DrawString(text, font, Brushes.Black, rightX - size.Width, y);
            }
            RightAlign("(Ban hành theo Thông tư số 132/2018/TT-BTC", fontSmallItalic, startY + 24);
            RightAlign("ngày 28/12/2018 của Bộ Tài chính)", fontSmallItalic, startY + 38);

            // ===== Tiêu đề + Ngày lập phiếu; bên phải: Quyển số / Số phiếu =====
            int titleY = startY + 150;
            string titleText = isThu ? "PHIẾU THU" : "PHIẾU CHI";
            var sizeTitle = g.MeasureString(titleText, fontTitle);
            g.DrawString(titleText, fontTitle, Brushes.Black, startX + (totalWidth - sizeTitle.Width) / 2, titleY);

            g.DrawString("Quyển số:", fontBold, Brushes.Black, rightX - 170, titleY + 4);
            g.DrawString(new string('.', 12), fontRegular, Brushes.Black, rightX - 95, titleY + 4);

            string dateWords = $"Ngày {voucher.VoucherDate:dd} tháng {voucher.VoucherDate:MM} năm {voucher.VoucherDate:yyyy}";
            var sizeDate = g.MeasureString(dateWords, fontRegular);
            g.DrawString(dateWords, fontRegular, Brushes.Black, startX + (totalWidth - sizeDate.Width) / 2, titleY + 36);

            g.DrawString("Số:", fontBold, Brushes.Black, rightX - 170, titleY + 40);
            g.DrawString(voucher.Code, fontBold, Brushes.Black, rightX - 135, titleY + 40);

            // ===== Thân phiếu =====
            int curY = titleY + 75;
            string receiver = string.IsNullOrWhiteSpace(voucher.Receiver) ? voucher.Partner : voucher.Receiver;

            void BodyLine(string label, string value, Font valueFont = null)
            {
                g.DrawString(label, fontBold, Brushes.Black, startX + 20, curY);
                g.DrawString(string.IsNullOrWhiteSpace(value) ? dots : value, valueFont ?? fontRegular,
                    Brushes.Black, new RectangleF(startX + 220, curY, totalWidth - 240, 48));
                curY += 28;
            }

            BodyLine(isThu ? "Họ và tên người nộp tiền:" : "Họ và tên người nhận tiền:", receiver, fontBold);
            BodyLine("Địa chỉ:", voucher.PartnerAddress);
            BodyLine(isThu ? "Lý do nộp:" : "Lý do chi:", voucher.Reason);
            BodyLine("Số tiền:", $"{voucher.Amount:N0} đồng", fontBold);
            // Mẫu gốc: "(Viết bằng chữ):" nằm cùng dòng Số tiền, phần chữ viết tiếp bên dưới
            BodyLine("(Viết bằng chữ):", AmountInWords.ToVietnameseWords(voucher.Amount), fontWords);
            BodyLine("Kèm theo:", string.IsNullOrWhiteSpace(voucher.AttachedDocs)
                ? "....."
                : $"{voucher.AttachedDocs} chứng từ gốc");

            if (!string.IsNullOrWhiteSpace(voucher.Note))
            {
                BodyLine("Ghi chú:", voucher.Note, fontWords);
            }

            // ===== Ngày chi/nộp tiền: căn giữa nửa phải trang, phía trên hàng chữ ký =====
            curY += 10;
            var sizeDate2 = g.MeasureString(dateWords, fontRegular);
            g.DrawString(dateWords, fontRegular, Brushes.Black,
                startX + totalWidth - (totalWidth / 2 + sizeDate2.Width) / 2, curY);

            // ===== 4 ô chữ ký theo mẫu TT132 =====
            curY += 26;
            int signTop = curY;
            int colWidth = totalWidth / 4;
            (string Title, string Note)[] signers = isThu
                ? new[] {
                    ("Giám đốc", "(Ký, họ tên, đóng dấu)"),
                    ("Kế toán trưởng", "(Ký, họ tên)"),
                    ("Thủ quỹ", "(Ký, họ tên)"),
                    ("Người nộp tiền", "(Ký, họ tên)")
                }
                : new[] {
                    ("Giám đốc", "(Ký, họ tên, đóng dấu)"),
                    ("Kế toán trưởng", "(Ký, họ tên)"),
                    ("Thủ quỹ", "(Ký, họ tên)"),
                    ("Người nhận tiền", "(Ký, họ tên)")
                };

            for (int i = 0; i < signers.Length; i++)
            {
                int colCenter = startX + colWidth * i + colWidth / 2;
                var s1 = g.MeasureString(signers[i].Title, fontBold);
                g.DrawString(signers[i].Title, fontBold, Brushes.Black, colCenter - s1.Width / 2, signTop);
                var s2 = g.MeasureString(signers[i].Note, fontSmallItalic);
                g.DrawString(signers[i].Note, fontSmallItalic, Brushes.Black, colCenter - s2.Width / 2, signTop + 22);
            }

            // ===== Dòng xác nhận cuối: người nhận tiền ghi và ký =====
            int confirmY = signTop + 120;
            g.DrawString("Đã nhận đủ số tiền (viết bằng chữ):", fontRegular, Brushes.Black, startX + 20, confirmY);
            g.DrawString(AmountInWords.ToVietnameseWords(voucher.Amount), fontBold, Brushes.Black,
                new RectangleF(startX + 20, confirmY + 22, totalWidth - 40, 30));
            g.DrawString($"(Số tiền viết bằng số): {voucher.Amount:N0} đồng", fontSmallItalic, Brushes.Black,
                startX + 20, confirmY + 50);
        }
    }
}
