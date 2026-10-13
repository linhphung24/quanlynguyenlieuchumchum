'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CashVoucher, CashVoucherDetail, CompanyInfo } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { getAccountName } from '@/lib/accounts';
import CashVoucherModal from './CashVoucherModal';
import VoucherPrintModal from './VoucherPrintModal';

export default function CashVouchersPage() {
  const { hasPermission, toast, setActivePage } = useApp();

  // Data states
  const [vouchers, setVouchers] = useState<CashVoucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<CashVoucher | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<CashVoucherDetail[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  // Filters
  const [period, setPeriod] = useState<string>('this_month');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'thu' | 'chi'>('chi');
  const [editingVoucher, setEditingVoucher] = useState<CashVoucher | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

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

  const loadVouchers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      if (keyword) params.set('keyword', keyword);
      if (filterType) params.set('type', filterType);

      const res = await fetch(`/api/cash-vouchers?${params.toString()}`);
      const data = await res.json();
      if (data.vouchers) {
        setVouchers(data.vouchers);
        if (data.vouchers.length > 0) {
          const existing = data.vouchers.find((v: CashVoucher) => v.Id === selectedVoucher?.Id);
          setSelectedVoucher(existing || data.vouchers[0]);
        } else {
          setSelectedVoucher(null);
          setSelectedDetails([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [fromDate, toDate, keyword, filterType, selectedVoucher?.Id]);

  // Load details when voucher selected
  useEffect(() => {
    if (!selectedVoucher) {
      setSelectedDetails([]);
      return;
    }
    fetch(`/api/cash-vouchers/${selectedVoucher.Id}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedDetails(data.details || []);
      })
      .catch((err) => console.error(err));
  }, [selectedVoucher]);

  // Load company info
  useEffect(() => {
    fetch('/api/company-info')
      .then((res) => res.json())
      .then((d) => setCompanyInfo(d.info || null));
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      loadVouchers();
    }
  }, [fromDate, toDate, loadVouchers]);

  // Summary Totals
  const totals = useMemo(() => {
    let totalThu = 0;
    let totalChi = 0;
    for (const v of vouchers) {
      if (v.Type === 'thu') totalThu += v.Amount;
      else totalChi += v.Amount;
    }
    return {
      count: vouchers.length,
      totalThu,
      totalChi,
      balance: totalThu - totalChi,
    };
  }, [vouchers]);

  const handleDelete = async () => {
    if (!selectedVoucher) return;
    const ok = confirm(`Bạn có chắc chắn muốn xóa phiếu ${selectedVoucher.Code}?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/cash-vouchers/${selectedVoucher.Id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Đã xóa phiếu thu chi thành công', 'success');
        loadVouchers();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi xóa phiếu');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 overflow-hidden select-none print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:block">
      {/* On-screen Page Content (Hidden when printing modal) */}
      <div className="print:hidden no-print flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Top Toolbar */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingVoucher(null);
                setModalType('thu');
                setModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <span>💵</span>
              <span>Thêm Phiếu Thu</span>
            </button>

            <button
              onClick={() => {
                setEditingVoucher(null);
                setModalType('chi');
                setModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <span>💸</span>
              <span>Thêm Phiếu Chi</span>
            </button>

            <button
              disabled={!selectedVoucher}
              onClick={() => {
                setEditingVoucher(selectedVoucher);
                setModalType(selectedVoucher?.Type || 'chi');
                setModalOpen(true);
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>✏️</span>
              <span>Sửa</span>
            </button>

            <button
              disabled={!selectedVoucher}
              onClick={handleDelete}
              className="px-3 py-1.5 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 hover:border-red-300 text-xs font-medium rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>🗑️</span>
              <span>Xóa</span>
            </button>

            <div className="h-5 w-[1px] bg-slate-200 mx-1" />

            <button
              disabled={!selectedVoucher}
              onClick={() => setPrintModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>🖨️</span>
              <span>In phiếu thu/chi</span>
            </button>

            <button
              onClick={loadVouchers}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>🔄</span>
              <span>Nạp lại</span>
            </button>

            <button
              onClick={() => setActivePage('cash-report')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>📋</span>
              <span>Báo Cáo Sổ Quỹ</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="today">Hôm nay</option>
              <option value="this_month">Tháng này</option>
              <option value="last_month">Tháng trước</option>
              <option value="this_year">Năm nay</option>
              <option value="custom">Tùy chọn...</option>
            </select>

            {period === 'custom' && (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-700"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-700"
                />
              </div>
            )}

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="">Tất cả loại phiếu</option>
              <option value="thu">💵 Phiếu thu (PT)</option>
              <option value="chi">💸 Phiếu chi (PC)</option>
            </select>

            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadVouchers()}
              placeholder="Tìm số phiếu, người nhận, lý do..."
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 placeholder-slate-400 w-52 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>
        </div>

        {/* Main Workspace: Split Master (Top 55%) & Detail (Bottom 45%) */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Master Table */}
          <div className="flex-[55] overflow-y-auto border-b border-slate-200 custom-scrollbar bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 text-slate-600 border-b border-slate-200 z-10 font-semibold shadow-xs">
                <tr>
                  <th className="p-2.5 w-12 text-center">STT</th>
                  <th className="p-2.5 w-24">Loại</th>
                  <th className="p-2.5 w-28">Số phiếu</th>
                  <th className="p-2.5 w-24">Ngày lập</th>
                  <th className="p-2.5 w-44">Đối tượng</th>
                  <th className="p-2.5 w-40">Người nhận/nộp</th>
                  <th className="p-2.5">Lý do thu / chi</th>
                  <th className="p-2.5 w-32 text-right">Số tiền (₫)</th>
                  <th className="p-2.5 w-28">Hình thức</th>
                  <th className="p-2.5 w-24">Người lập</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Không có phiếu thu chi nào trong kỳ lọc.
                    </td>
                  </tr>
                ) : (
                  vouchers.map((v, idx) => {
                    const isSelected = selectedVoucher?.Id === v.Id;
                    const isThu = v.Type === 'thu';
                    return (
                      <tr
                        key={v.Id}
                        onClick={() => setSelectedVoucher(v)}
                        onDoubleClick={() => {
                          setEditingVoucher(v);
                          setModalType(v.Type);
                          setModalOpen(true);
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-100/70 text-slate-900 font-medium'
                            : 'hover:bg-amber-50/50 text-slate-700'
                        }`}
                      >
                        <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isThu
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {isThu ? 'Phiếu thu' : 'Phiếu chi'}
                          </span>
                        </td>
                        <td className="p-2 font-mono font-semibold text-slate-800">{v.Code}</td>
                        <td className="p-2 text-slate-600">{v.VoucherDate}</td>
                        <td className="p-2 truncate font-medium text-slate-800">{v.Partner || '—'}</td>
                        <td className="p-2 truncate text-slate-700">{v.Receiver || '—'}</td>
                        <td className="p-2 truncate max-w-xs text-slate-600">{v.Reason || '—'}</td>
                        <td className="p-2 text-right font-mono font-semibold text-slate-900">
                          {v.Amount.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-2 truncate text-slate-500">{v.PaymentMethod}</td>
                        <td className="p-2 truncate text-slate-600">{v.CreatedBy || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Detail Panel: Accounting Entries */}
          <div className="flex-[45] flex flex-col bg-white border-t border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-semibold text-amber-800">
                Chi tiết Định khoản ({selectedDetails.length} dòng)
              </span>
              {selectedVoucher && (
                <span className="text-[11px] text-slate-500 font-mono">
                  Phiếu đang chọn: <strong className="text-slate-800">{selectedVoucher.Code}</strong> — {selectedVoucher.Partner}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-slate-50/50">
              <table className="w-full text-left text-xs border-collapse bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="p-2 w-10 text-center">#</th>
                    <th className="p-2">Diễn giải định khoản</th>
                    <th className="p-2 w-52 text-left">Tài khoản Nợ (Tiếp nhận/Tăng)</th>
                    <th className="p-2 w-52 text-left">Tài khoản Có (Nguồn chi/Giảm)</th>
                    <th className="p-2 w-36 text-right">Số tiền (₫)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedDetails.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        Chưa chọn phiếu hoặc phiếu không có dòng định khoản.
                      </td>
                    </tr>
                  ) : (
                    selectedDetails.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 text-center text-slate-400">{i + 1}</td>
                        <td className="p-2 font-medium text-slate-800">{d.Description}</td>
                        <td className="p-2 text-left">
                          {d.DebitAccount ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-emerald-800 font-bold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[11px]">
                                {d.DebitAccount}
                              </span>
                              {getAccountName(d.DebitAccount) && (
                                <span className="text-slate-700 text-xs font-medium">
                                  {getAccountName(d.DebitAccount)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-2 text-left">
                          {d.CreditAccount ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-amber-800 font-bold px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[11px]">
                                {d.CreditAccount}
                              </span>
                              {getAccountName(d.CreditAccount) && (
                                <span className="text-slate-700 text-xs font-medium">
                                  {getAccountName(d.CreditAccount)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-2 text-right font-mono font-semibold text-slate-900">
                          {Number(d.Amount).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Summary Bar */}
        <div className="h-10 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-600 print:hidden no-print">
          <div className="flex items-center gap-6">
            <span>
              Số phiếu: <strong className="text-slate-800 font-mono">{totals.count}</strong>
            </span>
            <span>
              Tổng thu (PT): <strong className="text-emerald-700 font-mono">{totals.totalThu.toLocaleString('vi-VN')} ₫</strong>
            </span>
            <span>
              Tổng chi (PC): <strong className="text-rose-700 font-mono">{totals.totalChi.toLocaleString('vi-VN')} ₫</strong>
            </span>
            <span>
              Tồn quỹ kỳ này (Thu - Chi):{' '}
              <strong className="text-amber-800 font-mono">{totals.balance.toLocaleString('vi-VN')} ₫</strong>
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Sổ quỹ tiền mặt • Thông tư 132/2018/TT-BTC
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalOpen && (
        <CashVoucherModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={loadVouchers}
          initialType={modalType}
          editingVoucher={editingVoucher}
        />
      )}

      {printModalOpen && selectedVoucher && (
        <VoucherPrintModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          voucher={selectedVoucher}
          details={selectedDetails}
          companyInfo={companyInfo}
        />
      )}
    </div>
  );
}
