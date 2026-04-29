-- =============================================================
-- ⚡ RUN NOW: Đồng bộ stock_qty + batches theo invoices
-- =============================================================
-- Cách dùng: Mở Supabase Dashboard → SQL Editor → paste
-- toàn bộ file này → Run. Xong.
--
-- Tất cả 4 STEP chạy trong 1 transaction:
--   1. UPDATE stock_qty = MAX(0, Σ(nhập − xuất))
--   2. DELETE batch INIT cũ (inv_id = 0)
--   3. INSERT batch INIT mới cho phần thiếu
--   4. SELECT kiểm tra — phải hiển thị 0
--
-- An toàn: chỉ động vào batches có inv_id = 0 (sentinel),
-- không ảnh hưởng batch từ HĐ thật (inv_id > 0).
-- =============================================================

BEGIN;

-- ── STEP 1: Đồng bộ products.stock_qty về theo HĐ ──────────
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
UPDATE products p
SET stock_qty = GREATEST(0, COALESCE(h.net, 0))
FROM hist h
WHERE LOWER(TRIM(p.name)) = h.name_key
  AND p.is_active = true
  AND ABS(p.stock_qty - GREATEST(0, COALESCE(h.net, 0))) > 0.005;

-- Reset stock_qty về 0 cho mọi SP đang âm mà KHÔNG có HĐ nào
UPDATE products
SET stock_qty = 0
WHERE is_active = true
  AND stock_qty < 0;


-- ── STEP 2: Xoá batch INIT cũ (sẽ tạo lại ở STEP 3) ────────
DELETE FROM batches WHERE inv_id = 0;


-- ── STEP 3: Tạo batch INIT mới cho phần thiếu ──────────────
WITH product_stock AS (
  SELECT p.id, p.name, p.stock_qty, p.unit, COALESCE(p.cost_price, 0) AS cost_price
  FROM products p
  WHERE p.is_active = true AND p.stock_qty > 0
),
batch_remaining AS (
  SELECT LOWER(TRIM(b.product_name)) AS name_key, SUM(b.remaining_qty) AS total_remaining
  FROM batches b
  WHERE b.remaining_qty > 0.005
  GROUP BY LOWER(TRIM(b.product_name))
),
mismatched AS (
  SELECT ps.id, ps.name, ps.unit, ps.cost_price, ps.stock_qty,
         COALESCE(br.total_remaining, 0) AS batch_total,
         ps.stock_qty - COALESCE(br.total_remaining, 0) AS missing_qty
  FROM product_stock ps
  LEFT JOIN batch_remaining br ON br.name_key = LOWER(TRIM(ps.name))
  WHERE ps.stock_qty > COALESCE(br.total_remaining, 0) + 0.005
)
INSERT INTO batches (
  product_name, inv_id, inv_code, inv_date,
  quantity, remaining_qty, price, unit
)
SELECT m.name, 0, 'INIT-' || m.id, CURRENT_DATE,
       m.missing_qty, m.missing_qty, m.cost_price, m.unit
FROM mismatched m;

COMMIT;


-- ── STEP 4: KIỂM TRA — phải hiển thị 0 ──────────────────────
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
  COUNT(*)                                           AS so_san_pham_con_lech,
  (SELECT COUNT(*) FROM products WHERE stock_qty < 0 AND is_active = true) AS so_sp_con_am,
  (SELECT COUNT(*) FROM batches WHERE inv_id = 0)    AS so_batch_init_da_tao
FROM products p
LEFT JOIN hist h ON h.name_key = LOWER(TRIM(p.name))
WHERE p.is_active = true
  AND ABS(p.stock_qty - GREATEST(0, COALESCE(h.net, 0))) > 0.005;
