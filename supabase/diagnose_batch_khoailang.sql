-- =============================================================
-- CHẨN ĐOÁN: Lô Khoai lang HD-A0LQ8 (12/05/2026) tồn = 0 dù chưa xuất
-- Chạy từng PHẦN trong Supabase Dashboard → SQL Editor
-- =============================================================

-- ── PHẦN 1: Lô Khoai lang 12/05 — số NHẬP & tồn LƯU trong DB ──
-- So sánh remaining_qty (lưu trong DB) với cái app hiển thị (tính từ deductions)
SELECT id, product_name, inv_code, inv_date, quantity, remaining_qty, unit
FROM batches
WHERE inv_code = 'HD-A0LQ8' AND LOWER(TRIM(product_name)) = 'khoai lang';
-- → Nếu remaining_qty ở đây = 1.6 (đúng) nhưng app hiện 0
--   ⇒ lỗi do deduction mồ côi (xem PHẦN 4).

-- ── PHẦN 2: Cái gì đã TRỪ lô này? HĐ xuất còn tồn tại không? ──
SELECT bd.id, bd.qty_used, bd.inv_id,
       i.code AS hd_xuat, i.inv_date AS ngay_xuat, i.type,
       CASE
         WHEN i.id IS NULL     THEN '❌ HĐ xuất ĐÃ BỊ XOÁ (deduction mồ côi)'
         WHEN i.type <> 'out'  THEN '⚠️ inv_id trỏ vào HĐ không phải xuất'
         ELSE '✅ HĐ xuất hợp lệ'
       END AS trang_thai
FROM batch_deductions bd
JOIN batches  b ON b.id = bd.batch_id
LEFT JOIN invoices i ON i.id = bd.inv_id
WHERE b.inv_code = 'HD-A0LQ8' AND LOWER(TRIM(b.product_name)) = 'khoai lang'
ORDER BY bd.id;

-- ── PHẦN 3: Đối chiếu tổng Khoai lang (toàn bộ lô) ───────────
SELECT
  (SELECT SUM(quantity)      FROM batches
     WHERE LOWER(TRIM(product_name)) = 'khoai lang')                         AS tong_nhap,
  (SELECT SUM(remaining_qty) FROM batches
     WHERE LOWER(TRIM(product_name)) = 'khoai lang')                         AS tong_ton_luu_DB,
  (SELECT COALESCE(SUM(bd.qty_used), 0) FROM batch_deductions bd
     JOIN batches b ON b.id = bd.batch_id
     WHERE LOWER(TRIM(b.product_name)) = 'khoai lang')                       AS tong_da_tru;
-- Đúng thì: tong_da_tru = tong_nhap - tong_ton_luu_DB
-- Nếu tong_da_tru > (tong_nhap - tong_ton_luu_DB) ⇒ có deduction THỪA/mồ côi.

-- ── PHẦN 4: Liệt kê deduction Khoai lang MỒ CÔI (HĐ xuất đã bị xoá) ──
-- Đây thường là nguyên nhân lô bị tính về 0 oan.
SELECT bd.id, bd.batch_id, bd.batch_inv_code, bd.qty_used, bd.inv_id
FROM batch_deductions bd
JOIN batches b ON b.id = bd.batch_id
LEFT JOIN invoices i ON i.id = bd.inv_id
WHERE LOWER(TRIM(b.product_name)) = 'khoai lang'
  AND i.id IS NULL          -- inv_id không trỏ tới hóa đơn nào còn tồn tại
ORDER BY bd.id;

-- ── PHẦN 5 (CHỈ chạy sau khi PHẦN 4 xác nhận có deduction mồ côi) ──
-- Cách an toàn & xác định: (1) xoá deduction mồ côi, (2) TÍNH LẠI remaining_qty
-- cho TẤT CẢ lô theo công thức chuẩn = số nhập − tổng deduction hợp lệ.
-- Không cộng dồn nên không bao giờ bị tính trùng. Bỏ comment để chạy.
/*
-- (1) Xoá mọi deduction trỏ tới hóa đơn không còn tồn tại
DELETE FROM batch_deductions bd
WHERE NOT EXISTS (SELECT 1 FROM invoices i WHERE i.id = bd.inv_id);

-- (2) Tính lại tồn từng lô = quantity − Σ deduction hợp lệ (đồng bộ với cách app hiển thị)
UPDATE batches b
SET remaining_qty = GREATEST(0, b.quantity - COALESCE(
  (SELECT SUM(bd.qty_used) FROM batch_deductions bd WHERE bd.batch_id = b.id), 0
));

-- (3) (Tuỳ chọn) đồng bộ lại products.stock_qty = Σ remaining_qty của các lô
UPDATE products p
SET stock_qty = COALESCE(
  (SELECT SUM(b.remaining_qty) FROM batches b
   WHERE LOWER(TRIM(b.product_name)) = LOWER(TRIM(p.name))), 0
);
*/
