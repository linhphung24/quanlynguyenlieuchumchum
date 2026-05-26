-- ============================================================
-- Chẩn đoán tồn lô cho 1 sản phẩm cụ thể
-- Thay tên sản phẩm ở dòng SET bên dưới rồi chạy toàn bộ file
-- ============================================================

-- PHẦN 1: Tất cả lô hàng của sản phẩm (kể cả đã hết)
SELECT
  b.id,
  b.inv_code,
  b.inv_date,
  b.quantity        AS so_luong_nhap,
  b.remaining_qty   AS con_lai,
  b.price,
  b.unit,
  b.product_name    AS ten_trong_lo
FROM batches b
WHERE lower(b.product_name) = lower('Sốt salat bánh mỳ ngọt')
ORDER BY b.inv_date ASC, b.id ASC;

-- PHẦN 2: Tất cả HĐ nhập/xuất trong invoices
SELECT
  inv.type,
  inv.code,
  inv.inv_date,
  item->>'name'              AS ten_trong_hd,
  (item->>'amount')::numeric AS so_luong
FROM invoices inv,
     jsonb_array_elements(inv.items::jsonb) item
WHERE lower(item->>'name') = lower('Sốt salat bánh mỳ ngọt')
ORDER BY inv.inv_date ASC, inv.id ASC;

-- PHẦN 3: Tất cả batch_deductions cho lô của sản phẩm này
SELECT
  bd.id,
  bd.batch_id,
  bd.inv_id,
  bd.qty_used,
  bd.batch_inv_code,
  bd.batch_inv_date
FROM batch_deductions bd
JOIN batches b ON b.id = bd.batch_id
WHERE lower(b.product_name) = lower('Sốt salat bánh mỳ ngọt')
ORDER BY bd.id ASC;

-- PHẦN 4: Đối chiếu mỗi lô — tính toán vs thực tế DB
SELECT
  b.id,
  b.inv_code,
  b.inv_date,
  b.quantity                                           AS nhap,
  COALESCE(SUM(bd.qty_used), 0)                        AS tong_da_tru,
  b.quantity - COALESCE(SUM(bd.qty_used), 0)           AS con_lai_tinh_toan,
  b.remaining_qty                                      AS con_lai_trong_db,
  ROUND((b.quantity - COALESCE(SUM(bd.qty_used), 0)
         - b.remaining_qty)::numeric, 4)               AS chenh_lech
FROM batches b
LEFT JOIN batch_deductions bd ON bd.batch_id = b.id
WHERE lower(b.product_name) = lower('Sốt salat bánh mỳ ngọt')
GROUP BY b.id, b.inv_code, b.inv_date, b.quantity, b.remaining_qty
ORDER BY b.inv_date ASC;

-- PHẦN 5: Tổng hợp nhập vs xuất trong invoices (con số thực tế)
SELECT
  SUM(CASE WHEN inv.type = 'in'  THEN (item->>'amount')::numeric ELSE 0 END) AS tong_nhap,
  SUM(CASE WHEN inv.type = 'out' THEN (item->>'amount')::numeric ELSE 0 END) AS tong_xuat,
  SUM(CASE WHEN inv.type = 'in'  THEN (item->>'amount')::numeric ELSE 0 END)
  - SUM(CASE WHEN inv.type = 'out' THEN (item->>'amount')::numeric ELSE 0 END) AS ton_thuc_te
FROM invoices inv,
     jsonb_array_elements(inv.items::jsonb) item
WHERE lower(item->>'name') = lower('Sốt salat bánh mỳ ngọt');

-- PHẦN 6: stock_qty hiện tại
SELECT name, stock_qty, unit
FROM products
WHERE lower(name) = lower('Sốt salat bánh mỳ ngọt');
