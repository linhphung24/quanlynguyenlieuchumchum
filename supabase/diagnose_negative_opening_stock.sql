-- =============================================================
-- DIAGNOSE: Liệt kê các sản phẩm bị "Tồn đầu ÂM" trong 1 tháng
-- =============================================================
-- Cách dùng:
--   1. Mở Supabase Dashboard → SQL Editor
--   2. Sửa 2 biến :target_year, :target_month (hoặc tự thay số)
--   3. Run từng phần
--
-- Logic giống SummaryPage.tsx:
--   tonCuoi = products.stock_qty - SUM(nhập sau tháng) + SUM(xuất sau tháng)
--   tonDau  = tonCuoi - SUM(nhập trong tháng) + SUM(xuất trong tháng)
--
-- Tồn đầu ÂM nghĩa là dữ liệu lệch — cần điều tra HĐ liên quan.
-- =============================================================

-- ── PHẦN 1: Bảng tổng hợp giống Tổng kết ──────────────────────
-- Sửa 2024 và 5 thành tháng/năm bạn muốn kiểm tra
WITH params AS (
  SELECT
    2026                                       AS y,
    4                                          AS m,
    make_date(2026, 4, 1)                      AS month_start,
    (make_date(2026, 4, 1) + INTERVAL '1 month - 1 day')::date AS month_end
),
expanded AS (  -- mở các items JSON ra thành rows
  SELECT
    i.id,
    i.type,
    i.inv_date,
    i.code,
    LOWER(TRIM(item->>'name'))            AS name_key,
    COALESCE((item->>'amount')::numeric,0) AS amount
  FROM invoices i,
       jsonb_array_elements(i.items) AS item
  WHERE COALESCE((item->>'amount')::numeric, 0) > 0
),
agg AS (
  SELECT
    e.name_key,
    SUM(CASE WHEN e.type='in'  AND e.inv_date BETWEEN p.month_start AND p.month_end THEN e.amount ELSE 0 END) AS nhap_m,
    SUM(CASE WHEN e.type='out' AND e.inv_date BETWEEN p.month_start AND p.month_end THEN e.amount ELSE 0 END) AS xuat_m,
    SUM(CASE WHEN e.type='in'  AND e.inv_date >  p.month_end                       THEN e.amount ELSE 0 END) AS nhap_after,
    SUM(CASE WHEN e.type='out' AND e.inv_date >  p.month_end                       THEN e.amount ELSE 0 END) AS xuat_after
  FROM expanded e CROSS JOIN params p
  GROUP BY e.name_key
),
report AS (
  SELECT
    p.id                                  AS product_id,
    p.name                                AS product_name,
    p.unit,
    p.stock_qty,
    COALESCE(a.nhap_m, 0)                 AS nhap_in_month,
    COALESCE(a.xuat_m, 0)                 AS xuat_in_month,
    COALESCE(a.nhap_after, 0)             AS nhap_after,
    COALESCE(a.xuat_after, 0)             AS xuat_after,
    (p.stock_qty - COALESCE(a.nhap_after, 0) + COALESCE(a.xuat_after, 0))
                                          AS ton_cuoi,
    (p.stock_qty - COALESCE(a.nhap_after, 0) + COALESCE(a.xuat_after, 0)
                 - COALESCE(a.nhap_m, 0)  + COALESCE(a.xuat_m, 0))
                                          AS ton_dau
  FROM products p
  LEFT JOIN agg a ON a.name_key = LOWER(TRIM(p.name))
  WHERE p.is_active = true
)
SELECT
  product_id,
  product_name,
  unit,
  stock_qty       AS stock_hien_tai,
  ton_dau,           -- ← cột này âm là vấn đề
  nhap_in_month,
  xuat_in_month,
  ton_cuoi,
  nhap_after,
  xuat_after,
  CASE
    WHEN ton_dau < 0 AND xuat_in_month > 0
      THEN '⚠ Tháng này xuất ' || xuat_in_month || ' nhưng tồn đầu chỉ ' || ton_dau
    WHEN ton_dau < 0
      THEN '⚠ Stock_qty hiện tại không đủ bù ngược lịch sử'
    ELSE 'OK'
  END AS chan_doan
