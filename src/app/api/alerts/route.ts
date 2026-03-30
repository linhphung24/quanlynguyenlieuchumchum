import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const DAYS_EXPIRY_WARN = 30 // cảnh báo lô sắp hết hạn trong 30 ngày tới

// ─── helpers ────────────────────────────────────────────────
function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function fmtDate(d?: string | null) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function fmtNum(n: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n)
}

function fmtPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

// ─── build HTML email ────────────────────────────────────────
function buildHtml(
  lowStockProducts: { name: string; stock_qty: number; min_stock: number; unit: string }[],
  expiringBatches: { product_name: string; inv_code: string; inv_date: string; remaining_qty: number; unit: string; exp_date: string; days: number }[]
): string {
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

  const lowStockRows = lowStockProducts.length === 0
    ? '<tr><td colspan="4" style="text-align:center;color:#888;padding:8px">Không có sản phẩm nào dưới mức tối thiểu</td></tr>'
    : lowStockProducts.map(p => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #f0e8d8">${p.name}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f0e8d8;text-align:right;color:#d94f3d;font-weight:bold">${fmtNum(p.stock_qty)} ${p.unit}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f0e8d8;text-align:right">${fmtNum(p.min_stock)} ${p.unit}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f0e8d8;text-align:right;color:#d94f3d">${fmtNum(p.min_stock - p.stock_qty)} ${p.unit}</td>
      </tr>`).join('')

  const expiringRows = expiringBatches.length === 0
    ? '<tr><td colspan="5" style="text-align:center;color:#888;padding:8px">Không có lô nào sắp hết hạn</td></tr>'
    : expiringBatches.map(b => {
      const isExpired = b.days < 0
      const color = isExpired ? '#d94f3d' : b.days <= 7 ? '#c8773a' : '#8b5e3c'
      const label = isExpired ? `Quá hạn ${Math.abs(b.days)} ngày` : b.days === 0 ? 'Hết hạn HÔM NAY' : `Còn ${b.days} ngày`
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #f0e8d8">${b.product_name}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f0e8d8">${b.inv_code}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f0e8d8;text-align:right">${fmtNum(b.remaining_qty)} ${b.unit}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f0e8d8;text-align:center">${fmtDate(b.exp_date)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f0e8d8;text-align:center;color:${color};font-weight:bold">${label}</td>
      </tr>`
    }).join('')

  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>Cảnh báo tồn kho</title></head>
<body style="font-family:Arial,sans-serif;background:#fdf6ec;padding:24px;color:#3d1f0a">
  <div style="max-width:680px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(200,119,58,0.12)">

    <!-- header -->
    <div style="background:linear-gradient(135deg,#c8773a,#e8a44a);padding:24px 32px">
      <h1 style="margin:0;font-size:20px;color:white">🔔 Cảnh báo tồn kho</h1>
      <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.85)">Kiểm tra lúc ${now}</p>
    </div>

    <div style="padding:24px 32px">

      <!-- low stock -->
      <h2 style="font-size:15px;color:#c8773a;margin:0 0 12px">
        ⚠️ Tồn kho dưới mức tối thiểu
        <span style="font-size:12px;font-weight:normal;color:#8b5e3c;margin-left:8px">(${lowStockProducts.length} sản phẩm)</span>
      </h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:13px">
        <thead>
          <tr style="background:#f5e6cc">
            <th style="text-align:left;padding:7px 10px">Sản phẩm</th>
            <th style="text-align:right;padding:7px 10px">Tồn kho</th>
            <th style="text-align:right;padding:7px 10px">Tối thiểu</th>
            <th style="text-align:right;padding:7px 10px">Thiếu</th>
          </tr>
        </thead>
        <tbody>${lowStockRows}</tbody>
      </table>

      <!-- expiring batches -->
      <h2 style="font-size:15px;color:#c8773a;margin:0 0 12px">
        📦 Lô hàng sắp hết hạn / đã hết hạn
        <span style="font-size:12px;font-weight:normal;color:#8b5e3c;margin-left:8px">(${expiringBatches.length} lô)</span>
      </h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px">
        <thead>
          <tr style="background:#f5e6cc">
            <th style="text-align:left;padding:7px 10px">Sản phẩm</th>
            <th style="text-align:left;padding:7px 10px">Mã lô</th>
            <th style="text-align:right;padding:7px 10px">Còn lại</th>
            <th style="text-align:center;padding:7px 10px">HSD</th>
            <th style="text-align:center;padding:7px 10px">Tình trạng</th>
          </tr>
        </thead>
        <tbody>${expiringRows}</tbody>
      </table>

    </div>

    <div style="background:#fdf6ec;padding:14px 32px;font-size:11px;color:#8b5e3c;text-align:center">
      Email tự động từ hệ thống Quản lý Nguyên liệu — vui lòng không trả lời email này.
    </div>
  </div>
