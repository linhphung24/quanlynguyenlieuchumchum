'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Personnel } from '@/types'
import DateInput from '@/components/shared/DateInput'
import { fmtDate } from '@/lib/utils'

const INPUT_CLS = 'w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors'
const LABEL_CLS = 'block text-xs font-medium text-[#8b5e3c] mb-1'

const EMPTY: Omit<Personnel, 'id' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'> = {
  full_name: '',
  dob: '',
  position: '',
  department: '',
  phone: '',
  is_active: true,
  notes: '',
}

function getMonthDay(dob: string): string {
  if (!dob) return ''
  const parts = dob.split('-')
  if (parts.length < 3) return ''
  return `${parts[2]}/${parts[1]}`
}

function isBirthdayThisMonth(dob: string, month: number): boolean {
  if (!dob) return false
  const parts = dob.split('-')
  if (parts.length < 2) return false
  return parseInt(parts[1], 10) === month
}

export default function PersonnelPage() {
  const { sb, user, profile, toast, writeAudit } = useApp()

  const [list, setList] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Partial<Personnel> | null>(null)
  const [saving, setSaving] = useState(false)

  const today = new Date()
  const thisMonth = today.getMonth() + 1

  // Load data — phải đặt TRƯỚC mọi early return để tuân thủ Rules of Hooks
  useEffect(() => {
    if (profile?.role !== 'admin' && profile?.role !== 'manager') return
    const load = async () => {
      setLoading(true)
      try {
        const { data, error } = await sb.from('personnel').select('*').order('full_name')
        if (error) throw error
        setList((data ?? []) as Personnel[])
      } catch (e: unknown) {
        toast(e instanceof Error ? e.message : 'Lỗi tải dữ liệu nhân sự', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.role])

  // Access guard — sau tất cả hooks
  if (profile?.role !== 'admin' && profile?.role !== 'manager') {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-[#fffaf4] rounded-2xl p-8 text-center border border-[#f5e6cc]">
          <div className="text-4xl mb-2">🔒</div>
          <p className="text-sm text-[#8b5e3c]">Bạn không có quyền truy cập trang này</p>
        </div>
      </div>
    )
  }

  const departments = [...new Set(list.map(p => p.department).filter(Boolean))] as string[]

  const filtered = list.filter(p => {
    if (filterActive === 'active' && !p.is_active) return false
    if (filterActive === 'inactive' && p.is_active) return false
    if (filterDept && p.department !== filterDept) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !p.full_name.toLowerCase().includes(q) &&
        !(p.position ?? '').toLowerCase().includes(q) &&
        !(p.phone ?? '').includes(q)
      ) return false
    }
    return true
  })

  const birthdayThisMonth = list.filter(p => p.is_active && isBirthdayThisMonth(p.dob, thisMonth))

  const openCreate = () => {
    setEditing({ ...EMPTY })
    setShowForm(true)
  }

  const openEdit = (p: Personnel) => {
    setEditing({ ...p })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
  }

  const handleSave = async () => {
    if (!user) { toast('Bạn chưa đăng nhập', 'error'); return }
    if (!editing) return
    if (!editing.full_name?.trim()) { toast('Vui lòng nhập họ tên', 'error'); return }
    if (!editing.dob) { toast('Vui lòng nhập ngày sinh', 'error'); return }

    setSaving(true)
    try {
      const payload = {
        full_name: editing.full_name.trim(),
        dob: editing.dob,
        position: editing.position?.trim() || null,
        department: editing.department?.trim() || null,
        phone: editing.phone?.trim() || null,
        is_active: editing.is_active ?? true,
        notes: editing.notes?.trim() || null,
      }

      if (editing.id) {
        // Update
        const { data: updated, error } = await sb
          .from('personnel')
          .update({ ...payload, updated_by: user.id, updated_at: new Date().toISOString() })
          .eq('id', editing.id)
          .select()
          .single()
        if (error) throw error
        if (!updated) { toast('Không thể cập nhật — kiểm tra quyền', 'error'); return }
        setList(prev => prev.map(p => p.id === editing.id ? updated as Personnel : p))
        await writeAudit('update', 'personnel', String(editing.id), `Cập nhật: ${payload.full_name}`)
        toast(`Đã cập nhật ${payload.full_name}`)
      } else {
        // Insert
        const { data: inserted, error } = await sb
          .from('personnel')
          .insert({ ...payload, created_by: user.id })
          .select()
          .single()
        if (error) throw error
        setList(prev => [...prev, inserted as Personnel].sort((a, b) => a.full_name.localeCompare(b.full_name)))
        await writeAudit('create', 'personnel', String(inserted.id), `Thêm mới: ${payload.full_name}`)
        toast(`Đã thêm ${payload.full_name}`)
      }
      closeForm()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Lỗi lưu dữ liệu', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: Personnel) => {
    if (!confirm(`Xoá nhân viên "${p.full_name}"?`)) return
    try {
      const { error } = await sb.from('personnel').delete().eq('id', p.id)
      if (error) throw error
      setList(prev => prev.filter(x => x.id !== p.id))
      await writeAudit('delete', 'personnel', String(p.id), `Xoá: ${p.full_name}`)
      toast(`Đã xoá ${p.full_name}`)
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Lỗi xoá nhân viên', 'error')
    }
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3d1f0a]">👩‍💼 Nhân sự</h2>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c8773a] text-white text-sm font-medium rounded-xl hover:bg-[#b5672e] transition-colors shadow-sm"
        >
          + Thêm nhân viên
        </button>
      </div>

      {/* Birthday highlight */}
      {birthdayThisMonth.length > 0 && (
        <div className="mb-4 bg-[#fff8ee] border border-[#f5c87a] rounded-2xl p-4">
          <p className="text-sm font-semibold text-[#8b5e3c] mb-2">
            🎂 Sinh nhật tháng {thisMonth} ({birthdayThisMonth.length} người)
          </p>
          <div className="flex flex-wrap gap-2">
            {birthdayThisMonth.map(p => (
              <span key={p.id} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#f5c87a] rounded-full text-xs text-[#3d1f0a] font-medium shadow-sm">
                🎁 {p.full_name}
                <span className="text-[#c8773a] ml-1">{getMonthDay(p.dob)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#fffaf4] rounded-2xl p-5 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên, chức vụ, SĐT..."
            className="flex-1 min-w-[160px] px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-xs bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
          />
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-xs bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
          >
            <option value="">Tất cả bộ phận</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={filterActive}
            onChange={e => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-xs bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
          >
            <option value="active">Đang làm</option>
            <option value="inactive">Đã nghỉ</option>
            <option value="all">Tất cả</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-10 text-sm text-[#8b5e3c]">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-[#8b5e3c]">Không có nhân viên nào</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#f0e8d8]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Nhân viên</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Ngày sinh</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Chức vụ / BP</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">SĐT</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Trạng thái</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const hasBirthday = isBirthdayThisMonth(p.dob, thisMonth)
                  return (
                    <tr key={p.id} className={i % 2 === 0 ? '' : 'bg-[#fdf6ec]'}>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 ${hasBirthday ? 'bg-[#e8a030]' : 'bg-[#c8773a]'}`}>
                            {p.full_name.trim().split(' ').slice(-1)[0]?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#3d1f0a]">
                              {p.full_name}
                              {hasBirthday && <span className="ml-1 text-[#e8a030]">🎂</span>}
                            </div>
                            {p.notes && <div className="text-[10px] text-[#8b5e3c] max-w-[160px] truncate">{p.notes}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-xs text-[#3d1f0a]">
                        {fmtDate(p.dob)}
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-xs text-[#3d1f0a]">
                        {p.position && <div className="font-medium">{p.position}</div>}
                        {p.department && <div className="text-[#8b5e3c]">{p.department}</div>}
                        {!p.position && !p.department && <span className="text-[#c9b49a]">—</span>}
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-xs text-[#3d1f0a]">
                        {p.phone || <span className="text-[#c9b49a]">—</span>}
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${p.is_active ? 'bg-[#d4f5e3] text-[#1e7a4a]' : 'bg-[#f0e8d8] text-[#8b5e3c]'}`}>
                          {p.is_active ? 'Đang làm' : 'Đã nghỉ'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-[1.5px] border-[#f5e6cc] bg-white text-[#8b5e3c] text-xs font-medium cursor-pointer hover:border-[#c8773a] hover:text-[#c8773a] transition-all whitespace-nowrap"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-[1.5px] border-[#f5c6c0] bg-white text-[#c0392b] text-xs font-medium cursor-pointer hover:bg-[#fde8e5] transition-all whitespace-nowrap"
                          >
                            🗑 Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-2 text-right text-xs text-[#8b5e3c]">
          {filtered.length}/{list.length} nhân viên
        </div>
      </div>

      {/* Slide-over form */}
      {showForm && editing !== null && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/30" onClick={closeForm} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f5e6cc] flex items-center justify-between bg-[#fffaf4]">
              <h3 className="font-['Playfair_Display'] text-base font-bold text-[#3d1f0a]">
                {editing.id ? 'Sửa nhân viên' : 'Thêm nhân viên'}
              </h3>
              <button onClick={closeForm} className="text-[#8b5e3c] hover:text-[#3d1f0a] text-lg leading-none">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Họ tên */}
              <div>
                <label className={LABEL_CLS}>Họ tên <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editing.full_name ?? ''}
                  onChange={e => setEditing(prev => ({ ...prev, full_name: e.target.value }))}
                  onBlur={e => setEditing(prev => ({ ...prev, full_name: e.target.value.trim() }))}
                  placeholder="Nguyễn Văn A"
                  className={INPUT_CLS}
                />
              </div>

              {/* Ngày sinh */}
              <div>
                <label className={LABEL_CLS}>Ngày sinh <span className="text-red-500">*</span></label>
                <DateInput
                  value={editing.dob ?? ''}
                  onChange={v => setEditing(prev => ({ ...prev, dob: v }))}
                  className={INPUT_CLS}
                  placeholder="dd/mm/yyyy"
                />
              </div>

              {/* Chức vụ */}
              <div>
                <label className={LABEL_CLS}>Chức vụ</label>
                <input
                  type="text"
                  value={editing.position ?? ''}
                  onChange={e => setEditing(prev => ({ ...prev, position: e.target.value }))}
                  onBlur={e => setEditing(prev => ({ ...prev, position: e.target.value.trim() }))}
                  placeholder="Thu ngân, Bếp, Phục vụ..."
                  className={INPUT_CLS}
                />
              </div>

              {/* Bộ phận */}
              <div>
                <label className={LABEL_CLS}>Bộ phận</label>
                <input
                  type="text"
                  value={editing.department ?? ''}
                  onChange={e => setEditing(prev => ({ ...prev, department: e.target.value }))}
                  onBlur={e => setEditing(prev => ({ ...prev, department: e.target.value.trim() }))}
                  placeholder="Cửa hàng, Bếp, Quản lý..."
                  className={INPUT_CLS}
                />
              </div>

              {/* Số điện thoại */}
              <div>
                <label className={LABEL_CLS}>Số điện thoại</label>
                <input
                  type="tel"
                  value={editing.phone ?? ''}
                  onChange={e => setEditing(prev => ({ ...prev, phone: e.target.value }))}
                  onBlur={e => setEditing(prev => ({ ...prev, phone: e.target.value.trim() }))}
                  placeholder="0912 345 678"
                  className={INPUT_CLS}
                />
              </div>

              {/* Ghi chú */}
              <div>
                <label className={LABEL_CLS}>Ghi chú</label>
                <textarea
                  value={editing.notes ?? ''}
                  onChange={e => setEditing(prev => ({ ...prev, notes: e.target.value }))}
                  onBlur={e => setEditing(prev => ({ ...prev, notes: e.target.value.trim() }))}
                  rows={2}
                  placeholder="Ghi chú thêm..."
                  className={INPUT_CLS + ' resize-none'}
                />
              </div>

              {/* Trạng thái */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_active ?? true}
                    onChange={e => setEditing(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[#f0e8d8] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-[#c8773a] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
                <span className="text-sm text-[#3d1f0a]">
                  {editing.is_active ? 'Đang làm việc' : 'Đã nghỉ việc'}
                </span>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[#f5e6cc] bg-[#fffaf4] flex gap-3">
              <button
                onClick={closeForm}
                className="flex-1 py-2.5 rounded-xl border-[1.5px] border-[#f5e6cc] text-sm font-medium text-[#8b5e3c] bg-white hover:bg-[#f5e6cc] transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#c8773a] text-white text-sm font-medium hover:bg-[#b5672e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Đang lưu...' : (editing.id ? 'Lưu thay đổi' : 'Thêm nhân viên')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
