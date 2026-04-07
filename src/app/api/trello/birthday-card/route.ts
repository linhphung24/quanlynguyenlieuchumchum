import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(_req: NextRequest) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const trelloKey = process.env.TRELLO_API_KEY
    const trelloToken = process.env.TRELLO_TOKEN
    const trelloListId = process.env.TRELLO_LIST_ID

    if (!serviceKey || !url) {
      return NextResponse.json({ error: 'Thiếu SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }
    if (!trelloKey || !trelloToken || !trelloListId) {
      return NextResponse.json({ error: 'Thiếu cấu hình Trello (TRELLO_API_KEY / TRELLO_TOKEN / TRELLO_LIST_ID)' }, { status: 500 })
    }

    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Lấy tháng & năm hiện tại
    const now = new Date()
    const month = now.getMonth() + 1   // 1–12
    const year = now.getFullYear()

    // Query tất cả nhân sự đang làm việc
    const { data: personnel, error } = await adminClient
      .from('personnel')
      .select('full_name, dob, position, department')
      .eq('is_active', true)
      .order('dob')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Lọc người có sinh nhật trong tháng hiện tại
    const birthdays = (personnel ?? []).filter((p: { dob: string }) => {
      if (!p.dob) return false
      const dobMonth = parseInt(p.dob.split('-')[1], 10)
      return dobMonth === month
    })

    if (birthdays.length === 0) {
      return NextResponse.json({ ok: true, sent: false, message: `Không có sinh nhật tháng ${month}` })
    }

    // Xây dựng nội dung card
    const cardName = `🎂 Sinh nhật tháng ${month}/${year}`

    const lines = birthdays.map((p: { full_name: string; dob: string; position?: string; department?: string }) => {
      const parts = p.dob.split('-')
      const dayMonth = parts.length >= 3 ? `${parts[2]}/${parts[1]}` : p.dob
      const role = [p.position, p.department].filter(Boolean).join(' – ')
      return `• ${p.full_name} — ${dayMonth}${role ? ` (${role})` : ''}`
    })

    const cardDesc = [
      `Danh sách nhân viên có sinh nhật trong tháng ${month}/${year}:`,
      '',
      ...lines,
      '',
      `_Tự động tạo bởi hệ thống Chum Chum Bakery_`,
    ].join('\n')

    // Gọi Trello API tạo card
    const trelloUrl = new URL('https://api.trello.com/1/cards')
    trelloUrl.searchParams.set('key', trelloKey)
    trelloUrl.searchParams.set('token', trelloToken)
    trelloUrl.searchParams.set('idList', trelloListId)
    trelloUrl.searchParams.set('name', cardName)
    trelloUrl.searchParams.set('desc', cardDesc)

    const trelloRes = await fetch(trelloUrl.toString(), { method: 'POST' })
    if (!trelloRes.ok) {
      const errText = await trelloRes.text()
      return NextResponse.json({ error: `Trello API lỗi: ${errText}` }, { status: 500 })
    }

    const trelloData = await trelloRes.json()

    return NextResponse.json({
      ok: true,
      sent: true,
      count: birthdays.length,
      cardUrl: trelloData.shortUrl ?? trelloData.url,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
