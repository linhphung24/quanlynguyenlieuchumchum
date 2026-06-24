// Tạo card Trello (dùng chung cho sinh nhật nhân sự + đơn hàng từ chat).

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

function getTrelloCreds() {
  const key   = process.env.TRELLO_API_KEY
  const token = process.env.TRELLO_TOKEN
  const list  = process.env.TRELLO_LIST_ID
  if (!key || !token || !list) {
    throw new Error('Thiếu cấu hình Trello (TRELLO_API_KEY / TRELLO_TOKEN / TRELLO_LIST_ID)')
  }
  return { key, token, list }
}

// Tạo card thô — trả về { id, url }
export async function createTrelloCard(name: string, desc: string): Promise<{ id: string; url: string }> {
  const { key, token, list } = getTrelloCreds()
  const url = new URL('https://api.trello.com/1/cards')
  url.searchParams.set('key', key)
  url.searchParams.set('token', token)
  url.searchParams.set('idList', list)
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
