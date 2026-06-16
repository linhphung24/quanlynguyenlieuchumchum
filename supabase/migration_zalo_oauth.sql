-- =============================================================
-- Migration: Lưu token OAuth của Zalo OA (access + refresh)
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================================

CREATE TABLE IF NOT EXISTS channel_oauth (
  channel             TEXT PRIMARY KEY,        -- 'zalo'
  access_token        TEXT,
  refresh_token       TEXT,
  access_expires_at   TIMESTAMPTZ,             -- access_token hết hạn ~1h
  refresh_expires_at  TIMESTAMPTZ,             -- refresh_token hết hạn ~3 tháng
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bật RLS và KHÔNG tạo policy nào → client (anon/authenticated) không đọc được token.
-- Chỉ service role key (dùng trong API routes) mới truy cập được.
ALTER TABLE channel_oauth ENABLE ROW LEVEL SECURITY;
