import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendFacebookMessage, sendZaloMessage } from '@/lib/channel-send'

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
      await sendFacebookMessage(thread.page_id as string, thread.platform_id as string, content)
    } else if (thread.channel === 'zalo') {
      await sendZaloMessage(thread.platform_id as string, content)
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
