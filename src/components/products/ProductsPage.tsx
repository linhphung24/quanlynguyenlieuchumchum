'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Product } from '@/types'
import { UNITS } from '@/lib/constants'
import { fmtPrice } from '@/lib/utils'

const CATEGORIES = ['Nguyên liệu', 'Vật liệu', 'Thành phẩm', 'Bao bì', 'Khác']

const CAT_COLORS: Record<string, string> = {
  'Nguyên liệu': 'bg-blue-100 text-blue-700',
  'Vật liệu':    'bg-orange-100 text-orange-700',
  'Thành phẩm':  'bg-green-100 text-green-700',
  'Bao bì':      'bg-purple-100 text-purple-700',
  'Khác':        'bg-gray-100 text-gray-600',
}

function stockPct(p: Product): number {
  if (!p.min_stock) return 100
  return Math.min(100, Math.round((p.stock_qty / p.min_stock) * 100))
}

function stockColor(p: Product): string {
  if (!p.min_stock) return 'bg-gray-200'
  const pct = stockPct(p)
  if (pct >= 100) return 'bg-emerald-400'
  if (pct >= 50)  return 'bg-amber-400'
  return 'bg-red-400'
}

function stockLabel(p: Product): { text: string; cls: string } {
  if (!p.min_stock)              return { text: 'Chưa đặt tối thiểu', cls: 'text-gray-400' }
  if (p.stock_qty >= p.min_stock) return { text: 'Đủ hàng',           cls: 'text-emerald-600' }
  if (p.stock_qty > 0)            return { text: 'Sắp hết',           cls: 'text-amber-600' }
  return { text: 'Hết hàng', cls: 'text-red-600' }
}

const emptyProduct = (): Partial<Product> => ({
  code: '', name: '', category: CATEGORIES[0], unit: UNITS[0],
  cost_price: 0, sell_price: 0, stock_qty: 0, min_stock: 0,
  supplier: '', description: '', is_active: true,
})

