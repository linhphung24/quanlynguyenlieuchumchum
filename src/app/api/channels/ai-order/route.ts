import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAIConfig, extractOrder, ChatTurn } from '@/lib/ai'

// Trích xuất đơn hàng từ hội thoại (cho nút "Tạo đơn" thủ công) — KHÔNG tạo card.
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { threadId } = await req.json() as { threadId?: number }
    if (!threadId) return NextResponse.json({ error: 'Thiếu threadId' }, { status: 400 })

    const cfg = await getAIConfig()
    if (!cfg.apiKey) return NextResponse.json({ error: 'Chưa cấu hình API key cho AI' }, { status: 400 })

    const { data } = await sb
      .from('channel_messages')
      .select('direction, content, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(20)
    const rows = (data ?? []).reverse() as { direction: 'in' | 'out'; content: string }[]
    const history: ChatTurn[] = rows
      .filter(r => r.content && r.content.trim() && !r.content.startsWith('['))
      .map(r => ({ role: r.direction === 'in' ? 'user' : 'assistant', content: r.content }))
    if (!history.length) return NextResponse.json({ error: 'Chưa có nội dung để trích xuất' }, { status: 400 })

    const order = await extractOrder(cfg, history)
    if (!order) return NextResponse.json({ error: 'Không trích xuất được đơn từ hội thoại' }, { status: 422 })
    return NextResponse.json({ ok: true, order })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
