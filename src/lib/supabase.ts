import { createClient as _createClient } from '@supabase/supabase-js'

let instance: ReturnType<typeof _createClient> | null = null

export function createClient() {
  if (!instance) {
    instance = _createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return instance
}

// Đọc access token trực tiếp từ localStorage — KHÔNG qua supabase-js
// (tránh auth-lock của supabase-js treo request khi refresh token / mở nhiều tab).
export function getAccessToken(): string | null {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const ref = url.match(/https:\/\/([^.]+)\./)?.[1]
    if (!ref) return null
    const raw = localStorage.getItem(`sb-${ref}-auth-token`)
    if (!raw) return null
    return JSON.parse(raw)?.access_token ?? null
  } catch { return null }
}

// SELECT trực tiếp qua PostgREST bằng fetch + token localStorage → KHÔNG dính auth-lock.
// `query` là phần sau /rest/v1/, vd: "channel_threads?channel=eq.zalo&order=last_message_at.desc&limit=100"
export async function sbSelect<T = unknown>(query: string, timeoutMs = 12000): Promise<T[]> {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const token = getAccessToken() ?? anon
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${url}/rest/v1/${query}`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`REST ${res.status}: ${await res.text()}`)
    return await res.json() as T[]
  } finally {
    clearTimeout(t)
  }
}
