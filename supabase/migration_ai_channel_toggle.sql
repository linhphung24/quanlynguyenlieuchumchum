-- Thêm cấu hình bật/tắt AI theo từng kênh (mặc định bật tất cả)
INSERT INTO integration_config (key, value)
VALUES
  ('ai_channel_facebook', 'true'),
  ('ai_channel_zalo',     'true'),
  ('ai_channel_tiktok',   'true')
ON CONFLICT (key) DO NOTHING;