FROM report
WHERE ton_dau < -0.005          -- bỏ qua sai số float nhỏ
ORDER BY ton_dau ASC;           -- âm nhiều nhất trước


-- =============================================================
-- ── PHẦN 2: Soi chi tiết HĐ của 1 sản phẩm cụ thể ───────────
-- Thay 'TÊN SẢN PHẨM' bằng tên thật (lowercase ok)
-- =============================================================
SELECT
  i.inv_date,
  i.type,
  i.code,
  i.partner,
  (item->>'name')                       AS item_name,
  (item->>'amount')::numeric            AS amount,
  (item->>'unit')                       AS unit,
  i.note
FROM invoices i,
     jsonb_array_elements(i.items) AS item
WHERE LOWER(TRIM(item->>'name')) = LOWER(TRIM('TÊN SẢN PHẨM'))
ORDER BY i.inv_date ASC, i.id ASC;


-- =============================================================
-- ── PHẦN 3: Đối chiếu stock_qty vs lịch sử HĐ ───────────────
-- So sánh stock_qty hiện tại với (Σ nhập − Σ xuất) toàn lịch sử
-- Lệch nhiều = dữ liệu hỏng (do bug case-sensitive cũ hoặc
-- cập nhật stock thủ công sai)
-- =============================================================
WITH expanded AS (
  SELECT
    i.type,
    LOWER(TRIM(item->>'name'))            AS name_key,
    COALESCE((item->>'amount')::numeric,0) AS amount
  FROM invoices i,
       jsonb_array_elements(i.items) AS item
  WHERE COALESCE((item->>'amount')::numeric, 0) > 0
),
hist AS (
  SELECT
    name_key,
    SUM(CASE WHEN type='in'  THEN amount ELSE 0 END) AS tot_nhap,
    SUM(CASE WHEN type='out' THEN amount ELSE 0 END) AS tot_xuat
  FROM expanded
  GROUP BY name_key
)
SELECT
  p.id,
  p.name,
  p.unit,
  p.stock_qty                              AS stock_thuc_te,
  COALESCE(h.tot_nhap, 0)                  AS tong_nhap,
  COALESCE(h.tot_xuat, 0)                  AS tong_xuat,
  COALESCE(h.tot_nhap, 0) - COALESCE(h.tot_xuat, 0) AS stock_theo_hd,
  p.stock_qty - (COALESCE(h.tot_nhap, 0) - COALESCE(h.tot_xuat, 0)) AS lech
FROM products p
LEFT JOIN hist h ON h.name_key = LOWER(TRIM(p.name))
WHERE p.is_active = true
  AND ABS(p.stock_qty - (COALESCE(h.tot_nhap, 0) - COALESCE(h.tot_xuat, 0))) > 0.005
ORDER BY ABS(p.stock_qty - (COALESCE(h.tot_nhap, 0) - COALESCE(h.tot_xuat, 0))) DESC;


-- =============================================================
-- ── PHẦN 4 (TÙY CHỌN — FIX): Đồng bộ stock_qty về đúng lịch sử
-- =============================================================
-- ⚠ CHỈ chạy sau khi đã review PHẦN 3 và biết rõ nên fix
-- Cập nhật products.stock_qty = SUM(nhập) - SUM(xuất) toàn HĐ
-- Sau đó cần chạy LẠI init_batches_for_existing_stock.sql
-- để đồng bộ batches.
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
-- UPDATE products p
-- SET stock_qty = GREATEST(0, COALESCE(h.net, 0))
-- FROM hist h
-- WHERE LOWER(TRIM(p.name)) = h.name_key
--   AND p.is_active = true
--   AND ABS(p.stock_qty - COALESCE(h.net, 0)) > 0.005;
