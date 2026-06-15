export const UNITS = [
  'g', 'kg', 'ml', 'l',
  'muỗng cà phê', 'muỗng canh', 'chén',
  'quả/cái', 'gói', 'hộp', 'túi'
]

export const MONTHS_VN = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
]

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Quản lý',
  staff: 'Nhân viên',
}

export const ACTION_LABELS: Record<string, string> = {
  create: 'Tạo mới',
  update: 'Cập nhật',
  delete: 'Xoá',
  login: 'Đăng nhập',
  logout: 'Đăng xuất',
}

// ── Phân quyền tab cho nhóm user ──────────────────────────────
// Các trang có thể gán cho nhóm. ('admin' & 'groups' luôn chỉ dành cho admin)
import { PageName } from '@/types'

export const ASSIGNABLE_PAGES: { id: PageName; label: string; icon: string; section: string }[] = [
  { id: 'products',  label: 'Kho hàng',     icon: '▦',   section: 'Kho & Bán hàng' },
  { id: 'invoices',  label: 'Hoá đơn',      icon: '≡',   section: 'Kho & Bán hàng' },
  { id: 'reports',   label: 'Báo cáo',      icon: '📑',  section: 'Kho & Bán hàng' },
  { id: 'recipes',   label: 'Công thức',    icon: '✦',   section: 'Sản xuất' },
  { id: 'calc',      label: 'Tính nhanh',   icon: '⊞',   section: 'Sản xuất' },
  { id: 'log',       label: 'Nhật ký',      icon: '◎',   section: 'Sản xuất' },
  { id: 'channels',  label: 'Inbox kênh',   icon: '💬',  section: 'Khách hàng' },
  { id: 'personnel', label: 'Nhân sự',      icon: '👩‍💼', section: 'Hệ thống' },
  { id: 'units',     label: 'Đơn vị tính',  icon: '📐',  section: 'Hệ thống' },
  { id: 'users',     label: 'Người dùng',   icon: '◉',   section: 'Hệ thống' },
]

// Quyền mặc định theo role khi user CHƯA được gán vào nhóm nào.
// Giữ nguyên hành vi cũ (minRole) để không phá vỡ tài khoản hiện có.
export function defaultPagesForRole(role: string): PageName[] {
  const base: PageName[] = ['products', 'invoices', 'reports', 'recipes', 'calc', 'log', 'channels']
  if (role === 'admin' || role === 'manager') {
    return [...base, 'personnel', 'units', 'users']
  }
  return base
}
