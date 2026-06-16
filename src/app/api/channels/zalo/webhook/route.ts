import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchZaloUserProfile } from '@/lib/zalo'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Zalo OA webhook verification
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

// POST: Receive Zalo OA events
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* body rỗng (vd lúc Zalo "Kiểm tra") */ }

  // Ping test hoặc event không phải tin nhắn user → trả 200 NGAY (không chạm DB)
  const eventName = body?.event_name as string | undefined
  if (!eventName?.startsWith('user_send_')) {
    return NextResponse.json({ error: 0 })
  }

  // Tin nhắn thật: xử lý rồi trả 200. Lỗi vẫn trả 200 để Zalo không vô hiệu webhook (xem log).
  try {
    await processZaloEvent(body)
  } catch (e) {
    console.error('[Zalo webhook] process error:', e)
  }
  return NextResponse.json({ error: 0 })
}

async function processZaloEvent(body: Record<string, unknown>) {
  const eventName = body.event_name as string
  // Chỉ xử lý tin nhắn từ người dùng (bỏ qua echo từ OA)
  if (!eventName?.startsWith('user_send_')) return

  const sender  = body.sender  as Record<string, string>
  const message = body.message as Record<string, string>
  const ts      = body.timestamp as string

  const userId      = sender?.id
  const displayName = sender?.display_name ?? sender?.name ?? null
  const avatarUrl   = sender?.avatar ?? null
  const msgId       = message?.msg_id ?? null
  const text        = eventName === 'user_send_text' ? (message?.text ?? '') : ''
  const msgPreview  = text || `[${eventName.replace('user_send_', '')}]`

  if (!userId) return

  // Upsert thread
  const { data: thread } = await sb
    .from('channel_threads')
    .upsert(
      { channel: 'zalo', platform_id: userId },
      { onConflict: 'channel,platform_id', ignoreDuplicates: false }
    )
    .select()
    .single()

  if (!thread) return

  // Insert message
  const attachments = eventName === 'user_send_image'
    ? [{ type: 'image', url: (body.message as Record<string, Record<string, string>>)?.message?.thumbnail }]
    : null

  const { error: msgErr } = await sb.from('channel_messages').insert({
    thread_id:       thread.id,
    platform_msg_id: msgId,
    direction:       'in',
    content:         msgPreview,
    attachments,
    raw_data:        body,
  })

  if (msgErr && !msgErr.message.includes('unique')) {
    console.error('[Zalo webhook] insert message error:', msgErr.message)
    return
  }

  const msgAt = ts ? new Date(parseInt(ts)).toISOString() : new Date().toISOString()

  // Nếu chưa có tên khách → gọi API Zalo lấy tên + avatar (webhook không kèm sẵn)
  let name   = displayName ?? thread.display_name
  let avatar = avatarUrl   ?? thread.avatar_url
  if (!name) {
    const profile = await fetchZaloUserProfile(userId)
    if (profile?.display_name) name   = profile.display_name
    if (profile?.avatar)       avatar = profile.avatar
  }

  // Update thread
  await sb.from('channel_threads').update({
    display_name:    name,
    avatar_url:      avatar,
    last_message:    msgPreview,
    last_message_at: msgAt,
    unread_count:    thread.unread_count + 1,
  }).eq('id', thread.id)
}
