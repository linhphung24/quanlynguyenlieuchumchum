-- ============================================================
-- Migration: Cấu hình tích hợp kênh (Facebook / Zalo)
-- Lưu App ID, Secret, Token... để admin chỉnh sửa trên giao diện
-- Chạy trong Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS integration_config (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_by  TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed các key mặc định (rỗng) để form luôn có đủ ô
INSERT INTO integration_config (key, value) VALUES
  ('fb_app_id',          ''),
  ('fb_app_secret',      ''),
  ('fb_page_id',         ''),
  ('fb_page_token',      ''),
  ('fb_verify_token',    ''),
  ('zalo_app_id',        ''),
  ('zalo_secret',        ''),
  ('zalo_oa_id',         ''),
  ('zalo_oa_token',      ''),
  ('zalo_refresh_token', '')
ON CONFLICT (key) DO NOTHING;

-- RLS: chỉ admin được đọc & ghi (secrets nhạy cảm).
-- API routes server-side dùng service role key sẽ bypass RLS.
ALTER TABLE integration_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS integration_config_admin_all ON integration_config;
CREATE POLICY integration_config_admin_all ON integration_config
  FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
