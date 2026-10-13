'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';

interface StockCardItem {
  InvoiceId: number;
  InvDate: string;
  Code: string;
  Type: 'in' | 'out';
  Partner: string;
  Note: string;
  Unit: string;
  Price: number;
  QtyIn: number;
  QtyOut: number;
  RunningBalance: number;
}

interface StockCardReport {
  ProductName: string;
  ProductCode?: string;
  Category?: string;
  Unit: string;
  CostPrice: number;
  FromDate: string;
  ToDate: string;
  OpeningBalance: number;
  TotalIn: number;
  TotalOut: number;
  ClosingBalance: number;
  Transactions: StockCardItem[];
}

interface StockCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  initialFromDate?: string;
  initialToDate?: string;
}

export default function StockCardModal({
  isOpen,
  onClose,
  productName,
  initialFromDate,
  initialToDate,
}: StockCardModalProps) {
  const [report, setReport] = useState<StockCardReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(initialFromDate || '');
  const [toDate, setToDate] = useState(initialToDate || '');

  // Default to current month if not provided
  useEffect(() => {
    if (!fromDate || !toDate) {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const start = new Date(y, m, 1).toISOString().split('T')[0];
      const end = new Date(y, m + 1, 0).toISOString().split('T')[0];
      setFromDate(start);
      setToDate(end);
    }
  }, [fromDate, toDate]);

  const loadStockCard = useCallback(async () => {
    if (!productName || !fromDate || !toDate) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        productName,
        fromDate,
        toDate,
      });
      const res = await fetch(`/api/summary/stock-card?${params.toString()}`);
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
      }
    } catch (err) {
      console.error('Failed to load stock card:', err);
    } finally {
      setLoading(false);
    }
  }, [productName, fromDate, toDate]);

  useEffect(() => {
    if (isOpen) {
      loadStockCard();
    }
  }, [isOpen, loadStockCard]);

  if (!isOpen) return null;

  const exportExcel = () => {
    if (!report) return;
    const excelData = report.Transactions.map((t, idx) => ({
      STT: idx + 1,
      'Ngày CT': t.InvDate,
      'Số chứng từ': t.Code,
      'Loại': t.Type === 'in' ? 'Nhập kho' : 'Xuất kho',
      'Đối tác': t.Partner,
      'Diễn giải': t.Note,
      'ĐVT': t.Unit,
      'SL Nhập': t.QtyIn || 0,
      'SL Xuất': t.QtyOut || 0,
      'Tồn lũy kế': t.RunningBalance,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TheKho');
    XLSX.writeFile(wb, `TheKho_${report.ProductName}_${fromDate}_${toDate}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide leading-tight">
                THẺ KHO CHI TIẾT HIỆN VẬT
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                Mặt hàng: <strong className="text-white underline">{productName}</strong>
                {report?.ProductCode && ` (Mã: ${report.ProductCode})`} • ĐVT: {report?.Unit || 'kg'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Date Filter & KPI Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-semibold">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800"
            />
            <span className="text-slate-400 font-semibold">Đến ngày:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800"
            />
            <button
              onClick={loadStockCard}
              disabled={loading}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg shadow-xs transition-colors"
            >
              {loading ? 'Đang tải...' : 'Xem thẻ kho'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportExcel}
              disabled={!report || report.Transactions.length === 0}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <span>📊</span>
              <span>Xuất Excel</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={!report}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <span>🖨️</span>
              <span>In Thẻ kho</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        {report && (
          <div className="grid grid-cols-4 gap-2 p-3 bg-white border-b border-slate-100 text-center">
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">
                Tồn đầu kỳ
              </span>
              <span className="text-sm font-bold text-blue-900">
                {report.OpeningBalance.toLocaleString('vi-VN')} {report.Unit}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
                Tổng Nhập trong kỳ
              </span>
              <span className="text-sm font-bold text-emerald-900">
                +{report.TotalIn.toLocaleString('vi-VN', { maximumFractionDigits: 4 })} {report.Unit}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">
                Tổng Xuất trong kỳ
              </span>
              <span className="text-sm font-bold text-rose-900">
                -{report.TotalOut.toLocaleString('vi-VN', { maximumFractionDigits: 4 })} {report.Unit}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                Tồn cuối kỳ
              </span>
              <span className="text-sm font-bold text-amber-900">
                {report.ClosingBalance.toLocaleString('vi-VN', { maximumFractionDigits: 4 })} {report.Unit}
              </span>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs">
              <span className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-600 rounded-full animate-spin mb-2" />
              <span>Đang tính toán thẻ kho lũy kế...</span>
            </div>
          ) : report && report.Transactions.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold shadow-xs">
                  <tr>
                    <th className="p-2 w-10 text-center">STT</th>
                    <th className="p-2 w-24">Ngày CT</th>
                    <th className="p-2 w-28">Số chứng từ</th>
                    <th className="p-2 w-24">Loại</th>
                    <th className="p-2">Đối tác / Nhà cung cấp</th>
                    <th className="p-2">Diễn giải</th>
                    <th className="p-2 w-24 text-right">SL Nhập</th>
                    <th className="p-2 w-24 text-right">SL Xuất</th>
                    <th className="p-2 w-28 text-right font-bold text-slate-800">Tồn lũy kế</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {/* Opening row */}
                  <tr className="bg-slate-50/70 italic text-slate-600 font-medium">
                    <td className="p-2 text-center">-</td>
                    <td className="p-2">{fromDate}</td>
                    <td className="p-2 font-mono">DUD-0000</td>
                    <td className="p-2 font-semibold text-blue-700">Tồn đầu</td>
                    <td className="p-2">Số dư đầu kỳ</td>
                    <td className="p-2">Tồn đầu kỳ chuyển sang</td>
                    <td className="p-2 text-right text-slate-400">-</td>
                    <td className="p-2 text-right text-slate-400">-</td>
                    <td className="p-2 text-right font-bold text-blue-800">
                      {report.OpeningBalance.toLocaleString('vi-VN', { maximumFractionDigits: 4 })}
                    </td>
                  </tr>

                  {report.Transactions.map((t, idx) => (
                    <tr key={t.InvoiceId} className="hover:bg-amber-50/30 transition-colors">
                      <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-2 font-mono text-slate-700">{t.InvDate}</td>
                      <td className="p-2 font-mono font-semibold text-amber-800">{t.Code}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.Type === 'in'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {t.Type === 'in' ? '📥 Nhập kho' : '📤 Xuất kho'}
                        </span>
                      </td>
                      <td className="p-2 text-slate-700 truncate max-w-xs">{t.Partner || '-'}</td>
                      <td className="p-2 text-slate-600 truncate max-w-xs">{t.Note || '-'}</td>
                      <td className="p-2 text-right font-semibold text-emerald-700">
                        {t.QtyIn > 0 ? t.QtyIn.toLocaleString('vi-VN', { maximumFractionDigits: 4 }) : '-'}
                      </td>
                      <td className="p-2 text-right font-semibold text-rose-700">
                        {t.QtyOut > 0 ? t.QtyOut.toLocaleString('vi-VN', { maximumFractionDigits: 4 }) : '-'}
                      </td>
                      <td className="p-2 text-right font-bold text-slate-900 bg-amber-50/20">
                        {t.RunningBalance.toLocaleString('vi-VN', { maximumFractionDigits: 4 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <span>Không có phát sinh giao dịch nhập xuất nào trong khoảng thời gian đã chọn.</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Số dòng phát sinh: <strong>{report?.Transactions.length || 0}</strong> • Số dư cuối kỳ:{' '}
            <strong className="text-slate-800 font-bold">
              {report?.ClosingBalance.toLocaleString('vi-VN') || 0} {report?.Unit || 'kg'}
            </strong>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium rounded-xl shadow-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
