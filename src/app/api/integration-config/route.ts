import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lưu cấu hình tích hợp kênh (Facebook/Zalo) bằng service role key.
// Tránh hẳn auth-lock của supabase-js phía client (treo khi refresh token / nhiều tab).

export async function POST(req: NextRequest) {
  try {
    const url        = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Server chưa cấu hình SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    // Lấy access token từ header Authorization
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
    if (!token) return NextResponse.json({ error: 'Thiếu token xác thực' }, { status: 401 })

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Xác thực user + kiểm tra quyền admin
    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Phiên đăng nhập không hợp lệ' }, { status: 401 })
    }
    const uid = userData.user.id
    const { data: prof } = await admin.from('profiles').select('role, full_name').eq('id', uid).single()
    if (prof?.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin được lưu cấu hình' }, { status: 403 })
    }

    // Lấy danh sách key/value cần lưu
    const body = await req.json()
    const items = body?.items as { key: string; value: string }[] | undefined
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Dữ liệu rỗng' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const payload = items.map(i => ({
      key: String(i.key),
      value: i.value ?? '',
      updated_by: prof.full_name || userData.user.email || '',
      updated_at: now,
    }))

    const { error: upErr } = await admin
      .from('integration_config')
      .upsert(payload, { onConflict: 'key' })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    return NextResponse.json({ ok: true, saved: payload.length })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
