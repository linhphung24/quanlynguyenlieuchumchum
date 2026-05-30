-- =============================================================
-- CHẨN ĐOÁN & SỬA: Batch thiếu cho hoá đơn nhập cũ
-- Chạy từng PHẦN trong Supabase Dashboard → SQL Editor
-- =============================================================

-- ── PHẦN 1: Kiểm tra batch đã tạo từ HD-26GNZ chưa ─────────
SELECT id, product_name, inv_code, inv_date, quantity, remaining_qty, price, unit
FROM batches
WHERE inv_code = 'HD-26GNZ'
ORDER BY id;
-- Nếu trả về 0 dòng → batch chưa được tạo (hoá đơn cũ / batch creation bị lỗi)

-- ── PHẦN 2: Xem items của invoice HD-26GNZ ──────────────────
SELECT id, inv_code, inv_date, items
FROM invoices
WHERE inv_code = 'HD-26GNZ';

-- ── PHẦN 3: Kiểm tra toàn bộ invoice nhập nào KHÔNG có batch ─
-- (hữu ích để phát hiện thêm hoá đơn tương tự)
SELECT i.inv_code, i.inv_date, COUNT(b.id) as so_lo
FROM invoices i
LEFT JOIN batches b ON b.inv_id = i.id
WHERE i.type = 'in'
GROUP BY i.id, i.inv_code, i.inv_date
HAVING COUNT(b.id) = 0
ORDER BY i.inv_date DESC
LIMIT 30;

-- ── PHẦN 4: TẠO BATCH còn thiếu cho HD-26GNZ (chạy sau khi xác nhận PHẦN 1 = 0 dòng) ──
-- Script tự động đọc items JSONB của invoice và insert vào batches
-- remaining_qty = quantity (đặt đầy đủ → cần điều chỉnh thủ công nếu đã xuất bớt)

INSERT INTO batches (product_name, inv_id, inv_code, inv_date, quantity, remaining_qty, price, unit, mfg_date, exp_date)
SELECT
  -- Chuẩn hoá tên về products table (case-insensitive match)
  COALESCE(
    (SELECT name FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM(item->>'name')) LIMIT 1),
    TRIM(item->>'name')
  ) AS product_name,
  i.id          AS inv_id,
  i.inv_code,
  i.inv_date,
  (item->>'amount')::numeric                                    AS quantity,
  (item->>'amount')::numeric                                    AS remaining_qty,  -- xem PHẦN 5 để tính chính xác hơn
  COALESCE(NULLIF(item->>'price', '')::numeric, 0)              AS price,
  COALESCE(NULLIF(item->>'unit',  ''), '')                      AS unit,
  CASE WHEN item->>'mfg_date' = '' OR item->>'mfg_date' IS NULL
       THEN NULL ELSE (item->>'mfg_date')::date END             AS mfg_date,
  CASE WHEN item->>'exp_date' = '' OR item->>'exp_date' IS NULL
       THEN NULL ELSE (item->>'exp_date')::date END             AS exp_date
FROM invoices i,
     jsonb_array_elements(i.items) AS item
WHERE i.inv_code = 'HD-26GNZ'
  AND TRIM(item->>'name') <> ''
  AND (item->>'amount')::numeric > 0
  -- An toàn: chỉ insert nếu chưa có batch nào từ invoice này
  AND NOT EXISTS (SELECT 1 FROM batches b2 WHERE b2.inv_code = 'HD-26GNZ');

-- ── PHẦN 5: Tính remaining_qty thực tế sau khi đã xuất ──────
-- (Chạy SAU PHẦN 4 để cập nhật lại remaining_qty đúng)
-- Logic: remaining = quantity - tổng qty_used đã deduct từ batch này
-- Nhưng vì batch chưa tồn tại nên batch_deductions không có record → remaining = quantity
-- → Cần kiểm tra bằng tay: stock_qty của sản phẩm có khớp với Σ remaining không?

-- Kiểm tra sau khi insert:
SELECT b.product_name, b.inv_code, b.inv_date, b.quantity, b.remaining_qty, b.price, b.unit
FROM batches b
WHERE b.inv_code = 'HD-26GNZ'
ORDER BY b.product_name;

-- So sánh Σ remaining_qty (batches) vs stock_qty (products) để phát hiện lệch:
SELECT
  p.name,
  p.stock_qty                        AS ton_hien_tai,
  COALESCE(SUM(b.remaining_qty), 0)  AS tong_remaining_lo,
  p.stock_qty - COALESCE(SUM(b.remaining_qty), 0) AS chenh_lech
FROM products p
LEFT JOIN batches b ON LOWER(TRIM(b.product_name)) = LOWER(TRIM(p.name))
WHERE LOWER(TRIM(p.name)) IN (
  SELECT LOWER(TRIM(item->>'name'))
  FROM invoices i, jsonb_array_elements(i.items) item
  WHERE i.inv_code = 'HD-26GNZ'
)
GROUP BY p.id, p.name, p.stock_qty
ORDER BY p.name;
