-- =============================================================
-- Migration: AI tự động trả lời tin nhắn (Facebook + Zalo)
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================================

-- Công tắc bật/tắt AI cho TỪNG cuộc trò chuyện (mặc định bật).
-- Khi nhân viên muốn tự tiếp quản 1 khách → tắt AI riêng thread đó.
ALTER TABLE channel_threads
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Cấu hình AI lưu trong integration_config (đã có sẵn bảng). Các key dùng:
--   ai_enabled    : 'true' | 'false'  — bật tính năng AI tổng thể
--   ai_auto_reply : 'true' | 'false'  — tự động gửi trả lời (false = chỉ gợi ý)
--   ai_provider   : 'gemini' | 'anthropic' | 'openai'
--   ai_api_key    : API key của nhà cung cấp đã chọn
--   ai_model      : tên model (vd gemini-2.0-flash, claude-haiku-4-5, gpt-4o-mini)
--   ai_shop_info  : thông tin tiệm (giờ mở cửa, địa chỉ, giọng văn...) — system prompt
-- Không cần tạo bảng mới; chèn sẵn hàng mặc định cho gọn (tuỳ chọn):
INSERT INTO integration_config (key, value)
VALUES
  ('ai_enabled',    'false'),
  ('ai_auto_reply', 'false'),
  ('ai_provider',   'gemini'),
  ('ai_model',      'gemini-2.0-flash'),
  ('ai_shop_info',  '')
ON CONFLICT (key) DO NOTHING;
