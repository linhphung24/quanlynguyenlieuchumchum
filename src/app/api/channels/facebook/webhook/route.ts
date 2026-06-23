import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPageToken } from '@/lib/facebook'
import { maybeAutoReply } from '@/lib/ai-reply'

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

  // Verify token lấy từ integration_config (admin nhập qua UI), fallback env
  let expected = process.env.FB_VERIFY_TOKEN ?? ''
  try {
    const { data } = await sb.from('integration_config').select('value').eq('key', 'fb_verify_token').single()
    if (data?.value) expected = data.value
  } catch { /* dùng env */ }

  if (mode === 'subscribe' && token && token === expected) {
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
      const pageId: string = entry.id   // ID Page nhận tin nhắn (multi-page)
      for (const event of entry.messaging ?? []) {
        // Chỉ xử lý tin nhắn text (bỏ qua delivery/read receipts)
        if (!event.message || event.message.is_echo) continue

        const senderPsid: string = event.sender.id
        const msgId: string      = event.message.mid
        const text: string       = event.message.text ?? ''
        const ts: number         = event.timestamp

        // Upsert thread (khoá theo channel + page_id + platform_id)
        const { data: thread } = await sb
          .from('channel_threads')
          .upsert(
            { channel: 'facebook', page_id: pageId, platform_id: senderPsid },
            { onConflict: 'channel,page_id,platform_id', ignoreDuplicates: false }
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

        // Fetch sender profile (display name + avatar) nếu chưa có — dùng token của chính Page đó
        const pageToken = !thread.display_name ? await getPageToken(pageId) : null
        if (!thread.display_name && pageToken) {
          try {
            const profileRes = await fetch(
              `https://graph.facebook.com/${senderPsid}?fields=name,profile_pic&access_token=${pageToken}`
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

        // AI tự động trả lời (nếu bật) — chỉ với tin nhắn text
        await maybeAutoReply(
          { id: thread.id, channel: 'facebook', page_id: pageId, platform_id: senderPsid, ai_enabled: thread.ai_enabled },
          text
        )
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (e) {
    console.error('[FB webhook] error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
