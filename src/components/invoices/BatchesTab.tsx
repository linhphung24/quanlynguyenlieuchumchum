'use client'

import { useState, useEffect, useMemo } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Batch } from '@/types'
import { fmtDate, fmtNum, fmtPrice } from '@/lib/utils'

const DAYS_WARN = 30 // cảnh báo khi còn <= 30 ngày hết hạn

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Làm tròn 2 chữ số thập phân để tránh floating-point dư nhỏ
const eff = (qty: number) => parseFloat(qty.toFixed(2))

export default function BatchesTab() {
  const { sb, toast, allProducts } = useApp()
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showEmpty, setShowEmpty] = useState(false)
  const [alertSending, setAlertSending] = useState(false)

  // ─── Gửi email cảnh báo ─────────────────────────────────────
  const sendAlerts = async () => {
    setAlertSending(true)
    try {
      const res = await fetch('/api/alerts', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || 'Lỗi gửi cảnh báo', 'error')
      } else if (!json.sent) {
        toast('Không có cảnh báo nào cần gửi', 'info')
      } else {
        toast(`Đã gửi email: ${json.lowStockCount} SP thấp tồn, ${json.expiringCount} lô sắp hết hạn`)
      }
    } catch {
      toast('Không kết nối được API cảnh báo', 'error')
    }
    setAlertSending(false)
  }

  useEffect(() => { loadBatches() }, [])

  const loadBatches = async () => {
    setLoading(true)
    setDbError(null)
    try {
      const PAGE = 1000

      // 1. Fetch tất cả batches (paginated)
      const allBatches: Batch[] = []
      let fetchError: string | null = null
      let from = 0
      while (true) {
        const { data, error } = await sb
          .from('batches')
          .select('*')
          .order('product_name', { ascending: true })
          .order('inv_date',     { ascending: true })
          .order('id',           { ascending: true })
          .range(from, from + PAGE - 1)
        if (error) { fetchError = error.message; break }
        if (!data || data.length === 0) break
        allBatches.push(...(data as Batch[]))
        if (data.length < PAGE) break
        from += PAGE
      }
      if (fetchError) { setDbError(fetchError); return }

      // 2. Fetch batch_deductions → tính Σ qty_used theo batch_id
      const deductMap: Record<number, number> = {}
      let dFrom = 0
      while (true) {
        const { data: dData } = await sb
          .from('batch_deductions')
          .select('batch_id, qty_used')
          .range(dFrom, dFrom + PAGE - 1)
        if (!dData || dData.length === 0) break
        for (const d of dData as { batch_id: number; qty_used: number }[]) {
          deductMap[d.batch_id] = (deductMap[d.batch_id] || 0) + d.qty_used
        }
        if (dData.length < PAGE) break
        dFrom += PAGE
      }

      // 3. Ghi đè remaining_qty = quantity − Σ qty_used (tính từ HĐ, không dùng giá trị lưu sẵn)
      const computed = allBatches.map(b => ({
        ...b,
        remaining_qty: parseFloat(
          Math.max(0, b.quantity - (deductMap[b.id] || 0)).toFixed(2)
        ),
      }))
      setBatches(computed)
    } catch (e) {
      setDbError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // ─── Computed lists ─────────────────────────────────────────
  const { stats, expiredList, warnList } = useMemo(() => {
    const active = batches.filter(b => eff(b.remaining_qty) > 0)
    const expired = active.filter(b => { const d = daysUntil(b.exp_date); return d !== null && d < 0 })
    const warn    = active.filter(b => { const d = daysUntil(b.exp_date); return d !== null && d >= 0 && d <= DAYS_WARN })
    return {
      stats: { total: active.length, expired: expired.length, warn: warn.length },
      expiredList: expired,
      warnList: warn,
    }
  }, [batches])

  // Sản phẩm hết hàng (stock_qty = 0) và sắp hết (dưới mức tối thiểu)
  const { outOfStockList, lowStockList } = useMemo(() => {
    const active = allProducts.filter(p => p.is_active)
    return {
      outOfStockList: active.filter(p => eff(p.stock_qty) <= 0),
      lowStockList:   active.filter(p => p.min_stock > 0 && p.stock_qty > 0 && p.stock_qty < p.min_stock),
    }
  }, [allProducts])

  const filtered = useMemo(() => batches.filter(b => {
    if (!showEmpty && eff(b.remaining_qty) <= 0) return false
    if (search && !b.product_name.toLowerCase().includes(search.toLowerCase())
      && !b.inv_code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [batches, search, showEmpty])

  const getBatchStatus = (b: Batch): 'expired' | 'warn' | 'ok' | 'empty' => {
    if (eff(b.remaining_qty) <= 0) return 'empty'
    const d = daysUntil(b.exp_date)
    if (d === null) return 'ok'
    if (d < 0) return 'expired'
    if (d <= DAYS_WARN) return 'warn'
    return 'ok'
  }

  const pct = (b: Batch) => b.quantity > 0 ? Math.round(((b.quantity - b.remaining_qty) / b.quantity) * 100) : 100

  const hasAlerts = expiredList.length > 0 || warnList.length > 0 || outOfStockList.length > 0 || lowStockList.length > 0

  return (
    <div>
      {/* ── 3 KPI nhanh ── */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#fffaf4] rounded-xl p-3 border border-[#f5e6cc] text-center">
          <p className="text-2xl font-bold text-[#3d1f0a]">{stats.total}</p>
          <p className="text-[10px] text-[#8b5e3c] mt-0.5">Lô đang tồn</p>
        </div>
        <div className={`rounded-xl p-3 border text-center ${stats.warn > 0 ? 'bg-amber-50 border-amber-200' : 'bg-[#fffaf4] border-[#f5e6cc]'}`}>
          <p className={`text-2xl font-bold ${stats.warn > 0 ? 'text-amber-700' : 'text-[#3d1f0a]'}`}>{stats.warn}</p>
          <p className="text-[10px] text-[#8b5e3c] mt-0.5">Sắp hết hạn (≤{DAYS_WARN}d)</p>
        </div>
        <div className={`rounded-xl p-3 border text-center ${stats.expired > 0 ? 'bg-red-50 border-red-200' : 'bg-[#fffaf4] border-[#f5e6cc]'}`}>
          <p className={`text-2xl font-bold ${stats.expired > 0 ? 'text-red-600' : 'text-[#3d1f0a]'}`}>{stats.expired}</p>
          <p className="text-[10px] text-[#8b5e3c] mt-0.5">Đã hết hạn</p>
        </div>
      </div>

      {/* ── 2 panel cảnh báo (luôn hiển thị) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Panel 1: Hạn sử dụng */}
        <div className={`rounded-2xl border p-4 ${expiredList.length > 0 ? 'bg-red-50 border-red-200' : warnList.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-[#fffaf4] border-[#f5e6cc]'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🗓</span>
              <div>
                <p className="text-xs font-semibold text-[#3d1f0a]">Hạn sử dụng lô hàng</p>
                <p className="text-[10px] text-[#8b5e3c]">
                  {expiredList.length > 0
                    ? <span className="text-red-600 font-medium">{expiredList.length} lô hết hạn</span>
                    : warnList.length > 0
                    ? <span className="text-amber-600 font-medium">{warnList.length} lô sắp hết hạn</span>
                    : <span className="text-emerald-600">Tất cả trong hạn ✓</span>}
                  {expiredList.length > 0 && warnList.length > 0 && (
                    <span className="text-amber-600 font-medium"> · {warnList.length} sắp hết</span>
                  )}
                </p>
              </div>
            </div>
            {(expiredList.length > 0 || warnList.length > 0) && (
              <button
                onClick={sendAlerts}
                disabled={alertSending}
                className="text-xs font-medium text-[#8b5e3c] border border-[#e8ddd0] bg-white px-2.5 py-1 rounded-lg hover:border-[#c8773a] hover:text-[#c8773a] transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {alertSending ? '📤...' : '🔔 Cảnh báo'}
              </button>
            )}
          </div>

          {expiredList.length === 0 && warnList.length === 0 ? (
            <p className="text-xs text-[#8b5e3c] text-center py-3">Không có lô nào cần cảnh báo</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {expiredList.map(b => (
                <div key={b.id} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 border border-red-200">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#3d1f0a] truncate">{b.product_name}</p>
                    <p className="text-[10px] text-red-500">
                      {b.inv_code} · HSD {fmtDate(b.exp_date ?? '')} · quá {Math.abs(daysUntil(b.exp_date)!)}d
                    </p>
                  </div>
                  <span className="text-[10px] text-red-600 font-semibold shrink-0 ml-2">
                    {fmtNum(b.remaining_qty)} {b.unit}
                  </span>
                </div>
              ))}
              {warnList.map(b => {
                const d = daysUntil(b.exp_date)
                return (
                  <div key={b.id} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 border border-amber-200">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#3d1f0a] truncate">{b.product_name}</p>
                      <p className="text-[10px] text-amber-600">
                        {b.inv_code} · HSD {fmtDate(b.exp_date ?? '')} · còn {d}d
                      </p>
                    </div>
                    <span className="text-[10px] text-amber-700 font-semibold shrink-0 ml-2">
                      {fmtNum(b.remaining_qty)} {b.unit}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Panel 2: Tồn kho sản phẩm */}
        <div className={`rounded-2xl border p-4 ${outOfStockList.length > 0 ? 'bg-red-50 border-red-200' : lowStockList.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-[#fffaf4] border-[#f5e6cc]'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">📦</span>
              <div>
                <p className="text-xs font-semibold text-[#3d1f0a]">Tồn kho sản phẩm</p>
                <p className="text-[10px] text-[#8b5e3c]">
                  {outOfStockList.length > 0
                    ? <span className="text-red-600 font-medium">{outOfStockList.length} SP hết hàng</span>
                    : lowStockList.length > 0
                    ? <span className="text-amber-600 font-medium">{lowStockList.length} SP dưới mức tối thiểu</span>
                    : <span className="text-emerald-600">Tất cả đủ hàng ✓</span>}
                  {outOfStockList.length > 0 && lowStockList.length > 0 && (
                    <span className="text-amber-600 font-medium"> · {lowStockList.length} sắp hết</span>
                  )}
                </p>
              </div>
            </div>
            {(outOfStockList.length > 0 || lowStockList.length > 0) && (
              <button
                onClick={sendAlerts}
                disabled={alertSending}
                className="text-xs font-medium text-[#8b5e3c] border border-[#e8ddd0] bg-white px-2.5 py-1 rounded-lg hover:border-[#c8773a] hover:text-[#c8773a] transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {alertSending ? '📤...' : '🔔 Cảnh báo'}
              </button>
            )}
          </div>

          {outOfStockList.length === 0 && lowStockList.length === 0 ? (
            <p className="text-xs text-[#8b5e3c] text-center py-3">Không có sản phẩm nào cần nhập thêm</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {outOfStockList.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 border border-red-200">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#3d1f0a] truncate">{p.name}</p>
                    <p className="text-[10px] text-red-500">{p.category}{p.supplier ? ` · ${p.supplier}` : ''}</p>
                  </div>
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-semibold shrink-0 ml-2">
                    Hết hàng
                  </span>
                </div>
              ))}
              {lowStockList.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 border border-amber-200">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#3d1f0a] truncate">{p.name}</p>
                    <p className="text-[10px] text-amber-600">{p.category}{p.supplier ? ` · ${p.supplier}` : ''}</p>
                  </div>
                  <span className="text-[10px] text-amber-700 font-semibold shrink-0 ml-2">
                    {fmtNum(p.stock_qty)}/{p.min_stock} {p.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Nút gửi email tổng nếu có bất kỳ cảnh báo ── */}
      {hasAlerts && (
        <div className="flex justify-end mb-4">
          <button
            onClick={sendAlerts}
            disabled={alertSending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-gradient-to-br from-[#c8773a] to-[#e8a44a] text-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            {alertSending ? '📤 Đang gửi...' : '🔔 Gửi email cảnh báo'}
          </button>
        </div>
      )}

      {/* ── Bảng lô hàng ── */}
      <div className="bg-[#fffaf4] rounded-2xl p-4 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <div className="flex gap-3 items-center mb-3 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Tìm sản phẩm / mã lô..."
            className="flex-1 min-w-[160px] px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
          />
          <label className="flex items-center gap-1.5 text-xs text-[#8b5e3c] cursor-pointer select-none">
            <input type="checkbox" checked={showEmpty} onChange={e => setShowEmpty(e.target.checked)} className="rounded" />
            Hiện lô đã hết
          </label>
          <button
            onClick={loadBatches}
            className="px-3 py-2 text-xs text-[#8b5e3c] border border-[#f5e6cc] rounded-lg bg-white hover:border-[#c8773a] hover:text-[#c8773a] transition-all cursor-pointer"
          >
            ↻ Tải lại
          </button>
        </div>

        {dbError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-1">
            <p className="font-semibold">⚠ Không thể tải dữ liệu lô hàng</p>
            <p className="text-red-600 font-mono">{dbError}</p>
            <p className="text-red-500 pt-1">
              👉 Hãy chạy file <code className="bg-red-100 px-1 rounded">supabase/migration_batches.sql</code> trong <b>Supabase Dashboard → SQL Editor</b>.
            </p>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-[#8b5e3c] text-center py-6">Đang tải...</p>
        ) : dbError ? null : filtered.length === 0 ? (
          <p className="text-sm text-[#8b5e3c] text-center py-6">
            {batches.length === 0 ? 'Chưa có lô hàng nào. Tạo hoá đơn nhập để tự động tạo lô.' : 'Không tìm thấy lô phù hợp.'}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#f0e8d8]">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[#f5e6cc]">
                  <th className="text-left text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-2">Sản phẩm</th>
                  <th className="text-left text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-2">Mã lô</th>
                  <th className="text-left text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-2">Ngày nhập</th>
                  <th className="text-right text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-2">Giá nhập</th>
                  <th className="text-right text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-2">Nhập</th>
                  <th className="text-right text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-2">Còn lại</th>
                  <th className="text-left text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-2">HSD</th>
                  <th className="text-left text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const status = getBatchStatus(b)
                  const consumed = pct(b)
                  const days = daysUntil(b.exp_date)
                  return (
                    <tr key={b.id} className={`border-b border-[#f0e8d8] ${status === 'expired' ? 'bg-red-50' : status === 'warn' ? 'bg-amber-50' : status === 'empty' ? 'bg-gray-50 opacity-60' : 'bg-white'}`}>
                      <td className="px-2 py-2 font-medium text-[#3d1f0a]">{b.product_name}</td>
                      <td className="px-2 py-2 text-[#8b5e3c]">{b.inv_code}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-[#8b5e3c]">{fmtDate(b.inv_date)}</td>
                      <td className="px-2 py-2 text-right text-[#8b5e3c]">{b.price > 0 ? fmtPrice(b.price) : '—'}</td>
                      <td className="px-2 py-2 text-right text-[#8b5e3c]">{fmtNum(b.quantity)} {b.unit}</td>
                      <td className="px-2 py-2 text-right">
                        <span className={`font-semibold ${b.remaining_qty <= 0 ? 'text-gray-400' : 'text-[#3d1f0a]'}`}>
                          {fmtNum(b.remaining_qty)} {b.unit}
                        </span>
                        <div className="mt-0.5 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${consumed >= 100 ? 'bg-gray-400' : consumed >= 80 ? 'bg-amber-400' : 'bg-green-400'}`}
                            style={{ width: `${consumed}%` }}
                          />
                        </div>
                      </td>
                      <td className={`px-2 py-2 whitespace-nowrap ${status === 'expired' ? 'text-red-600 font-semibold' : status === 'warn' ? 'text-amber-700 font-semibold' : 'text-[#8b5e3c]'}`}>
                        {b.exp_date ? (
                          <>
                            {fmtDate(b.exp_date)}
                            {days !== null && (
                              <span className="ml-1 text-[9px]">
                                {days < 0 ? `(quá ${Math.abs(days)}d)` : days === 0 ? '(hôm nay!)' : `(còn ${days}d)`}
                              </span>
                            )}
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-2 py-2">
                        {status === 'expired' && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-medium">Hết hạn</span>}
                        {status === 'warn'    && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-medium">Sắp HH</span>}
                        {status === 'empty'   && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-medium">Đã dùng hết</span>}
                        {status === 'ok'      && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-medium">Còn hàng</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
