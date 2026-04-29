-- =============================================================
-- FULL SYNC: Đồng bộ stock_qty + batches về theo lịch sử invoices
-- =============================================================
-- ĐIỀU KIỆN ÁP DỤNG:
--   ✅ Tất cả sản phẩm đều được nhập qua web (qua hoá đơn)
--   ✅ Không có seed stock_qty thủ công bằng SQL
--
-- HÀNH ĐỘNG:
--   STEP 1: stock_qty = MAX(0, Σ(nhập) − Σ(xuất))
--   STEP 2: Xoá batch INIT cũ (inv_id=0) — sẽ tạo lại
--   STEP 3: Tạo batch INIT mới cho phần thiếu
--           = stock_qty − Σ(remaining_qty các batch còn lại)
--
-- AN TOÀN:
--   - Batch từ HĐ thật (inv_id > 0) KHÔNG bị động vào
--   - Chỉ batch INIT (inv_id = 0) bị xoá + tạo lại
--   - Có thể chạy LẠI nhiều lần — kết quả vẫn đúng (idempotent)
-- =============================================================

-- ── PREVIEW: xem trước thay đổi (KHÔNG ghi DB) ──────────────
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
SELECT p.id, p.name, p.unit,
       p.stock_qty                                   AS stock_cu,
       GREATEST(0, COALESCE(h.net, 0))               AS stock_moi,
       GREATEST(0, COALESCE(h.net, 0)) - p.stock_qty AS chenh_lech
FROM products p
LEFT JOIN hist h ON h.name_key = LOWER(TRIM(p.name))
WHERE p.is_active = true
  AND ABS(p.stock_qty - GREATEST(0, COALESCE(h.net, 0))) > 0.005
ORDER BY ABS(p.stock_qty - GREATEST(0, COALESCE(h.net, 0))) DESC;


-- =============================================================
-- ⚠ NẾU PREVIEW OK → uncomment 3 STEP dưới đây và CHẠY 1 LẦN
-- =============================================================

-- ── STEP 1: Đồng bộ products.stock_qty về theo HĐ ──────────
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


-- ── STEP 2: Xoá batch INIT cũ (sẽ tạo lại ở STEP 3) ────────
-- DELETE FROM batches WHERE inv_id = 0;


-- ── STEP 3: Tạo batch INIT mới cho phần thiếu ──────────────
-- WITH product_stock AS (
--   SELECT p.id, p.name, p.stock_qty, p.unit, COALESCE(p.cost_price, 0) AS cost_price
--   FROM products p
--   WHERE p.is_active = true AND p.stock_qty > 0
-- ),
-- batch_remaining AS (
--   SELECT LOWER(TRIM(b.product_name)) AS name_key, SUM(b.remaining_qty) AS total_remaining
--   FROM batches b
--   WHERE b.remaining_qty > 0.005
--   GROUP BY LOWER(TRIM(b.product_name))
-- ),
-- mismatched AS (
--   SELECT ps.id, ps.name, ps.unit, ps.cost_price, ps.stock_qty,
--          COALESCE(br.total_remaining, 0) AS batch_total,
--          ps.stock_qty - COALESCE(br.total_remaining, 0) AS missing_qty
--   FROM product_stock ps
--   LEFT JOIN batch_remaining br ON br.name_key = LOWER(TRIM(ps.name))
--   WHERE ps.stock_qty > COALESCE(br.total_remaining, 0) + 0.005
-- )
-- INSERT INTO batches (
--   product_name, inv_id, inv_code, inv_date,
--   quantity, remaining_qty, price, unit
-- )
-- SELECT m.name, 0, 'INIT-' || m.id, CURRENT_DATE,
--        m.missing_qty, m.missing_qty, m.cost_price, m.unit
-- FROM mismatched m;


-- =============================================================
-- KIỂM TRA SAU KHI CHẠY: phải hiển thị 0 dòng (không còn lệch)
-- =============================================================
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
-- SELECT COUNT(*) AS so_san_pham_con_lech
-- FROM products p
-- LEFT JOIN hist h ON h.name_key = LOWER(TRIM(p.name))
-- WHERE p.is_active = true
--   AND ABS(p.stock_qty - GREATEST(0, COALESCE(h.net, 0))) > 0.005;