export default function ProductsPage() {
  const { sb, user, allProducts, setAllProducts, allUnits, toast, startLoading, stopLoading, writeAudit } = useApp()

  const [view, setView] = useState<'card' | 'table'>('card')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [editing, setEditing] = useState<Partial<Product> | null>(null)
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create')
  const [showForm, setShowForm] = useState(false)
  const [alertSending, setAlertSending] = useState(false)

  const sendAlerts = async () => {
    setAlertSending(true)
    try {
      const res = await fetch('/api/alerts', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || 'Lỗi gửi cảnh báo', 'error')
      } else if (!json.sent) {
        toast('Tồn kho ổn định — không có cảnh báo nào cần gửi', 'info')
      } else {
        toast(`Đã gửi email: ${json.lowStockCount} SP thấp, ${json.expiringCount} lô sắp hết hạn`)
      }
    } catch {
      toast('Không kết nối được API cảnh báo', 'error')
    }
    setAlertSending(false)
  }

  const filtered = useMemo(() => allProducts.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.code ?? '').toLowerCase().includes(search.toLowerCase())) return false
    if (filterCat && p.category !== filterCat) return false
    if (filterActive === 'active'   && !p.is_active) return false
    if (filterActive === 'inactive' && p.is_active)  return false
    return true
  }), [allProducts, search, filterCat, filterActive])

  const stats = useMemo(() => ({
    total:      allProducts.length,
    active:     allProducts.filter(p => p.is_active).length,
    lowStock:   allProducts.filter(p => p.is_active && p.min_stock > 0 && p.stock_qty < p.min_stock).length,
    totalValue: allProducts.reduce((s, p) => s + (p.stock_qty || 0) * (p.cost_price || 0), 0),
  }), [allProducts])

  const lowStockList = useMemo(() =>
    allProducts.filter(p => p.is_active && p.min_stock > 0 && p.stock_qty < p.min_stock),
    [allProducts])

  const openCreate = () => { setEditing(emptyProduct()); setEditMode('create'); setShowForm(true) }
  const openEdit   = (p: Product) => { setEditing({ ...p }); setEditMode('edit'); setShowForm(true) }

  const handleSave = async () => {
    if (!user) { toast('Chưa đăng nhập — vui lòng tải lại trang', 'error'); return }
    if (!editing) return
    if (!editing.name?.trim()) { toast('Tên sản phẩm không được trống', 'error'); return }

    // ⚠ Không cho user sửa stock_qty / cost_price từ form này — 2 field
    // được quản lý bởi HĐ nhập/xuất. Sửa tay sẽ phá Summary (tồn đầu âm).
    const payload = { ...editing, code: editing.code?.trim() || null }
    startLoading()
    try {
      if (editMode === 'create') {
        // Tạo mới: stock_qty và cost_price BẮT BUỘC = 0
        // (sẽ tự cập nhật khi có HĐ nhập đầu tiên)
        const createPayload = { ...payload, stock_qty: 0, cost_price: 0 }
        const { data, error } = await sb.from('products').insert({
          ...createPayload, created_by: user.id, created_at: new Date().toISOString(),
        }).select().single()
        if (!error && data) {
          await writeAudit('create', 'products', String(data.id), `Tạo sản phẩm: ${editing.name}`)
          setAllProducts(prev => [...prev, data as Product].sort((a, b) => a.name.localeCompare(b.name)))
          toast('Đã tạo sản phẩm'); setShowForm(false)
        } else if (error) {
          toast('Lỗi tạo: ' + error.message, 'error')
        } else {
          toast('Không thể tạo sản phẩm — kiểm tra quyền truy cập', 'error')
        }
      } else {
        // Cập nhật: STRIP stock_qty và cost_price khỏi payload — không bao giờ
        // ghi đè 2 field này từ ProductsPage (chỉ HĐ mới được phép động vào).
        const { stock_qty: _ignoreStock, cost_price: _ignoreCost, ...safePayload } = payload
        void _ignoreStock; void _ignoreCost
        const { data: updated, error } = await sb.from('products').update({
          ...safePayload, updated_by: user.id, updated_at: new Date().toISOString(),
        }).eq('id', editing.id!).select().single()
        if (error) {
          toast('Lỗi cập nhật: ' + error.message, 'error')
        } else if (!updated) {
          toast('Không thể cập nhật — kiểm tra quyền truy cập trong Supabase', 'error')
        } else {
          await writeAudit('update', 'products', String(editing.id), `Cập nhật: ${editing.name}`)
          setAllProducts(prev => prev.map(p => p.id === editing.id ? { ...p, ...updated } as Product : p))
          toast('Đã cập nhật'); setShowForm(false)
        }
      }
    } catch (e) {
      toast('Lỗi: ' + (e as Error).message, 'error')
    } finally {
      stopLoading()
    }
  }

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Xoá sản phẩm "${p.name}"?`)) return
    startLoading()
    try {
      const { error } = await sb.from('products').delete().eq('id', p.id)
      if (!error) {
        await writeAudit('delete', 'products', String(p.id), `Xoá: ${p.name}`)
        setAllProducts(prev => prev.filter(x => x.id !== p.id))
        toast('Đã xoá sản phẩm')
      } else {
        toast('Lỗi xoá: ' + error.message, 'error')
      }
    } catch (e) {
      toast('Lỗi: ' + (e as Error).message, 'error')
    } finally {
      stopLoading()
    }
  }

  const handleToggleActive = async (p: Product) => {
    const { error } = await sb.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
    if (!error) setAllProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
  }

  // ─── render ───────────────────────────────────────────────
  return (
    <div className="p-5 max-w-7xl mx-auto">

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Total */}
        <div className="bg-white rounded-2xl p-4 border border-[#e8ddd0] shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 text-base">▦</div>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Tổng SP</span>
          </div>
          <div className="text-3xl font-bold text-[#1a0f07]">{stats.total}</div>
          <div className="text-xs text-gray-400 mt-0.5">{stats.active} đang hoạt động</div>
        </div>

        {/* Low stock */}
        <div className={`bg-white rounded-2xl p-4 border shadow-sm ${stats.lowStock > 0 ? 'border-red-200' : 'border-[#e8ddd0]'}`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${stats.lowStock > 0 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>⚠</div>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Cần nhập</span>
          </div>
          <div className={`text-3xl font-bold ${stats.lowStock > 0 ? 'text-red-600' : 'text-[#1a0f07]'}`}>{stats.lowStock}</div>
          <div className="text-xs text-gray-400 mt-0.5">Dưới mức tối thiểu</div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl p-4 border border-[#e8ddd0] shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 text-base">◈</div>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Danh mục</span>
          </div>
          <div className="text-3xl font-bold text-[#1a0f07]">{new Set(allProducts.map(p => p.category)).size}</div>
          <div className="text-xs text-gray-400 mt-0.5">Loại hàng hoá</div>
        </div>

        {/* Total value */}
        <div className="bg-gradient-to-br from-[#c8773a] to-[#e8a44a] rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white text-base">$</div>
            <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider">Trị giá kho</span>
          </div>
          <div className="text-2xl font-bold text-white leading-tight">
            {new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(stats.totalValue)}
            <span className="text-sm font-normal ml-0.5">đ</span>
          </div>
          <div className="text-xs text-white/60 mt-0.5">Theo giá vốn</div>
        </div>
      </div>

      {/* ── Low stock alert banner ── */}
      {lowStockList.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm font-semibold text-red-800">{lowStockList.length} sản phẩm dưới mức tối thiểu</p>
            </div>
            <button
              onClick={sendAlerts}
              disabled={alertSending}
              className="text-xs font-medium text-red-700 border border-red-300 bg-white px-3 py-1 rounded-lg hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50"
            >
              {alertSending ? '📤 Đang gửi...' : '🔔 Gửi cảnh báo'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockList.slice(0, 8).map(p => (
              <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-red-200 rounded-lg text-xs text-red-700">
                {p.name}
                <span className="text-red-400">({p.stock_qty}/{p.min_stock} {p.unit})</span>
              </span>
            ))}
            {lowStockList.length > 8 && (
              <span className="text-xs text-red-500 self-center">+{lowStockList.length - 8} SP khác</span>
            )}
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-2xl border border-[#e8ddd0] px-4 py-3 mb-4 flex gap-3 items-center flex-wrap shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên hoặc mã sản phẩm..."
            className="w-full pl-8 pr-3 py-2 border border-[#e8ddd0] rounded-xl text-sm bg-[#fafaf8] text-[#1a0f07] outline-none focus:border-[#c8773a] focus:bg-white transition-all"
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 border border-[#e8ddd0] rounded-xl text-sm bg-[#fafaf8] text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-all appearance-none cursor-pointer"
        >
          <option value="">Tất cả danh mục</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Status filter */}
        <select
          value={filterActive}
          onChange={e => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-3 py-2 border border-[#e8ddd0] rounded-xl text-sm bg-[#fafaf8] text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-all appearance-none cursor-pointer"
        >
          <option value="all">Tất cả</option>
          <option value="active">Đang dùng</option>
          <option value="inactive">Ngừng</option>
        </select>

        {/* View toggle */}
        <div className="flex bg-[#f2ece3] rounded-xl p-0.5 gap-0.5">
          <button onClick={() => setView('card')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${view === 'card' ? 'bg-white text-[#c8773a] shadow-sm' : 'text-[#8b5e3c] hover:text-[#c8773a]'}`}>⊞ Thẻ</button>
          <button onClick={() => setView('table')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${view === 'table' ? 'bg-white text-[#c8773a] shadow-sm' : 'text-[#8b5e3c] hover:text-[#c8773a]'}`}>☰ Bảng</button>
        </div>

        {/* Add button */}
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1a0f07] text-white text-xs font-medium cursor-pointer hover:bg-[#2d1810] transition-all shadow-sm"
        >
          + Thêm sản phẩm
        </button>
      </div>

      {/* ── Product list ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#e8ddd0]">
          <div className="text-5xl mb-3 opacity-30">▦</div>
          <p className="text-sm text-gray-400">Không tìm thấy sản phẩm nào</p>
        </div>
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(p => {
            const pct = stockPct(p)
            const bar = stockColor(p)
            const lbl = stockLabel(p)
            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border p-4 cursor-pointer group hover:shadow-md hover:-translate-y-0.5 transition-all relative ${
                  p.is_active && p.min_stock > 0 && p.stock_qty < p.min_stock
                    ? 'border-red-200'
                    : 'border-[#e8ddd0] hover:border-[#c8773a]/40'
                }`}
                onClick={() => openEdit(p)}
              >
                {/* Status badge top-right */}
                <div className="absolute top-3 right-3">
                  {!p.is_active ? (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-full">Ngừng</span>
                  ) : p.min_stock > 0 && p.stock_qty < p.min_stock ? (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-medium rounded-full">Cần nhập</span>
                  ) : null}
                </div>

                {/* Product info */}
                <div className="mb-3 pr-16">
                  <div className="font-semibold text-[#1a0f07] text-sm leading-tight mb-0.5">{p.name}</div>
                  {p.code && <div className="text-[10px] text-gray-400 font-mono">{p.code}</div>}
                </div>

                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${CAT_COLORS[p.category] || 'bg-gray-100 text-gray-600'}`}>
                    {p.category}
                  </span>
                  {p.supplier && (
                    <span className="text-[10px] text-gray-400 truncate max-w-[120px]" title={p.supplier}>🏭 {p.supplier}</span>
                  )}
                </div>

                {/* Stock info */}
                <div className="mb-2">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] text-gray-400">Tồn kho</span>
                    <span className="text-xs font-semibold text-[#1a0f07]">{p.stock_qty} <span className="text-gray-400 font-normal">{p.unit}</span></span>
                  </div>
                  {p.min_stock > 0 && (
                    <>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className={`text-[9px] font-medium ${lbl.cls}`}>{lbl.text}</span>
                        <span className="text-[9px] text-gray-400">Tối thiểu: {p.min_stock}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Price row */}
                {(p.cost_price > 0 || p.sell_price > 0) && (
                  <div className="pt-2 border-t border-[#f0ebe4] flex gap-3 text-[10px] text-gray-400">
                    {p.cost_price > 0 && <span>Nhập: <b className="text-[#8b5e3c]">{fmtPrice(p.cost_price)}</b></span>}
                    {p.sell_price > 0 && <span>Bán: <b className="text-[#3aaa6e]">{fmtPrice(p.sell_price)}</b></span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Table view */
        <div className="bg-white rounded-2xl border border-[#e8ddd0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#f0ebe4]">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-4 py-3 bg-[#fafaf8]">Sản phẩm</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-4 py-3 bg-[#fafaf8]">Danh mục</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-4 py-3 bg-[#fafaf8]">Nhà CC</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-4 py-3 bg-[#fafaf8]">ĐVT</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-4 py-3 bg-[#fafaf8]">Tồn</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-4 py-3 bg-[#fafaf8] w-36">Mức kho</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-4 py-3 bg-[#fafaf8]">Giá vốn</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-4 py-3 bg-[#fafaf8]">Trạng thái</th>
                  <th className="bg-[#fafaf8] w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const pct = stockPct(p)
                  const bar = stockColor(p)
                  return (
                    <tr key={p.id} className="border-b border-[#f0ebe4] hover:bg-[#fdf8f3] transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1a0f07]">{p.name}</div>
                        {p.code && <div className="text-[10px] text-gray-400 font-mono">{p.code}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CAT_COLORS[p.category] || 'bg-gray-100 text-gray-600'}`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate" title={p.supplier || ''}>
                        {p.supplier || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.unit}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${p.is_active && p.min_stock > 0 && p.stock_qty < p.min_stock ? 'text-red-600' : 'text-[#1a0f07]'}`}>
                        {p.stock_qty}
                      </td>
                      <td className="px-4 py-3">
                        {p.min_stock > 0 ? (
                          <div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-0.5">
                              <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                            </div>
                            <div className="text-[9px] text-gray-400">{p.stock_qty} / {p.min_stock}</div>
                          </div>
                        ) : <span className="text-[10px] text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500">
                        {p.cost_price > 0 ? fmtPrice(p.cost_price) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.is_active ? 'Hoạt động' : 'Ngừng'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg border border-[#e8ddd0] text-gray-400 hover:text-[#c8773a] hover:border-[#c8773a] transition-all cursor-pointer text-xs">✏</button>
                          <button onClick={() => handleToggleActive(p)} className="p-1.5 rounded-lg border border-[#e8ddd0] text-gray-400 hover:text-[#c8773a] hover:border-[#c8773a] transition-all cursor-pointer text-xs">{p.is_active ? '⏸' : '▶'}</button>
                          <button onClick={() => handleDelete(p)} className="p-1.5 rounded-lg border border-[#e8ddd0] text-gray-400 hover:text-red-500 hover:border-red-300 transition-all cursor-pointer text-xs">✕</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-[#f0ebe4] bg-[#fafaf8]">
            <span className="text-[10px] text-gray-400">{filtered.length} sản phẩm</span>
          </div>
        </div>
      )}

      {/* ── Slide-over form panel ── */}
      {showForm && editing && (
        <div className="fixed inset-0 z-50 flex">
          {/* backdrop */}
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          {/* panel */}
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col animate-fade-in">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ebe4] sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-sm font-semibold text-[#1a0f07]">
                  {editMode === 'create' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {editMode === 'create' ? 'Điền thông tin sản phẩm bên dưới' : editing.name}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer transition-all text-sm">✕</button>
            </div>

            {/* Form body */}
            <div className="flex-1 px-5 py-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-[#3d1f0a] mb-1.5">Tên sản phẩm <span className="text-red-500">*</span></label>
                <input
                  value={editing.name || ''}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  onBlur={e => setEditing({ ...editing, name: e.target.value.trim() })}
                  placeholder="Ví dụ: Bột mì số 11..."
                  className="w-full px-3 py-2.5 border border-[#e8ddd0] rounded-xl text-sm bg-[#fafaf8] text-[#1a0f07] outline-none focus:border-[#c8773a] focus:bg-white transition-all"
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-xs font-medium text-[#3d1f0a] mb-1.5">Mã sản phẩm</label>
                <input
                  value={editing.code || ''}
                  onChange={e => setEditing({ ...editing, code: e.target.value })}
                  onBlur={e => setEditing({ ...editing, code: e.target.value.trim() })}
                  placeholder="SKU / Mã kho..."
                  className="w-full px-3 py-2.5 border border-[#e8ddd0] rounded-xl text-sm bg-[#fafaf8] text-[#1a0f07] outline-none focus:border-[#c8773a] focus:bg-white transition-all font-mono"
                />
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-xs font-medium text-[#3d1f0a] mb-1.5">Nhà cung cấp</label>
                <input
                  value={editing.supplier || ''}
                  onChange={e => setEditing({ ...editing, supplier: e.target.value })}
                  onBlur={e => setEditing({ ...editing, supplier: e.target.value.trim() })}
                  placeholder="Tên nhà cung cấp..."
                  className="w-full px-3 py-2.5 border border-[#e8ddd0] rounded-xl text-sm bg-[#fafaf8] text-[#1a0f07] outline-none focus:border-[#c8773a] focus:bg-white transition-all"
                />
              </div>

              {/* Category + Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#3d1f0a] mb-1.5">Danh mục</label>
                  <select
                    value={editing.category || CATEGORIES[0]}
                    onChange={e => setEditing({ ...editing, category: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#e8ddd0] rounded-xl text-sm bg-[#fafaf8] text-[#1a0f07] outline-none focus:border-[#c8773a] transition-all appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#3d1f0a] mb-1.5">Đơn vị tính</label>
                  <select
                    value={editing.unit || allUnits[0] || UNITS[0]}
                    onChange={e => setEditing({ ...editing, unit: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#e8ddd0] rounded-xl text-sm bg-[#fafaf8] text-[#1a0f07] outline-none focus:border-[#c8773a] transition-all appearance-none cursor-pointer"
                  >
                    {allUnits.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Stock */}
              <div className="bg-[#fafaf8] rounded-xl border border-[#e8ddd0] p-3 space-y-3">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tồn kho</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Số lượng hiện tại — READ-ONLY (chỉ HĐ nhập/xuất mới sửa được) */}
                  <div>
                    <label className="block text-xs font-medium text-[#3d1f0a] mb-1.5">
                      Số lượng hiện tại
                      <span className="ml-1 text-gray-400 font-normal">🔒</span>
                    </label>
                    <div className="w-full px-3 py-2.5 border border-[#e8ddd0] rounded-xl text-sm bg-gray-100 text-gray-600 cursor-not-allowed select-none">
                      {editing.stock_qty ?? 0} {editing.unit || ''}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 leading-snug">
                      Tự động cập nhật từ HĐ nhập / xuất
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#3d1f0a] mb-1.5">Mức tối thiểu</label>
                    <input
                      type="number" min={0} step="any"
                      value={editing.min_stock || 0}
                      onChange={e => setEditing({ ...editing, min_stock: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-[#e8ddd0] rounded-xl text-sm bg-white text-[#1a0f07] outline-none focus:border-[#c8773a] transition-all"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 leading-snug">Cảnh báo khi tồn dưới mức này</p>
                  </div>
                </div>
              </div>

              {/* Prices */}
              <div className="bg-[#fafaf8] rounded-xl border border-[#e8ddd0] p-3 space-y-3">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Giá</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Giá vốn — READ-ONLY (lấy từ HĐ nhập gần nhất) */}
                  <div>
                    <label className="block text-xs font-medium text-[#3d1f0a] mb-1.5">
                      Giá vốn (nhập)
                      <span className="ml-1 text-gray-400 font-normal">🔒</span>
                    </label>
                    <div className="w-full px-3 py-2.5 border border-[#e8ddd0] rounded-xl text-sm bg-gray-100 text-gray-600 cursor-not-allowed select-none">
                      {editing.cost_price ? fmtPrice(editing.cost_price) : '—'}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 leading-snug">
                      Tự động cập nhật từ HĐ nhập gần nhất
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#3d1f0a] mb-1.5">Giá bán</label>
                    <input
                      type="number" min={0}
                      value={editing.sell_price || 0}
                      onChange={e => setEditing({ ...editing, sell_price: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-[#e8ddd0] rounded-xl text-sm bg-white text-[#1a0f07] outline-none focus:border-[#c8773a] transition-all"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 leading-snug">Giá bán cho khách (tham khảo)</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[#3d1f0a] mb-1.5">Mô tả</label>
                <textarea
                  value={editing.description || ''}
                  onChange={e => setEditing({ ...editing, description: e.target.value })}
                  onBlur={e => setEditing({ ...editing, description: e.target.value.trim() })}
                  rows={2} placeholder="Mô tả ngắn..."
                  className="w-full px-3 py-2.5 border border-[#e8ddd0] rounded-xl text-sm bg-[#fafaf8] text-[#1a0f07] outline-none focus:border-[#c8773a] focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none p-3 bg-[#fafaf8] rounded-xl border border-[#e8ddd0]">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={editing.is_active ?? true}
                    onChange={e => setEditing({ ...editing, is_active: e.target.checked })}
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${editing.is_active ? 'bg-[#c8773a]' : 'bg-gray-300'}`} />
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editing.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <div>
                  <div className="text-xs font-medium text-[#1a0f07]">Đang hoạt động</div>
                  <div className="text-[10px] text-gray-400">Hiển thị trong danh sách và hoá đơn</div>
                </div>
              </label>
            </div>

            {/* Panel footer */}
            <div className="px-5 py-4 border-t border-[#f0ebe4] flex gap-2 sticky bottom-0 bg-white">
              {editMode === 'edit' && (
                <button
                  onClick={() => { if (editing.id) handleDelete({ ...editing } as Product); setShowForm(false) }}
                  className="px-3 py-2.5 rounded-xl border border-red-200 text-red-500 text-xs font-medium cursor-pointer hover:bg-red-50 transition-all"
                >
                  Xoá
                </button>
              )}
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#e8ddd0] text-[#8b5e3c] text-sm font-medium cursor-pointer hover:border-[#c8773a] hover:text-[#c8773a] transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-[#1a0f07] text-white text-sm font-medium cursor-pointer hover:bg-[#2d1810] transition-all shadow-sm"
              >
                {editMode === 'create' ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
