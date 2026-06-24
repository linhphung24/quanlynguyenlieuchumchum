'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/contexts/AppContext'

type ConfigMap = Record<string, string>

interface Field {
  key: string
  label: string
  placeholder: string
  secret?: boolean
  hint?: string
}

// Chỉ còn App ID + App Secret + Verify Token — admin nhập 1 LẦN cho cả app.
// Page ID/Token KHÔNG nhập tay nữa → lấy tự động qua nút "Kết nối Facebook".
const FB_FIELDS: Field[] = [
  { key: 'fb_app_id',       label: 'App ID',       placeholder: 'VD: 1234567890', hint: 'developers.facebook.com → App → Settings → Basic' },
  { key: 'fb_app_secret',   label: 'App Secret',   placeholder: '••••••••',  secret: true },
  { key: 'fb_verify_token', label: 'Verify Token', placeholder: 'Chuỗi tự đặt — dán vào Meta khi đăng ký webhook (1 lần)' },
]

interface FbPageRow {
  id: number
  page_id: string
  page_name: string | null
  page_avatar: string | null
  is_active: boolean
  connected_by: string | null
  created_at: string
}

// Chỉ còn App ID + Secret Key + OA ID — admin nhập 1 LẦN.
// OA Access Token / Refresh Token KHÔNG nhập tay nữa → lấy & tự gia hạn qua nút "Kết nối Zalo OA".
const ZALO_FIELDS: Field[] = [
  { key: 'zalo_app_id', label: 'App ID',     placeholder: 'VD: 1234567890',     hint: 'developers.zalo.me → Ứng dụng' },
  { key: 'zalo_secret', label: 'Secret Key', placeholder: '••••••••',  secret: true },
  { key: 'zalo_oa_id',  label: 'OA ID',      placeholder: 'ID Official Account (tuỳ chọn)' },
]

const TRELLO_CRED_FIELDS: Field[] = [
  { key: 'trello_api_key', label: 'API Key', placeholder: 'API Key', hint: 'trello.com/app-key' },
  { key: 'trello_token',   label: 'Token',   placeholder: '••••••••', secret: true, hint: 'trello.com/app-key → Token' },
]
// board_id chỉ để UI nhớ board đang chọn; backend chỉ dùng list_id
const TRELLO_SAVE_KEYS = [
  'trello_api_key', 'trello_token',
  'trello_order_board_id', 'trello_order_list_id',
  'trello_birthday_board_id', 'trello_birthday_list_id',
]

const ALL_KEYS = [...FB_FIELDS.map(f => f.key), ...ZALO_FIELDS.map(f => f.key), ...TRELLO_SAVE_KEYS]

interface TrelloBoard { id: string; name: string; lists: { id: string; name: string }[] }

// Model gợi ý theo từng nhà cung cấp (chọn dropdown, khỏi nhớ tên)
const MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  gemini: [
    { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash (rẻ/nhanh, free tier)' },
    { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
    { value: 'gemini-1.5-flash', label: 'gemini-1.5-flash' },
    { value: 'gemini-1.5-pro',   label: 'gemini-1.5-pro (chất lượng hơn)' },
  ],
  deepseek: [
    { value: 'deepseek-chat',     label: 'deepseek-chat (khuyên dùng)' },
    { value: 'deepseek-reasoner', label: 'deepseek-reasoner (suy luận, chậm/đắt hơn)' },
  ],
  anthropic: [
    { value: 'claude-haiku-4-5',  label: 'claude-haiku-4-5 (rẻ/nhanh)' },
    { value: 'claude-sonnet-4-6', label: 'claude-sonnet-4-6 (chất lượng cao)' },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'gpt-4o-mini (rẻ)' },
    { value: 'gpt-4o',      label: 'gpt-4o (chất lượng cao)' },
  ],
}

// Đọc access token trực tiếp từ localStorage — KHÔNG qua supabase-js
// (tránh auth-lock làm treo request khi refresh token / mở nhiều tab)
function getAccessToken(): string | null {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const ref = url.match(/https:\/\/([^.]+)\./)?.[1]
    if (!ref) return null
    const raw = localStorage.getItem(`sb-${ref}-auth-token`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.access_token ?? null
  } catch { return null }
}

