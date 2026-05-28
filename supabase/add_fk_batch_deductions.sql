-- Thêm FK constraint để PostgREST có thể dùng embedded join
-- (batch_deductions.batch_id → batches.id)
-- Chạy trong Supabase Dashboard → SQL Editor

ALTER TABLE batch_deductions
ADD CONSTRAINT IF NOT EXISTS batch_deductions_batch_id_fkey
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE;
