import { getZaloAccessToken } from '@/lib/zalo'
import { getPageToken } from '@/lib/facebook'

// Gửi tin nhắn ra nền tảng (dùng chung cho trả lời thủ công + AI tự động).

export async function sendFacebookMessage(pageId: string, recipientPsid: string, text: string) {
  const token = await getPageToken(pageId)
  if (!token) throw new Error('Page chưa được kết nối hoặc đã ngắt — vào Cấu hình kênh để kết nối lại')

  const res = await fetch(
    `https://graph.facebook.com/v21.0/me/messages?access_token=${token}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ recipient: { id: recipientPsid }, message: { text } }),
    }
  )
  if (!res.ok) throw new Error(`Facebook API error: ${await res.text()}`)
}

export async function sendZaloMessage(userId: string, text: string) {
  const token = await getZaloAccessToken()   // tự refresh nếu hết hạn
  const res = await fetch('https://openapi.zalo.me/v3.0/oa/message/cs', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'access_token': token },
    body:    JSON.stringify({ recipient: { user_id: userId }, message: { text } }),
  })
  if (!res.ok) throw new Error(`Zalo API error: ${await res.text()}`)
  const data = await res.json() as { error?: number; message?: string }
  if (data.error && data.error !== 0) throw new Error(`Zalo error ${data.error}: ${data.message}`)
}
