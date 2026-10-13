/**
 * Danh mục hệ thống tài khoản kế toán áp dụng cho Quản lý kho & Quỹ tiệm bánh Chum Chum
 * Giúp người dùng nhìn rõ Tên tài khoản tiếng Việt thay vì phải ghi nhớ mã số kế toán
 */

export interface AccountItem {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  description?: string;
}

export const ACCOUNT_LIST: AccountItem[] = [
  { code: '111', name: 'Tiền mặt tại két', type: 'asset', description: 'Tiền mặt sẵn có tại cửa hàng' },
  { code: '112', name: 'Tiền gửi ngân hàng', type: 'asset', description: 'Tài khoản ngân hàng / Quét mã QR' },
  { code: '131', name: 'Phải thu khách hàng', type: 'asset', description: 'Khách hàng đặt bánh nợ tiền' },
  { code: '141', name: 'Tạm ứng', type: 'asset', description: 'Nhân viên tạm ứng mua hàng' },
  { code: '152', name: 'Kho nguyên vật liệu', type: 'asset', description: 'Bột, bơ, đường, sữa, trứng, phô mai...' },
  { code: '153', name: 'Công cụ dụng cụ', type: 'asset', description: 'Khuôn bánh, khay nướng, dao cắt, đui bắt kem' },
  { code: '154', name: 'Chi phí làm bánh (SX dở dang)', type: 'asset', description: 'Nguyên liệu đang nhào bột, ủ, nướng ở xưởng' },
  { code: '156', name: 'Hàng hóa / Bánh thành phẩm', type: 'asset', description: 'Bánh đã làm xong bày bán tại quầy' },
  { code: '211', name: 'Tài sản cố định', type: 'asset', description: 'Lò nướng lớn, tủ ủ, tủ đông công nghiệp' },
  { code: '331', name: 'Phải trả nhà cung cấp', type: 'liability', description: 'Nợ tiền hàng đại lý bột, bơ, phụ liệu' },
  { code: '334', name: 'Phải trả lương nhân viên', type: 'liability', description: 'Tiền lương thợ bánh, nhân viên bán hàng' },
  { code: '338', name: 'Phải trả, phải nộp khác', type: 'liability', description: 'Các khoản phải chi trả khác' },
  { code: '511', name: 'Doanh thu bán bánh', type: 'revenue', description: 'Doanh thu từ bán bánh lẻ, sỉ, nhận đặt tiệc' },
  { code: '621', name: 'Chi phí nguyên vật liệu trực tiếp', type: 'expense', description: 'Chi phí bột, bơ, kem đưa vào mẻ bánh' },
  { code: '622', name: 'Chi phí nhân công thợ bánh', type: 'expense', description: 'Công thợ trực tiếp nhào bột, nướng bánh' },
  { code: '627', name: 'Chi phí sản xuất chung', type: 'expense', description: 'Tiền điện lò nướng, gas, nước xưởng bánh' },
  { code: '641', name: 'Chi phí bán hàng & bao bì', type: 'expense', description: 'Hộp bánh, túi bóng, ruy băng, tem nhãn' },
  { code: '642', name: 'Chi phí quản lý & mặt bằng', type: 'expense', description: 'Tiền thuê mặt bằng tiệm, văn phòng phẩm' },
  { code: '811', name: 'Chi phí khác', type: 'expense', description: 'Chi phí phát sinh ngoài hoạt động chính' },
];

/**
 * Trả về chuỗi kết hợp: "111 - Tiền mặt tại két"
 */
export function getAccountLabel(code?: string): string {
  if (!code) return '—';
  const c = code.trim();
  const found = ACCOUNT_LIST.find((a) => a.code === c);
  if (found) {
    return `${found.code} - ${found.name}`;
  }
  return c;
}

/**
 * Chỉ lấy tên tiếng Việt: "Tiền mặt tại két"
 */
export function getAccountName(code?: string): string {
  if (!code) return '';
  const c = code.trim();
  const found = ACCOUNT_LIST.find((a) => a.code === c);
  return found ? found.name : '';
}
