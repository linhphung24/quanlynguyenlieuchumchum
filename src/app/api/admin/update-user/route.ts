import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !url) return null
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// GET: lấy email hiện tại của user (profiles không lưu email — email ở auth.users)
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const admin = adminClient()
  if (!admin) return NextResponse.json({ error: 'Server chưa cấu hình SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })

  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ email: data.user?.email ?? '' })
}

// POST: cập nhật tên (profiles) + email/mật khẩu (auth)
export async function POST(req: NextRequest) {
  try {
    const { userId, fullName, email, password } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const admin = adminClient()
    if (!admin) return NextResponse.json({ error: 'Server chưa cấu hình SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })

    // Validate
    if (password && String(password).length < 6) {
      return NextResponse.json({ error: 'Mật khẩu tối thiểu 6 ký tự' }, { status: 400 })
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 })
    }

    // Cập nhật auth (email / mật khẩu) nếu có
    const authUpdate: { email?: string; password?: string; email_confirm?: boolean } = {}
    if (email)    { authUpdate.email = String(email).trim(); authUpdate.email_confirm = true }
    if (password) { authUpdate.password = String(password) }
    if (Object.keys(authUpdate).length > 0) {
      const { error } = await admin.auth.admin.updateUserById(userId, authUpdate)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Cập nhật tên hiển thị (profiles)
    if (typeof fullName === 'string' && fullName.trim()) {
      const { data, error } = await admin
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', userId)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!data)  return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
