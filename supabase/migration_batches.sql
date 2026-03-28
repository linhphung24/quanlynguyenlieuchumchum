-- =============================================================
-- MIGRATION: Thêm bảng quản lý lô hàng (Batch Tracking - FIFO)
-- Chạy file này trong Supabase Dashboard → SQL Editor
-- =============================================================

-- 1. Bảng lô hàng (mỗi dòng hóa đơn nhập = 1 lô)
CREATE TABLE IF NOT EXISTS batches (
  id            BIGSERIAL PRIMARY KEY,
  product_name  TEXT NOT NULL,
  inv_id        BIGINT NOT NULL,
  inv_code      TEXT NOT NULL DEFAULT '',
  inv_date      DATE NOT NULL,
  quantity      NUMERIC(14,3) NOT NULL DEFAULT 0,
  remaining_qty NUMERIC(14,3) NOT NULL DEFAULT 0,
  price         NUMERIC(16,2) NOT NULL DEFAULT 0,
  unit          TEXT NOT NULL DEFAULT '',
  mfg_date      DATE,
  exp_date      DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_product_date ON batches(product_name, inv_date);
CREATE INDEX IF NOT EXISTS idx_batches_inv_id       ON batches(inv_id);
CREATE INDEX IF NOT EXISTS idx_batches_exp_date     ON batches(exp_date);
CREATE INDEX IF NOT EXISTS idx_batches_remaining    ON batches(product_name, remaining_qty);

-- 2. Bảng ghi nhận lô nào bị trừ khi xuất (denormalized để không cần JOIN)
CREATE TABLE IF NOT EXISTS batch_deductions (
  id             BIGSERIAL PRIMARY KEY,
  batch_id       BIGINT NOT NULL,
  inv_id         BIGINT NOT NULL,
  qty_used       NUMERIC(14,3) NOT NULL,
  batch_inv_code TEXT NOT NULL DEFAULT '',
  batch_inv_date DATE,
  batch_price    NUMERIC(16,2) NOT NULL DEFAULT 0,
  batch_unit     TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bd_batch_id ON batch_deductions(batch_id);
CREATE INDEX IF NOT EXISTS idx_bd_inv_id   ON batch_deductions(inv_id);

-- 3. RLS policies (cho phép user đã đăng nhập đọc/ghi)
ALTER TABLE batches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_deductions  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_batches"      ON batches;
DROP POLICY IF EXISTS "auth_all_bd"           ON batch_deductions;

CREATE POLICY "auth_all_batches" ON batches
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth_all_bd" ON batch_deductions
  FOR ALL USING (auth.role() = 'authenticated');
