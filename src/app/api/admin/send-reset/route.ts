import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !url) {
      return NextResponse.json({ error: 'Server chưa cấu hình SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Lấy email từ auth.users
    const { data: userData, error: userErr } = await adminClient.auth.admin.getUserById(userId)
    if (userErr || !userData?.user?.email) {
      return NextResponse.json({ error: 'Không tìm thấy email người dùng' }, { status: 404 })
    }

    // Gửi email reset password
    const { error: resetErr } = await adminClient.auth.resetPasswordForEmail(
      userData.user.email,
      { redirectTo: `${req.headers.get('origin') ?? ''}/` }
    )
    if (resetErr) {
      return NextResponse.json({ error: resetErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
