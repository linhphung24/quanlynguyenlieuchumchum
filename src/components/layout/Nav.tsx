'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { PageName } from '@/types'
import { initials, roleClass } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'
import ProfileModal from '@/components/shared/ProfileModal'

interface NavProps {
  current: PageName
  onChange: (page: PageName) => void
}

type NavItem = { id: PageName; label: string; icon: string; minRole?: 'manager' | 'admin' }
type NavGroup = { label: string; minRole?: 'manager' | 'admin'; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Kho & Bán hàng',
    items: [
      { id: 'products' as PageName,  label: 'Kho hàng',       icon: '▦' },
      { id: 'invoices' as PageName,  label: 'Hoá đơn',        icon: '≡' },
      { id: 'summary'  as PageName,  label: 'Tổng kết',       icon: '◈' },
    ],
  },
  {
    label: 'Sản xuất',
    items: [
      { id: 'recipes' as PageName,   label: 'Công thức',      icon: '✦' },
      { id: 'calc'    as PageName,   label: 'Tính nhanh',     icon: '⊞' },
      { id: 'log'     as PageName,   label: 'Nhật ký',        icon: '◎' },
    ],
  },
  {
    label: 'Hệ thống',
    minRole: 'manager' as const,
    items: [
      { id: 'personnel' as PageName, label: 'Nhân sự',        icon: '👩‍💼', minRole: 'manager' as const },
      { id: 'units'     as PageName, label: 'Đơn vị tính',   icon: '📐', minRole: 'manager' as const },
      { id: 'users'     as PageName, label: 'Người dùng',     icon: '◉',  minRole: 'manager' as const },
      { id: 'admin'     as PageName, label: 'Quản trị',       icon: '⚙',  minRole: 'admin'   as const },
    ],
  },
]

export default function Nav({ current, onChange }: NavProps) {
  const { profile, logout } = useApp()
  const [showProfile, setShowProfile] = useState(false)

  const canSee = (minRole?: 'manager' | 'admin') => {
    if (!minRole) return true
    if (minRole === 'admin')   return profile?.role === 'admin'
    if (minRole === 'manager') return profile?.role === 'admin' || profile?.role === 'manager'
    return true
  }

  return (
    <>
      <aside className="w-56 bg-[#1a0f07] flex flex-col h-screen sticky top-0 overflow-y-auto">

        {/* Logo */}
        <div className="px-4 pt-5 pb-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c8773a] to-[#e8a44a] flex items-center justify-center text-base flex-shrink-0 shadow-lg">
              🥐
            </div>
            <div>
              <div className="font-['Playfair_Display'] text-sm font-bold text-white leading-tight">Chum Chum</div>
              <div className="text-[10px] text-white/40 leading-tight">Bakery Management</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-3 space-y-4">
          {NAV_GROUPS.map(group => {
            const visibleItems = group.items.filter(it => canSee(it.minRole))
            if (visibleItems.length === 0) return null
            return (
              <div key={group.label}>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-white/30 px-3 mb-1.5">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const active = current === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => onChange(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all text-left ${
                          active
                            ? 'bg-[#c8773a] text-white shadow-[0_2px_16px_rgba(200,119,58,0.35)]'
                            : 'text-white/55 hover:text-white hover:bg-white/6'
                        }`}
                      >
                        <span className={`text-[15px] flex-shrink-0 ${active ? 'text-white' : 'text-white/40'}`}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* User section */}
        {profile && (
          <div className="p-2.5 border-t border-white/8">
            <button
              onClick={() => setShowProfile(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/6 transition-all cursor-pointer mb-1"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#c8773a] to-[#e8a44a] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {initials(profile.full_name)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-medium text-white/90 truncate leading-tight">{profile.full_name}</div>
                <div className={`text-[10px] leading-tight ${roleClass(profile.role)}`}>
                  {ROLE_LABELS[profile.role] || profile.role}
                </div>
              </div>
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/40 hover:text-white/70 text-xs cursor-pointer transition-all hover:bg-white/5"
            >
              <span>↩</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        )}
      </aside>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  )
}
