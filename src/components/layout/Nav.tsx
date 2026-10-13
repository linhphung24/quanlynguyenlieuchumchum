'use client';

import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { PageName } from '@/types';

interface NavSection {
  title: string;
  items: {
    id: PageName;
    label: string;
    icon: string;
    badge?: string;
  }[];
}

export default function Nav() {
  const { activePage, setActivePage, canAccess, user, currentModule } = useApp();

  const warehouseSections: NavSection[] = [
    {
      title: 'Nghiệp vụ Kho',
      items: [
        { id: 'invoices', label: 'Phiếu Nhập / Xuất kho', icon: '📥' },
        { id: 'batches', label: 'Lô hàng FIFO & HSD', icon: '🏷️' },
        { id: 'stock-opening', label: 'Kiểm kê & Tồn đầu kỳ', icon: '📝' },
        { id: 'reports', label: 'Báo cáo Thẻ kho & Tồn', icon: '📊' },
      ],
    },
    {
      title: 'Sản xuất & Bếp',
      items: [
        { id: 'recipes', label: 'Công thức bánh', icon: '🥖' },
        { id: 'calc', label: 'Tính định mức mẻ', icon: '⊞' },
        { id: 'pos-menu', label: 'Menu Bán & Định mức', icon: '📋' },
      ],
    },
    {
      title: 'Danh mục Kho',
      items: [
        { id: 'products', label: 'Danh mục SP / NVL', icon: '📦' },
        { id: 'suppliers', label: 'Nhà cung cấp', icon: '🏢' },
        { id: 'company-info', label: 'Thông tin đơn vị', icon: '🏬' },
      ],
    },
  ];

  const accountingSections: NavSection[] = [
    {
      title: 'Bảng điều khiển',
      items: [
        { id: 'accounting-dashboard', label: 'Tổng quan Tài chính', icon: '📊' },
      ],
    },
    {
      title: 'Kế toán Mua hàng & Kho',
      items: [
        { id: 'invoices', label: 'Hóa đơn Mua hàng / Kho', icon: '🧾' },
        { id: 'reports', label: 'Tổng hợp NXT (Số lượng + Tiền)', icon: '📈' },
        { id: 'stock-opening', label: 'Khai báo Tồn đầu kỳ', icon: '📝' },
      ],
    },
    {
      title: 'Kế toán Tiền mặt & Công nợ',
      items: [
        { id: 'vouchers', label: 'Thu chi tiền mặt (PT/PC)', icon: '💵' },
        { id: 'cash-report', label: 'Báo cáo Sổ quỹ tiền mặt', icon: '📋' },
        { id: 'debts', label: 'Sổ công nợ NCC đầu vào (TK 331)', icon: '💳' },
      ],
    },
    {
      title: 'Danh mục & Đối tác',
      items: [
        { id: 'suppliers', label: 'Nhà cung cấp', icon: '🏢' },
        { id: 'products', label: 'Kho hàng & Giá vốn', icon: '📦' },
        { id: 'company-info', label: 'Thông tin doanh nghiệp', icon: '🏬' },
      ],
    },
    {
      title: 'Hệ thống & Phân quyền',
      items: [
        { id: 'users', label: 'Người dùng', icon: '👥' },
        { id: 'permissions', label: 'Phân quyền', icon: '🔑' },
        { id: 'audit-log', label: 'Nhật ký', icon: '📜' },
      ],
    },
  ];

  const posSections: NavSection[] = [
    {
      title: 'Bán hàng & Quầy Thu ngân',
      items: [
        { id: 'pos-tables', label: 'Sơ đồ Bàn & Bán hàng', icon: '🏪' },
      ],
    },
    {
      title: 'Thiết kế & Cấu hình',
      items: [
        { id: 'pos-payment-settings', label: 'Cấu hình Ngân hàng QR', icon: '🏦' },
        { id: 'pos-receipt-template', label: 'Thiết kế Mẫu Hóa đơn', icon: '🧾' },
      ],
    },
    {
      title: 'Vận hành Ca & Báo cáo',
      items: [
        { id: 'pos-shifts', label: 'Chốt ca & Doanh thu', icon: '💰' },
      ],
    },
    {
      title: 'Thực đơn & Menu',
      items: [
        { id: 'pos-menu', label: 'Menu Bánh & Đồ uống', icon: '🥐' },
      ],
    },
  ];

  const sections =
    currentModule === 'pos'
      ? posSections
      : currentModule === 'warehouse'
      ? warehouseSections
      : accountingSections;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col h-screen select-none shadow-sm print:hidden no-print">
      {/* Brand Header */}
      <div
        className={`p-4 border-b border-slate-100 flex items-center gap-3 ${
          currentModule === 'pos'
            ? 'bg-gradient-to-r from-rose-50/70 to-pink-50/50'
            : currentModule === 'warehouse'
            ? 'bg-gradient-to-r from-amber-50/60 to-orange-50/40'
            : 'bg-gradient-to-r from-indigo-50/60 to-slate-100/50'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md text-white ${
            currentModule === 'pos'
              ? 'bg-gradient-to-tr from-rose-500 to-rose-600 shadow-rose-500/25'
              : currentModule === 'warehouse'
              ? 'bg-gradient-to-tr from-amber-500 to-amber-600 shadow-amber-500/20'
              : 'bg-gradient-to-tr from-indigo-600 to-slate-800 shadow-indigo-600/20'
          }`}
        >
          {currentModule === 'pos' ? '☕' : currentModule === 'warehouse' ? '🥖' : '💼'}
        </div>
        <div>
          <h2 className="font-bold text-slate-800 text-sm tracking-wide leading-tight">
            CHUM CHUM
          </h2>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider block ${
              currentModule === 'pos'
                ? 'text-rose-700'
                : currentModule === 'warehouse'
                ? 'text-amber-700'
                : 'text-indigo-700'
            }`}
          >
            {currentModule === 'pos'
              ? 'Bán hàng (POS)'
              : currentModule === 'warehouse'
              ? 'Phân hệ Kho'
              : 'Phân hệ Kế toán'}
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5 custom-scrollbar">
        {sections.map((sec, secIdx) => {
          const visibleItems = sec.items.filter((item) => canAccess(item.id));
          if (visibleItems.length === 0) return null;

          return (
            <div key={secIdx}>
              <div className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? currentModule === 'pos'
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 font-semibold'
                            : currentModule === 'warehouse'
                            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 font-semibold'
                            : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-semibold'
                          : currentModule === 'pos'
                          ? 'text-slate-600 hover:bg-rose-50/70 hover:text-rose-900'
                          : currentModule === 'warehouse'
                          ? 'text-slate-600 hover:bg-amber-50/60 hover:text-amber-900'
                          : 'text-slate-600 hover:bg-indigo-50/60 hover:text-indigo-900'
                      }`}
                    >
                      <span className="text-base leading-none">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold ${
              currentModule === 'warehouse'
                ? 'bg-amber-100 border-amber-200 text-amber-800'
                : 'bg-indigo-100 border-indigo-200 text-indigo-800'
            }`}
          >
            {user?.FullName ? user.FullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user?.FullName || user?.Username}
            </p>
            <p className="text-[10px] text-slate-500 uppercase truncate font-medium">
              {user?.Role === 'admin'
                ? 'Quản trị viên'
                : user?.Role === 'manager'
                ? 'Quản lý'
                : user?.Role === 'ketoan' || user?.Role === 'accountant'
                ? 'Kế toán'
                : 'Thủ kho'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
