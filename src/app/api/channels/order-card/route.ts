import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createTrelloCard, buildOrderCard, orderSignature, OrderInfo } from '@/lib/trello'

// Tạo card Trello cho 1 đơn (nhân viên bấm xác nhận sau khi xem/sửa form).
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { threadId, order, createdBy } = await req.json() as {
      threadId?: number; order?: OrderInfo; createdBy?: string
    }
    if (!threadId || !order) return NextResponse.json({ error: 'Thiếu threadId hoặc order' }, { status: 400 })

    // Lấy channel của thread để ghi nguồn
    const { data: thread } = await sb.from('channel_threads').select('channel').eq('id', threadId).single()
    const channel = (thread?.channel as string) ?? 'chat'

    const { name, desc } = buildOrderCard(order, { channel, createdBy: createdBy || 'nhân viên' })
    const card = await createTrelloCard(name, desc)

    await sb.from('channel_orders').insert({
      thread_id:  threadId,
      card_id:    card.id,
      card_url:   card.url,
      signature:  orderSignature(order),
      order_json: order,
      created_by: createdBy || 'nhân viên',
    })

    return NextResponse.json({ ok: true, cardUrl: card.url })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
