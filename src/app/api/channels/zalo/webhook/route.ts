import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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
  try {
    // Verify HMAC signature if secret key configured
    const secret = process.env.ZALO_OA_SECRET_KEY
    if (secret) {
      const raw = await req.text()
      const sig = req.headers.get('x-zevent-signature') ?? ''
      const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex')
      if (sig !== expected) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
      const body = JSON.parse(raw)
      await processZaloEvent(body)
    } else {
      const body = await req.json()
      await processZaloEvent(body)
    }

    return NextResponse.json({ error: 0 })
  } catch (e) {
    console.error('[Zalo webhook] error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
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

  // Update thread
  await sb.from('channel_threads').update({
    display_name:    displayName ?? thread.display_name,
    avatar_url:      avatarUrl   ?? thread.avatar_url,
    last_message:    msgPreview,
    last_message_at: msgAt,
    unread_count:    thread.unread_count + 1,
  }).eq('id', thread.id)
}
