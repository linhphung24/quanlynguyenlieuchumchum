'use client'

import { useApp } from '@/contexts/AppContext'
import { PageName } from '@/types'

const PAGE_META: Record<PageName, { title: string; subtitle: string }> = {
  products:  { title: 'Kho hàng',              subtitle: 'Quản lý sản phẩm & tồn kho' },
  invoices:  { title: 'Hoá đơn',               subtitle: 'Nhập / Xuất & theo dõi lô hàng' },
  summary:   { title: 'Tổng kết',              subtitle: 'Báo cáo tồn kho theo tháng' },
  recipes:   { title: 'Công thức',             subtitle: 'Quản lý công thức bánh' },
  calc:      { title: 'Tính nhanh',            subtitle: 'Tính nguyên liệu theo mẻ' },
  log:       { title: 'Nhật ký sản xuất',      subtitle: 'Ghi nhận sản lượng hàng ngày' },
  users:     { title: 'Người dùng',            subtitle: 'Quản lý tài khoản nhân viên' },
  admin:     { title: 'Quản trị hệ thống',     subtitle: 'Nhật ký thao tác & phân quyền' },
}

interface HeaderProps {
  currentPage: PageName
  onMenuClick: () => void
}

export default function Header({ currentPage, onMenuClick }: HeaderProps) {
  const { allProducts } = useApp()
  const meta = PAGE_META[currentPage]

  const lowStockCount = allProducts.filter(p => p.is_active && p.min_stock > 0 && p.stock_qty < p.min_stock).length

  return (
    <header className="bg-white/70 backdrop-blur-sm border-b border-[#e8ddd0] px-5 py-3 flex items-center gap-4 sticky top-0 z-40">

      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden flex flex-col gap-1 p-1.5 rounded-lg hover:bg-[#f5e6cc] transition-all cursor-pointer"
      >
        <span className="w-4.5 h-0.5 bg-[#3d1f0a] rounded-full block" style={{ width: 18 }} />
        <span className="w-4.5 h-0.5 bg-[#3d1f0a] rounded-full block" style={{ width: 14 }} />
        <span className="w-4.5 h-0.5 bg-[#3d1f0a] rounded-full block" style={{ width: 18 }} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-[#1a0f07] leading-tight truncate">{meta.title}</h1>
        <p className="text-[11px] text-[#8b5e3c]/70 leading-tight hidden sm:block">{meta.subtitle}</p>
      </div>

      {/* Low stock badge */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <span className="text-xs font-medium text-red-700">{lowStockCount} SP sắp hết</span>
        </div>
      )}

      {/* Date */}
      <div className="hidden lg:block text-right flex-shrink-0">
        <div className="text-xs font-medium text-[#3d1f0a]">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long' })}
        </div>
        <div className="text-[10px] text-[#8b5e3c]/70">
          {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>
      </div>
    </header>
  )
}
