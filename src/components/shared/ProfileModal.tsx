'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { initials, roleClass } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'

interface ProfileModalProps {
  onClose: () => void
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { profile, sb, toast, writeAudit } = useApp()
  const [name, setName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [pwMode, setPwMode] = useState(false)
  const [pw, setPw] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')

  const handleSaveName = async () => {
    if (!name.trim() || !profile) return
    setSaving(true)
    const { error } = await sb.from('profiles').update({ full_name: name.trim() }).eq('id', profile.id)
    if (!error) {
      await writeAudit('update', 'profiles', profile.id, 'Cập nhật tên')
      toast('Đã cập nhật tên')
      onClose()
    } else {
      toast('Lỗi cập nhật', 'error')
    }
    setSaving(false)
  }

  const handleChangePw = async () => {
    if (pw.length < 6) { toast('Mật khẩu tối thiểu 6 ký tự', 'error'); return }
    if (pw !== pwConfirm) { toast('Mật khẩu không khớp', 'error'); return }
    setSaving(true)
    const { error } = await sb.auth.updateUser({ password: pw })
    if (!error) {
      toast('Đã đổi mật khẩu')
      setPwMode(false)
      setPw('')
      setPwConfirm('')
    } else {
      toast('Lỗi đổi mật khẩu: ' + error.message, 'error')
    }
    setSaving(false)
  }

  if (!profile) return null

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] z-[950] flex items-center justify-center p-5" onClick={onClose}>
      <div
        className="bg-[#fffaf4] rounded-2xl p-6 w-full max-w-sm border border-[#f5e6cc] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-[#c8773a] text-white text-lg font-bold flex items-center justify-center">
            {initials(profile.full_name)}
          </div>
          <div>
            <div className="font-semibold text-[#3d1f0a]">{profile.full_name}</div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleClass(profile.role)}`}>
              {ROLE_LABELS[profile.role] || profile.role}
            </span>
          </div>
        </div>

        {!pwMode ? (
          <>
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Tên hiển thị</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveName}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-[#c8773a] to-[#e8a44a] text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-all disabled:opacity-50"
              >
                Lưu tên
              </button>
              <button
                onClick={() => setPwMode(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border-[1.5px] border-[#f5e6cc] text-[#8b5e3c] text-xs font-medium cursor-pointer hover:border-[#c8773a] hover:text-[#c8773a] transition-all"
              >
                Đổi mật khẩu
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border-[1.5px] border-[#f5e6cc] text-[#8b5e3c] text-xs font-medium cursor-pointer hover:border-[#c8773a] hover:text-[#c8773a] transition-all ml-auto"
              >
                Đóng
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-3">
              <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Mật khẩu mới</label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Xác nhận mật khẩu</label>
              <input
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleChangePw}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-[#c8773a] to-[#e8a44a] text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-all disabled:opacity-50"
              >
                Đổi mật khẩu
              </button>
              <button
                onClick={() => { setPwMode(false); setPw(''); setPwConfirm('') }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border-[1.5px] border-[#f5e6cc] text-[#8b5e3c] text-xs font-medium cursor-pointer hover:border-[#c8773a] hover:text-[#c8773a] transition-all"
              >
                Hủy
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
