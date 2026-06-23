import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Quản lý danh sách Page đã kết nối: GET (liệt kê), DELETE (ngắt kết nối).
// Không trả page_access_token về client.

async function authAdmin(req: NextRequest): Promise<{ admin: SupabaseClient } | { error: NextResponse }> {
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return { error: NextResponse.json({ error: 'Server chưa cấu hình Supabase' }, { status: 500 }) }
  }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return { error: NextResponse.json({ error: 'Thiếu token xác thực' }, { status: 401 }) }

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return { error: NextResponse.json({ error: 'Phiên không hợp lệ' }, { status: 401 }) }
  }
  const { data: prof } = await admin.from('profiles').select('role').eq('id', userData.user.id).single()
  if (prof?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Chỉ admin' }, { status: 403 }) }
  }
  return { admin }
}

export async function GET(req: NextRequest) {
  const r = await authAdmin(req)
  if ('error' in r) return r.error
  const { data, error } = await r.admin
    .from('channel_connections')
    .select('id, page_id, page_name, page_avatar, is_active, connected_by, created_at')
    .eq('channel', 'facebook')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, pages: data ?? [] })
}

export async function DELETE(req: NextRequest) {
  const r = await authAdmin(req)
  if ('error' in r) return r.error
  const { searchParams } = new URL(req.url)
  const pageId = searchParams.get('pageId')
  if (!pageId) return NextResponse.json({ error: 'Thiếu pageId' }, { status: 400 })

  const { error } = await r.admin
    .from('channel_connections')
    .delete()
    .eq('channel', 'facebook')
    .eq('page_id', pageId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