export default function IntegrationsPage() {
  const { sb, profile, user, toast, startLoading, stopLoading, writeAudit } = useApp()
  const isAdmin = profile?.role === 'admin'

  const [config, setConfig]   = useState<ConfigMap>({})
  const [loading, setLoading] = useState(true)
  const [savingFb, setSavingFb]     = useState(false)
  const [savingZalo, setSavingZalo] = useState(false)
  const [savingAi, setSavingAi]     = useState(false)
  const [savingTrello, setSavingTrello] = useState(false)
  const [trelloBoards, setTrelloBoards] = useState<TrelloBoard[]>([])
  const [loadingBoards, setLoadingBoards] = useState(false)
  const [forceCustomModel, setForceCustomModel] = useState(false)
  const [reveal, setReveal]   = useState<Set<string>>(new Set())
  const [origin, setOrigin]   = useState('')

  const [pages, setPages]         = useState<FbPageRow[]>([])
  const [loadingPages, setLoadingPages] = useState(false)
  const [connecting, setConnecting]     = useState(false)
  const [connectingZalo, setConnectingZalo] = useState(false)

  useEffect(() => { setOrigin(window.location.origin) }, [])

  // ── Danh sách Page đã kết nối ──
  const loadPages = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return
    setLoadingPages(true)
    try {
      const res = await fetch('/api/channels/facebook/connections', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) setPages(json.pages ?? [])
    } catch { /* ignore */ } finally { setLoadingPages(false) }
  }, [])

  useEffect(() => { if (isAdmin) loadPages() }, [isAdmin, loadPages])

  // Bấm "Kết nối Facebook" → xin URL OAuth rồi chuyển hướng sang Facebook
  const connectFacebook = async () => {
    if (!user) { toast('Bạn chưa đăng nhập', 'error'); return }
    const token = getAccessToken()
    if (!token) { toast('Phiên đăng nhập hết hạn — tải lại trang', 'error'); return }
    setConnecting(true)
    try {
      const res = await fetch('/api/channels/facebook/oauth/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.url) throw new Error(json.error || 'Không lấy được URL kết nối')
      window.location.href = json.url   // chuyển sang dialog đăng nhập Facebook
    } catch (e) {
      toast('Lỗi: ' + (e as Error).message, 'error')
      setConnecting(false)
    }
  }

  // Bấm "Kết nối Zalo OA" → xin URL cấp quyền rồi chuyển hướng sang Zalo
  const connectZalo = async () => {
    if (!user) { toast('Bạn chưa đăng nhập', 'error'); return }
    const token = getAccessToken()
    if (!token) { toast('Phiên đăng nhập hết hạn — tải lại trang', 'error'); return }
    setConnectingZalo(true)
    try {
      const res = await fetch('/api/channels/zalo/oauth/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.url) throw new Error(json.error || 'Không lấy được URL kết nối')
      window.location.href = json.url   // chuyển sang trang cấp quyền Zalo OA
    } catch (e) {
      toast('Lỗi: ' + (e as Error).message, 'error')
      setConnectingZalo(false)
    }
  }

  const disconnectPage = async (pageId: string, name: string) => {
    if (!confirm(`Ngắt kết nối Page "${name}"? Tin nhắn cũ vẫn được giữ lại.`)) return
    const token = getAccessToken()
    if (!token) { toast('Phiên hết hạn', 'error'); return }
    startLoading()
    try {
      const res = await fetch(`/api/channels/facebook/connections?pageId=${encodeURIComponent(pageId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Lỗi ngắt kết nối')
      void writeAudit('delete', 'channel_connection', pageId, `Ngắt kết nối Page ${name}`)
      toast('Đã ngắt kết nối', 'success')
      setPages(prev => prev.filter(p => p.page_id !== pageId))
    } catch (e) {
      toast('Lỗi: ' + (e as Error).message, 'error')
    } finally { stopLoading() }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await sb.from('integration_config').select('key, value')
      if (error) throw error
      const map: ConfigMap = {}
      for (const k of ALL_KEYS) map[k] = ''
      for (const row of (data ?? []) as { key: string; value: string }[]) map[row.key] = row.value ?? ''
      setConfig(map)
    } catch (e) {
      toast('Lỗi tải cấu hình: ' + (e as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }, [sb, toast])

  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  // Tải danh sách board + list từ Trello (dùng key/token đang nhập)
  const loadTrelloBoards = useCallback(async (apiKey: string, tokenKey: string) => {
    const authToken = getAccessToken()
    if (!authToken || !apiKey || !tokenKey) return
    setLoadingBoards(true)
    try {
      const res = await fetch('/api/trello/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ apiKey, token: tokenKey }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Lỗi tải board')
      setTrelloBoards((json.boards ?? []) as TrelloBoard[])
    } catch (e) {
      toast('Lỗi tải board Trello: ' + (e as Error).message, 'error')
    } finally {
      setLoadingBoards(false)
    }
  }, [toast])

  // Tự tải board khi đã có sẵn key/token (lần đầu vào)
  useEffect(() => {
    if (isAdmin && config.trello_api_key && config.trello_token && trelloBoards.length === 0) {
      loadTrelloBoards(config.trello_api_key, config.trello_token)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, config.trello_api_key, config.trello_token])

  const setField = (key: string, value: string) =>
    setConfig(prev => ({ ...prev, [key]: value }))

  const toggleReveal = (key: string) =>
    setReveal(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })

  const saveGroup = async (fields: Field[], label: string, setSaving: (b: boolean) => void) => {
    if (!user) { toast('Bạn chưa đăng nhập', 'error'); return }
    const token = getAccessToken()
    if (!token) { toast('Phiên đăng nhập hết hạn — hãy tải lại trang', 'error'); return }
    setSaving(true)
    startLoading()
    try {
      // Gọi API route server-side (service role) — fetch thường, không dính auth-lock
      const res = await fetch('/api/integration-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: fields.map(f => ({ key: f.key, value: config[f.key] ?? '' })) }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `Lỗi server (${res.status})`)
      // Fire-and-forget: không await để không kẹt UI nếu audit_log chậm
      void writeAudit('update', 'integration_config', label, `Cập nhật cấu hình ${label}`)
      toast(`Đã lưu cấu hình ${label}`, 'success')
    } catch (e) {
      toast('Lỗi lưu: ' + (e as Error).message, 'error')
    } finally {
      setSaving(false)
      stopLoading()
    }
  }

  const copyText = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast('Đã copy', 'success') }
    catch { toast('Không copy được', 'error') }
  }

  // ── Guard: chỉ admin ──
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="text-4xl mb-3">🔒</div>
        <p className="text-sm text-[#8b5e3c]">Chỉ <b>Quản trị viên</b> mới được xem cấu hình tích hợp kênh.</p>
      </div>
    )
  }

  const renderField = (f: Field) => {
    const isSecret = f.secret && !reveal.has(f.key)
    return (
      <div key={f.key}>
        <label className="block text-xs font-medium text-[#8b5e3c] mb-1">
          {f.label}
          {f.hint && <span className="ml-1 text-[10px] text-[#c8a87a] font-normal">— {f.hint}</span>}
        </label>
        <div className="relative">
          <input
            type={isSecret ? 'password' : 'text'}
            value={config[f.key] ?? ''}
            onChange={e => setField(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="w-full px-3 py-2.5 pr-10 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors font-mono"
          />
          {f.secret && (
            <button
              type="button"
              onClick={() => toggleReveal(f.key)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#c8a87a] hover:text-[#c8773a] text-sm cursor-pointer"
              title={reveal.has(f.key) ? 'Ẩn' : 'Hiện'}
            >
              {reveal.has(f.key) ? '🙈' : '👁'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Dropdown chọn board + list cho 1 mục đích (đơn hàng / sinh nhật)
  const renderTrelloPicker = (label: string, boardKey: string, listKey: string) => {
    const lists = trelloBoards.find(b => b.id === config[boardKey])?.lists ?? []
    return (
      <div>
        <span className="block text-xs font-medium text-[#8b5e3c] mb-1">{label}</span>
        <div className="grid grid-cols-2 gap-2">
          <select value={config[boardKey] ?? ''}
            onChange={e => { setField(boardKey, e.target.value); setField(listKey, '') }}
            className="w-full px-2.5 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a]">
            <option value="">— Chọn board —</option>
            {trelloBoards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={config[listKey] ?? ''}
            onChange={e => setField(listKey, e.target.value)}
            disabled={!config[boardKey]}
            className="w-full px-2.5 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] disabled:bg-[#f5f0e6] disabled:text-[#8b5e3c]/50">
            <option value="">— Chọn list —</option>
            {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>
    )
  }

  const WebhookRow = ({ label, url, token }: { label: string; url: string; token?: string }) => (
    <div className="bg-[#fdf6ec] rounded-lg p-3 border border-[#f0e8d8]">
      <div className="text-[11px] font-medium text-[#8b5e3c] mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs text-[#3d1f0a] break-all bg-white px-2 py-1.5 rounded border border-[#f0e8d8]">{url}</code>
        <button onClick={() => copyText(url)}
          className="px-2.5 py-1.5 rounded-lg bg-[#c8773a] text-white text-xs font-medium hover:opacity-90 cursor-pointer flex-shrink-0">
          📋 Copy
        </button>
      </div>
      {token !== undefined && (
        <div className="text-[10px] text-[#8b5e3c]/70 mt-1.5">
          Verify token để dán vào webhook: <b className="text-[#c8773a]">{token || '(chưa đặt)'}</b>
        </div>
      )}
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#1a0f07] font-['Playfair_Display']">Cấu hình kênh</h2>
        <p className="text-sm text-[#8b5e3c]/70 mt-0.5">Khai báo App ID, Secret, Token cho Facebook & Zalo OA</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-[#8b5e3c]">
          <div className="inline-block w-5 h-5 border-2 border-[#c8773a] border-t-transparent rounded-full animate-spin mb-2"></div>
          <div>Đang tải...</div>
        </div>
      ) : (
        <>
          {/* ── Facebook ── */}
          <div className="bg-[#fffaf4] rounded-2xl border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 bg-[#e7f0fd] border-b border-[#d3e3fb]">
              <span className="text-xl">📘</span>
              <span className="font-semibold text-[#1877f2]">Facebook Messenger</span>
            </div>
            <div className="p-5 space-y-5">
              {/* ── Bước 1: cấu hình App (1 lần) ── */}
              <div className="space-y-4">
                <div className="text-xs font-semibold text-[#8b5e3c] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#1877f2] text-white flex items-center justify-center text-[10px]">1</span>
                  Cấu hình App (chỉ làm 1 lần cho cả hệ thống)
                </div>
                <WebhookRow label="Callback URL (dán vào Meta → Webhooks → Edit subscription)" url={`${origin}/api/channels/facebook/webhook`} token={config.fb_verify_token} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FB_FIELDS.map(renderField)}
                </div>
                <div className="flex justify-end">
                  <button onClick={() => saveGroup(FB_FIELDS, 'Facebook', setSavingFb)} disabled={savingFb}
                    className="px-5 py-2.5 rounded-lg bg-[#1877f2] text-white text-sm font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50">
                    {savingFb ? '⏳ Đang lưu...' : '💾 Lưu App ID / Secret'}
                  </button>
                </div>
              </div>

              <div className="h-px bg-[#f0e8d8]" />

              {/* ── Bước 2: kết nối Page bằng 1 nút ── */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[#8b5e3c] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#1877f2] text-white flex items-center justify-center text-[10px]">2</span>
                  Kết nối Page (đăng nhập Facebook — không cần token thủ công)
                </div>

                <button
                  onClick={connectFacebook}
                  disabled={connecting}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1877f2] text-white text-sm font-semibold hover:bg-[#1568d8] cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
                  {connecting ? 'Đang chuyển đến Facebook...' : 'Kết nối / Thêm Page Facebook'}
                </button>
                <p className="text-[11px] text-[#8b5e3c]/60 text-center">
                  Bấm nút → đăng nhập FB → chọn Page → xong. Token được lấy & lưu tự động.
                </p>

                {/* Danh sách Page đã kết nối */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#8b5e3c]">
                      Page đã kết nối ({pages.length})
                    </span>
                    <button onClick={loadPages} className="text-[11px] text-[#1877f2] hover:underline cursor-pointer">
                      {loadingPages ? 'Đang tải...' : '↻ Làm mới'}
                    </button>
                  </div>
                  {pages.length === 0 ? (
                    <div className="text-center py-4 text-xs text-[#8b5e3c]/50 bg-[#fdf6ec] rounded-lg border border-dashed border-[#e8d5b7]">
                      Chưa có Page nào được kết nối
                    </div>
                  ) : (
                    pages.map(p => (
                      <div key={p.id} className="flex items-center gap-3 bg-white rounded-lg border border-[#f0e8d8] px-3 py-2.5">
                        {p.page_avatar
                          ? <img src={p.page_avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                          : <div className="w-9 h-9 rounded-full bg-[#1877f2] text-white flex items-center justify-center flex-shrink-0">📘</div>}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#1a0f07] truncate">{p.page_name || p.page_id}</div>
                          <div className="text-[10px] text-[#8b5e3c]/60">ID: {p.page_id}</div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.is_active ? '● Đang hoạt động' : 'Tạm tắt'}
                        </span>
                        <button
                          onClick={() => disconnectPage(p.page_id, p.page_name || p.page_id)}
                          className="text-[#c0392b] hover:bg-red-50 rounded-lg px-2 py-1 text-xs cursor-pointer flex-shrink-0"
                          title="Ngắt kết nối"
                        >
                          🗑
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Zalo ── */}
          <div className="bg-[#fffaf4] rounded-2xl border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 bg-[#e5f0ff] border-b border-[#cfe2ff]">
              <span className="text-xl">🟦</span>
              <span className="font-semibold text-[#0068ff]">Zalo OA</span>
            </div>
            <div className="p-5 space-y-5">
              {/* ── Bước 1: cấu hình App (1 lần) ── */}
              <div className="space-y-4">
                <div className="text-xs font-semibold text-[#8b5e3c] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#0068ff] text-white flex items-center justify-center text-[10px]">1</span>
                  Cấu hình App (chỉ làm 1 lần cho cả hệ thống)
                </div>
                <WebhookRow label="Webhook URL (dán vào Zalo Developers → Webhook)" url={`${origin}/api/channels/zalo/webhook`} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ZALO_FIELDS.map(renderField)}
                </div>
                <div className="text-[11px] text-[#8b5e3c]/70 bg-[#fdf6ec] rounded-lg p-2.5 border border-[#f0e8d8]">
                  ⚙️ Trong Zalo Developers → Official Account, thêm <b>Callback URL</b>:
                  <code className="block mt-1 text-[#0068ff] break-all">{origin}/api/channels/zalo/oauth/callback</code>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => saveGroup(ZALO_FIELDS, 'Zalo', setSavingZalo)} disabled={savingZalo}
                    className="px-5 py-2.5 rounded-lg bg-[#0068ff] text-white text-sm font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50">
                    {savingZalo ? '⏳ Đang lưu...' : '💾 Lưu cấu hình Zalo'}
                  </button>
                </div>
              </div>

              <div className="h-px bg-[#f0e8d8]" />

              {/* ── Bước 2: kết nối OA bằng 1 nút ── */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[#8b5e3c] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#0068ff] text-white flex items-center justify-center text-[10px]">2</span>
                  Kết nối OA (cấp quyền — token tự lấy & tự gia hạn, không nhập tay)
                </div>
                <button
                  onClick={connectZalo}
                  disabled={connectingZalo}
                  className="w-full px-5 py-3 rounded-lg bg-[#0068ff] text-white text-sm font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                  {connectingZalo ? '⏳ Đang chuyển hướng...' : '🔗 Kết nối / Cấp quyền Zalo OA'}
                </button>
                <div className="text-[11px] text-[#8b5e3c]/70 text-center">
                  Bấm nút → đăng nhập Zalo → chọn OA → cấp quyền. Token được lấy &amp; lưu tự động.
                </div>
              </div>
            </div>
          </div>

          {/* ── AI tự động trả lời ── */}
          {(() => {
            const provider = config.ai_provider || 'gemini'
            const modelHint = provider === 'gemini' ? 'VD: gemini-2.0-flash (free tier)'
              : provider === 'anthropic' ? 'VD: claude-haiku-4-5'
              : provider === 'deepseek' ? 'VD: deepseek-chat'
              : 'VD: gpt-4o-mini'
            const keyHint = provider === 'gemini' ? 'Lấy ở aistudio.google.com/apikey (miễn phí)'
              : provider === 'anthropic' ? 'Lấy ở console.anthropic.com'
              : provider === 'deepseek' ? 'Lấy ở platform.deepseek.com'
              : 'Lấy ở platform.openai.com/api-keys'
            const aiOn = config.ai_enabled === 'true'
            const autoOn = config.ai_auto_reply === 'true'
            const keyShown = reveal.has('ai_api_key')
            return (
              <div className="bg-[#fffaf4] rounded-2xl border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)] overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 bg-[#f3e8ff] border-b border-[#e3d3fb]">
                  <span className="text-xl">🤖</span>
                  <span className="font-semibold text-[#7c3aed]">AI tự động trả lời</span>
                </div>
                <div className="p-5 space-y-4">
                  {/* Bật/tắt tổng + auto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => setField('ai_enabled', aiOn ? 'false' : 'true')}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${aiOn ? 'bg-[#e7f6ec] border-[#bfe6cb] text-[#1a7f37]' : 'bg-white border-[#f0e8d8] text-[#8b5e3c]'}`}>
                      <span>Bật tính năng AI</span>
                      <span className={`w-10 h-5 rounded-full relative transition-colors ${aiOn ? 'bg-[#1a7f37]' : 'bg-[#d8c8a8]'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${aiOn ? 'left-[22px]' : 'left-0.5'}`} />
                      </span>
                    </button>
                    <button onClick={() => setField('ai_auto_reply', autoOn ? 'false' : 'true')}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${autoOn ? 'bg-[#e7f6ec] border-[#bfe6cb] text-[#1a7f37]' : 'bg-white border-[#f0e8d8] text-[#8b5e3c]'}`}>
                      <span>Tự động gửi <span className="text-[10px] opacity-70">(tắt = chỉ gợi ý)</span></span>
                      <span className={`w-10 h-5 rounded-full relative transition-colors ${autoOn ? 'bg-[#1a7f37]' : 'bg-[#d8c8a8]'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoOn ? 'left-[22px]' : 'left-0.5'}`} />
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nhà cung cấp */}
                    <div>
                      <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Nhà cung cấp</label>
                      <select value={provider}
                        onChange={e => { setField('ai_provider', e.target.value); setField('ai_model', ''); setForceCustomModel(false) }}
                        className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a]">
                        <option value="gemini">Google Gemini (rẻ nhất, có free)</option>
                        <option value="deepseek">DeepSeek (rẻ, tương thích OpenAI)</option>
                        <option value="anthropic">Claude (Anthropic)</option>
                        <option value="openai">OpenAI (GPT)</option>
                      </select>
                    </div>
                    {/* Model — dropdown theo provider + tuỳ chọn tự gõ */}
                    {(() => {
                      const opts = MODEL_OPTIONS[provider] ?? []
                      const isCustomVal = !!config.ai_model && !opts.some(o => o.value === config.ai_model)
                      const showCustom = forceCustomModel || isCustomVal
                      return (
                        <div>
                          <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Model</label>
                          <select value={showCustom ? '__custom__' : (config.ai_model || '')}
                            onChange={e => {
                              const v = e.target.value
                              if (v === '__custom__') setForceCustomModel(true)
                              else { setForceCustomModel(false); setField('ai_model', v) }
                            }}
                            className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a]">
                            <option value="">— Chọn model —</option>
                            {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            <option value="__custom__">Khác (tự gõ)…</option>
                          </select>
                          {showCustom && (
                            <input type="text" value={config.ai_model ?? ''} onChange={e => setField('ai_model', e.target.value)}
                              placeholder={modelHint}
                              className="mt-2 w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] font-mono" />
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  {/* API key */}
                  <div>
                    <label className="block text-xs font-medium text-[#8b5e3c] mb-1">
                      API Key <span className="ml-1 text-[10px] text-[#c8a87a] font-normal">— {keyHint}</span>
                    </label>
                    <div className="relative">
                      <input type={keyShown ? 'text' : 'password'} value={config.ai_api_key ?? ''} onChange={e => setField('ai_api_key', e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 pr-10 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] font-mono" />
                      <button type="button" onClick={() => toggleReveal('ai_api_key')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#c8a87a] hover:text-[#c8773a] text-sm cursor-pointer">
                        {keyShown ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>

                  {/* Thông tin tiệm */}
                  <div>
                    <label className="block text-xs font-medium text-[#8b5e3c] mb-1">
                      Thông tin tiệm <span className="ml-1 text-[10px] text-[#c8a87a] font-normal">— giờ mở cửa, địa chỉ, giao hàng, giọng văn... AI dùng để trả lời</span>
                    </label>
                    <textarea value={config.ai_shop_info ?? ''} onChange={e => setField('ai_shop_info', e.target.value)} rows={4}
                      placeholder={'VD: Tiệm mở cửa 7h-21h hàng ngày. Địa chỉ 12 Lê Lợi, Q1. Giao hàng nội thành 20k. Xưng "shop", gọi khách là "bạn".'}
                      className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] resize-y leading-relaxed" />
                  </div>

                  <div className="text-[11px] text-[#8b5e3c]/70 bg-[#fdf6ec] rounded-lg p-2.5 border border-[#f0e8d8]">
                    💡 AI tự lấy danh mục sản phẩm + giá từ kho khi trả lời. Có thể tắt AI cho từng khách trong tab <b>Inbox kênh</b>. Nút ✨ trong khung chat luôn gợi ý được (kể cả khi tắt tự động gửi).
                  </div>

                  <div className="flex justify-end">
                    <button onClick={() => saveGroup(
                      ['ai_enabled', 'ai_auto_reply', 'ai_provider', 'ai_api_key', 'ai_model', 'ai_shop_info'].map(k => ({ key: k, label: k, placeholder: '' })),
                      'AI', setSavingAi)} disabled={savingAi}
                      className="px-5 py-2.5 rounded-lg bg-[#7c3aed] text-white text-sm font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50">
                      {savingAi ? '⏳ Đang lưu...' : '💾 Lưu cấu hình AI'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* ── Trello ── */}
          <div className="bg-[#fffaf4] rounded-2xl border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 bg-[#e7f0fd] border-b border-[#d3e3fb]">
              <span className="text-xl">📋</span>
              <span className="font-semibold text-[#0079bf]">Trello (đơn hàng &amp; sinh nhật)</span>
            </div>
            <div className="p-5 space-y-4">
              {/* Bước 1: key + token */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TRELLO_CRED_FIELDS.map(renderField)}
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] text-[#8b5e3c]/70">🔑 Lấy API Key + Token tại <span className="text-[#0079bf]">trello.com/app-key</span></span>
                <button
                  onClick={() => loadTrelloBoards(config.trello_api_key ?? '', config.trello_token ?? '')}
                  disabled={loadingBoards || !config.trello_api_key || !config.trello_token}
                  className="px-3.5 py-2 rounded-lg bg-white border border-[#0079bf] text-[#0079bf] text-xs font-semibold hover:bg-[#e7f0fd] disabled:opacity-50 flex items-center gap-1.5">
                  <span className={loadingBoards ? 'animate-spin' : ''}>{loadingBoards ? '↻' : '🔄'}</span>
                  Tải board &amp; list
                </button>
              </div>

              {/* Bước 2: chọn board + list cho từng mục đích */}
              <div className="h-px bg-[#f0e8d8]" />
              {trelloBoards.length === 0 ? (
                <p className="text-[11px] text-[#8b5e3c]/60 text-center py-2">
                  Nhập API Key + Token rồi bấm <b>“Tải board &amp; list”</b> để chọn nơi tạo card.
                </p>
              ) : (
                <div className="space-y-3">
                  {renderTrelloPicker('🧾 Đơn hàng (từ chat)', 'trello_order_board_id', 'trello_order_list_id')}
                  {renderTrelloPicker('🎂 Sinh nhật nhân sự', 'trello_birthday_board_id', 'trello_birthday_list_id')}
                  <p className="text-[10px] text-[#8b5e3c]/60">Mỗi mục có thể chọn board khác nhau. Đơn AI/thủ công vào list Đơn hàng; card sinh nhật vào list Sinh nhật.</p>
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={() => saveGroup(TRELLO_SAVE_KEYS.map(k => ({ key: k, label: k, placeholder: '' })), 'Trello', setSavingTrello)} disabled={savingTrello}
                  className="px-5 py-2.5 rounded-lg bg-[#0079bf] text-white text-sm font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50">
                  {savingTrello ? '⏳ Đang lưu...' : '💾 Lưu cấu hình Trello'}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#8b5e3c]/60 text-center">
            🔐 Secrets chỉ admin xem được (RLS). Webhook server dùng service role key để đọc khi xử lý tin nhắn.
          </p>
        </>
      )}
    </div>
  )
}
