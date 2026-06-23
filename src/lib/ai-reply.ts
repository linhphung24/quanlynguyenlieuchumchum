import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getAIConfig, generateReply, ChatTurn } from '@/lib/ai'
import { sendFacebookMessage, sendZaloMessage } from '@/lib/channel-send'

function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface ThreadLite {
  id: number
  channel: 'facebook' | 'zalo'
  page_id?: string | null
  platform_id: string
  ai_enabled?: boolean | null
}

// Lấy lịch sử hội thoại gần nhất (cũ → mới) để AI có ngữ cảnh.
async function loadHistory(sb: SupabaseClient, threadId: number, limit = 10): Promise<ChatTurn[]> {
  const { data } = await sb
    .from('channel_messages')
    .select('direction, content, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(limit)
  const rows = (data ?? []).reverse() as { direction: 'in' | 'out'; content: string }[]
  return rows
    .filter(r => r.content && r.content.trim() && !r.content.startsWith('['))
    .map(r => ({ role: r.direction === 'in' ? 'user' : 'assistant', content: r.content }))
}

// Gọi sau khi đã lưu tin nhắn ĐẾN của khách. KHÔNG bao giờ throw (webhook phải trả 200).
export async function maybeAutoReply(thread: ThreadLite, userText: string): Promise<void> {
  try {
    if (!userText || !userText.trim()) return            // bỏ qua tin chỉ có ảnh/sticker
    if (thread.ai_enabled === false) return              // tắt AI riêng thread này

    const cfg = await getAIConfig()
    if (!cfg.enabled || !cfg.autoReply) return

    const sb = admin()
    const history = await loadHistory(sb, thread.id)
    // Tin mới nhất (userText) đã nằm trong history → bỏ phần tử cuối để không lặp
    if (history.length && history[history.length - 1].role === 'user' &&
        history[history.length - 1].content === userText) {
      history.pop()
    }

    const reply = await generateReply(cfg, history, userText)
    if (!reply) return

    // Gửi ra nền tảng
    if (thread.channel === 'facebook') {
      await sendFacebookMessage(thread.page_id as string, thread.platform_id, reply)
    } else {
      await sendZaloMessage(thread.platform_id, reply)
    }

    // Lưu tin đã gửi + cập nhật thread
    await sb.from('channel_messages').insert({
      thread_id: thread.id,
      direction: 'out',
      content:   reply,
      sent_by:   'AI',
    })
    await sb.from('channel_threads').update({
      last_message:    reply,
      last_message_at: new Date().toISOString(),
    }).eq('id', thread.id)
  } catch (e) {
    console.error('[ai-reply] error:', e)
  }
}
