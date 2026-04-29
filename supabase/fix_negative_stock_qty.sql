-- =============================================================
-- FIX ĐỢT 1: Reset stock_qty cho các SP đang ÂM
-- =============================================================
-- An toàn — chỉ động vào SP có stock_qty < 0
-- Set thành MAX(0, Σ(nhập−xuất)) theo lịch sử HĐ
--
-- Sau khi chạy, chạy LẠI:
--   supabase/init_batches_for_existing_stock.sql
-- để tạo batch INIT cho phần thiếu (nếu stock_qty > 0).
-- =============================================================

-- ── Xem trước thay đổi (KHÔNG ghi DB) ──
WITH expanded AS (
  SELECT i.type, LOWER(TRIM(item->>'name')) AS name_key,
         COALESCE((item->>'amount')::numeric, 0) AS amount
  FROM invoices i, jsonb_array_elements(i.items) AS item
  WHERE COALESCE((item->>'amount')::numeric, 0) > 0
),
hist AS (
  SELECT name_key,
         SUM(CASE WHEN type='in'  THEN amount ELSE 0 END) -
         SUM(CASE WHEN type='out' THEN amount ELSE 0 END) AS net
  FROM expanded GROUP BY name_key
)
SELECT
  p.id, p.name, p.unit,
  p.stock_qty                                   AS stock_cu,
  GREATEST(0, COALESCE(h.net, 0))               AS stock_moi,
  GREATEST(0, COALESCE(h.net, 0)) - p.stock_qty AS chenh_lech
FROM products p
LEFT JOIN hist h ON h.name_key = LOWER(TRIM(p.name))
WHERE p.is_active = true
  AND p.stock_qty < 0
ORDER BY p.stock_qty ASC;


-- ── UPDATE thực sự (uncomment khi đã review xong) ──
-- WITH expanded AS (
--   SELECT i.type, LOWER(TRIM(item->>'name')) AS name_key,
--          COALESCE((item->>'amount')::numeric, 0) AS amount
--   FROM invoices i, jsonb_array_elements(i.items) AS item
--   WHERE COALESCE((item->>'amount')::numeric, 0) > 0
-- ),
-- hist AS (
--   SELECT name_key,
--          SUM(CASE WHEN type='in'  THEN amount ELSE 0 END) -
--          SUM(CASE WHEN type='out' THEN amount ELSE 0 END) AS net
--   FROM expanded GROUP BY name_key
-- )
-- UPDATE products p
-- SET stock_qty = GREATEST(0, COALESCE(h.net, 0))
-- FROM hist h
-- WHERE LOWER(TRIM(p.name)) = h.name_key
--   AND p.is_active = true
--   AND p.stock_qty < 0;


-- =============================================================
-- FIX ĐỢT 2 (TÙY CHỌN): Đồng bộ TOÀN BỘ stock_qty về theo HĐ
-- =============================================================
-- ⚠ Rủi ro: nếu SP có "tồn kho mở đầu" được seed bằng SQL
-- (không qua HĐ), số đó sẽ bị MẤT. Hãy review trước.
--
-- Khuyến nghị: chỉ chạy đợt này sau khi đã chấp nhận:
--   "Nguồn sự thật về tồn kho = lịch sử invoices, không phải seed"
-- =============================================================

-- ── Xem trước (KHÔNG ghi DB) — list mọi SP sẽ bị thay đổi ──
-- WITH expanded AS (
--   SELECT i.type, LOWER(TRIM(item->>'name')) AS name_key,
--          COALESCE((item->>'amount')::numeric, 0) AS amount
--   FROM invoices i, jsonb_array_elements(i.items) AS item
--   WHERE COALESCE((item->>'amount')::numeric, 0) > 0
-- ),
-- hist AS (
--   SELECT name_key,
--          SUM(CASE WHEN type='in'  THEN amount ELSE 0 END) -
--          SUM(CASE WHEN type='out' THEN amount ELSE 0 END) AS net
--   FROM expanded GROUP BY name_key
-- )
-- SELECT p.id, p.name, p.unit,
--        p.stock_qty                                   AS stock_cu,
--        GREATEST(0, COALESCE(h.net, 0))               AS stock_moi,
--        GREATEST(0, COALESCE(h.net, 0)) - p.stock_qty AS chenh_lech
-- FROM products p
-- LEFT JOIN hist h ON h.name_key = LOWER(TRIM(p.name))
-- WHERE p.is_active = true
--   AND ABS(p.stock_qty - GREATEST(0, COALESCE(h.net, 0))) > 0.005
-- ORDER BY ABS(p.stock_qty - GREATEST(0, COALESCE(h.net, 0))) DESC;


-- ── UPDATE thực sự (cẩn thận!) ──
-- WITH expanded AS (
--   SELECT i.type, LOWER(TRIM(item->>'name')) AS name_key,
--          COALESCE((item->>'amount')::numeric, 0) AS amount
--   FROM invoices i, jsonb_array_elements(i.items) AS item
--   WHERE COALESCE((item->>'amount')::numeric, 0) > 0
-- ),
-- hist AS (
--   SELECT name_key,
--          SUM(CASE WHEN type='in'  THEN amount ELSE 0 END) -
--          SUM(CASE WHEN type='out' THEN amount ELSE 0 END) AS net
--   FROM expanded GROUP BY name_key
-- )
-- UPDATE products p
-- SET stock_qty = GREATEST(0, COALESCE(h.net, 0))
-- FROM hist h
-- WHERE LOWER(TRIM(p.name)) = h.name_key
--   AND p.is_active = true
--   AND ABS(p.stock_qty - GREATEST(0, COALESCE(h.net, 0))) > 0.005;
