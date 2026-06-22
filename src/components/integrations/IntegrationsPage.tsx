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

const FB_FIELDS: Field[] = [
  { key: 'fb_app_id',       label: 'App ID',            placeholder: 'VD: 1234567890',          hint: 'developers.facebook.com → App → Settings → Basic' },
  { key: 'fb_app_secret',   label: 'App Secret',        placeholder: '••••••••',  secret: true },
  { key: 'fb_page_id',      label: 'Page ID',           placeholder: 'ID trang Facebook' },
  { key: 'fb_page_token',   label: 'Page Access Token', placeholder: 'EAAB...',  secret: true, hint: 'Token vĩnh viễn của Page' },
  { key: 'fb_verify_token', label: 'Verify Token',      placeholder: 'Chuỗi tự đặt để xác thực webhook' },
]

const ZALO_FIELDS: Field[] = [
  { key: 'zalo_app_id',        label: 'App ID',          placeholder: 'VD: 1234567890',          hint: 'developers.zalo.me → Ứng dụng' },
  { key: 'zalo_secret',        label: 'Secret Key',      placeholder: '••••••••',  secret: true },
  { key: 'zalo_oa_id',         label: 'OA ID',           placeholder: 'ID Official Account' },
  { key: 'zalo_oa_token',      label: 'OA Access Token', placeholder: 'Token truy cập OA',       secret: true },
  { key: 'zalo_refresh_token', label: 'Refresh Token',   placeholder: 'Token làm mới',           secret: true },
]

const ALL_KEYS = [...FB_FIELDS, ...ZALO_FIELDS].map(f => f.key)

export default function IntegrationsPage() {
  const { sb, profile, user, toast, startLoading, stopLoading, writeAudit } = useApp()
  const isAdmin = profile?.role === 'admin'

  const [config, setConfig]   = useState<ConfigMap>({})
  const [loading, setLoading] = useState(true)
  const [savingFb, setSavingFb]     = useState(false)
  const [savingZalo, setSavingZalo] = useState(false)
  const [reveal, setReveal]   = useState<Set<string>>(new Set())
  const [origin, setOrigin]   = useState('')

  useEffect(() => { setOrigin(window.location.origin) }, [])

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
    setSaving(true)
    startLoading()
    try {
      const payload = fields.map(f => ({
        key: f.key,
        value: config[f.key] ?? '',
        updated_by: profile?.full_name || user.email || '',
        updated_at: new Date().toISOString(),
      }))
      const { error } = await sb.from('integration_config').upsert(payload, { onConflict: 'key' })
      if (error) throw error
      await writeAudit('update', 'integration_config', label, `Cập nhật cấu hình ${label}`)
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
            <div className="p-5 space-y-4">
              <WebhookRow label="Callback URL (dán vào Meta → Webhooks)" url={`${origin}/api/webhooks/facebook`} token={config.fb_verify_token} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FB_FIELDS.map(renderField)}
              </div>
              <div className="flex justify-end">
                <button onClick={() => saveGroup(FB_FIELDS, 'Facebook', setSavingFb)} disabled={savingFb}
                  className="px-5 py-2.5 rounded-lg bg-[#1877f2] text-white text-sm font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50">
                  {savingFb ? '⏳ Đang lưu...' : '💾 Lưu cấu hình Facebook'}
                </button>
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
