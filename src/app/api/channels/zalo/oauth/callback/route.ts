import { NextRequest, NextResponse } from 'next/server'
import { exchangeZaloCode } from '@/lib/zalo'
import { verifyState } from '@/lib/facebook'

// Zalo redirect về đây kèm ?code=...&state=...&oa_id=... sau khi OA admin cấp quyền
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code     = searchParams.get('code')
  const state    = searchParams.get('state')
  const error    = searchParams.get('error')
  const verifier = req.cookies.get('zalo_cv')?.value

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

  // Trả HTML + xoá cookie code_verifier (dùng 1 lần)
  const respond = (ok: boolean, msg: string, status: number) => {
    const r = new NextResponse(html(ok, msg), {
      status, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
    r.cookies.set('zalo_cv', '', { path: '/api/channels/zalo/oauth', maxAge: 0 })
    return r
  }

  if (error) {
    return respond(false, `Zalo trả về lỗi: ${error}. Vui lòng thử cấp quyền lại.`, 400)
  }
  if (!code) {
    return respond(false, 'Không nhận được mã uỷ quyền (code) từ Zalo.', 400)
  }
  if (!state || !verifyState(state)) {
    return respond(false, 'Phiên kết nối không hợp lệ hoặc đã hết hạn. Vui lòng bấm "Kết nối Zalo OA" lại.', 400)
  }
  if (!verifier) {
    return respond(false, 'Thiếu code_verifier (cookie hết hạn). Vui lòng bấm "Kết nối Zalo OA" lại.', 400)
  }

  try {
    await exchangeZaloCode(code, verifier)
    return respond(true, 'Đã lưu token. Bạn có thể đóng tab này và quay lại app để trả lời tin nhắn Zalo.', 200)
  } catch (e) {
    return respond(false, (e as Error).message, 500)
  }
}
