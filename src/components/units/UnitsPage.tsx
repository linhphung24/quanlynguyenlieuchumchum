'use client'

import { useState, useRef } from 'react'
import { useApp } from '@/contexts/AppContext'

export default function UnitsPage() {
  const { sb, profile, allUnits, setAllUnits, toast, writeAudit } = useApp()
  const canEdit = profile?.role === 'admin' || profile?.role === 'manager'

  const [addVal, setAddVal]         = useState('')
  const [adding, setAdding]         = useState(false)
  const [editingId, setEditingId]   = useState<number | null>(null)
  const [editVal, setEditVal]       = useState('')
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState<number | null>(null)
  const addInputRef  = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  /* ── helpers ── */
  type UnitRow = { id: number; name: string; sort_order: number }
  const [unitRows, setUnitRows] = useState<UnitRow[]>([])
  const [loaded, setLoaded]     = useState(false)

  // Load đầy đủ rows (id + sort_order) — chạy 1 lần khi mount
  const loadRows = async () => {
    const { data } = await sb.from('units').select('id, name, sort_order').order('sort_order').order('name')
    if (data) {
      setUnitRows(data as UnitRow[])
      setAllUnits((data as UnitRow[]).map(u => u.name))
    }
    setLoaded(true)
  }

  // Chỉ load 1 lần
  if (!loaded) { loadRows() }

  /* ── Thêm mới ── */
  const handleAdd = async () => {
    const name = addVal.trim()
    if (!name) return
    if (unitRows.some(u => u.name.toLowerCase() === name.toLowerCase())) {
      toast('Đơn vị này đã tồn tại', 'error'); return
    }
    setSaving(true)
    try {
      const maxOrder = unitRows.reduce((m, u) => Math.max(m, u.sort_order), -1)
      const { data, error } = await sb.from('units')
        .insert({ name, sort_order: maxOrder + 1 })
        .select('id, name, sort_order').single()
      if (error) throw error
      const newRow = data as UnitRow
      setUnitRows(prev => [...prev, newRow])
      setAllUnits(prev => [...prev, newRow.name])
      setAddVal('')
      addInputRef.current?.focus()
      toast(`Đã thêm "${name}"`)
      writeAudit('create', 'units', String(newRow.id), `Thêm đơn vị "${name}"`)
    } catch (e) {
      toast('Lỗi: ' + (e as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ── Sửa tên ── */
  const openEdit = (row: UnitRow) => {
    setEditingId(row.id)
    setEditVal(row.name)
    setTimeout(() => editInputRef.current?.select(), 30)
  }

  const saveEdit = async (row: UnitRow) => {
    const name = editVal.trim()
    if (!name || name === row.name) { setEditingId(null); return }
    if (unitRows.some(u => u.id !== row.id && u.name.toLowerCase() === name.toLowerCase())) {
      toast('Đơn vị này đã tồn tại', 'error'); return
    }
    setSaving(true)
    try {
      const { error } = await sb.from('units').update({ name }).eq('id', row.id)
      if (error) throw error
      setUnitRows(prev => prev.map(u => u.id === row.id ? { ...u, name } : u))
      setAllUnits(prev => prev.map(u => u === row.name ? name : u))
      toast(`Đã đổi "${row.name}" → "${name}"`)
      writeAudit('update', 'units', String(row.id), `Đổi tên "${row.name}" → "${name}"`)
    } catch (e) {
      toast('Lỗi: ' + (e as Error).message, 'error')
    } finally {
      setSaving(false)
      setEditingId(null)
    }
  }

  /* ── Xoá ── */
  const handleDelete = async (row: UnitRow) => {
    if (!window.confirm(`Xoá đơn vị "${row.name}"?\n\nSản phẩm/hoá đơn đang dùng đơn vị này vẫn giữ nguyên, chỉ xoá khỏi danh sách dropdown.`)) return
    setDeleting(row.id)
    try {
      const { error } = await sb.from('units').delete().eq('id', row.id)
      if (error) throw error
      setUnitRows(prev => prev.filter(u => u.id !== row.id))
      setAllUnits(prev => prev.filter(u => u !== row.name))
      toast(`Đã xoá "${row.name}"`)
      writeAudit('delete', 'units', String(row.id), `Xoá đơn vị "${row.name}"`)
    } catch (e) {
      toast('Lỗi: ' + (e as Error).message, 'error')
    } finally {
      setDeleting(null)
    }
  }

  /* ── Di chuyển thứ tự ── */
  const moveRow = async (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= unitRows.length) return
    const next = [...unitRows]
    ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
    // Cập nhật sort_order liên tục
    const updated = next.map((u, i) => ({ ...u, sort_order: i }))
    setUnitRows(updated)
    setAllUnits(updated.map(u => u.name))
    // Persist 2 rows đổi chỗ
    await Promise.all([
      sb.from('units').update({ sort_order: updated[idx].sort_order }).eq('id', updated[idx].id),
      sb.from('units').update({ sort_order: updated[newIdx].sort_order }).eq('id', updated[newIdx].id),
    ])
  }

  /* ── Render ── */
  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3d1f0a] mb-4">
        📐 Đơn vị tính
      </h2>

      {/* Form thêm mới */}
      {canEdit && (
        <div className="bg-[#fffaf4] rounded-2xl p-5 mb-4 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
          <p className="text-xs font-semibold text-[#8b5e3c] mb-2 uppercase tracking-wide">Thêm đơn vị mới</p>
          <div className="flex gap-2">
            <input
              ref={addInputRef}
              type="text"
              value={addVal}
              onChange={e => setAddVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              placeholder="Ví dụ: lon, thùng, bịch..."
              className="flex-1 px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] placeholder-[#c8a87a] outline-none focus:border-[#c8773a] transition-colors"
              disabled={saving}
            />
            <button
              onClick={handleAdd}
              disabled={saving || !addVal.trim()}
              className="px-4 py-2.5 rounded-lg bg-[#c8773a] text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              + Thêm
            </button>
          </div>
        </div>
      )}

      {/* Danh sách */}
      <div className="bg-[#fffaf4] rounded-2xl border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#f5e6cc] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#3d1f0a]">Danh sách đơn vị</h3>
          <span className="text-xs text-[#8b5e3c]">{unitRows.length} đơn vị</span>
        </div>

        {!loaded ? (
          <div className="py-12 text-center text-sm text-[#8b5e3c]">
            <div className="inline-block w-5 h-5 border-2 border-[#c8773a] border-t-transparent rounded-full animate-spin mb-2"></div>
            <div>Đang tải...</div>
          </div>
        ) : unitRows.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#8b5e3c]">Chưa có đơn vị nào</div>
        ) : (
          <ul className="divide-y divide-[#f5e6cc]">
            {unitRows.map((row, idx) => (
              <li
                key={row.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-[#fef4e8] transition-colors group"
              >
                {/* Số thứ tự */}
                <span className="text-xs text-[#c8a87a] w-5 text-right flex-shrink-0">{idx + 1}</span>

                {/* Tên đơn vị / inline edit */}
                <div className="flex-1 min-w-0">
                  {editingId === row.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(row)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="flex-1 text-sm border border-[#c8773a] rounded px-2 py-1 outline-none bg-white text-[#3d1f0a]"
                        disabled={saving}
                      />
                      <button
                        onClick={() => saveEdit(row)}
                        disabled={saving}
                        className="text-[#1e7a4a] hover:text-green-700 font-bold text-base leading-none cursor-pointer"
                        title="Lưu (Enter)"
                      >✓</button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-[#aaa] hover:text-[#c8773a] font-bold text-base leading-none cursor-pointer"
                        title="Huỷ (Esc)"
                      >✕</button>
                    </div>
                  ) : (
                    <span
                      className={`text-sm font-medium text-[#3d1f0a] ${canEdit ? 'cursor-pointer hover:text-[#c8773a]' : ''} transition-colors`}
                      onClick={() => canEdit && openEdit(row)}
                      title={canEdit ? 'Click để đổi tên' : ''}
                    >
                      {row.name}
                    </span>
                  )}
                </div>

                {/* Actions */}
                {canEdit && editingId !== row.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {/* Up/Down */}
                    <button
                      onClick={() => moveRow(idx, -1)}
                      disabled={idx === 0}
                      className="w-6 h-6 flex items-center justify-center rounded text-[#8b5e3c] hover:bg-[#f5e6cc] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer text-xs transition-colors"
                      title="Lên"
                    >▲</button>
                    <button
                      onClick={() => moveRow(idx, 1)}
                      disabled={idx === unitRows.length - 1}
                      className="w-6 h-6 flex items-center justify-center rounded text-[#8b5e3c] hover:bg-[#f5e6cc] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer text-xs transition-colors"
                      title="Xuống"
                    >▼</button>
                    {/* Edit */}
                    <button
                      onClick={() => openEdit(row)}
                      className="w-6 h-6 flex items-center justify-center rounded text-[#8b5e3c] hover:bg-[#f5e6cc] cursor-pointer text-xs transition-colors"
                      title="Đổi tên"
                    >✏</button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(row)}
                      disabled={deleting === row.id}
                      className="w-6 h-6 flex items-center justify-center rounded text-[#c8773a] hover:bg-red-50 hover:text-red-600 disabled:opacity-40 cursor-pointer text-xs transition-colors"
                      title="Xoá"
                    >🗑</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Ghi chú */}
      <p className="mt-3 text-xs text-[#8b5e3c] italic px-1">
        💡 Đơn vị ở đây xuất hiện trong dropdown khi tạo sản phẩm, hoá đơn, công thức.
        Xoá đơn vị không ảnh hưởng dữ liệu đã lưu.
      </p>
    </div>
  )
}
