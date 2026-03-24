'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Product } from '@/types'
import { UNITS } from '@/lib/constants'
import { fmtPrice, fmtTs } from '@/lib/utils'

const CATEGORIES = ['Nguyên liệu', 'Thành phẩm', 'Bao bì', 'Khác']

const emptyProduct = (): Partial<Product> => ({
  code: '',
  name: '',
  category: CATEGORIES[0],
  unit: UNITS[0],
  cost_price: 0,
  sell_price: 0,
  stock_qty: 0,
  min_stock: 0,
  description: '',
  is_active: true,
})

export default function ProductsPage() {
  const { sb, user, allProducts, setAllProducts, toast, startLoading, stopLoading, writeAudit } = useApp()

  const [view, setView] = useState<'card' | 'table'>('card')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [editing, setEditing] = useState<Partial<Product> | null>(null)
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create')
  const [showForm, setShowForm] = useState(false)

  const filtered = allProducts.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.code.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCat && p.category !== filterCat) return false
    if (filterActive === 'active' && !p.is_active) return false
    if (filterActive === 'inactive' && p.is_active) return false
    return true
  })

  const stats = {
    total: allProducts.length,
    active: allProducts.filter(p => p.is_active).length,
    lowStock: allProducts.filter(p => p.is_active && p.stock_qty < p.min_stock).length,
    categories: new Set(allProducts.map(p => p.category)).size,
  }

  const openCreate = () => {
    setEditing(emptyProduct())
    setEditMode('create')
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditing({ ...p })
    setEditMode('edit')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!editing || !user) return
    if (!editing.name?.trim()) { toast('Tên sản phẩm không được trống', 'error'); return }
    startLoading()
    if (editMode === 'create') {
      const { data, error } = await sb.from('products').insert({
        ...editing,
        created_by: user.id,
        created_at: new Date().toISOString(),
      }).select().single()
      if (!error && data) {
        await writeAudit('create', 'products', String(data.id), `Tạo sản phẩm: ${editing.name}`)
        setAllProducts(prev => [...prev, data as Product].sort((a, b) => a.name.localeCompare(b.name)))
        toast('Đã tạo sản phẩm')
        setShowForm(false)
      } else if (error) {
        toast('Lỗi tạo: ' + error.message, 'error')
      }
    } else {
      const { error } = await sb.from('products').update({
        ...editing,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }).eq('id', editing.id!)
      if (!error) {
        await writeAudit('update', 'products', String(editing.id), `Cập nhật sản phẩm: ${editing.name}`)
        setAllProducts(prev => prev.map(p => p.id === editing.id ? { ...p, ...editing } as Product : p))
        toast('Đã cập nhật sản phẩm')
        setShowForm(false)
      } else {
        toast('Lỗi cập nhật: ' + error.message, 'error')
      }
    }
    stopLoading()
  }

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Xoá sản phẩm "${p.name}"?`)) return
    startLoading()
    const { error } = await sb.from('products').delete().eq('id', p.id)
    if (!error) {
      await writeAudit('delete', 'products', String(p.id), `Xoá sản phẩm: ${p.name}`)
      setAllProducts(prev => prev.filter(x => x.id !== p.id))
      toast('Đã xoá sản phẩm')
    } else {
      toast('Lỗi xoá: ' + error.message, 'error')
    }
    stopLoading()
  }

  const handleToggleActive = async (p: Product) => {
    const { error } = await sb.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
    if (!error) {
      setAllProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3d1f0a]">📦 Quản lý sản phẩm</h2>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-[#c8773a] to-[#e8a44a] text-white text-xs font-medium cursor-pointer hover:opacity-90 hover:-translate-y-px transition-all">
          + Thêm sản phẩm
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Tổng SP', value: stats.total, icon: '📦', color: 'text-[#3a7fc1]' },
          { label: 'Đang dùng', value: stats.active, icon: '✅', color: 'text-[#3aaa6e]' },
          { label: 'Sắp hết', value: stats.lowStock, icon: '⚠️', color: 'text-[#d94f3d]' },
          { label: 'Danh mục', value: stats.categories, icon: '🏷️', color: 'text-[#c8773a]' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border-[1.5px] border-[#f5e6cc] text-center">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-[#8b5e3c]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#fffaf4] rounded-2xl p-4 mb-4 border border-[#f5e6cc] flex gap-3 flex-wrap items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Tìm kiếm</label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tên hoặc mã sản phẩm..."
            className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Danh mục</label>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none pr-7">
            <option value="">Tất cả</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Trạng thái</label>
          <select value={filterActive} onChange={e => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none pr-7">
            <option value="all">Tất cả</option>
            <option value="active">Đang dùng</option>
            <option value="inactive">Ngừng</option>
          </select>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setView('card')} className={`px-3 py-2.5 rounded-lg text-xs border transition-all cursor-pointer ${view === 'card' ? 'bg-[#c8773a] text-white border-[#c8773a]' : 'bg-white text-[#8b5e3c] border-[#f5e6cc] hover:border-[#c8773a]'}`}>⊞</button>
          <button onClick={() => setView('table')} className={`px-3 py-2.5 rounded-lg text-xs border transition-all cursor-pointer ${view === 'table' ? 'bg-[#c8773a] text-white border-[#c8773a]' : 'bg-white text-[#8b5e3c] border-[#f5e6cc] hover:border-[#c8773a]'}`}>☰</button>
        </div>
      </div>

      {/* Create/Edit form */}
      {showForm && editing && (
        <div className="bg-[#fffaf4] rounded-2xl p-5 mb-4 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)] animate-fadeIn">
          <h3 className="text-sm font-semibold text-[#3d1f0a] mb-3">{editMode === 'create' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Tên sản phẩm *</label>
              <input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Mã sản phẩm</label>
              <input value={editing.code || ''} onChange={e => setEditing({ ...editing, code: e.target.value })}
                className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Danh mục</label>
              <select value={editing.category || CATEGORIES[0]} onChange={e => setEditing({ ...editing, category: e.target.value })}
                className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Đơn vị</label>
              <select value={editing.unit || UNITS[0]} onChange={e => setEditing({ ...editing, unit: e.target.value })}
                className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Tồn kho</label>
              <input type="number" min={0} value={editing.stock_qty || 0} onChange={e => setEditing({ ...editing, stock_qty: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Tồn tối thiểu</label>
              <input type="number" min={0} value={editing.min_stock || 0} onChange={e => setEditing({ ...editing, min_stock: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Mô tả</label>
            <textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors resize-none" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <input type="checkbox" id="is_active" checked={editing.is_active ?? true} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} className="accent-[#c8773a]" />
            <label htmlFor="is_active" className="text-xs text-[#8b5e3c] cursor-pointer">Đang hoạt động</label>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-[#c8773a] to-[#e8a44a] text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-all">
              💾 Lưu
            </button>
            <button onClick={() => setShowForm(false)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border-[1.5px] border-[#f5e6cc] text-[#8b5e3c] text-xs font-medium cursor-pointer hover:border-[#c8773a] hover:text-[#c8773a] transition-all">
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Product list */}
      {filtered.length === 0 ? (
        <div className="bg-[#fffaf4] rounded-2xl p-8 text-center border border-[#f5e6cc]">
          <div className="text-4xl mb-2">📦</div>
          <p className="text-sm text-[#8b5e3c]">Không tìm thấy sản phẩm nào</p>
        </div>
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => openEdit(p)}
              className="bg-white rounded-xl border-[1.5px] border-[#f5e6cc] p-4 cursor-pointer hover:border-[#c8773a] hover:shadow-[0_4px_18px_rgba(200,119,58,0.1)] hover:-translate-y-0.5 transition-all relative overflow-hidden"
            >
              {!p.is_active && (
                <div className="absolute top-2 right-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#f5e6cc] text-[#8b5e3c]">Ngừng</span>
                </div>
              )}
              {p.is_active && p.stock_qty < p.min_stock && (
                <div className="absolute top-2 right-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#fde8e5] text-[#c0392b]">⚠ Sắp hết</span>
                </div>
              )}
              <div className="font-medium text-[#3d1f0a] text-sm mb-1">{p.name}</div>
              {p.code && <div className="text-xs text-[#8b5e3c] mb-1">{p.code}</div>}
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#fdf0e0] text-[#c8773a]">{p.category}</span>
                <span className="text-xs text-[#8b5e3c]">{p.unit}</span>
              </div>
              <div className="text-xs text-[#8b5e3c]">
                <div>Tồn: <span className="font-medium text-[#3d1f0a]">{p.stock_qty} {p.unit}</span></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#fffaf4] rounded-2xl border border-[#f5e6cc] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Tên</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Mã</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Danh mục</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">ĐVT</th>
                  <th className="text-right text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Tồn</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Trạng thái</th>
                  <th className="bg-[#f5e6cc]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? '' : 'bg-[#fdf6ec]'}>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-sm font-medium text-[#3d1f0a]">{p.name}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-xs text-[#8b5e3c]">{p.code}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-xs text-[#8b5e3c]">{p.category}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-xs text-[#8b5e3c]">{p.unit}</td>
                    <td className={`px-3 py-2.5 border-b border-[#f0e8d8] text-sm text-right ${p.stock_qty < p.min_stock && p.is_active ? 'text-[#d94f3d] font-semibold' : 'text-[#3d1f0a]'}`}>{p.stock_qty}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-[#d4f5e3] text-[#1e7a4a]' : 'bg-[#f5e6cc] text-[#8b5e3c]'}`}>
                        {p.is_active ? 'Hoạt động' : 'Ngừng'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="px-2 py-1 text-xs bg-transparent border border-[#f5e6cc] rounded text-[#8b5e3c] hover:border-[#c8773a] hover:text-[#c8773a] transition-all cursor-pointer">✏</button>
                        <button onClick={(e) => { e.stopPropagation(); handleToggleActive(p) }} className="px-2 py-1 text-xs bg-transparent border border-[#f5e6cc] rounded text-[#8b5e3c] hover:border-[#c8773a] transition-all cursor-pointer">{p.is_active ? '⏸' : '▶'}</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(p) }} className="bg-transparent border-none text-[#e0a090] text-base cursor-pointer px-1.5 py-0.5 rounded hover:bg-[#fdecea] hover:text-[#c0392b] transition-all">×</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
