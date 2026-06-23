import { createClient, SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const GRAPH = 'https://graph.facebook.com/v21.0'

export function fbAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Server chưa cấu hình Supabase service role')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// Đọc App ID + App Secret từ integration_config (admin nhập 1 lần)
export async function getFbAppCreds(): Promise<{ appId: string; appSecret: string }> {
  const sb = fbAdmin()
  const { data } = await sb
    .from('integration_config')
    .select('key, value')
    .in('key', ['fb_app_id', 'fb_app_secret'])
  const map: Record<string, string> = {}
  for (const r of (data ?? []) as { key: string; value: string }[]) map[r.key] = r.value ?? ''
  const appId = map.fb_app_id?.trim()
  const appSecret = map.fb_app_secret?.trim()
  if (!appId || !appSecret) {
    throw new Error('Chưa cấu hình App ID / App Secret của Facebook trong Cấu hình kênh')
  }
  return { appId, appSecret }
}

// ── HMAC state (chống CSRF, không cần bảng phụ) ──
export function signState(uid: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret'
  const payload = `${uid}.${Date.now()}`
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 32)
  return Buffer.from(`${payload}.${sig}`).toString('base64url')
}

export function verifyState(state: string): { uid: string } | null {
  try {
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret'
    const decoded = Buffer.from(state, 'base64url').toString('utf8')
    const [uid, ts, sig] = decoded.split('.')
    if (!uid || !ts || !sig) return null
    const expected = crypto.createHmac('sha256', secret).update(`${uid}.${ts}`).digest('hex').slice(0, 32)
    if (sig !== expected) return null
    // Hết hạn sau 15 phút
    if (Date.now() - Number(ts) > 15 * 60 * 1000) return null
    return { uid }
  } catch {
    return null
  }
}

// Quyền cần xin (Development mode: chỉ admin/tester của app dùng được; Live cần App Review)
export const FB_SCOPES = [
  'pages_show_list',
  'pages_messaging',
  'pages_manage_metadata',
  'pages_read_engagement',
].join(',')

export const FB_SUBSCRIBE_FIELDS = 'messages,messaging_postbacks,message_deliveries'

// Tạo URL dialog đăng nhập Facebook
export function buildOAuthUrl(appId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: FB_SCOPES,
    response_type: 'code',
  })
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`
}

interface FbErr { error?: { message?: string; type?: string } }

// Đổi code → short-lived user token
export async function exchangeCodeForUserToken(
  code: string, redirectUri: string, appId: string, appSecret: string
): Promise<string> {
  const url = `${GRAPH}/oauth/access_token?` + new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  })
  const res = await fetch(url)
  const data = await res.json() as { access_token?: string } & FbErr
  if (!data.access_token) throw new Error('Đổi code thất bại: ' + (data.error?.message ?? 'unknown'))
  return data.access_token
}

// Short-lived → long-lived user token (~60 ngày)
export async function exchangeForLongLivedToken(
  shortToken: string, appId: string, appSecret: string
): Promise<string> {
  const url = `${GRAPH}/oauth/access_token?` + new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  })
  const res = await fetch(url)
  const data = await res.json() as { access_token?: string } & FbErr
  if (!data.access_token) throw new Error('Lấy long-lived token thất bại: ' + (data.error?.message ?? 'unknown'))
  return data.access_token
}

export interface FbPage {
  id: string
  name: string
  access_token: string
  avatar?: string
}

// Lấy danh sách Page user quản lý (kèm Page Access Token vĩnh viễn)
export async function fetchUserPages(userToken: string): Promise<FbPage[]> {
  const url = `${GRAPH}/me/accounts?` + new URLSearchParams({
    fields: 'id,name,access_token,picture{url}',
    limit: '100',
    access_token: userToken,
  })
  const res = await fetch(url)
  const data = await res.json() as {
    data?: { id: string; name: string; access_token: string; picture?: { data?: { url?: string } } }[]
  } & FbErr
  if (data.error) throw new Error('Lấy danh sách Page thất bại: ' + data.error.message)
  return (data.data ?? []).map(p => ({
    id: p.id,
    name: p.name,
    access_token: p.access_token,
    avatar: p.picture?.data?.url,
  }))
}

// Đăng ký Page nhận webhook của App (1 lần / page)
export async function subscribePageWebhook(pageId: string, pageToken: string): Promise<void> {
  const res = await fetch(`${GRAPH}/${pageId}/subscribed_apps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscribed_fields: FB_SUBSCRIBE_FIELDS, access_token: pageToken }),
  })
  const data = await res.json() as { success?: boolean } & FbErr
  if (!data.success) throw new Error('Đăng ký webhook cho Page thất bại: ' + (data.error?.message ?? 'unknown'))
}

// Lấy Page Access Token theo page_id từ DB (dùng khi gửi tin/lấy profile)
export async function getPageToken(pageId: string): Promise<string | null> {
  const sb = fbAdmin()
  const { data } = await sb
    .from('channel_connections')
    .select('page_access_token')
    .eq('channel', 'facebook')
    .eq('page_id', pageId)
    .eq('is_active', true)
    .single()
  return (data?.page_access_token as string) ?? null
}
