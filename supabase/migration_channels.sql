-- =============================================================
-- Migration: Channels Inbox (Facebook + Zalo OA)
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================================

-- Bảng cuộc trò chuyện (1 thread = 1 khách hàng trên 1 kênh)
CREATE TABLE IF NOT EXISTS channel_threads (
  id              SERIAL PRIMARY KEY,
  channel         TEXT NOT NULL CHECK (channel IN ('facebook', 'zalo')),
  platform_id     TEXT NOT NULL,           -- PSID (Facebook) hoặc user_id (Zalo)
  display_name    TEXT,
  avatar_url      TEXT,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unread_count    INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(channel, platform_id)
);

-- Bảng từng tin nhắn
CREATE TABLE IF NOT EXISTS channel_messages (
  id              SERIAL PRIMARY KEY,
  thread_id       INT NOT NULL REFERENCES channel_threads(id) ON DELETE CASCADE,
  platform_msg_id TEXT,                    -- Message ID từ platform (tránh duplicate)
  direction       TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  content         TEXT NOT NULL,
  attachments     JSONB,                   -- [{ type: 'image', url: '...' }]
  sent_by         TEXT,                    -- email nhân viên nếu direction='out'
  raw_data        JSONB,                   -- payload gốc từ webhook (debug)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(platform_msg_id) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_channel_threads_channel_time ON channel_threads(channel, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_messages_thread ON channel_messages(thread_id, created_at ASC);

-- RLS
ALTER TABLE channel_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users có thể đọc/ghi
CREATE POLICY "authenticated_all_channel_threads" ON channel_threads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_channel_messages" ON channel_messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable Realtime cho channel_messages
ALTER PUBLICATION supabase_realtime ADD TABLE channel_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE channel_threads;
