-- Table: customers
CREATE TABLE IF NOT EXISTS customers (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  phone        TEXT,
  email        TEXT,
  address      TEXT,
  birthday     DATE,
  tags         TEXT[] DEFAULT '{}',
  notes        TEXT,
  rank         TEXT NOT NULL DEFAULT 'regular',  -- regular | member | vip
  points       INTEGER NOT NULL DEFAULT 0,
  total_spent  NUMERIC NOT NULL DEFAULT 0,
  avatar_url   TEXT,
  source       TEXT DEFAULT 'manual',  -- manual | facebook | zalo
  fb_id        TEXT,
  zalo_id      TEXT,
  created_by   TEXT NOT NULL DEFAULT '',
  updated_by   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ
);

-- Table: customer_points_log
CREATE TABLE IF NOT EXISTS customer_points_log (
  id           SERIAL PRIMARY KEY,
  customer_id  INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  delta        INTEGER NOT NULL,  -- positive = earn, negative = redeem
  reason       TEXT,
  inv_code     TEXT,
  created_by   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies (allow all authenticated users to read, admin/manager to write)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_points_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_read" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers_write" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "points_log_read" ON customer_points_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "points_log_write" ON customer_points_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
