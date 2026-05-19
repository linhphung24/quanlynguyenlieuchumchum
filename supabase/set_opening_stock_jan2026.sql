-- ============================================================
-- Set tồn đầu kỳ = 0 cho toàn bộ sản phẩm, tháng 1/2026
-- Chạy 1 lần trong Supabase Dashboard → SQL Editor
-- ============================================================
-- Ý nghĩa: khai báo rằng ngày 01/01/2026, kho bắt đầu với 0 tồn.
-- Mọi hàng tồn kho sau đó đều đến từ hoá đơn nhập.
-- ============================================================

INSERT INTO stock_opening_adj (product_name, year, month, adj_qty, updated_by)
SELECT DISTINCT name, 2026, 1, 0, 'admin-import'
FROM products
WHERE is_active = true
ON CONFLICT (product_name, year, month) DO UPDATE
  SET adj_qty    = EXCLUDED.adj_qty,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW();

-- Kiểm tra kết quả
SELECT COUNT(*) AS so_san_pham_da_khai_bao
FROM stock_opening_adj
WHERE year = 2026 AND month = 1;