</body>
</html>`
}

// ─── POST /api/alerts ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Validate env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
    const smtpHost    = process.env.SMTP_HOST
    const smtpPort    = parseInt(process.env.SMTP_PORT || '587')
    const smtpUser    = process.env.SMTP_USER
    const smtpPass    = process.env.SMTP_PASS
    const emailTo     = process.env.ALERT_EMAIL_TO

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local' }, { status: 500 })
    }
    if (!smtpHost || !smtpUser || !smtpPass || !emailTo) {
      return NextResponse.json({ error: 'Thiếu cấu hình SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS, ALERT_EMAIL_TO) trong .env.local' }, { status: 500 })
    }

    // Supabase admin client
    const sb = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1. Query low-stock products
    const { data: products } = await sb
      .from('products')
      .select('name, stock_qty, min_stock, unit')
      .eq('is_active', true)
      .filter('min_stock', 'gt', 0)

    const lowStockProducts = (products || []).filter(
      (p: { stock_qty: number; min_stock: number }) => p.stock_qty < p.min_stock
    ) as { name: string; stock_qty: number; min_stock: number; unit: string }[]

    // 2. Query expiring/expired batches (remaining > 0, exp_date within DAYS_EXPIRY_WARN days or already expired)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + DAYS_EXPIRY_WARN)

    const { data: batches } = await sb
      .from('batches')
      .select('product_name, inv_code, inv_date, remaining_qty, unit, exp_date')
      .gt('remaining_qty', 0)
      .not('exp_date', 'is', null)
      .lte('exp_date', cutoff.toISOString().split('T')[0])
      .order('exp_date', { ascending: true })

    const expiringBatches = ((batches || []) as {
      product_name: string; inv_code: string; inv_date: string
      remaining_qty: number; unit: string; exp_date: string
    }[]).map(b => ({ ...b, days: daysUntil(b.exp_date) }))

    // If nothing to alert, skip email
    if (lowStockProducts.length === 0 && expiringBatches.length === 0) {
      return NextResponse.json({ ok: true, sent: false, message: 'Không có cảnh báo nào — email không gửi.' })
    }

    // 3. Send email
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    const subject = [
      lowStockProducts.length > 0 ? `${lowStockProducts.length} SP tồn kho thấp` : '',
      expiringBatches.length > 0 ? `${expiringBatches.length} lô sắp hết hạn` : '',
    ].filter(Boolean).join(', ')

    await transporter.sendMail({
      from: `"Quản lý Nguyên liệu" <${smtpUser}>`,
      to: emailTo,
      subject: `🔔 Cảnh báo: ${subject}`,
      html: buildHtml(lowStockProducts, expiringBatches),
    })

    return NextResponse.json({
      ok: true,
      sent: true,
      lowStockCount: lowStockProducts.length,
      expiringCount: expiringBatches.length,
    })
  } catch (e: unknown) {
    console.error('[alerts]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
