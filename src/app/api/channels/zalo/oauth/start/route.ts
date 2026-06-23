import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signState } from '@/lib/facebook'
import { getZaloAppCreds, genCodeVerifier, codeChallengeS256, buildZaloOAuthUrl } from '@/lib/zalo'

// Khởi tạo luồng OAuth Zalo OA: xác thực admin → trả URL trang cấp quyền.
// code_verifier (PKCE) lưu tạm trong cookie httpOnly để callback đọc lại.
export async function POST(req: NextRequest) {
  try {
    const url        = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Server chưa cấu hình Supabase' }, { status: 500 })
    }

    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
    if (!token) return NextResponse.json({ error: 'Thiếu token xác thực' }, { status: 401 })

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Phiên đăng nhập không hợp lệ' }, { status: 401 })
    }
    const uid = userData.user.id
    const { data: prof } = await admin.from('profiles').select('role').eq('id', uid).single()
    if (prof?.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin được kết nối Zalo' }, { status: 403 })
    }

    const { appId } = await getZaloAppCreds()
    const origin = req.headers.get('origin') || new URL(req.url).origin
    const redirectUri = `${origin}/api/channels/zalo/oauth/callback`
    const verifier  = genCodeVerifier()
    const challenge = codeChallengeS256(verifier)
    const state     = signState(uid)

    const res = NextResponse.json({ ok: true, url: buildZaloOAuthUrl(appId, redirectUri, state, challenge) })
    res.cookies.set('zalo_cv', verifier, {
      httpOnly: true,
      secure: origin.startsWith('https'),
      sameSite: 'lax',
      path: '/api/channels/zalo/oauth',
      maxAge: 600, // 10 phút
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
