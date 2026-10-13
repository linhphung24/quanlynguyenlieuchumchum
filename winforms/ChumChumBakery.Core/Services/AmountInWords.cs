using System;
using System.Text;

namespace ChumChumBakery.Core.Services
{
    /// <summary>
    /// Đọc số tiền thành chữ tiếng Việt theo chuẩn chứng từ kế toán
    /// (vd: 15.200.000 → "Mười lăm triệu hai trăm nghìn đồng chẵn").
    /// Dùng cho ô "Số tiền bằng chữ" trên form phiếu thu/chi và bản in.
    /// </summary>
    public static class AmountInWords
    {
        private static readonly string[] Digits = { "không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín" };
        private static readonly string[] GroupSuffix = { "", " nghìn", " triệu", " tỷ" };

        // decimal(18,2) tối đa 10^15 nên đủ 6 bậc nhóm (đơn vị → triệu tỷ);
        // vượt bậc này là dữ liệu bất thường, dùng công thức gần đúng phía dưới
        private static readonly string[] SuffixByGroup = { "", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ" };

        public static string ToVietnameseWords(decimal amount)
        {
            if (amount == 0) return "Không đồng";

            bool negative = amount < 0;
            long whole = (long)Math.Truncate(Math.Abs(amount));
            decimal fraction = Math.Round(Math.Abs(amount) - whole, 2);

            var sb = new StringBuilder();
            if (negative) sb.Append("âm ");

            // Tách thành các nhóm 3 chữ số (hàng đơn vị trước)
            var groups = new System.Collections.Generic.List<int>();
            if (whole == 0) groups.Add(0);
            while (whole > 0)
            {
                groups.Add((int)(whole % 1000));
                whole /= 1000;
            }

            // Đọc từ nhóm cao nhất xuống; nhóm 000 ở giữa bị bỏ qua
            for (int i = groups.Count - 1; i >= 0; i--)
            {
                int g = groups[i];
                if (g == 0) continue;

                if (sb.Length > 0) sb.Append(' ');
                // Nhóm thiếu hàng trăm ngay sau nhóm cao hơn (vd 1.000.050)
                // phải đọc "linh": "một triệu linh năm mươi"
                if (sb.Length > 0 && g < 100) sb.Append("linh ");

                sb.Append(ReadTriple(g));
                if (i < SuffixByGroup.Length)
                {
                    sb.Append(SuffixByGroup[i]);
                }
                else
                {
                    sb.Append(GroupSuffix[i % 4]);
                    for (int t = 0; t < i / 4; t++) sb.Append(" tỷ");
                }
            }

            sb.Append(" đồng");

            if (fraction > 0)
            {
                // Phần lẻ hiếm gặp với tiền VND — đọc 2 chữ số lẻ kiểu chuẩn: 2.000.000,50 → "phẩy năm không"
                // (InvariantCulture vì culture app là vi-VN: dấu phẩy thập phân)
                sb.Append(" phẩy");
                string fracText = fraction.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture);
                foreach (char c in fracText.Split('.')[1])
                {
                    sb.Append(' ').Append(Digits[c - '0']);
                }
            }
            else
            {
                sb.Append(" chẵn");
            }

            // Viết hoa chữ cái đầu cho chuẩn trình bày chứng từ
            string result = sb.ToString();
            return char.ToUpper(result[0]) + result.Substring(1);
        }

        // Đọc một nhóm 3 chữ số (0-999), áp dụng các ngoại lệ: mười, mốt, lăm, linh
        private static string ReadTriple(int n)
        {
            int hundreds = n / 100;
            int tens = (n / 10) % 10;
            int units = n % 10;

            var sb = new StringBuilder();
            if (hundreds > 0)
            {
                sb.Append(Digits[hundreds]).Append(" trăm");
            }

            if (tens == 0 && units > 0)
            {
                if (hundreds > 0) sb.Append(' ');
                sb.Append(Digits[units]);
            }
            else if (tens == 1)
            {
                if (hundreds > 0) sb.Append(' ');
                sb.Append("mười");
                if (units == 5) sb.Append(" lăm");
                else if (units > 0) sb.Append(' ').Append(Digits[units]);
            }
            else if (tens >= 2)
            {
                if (hundreds > 0) sb.Append(' ');
                sb.Append(Digits[tens]).Append(" mươi");
                if (units == 1) sb.Append(" mốt");
                else if (units == 5) sb.Append(" lăm");
                else if (units > 0) sb.Append(' ').Append(Digits[units]);
            }

            return sb.ToString();
        }
    }
}
