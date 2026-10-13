'use client';

import React from 'react';
import { useApp } from '@/contexts/AppContext';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  'accounting-dashboard': {
    title: 'Tổng quan Tài chính & Kế toán',
    subtitle: 'Bảng điều khiển dòng tiền, thu chi tiền mặt, tổng công nợ và giá trị tồn kho',
  },
  invoices: {
    title: 'Chứng từ Kho',
    subtitle: 'Quản lý phiếu nhập / xuất kho, phê duyệt và phân bổ FIFO (Mẫu 01-VT / 02-VT)',
  },
  batches: {
    title: 'Quản lý Lô hàng FIFO',
    subtitle: 'Theo dõi hạn sử dụng, số dư tồn theo từng lô và tính toán giá trị FIFO',
  },
  vouchers: {
    title: 'Phiếu Thu / Chi Tiền Mặt',
    subtitle: 'Quản lý sổ quỹ tiền mặt và định khoản kép (Mẫu 01-TT / 02-TT TT 132/2018/TT-BTC)',
  },
  'cash-report': {
    title: 'Báo Cáo Sổ Quỹ Tiền Mặt',
    subtitle: 'Tổng hợp thu chi và số dư tồn quỹ tiền mặt theo kỳ (Mẫu số S11-DN TT 132/2018/TT-BTC)',
  },
  debts: {
    title: 'Báo Cáo Công Nợ Khách Hàng Đầu Vào & Nhà Cung Cấp',
    subtitle: 'Theo dõi tổng hợp và chi tiết công nợ phải trả (TK 331), đối soát tiền hàng và số dư đầu kỳ',
  },
  'stock-opening': {
    title: 'Khai báo Tồn Đầu Kỳ',
    subtitle: 'Khai báo tồn kho đầu kỳ, kiểm soát đếm đôi và đồng bộ lô',
  },
  reports: {
    title: 'Báo cáo Tổng hợp Nhập - Xuất - Tồn',
    subtitle: 'Bảng tổng hợp tồn kho, biến động nhập xuất và giá trị tồn theo kỳ',
  },
  products: {
    title: 'Danh mục Sản phẩm & Nguyên vật liệu',
    subtitle: 'Quản lý danh sách nguyên vật liệu, định giá vốn và cảnh báo tồn tối thiểu',
  },
  recipes: {
    title: 'Công thức Bánh & Định mức (BOM)',
    subtitle: 'Định mức nguyên vật liệu sản xuất cho từng dòng bánh',
  },
  calc: {
    title: 'Máy tính Định mức Sản xuất',
    subtitle: 'Tính toán tổng nguyên liệu cần chuẩn bị theo số lượng mẻ bánh sản xuất',
  },
  suppliers: {
    title: 'Danh mục Nhà Cung Cấp',
    subtitle: 'Danh bạ đối tác cung cấp nguyên vật liệu và liên hệ',
  },
  'company-info': {
    title: 'Thông tin Doanh nghiệp',
    subtitle: 'Cấu hình tên đơn vị, địa chỉ, mã số thuế hiển thị khi in chứng từ',
  },
  users: {
    title: 'Quản lý Tài khoản Người dùng',
    subtitle: 'Danh sách tài khoản người dùng và phân quyền truy cập',
  },
  permissions: {
    title: 'Ma trận Phân quyền Hệ thống',
    subtitle: 'Cấu hình chi tiết quyền Xem, Thêm, Sửa, Xóa cho từng vai trò',
  },
  'audit-log': {
    title: 'Nhật ký Hoạt động Hệ thống',
    subtitle: 'Lịch sử thao tác tạo, sửa, xóa chứng từ và số liệu kho',
  },
  'pos-tables': {
    title: 'Sơ đồ Bàn & Quầy Bán Hàng (POS)',
    subtitle: 'Quản lý bàn theo tầng, order món, in bill tạm và thanh toán VietQR tự động',
  },
  'pos-menu': {
    title: 'Menu Bánh & Đồ Uống',
    subtitle: 'Quản lý danh mục món bánh, đồ uống tại quầy và cấu hình định mức trừ kho nguyên vật liệu',
  },
  'pos-receipt-template': {
    title: 'Thiết Kế Mẫu In Hóa Đơn (K80 / K57)',
    subtitle: 'Tùy chỉnh nội dung in nhiệt, logo, WiFi, QR và xem trước trực quan WYSIWYG',
  },
  'pos-payment-settings': {
    title: 'Cấu Hình Ngân Hàng & Thanh Toán VietQR',
    subtitle: 'Cài đặt số tài khoản nhận tiền, ngân hàng thụ hưởng, mã QR động và nội dung chuyển khoản tự động',
  },
  'pos-shifts': {
    title: 'Quản Lý Ca & Báo Cáo Chốt Ca',
    subtitle: 'Mở ca, kiểm đếm két tiền thực tế, đối soát thừa thiếu và in báo cáo bàn giao Z-Report',
  },
};

export default function Header() {
  const { activePage, user, logout, loading, currentModule, setCurrentModule, canSwitchModule } = useApp();
  const pageInfo = PAGE_TITLES[activePage] || {
    title: 'Quản lý Chum Chum Bakery',
    subtitle: 'Hệ thống quản lý tiệm bánh',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between select-none shadow-sm print:hidden no-print">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-800 leading-none flex items-center gap-2">
            <span>{pageInfo.title}</span>
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-amber-500/30 border-t-amber-600 rounded-full animate-spin" />
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{pageInfo.subtitle}</p>
        </div>
      </div>

      {/* Center: Module Switcher */}
      <div className="flex items-center">
        {canSwitchModule ? (
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/90 shadow-inner gap-0.5">
            <button
              onClick={() => setCurrentModule('pos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentModule === 'pos'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>☕</span>
              <span>Bán hàng (POS)</span>
            </button>
            <button
              onClick={() => setCurrentModule('warehouse')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentModule === 'warehouse'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>📦</span>
              <span>Phân hệ Kho</span>
            </button>
            <button
              onClick={() => setCurrentModule('accounting')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentModule === 'accounting'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>💼</span>
              <span>Phân hệ Kế toán</span>
            </button>
          </div>
        ) : (
          <div
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border shadow-xs ${
              currentModule === 'pos'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : currentModule === 'warehouse'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}
          >
            <span>{currentModule === 'pos' ? '☕' : currentModule === 'warehouse' ? '📦' : '💼'}</span>
            <span>
              {currentModule === 'pos'
                ? 'Phân hệ Bán hàng (POS)'
                : currentModule === 'warehouse'
                ? 'Phân hệ Quản lý Kho'
                : 'Phân hệ Kế toán - Tài chính'}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono">VPS: 103.163.214.101</span>
        </div>

        <button
          onClick={logout}
          title="Đăng xuất"
          className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 text-xs transition-colors flex items-center gap-1.5 font-medium"
        >
          <span>🚪</span>
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
