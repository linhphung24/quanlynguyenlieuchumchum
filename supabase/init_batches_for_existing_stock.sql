-- =============================================================
-- INIT BATCHES: Đồng bộ batches với products.stock_qty
-- =============================================================
-- Vấn đề: Một số sản phẩm có stock_qty > 0 (do SQL seed hoặc do
-- bug case-sensitive trước đây cho phép xuất "ảo") nhưng KHÔNG
-- có batch tương ứng. Kết quả:
--   - Tổng kết hiện đúng (lấy từ products.stock_qty)
--   - Form xuất báo "Không có lô tồn kho" (không tìm thấy batch)
--
-- Script này tạo 1 batch INIT cho mỗi sản phẩm bị mismatch:
--   - inv_id = 0 (sentinel: không thuộc invoice nào)
--   - inv_code = 'INIT-{product_id}'
--   - quantity = remaining_qty = (stock_qty - tổng remaining hiện có)
--   - price = cost_price hoặc giá batch gần nhất
--
-- An toàn:
--   - inv_id=0 → KHÔNG bị xoá khi xoá hoá đơn (vì không invoice nào có id=0)
--   - Chỉ tạo batch CHO PHẦN THIẾU, không double-count
-- =============================================================

WITH product_stock AS (
  SELECT
    p.id,
    p.name,
    p.stock_qty,
    p.unit,
    COALESCE(p.cost_price, 0) AS cost_price
  FROM products p
  WHERE p.is_active = true
    AND p.stock_qty > 0
),
batch_remaining AS (
  SELECT
    LOWER(TRIM(b.product_name)) AS name_key,
    SUM(b.remaining_qty) AS total_remaining
  FROM batches b
  WHERE b.remaining_qty > 0.005   -- bỏ qua tiny float dư
  GROUP BY LOWER(TRIM(b.product_name))
),
mismatched AS (
  SELECT
    ps.id,
    ps.name,
    ps.unit,
    ps.cost_price,
    ps.stock_qty,
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
SELECT
  m.name,
  0,                              -- inv_id = 0 (sentinel)
  'INIT-' || m.id,                -- inv_code dễ phân biệt
  CURRENT_DATE,
  m.missing_qty,
  m.missing_qty,
  m.cost_price,
  m.unit
FROM mismatched m;

-- Kiểm tra kết quả: hiển thị các batch INIT vừa tạo
SELECT
  product_name,
  inv_code,
  quantity,
  remaining_qty,
  unit,
  inv_date
FROM batches
WHERE inv_id = 0
ORDER BY product_name;
