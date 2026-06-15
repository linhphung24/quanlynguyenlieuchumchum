'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useApp } from '@/contexts/AppContext'
import { ASSIGNABLE_PAGES, ROLE_LABELS } from '@/lib/constants'
import { UserGroup, PageName } from '@/types'
import { initials, roleClass } from '@/lib/utils'

// Các section theo thứ tự hiển thị
const SECTIONS = ['Kho & Bán hàng', 'Sản xuất', 'Khách hàng', 'Hệ thống']

export default function GroupsPage() {
  const { sb, profile, allProfiles, setAllProfiles, toast, writeAudit, startLoading, stopLoading } = useApp()

  const [groups, setGroups]         = useState<UserGroup[]>([])
  const [loading, setLoading]       = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [creating, setCreating]     = useState(false)

  // Form state
  const [name, setName]   = useState('')
  const [desc, setDesc]   = useState('')
  const [pages, setPages] = useState<Set<PageName>>(new Set())
  const [saving, setSaving]       = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)

  const isAdmin = profile?.role === 'admin'

  // ── Load groups ────────────────────────────────────────────
  const loadGroups = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await sb.from('user_groups').select('*').order('name')
      if (error) throw error
      setGroups((data ?? []) as UserGroup[])
    } catch (e) {
      toast('Lỗi tải nhóm: ' + (e as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }, [sb, toast])

  useEffect(() => { if (isAdmin) loadGroups() }, [isAdmin, loadGroups])

  const selected = groups.find(g => g.id === selectedId) ?? null

  // ── Khi chọn nhóm → nạp vào form ───────────────────────────
  const selectGroup = (g: UserGroup) => {
    setCreating(false)
    setSelectedId(g.id)
    setName(g.name)
    setDesc(g.description ?? '')
    setPages(new Set(g.allowed_pages as PageName[]))
  }

  const startCreate = () => {
    setCreating(true)
    setSelectedId(null)
    setName('')
    setDesc('')
    setPages(new Set())
  }

  const togglePage = (id: PageName) => {
    setPages(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSection = (section: string, on: boolean) => {
    const ids = ASSIGNABLE_PAGES.filter(p => p.section === section).map(p => p.id)
    setPages(prev => {
      const next = new Set(prev)
      ids.forEach(id => { if (on) next.add(id); else next.delete(id) })
      return next
    })
  }

  // ── Lưu nhóm (create hoặc update) ──────────────────────────
  const handleSave = async () => {
    if (!profile) { toast('Bạn cần đăng nhập', 'error'); return }
    if (!name.trim()) { toast('Vui lòng nhập tên nhóm', 'error'); return }
    setSaving(true)
    startLoading()
    try {
      const payload = {
        name: name.trim(),
        description: desc.trim() || null,
        allowed_pages: Array.from(pages),
      }
      if (creating) {
        const { data, error } = await sb.from('user_groups')
          .insert({ ...payload, created_by: profile.full_name })
          .select().single()
        if (error) throw error
        if (!data) { toast('Không thể tạo nhóm — kiểm tra quyền admin', 'error'); return }
        setGroups(prev => [...prev, data as UserGroup].sort((a, b) => a.name.localeCompare(b.name)))
        setSelectedId((data as UserGroup).id)
        setCreating(false)
        await writeAudit('create', 'user_group', String((data as UserGroup).id), `Tạo nhóm: ${payload.name}`)
        toast('Đã tạo nhóm "' + payload.name + '"')
      } else if (selectedId) {
        const { data, error } = await sb.from('user_groups')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', selectedId)
          .select().single()
        if (error) throw error
        if (!data) { toast('Không thể cập nhật — kiểm tra quyền admin', 'error'); return }
        setGroups(prev => prev.map(g => g.id === selectedId ? (data as UserGroup) : g))
        await writeAudit('update', 'user_group', String(selectedId), `Cập nhật nhóm: ${payload.name}`)
        toast('Đã lưu nhóm "' + payload.name + '"')
      }
    } catch (e) {
      toast('Lỗi lưu nhóm: ' + (e as Error).message, 'error')
    } finally {
      setSaving(false)
      stopLoading()
    }
  }

  // ── Xoá nhóm ───────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selected) return
    const memberCount = allProfiles.filter(p => p.group_id === selected.id).length
    const msg = memberCount > 0
      ? `Xoá nhóm "${selected.name}"? ${memberCount} thành viên sẽ trở về quyền mặc định theo vai trò.`
      : `Xoá nhóm "${selected.name}"?`
    if (!confirm(msg)) return
    startLoading()
    try {
      const { error } = await sb.from('user_groups').delete().eq('id', selected.id)
      if (error) throw error
      // Cập nhật local: gỡ group_id của thành viên
      setAllProfiles(prev => prev.map(p => p.group_id === selected.id ? { ...p, group_id: null } : p))
      setGroups(prev => prev.filter(g => g.id !== selected.id))
      await writeAudit('delete', 'user_group', String(selected.id), `Xoá nhóm: ${selected.name}`)
      toast('Đã xoá nhóm "' + selected.name + '"')
      setSelectedId(null)
    } catch (e) {
      toast('Lỗi xoá nhóm: ' + (e as Error).message, 'error')
    } finally {
      stopLoading()
    }
  }

  // ── Gán / gỡ thành viên ────────────────────────────────────
  const toggleMember = async (userId: string, userName: string, inThisGroup: boolean) => {
    if (!selectedId) return
    setAssigning(userId)
    try {
      const newGroupId = inThisGroup ? null : selectedId
      const res = await fetch('/api/admin/assign-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, groupId: newGroupId }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Lỗi không xác định')
      setAllProfiles(prev => prev.map(p => p.id === userId ? { ...p, group_id: newGroupId } : p))
      await writeAudit('update', 'user', userId,
        newGroupId ? `Gán vào nhóm: ${selected?.name}` : `Gỡ khỏi nhóm: ${selected?.name}`)
    } catch (e) {
      toast('Lỗi gán nhóm: ' + (e as Error).message, 'error')
    } finally {
      setAssigning(null)
    }
  }

  const memberCount = useMemo(() => {
    const m: Record<number, number> = {}
    allProfiles.forEach(p => { if (p.group_id) m[p.group_id] = (m[p.group_id] || 0) + 1 })
    return m
  }, [allProfiles])

  const groupNameById = useMemo(() => {
    const m: Record<number, string> = {}
    groups.forEach(g => { m[g.id] = g.name })
    return m
  }, [groups])

  if (!isAdmin) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-[#fffaf4] rounded-2xl p-8 text-center border border-[#f5e6cc]">
          <div className="text-4xl mb-2">🔒</div>
          <p className="text-sm text-[#8b5e3c]">Chỉ admin mới được quản lý phân nhóm & quyền</p>
        </div>
      </div>
    )
  }

  const editing = creating || selectedId !== null

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3d1f0a] mb-1">🔑 Phân nhóm & quyền truy cập</h2>
      <p className="text-xs text-[#8b5e3c] mb-4">
        Tạo nhóm người dùng và chọn các tab mỗi nhóm được phép xem. User chưa thuộc nhóm nào sẽ dùng quyền mặc định theo vai trò.
      </p>

      <div className="grid md:grid-cols-[260px_1fr] gap-4">

        {/* ── Cột trái: danh sách nhóm ── */}
        <div className="bg-[#fffaf4] rounded-2xl border border-[#f5e6cc] p-3 h-fit">
          <button
            onClick={startCreate}
            className="w-full mb-3 py-2 rounded-lg bg-[#c8773a] text-white text-sm font-medium hover:bg-[#b06830] transition-colors"
          >
            + Tạo nhóm mới
          </button>

          {loading ? (
            <div className="text-center py-6 text-xs text-[#8b5e3c]/60">Đang tải...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#8b5e3c]/60">Chưa có nhóm nào</div>
          ) : (
            <div className="space-y-1">
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => selectGroup(g)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    selectedId === g.id
                      ? 'bg-[#fdf0e8] border border-[#c8773a]'
                      : 'hover:bg-[#fdf6ec] border border-transparent'
                  }`}
                >
                  <div className="text-sm font-medium text-[#3d1f0a] truncate">{g.name}</div>
                  <div className="text-[10px] text-[#8b5e3c]/70 mt-0.5 flex items-center gap-2">
                    <span>👤 {memberCount[g.id] ?? 0} người</span>
                    <span>·</span>
                    <span>{g.allowed_pages.length} tab</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Cột phải: editor ── */}
        {!editing ? (
          <div className="bg-[#fffaf4] rounded-2xl border border-[#f5e6cc] flex items-center justify-center min-h-[300px]">
            <div className="text-center px-6">
              <div className="text-4xl mb-3">🔑</div>
              <p className="text-sm text-[#8b5e3c]/70">Chọn một nhóm để chỉnh quyền, hoặc tạo nhóm mới</p>
            </div>
          </div>
        ) : (
          <div className="bg-[#fffaf4] rounded-2xl border border-[#f5e6cc] p-5">

            {/* Tên + mô tả */}
            <div className="grid sm:grid-cols-2 gap-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Tên nhóm *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="VD: Trực page, Kho, Bếp..."
                  className="w-full px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Mô tả</label>
                <input
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Ghi chú ngắn (tuỳ chọn)"
                  className="w-full px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a]"
                />
              </div>
            </div>

            {/* Quyền tab */}
            <div className="mb-5">
              <div className="text-xs font-medium text-[#8b5e3c] mb-2">Tab được phép xem ({pages.size})</div>
              <div className="space-y-3">
                {SECTIONS.map(section => {
                  const items = ASSIGNABLE_PAGES.filter(p => p.section === section)
                  if (items.length === 0) return null
                  const allOn = items.every(it => pages.has(it.id))
                  return (
                    <div key={section} className="border border-[#f0e4d0] rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8b5e3c]/80">{section}</span>
                        <button
                          onClick={() => toggleSection(section, !allOn)}
                          className="text-[10px] text-[#c8773a] hover:underline"
                        >
                          {allOn ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {items.map(it => {
                          const on = pages.has(it.id)
                          return (
                            <button
                              key={it.id}
                              onClick={() => togglePage(it.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border ${
                                on
                                  ? 'bg-[#fdf0e8] border-[#c8773a] text-[#3d1f0a]'
                                  : 'bg-white border-[#f0e4d0] text-[#8b5e3c]/70 hover:border-[#e8c9a0]'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${
                                on ? 'bg-[#c8773a] text-white' : 'border border-[#d8c0a0]'
                              }`}>
                                {on ? '✓' : ''}
                              </span>
                              <span className="truncate">{it.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Nút lưu / xoá */}
            <div className="flex items-center gap-2 mb-5">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[#c8773a] text-white text-sm font-medium hover:bg-[#b06830] transition-colors disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : creating ? 'Tạo nhóm' : 'Lưu thay đổi'}
              </button>
              {!creating && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg border-[1.5px] border-[#f5c6c0] text-[#c0392b] text-sm font-medium hover:bg-[#fde8e5] transition-colors"
                >
                  🗑 Xoá nhóm
                </button>
              )}
              <button
                onClick={() => { setCreating(false); setSelectedId(null) }}
                className="px-4 py-2 rounded-lg text-[#8b5e3c] text-sm hover:bg-[#fdf6ec] transition-colors ml-auto"
              >
                Đóng
              </button>
            </div>

            {/* Thành viên — chỉ hiện khi đã lưu (có selectedId) */}
            {selectedId && !creating && (
              <div className="border-t border-[#f0e4d0] pt-4">
                <div className="text-xs font-medium text-[#8b5e3c] mb-2">
                  Thành viên ({allProfiles.filter(p => p.group_id === selectedId).length})
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                  {allProfiles.map(p => {
                    const inThisGroup = p.group_id === selectedId
                    const inOtherGroup = p.group_id && p.group_id !== selectedId
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${
                          inThisGroup ? 'bg-[#fdf0e8] border-[#e8c9a0]' : 'bg-white border-[#f0e4d0]'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-[#c8773a] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {initials(p.full_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#3d1f0a] truncate">{p.full_name}</div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${roleClass(p.role)}`}>
                              {ROLE_LABELS[p.role] ?? p.role}
                            </span>
                            {inOtherGroup && (
                              <span className="text-[9px] text-[#8b5e3c]/60">
                                đang ở nhóm: {groupNameById[p.group_id as number] ?? '—'}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleMember(p.id, p.full_name, inThisGroup)}
                          disabled={assigning === p.id}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex-shrink-0 ${
                            inThisGroup
                              ? 'border-[1.5px] border-[#f5c6c0] text-[#c0392b] hover:bg-[#fde8e5]'
                              : 'bg-[#c8773a] text-white hover:bg-[#b06830]'
                          }`}
                        >
                          {assigning === p.id ? '...' : inThisGroup ? 'Gỡ' : (inOtherGroup ? 'Chuyển vào' : 'Thêm')}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
