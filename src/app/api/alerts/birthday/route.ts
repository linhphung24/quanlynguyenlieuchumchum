import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

function fmtDate(d?: string | null) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function buildBirthdayHtml(
  birthdays: { full_name: string; dob: string; position?: string | null; department?: string | null; phone?: string | null }[],
  month: number,
  year: number
): string {
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

  const rows = birthdays
    .sort((a, b) => {
      const dayA = parseInt(a.dob.split('-')[2] ?? '0', 10)
      const dayB = parseInt(b.dob.split('-')[2] ?? '0', 10)
      return dayA - dayB
    })
    .map((p, i) => {
      const dobParts = p.dob.split('-')
      const dayMonth = dobParts.length >= 3 ? `${dobParts[2]}/${dobParts[1]}` : p.dob
      const role = [p.position, p.department].filter(Boolean).join(' – ')
      const bg = i % 2 === 0 ? '#ffffff' : '#fff8ee'
      return `
      <tr style="background:${bg}">
        <td style="padding:8px 12px;border-bottom:1px solid #f0e8d8;font-weight:600;color:#3d1f0a">${p.full_name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0e8d8;text-align:center;color:#c8773a;font-weight:bold">🎂 ${dayMonth}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0e8d8;color:#8b5e3c">${role || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0e8d8;color:#8b5e3c">${p.phone || '—'}</td>
      </tr>`
    }).join('')

  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>Sinh nhật tháng ${month}/${year}</title></head>
<body style="font-family:Arial,sans-serif;background:#fdf6ec;padding:24px;color:#3d1f0a">
  <div style="max-width:620px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(200,119,58,0.12)">

    <!-- header -->
    <div style="background:linear-gradient(135deg,#c8773a,#e8a44a);padding:24px 32px;text-align:center">
      <div style="font-size:48px;margin-bottom:8px">🎂</div>
      <h1 style="margin:0;font-size:22px;color:white">Sinh nhật tháng ${month}/${year}</h1>
      <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.85)">
        ${birthdays.length} nhân viên • Gửi lúc ${now}
      </p>
    </div>

    <div style="padding:24px 32px">
      <p style="margin:0 0 16px;color:#8b5e3c;font-size:14px">
        Danh sách nhân viên có sinh nhật trong <strong>tháng ${month}/${year}</strong>. Đừng quên gửi lời chúc và món quà nhỏ! 🎁
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f5e6cc">
            <th style="text-align:left;padding:8px 12px;color:#8b5e3c">Họ tên</th>
            <th style="text-align:center;padding:8px 12px;color:#8b5e3c">Ngày sinh</th>
            <th style="text-align:left;padding:8px 12px;color:#8b5e3c">Chức vụ / BP</th>
            <th style="text-align:left;padding:8px 12px;color:#8b5e3c">SĐT</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div style="background:#fdf6ec;padding:14px 32px;font-size:11px;color:#8b5e3c;text-align:center">
      Email tự động từ hệ thống Quản lý Nhân sự — Chum Chum Bakery.<br/>
      Vui lòng không trả lời email này. Được gửi lúc ${fmtDate(new Date().toISOString().split('T')[0])}.
    </div>
  </div>
</body>
</html>`
}

// ─── POST /api/alerts/birthday ───────────────────────────────
export async function POST(_req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
    const smtpHost    = process.env.SMTP_HOST
    const smtpPort    = parseInt(process.env.SMTP_PORT || '587')
    const smtpUser    = process.env.SMTP_USER
    const smtpPass    = process.env.SMTP_PASS
    const emailTo     = process.env.ALERT_EMAIL_TO

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Thiếu SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }
    if (!smtpHost || !smtpUser || !smtpPass || !emailTo) {
      return NextResponse.json({ error: 'Thiếu cấu hình SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS, ALERT_EMAIL_TO)' }, { status: 500 })
    }

    const sb = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    // Query toàn bộ nhân sự đang làm việc
    const { data: personnel, error } = await sb
      .from('personnel')
      .select('full_name, dob, position, department, phone')
      .eq('is_active', true)
      .order('dob')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Lọc sinh nhật trong tháng hiện tại
    const birthdays = ((personnel ?? []) as {
      full_name: string; dob: string; position?: string | null
      department?: string | null; phone?: string | null
    }[]).filter(p => {
      if (!p.dob) return false
      return parseInt(p.dob.split('-')[1] ?? '0', 10) === month
    })

    if (birthdays.length === 0) {
      return NextResponse.json({
        ok: true, sent: false,
        message: `Không có nhân viên nào có sinh nhật tháng ${month}/${year}`,
      })
    }

    // Gửi email
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    await transporter.sendMail({
      from: `"Chum Chum Bakery" <${smtpUser}>`,
      to: emailTo,
      subject: `🎂 Sinh nhật tháng ${month}/${year} — ${birthdays.length} nhân viên`,
      html: buildBirthdayHtml(birthdays, month, year),
    })

    return NextResponse.json({
      ok: true,
      sent: true,
      count: birthdays.length,
      month,
      year,
    })
  } catch (e: unknown) {
    console.error('[birthday-alert]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
