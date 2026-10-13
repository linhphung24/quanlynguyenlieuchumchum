import { PageName } from '@/types';

export const UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'muỗng cà phê',
  'muỗng canh',
  'chén',
  'quả/cái',
  'gói',
  'hộp',
  'túi',
];

export const MONTHS_VN = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  manager: 'Quản lý',
  ketoan: 'Kế toán',
  thukho: 'Thủ kho',
  staff: 'Nhân viên',
};

export const ACTION_LABELS: Record<string, string> = {
  create: 'Tạo mới',
  update: 'Cập nhật',
  delete: 'Xóa',
  login: 'Đăng nhập',
  logout: 'Đăng xuất',
  approve: 'Duyệt',
  reject: 'Từ chối',
};

export const ASSIGNABLE_PAGES: {
  id: PageName;
  label: string;
  icon: string;
  section: string;
}[] = [
  { id: 'invoices', label: 'Chứng từ kho', icon: '📥', section: 'Quản lý Nhập Xuất' },
  { id: 'batches', label: 'Lô hàng FIFO', icon: '🏷️', section: 'Quản lý Nhập Xuất' },
  { id: 'stock-opening', label: 'Tồn đầu kỳ', icon: '📝', section: 'Quản lý Nhập Xuất' },
  { id: 'reports', label: 'Tổng hợp NXT', icon: '📊', section: 'Quản lý Nhập Xuất' },
  { id: 'vouchers', label: 'Thu chi tiền mặt', icon: '💵', section: 'Quản lý Thu Chi' },
  { id: 'recipes', label: 'Công thức bánh', icon: '🥖', section: 'Sản xuất & Định mức' },
  { id: 'calc', label: 'Tính định mức mẻ', icon: '⊞', section: 'Sản xuất & Định mức' },
  { id: 'pos-tables', label: 'Sơ đồ Bàn & POS', icon: '🏪', section: 'Bán hàng & POS' },
  { id: 'pos-menu', label: 'Menu Bánh & Đồ uống', icon: '🥐', section: 'Bán hàng & POS' },
  { id: 'pos-shifts', label: 'Chốt ca & Doanh thu', icon: '💰', section: 'Bán hàng & POS' },
  { id: 'pos-receipt-template', label: 'Mẫu hóa đơn POS', icon: '🧾', section: 'Bán hàng & POS' },
  { id: 'pos-payment-settings', label: 'Cấu hình Ngân hàng QR', icon: '🏦', section: 'Bán hàng & POS' },
  { id: 'products', label: 'Kho hàng / SP', icon: '📦', section: 'Danh mục & Hệ thống' },
  { id: 'suppliers', label: 'Nhà cung cấp', icon: '🏢', section: 'Danh mục & Hệ thống' },
  { id: 'company-info', label: 'Thông tin đơn vị', icon: '🏬', section: 'Danh mục & Hệ thống' },
  { id: 'users', label: 'Người dùng', icon: '👥', section: 'Danh mục & Hệ thống' },
  { id: 'permissions', label: 'Phân quyền', icon: '🔑', section: 'Danh mục & Hệ thống' },
  { id: 'audit-log', label: 'Nhật ký', icon: '📜', section: 'Danh mục & Hệ thống' },
];
