-- =============================================================
-- Migration: Log đơn hàng tạo từ chat (Trello) — chống trùng
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================================

CREATE TABLE IF NOT EXISTS channel_orders (
  id          SERIAL PRIMARY KEY,
  thread_id   INT NOT NULL REFERENCES channel_threads(id) ON DELETE CASCADE,
  card_id     TEXT,
  card_url    TEXT,
  signature   TEXT,                    -- chữ ký đơn (customer+items+when) để chống tạo trùng
  order_json  JSONB,
  created_by  TEXT,                    -- 'AI' hoặc email nhân viên
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_orders_thread ON channel_orders(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_orders_sig    ON channel_orders(thread_id, signature);

-- RLS: authenticated đọc được (xem lịch sử đơn); webhook/route dùng service role để ghi.
ALTER TABLE channel_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS channel_orders_read ON channel_orders;
CREATE POLICY channel_orders_read ON channel_orders
  FOR SELECT TO authenticated USING (true);
