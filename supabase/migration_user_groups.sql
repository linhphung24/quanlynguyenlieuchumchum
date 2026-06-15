-- =============================================================
-- Migration: Nhóm người dùng + phân quyền tab (side menu)
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================================

-- Bảng nhóm người dùng (tự định nghĩa)
CREATE TABLE IF NOT EXISTS user_groups (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  description   TEXT,
  allowed_pages TEXT[] NOT NULL DEFAULT '{}',   -- danh sách PageName được phép xem
  created_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

-- Mỗi user thuộc tối đa 1 nhóm (NULL = dùng quyền mặc định theo role)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS group_id INT
  REFERENCES user_groups(id) ON DELETE SET NULL;

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;

-- Tất cả user đã đăng nhập đều ĐỌC được (để tính quyền của chính mình)
DROP POLICY IF EXISTS "read_user_groups" ON user_groups;
CREATE POLICY "read_user_groups" ON user_groups
  FOR SELECT TO authenticated USING (true);

-- Chỉ admin được THÊM/SỬA/XOÁ nhóm
DROP POLICY IF EXISTS "admin_write_user_groups" ON user_groups;
CREATE POLICY "admin_write_user_groups" ON user_groups
  FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Lưu ý: việc gán group_id cho profiles được thực hiện qua API route
-- /api/admin/assign-group (service role key) để tránh phụ thuộc RLS của bảng profiles.

-- ── (Tuỳ chọn) Tạo sẵn vài nhóm mẫu ──────────────────────────
-- INSERT INTO user_groups (name, description, allowed_pages) VALUES
--   ('Trực page',  'Nhân viên trực page trả lời khách', ARRAY['channels']),
--   ('Kho',        'Nhân viên kho',                     ARRAY['products','invoices','reports']),
--   ('Bếp',        'Nhân viên sản xuất',                ARRAY['recipes','calc','log'])
-- ON CONFLICT (name) DO NOTHING;
