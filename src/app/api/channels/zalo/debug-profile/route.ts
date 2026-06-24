import { NextRequest, NextResponse } from 'next/server'
import { getZaloAccessToken } from '@/lib/zalo'

// TẠM THỜI — debug: xem Zalo trả gì khi lấy thông tin user.
// Mở: /api/channels/zalo/debug-profile?userId=<user_id>
// Xoá sau khi chẩn đoán xong.
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Thiếu ?userId=' }, { status: 400 })
  try {
    const token = await getZaloAccessToken()
    const data = encodeURIComponent(JSON.stringify({ user_id: userId }))
    const res = await fetch(`https://openapi.zalo.me/v3.0/oa/user/detail?data=${data}`, {
      headers: { access_token: token },
    })
    const json = await res.json().catch(() => null)
    return NextResponse.json({
      tokenOk: true,
      tokenPreview: token.slice(0, 8) + '…',
      httpStatus: res.status,
      zaloResponse: json,
    })
  } catch (e) {
    return NextResponse.json({ tokenOk: false, error: (e as Error).message })
  }
}
