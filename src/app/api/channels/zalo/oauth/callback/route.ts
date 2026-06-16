import { NextRequest, NextResponse } from 'next/server'
import { exchangeZaloCode } from '@/lib/zalo'

// Zalo redirect về đây kèm ?code=...&oa_id=... sau khi OA admin cấp quyền
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  const html = (ok: boolean, msg: string) => `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kết nối Zalo OA</title>
<style>body{font-family:system-ui,sans-serif;background:#fdf6ec;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{background:#fff;border:1px solid #e8d5b7;border-radius:16px;padding:32px 40px;max-width:420px;text-align:center;box-shadow:0 8px 32px rgba(200,119,58,.12)}
.ico{font-size:48px;margin-bottom:12px}.t{font-size:18px;font-weight:700;color:${ok ? '#1a7f37' : '#c0392b'};margin-bottom:8px}
.m{font-size:13px;color:#8b5e3c;line-height:1.5}</style></head>
<body><div class="card"><div class="ico">${ok ? '✅' : '❌'}</div>
<div class="t">${ok ? 'Kết nối Zalo OA thành công!' : 'Kết nối thất bại'}</div>
<div class="m">${msg}</div></div></body></html>`

  if (error) {
    return new NextResponse(html(false, `Zalo trả về lỗi: ${error}. Vui lòng thử cấp quyền lại.`),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
  if (!code) {
    return new NextResponse(html(false, 'Không nhận được mã uỷ quyền (code) từ Zalo.'),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  try {
    await exchangeZaloCode(code)
    return new NextResponse(html(true, 'Đã lưu token. Bạn có thể đóng tab này và quay lại app để trả lời tin nhắn Zalo.'),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (e) {
    return new NextResponse(html(false, (e as Error).message),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
}
