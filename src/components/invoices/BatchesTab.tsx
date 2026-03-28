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

export default function BatchesTab() {
  const { sb } = useApp()
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showEmpty, setShowEmpty] = useState(false)

  useEffect(() => {
    loadBatches()
  }, [])

  const loadBatches = async () => {
    setLoading(true)
    setDbError(null)
    const { data, error } = await sb
      .from('batches')
      .select('*')
      .order('product_name', { ascending: true })
      .order('inv_date', { ascending: true })
      .order('id', { ascending: true })
    if (error) {
      setDbError(error.message)
    } else {
      setBatches((data || []) as Batch[])
    }
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return batches.filter(b => {
      if (!showEmpty && b.remaining_qty <= 0) return false
      if (search && !b.product_name.toLowerCase().includes(search.toLowerCase())
        && !b.inv_code.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [batches, search, showEmpty])

  // stats
  const stats = useMemo(() => {
    const active = batches.filter(b => b.remaining_qty > 0)
    const expiredCount = active.filter(b => {
      const d = daysUntil(b.exp_date)
      return d !== null && d < 0
    }).length
    const warnCount = active.filter(b => {
      const d = daysUntil(b.exp_date)
      return d !== null && d >= 0 && d <= DAYS_WARN
    }).length
    return { total: active.length, expired: expiredCount, warn: warnCount }
  }, [batches])

  const getBatchStatus = (b: Batch): 'expired' | 'warn' | 'ok' | 'empty' => {
    if (b.remaining_qty <= 0) return 'empty'
    const d = daysUntil(b.exp_date)
    if (d === null) return 'ok'
    if (d < 0) return 'expired'
    if (d <= DAYS_WARN) return 'warn'
    return 'ok'
  }

  const pct = (b: Batch) => b.quantity > 0 ? Math.round(((b.quantity - b.remaining_qty) / b.quantity) * 100) : 100

  return (
    <div>
      {/* Stats */}
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

      {/* Filter row */}
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

        {/* Lỗi bảng chưa tạo hoặc RLS */}
        {dbError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-1">
            <p className="font-semibold">⚠ Không thể tải dữ liệu lô hàng</p>
            <p className="text-red-600 font-mono">{dbError}</p>
            <p className="text-red-500 pt-1">
              👉 Hãy chạy file <code className="bg-red-100 px-1 rounded">supabase/migration_batches.sql</code> trong <b>Supabase Dashboard → SQL Editor</b> để tạo bảng <code className="bg-red-100 px-1 rounded">batches</code> và <code className="bg-red-100 px-1 rounded">batch_deductions</code>.
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
                        {/* mini progress bar */}
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
                        {status === 'warn' && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-medium">Sắp HH</span>}
                        {status === 'empty' && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-medium">Đã dùng hết</span>}
                        {status === 'ok' && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-medium">Còn hàng</span>}
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
