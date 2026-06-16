'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { initials, roleClass, fmtTs } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'
import { Profile } from '@/types'

export default function UsersPage() {
  const { profile, allProfiles, setAllProfiles, toast, writeAudit } = useApp()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [sendingReset, setSendingReset] = useState<string | null>(null)
  const [deletingUser, setDeletingUser] = useState<string | null>(null)

  // Sửa thông tin user (admin)
  const [editing, setEditing]         = useState<Profile | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail]       = useState('')
  const [origEmail, setOrigEmail]       = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [savingEdit, setSavingEdit]     = useState(false)

  const openEdit = async (p: Profile) => {
    setEditing(p)
    setEditFullName(p.full_name)
    setEditPassword('')
    setEditEmail('')
    setOrigEmail('')
    setLoadingEmail(true)
    try {
      const res = await fetch(`/api/admin/update-user?userId=${p.id}`)
      const data = await res.json()
      if (res.ok) { setEditEmail(data.email ?? ''); setOrigEmail(data.email ?? '') }
    } catch { /* không lấy được email — vẫn cho sửa, để trống = giữ nguyên */ }
    finally { setLoadingEmail(false) }
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    if (!editFullName.trim()) { toast('Vui lòng nhập tên hiển thị', 'error'); return }
    if (editPassword && editPassword.length < 6) { toast('Mật khẩu tối thiểu 6 ký tự', 'error'); return }
    setSavingEdit(true)
    try {
      const payload: { userId: string; fullName: string; email?: string; password?: string } = {
        userId: editing.id,
        fullName: editFullName.trim(),
      }
      if (editEmail.trim() && editEmail.trim() !== origEmail) payload.email = editEmail.trim()
      if (editPassword) payload.password = editPassword

      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Lỗi không xác định')

      setAllProfiles(prev => prev.map(p => p.id === editing.id ? { ...p, full_name: editFullName.trim() } : p))
      const changes: string[] = []
      if (editFullName.trim() !== editing.full_name) changes.push('tên')
      if (payload.email)    changes.push('email')
      if (payload.password) changes.push('mật khẩu')
      await writeAudit('update', 'user', editing.id, `Sửa ${changes.join(', ') || 'thông tin'}: ${editFullName.trim()}`)
      toast(`Đã cập nhật "${editFullName.trim()}"`)
      setEditing(null)
    } catch (e) {
      toast('Lỗi cập nhật: ' + (e as Error).message, 'error')
    } finally {
      setSavingEdit(false)
    }
  }

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

  const filtered = allProfiles.filter((p) => {
    if (search && !p.full_name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterRole && p.role !== filterRole) return false
    return true
  })

  const roleCounts = {
    admin: allProfiles.filter((p) => p.role === 'admin').length,
    manager: allProfiles.filter((p) => p.role === 'manager').length,
    staff: allProfiles.filter((p) => p.role === 'staff').length,
  }

  const handleSendReset = async (userId: string, name: string) => {
    if (!confirm(`Gửi email đặt lại mật khẩu cho "${name}"?`)) return
    setSendingReset(userId)
    try {
      const res = await fetch('/api/admin/send-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Lỗi không xác định')
      toast(`Đã gửi email đặt lại mật khẩu cho ${name}`)
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Gửi email thất bại', 'error')
    } finally {
      setSendingReset(null)
    }
  }

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Xoá tài khoản "${name}"? Thao tác này không thể hoàn tác.`)) return
    setDeletingUser(userId)
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Lỗi không xác định')
      setAllProfiles(prev => prev.filter(p => p.id !== userId))
      await writeAudit('delete', 'user', userId, `Xoá tài khoản: ${name}`)
      toast(`Đã xoá tài khoản ${name}`)
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Xoá tài khoản thất bại', 'error')
    } finally {
      setDeletingUser(null)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3d1f0a] mb-4">👥 Quản lý người dùng</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { role: 'admin', label: ROLE_LABELS['admin'], count: roleCounts.admin },
          { role: 'manager', label: ROLE_LABELS['manager'], count: roleCounts.manager },
          { role: 'staff', label: ROLE_LABELS['staff'], count: roleCounts.staff },
        ].map(({ role, label, count }) => (
          <div key={role} className="bg-[#fffaf4] rounded-xl p-4 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)] text-center">
            <div className="text-2xl font-bold text-[#c8773a]">{count}</div>
            <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleClass(role)}`}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#fffaf4] rounded-2xl p-5 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <div className="flex gap-2 mb-3 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm tên..."
            className="flex-1 min-w-[160px] px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-xs bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-xs bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none"
          >
            <option value="">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="manager">Quản lý</option>
            <option value="staff">Nhân viên</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#8b5e3c]">Không tìm thấy người dùng nào</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#f0e8d8]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Người dùng</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Vai trò</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Ngày tạo</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? '' : 'bg-[#fdf6ec]'}>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#c8773a] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                          {initials(p.full_name)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#3d1f0a]">{p.full_name}</div>
                          {p.id === profile?.id && (
                            <div className="text-[10px] text-[#c8773a] font-medium">Bạn</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleClass(p.role)}`}>
                        {ROLE_LABELS[p.role] || p.role}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-xs text-[#8b5e3c]">
                      {fmtTs(p.created_at)}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                      <div className="flex items-center gap-2 flex-wrap">
                        {profile?.role === 'admin' && (
                          <button
                            onClick={() => openEdit(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-[1.5px] border-[#f5e6cc] bg-white text-[#8b5e3c] text-xs font-medium cursor-pointer hover:border-[#c8773a] hover:text-[#c8773a] transition-all whitespace-nowrap"
                          >
                            ✏️ Sửa
                          </button>
                        )}
                        {p.id !== profile?.id ? (
                          <>
                            <button
                              onClick={() => handleSendReset(p.id, p.full_name)}
                              disabled={sendingReset === p.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-[1.5px] border-[#f5e6cc] bg-white text-[#8b5e3c] text-xs font-medium cursor-pointer hover:border-[#c8773a] hover:text-[#c8773a] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {sendingReset === p.id ? '⏳ Đang gửi...' : '✉️ Reset mật khẩu'}
                            </button>
                            {profile?.role === 'admin' && (
                              <button
                                onClick={() => handleDelete(p.id, p.full_name)}
                                disabled={deletingUser === p.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-[1.5px] border-[#f5c6c0] bg-white text-[#c0392b] text-xs font-medium cursor-pointer hover:bg-[#fde8e5] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                {deletingUser === p.id ? '⏳ Đang xoá...' : '🗑 Xoá'}
                              </button>
                            )}
                          </>
                        ) : (
                          profile?.role !== 'admin' && <span className="text-xs text-[#8b5e3c] italic">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-2 text-right text-xs text-[#8b5e3c]">
          {filtered.length}/{allProfiles.length} người dùng
        </div>
      </div>

      {/* Slide-over: Sửa thông tin user */}
      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => !savingEdit && setEditing(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md h-full bg-[#fffaf4] shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#3d1f0a]">✏️ Sửa người dùng</h3>
                <button
                  onClick={() => setEditing(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8b5e3c] hover:bg-[#f5e6cc] transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Avatar + role */}
              <div className="flex items-center gap-3 mb-5 p-3 bg-white rounded-xl border border-[#f5e6cc]">
                <div className="w-10 h-10 rounded-full bg-[#c8773a] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {initials(editing.full_name)}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#3d1f0a]">{editing.full_name}</div>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${roleClass(editing.role)}`}>
                    {ROLE_LABELS[editing.role] || editing.role}
                  </span>
                </div>
              </div>

              {/* Tên hiển thị */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-[#8b5e3c] mb-1.5">Tên hiển thị</label>
                <input
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Họ và tên"
                  className="w-full px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
                />
              </div>

              {/* Email đăng nhập */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-[#8b5e3c] mb-1.5">
                  Email đăng nhập {loadingEmail && <span className="text-[#c8773a]">(đang tải...)</span>}
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder={loadingEmail ? 'Đang tải email...' : 'email@example.com'}
                  disabled={loadingEmail}
                  className="w-full px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors disabled:bg-[#f5f0e8]"
                />
                <p className="text-[10px] text-[#8b5e3c]/70 mt-1">Đây là tên đăng nhập của nhân viên. Đổi email = đổi tên đăng nhập.</p>
              </div>

              {/* Mật khẩu mới */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-[#8b5e3c] mb-1.5">Mật khẩu mới</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Để trống nếu không đổi"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
                />
                <p className="text-[10px] text-[#8b5e3c]/70 mt-1">Tối thiểu 6 ký tự. Nhập mật khẩu mới sẽ đặt lại trực tiếp (không cần email).</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit || loadingEmail}
                  className="flex-1 py-2.5 rounded-lg bg-[#c8773a] text-white text-sm font-medium hover:bg-[#b06830] transition-colors disabled:opacity-50"
                >
                  {savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  disabled={savingEdit}
                  className="px-4 py-2.5 rounded-lg border-[1.5px] border-[#f5e6cc] text-[#8b5e3c] text-sm font-medium hover:bg-white transition-colors disabled:opacity-50"
                >
                  Huỷ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
