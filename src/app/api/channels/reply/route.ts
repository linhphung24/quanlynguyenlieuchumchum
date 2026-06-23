import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getZaloAccessToken } from '@/lib/zalo'
import { getPageToken } from '@/lib/facebook'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ReplyBody {
  threadId: number
  content: string
  sentBy: string
}

export async function POST(req: NextRequest) {
  try {
    const { threadId, content, sentBy }: ReplyBody = await req.json()
    if (!threadId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing threadId or content' }, { status: 400 })
    }

    // Load thread
    const { data: thread, error: threadErr } = await sb
      .from('channel_threads')
      .select('*')
      .eq('id', threadId)
      .single()

    if (threadErr || !thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Send message to platform
    if (thread.channel === 'facebook') {
      await sendFacebook(thread.page_id as string, thread.platform_id as string, content)
    } else if (thread.channel === 'zalo') {
      await sendZalo(thread.platform_id as string, content)
    }

    // Save outgoing message to DB
    const { error: insertErr } = await sb.from('channel_messages').insert({
      thread_id: threadId,
      direction: 'out',
      content,
      sent_by:   sentBy,
    })
    if (insertErr) throw new Error(insertErr.message)

    // Update thread last_message
    await sb.from('channel_threads').update({
      last_message:    content,
      last_message_at: new Date().toISOString(),
    }).eq('id', threadId)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[channels/reply]', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

async function sendFacebook(pageId: string, recipientPsid: string, text: string) {
  const token = await getPageToken(pageId)
  if (!token) throw new Error('Page chưa được kết nối hoặc đã ngắt — vào Cấu hình kênh để kết nối lại')

  const res = await fetch(
    `https://graph.facebook.com/v21.0/me/messages?access_token=${token}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        recipient: { id: recipientPsid },
        message:   { text },
      }),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Facebook API error: ${err}`)
  }
}

async function sendZalo(userId: string, text: string) {
  // Lấy access_token (tự refresh nếu hết hạn) từ DB — không dùng token tĩnh
  const token = await getZaloAccessToken()

  const res = await fetch('https://openapi.zalo.me/v3.0/oa/message/cs', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': token,
    },
    body: JSON.stringify({
      recipient: { user_id: userId },
      message:   { text },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Zalo API error: ${err}`)
  }
  const data = await res.json() as { error?: number; message?: string }
  if (data.error && data.error !== 0) {
    throw new Error(`Zalo error ${data.error}: ${data.message}`)
  }
}
