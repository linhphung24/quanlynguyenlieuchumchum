'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { AuditLog } from '@/types'
import { initials, roleClass, fmtTs } from '@/lib/utils'
import { ROLE_LABELS, ACTION_LABELS } from '@/lib/constants'

export default function AdminPage() {
  const { sb, profile, allProfiles, toast } = useApp()

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [filterAction, setFilterAction] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const [auditLoading, setAuditLoading] = useState(false)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  useEffect(() => {
    loadAuditLogs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadAuditLogs = async () => {
    setAuditLoading(true)
    const { data } = await sb.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200)
    if (data) setAuditLogs(data as AuditLog[])
    setAuditLoading(false)
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (profile?.role !== 'admin') { toast('Chỉ admin mới có quyền này', 'error'); return }
    setUpdatingRole(userId)
    const { error } = await sb.from('profiles').update({ role: newRole }).eq('id', userId)
    if (!error) {
      toast('Đã cập nhật vai trò')
    } else {
      toast('Lỗi cập nhật: ' + error.message, 'error')
    }
    setUpdatingRole(null)
  }

  const filteredLogs = auditLogs.filter(l => {
    if (filterAction && l.action !== filterAction) return false
    if (filterUser && !l.user_name.toLowerCase().includes(filterUser.toLowerCase())) return false
    if (filterEntity && l.entity !== filterEntity) return false
    return true
  })

  const uniqueEntities = [...new Set(auditLogs.map(l => l.entity))]

  const actionBadgeClass = (action: string) => {
    switch (action) {
      case 'create': return 'bg-[#d4f5e3] text-[#1e7a4a]'
      case 'update': return 'bg-[#ddeaf8] text-[#2563a8]'
      case 'delete': return 'bg-[#fde8e5] text-[#c0392b]'
      case 'login': return 'bg-[#fdf0e0] text-[#c8773a]'
      case 'logout': return 'bg-[#f5e6cc] text-[#8b5e3c]'
      default: return 'bg-[#f5e6cc] text-[#8b5e3c]'
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-[#fffaf4] rounded-2xl p-8 text-center border border-[#f5e6cc]">
          <div className="text-4xl mb-2">🔒</div>
          <p className="text-sm text-[#8b5e3c]">Bạn không có quyền truy cập trang này</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3d1f0a] mb-4">⚙️ Quản trị hệ thống</h2>

      {/* Users table */}
      <div className="bg-[#fffaf4] rounded-2xl p-5 mb-4 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <h3 className="text-sm font-semibold text-[#3d1f0a] mb-3">👥 Danh sách người dùng</h3>
        <div className="overflow-x-auto rounded-lg border border-[#f0e8d8]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Người dùng</th>
                <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Vai trò</th>
                <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Đổi vai trò</th>
                <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {allProfiles.map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? '' : 'bg-[#fdf6ec]'}>
                  <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#c8773a] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                        {initials(p.full_name)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#3d1f0a]">{p.full_name}</div>
                        <div className="text-xs text-[#8b5e3c]">{p.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleClass(p.role)}`}>
                      {ROLE_LABELS[p.role] || p.role}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                    {p.id !== profile.id ? (
                      <select
                        value={p.role}
                        onChange={e => handleRoleChange(p.id, e.target.value)}
                        disabled={updatingRole === p.id}
                        className="px-2 py-1 border-[1.5px] border-[#f5e6cc] rounded text-xs bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none disabled:opacity-50"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Quản lý</option>
                        <option value="staff">Nhân viên</option>
                      </select>
                    ) : (
                      <span className="text-xs text-[#8b5e3c] italic">Bạn</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-xs text-[#8b5e3c]">
                    {fmtTs(p.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit log */}
      <div className="bg-[#fffaf4] rounded-2xl p-5 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#3d1f0a]">📋 Nhật ký hoạt động</h3>
          <button onClick={loadAuditLogs} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-[1.5px] border-[#f5e6cc] text-[#8b5e3c] text-xs font-medium cursor-pointer hover:border-[#c8773a] hover:text-[#c8773a] transition-all">
            ↻ Làm mới
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <input
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            placeholder="Lọc người dùng..."
            className="px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-xs bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
          />
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className="px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-xs bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none">
            <option value="">Tất cả hành động</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}
            className="px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-xs bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none">
            <option value="">Tất cả đối tượng</option>
            {uniqueEntities.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        {auditLoading ? (
          <div className="text-center py-8 text-sm text-[#8b5e3c]">Đang tải...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#8b5e3c]">Không có nhật ký nào</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#f0e8d8]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Thời gian</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Người dùng</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Hành động</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Đối tượng</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l, i) => (
                  <tr key={l.id} className={i % 2 === 0 ? '' : 'bg-[#fdf6ec]'}>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-xs text-[#8b5e3c] whitespace-nowrap">{fmtTs(l.created_at)}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#c8773a] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                          {initials(l.user_name)}
                        </div>
                        <span className="text-xs text-[#3d1f0a]">{l.user_name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${actionBadgeClass(l.action)}`}>
                        {ACTION_LABELS[l.action] || l.action}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-xs text-[#8b5e3c]">{l.entity}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-xs text-[#8b5e3c] max-w-xs truncate">{l.detail || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
