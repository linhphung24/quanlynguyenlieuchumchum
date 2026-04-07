'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { initials, roleClass, fmtTs } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'

export default function UsersPage() {
  const { profile, allProfiles, setAllProfiles, toast, writeAudit } = useApp()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [sendingReset, setSendingReset] = useState<string | null>(null)
  const [deletingUser, setDeletingUser] = useState<string | null>(null)

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
                      {p.id !== profile?.id ? (
                        <div className="flex items-center gap-2 flex-wrap">
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
                        </div>
                      ) : (
                        <span className="text-xs text-[#8b5e3c] italic">—</span>
                      )}
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
    </div>
  )
}
