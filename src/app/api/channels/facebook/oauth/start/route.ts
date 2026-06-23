import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getFbAppCreds, signState, buildOAuthUrl } from '@/lib/facebook'

// Khởi tạo luồng OAuth: xác thực admin → trả về URL dialog đăng nhập Facebook.
// Frontend nhận URL rồi window.location chuyển sang Facebook.
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
      return NextResponse.json({ error: 'Chỉ admin được kết nối Facebook' }, { status: 403 })
    }

    const { appId } = await getFbAppCreds()
    const origin = req.headers.get('origin') || new URL(req.url).origin
    const redirectUri = `${origin}/api/channels/facebook/oauth/callback`
    const state = signState(uid)

    return NextResponse.json({ ok: true, url: buildOAuthUrl(appId, redirectUri, state) })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
