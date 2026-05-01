-- Bảng lưu điều chỉnh tồn đầu tháng (chỉnh tay từ SummaryPage)
CREATE TABLE IF NOT EXISTS stock_opening_adj (
  id           SERIAL PRIMARY KEY,
  product_name TEXT        NOT NULL,
  year         INT         NOT NULL,
  month        INT         NOT NULL,
  adj_qty      NUMERIC     NOT NULL,
  note         TEXT,
  updated_by   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ,
  UNIQUE (product_name, year, month)
);

-- Trigger tự cập nhật updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_stock_opening_adj_updated_at ON stock_opening_adj;
CREATE TRIGGER trg_stock_opening_adj_updated_at
  BEFORE UPDATE ON stock_opening_adj
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: chỉ manager + admin được upsert/delete; mọi authenticated user đọc được
ALTER TABLE stock_opening_adj ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_adj" ON stock_opening_adj
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "write_adj" ON stock_opening_adj
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );
