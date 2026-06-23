'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '@/contexts/AppContext'
import { fmtDate } from '@/lib/utils'

type Channel = 'facebook' | 'zalo'

interface Thread {
  id: number
  channel: Channel
  platform_id: string
  display_name: string | null
  avatar_url: string | null
  last_message: string | null
  last_message_at: string
  unread_count: number
  ai_enabled: boolean
}

interface Message {
  id: number
  thread_id: number
  platform_msg_id: string | null
  direction: 'in' | 'out'
  content: string
  attachments: { type: string; url: string }[] | null
  sent_by: string | null
  created_at: string
}

const CHANNEL_META: Record<Channel, { label: string; icon: string; color: string; bg: string }> = {
  facebook: { label: 'Facebook',  icon: '📘', color: '#1877f2', bg: '#e7f0fd' },
  zalo:     { label: 'Zalo OA',   icon: '🟦', color: '#0068ff', bg: '#e5f0ff' },
}

function Avatar({ name, url, size = 36 }: { name?: string | null; url?: string | null; size?: number }) {
  const letters = (name ?? '?').split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
  if (url) {
    return (
      <img src={url} alt={name ?? ''} width={size} height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  return (
    <div className="rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
      style={{ width: size, height: size, background: '#c8773a', fontSize: size * 0.35 }}>
      {letters}
    </div>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'vừa xong'
  if (mins < 60)  return `${mins}p trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h trước`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d trước`
  return fmtDate(iso.slice(0, 10))
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function fmtMsgDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Hôm nay'
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua'
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ChannelsPage() {
  const { sb, user, profile } = useApp()

  const [activeChannel, setActiveChannel]   = useState<Channel>('facebook')
  const [threads, setThreads]               = useState<Thread[]>([])
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [messages, setMessages]             = useState<Message[]>([])
  const [replyText, setReplyText]           = useState('')
  const [loadingList, setLoadingList]       = useState(false)
  const [loadingMsgs, setLoadingMsgs]       = useState(false)
  const [sending, setSending]               = useState(false)
  const [suggesting, setSuggesting]         = useState(false)
  const [searchQ, setSearchQ]               = useState('')
  const [mobileView, setMobileView]         = useState<'list' | 'thread'>('list')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const pollingRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Load threads ──────────────────────────────────────────
  const loadThreads = useCallback(async (channel: Channel) => {
    setLoadingList(true)
    try {
      const { data, error } = await sb
        .from('channel_threads')
        .select('*')
        .eq('channel', channel)
        .order('last_message_at', { ascending: false })
        .limit(100)
      if (error) throw error
      setThreads((data ?? []) as Thread[])
    } catch (e) {
      console.error('loadThreads:', e)
    } finally {
      setLoadingList(false)
    }
  }, [sb])

  useEffect(() => {
    loadThreads(activeChannel)
    setSelectedThread(null)
    setMessages([])
    setMobileView('list')
  }, [activeChannel, loadThreads])

  // ── Load messages ─────────────────────────────────────────
  const loadMessages = useCallback(async (thread: Thread, silent = false) => {
    if (!silent) setLoadingMsgs(true)
    try {
      const { data, error } = await sb
        .from('channel_messages')
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true })
        .limit(200)
      if (error) throw error
      setMessages((data ?? []) as Message[])
    } catch (e) {
      console.error('loadMessages:', e)
    } finally {
      setLoadingMsgs(false)
    }
  }, [sb])

  // Mark thread as read
  const markRead = useCallback(async (thread: Thread) => {
    if (thread.unread_count === 0) return
    await sb.from('channel_threads').update({ unread_count: 0 }).eq('id', thread.id)
    setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, unread_count: 0 } : t))
  }, [sb])

  const openThread = useCallback(async (thread: Thread) => {
    setSelectedThread(thread)
    setMobileView('thread')
    await loadMessages(thread)
    await markRead(thread)
  }, [loadMessages, markRead])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Polling: refresh messages every 15s when thread is open
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (!selectedThread) return

    pollingRef.current = setInterval(async () => {
      await loadMessages(selectedThread, true)
      // Also refresh thread list silently to update unread counts from other threads
      const { data } = await sb
        .from('channel_threads')
        .select('*')
        .eq('channel', activeChannel)
        .order('last_message_at', { ascending: false })
        .limit(100)
      if (data) setThreads(data as Thread[])
    }, 15000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [selectedThread, activeChannel, loadMessages, sb])

  // Supabase Realtime subscription for new messages
  useEffect(() => {
    if (!selectedThread) return

    const channel = sb
      .channel(`messages-${selectedThread.id}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'channel_messages',
        filter: `thread_id=eq.${selectedThread.id}`,
      }, payload => {
        const newMsg = payload.new as Message
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
        // Update thread list
        setThreads(prev => prev.map(t =>
          t.id === selectedThread.id
            ? { ...t, last_message: newMsg.content, last_message_at: newMsg.created_at }
            : t
        ))
      })
      .subscribe()

    return () => { sb.removeChannel(channel) }
  }, [selectedThread, sb])

  // ── Send reply ────────────────────────────────────────────
  const handleSendReply = async () => {
    if (!selectedThread || !replyText.trim() || !user) return
    const text = replyText.trim()
    setReplyText('')
    setSending(true)
    try {
      const res = await fetch('/api/channels/reply', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ threadId: selectedThread.id, content: text, sentBy: user.email }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setReplyText(text)
        alert('Gửi thất bại: ' + (data.error ?? 'Lỗi không xác định'))
        return
      }
      // Reload messages after send
      await loadMessages(selectedThread, true)
    } catch (e) {
      setReplyText(text)
      alert('Lỗi gửi tin: ' + (e as Error).message)
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendReply()
    }
  }

  // ── Gợi ý AI: điền vào ô trả lời để nhân viên xem/sửa rồi gửi ──
  const handleSuggest = async () => {
    if (!selectedThread || suggesting) return
    setSuggesting(true)
    try {
      const res = await fetch('/api/channels/ai-suggest', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ threadId: selectedThread.id }),
      })
      const data = await res.json() as { suggestion?: string; error?: string }
      if (!res.ok || !data.suggestion) {
        alert('Không gợi ý được: ' + (data.error ?? 'Lỗi không xác định'))
        return
      }
      setReplyText(data.suggestion)
      textareaRef.current?.focus()
    } catch (e) {
      alert('Lỗi gợi ý AI: ' + (e as Error).message)
    } finally {
      setSuggesting(false)
    }
  }

  // ── Bật/tắt AI tự động trả lời cho riêng cuộc trò chuyện này ──
  const toggleThreadAi = async () => {
    if (!selectedThread) return
    const next = !selectedThread.ai_enabled
    setSelectedThread({ ...selectedThread, ai_enabled: next })
    setThreads(prev => prev.map(t => t.id === selectedThread.id ? { ...t, ai_enabled: next } : t))
    const { error } = await sb.from('channel_threads').update({ ai_enabled: next }).eq('id', selectedThread.id)
    if (error) {
      // hoàn tác nếu lỗi
      setSelectedThread({ ...selectedThread, ai_enabled: !next })
      setThreads(prev => prev.map(t => t.id === selectedThread.id ? { ...t, ai_enabled: !next } : t))
      alert('Không đổi được trạng thái AI: ' + error.message)
    }
  }

  // ── Filtered threads ───────────────────────────────────────
  const filteredThreads = threads.filter(t => {
    if (!searchQ) return true
    return (t.display_name ?? '').toLowerCase().includes(searchQ.toLowerCase()) ||
           (t.last_message ?? '').toLowerCase().includes(searchQ.toLowerCase())
  })

  const totalUnread = threads.reduce((s, t) => s + t.unread_count, 0)

  // ── Group messages by date ─────────────────────────────────
  const groupedMessages: { date: string; msgs: Message[] }[] = []
  for (const msg of messages) {
    const d = fmtMsgDate(msg.created_at)
    const last = groupedMessages[groupedMessages.length - 1]
    if (last && last.date === d) last.msgs.push(msg)
    else groupedMessages.push({ date: d, msgs: [msg] })
  }

  const meta = CHANNEL_META[activeChannel]

  // Check if channels are configured
  const fbConfigured   = true  // env check is server-side only; assume configured if using the page
  const zaloConfigured = true

  return (
    <div className="h-[calc(100vh-56px)] flex bg-[#fdf6ec]">

      {/* ── Left: Channel selector + Thread list ── */}
      <div className={`flex flex-col bg-white border-r border-[#e8d5b7] ${
        mobileView === 'thread' ? 'hidden md:flex' : 'flex'
      } w-full md:w-72 lg:w-80 flex-shrink-0`}>

        {/* Channel tabs */}
        <div className="flex border-b border-[#e8d5b7] bg-[#fdf6ec]">
          {(Object.keys(CHANNEL_META) as Channel[]).map(ch => {
            const m = CHANNEL_META[ch]
            const unread = ch === activeChannel
              ? totalUnread
              : 0 // could track per-channel if needed
            return (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeChannel === ch
                    ? 'border-[#c8773a] text-[#c8773a] bg-white'
                    : 'border-transparent text-[#8b5e3c]/60 hover:text-[#8b5e3c] hover:bg-white/60'
                }`}
              >
                <span>{m.icon}</span>
                <span className="hidden sm:inline">{m.label}</span>
                {unread > 0 && activeChannel === ch && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[#e8d5b7]">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b5e3c]/40 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Tìm khách hàng..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#fdf6ec] border border-[#e8d5b7] rounded-lg outline-none focus:border-[#c8773a] text-[#1a0f07] placeholder-[#8b5e3c]/40"
            />
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex items-center justify-center h-32 text-[#8b5e3c]/50 text-sm">
              Đang tải...
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-6">
              <div className="text-3xl mb-3">💬</div>
              <p className="text-sm text-[#8b5e3c]/60">
                {searchQ ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có tin nhắn nào'}
              </p>
              {!searchQ && (
                <p className="text-xs text-[#8b5e3c]/40 mt-1">
                  Tin nhắn từ {meta.label} sẽ xuất hiện ở đây khi webhook được kết nối
                </p>
              )}
            </div>
          ) : (
            filteredThreads.map(thread => {
              const isSelected = selectedThread?.id === thread.id
              return (
                <button
                  key={thread.id}
                  onClick={() => openThread(thread)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-[#f0e4d0] text-left transition-colors ${
                    isSelected
                      ? 'bg-[#fdf0e8] border-l-2 border-l-[#c8773a]'
                      : 'hover:bg-[#fdf6ec] border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0 mt-0.5">
                    <Avatar name={thread.display_name} url={thread.avatar_url} size={40} />
                    {thread.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {thread.unread_count > 9 ? '9+' : thread.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className={`text-sm truncate ${thread.unread_count > 0 ? 'font-semibold text-[#1a0f07]' : 'font-medium text-[#3d2010]'}`}>
                        {thread.display_name ?? thread.platform_id}
                      </span>
                      <span className="text-[10px] text-[#8b5e3c]/50 flex-shrink-0">
                        {timeAgo(thread.last_message_at)}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${thread.unread_count > 0 ? 'text-[#3d2010] font-medium' : 'text-[#8b5e3c]/70'}`}>
                      {thread.last_message ?? 'Chưa có tin nhắn'}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Refresh button */}
        <div className="p-3 border-t border-[#e8d5b7] bg-[#fdf6ec]">
          <button
            onClick={() => loadThreads(activeChannel)}
            disabled={loadingList}
            className="w-full py-2 text-xs text-[#8b5e3c]/70 hover:text-[#c8773a] transition-colors flex items-center justify-center gap-1.5"
          >
            <span className={loadingList ? 'animate-spin' : ''}>↻</span>
            Làm mới danh sách
          </button>
        </div>
      </div>

      {/* ── Right: Message thread ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${
        mobileView === 'list' ? 'hidden md:flex' : 'flex'
      }`}>
        {!selectedThread ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-[#3d2010] mb-2">Inbox tập trung</h3>
            <p className="text-sm text-[#8b5e3c]/70 max-w-sm">
              Chọn một cuộc trò chuyện từ danh sách bên trái để xem và trả lời tin nhắn
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-[#8b5e3c]/60">
              <div className="bg-white rounded-xl p-4 border border-[#e8d5b7] text-center">
                <div className="text-2xl mb-1">📘</div>
                <div className="font-medium text-[#3d2010]">Facebook</div>
                <div className="text-xs mt-1">
                  Webhook: /api/channels/facebook/webhook
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#e8d5b7] text-center">
                <div className="text-2xl mb-1">🟦</div>
                <div className="font-medium text-[#3d2010]">Zalo OA</div>
                <div className="text-xs mt-1">
                  Webhook: /api/channels/zalo/webhook
                </div>
              </div>
            </div>
            {/* Setup guide */}
            <details className="mt-6 text-left max-w-md w-full">
              <summary className="text-xs text-[#c8773a] cursor-pointer hover:underline font-medium">
                Hướng dẫn cấu hình webhook ▾
              </summary>
              <div className="mt-3 bg-white rounded-xl border border-[#e8d5b7] p-4 text-xs text-[#3d2010] space-y-3">
                <div>
                  <strong>Facebook Page:</strong>
                  <ol className="mt-1 ml-3 space-y-1 text-[#8b5e3c]">
                    <li>1. Tạo Facebook App tại developers.facebook.com</li>
                    <li>2. Thêm sản phẩm Messenger → Webhooks</li>
                    <li>3. Callback URL: <code className="bg-[#fdf6ec] px-1 rounded">https://your-domain/api/channels/facebook/webhook</code></li>
                    <li>4. Verify Token: đặt giá trị vào env <code className="bg-[#fdf6ec] px-1 rounded">FB_VERIFY_TOKEN</code></li>
                    <li>5. Page Access Token → env <code className="bg-[#fdf6ec] px-1 rounded">FB_PAGE_ACCESS_TOKEN</code></li>
                    <li>6. Subscribe fields: <code className="bg-[#fdf6ec] px-1 rounded">messages, messaging_postbacks</code></li>
                  </ol>
                </div>
                <div>
                  <strong>Zalo OA:</strong>
                  <ol className="mt-1 ml-3 space-y-1 text-[#8b5e3c]">
                    <li>1. Đăng nhập oa.zalo.me → Ứng dụng của bạn</li>
                    <li>2. Webhook URL: <code className="bg-[#fdf6ec] px-1 rounded">https://your-domain/api/channels/zalo/webhook</code></li>
                    <li>3. OA Access Token → env <code className="bg-[#fdf6ec] px-1 rounded">ZALO_OA_ACCESS_TOKEN</code></li>
                    <li>4. (Tuỳ chọn) Secret Key → env <code className="bg-[#fdf6ec] px-1 rounded">ZALO_OA_SECRET_KEY</code></li>
                  </ol>
                </div>
              </div>
            </details>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#e8d5b7] flex-shrink-0">
              {/* Mobile back */}
              <button
                onClick={() => { setMobileView('list'); setSelectedThread(null) }}
                className="md:hidden text-[#8b5e3c] hover:text-[#c8773a] p-1"
              >
                ←
              </button>

              <Avatar name={selectedThread.display_name} url={selectedThread.avatar_url} size={38} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#1a0f07] text-sm truncate">
                  {selectedThread.display_name ?? selectedThread.platform_id}
                </div>
                <div className="text-xs text-[#8b5e3c]/60 flex items-center gap-1.5">
                  <span>{CHANNEL_META[selectedThread.channel].icon}</span>
                  <span>{CHANNEL_META[selectedThread.channel].label}</span>
                </div>
              </div>
              {/* Công tắc AI cho riêng cuộc trò chuyện này */}
              <button
                onClick={toggleThreadAi}
                title={selectedThread.ai_enabled ? 'AI đang BẬT cho khách này — bấm để tắt (nhân viên tự trả lời)' : 'AI đang TẮT cho khách này — bấm để bật'}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedThread.ai_enabled
                    ? 'bg-[#e7f6ec] text-[#1a7f37] hover:bg-[#d6f0df]'
                    : 'bg-[#f0e8d8] text-[#8b5e3c]/70 hover:bg-[#e8dcc4]'
                }`}
              >
                <span>{selectedThread.ai_enabled ? '🤖' : '🙅'}</span>
                <span className="hidden sm:inline">AI {selectedThread.ai_enabled ? 'Bật' : 'Tắt'}</span>
              </button>
              <button
                onClick={() => loadMessages(selectedThread)}
                disabled={loadingMsgs}
                className="text-[#8b5e3c]/50 hover:text-[#c8773a] transition-colors p-2 rounded-lg hover:bg-[#fdf6ec]"
                title="Làm mới"
              >
                <span className={`text-base ${loadingMsgs ? 'animate-spin' : ''}`}>↻</span>
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-[#f7f0e8]">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-32 text-[#8b5e3c]/50 text-sm">
                  Đang tải tin nhắn...
                </div>
              ) : groupedMessages.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-[#8b5e3c]/50 text-sm">
                  Chưa có tin nhắn nào
                </div>
              ) : (
                groupedMessages.map(group => (
                  <div key={group.date}>
                    {/* Date separator */}
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-[#e0d0b8]" />
                      <span className="text-[10px] text-[#8b5e3c]/60 font-medium bg-[#f7f0e8] px-2">
                        {group.date}
                      </span>
                      <div className="flex-1 h-px bg-[#e0d0b8]" />
                    </div>
                    {group.msgs.map((msg, idx) => {
                      const isOut  = msg.direction === 'out'
                      const showAvatar = !isOut && (idx === 0 || group.msgs[idx - 1]?.direction !== 'in')
                      return (
                        <div key={msg.id} className={`flex items-end gap-2 mb-1 ${isOut ? 'justify-end' : 'justify-start'}`}>
                          {/* Incoming avatar placeholder */}
                          {!isOut && (
                            <div className="w-7 flex-shrink-0">
                              {showAvatar && (
                                <Avatar name={selectedThread.display_name} url={selectedThread.avatar_url} size={26} />
                              )}
                            </div>
                          )}
                          <div className={`max-w-[70%] ${isOut ? 'items-end' : 'items-start'} flex flex-col`}>
                            {/* Attachment images */}
                            {msg.attachments?.filter(a => a.type === 'image').map((a, i) => (
                              <img key={i} src={a.url} alt="attachment"
                                className="rounded-2xl mb-1 max-w-full max-h-48 object-contain border border-[#e0d0b8]"
                              />
                            ))}
                            {/* Text bubble */}
                            {msg.content && (
                              <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isOut
                                  ? 'bg-[#c8773a] text-white rounded-br-sm'
                                  : 'bg-white text-[#1a0f07] rounded-bl-sm shadow-sm'
                              }`}>
                                {msg.content}
                              </div>
                            )}
                            <div className={`text-[9px] mt-0.5 text-[#8b5e3c]/50 ${isOut ? 'text-right' : 'text-left'}`}>
                              {fmtTime(msg.created_at)}
                              {isOut && msg.sent_by && ` · ${msg.sent_by.split('@')[0]}`}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply box */}
            <div className="flex-shrink-0 bg-white border-t border-[#e8d5b7] p-3">
              <div className="flex items-end gap-2 bg-[#fdf6ec] rounded-2xl border border-[#e8d5b7] focus-within:border-[#c8773a] transition-colors px-3 py-2">
                <button
                  onClick={handleSuggest}
                  disabled={suggesting || sending}
                  title="Gợi ý trả lời bằng AI (xem & sửa rồi mới gửi)"
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f3e8ff] text-[#7c3aed] flex items-center justify-center hover:bg-[#e9d5ff] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {suggesting ? <span className="text-xs animate-spin">↻</span> : <span className="text-sm">✨</span>}
                </button>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={replyText}
                  onChange={e => {
                    setReplyText(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn trả lời... (Enter để gửi, Shift+Enter xuống dòng)"
                  className="flex-1 bg-transparent outline-none text-sm text-[#1a0f07] placeholder-[#8b5e3c]/40 resize-none leading-relaxed"
                  style={{ minHeight: '36px', maxHeight: '120px' }}
                  disabled={sending}
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sending}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-[#c8773a] text-white flex items-center justify-center hover:bg-[#b06830] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {sending ? (
                    <span className="text-xs animate-spin">↻</span>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="text-[10px] text-[#8b5e3c]/40 mt-1.5 text-center">
                Gửi qua {CHANNEL_META[selectedThread.channel].label} · Tin nhắn này sẽ được ghi lại
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
