'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import CashVoucherModal from '@/components/vouchers/CashVoucherModal';

interface DashboardData {
  period: { fromDate: string; toDate: string };
  cashFlow: {
    openingBalance: number;
    totalThu: number;
    totalChi: number;
    netCash: number;
    closingBalance: number;
    dailyData: { date: string; thu: number; chi: number; net: number }[];
  };
  debt: {
    totalPayable: number;
    totalPurchased: number;
    totalPaid: number;
    suppliersInDebtCount: number;
    topSuppliers: { id: number; name: string; phone: string; debt: number }[];
  };
  inventory: {
    totalStockValue: number;
    totalItems: number;
    lowStockCount: number;
    totalImportInPeriod: number;
    totalExportInPeriod: number;
  };
  recentActivities: {
    recentVouchers: {
      id: number;
      code: string;
      date: string;
      type: 'thu' | 'chi';
      partner: string;
      reason: string;
      amount: number;
    }[];
    pendingInvoicesCount: number;
    periodLock: {
      isLocked: boolean;
      lockedBy?: string;
      lockedAt?: string;
    };
  };
}

export default function AccountingDashboardPage() {
  const { setActivePage, toast } = useApp();

  // Filters
  const [period, setPeriod] = useState<string>('this_month');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);

  // Quick Action Modal
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [voucherModalType, setVoucherModalType] = useState<'thu' | 'chi'>('chi');

  // Initialize dates
  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    if (period === 'today') {
      const today = now.toISOString().split('T')[0];
      setFromDate(today);
      setToDate(today);
    } else if (period === 'this_month') {
      const start = new Date(y, m, 1).toISOString().split('T')[0];
      const end = new Date(y, m + 1, 0).toISOString().split('T')[0];
      setFromDate(start);
      setToDate(end);
    } else if (period === 'last_month') {
      const start = new Date(y, m - 1, 1).toISOString().split('T')[0];
      const end = new Date(y, m, 0).toISOString().split('T')[0];
      setFromDate(start);
      setToDate(end);
    } else if (period === 'this_year') {
      const start = new Date(y, 0, 1).toISOString().split('T')[0];
      const end = new Date(y, 11, 31).toISOString().split('T')[0];
      setFromDate(start);
      setToDate(end);
    }
  }, [period]);

  const loadDashboard = useCallback(async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting-dashboard?fromDate=${fromDate}&toDate=${toDate}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Lỗi tải dữ liệu');
      setData(d);
    } catch (err: any) {
      console.error(err);
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, toast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const maxDailyAmount = useMemo(() => {
    if (!data?.cashFlow?.dailyData || data.cashFlow.dailyData.length === 0) return 1;
    return Math.max(
      ...data.cashFlow.dailyData.map((d) => Math.max(d.thu, d.chi)),
      1
    );
  }, [data?.cashFlow?.dailyData]);

  const maxSupplierDebt = useMemo(() => {
    if (!data?.debt?.topSuppliers || data.debt.topSuppliers.length === 0) return 1;
    return Math.max(...data.debt.topSuppliers.map((s) => s.debt), 1);
  }, [data?.debt?.topSuppliers]);

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 overflow-y-auto overflow-x-hidden select-none p-4 space-y-4 custom-scrollbar">
      {/* Top Filter & Action Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white text-xl shadow-md shadow-indigo-600/20 shrink-0">
            📊
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide truncate">
              BẢNG ĐIỀU KHIỂN TÀI CHÍNH & DÒNG TIỀN
            </h2>
            <p className="text-xs text-slate-500 truncate">
              Tổng hợp quỹ tiền mặt, công nợ nhà cung cấp và giá trị kho Chum Chum Bakery
            </p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 shadow-2xs"
          >
            <option value="today">Hôm nay</option>
            <option value="this_month">Tháng này</option>
            <option value="last_month">Tháng trước</option>
            <option value="this_year">Năm nay</option>
            <option value="custom">Tùy chọn...</option>
          </select>

          {period === 'custom' && (
            <div className="flex items-center gap-1 bg-slate-50 p-1 border border-slate-300 rounded-xl">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs"
              />
            </div>
          )}

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-medium shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span>{loading ? 'Đang nạp...' : 'Nạp lại'}</span>
          </button>

          <div className="h-6 w-[1px] bg-slate-200 mx-1" />

          {/* Quick Action Buttons */}
          <button
            onClick={() => {
              setVoucherModalType('thu');
              setVoucherModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Phiếu Thu</span>
          </button>

          <button
            onClick={() => {
              setVoucherModalType('chi');
              setVoucherModalOpen(true);
            }}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Phiếu Chi</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Quỹ Tiền Mặt */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tồn Quỹ Tiền Mặt (TK 111)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
              💵
            </div>
          </div>

          <div className="my-3">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight truncate">
              {Math.round(data?.cashFlow.closingBalance || 0).toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-semibold text-slate-500">₫</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 truncate">
              <span>Đầu kỳ:</span>
              <strong className="font-mono text-slate-700">
                {Math.round(data?.cashFlow.openingBalance || 0).toLocaleString('vi-VN')} ₫
              </strong>
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] min-w-0">
              <span className="text-emerald-600 font-semibold flex items-center gap-0.5 whitespace-nowrap">
                <span>▲</span>
                <span className="font-mono">
                  +{Math.round(data?.cashFlow.totalThu || 0).toLocaleString('vi-VN')}
                </span>
              </span>
              <span className="text-rose-600 font-semibold flex items-center gap-0.5 whitespace-nowrap">
                <span>▼</span>
                <span className="font-mono">
                  -{Math.round(data?.cashFlow.totalChi || 0).toLocaleString('vi-VN')}
                </span>
              </span>
            </div>
            <button
              onClick={() => setActivePage('cash-report')}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline shrink-0 whitespace-nowrap"
            >
              Sổ quỹ ➔
            </button>
          </div>
        </div>

        {/* Card 2: Công Nợ NCC */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng Nợ Phải Trả (TK 331)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-sm shrink-0">
              💳
            </div>
          </div>

          <div className="my-3">
            <div className="text-2xl font-black text-rose-700 font-mono tracking-tight truncate">
              {Math.round(data?.debt.totalPayable || 0).toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-semibold text-slate-500">₫</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 truncate">
              <span>Đang nợ:</span>
              <strong className="text-rose-600 font-semibold">
                {data?.debt.suppliersInDebtCount || 0} Nhà cung cấp
              </strong>
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-1.5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 min-w-0">
              <span className="shrink-0">Đã trả:</span>
              <strong className="font-mono text-emerald-700 truncate">
                {Math.round(data?.debt.totalPaid || 0).toLocaleString('vi-VN')} ₫
              </strong>
            </div>
            <button
              onClick={() => setActivePage('debts')}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline shrink-0 whitespace-nowrap"
            >
              Sổ nợ ➔
            </button>
          </div>
        </div>

        {/* Card 3: Giá Trị Tồn Kho */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Giá Trị Tồn Kho (FIFO)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
              📦
            </div>
          </div>

          <div className="my-3">
            <div className="text-2xl font-black text-amber-700 font-mono tracking-tight truncate">
              {Math.round(data?.inventory.totalStockValue || 0).toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-semibold text-slate-500">₫</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 truncate">
              <span>Quy mô:</span>
              <strong className="text-slate-700 font-semibold">
                {data?.inventory.totalItems || 0} mặt hàng hoạt động
              </strong>
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-1.5">
            <div className="flex items-center gap-1.5 text-[11px] min-w-0">
              {(data?.inventory.lowStockCount || 0) > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold truncate">
                  ⚠️ {data?.inventory.lowStockCount} hàng sắp hết
                </span>
              ) : (
                <span className="text-emerald-700 font-medium whitespace-nowrap">✓ Đủ tồn an toàn</span>
              )}
            </div>
            <button
              onClick={() => setActivePage('reports')}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline shrink-0 whitespace-nowrap"
            >
              Xem kho ➔
            </button>
          </div>
        </div>

        {/* Card 4: Dòng Tiền Thuần */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Dòng Tiền Thuần (Net Cash)
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm shrink-0">
              📈
            </div>
          </div>

          <div className="my-3">
            <div
              className={`text-2xl font-black font-mono tracking-tight truncate ${
                (data?.cashFlow.netCash || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {(data?.cashFlow.netCash || 0) >= 0 ? '+' : ''}
              {Math.round(data?.cashFlow.netCash || 0).toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-semibold text-slate-500">₫</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 truncate">
              <span>Xuất sản xuất:</span>
              <strong className="font-mono text-slate-700">
                {Math.round(data?.inventory.totalExportInPeriod || 0).toLocaleString('vi-VN')} ₫
              </strong>
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-1.5">
            <div
              className="text-[11px] text-slate-500 truncate min-w-0"
              title={`Nhập mua: ${Math.round(data?.inventory.totalImportInPeriod || 0).toLocaleString('vi-VN')} ₫`}
            >
              <span>Nhập mua: </span>
              <strong className="font-mono text-slate-700">
                {Math.round(data?.inventory.totalImportInPeriod || 0).toLocaleString('vi-VN')} ₫
              </strong>
            </div>
            <button
              onClick={() => setActivePage('invoices')}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline shrink-0 whitespace-nowrap"
            >
              Chứng từ ➔
            </button>
          </div>
        </div>
      </div>

      {/* Mid Section: Cash Flow Chart + Top Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Visual Cash Flow & Recent Vouchers (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Daily Cash Flow Visualizer */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>📅</span>
                  <span>Diễn Biến Thu - Chi Hàng Ngày Trong Kỳ</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  So sánh dòng tiền thu vào (Xanh) và chi ra (Đỏ)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs shrink-0">
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Thu</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Chi</span>
                </span>
              </div>
            </div>

            {data?.cashFlow.dailyData && data.cashFlow.dailyData.length > 0 ? (
              <div className="space-y-2 pt-1">
                {data.cashFlow.dailyData.slice(-8).map((d) => {
                  const thuPct = Math.round((d.thu / maxDailyAmount) * 100);
                  const chiPct = Math.round((d.chi / maxDailyAmount) * 100);

                  return (
                    <div
                      key={d.date}
                      className="flex items-center gap-3 text-xs p-1.5 rounded-xl hover:bg-slate-50/80 transition-colors"
                    >
                      <span className="w-12 shrink-0 font-mono text-[11px] font-bold text-slate-600">
                        {d.date.slice(5)}
                      </span>
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        {/* Bar Thu */}
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            style={{
                              width: `${Math.min(Math.max(thuPct, d.thu > 0 ? 2 : 0), 100)}%`,
                            }}
                            className="bg-emerald-500 h-full rounded-full transition-all"
                          />
                        </div>
                        {/* Bar Chi */}
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            style={{
                              width: `${Math.min(Math.max(chiPct, d.chi > 0 ? 2 : 0), 100)}%`,
                            }}
                            className="bg-rose-500 h-full rounded-full transition-all"
                          />
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end font-mono text-[10px] leading-tight w-24">
                        <span className="text-emerald-700 font-bold whitespace-nowrap">
                          +{Math.round(d.thu).toLocaleString('vi-VN')}
                        </span>
                        <span className="text-rose-700 font-bold whitespace-nowrap mt-0.5">
                          -{Math.round(d.chi).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có giao dịch phiếu thu / phiếu chi nào phát sinh trong kỳ đã chọn.
              </div>
            )}
          </div>

          {/* Recent Cash Vouchers */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>💵</span>
                <span>Phiếu Thu / Chi Gần Nhất</span>
              </h3>
              <button
                onClick={() => setActivePage('vouchers')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline shrink-0"
              >
                Xem tất cả ➔
              </button>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px]">
                    <th className="py-2 pr-2 whitespace-nowrap">Mã phiếu</th>
                    <th className="py-2 pr-2 whitespace-nowrap">Ngày</th>
                    <th className="py-2 pr-2 min-w-[120px]">Đối tác / Người nộp</th>
                    <th className="py-2 pr-2 min-w-[140px]">Lý do</th>
                    <th className="py-2 text-right whitespace-nowrap">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.recentActivities.recentVouchers &&
                  data.recentActivities.recentVouchers.length > 0 ? (
                    data.recentActivities.recentVouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 pr-2 font-mono font-bold whitespace-nowrap">
                          <span
                            className={
                              v.type === 'thu'
                                ? 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded'
                                : 'text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded'
                            }
                          >
                            {v.code}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {v.date}
                        </td>
                        <td
                          className="py-2 pr-2 font-medium text-slate-800 truncate max-w-[140px]"
                          title={v.partner}
                        >
                          {v.partner || '-'}
                        </td>
                        <td
                          className="py-2 pr-2 text-slate-500 truncate max-w-[180px]"
                          title={v.reason}
                        >
                          {v.reason}
                        </td>
                        <td
                          className={`py-2 text-right font-mono font-bold whitespace-nowrap ${
                            v.type === 'thu' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {v.type === 'thu' ? '+' : '-'}
                          {Math.round(v.amount).toLocaleString('vi-VN')} ₫
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Chưa có chứng từ tiền mặt.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Top Suppliers in Debt & Action Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Top Suppliers with Debt */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>🏢</span>
                  <span>Top 5 Nhà Cung Cấp Có Dư NỢ Lớn Nhất</span>
                </h3>
                <p className="text-[11px] text-slate-400">Các khoản phải trả cần ưu tiên dòng tiền</p>
              </div>
              <button
                onClick={() => setActivePage('debts')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline shrink-0"
              >
                Sổ 331 ➔
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {data?.debt.topSuppliers && data.debt.topSuppliers.length > 0 ? (
                data.debt.topSuppliers.map((s, idx) => {
                  const pct = Math.round((s.debt / maxSupplierDebt) * 100);

                  return (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-800 truncate" title={s.name}>
                            {s.name}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-xs text-rose-700 shrink-0 ml-2 whitespace-nowrap">
                          {Math.round(s.debt).toLocaleString('vi-VN')} ₫
                        </span>
                      </div>

                      {/* Debt progress bar */}
                      <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden my-1.5">
                        <div
                          style={{ width: `${Math.min(Math.max(pct, 5), 100)}%` }}
                          className="bg-rose-500 h-full rounded-full"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 gap-2">
                        <span className="truncate">{s.phone ? `SĐT: ${s.phone}` : 'Chưa có SĐT'}</span>
                        <button
                          onClick={() => {
                            setVoucherModalType('chi');
                            setVoucherModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline shrink-0 whitespace-nowrap"
                        >
                          💵 Chi trả nợ
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Hiện tại không có khoản nợ nhà cung cấp nào.
                </div>
              )}
            </div>
          </div>

          {/* Operational Status & Action Cards */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-md space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <span>⚙️</span>
              <span>Trạng Thái Nghiệp Vụ Kế Toán</span>
            </h3>

            {/* Item 1: Pending Invoices */}
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl shrink-0">⏳</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Chứng từ kho chờ duyệt</p>
                  <p className="text-[11px] text-indigo-200 truncate">
                    Cần kế toán duyệt giá vốn và hạch toán
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs">
                  {data?.recentActivities.pendingInvoicesCount || 0}
                </span>
                <button
                  onClick={() => setActivePage('invoices')}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-900 rounded-lg text-xs font-bold transition-colors shrink-0"
                >
                  Duyệt ngay
                </button>
              </div>
            </div>

            {/* Item 2: Period Lock */}
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl shrink-0">
                  {data?.recentActivities.periodLock.isLocked ? '🔒' : '🔓'}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {data?.recentActivities.periodLock.isLocked
                      ? 'Kỳ kế toán đã khóa sổ'
                      : 'Kỳ kế toán đang mở'}
                  </p>
                  <p className="text-[11px] text-indigo-200 truncate">
                    {data?.recentActivities.periodLock.isLocked
                      ? `Đã khóa bởi ${data?.recentActivities.periodLock.lockedBy || 'Kế toán'}`
                      : 'Cho phép thêm, sửa, xóa chứng từ'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivePage('reports')}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-900 rounded-lg text-xs font-bold transition-colors shrink-0"
              >
                Khóa sổ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Modal */}
      {voucherModalOpen && (
        <CashVoucherModal
          isOpen={voucherModalOpen}
          onClose={() => setVoucherModalOpen(false)}
          onSaved={() => {
            setVoucherModalOpen(false);
            loadDashboard();
          }}
          initialType={voucherModalType}
        />
      )}
    </div>
  );
}
