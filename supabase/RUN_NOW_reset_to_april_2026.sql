-- =============================================================
-- ⚡ RUN NOW: Reset mọi tồn đầu = 0, bắt đầu từ tháng 4/2026
-- =============================================================
-- Mục đích:
--   - Tháng 4/2026 trở đi là dữ liệu thật
--   - Mọi thứ TRƯỚC 2026-04-01 → xoá sạch
--   - stock_qty + batches được rebuild từ đầu, khớp đúng FIFO
--
-- Sau khi chạy, mở tab Tổng kết tháng 4 → mọi SP có tồn đầu = 0
--
-- ⚠ KHÔNG REVERT ĐƯỢC. Backup trước nếu cần.
-- =============================================================

BEGIN;

-- ── PREVIEW: Xem trước sẽ xoá bao nhiêu HĐ ──────────────────
-- (chỉ in count, không ảnh hưởng dữ liệu)
DO $$
DECLARE
  pre_april_count INT;
  april_count INT;
BEGIN
  SELECT COUNT(*) INTO pre_april_count FROM invoices WHERE inv_date < '2026-04-01';
  SELECT COUNT(*) INTO april_count     FROM invoices WHERE inv_date >= '2026-04-01';
  RAISE NOTICE '→ Sẽ XOÁ % HĐ trước 2026-04-01', pre_april_count;
  RAISE NOTICE '→ GIỮ LẠI % HĐ tháng 4/2026 trở đi', april_count;
END $$;


-- ── STEP 1: Xoá HĐ trước 2026-04-01 ──────────────────────────
-- (batch_deductions + batches sẽ xoá sạch ở STEP 2)
DELETE FROM invoices WHERE inv_date < '2026-04-01';


-- ── STEP 2: Xoá TOÀN BỘ batches + batch_deductions ──────────
-- (sẽ rebuild ở STEP 3-4)
DELETE FROM batch_deductions;
DELETE FROM batches;


-- ── STEP 3: Reset stock_qty về 0 cho TẤT CẢ products ────────
UPDATE products SET stock_qty = 0;


-- ── STEP 4: Replay FIFO toàn bộ HĐ còn lại (April 2026+) ────
-- Theo đúng thứ tự (ngày → id), giống logic của app.
DO $$
DECLARE
  inv_rec      RECORD;
  item         JSONB;
  item_name    TEXT;
  item_amount  NUMERIC;
  item_price   NUMERIC;
  item_unit    TEXT;
  batch_rec    RECORD;
  to_deduct    NUMERIC;
  deduct_qty   NUMERIC;
  inserted_count INT := 0;
  deducted_count INT := 0;
BEGIN
  FOR inv_rec IN
    SELECT id, type, inv_date, code, items
    FROM invoices
    ORDER BY inv_date ASC, id ASC
  LOOP
    FOR item IN SELECT * FROM jsonb_array_elements(inv_rec.items)
    LOOP
      item_name   := TRIM(item->>'name');
      item_amount := COALESCE((item->>'amount')::numeric, 0);
      item_price  := COALESCE((item->>'price')::numeric, 0);
      item_unit   := COALESCE(item->>'unit', '');

      CONTINUE WHEN item_name IS NULL OR item_name = '' OR item_amount <= 0;

      IF inv_rec.type = 'in' THEN
        -- Tạo batch mới cho HĐ nhập
        INSERT INTO batches (product_name, inv_id, inv_code, inv_date,
                             quantity, remaining_qty, price, unit)
        VALUES (item_name, inv_rec.id, inv_rec.code, inv_rec.inv_date,
                item_amount, item_amount, item_price, item_unit);
        inserted_count := inserted_count + 1;

      ELSE
        -- HĐ xuất: trừ FIFO từ batch cũ nhất
        to_deduct := item_amount;
        FOR batch_rec IN
          SELECT id, remaining_qty, inv_code, inv_date, price, unit
          FROM batches
          WHERE LOWER(TRIM(product_name)) = LOWER(item_name)
            AND remaining_qty > 0.005
          ORDER BY inv_date ASC, id ASC
        LOOP
          EXIT WHEN to_deduct <= 0.005;
          deduct_qty := LEAST(batch_rec.remaining_qty, to_deduct);
          UPDATE batches
             SET remaining_qty = ROUND(remaining_qty - deduct_qty, 2)
           WHERE id = batch_rec.id;
          INSERT INTO batch_deductions (
            batch_id, inv_id, qty_used,
            batch_inv_code, batch_inv_date, batch_price, batch_unit
          )
          VALUES (
            batch_rec.id, inv_rec.id, deduct_qty,
            batch_rec.inv_code, batch_rec.inv_date, batch_rec.price, batch_rec.unit
          );
          to_deduct := to_deduct - deduct_qty;
          deducted_count := deducted_count + 1;
        END LOOP;

        IF to_deduct > 0.005 THEN
          RAISE NOTICE '⚠ HĐ % (%): xuất "% " thiếu % đơn vị (không có batch)',
            inv_rec.code, inv_rec.inv_date, item_name, to_deduct;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE '✅ Đã tạo % batch + % deduction', inserted_count, deducted_count;
END $$;


-- ── STEP 5: Recompute stock_qty từ batches.remaining_qty ─────
WITH agg AS (
  SELECT LOWER(TRIM(product_name)) AS name_key,
         SUM(remaining_qty)        AS total
  FROM batches
  GROUP BY LOWER(TRIM(product_name))
)
UPDATE products p
SET stock_qty = ROUND(GREATEST(0, COALESCE(a.total, 0)), 2)
FROM agg a
WHERE LOWER(TRIM(p.name)) = a.name_key;

-- Cost_price: lấy từ HĐ nhập gần nhất
WITH latest_price AS (
  SELECT DISTINCT ON (LOWER(TRIM(product_name)))
         LOWER(TRIM(product_name)) AS name_key,
         price
  FROM batches
  WHERE price > 0
  ORDER BY LOWER(TRIM(product_name)), inv_date DESC, id DESC
)
UPDATE products p
SET cost_price = lp.price
FROM latest_price lp
WHERE LOWER(TRIM(p.name)) = lp.name_key;

COMMIT;


-- =============================================================
-- KIỂM TRA SAU KHI CHẠY
-- =============================================================
SELECT
  (SELECT COUNT(*) FROM invoices WHERE inv_date < '2026-04-01')         AS hd_truoc_apr_con_lai,  -- phải = 0
  (SELECT COUNT(*) FROM invoices WHERE inv_date >= '2026-04-01')        AS hd_apr_tro_di,         -- giữ nguyên
  (SELECT COUNT(*) FROM batches)                                         AS so_batch_sau_replay,
  (SELECT COUNT(*) FROM batch_deductions)                                AS so_deduction_sau_replay,
  (SELECT COUNT(*) FROM products WHERE stock_qty < 0)                    AS sp_stock_am,            -- phải = 0
  (SELECT COUNT(*) FROM products WHERE is_active AND stock_qty > 0)      AS sp_co_ton;
