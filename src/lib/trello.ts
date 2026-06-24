// Tạo card Trello (dùng chung cho sinh nhật nhân sự + đơn hàng từ chat).
import { createClient, SupabaseClient } from '@supabase/supabase-js'

function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export interface OrderInfo {
  customer?: string
  phone?: string
  items?: { name?: string; qty?: string | number }[]
  method?: 'ship' | 'pickup' | string
  address?: string
  when?: string
  total?: string
  note?: string
}

// Đọc cấu hình Trello từ integration_config (admin sửa trên UI), fallback env.
export async function getTrelloConfig(): Promise<{
  apiKey: string; token: string; orderListId: string; birthdayListId: string
}> {
  const sb = admin()
  const { data } = await sb
    .from('integration_config')
    .select('key, value')
    .in('key', ['trello_api_key', 'trello_token', 'trello_order_list_id', 'trello_birthday_list_id'])
  const m: Record<string, string> = {}
  for (const r of (data ?? []) as { key: string; value: string }[]) m[r.key] = r.value ?? ''
  return {
    apiKey:         (m.trello_api_key      || process.env.TRELLO_API_KEY  || '').trim(),
    token:          (m.trello_token        || process.env.TRELLO_TOKEN    || '').trim(),
    orderListId:    (m.trello_order_list_id    || process.env.TRELLO_ORDER_LIST_ID || process.env.TRELLO_LIST_ID || '').trim(),
    birthdayListId: (m.trello_birthday_list_id || process.env.TRELLO_LIST_ID || '').trim(),
  }
}

// Tạo card thô vào list theo loại (đơn hàng / sinh nhật) — trả về { id, url }
export async function createTrelloCard(
  name: string, desc: string, listKind: 'order' | 'birthday' = 'order'
): Promise<{ id: string; url: string }> {
  const cfg = await getTrelloConfig()
  const listId = listKind === 'birthday' ? cfg.birthdayListId : cfg.orderListId
  if (!cfg.apiKey || !cfg.token) throw new Error('Chưa cấu hình Trello API Key / Token (vào Cấu hình kênh)')
  if (!listId) throw new Error(`Chưa cấu hình List ID Trello cho ${listKind === 'birthday' ? 'sinh nhật' : 'đơn hàng'}`)

  const url = new URL('https://api.trello.com/1/cards')
  url.searchParams.set('key', cfg.apiKey)
  url.searchParams.set('token', cfg.token)
  url.searchParams.set('idList', listId)
  url.searchParams.set('name', name)
  url.searchParams.set('desc', desc)
  const res = await fetch(url.toString(), { method: 'POST' })
  if (!res.ok) throw new Error(`Trello API lỗi: ${await res.text()}`)
  const data = await res.json() as { id: string; shortUrl?: string; url?: string }
  return { id: data.id, url: data.shortUrl ?? data.url ?? '' }
}

// Chuẩn hoá đơn → tên + mô tả card
export function buildOrderCard(order: OrderInfo, opts: { channel?: string; createdBy?: string } = {}) {
  const items = (order.items ?? []).filter(i => i?.name)
  const itemLines = items.length
    ? items.map(i => `• ${i.name}${i.qty ? ` × ${i.qty}` : ''}`)
    : ['• (chưa rõ sản phẩm)']
  const methodLabel = order.method === 'pickup' ? 'Lấy tại tiệm'
    : order.method === 'ship' ? 'Giao tận nơi' : (order.method || '—')

  const name = `🧾 Đơn: ${order.customer || 'Khách'}${order.when ? ` — ${order.when}` : ''}`
  const desc = [
    `**Khách:** ${order.customer || '—'}`,
    `**SĐT:** ${order.phone || '—'}`,
    `**Sản phẩm:**`,
    ...itemLines,
    `**Nhận hàng:** ${methodLabel}${order.address ? ` — ${order.address}` : ''}`,
    `**Thời gian:** ${order.when || '—'}`,
    order.total ? `**Tạm tính:** ${order.total}` : '',
    order.note ? `**Ghi chú:** ${order.note}` : '',
    '',
    `_Nguồn: ${opts.channel || 'chat'} · Tạo bởi: ${opts.createdBy || 'hệ thống'}_`,
  ].filter(Boolean).join('\n')

  return { name, desc }
}

// Chữ ký đơn để chống tạo trùng (chuẩn hoá customer + items + when)
export function orderSignature(order: OrderInfo): string {
  const items = (order.items ?? [])
    .map(i => `${(i.name ?? '').toLowerCase().trim()}:${i.qty ?? ''}`)
    .sort()
    .join('|')
  return [
    (order.customer ?? '').toLowerCase().trim(),
    (order.when ?? '').toLowerCase().trim(),
    items,
  ].join('~')
}
