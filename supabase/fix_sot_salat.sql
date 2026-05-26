-- ============================================================
-- FIX: Sốt salat bánh mỳ ngọt
-- Tồn thực tế: nhập 13 Kg - xuất 5 Kg = 8 Kg
-- ============================================================

BEGIN;

-- BƯỚC 1: Tạo batch còn thiếu cho HD-26GNZ
-- quantity = 12 Kg (nhập gốc)
-- remaining_qty = 8 Kg (12 - 2 của HD-4IWXQ - 2 của HD-POUNW đã xuất không có batch)
INSERT INTO batches (product_name, inv_id, inv_code, inv_date, quantity, remaining_qty, price, unit)
SELECT
  'Sốt salat bánh mỳ ngọt',
  id,
  'HD-26GNZ',
  '2026-04-11',
  12,      -- số lượng nhập gốc
  8,       -- còn lại thực tế sau khi trừ 4 Kg đã xuất (HD-4IWXQ + HD-POUNW)
  76500,
  'Kg'
FROM invoices
WHERE code = 'HD-26GNZ';

-- BƯỚC 2: Tạo batch_deductions cho HD-4IWXQ và HD-POUNW
-- (ghi nhận lịch sử xuất đã xảy ra nhưng chưa có deduction record)
INSERT INTO batch_deductions (batch_id, inv_id, qty_used, batch_inv_code, batch_inv_date, batch_price, batch_unit)
SELECT
  b.id,
  inv.id,
  CASE inv.code
    WHEN 'HD-4IWXQ' THEN 2
    WHEN 'HD-POUNW' THEN 2
  END,
  'HD-26GNZ',
  '2026-04-11',
  76500,
  'Kg'
FROM batches b, invoices inv
WHERE b.inv_code = 'HD-26GNZ'
  AND lower(b.product_name) = lower('Sốt salat bánh mỳ ngọt')
  AND inv.code IN ('HD-4IWXQ', 'HD-POUNW');

-- BƯỚC 3: Đồng bộ stock_qty về đúng lịch sử HĐ (= 8 Kg)
UPDATE products
SET stock_qty = 8
WHERE lower(name) = lower('Sốt salat bánh mỳ ngọt')
RETURNING name, stock_qty;

COMMIT;

-- ── Kiểm tra sau fix ────────────────────────────────────────
SELECT b.inv_code, b.quantity, b.remaining_qty,
       COUNT(bd.id) AS so_deductions,
       COALESCE(SUM(bd.qty_used), 0) AS tong_da_tru
FROM batches b
LEFT JOIN batch_deductions bd ON bd.batch_id = b.id
WHERE lower(b.product_name) = lower('Sốt salat bánh mỳ ngọt')
GROUP BY b.id, b.inv_code, b.quantity, b.remaining_qty
ORDER BY b.inv_date;
