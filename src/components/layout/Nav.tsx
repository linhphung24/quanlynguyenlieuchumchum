'use client'

import { useApp } from '@/contexts/AppContext'
import { PageName } from '@/types'

interface NavProps {
  current: PageName
  onChange: (page: PageName) => void
}

const NAV_ITEMS: { id: PageName; label: string; icon: string; minRole?: 'manager' | 'admin' }[] = [
  { id: 'recipes', label: 'Công thức', icon: '📖' },
  { id: 'calc', label: 'Tính nhanh', icon: '🧮' },
  { id: 'log', label: 'Nhật ký', icon: '📅' },
  { id: 'invoices', label: 'Hoá đơn', icon: '🧾' },
  { id: 'summary', label: 'Tổng kết', icon: '📊' },
  { id: 'products', label: 'Sản phẩm', icon: '📦' },
  { id: 'users', label: 'Người dùng', icon: '👥', minRole: 'manager' },
  { id: 'admin', label: 'Quản trị', icon: '⚙️', minRole: 'admin' },
]

export default function Nav({ current, onChange }: NavProps) {
  const { profile } = useApp()

  const items = NAV_ITEMS.filter((item) => {
    if (item.minRole === 'admin' && profile?.role !== 'admin') return false
    if (item.minRole === 'manager' && profile?.role !== 'admin' && profile?.role !== 'manager') return false
    return true
  })

  return (
    <nav className="bg-[#fffaf4] border-b border-[#f5e6cc] px-3 py-2 overflow-x-auto">
      <div className="flex gap-1.5 min-w-max">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`px-3.5 py-2 rounded-full border-2 text-xs font-medium cursor-pointer whitespace-nowrap transition-all ${
              current === item.id
                ? 'bg-[#c8773a] text-white border-[#c8773a] shadow-[0_3px_10px_rgba(200,119,58,0.27)]'
                : 'border-[#f5e6cc] bg-white text-[#8b5e3c] hover:border-[#c8773a] hover:text-[#c8773a]'
            }`}
          >
            <span className="mr-1">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
