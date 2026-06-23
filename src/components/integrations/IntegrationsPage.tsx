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

const ZALO_FIELDS: Field[] = [
  { key: 'zalo_app_id',        label: 'App ID',          placeholder: 'VD: 1234567890',          hint: 'developers.zalo.me → Ứng dụng' },
  { key: 'zalo_secret',        label: 'Secret Key',      placeholder: '••••••••',  secret: true },
  { key: 'zalo_oa_id',         label: 'OA ID',           placeholder: 'ID Official Account' },
  { key: 'zalo_oa_token',      label: 'OA Access Token', placeholder: 'Token truy cập OA',       secret: true },
  { key: 'zalo_refresh_token', label: 'Refresh Token',   placeholder: 'Token làm mới',           secret: true },
]

const ALL_KEYS = [...FB_FIELDS, ...ZALO_FIELDS].map(f => f.key)

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
  const [reveal, setReveal]   = useState<Set<string>>(new Set())
  const [origin, setOrigin]   = useState('')

  const [pages, setPages]         = useState<FbPageRow[]>([])
  const [loadingPages, setLoadingPages] = useState(false)
  const [connecting, setConnecting]     = useState(false)

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
            <div className="p-5 space-y-4">
              <WebhookRow label="Webhook URL (dán vào Zalo Developers → Webhook)" url={`${origin}/api/webhooks/zalo`} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ZALO_FIELDS.map(renderField)}
              </div>
              <div className="flex justify-end">
                <button onClick={() => saveGroup(ZALO_FIELDS, 'Zalo', setSavingZalo)} disabled={savingZalo}
                  className="px-5 py-2.5 rounded-lg bg-[#0068ff] text-white text-sm font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50">
                  {savingZalo ? '⏳ Đang lưu...' : '💾 Lưu cấu hình Zalo'}
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
