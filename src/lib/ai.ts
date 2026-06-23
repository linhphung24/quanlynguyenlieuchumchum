import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ── Provider-agnostic AI reply layer ────────────────────────────
// Đọc cấu hình từ integration_config; gọi 1 trong 3 nhà cung cấp qua REST.
// Mặc định Gemini Flash (có free tier → rẻ nhất). Đổi provider/model/key
// trong "Cấu hình kênh" mà không cần sửa code.

function admin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Server chưa cấu hình Supabase service role')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export type AIProvider = 'gemini' | 'anthropic' | 'openai'

export interface AIConfig {
  enabled: boolean
  autoReply: boolean
  provider: AIProvider
  apiKey: string
  model: string
  shopInfo: string
}

const DEFAULT_MODEL: Record<AIProvider, string> = {
  gemini:    'gemini-2.0-flash',
  anthropic: 'claude-haiku-4-5',
  openai:    'gpt-4o-mini',
}

export async function getAIConfig(): Promise<AIConfig> {
  const sb = admin()
  const { data } = await sb
    .from('integration_config')
    .select('key, value')
    .in('key', ['ai_enabled', 'ai_auto_reply', 'ai_provider', 'ai_api_key', 'ai_model', 'ai_shop_info'])
  const m: Record<string, string> = {}
  for (const r of (data ?? []) as { key: string; value: string }[]) m[r.key] = r.value ?? ''
  const provider = (['gemini', 'anthropic', 'openai'].includes(m.ai_provider) ? m.ai_provider : 'gemini') as AIProvider
  return {
    enabled:   m.ai_enabled === 'true',
    autoReply: m.ai_auto_reply === 'true',
    provider,
    apiKey:    (m.ai_api_key ?? '').trim(),
    model:     (m.ai_model ?? '').trim() || DEFAULT_MODEL[provider],
    shopInfo:  m.ai_shop_info ?? '',
  }
}

// ── Ngữ cảnh sản phẩm: chỉ lấy SP khớp từ khoá trong tin của khách (tiết kiệm token) ──
async function buildProductContext(message: string): Promise<string> {
  const sb = admin()
  // Tách từ khoá ≥2 ký tự, bỏ trùng, tối đa 8 từ
  const words = Array.from(new Set(
    (message.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? []).slice(0, 8)
  ))
  if (words.length === 0) return ''
  const orFilter = words.map(w => `name.ilike.%${w.replace(/[,%]/g, '')}%`).join(',')
  const { data } = await sb
    .from('products')
    .select('name, sell_price, category, stock_qty')
    .or(orFilter)
    .limit(25)
  const rows = (data ?? []) as { name: string; sell_price: number; category: string; stock_qty: number }[]
  if (rows.length === 0) return ''
  const lines = rows.map(p => {
    const price = p.sell_price > 0 ? `${p.sell_price.toLocaleString('vi-VN')}đ` : 'liên hệ'
    const stock = p.stock_qty > 0 ? 'còn hàng' : 'tạm hết'
    return `- ${p.name} (${p.category}): ${price}, ${stock}`
  })
  return `Sản phẩm liên quan trong cửa hàng:\n${lines.join('\n')}`
}

function buildSystemPrompt(shopInfo: string, productCtx: string): string {
  const parts = [
    'Bạn là nhân viên chăm sóc khách hàng của tiệm bánh Chum Chum Bakery, trả lời tin nhắn trên Facebook/Zalo.',
    'Trả lời bằng tiếng Việt, thân thiện, ngắn gọn (1–3 câu), tự nhiên như người thật. Không bịa giá hay sản phẩm không có trong dữ liệu.',
    'Nếu không chắc hoặc khách hỏi việc cần con người (đặt hàng số lượng lớn, khiếu nại), hãy lịch sự nói sẽ có nhân viên liên hệ lại.',
  ]
  if (shopInfo.trim()) parts.push('Thông tin tiệm:\n' + shopInfo.trim())
  if (productCtx) parts.push(productCtx)
  return parts.join('\n\n')
}

export interface ChatTurn { role: 'user' | 'assistant'; content: string }

// Sinh câu trả lời. Trả về chuỗi, hoặc ném lỗi nếu provider trả lỗi.
export async function generateReply(
  cfg: AIConfig,
  history: ChatTurn[],
  latestUserMessage: string,
): Promise<string> {
  if (!cfg.apiKey) throw new Error('Chưa cấu hình API key cho AI trong Cấu hình kênh')
  const productCtx = await buildProductContext(latestUserMessage)
  const system = buildSystemPrompt(cfg.shopInfo, productCtx)
  const turns: ChatTurn[] = [...history, { role: 'user', content: latestUserMessage }]

  if (cfg.provider === 'gemini')    return callGemini(cfg, system, turns)
  if (cfg.provider === 'anthropic') return callAnthropic(cfg, system, turns)
  return callOpenAI(cfg, system, turns)
}

// ── Google Gemini ──
async function callGemini(cfg: AIConfig, system: string, turns: ChatTurn[]): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`
  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: turns.map(t => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.content }] })),
    generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
    error?: { message?: string }
  }
  if (!res.ok || data.error) throw new Error('Gemini lỗi: ' + (data.error?.message ?? res.status))
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('').trim()
  if (!text) throw new Error('Gemini không trả về nội dung')
  return text
}

// ── Anthropic (Claude) ──
async function callAnthropic(cfg: AIConfig, system: string, turns: ChatTurn[]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 400,
      system,
      messages: turns.map(t => ({ role: t.role, content: t.content })),
    }),
  })
  const data = await res.json() as {
    content?: { type: string; text?: string }[]
    error?: { message?: string }
  }
  if (!res.ok || data.error) throw new Error('Claude lỗi: ' + (data.error?.message ?? res.status))
  const text = data.content?.filter(b => b.type === 'text').map(b => b.text ?? '').join('').trim()
  if (!text) throw new Error('Claude không trả về nội dung')
  return text
}

// ── OpenAI ──
async function callOpenAI(cfg: AIConfig, system: string, turns: ChatTurn[]): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 400,
      temperature: 0.6,
      messages: [{ role: 'system', content: system }, ...turns.map(t => ({ role: t.role, content: t.content }))],
    }),
  })
  const data = await res.json() as {
    choices?: { message?: { content?: string } }[]
    error?: { message?: string }
  }
  if (!res.ok || data.error) throw new Error('OpenAI lỗi: ' + (data.error?.message ?? res.status))
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('OpenAI không trả về nội dung')
  return text
}
