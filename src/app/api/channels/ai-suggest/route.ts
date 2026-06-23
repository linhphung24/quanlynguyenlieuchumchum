import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAIConfig, generateReply, ChatTurn } from '@/lib/ai'

// Sinh GỢI Ý trả lời (không gửi) cho nhân viên xem/sửa rồi mới gửi.
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
    if (!cfg.enabled) return NextResponse.json({ error: 'AI chưa được bật trong Cấu hình kênh' }, { status: 400 })
    if (!cfg.apiKey)  return NextResponse.json({ error: 'Chưa cấu hình API key cho AI' }, { status: 400 })

    // Lấy lịch sử gần nhất (cũ → mới)
    const { data } = await sb
      .from('channel_messages')
      .select('direction, content, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(10)
    const rows = (data ?? []).reverse() as { direction: 'in' | 'out'; content: string }[]
    const turns: ChatTurn[] = rows
      .filter(r => r.content && r.content.trim() && !r.content.startsWith('['))
      .map(r => ({ role: r.direction === 'in' ? 'user' : 'assistant', content: r.content }))

    // Tin cuối cùng của khách làm "latest"; nếu tin cuối là của mình thì vẫn gợi ý tiếp
    const lastUser = [...turns].reverse().find(t => t.role === 'user')
    if (!lastUser) return NextResponse.json({ error: 'Chưa có tin nhắn của khách để gợi ý' }, { status: 400 })
    const history = turns.slice(0, turns.lastIndexOf(lastUser))

    const suggestion = await generateReply(cfg, history, lastUser.content)
    return NextResponse.json({ ok: true, suggestion })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
