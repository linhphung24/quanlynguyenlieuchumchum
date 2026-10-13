'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CashReportData, CompanyInfo } from '@/types';
import { useApp } from '@/contexts/AppContext';
import CashReportPrintModal from './CashReportPrintModal';
import CashOpeningModal from './CashOpeningModal';

export default function CashReportPage() {
  const { toast } = useApp();

  // Data states
  const [data, setData] = useState<CashReportData | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [period, setPeriod] = useState<string>('this_month');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');

  // Modals
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [openingModalOpen, setOpeningModalOpen] = useState(false);

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

  // Load company info
  useEffect(() => {
    fetch('/api/company-info')
      .then((res) => res.json())
      .then((d) => setCompanyInfo(d.info || null))
      .catch((err) => console.error(err));
  }, []);

  // Fetch cash report
  const loadReport = useCallback(async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ fromDate, toDate });
      if (keyword.trim()) params.set('keyword', keyword.trim());

      const res = await fetch(`/api/cash-report?${params.toString()}`);
      const json = await res.json();
      if (json.report) {
        setData(json.report);
      }
    } catch (err) {
      console.error(err);
      toast('Lỗi khi tải báo cáo sổ quỹ tiền mặt', 'error');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, keyword, toast]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Export CSV
  const handleExportCSV = () => {
    if (!data) return;

    const headers = [
      'STT',
      'Ngày ghi sổ',
      'Ngày chứng từ',
      'Số phiếu Thu',
      'Số phiếu Chi',
      'Đối tượng nộp/nhận',
      'Lý do diễn giải',
      'Thu (đ)',
      'Chi (đ)',
      'Tồn quỹ sau giao dịch (đ)',
    ];

    const rows: (string | number)[][] = [
      [
        '—',
        data.fromDate,
        data.fromDate,
        '—',
        '—',
        '—',
        'Số dư tồn quỹ đầu kỳ',
        '',
        '',
        data.openingCash,
      ],
    ];

    data.items.forEach((it, idx) => {
      rows.push([
        idx + 1,
        it.VoucherDate,
        it.VoucherDate,
        it.Type === 'thu' ? it.Code : '',
        it.Type === 'chi' ? it.Code : '',
        `"${(it.Partner || '').replace(/"/g, '""')}"`,
        `"${(it.Reason || '').replace(/"/g, '""')}"`,
        it.ThuAmount > 0 ? it.ThuAmount : '',
        it.ChiAmount > 0 ? it.ChiAmount : '',
        it.RunningBalance,
      ]);
    });

    // Summary rows
    rows.push([
      '—',
      '—',
      '—',
      '—',
      '—',
      'CỘNG PHÁT SINH TRONG KỲ',
      '',
      data.totalThu,
      data.totalChi,
      '',
    ]);
    rows.push([
      '—',
      '—',
      '—',
      '—',
      '—',
      'SỐ DƯ TỒN QUỸ CUỐI KỲ',
      '',
      '',
      '',
      data.closingCash,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `So_Quy_Tien_Mat_${fromDate}_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Đã xuất báo cáo sổ quỹ tiền mặt ra file Excel thành công', 'success');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 overflow-hidden select-none print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:block">
      {/* On-screen Page Content */}
      <div className="print:hidden no-print flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Top Toolbar */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrintModalOpen(true)}
              disabled={!data}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              <span>🖨️</span>
              <span>In Sổ Quỹ Tiền Mặt</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={!data || data.items.length === 0}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-40"
            >
              <span>📊</span>
              <span>Xuất Excel</span>
            </button>

            <button
              onClick={() => setOpeningModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span>⚙️</span>
              <span>Khai Báo Tồn Đầu Kỳ</span>
            </button>

            <div className="h-5 w-[1px] bg-slate-200 mx-1" />

            <button
              onClick={loadReport}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              <span>Nạp lại</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 shadow-2xs"
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

            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadReport()}
              placeholder="Tìm số phiếu, đối tác, lý do..."
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 placeholder-slate-400 w-52 focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
          </div>
        </div>

        {/* 4 Primary KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-100/70 border-b border-slate-200">
          {/* Card 1: Tồn Đầu Kỳ */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Tồn Quỹ Đầu Kỳ (1)
              </p>
              <p className="text-lg font-bold font-mono text-slate-800 mt-0.5">
                {(data?.openingCash || 0).toLocaleString('vi-VN')} ₫
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Số dư tiền mặt trước kỳ này</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl">
              💰
            </div>
          </div>

          {/* Card 2: Tổng Thu */}
          <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                Tổng Thu Trong Kỳ (2)
              </p>
              <p className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                +{(data?.totalThu || 0).toLocaleString('vi-VN')} ₫
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {data?.items.filter((i) => i.Type === 'thu').length || 0} phiếu thu tiền mặt
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
              💵
            </div>
          </div>

          {/* Card 3: Tổng Chi */}
          <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wide">
                Tổng Chi Trong Kỳ (3)
              </p>
              <p className="text-lg font-bold font-mono text-rose-600 mt-0.5">
                -{(data?.totalChi || 0).toLocaleString('vi-VN')} ₫
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {data?.items.filter((i) => i.Type === 'chi').length || 0} phiếu chi tiền mặt
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl">
              💸
            </div>
          </div>

          {/* Card 4: Tồn Cuối Kỳ (Thu trừ Chi xem còn bao nhiêu) */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/80 p-3 rounded-xl border-2 border-emerald-500/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1">
                <span>🏆 TỒN QUỸ HIỆN CÒN LẠI (4)</span>
              </p>
              <p className="text-xl font-black font-mono text-emerald-800 mt-0.5 tracking-tight">
                {(data?.closingCash || 0).toLocaleString('vi-VN')} ₫
              </p>
              <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                = (1) Đầu kỳ + (2) Thu - (3) Chi
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-md shadow-emerald-600/30">
              💎
            </div>
          </div>
        </div>

        {/* Main Workspace Table: Sổ Quỹ Tiền Mặt */}
        <div className="flex-1 overflow-y-auto border-b border-slate-200 custom-scrollbar bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 text-slate-600 border-b border-slate-200 z-10 font-semibold shadow-2xs">
              <tr>
                <th className="p-2.5 w-12 text-center">STT</th>
                <th className="p-2.5 w-24 text-center">Ngày hạch toán</th>
                <th className="p-2.5 w-28 text-center">Số phiếu</th>
                <th className="p-2.5 w-24 text-center">Loại phiếu</th>
                <th className="p-2.5 w-48">Đối tượng nộp / nhận</th>
                <th className="p-2.5">Lý do thu / chi tiền mặt</th>
                <th className="p-2.5 w-32 text-right">Thu vào (+)</th>
                <th className="p-2.5 w-32 text-right">Chi ra (-)</th>
                <th className="p-2.5 w-36 text-right font-bold">Tồn quỹ sau GD (₫)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin" />
                      <span>Đang tải số liệu sổ quỹ tiền mặt...</span>
                    </div>
                  </td>
                </tr>
              ) : !data ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400">
                    Chưa có số liệu báo cáo.
                  </td>
                </tr>
              ) : (
                <>
                  {/* Row 1: Dư đầu kỳ */}
                  <tr className="bg-slate-50/90 font-medium text-slate-700 italic">
                    <td className="p-2.5 text-center text-slate-400">—</td>
                    <td className="p-2.5 text-center text-slate-500 font-mono">{data.fromDate}</td>
                    <td className="p-2.5 text-center font-mono text-slate-500 font-semibold">TỒN_ĐẦU_KỲ</td>
                    <td className="p-2.5 text-center">—</td>
                    <td className="p-2.5 text-slate-600">Số dư tiền mặt chuyển sang</td>
                    <td className="p-2.5 text-slate-500">
                      Tồn quỹ tiền mặt đầu kỳ tính đến ngày {data.fromDate}
                    </td>
                    <td className="p-2.5 text-right text-slate-400">—</td>
                    <td className="p-2.5 text-right text-slate-400">—</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900 bg-amber-50/50">
                      {data.openingCash.toLocaleString('vi-VN')}
                    </td>
                  </tr>

                  {/* Transactions */}
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                        Không có phát sinh thu chi tiền mặt nào trong khoảng thời gian từ {data.fromDate} đến {data.toDate}.
                      </td>
                    </tr>
                  ) : (
                    data.items.map((it, idx) => {
                      const isThu = it.Type === 'thu';
                      return (
                        <tr key={it.Id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 text-center text-slate-600 font-mono">{it.VoucherDate}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                            {it.Code}
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                                isThu
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              {isThu ? 'Thu' : 'Chi'}
                            </span>
                          </td>
                          <td className="p-2.5 font-medium text-slate-800 truncate max-w-xs">
                            {it.Partner || it.Receiver || '—'}
                          </td>
                          <td className="p-2.5 text-slate-600 truncate max-w-sm">{it.Reason}</td>
                          <td className="p-2.5 text-right font-mono font-semibold text-emerald-700">
                            {it.ThuAmount > 0 ? `+${it.ThuAmount.toLocaleString('vi-VN')}` : '—'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-rose-600">
                            {it.ChiAmount > 0 ? `-${it.ChiAmount.toLocaleString('vi-VN')}` : '—'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900 bg-slate-50/40">
                            {it.RunningBalance.toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Summary Row */}
                  <tr className="bg-slate-100/90 font-bold text-slate-800 border-t-2 border-slate-300">
                    <td colSpan={6} className="p-2.5 text-right uppercase text-[11px] tracking-wide">
                      Tổng Phát Sinh Thu - Chi Trong Kỳ:
                    </td>
                    <td className="p-2.5 text-right font-mono text-emerald-700 text-sm">
                      +{(data.totalThu || 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="p-2.5 text-right font-mono text-rose-600 text-sm">
                      -{(data.totalChi || 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="p-2.5 text-right font-mono text-slate-500">—</td>
                  </tr>

                  {/* Closing Cash Row */}
                  <tr className="bg-emerald-100/60 font-bold text-slate-900 border-t border-emerald-300">
                    <td colSpan={6} className="p-3 text-right uppercase text-xs tracking-wide text-emerald-950">
                      TỒN QUỸ TIỀN MẶT CÒN LẠI CUỐI KỲ (NGÀY {data.toDate}):
                    </td>
                    <td colSpan={2} className="p-3 text-center text-slate-500 text-xs italic">
                      (Chênh lệch Thu - Chi: {(data.netCash >= 0 ? '+' : '') + data.netCash.toLocaleString('vi-VN')} ₫)
                    </td>
                    <td className="p-3 text-right font-mono font-black text-emerald-800 text-base">
                      {data.closingCash.toLocaleString('vi-VN')} ₫
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div className="h-10 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-600 print:hidden no-print">
          <div className="flex items-center gap-6">
            <span>
              Số phát sinh: <strong className="text-slate-800 font-mono">{data?.items.length || 0}</strong> phiếu
            </span>
            <span>
              Tổng thu: <strong className="text-emerald-700 font-mono">+{(data?.totalThu || 0).toLocaleString('vi-VN')} ₫</strong>
            </span>
            <span>
              Tổng chi: <strong className="text-rose-600 font-mono">-{(data?.totalChi || 0).toLocaleString('vi-VN')} ₫</strong>
            </span>
            <span>
              Quỹ còn lại: <strong className="text-emerald-800 font-mono font-bold text-sm">{(data?.closingCash || 0).toLocaleString('vi-VN')} ₫</strong>
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Sổ Quỹ Tiền Mặt (TK 111) • Mẫu S11-DN TT 132/2018/TT-BTC
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {printModalOpen && data && (
        <CashReportPrintModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          report={data}
          companyInfo={companyInfo}
        />
      )}

      {/* Opening Cash Modal */}
      {openingModalOpen && (
        <CashOpeningModal
          isOpen={openingModalOpen}
          onClose={() => setOpeningModalOpen(false)}
          onSaved={loadReport}
        />
      )}
    </div>
  );
}
