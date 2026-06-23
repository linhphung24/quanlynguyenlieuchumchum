import { createClient, SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const ZALO_OAUTH_URL = 'https://oauth.zaloapp.com/v4/oa/access_token'
const ZALO_PERMISSION_URL = 'https://oauth.zaloapp.com/v4/oa/permission'

function admin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Server chưa cấu hình Supabase service role')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// Đọc App ID + Secret Key của Zalo từ integration_config (admin nhập 1 lần)
export async function getZaloAppCreds(): Promise<{ appId: string; secret: string }> {
  const sb = admin()
  const { data } = await sb
    .from('integration_config')
    .select('key, value')
    .in('key', ['zalo_app_id', 'zalo_secret'])
  const map: Record<string, string> = {}
  for (const r of (data ?? []) as { key: string; value: string }[]) map[r.key] = r.value ?? ''
  const appId = map.zalo_app_id?.trim()
  const secret = map.zalo_secret?.trim()
  if (!appId || !secret) {
    throw new Error('Chưa cấu hình App ID / Secret Key của Zalo trong Cấu hình kênh')
  }
  return { appId, secret }
}

// ── PKCE (Zalo OA v4 bắt buộc) ──
export function genCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')        // 43 ký tự
}
export function codeChallengeS256(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

// Tạo URL trang cấp quyền OA của Zalo
export function buildZaloOAuthUrl(
  appId: string, redirectUri: string, state: string, codeChallenge: string
): string {
  const params = new URLSearchParams({
    app_id: appId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    state,
  })
  return `${ZALO_PERMISSION_URL}?${params.toString()}`
}

interface ZaloTokenResp {
  access_token?: string
  refresh_token?: string
  expires_in?: string | number
  error?: number
  error_name?: string
  error_description?: string
  message?: string
}

// Đổi authorization code (lần đầu) → access_token + refresh_token, lưu DB
// codeVerifier: chuỗi PKCE sinh ở bước start, lưu tạm trong cookie cho tới callback
export async function exchangeZaloCode(code: string, codeVerifier: string): Promise<void> {
  const { appId, secret } = await getZaloAppCreds()

  const body = new URLSearchParams({
    code,
    app_id: appId,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  })

  const res = await fetch(ZALO_OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', secret_key: secret },
    body,
  })
  const data = (await res.json()) as ZaloTokenResp
  if (!data.access_token) {
    throw new Error(`Đổi code thất bại: ${data.error_description || data.message || JSON.stringify(data)}`)
  }
  await saveTokens(data)
}

// Lưu / cập nhật token vào DB
async function saveTokens(data: ZaloTokenResp): Promise<string> {
  const now = Date.now()
  const accessTtl = Number(data.expires_in ?? 3600) * 1000          // ~1h
  const refreshTtl = 90 * 24 * 60 * 60 * 1000                        // ~3 tháng
  const sb = admin()
  const { error } = await sb.from('channel_oauth').upsert({
    channel: 'zalo',
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    access_expires_at: new Date(now + accessTtl - 60_000).toISOString(),   // trừ 1 phút an toàn
    refresh_expires_at: new Date(now + refreshTtl).toISOString(),
    updated_at: new Date(now).toISOString(),
  }, { onConflict: 'channel' })
  if (error) throw new Error('Lưu token Zalo lỗi: ' + error.message)
  return data.access_token as string
}

// Dùng refresh_token lấy access_token mới (refresh_token cũng xoay vòng → lưu lại)
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const { appId, secret } = await getZaloAppCreds()

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    app_id: appId,
    grant_type: 'refresh_token',
  })
  const res = await fetch(ZALO_OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', secret_key: secret },
    body,
  })
  const data = (await res.json()) as ZaloTokenResp
  if (!data.access_token) {
    throw new Error(`Refresh token thất bại: ${data.error_description || data.message || JSON.stringify(data)}`)
  }
  return saveTokens(data)
}

// Lấy thông tin user (tên + avatar) — webhook Zalo không kèm sẵn, phải gọi API
export async function fetchZaloUserProfile(
  userId: string
): Promise<{ display_name?: string; avatar?: string } | null> {
  try {
    const token = await getZaloAccessToken()
    const data = encodeURIComponent(JSON.stringify({ user_id: userId }))
    const res = await fetch(`https://openapi.zalo.me/v3.0/oa/user/detail?data=${data}`, {
      headers: { access_token: token },
    })
    const json = (await res.json()) as {
      data?: { display_name?: string; avatar?: string }
      error?: number
    }
    if (json.error && json.error !== 0) return null
    return json.data ?? null
  } catch {
    return null
  }
}

// Lấy access_token hợp lệ — tự refresh nếu sắp/đã hết hạn
export async function getZaloAccessToken(): Promise<string> {
  const sb = admin()
  const { data, error } = await sb.from('channel_oauth').select('*').eq('channel', 'zalo').single()
  if (error || !data) {
    throw new Error('Chưa kết nối Zalo OA — hãy chạy luồng cấp quyền OAuth trước')
  }
  const expired = !data.access_expires_at || new Date(data.access_expires_at).getTime() <= Date.now()
  if (!expired && data.access_token) return data.access_token as string

  if (!data.refresh_token) throw new Error('Token Zalo hết hạn và không có refresh_token — cần cấp quyền lại')
  return refreshAccessToken(data.refresh_token as string)
}
