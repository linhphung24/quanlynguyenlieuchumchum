'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { initials, roleClass } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'
import ProfileModal from '@/components/shared/ProfileModal'

export default function Header() {
  const { profile, logout } = useApp()
  const [showProfile, setShowProfile] = useState(false)

  return (
    <>
      <header className="bg-[#fffaf4] border-b border-[#f5e6cc] px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥐</span>
          <span className="font-['Playfair_Display'] text-lg font-bold text-[#3d1f0a]">Chum Chum Bakery</span>
        </div>
        <div className="flex items-center gap-3">
          {profile && (
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[#fef4e8] transition-all cursor-pointer bg-transparent border-none"
            >
              <div className="w-6 h-6 rounded-full bg-[#c8773a] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {initials(profile.full_name)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-medium text-[#3d1f0a] leading-tight">{profile.full_name}</div>
                <div className={`inline-block px-1.5 py-px rounded-full text-[10px] font-medium ${roleClass(profile.role)}`}>
                  {ROLE_LABELS[profile.role] || profile.role}
                </div>
              </div>
            </button>
          )}
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-[1.5px] border-[#f5e6cc] text-[#8b5e3c] text-xs font-medium cursor-pointer hover:border-[#c8773a] hover:text-[#c8773a] transition-all"
            title="Đăng xuất"
          >
            <span className="hidden sm:inline">Đăng xuất</span>
            <span>↩</span>
          </button>
        </div>
      </header>
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  )
}
