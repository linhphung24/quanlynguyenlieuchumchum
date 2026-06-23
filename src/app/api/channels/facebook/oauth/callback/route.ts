import { NextRequest, NextResponse } from 'next/server'
import {
  fbAdmin, getFbAppCreds, verifyState,
  exchangeCodeForUserToken, exchangeForLongLivedToken,
  fetchUserPages, subscribePageWebhook,
} from '@/lib/facebook'

// Facebook gọi lại sau khi user đồng ý đăng nhập.
// Đổi code → token → lấy danh sách Page → lưu + đăng ký webhook → quay về trang Cấu hình kênh.
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin
  const back = (status: string, extra = '') =>
    NextResponse.redirect(`${origin}/?tab=integrations&fb=${status}${extra}`)

  try {
    const { searchParams } = new URL(req.url)
    const code  = searchParams.get('code')
    const state = searchParams.get('state')
    const fbErr = searchParams.get('error_description') || searchParams.get('error')

    if (fbErr) return back('denied')
    if (!code || !state) return back('error', '&msg=' + encodeURIComponent('Thiếu code/state'))

    const verified = verifyState(state)
    if (!verified) return back('error', '&msg=' + encodeURIComponent('State không hợp lệ hoặc đã hết hạn'))

    const { appId, appSecret } = await getFbAppCreds()
    const redirectUri = `${origin}/api/channels/facebook/oauth/callback`

    // code → short-lived → long-lived user token
    const shortToken = await exchangeCodeForUserToken(code, redirectUri, appId, appSecret)
    const userToken  = await exchangeForLongLivedToken(shortToken, appId, appSecret)

    // Lấy danh sách Page (kèm page token vĩnh viễn)
    const pages = await fetchUserPages(userToken)
    if (pages.length === 0) return back('nopages')

    const sb = fbAdmin()
    const now = new Date().toISOString()
    let connected = 0

    for (const p of pages) {
      // Lưu / cập nhật connection
      const { error: upErr } = await sb.from('channel_connections').upsert({
        channel: 'facebook',
        page_id: p.id,
        page_name: p.name,
        page_avatar: p.avatar ?? null,
        page_access_token: p.access_token,
        is_active: true,
        connected_by: verified.uid,
        updated_at: now,
      }, { onConflict: 'channel,page_id' })
      if (upErr) { console.error('[fb callback] upsert page error:', upErr.message); continue }

      // Đăng ký webhook cho Page (không chặn nếu lỗi — vẫn lưu connection)
      try {
        await subscribePageWebhook(p.id, p.access_token)
      } catch (e) {
        console.error('[fb callback] subscribe webhook fail:', p.id, (e as Error).message)
      }
      connected++
    }

    return back('connected', '&count=' + connected)
  } catch (e) {
    console.error('[fb callback]', e)
    return back('error', '&msg=' + encodeURIComponent((e as Error).message))
  }
}
