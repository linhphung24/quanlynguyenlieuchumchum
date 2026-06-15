import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Facebook webhook verification challenge
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST: Receive Facebook Messenger events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.object !== 'page') {
      return NextResponse.json({ status: 'ok' })
    }

    for (const entry of body.entry ?? []) {
      for (const event of entry.messaging ?? []) {
        // Chỉ xử lý tin nhắn text (bỏ qua delivery/read receipts)
        if (!event.message || event.message.is_echo) continue

        const senderPsid: string = event.sender.id
        const msgId: string      = event.message.mid
        const text: string       = event.message.text ?? ''
        const ts: number         = event.timestamp

        // Upsert thread
        const { data: thread } = await sb
          .from('channel_threads')
          .upsert(
            { channel: 'facebook', platform_id: senderPsid },
            { onConflict: 'channel,platform_id', ignoreDuplicates: false }
          )
          .select()
          .single()

        if (!thread) continue

        // Insert message (ignore duplicate mid)
        const { error: msgErr } = await sb.from('channel_messages').insert({
          thread_id:       thread.id,
          platform_msg_id: msgId,
          direction:       'in',
          content:         text || '[attachment]',
          attachments:     event.message.attachments ?? null,
          raw_data:        event,
        })

        if (msgErr && !msgErr.message.includes('unique')) {
          console.error('[FB webhook] insert message error:', msgErr.message)
          continue
        }

        // Update thread: last_message, unread_count, last_message_at
        const msgAt = new Date(ts).toISOString()
        await sb.from('channel_threads').update({
          last_message:    text || '[attachment]',
          last_message_at: msgAt,
          unread_count:    thread.unread_count + 1,
        }).eq('id', thread.id)

        // Fetch sender profile (display name + avatar) nếu chưa có
        if (!thread.display_name && process.env.FB_PAGE_ACCESS_TOKEN) {
          try {
            const profileRes = await fetch(
              `https://graph.facebook.com/${senderPsid}?fields=name,profile_pic&access_token=${process.env.FB_PAGE_ACCESS_TOKEN}`
            )
            if (profileRes.ok) {
              const p = await profileRes.json() as { name?: string; profile_pic?: string }
              await sb.from('channel_threads').update({
                display_name: p.name ?? null,
                avatar_url:   p.profile_pic ?? null,
              }).eq('id', thread.id)
            }
          } catch {
            // non-critical, ignore
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (e) {
    console.error('[FB webhook] error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
