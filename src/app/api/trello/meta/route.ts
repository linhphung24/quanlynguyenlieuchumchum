import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchTrelloBoards } from '@/lib/trello'

// Trả về danh sách board + list của Trello (admin) để UI chọn dropdown.
export async function POST(req: NextRequest) {
  try {
    const url        = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) return NextResponse.json({ error: 'Server chưa cấu hình Supabase' }, { status: 500 })

    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
    if (!token) return NextResponse.json({ error: 'Thiếu token xác thực' }, { status: 401 })

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: userData, error } = await admin.auth.getUser(token)
    if (error || !userData?.user) return NextResponse.json({ error: 'Phiên đăng nhập không hợp lệ' }, { status: 401 })
    const { data: prof } = await admin.from('profiles').select('role').eq('id', userData.user.id).single()
    if (prof?.role !== 'admin') return NextResponse.json({ error: 'Chỉ admin được xem cấu hình' }, { status: 403 })

    // Cho phép truyền key/token từ form (chưa lưu) — fallback config đã lưu
    const body = await req.json().catch(() => ({})) as { apiKey?: string; token?: string }
    const boards = await fetchTrelloBoards({ apiKey: body.apiKey, token: body.token })
    return NextResponse.json({ ok: true, boards })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
