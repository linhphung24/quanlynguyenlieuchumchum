-- ============================================================
-- Migration: Công nợ nhập nguyên liệu
-- Thêm trạng thái thanh toán cho hoá đơn nhập (type='in')
-- Chạy trong Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid             BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at          TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_bill_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_by          TEXT;

-- Index hỗ trợ lọc công nợ chưa thanh toán theo NCC
CREATE INDEX IF NOT EXISTS idx_invoices_debt
  ON invoices (type, paid, partner)
  WHERE type = 'in';
