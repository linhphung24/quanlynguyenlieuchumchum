-- =============================================================
-- Migration: Facebook Page Connections (flow OAuth giống Pancake)
-- Cho phép kết nối nhiều Page, mỗi Page tự lưu Page Access Token
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================================

-- Bảng các Page Facebook đã kết nối qua OAuth (multi-page)
CREATE TABLE IF NOT EXISTS channel_connections (
  id                 SERIAL PRIMARY KEY,
  channel            TEXT NOT NULL DEFAULT 'facebook' CHECK (channel IN ('facebook')),
  page_id            TEXT NOT NULL,                 -- ID Page Facebook
  page_name          TEXT,
  page_avatar        TEXT,
  page_access_token  TEXT NOT NULL,                 -- token vĩnh viễn lấy qua OAuth
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  connected_by       TEXT,                          -- email admin kết nối
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(channel, page_id)
);

-- RLS: chỉ admin được đọc/ghi (token nhạy cảm). Webhook/reply dùng service role → bypass.
ALTER TABLE channel_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS channel_connections_admin_all ON channel_connections;
CREATE POLICY channel_connections_admin_all ON channel_connections
  FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Thêm cột page_id cho threads để biết tin nhắn thuộc Page nào (multi-page).
-- NOT NULL DEFAULT '' để unique constraint thường hoạt động với upsert onConflict.
ALTER TABLE channel_threads ADD COLUMN IF NOT EXISTS page_id TEXT NOT NULL DEFAULT '';

-- Đổi unique key: PSID là duy nhất theo từng Page → khoá theo (channel, page_id, platform_id)
ALTER TABLE channel_threads DROP CONSTRAINT IF EXISTS channel_threads_channel_platform_id_key;
ALTER TABLE channel_threads
  ADD CONSTRAINT channel_threads_channel_page_platform_key
  UNIQUE (channel, page_id, platform_id);
