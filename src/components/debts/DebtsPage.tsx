'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SupplierDebtSummary,
  SupplierDebtDetailReport,
  CompanyInfo,
  Product,
  Recipe,
} from '@/types';
import { useApp } from '@/contexts/AppContext';
import DebtPrintModal from './DebtPrintModal';
import DebtOpeningModal from './DebtOpeningModal';
import CashVoucherModal from '@/components/vouchers/CashVoucherModal';
import InvoiceVoucherModal from '@/components/invoices/InvoiceVoucherModal';

export default function DebtsPage() {
  const { toast } = useApp();

  // Data states
  const [suppliers, setSuppliers] = useState<SupplierDebtSummary[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [detailReport, setDetailReport] = useState<SupplierDebtDetailReport | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // Filter states
  const [period, setPeriod] = useState<string>('this_month');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [debtOpeningModalOpen, setDebtOpeningModalOpen] = useState(false);
  const [cashVoucherOpen, setCashVoucherOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // KPI Totals from API
  const [kpiTotals, setKpiTotals] = useState({
    totalPayable: 0,
    totalPurchased: 0,
    totalPaid: 0,
    suppliersInDebtCount: 0,
  });

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

  // Load summary
  const loadDebts = useCallback(async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        fromDate,
        toDate,
      });
      if (keyword.trim()) params.set('keyword', keyword.trim());

      const res = await fetch(`/api/debts?${params.toString()}`);
      const data = await res.json();

      if (data.suppliers) {
        setSuppliers(data.suppliers);
        if (data.totals) setKpiTotals(data.totals);

        // Keep current selection or select first
        if (data.suppliers.length > 0) {
          const current = data.suppliers.find((s: SupplierDebtSummary) => s.SupplierId === selectedSupplierId);
          setSelectedSupplierId(current ? current.SupplierId : data.suppliers[0].SupplierId);
        } else {
          setSelectedSupplierId(null);
          setDetailReport(null);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast('Lỗi khi tải dữ liệu công nợ', 'error');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, keyword, selectedSupplierId, toast]);

  // Load detail report when selected supplier changes
  useEffect(() => {
    if (!selectedSupplierId || !fromDate || !toDate) {
      setDetailReport(null);
      return;
    }

    setDetailLoading(true);
    fetch(`/api/debts?supplierId=${selectedSupplierId}&fromDate=${fromDate}&toDate=${toDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.detail) {
          setDetailReport(data.detail);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setDetailLoading(false));
  }, [selectedSupplierId, fromDate, toDate]);

  // Load ancillary data
  useEffect(() => {
    fetch('/api/company-info')
      .then((res) => res.json())
      .then((d) => setCompanyInfo(d.info || null));

    fetch('/api/products')
      .then((res) => res.json())
      .then((d) => setProducts(d.products || []));

    fetch('/api/recipes')
      .then((res) => res.json())
      .then((d) => setRecipes(d.recipes || []));
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      loadDebts();
    }
  }, [fromDate, toDate, loadDebts]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (statusFilter && s.Status !== statusFilter) return false;
      return true;
    });
  }, [suppliers, statusFilter]);

  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.SupplierId === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  // Export CSV
  const handleExportCSV = () => {
    if (suppliers.length === 0) return;
    const headers = [
      'STT',
      'Tên Nhà Cung Cấp',
      'Điện thoại',
      'Địa chỉ',
      'Dư nợ Đầu Kỳ (đ)',
      'Phát sinh Tăng - Nhập kho (đ)',
      'Phát sinh Giảm - Đã trả (đ)',
      'Dư nợ Cuối Kỳ (đ)',
      'Trạng thái',
    ];

    const rows = filteredSuppliers.map((s, idx) => [
      idx + 1,
      `"${s.SupplierName.replace(/"/g, '""')}"`,
      `"${s.Phone || ''}"`,
      `"${(s.Address || '').replace(/"/g, '""')}"`,
      s.DauKy,
      s.TangTrongKy,
      s.GiamTrongKy,
      s.CuoiKy,
      s.Status === 'in_debt' ? 'Còn nợ' : s.Status === 'settled' ? 'Hết nợ' : 'Trả dư',
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Cong_No_NCC_${fromDate}_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Đã xuất báo cáo công nợ ra file Excel thành công', 'success');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 overflow-hidden select-none print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:block">
      {/* On-screen Page Content (Hidden when printing modal) */}
      <div className="print:hidden no-print flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Top Toolbar */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              disabled={!selectedSupplier}
              onClick={() => setCashVoucherOpen(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              <span>💸</span>
              <span>Chi trả tiền NCC</span>
            </button>

            <button
              disabled={!selectedSupplier}
              onClick={() => setInvoiceModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              <span>📥</span>
              <span>Nhập kho NCC</span>
            </button>

            <button
              onClick={() => setDebtOpeningModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <span>📝</span>
              <span>Nhập Số Dư Đầu Kỳ</span>
            </button>

            <div className="h-5 w-[1px] bg-slate-200 mx-1" />

            <button
              disabled={!detailReport || detailReport.Transactions.length === 0}
              onClick={() => setPrintModalOpen(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 text-xs font-semibold rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>🖨️</span>
              <span>In Biên bản Đối soát</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>📊</span>
              <span>Xuất Excel</span>
            </button>

            <button
              onClick={loadDebts}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>🔄</span>
              <span>Nạp lại</span>
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="">Tất cả trạng thái nợ</option>
              <option value="in_debt">🔴 Còn nợ</option>
              <option value="settled">🟢 Đã thanh toán hết</option>
              <option value="overpaid">🔵 Đã trả dư</option>
            </select>

            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadDebts()}
              placeholder="Tìm tên NCC, SĐT..."
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 placeholder-slate-400 w-48 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-100/70 border-b border-slate-200">
          <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wide">
                Tổng Công Nợ Phải Trả
              </p>
              <p className="text-lg font-bold font-mono text-rose-600 mt-0.5">
                {kpiTotals.totalPayable.toLocaleString('vi-VN')} ₫
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Số tiền còn phải thanh toán</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl">
              💳
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-blue-800 uppercase tracking-wide">
                Tiền Hàng Nhập Trong Kỳ
              </p>
              <p className="text-lg font-bold font-mono text-blue-700 mt-0.5">
                {kpiTotals.totalPurchased.toLocaleString('vi-VN')} ₫
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Phát sinh tăng từ phiếu nhập kho</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
              📥
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                Đã Thanh Toán Trong Kỳ
              </p>
              <p className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                {kpiTotals.totalPaid.toLocaleString('vi-VN')} ₫
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Đã chi trả qua phiếu chi tiền mặt</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
              💸
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">
                Nhà Cung Cấp Còn Nợ
              </p>
              <p className="text-lg font-bold font-mono text-amber-800 mt-0.5">
                {kpiTotals.suppliersInDebtCount}{' '}
                <span className="text-xs font-normal text-slate-500 font-sans">
                  / {suppliers.length} NCC
                </span>
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Có số dư nợ cuối kỳ {'>'} 0</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl">
              🏢
            </div>
          </div>
        </div>

        {/* Main Workspace: Split Master (Top 55%) & Detail (Bottom 45%) */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Master Table: Debt Summary by Supplier */}
          <div className="flex-[52] overflow-y-auto border-b border-slate-200 custom-scrollbar bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 text-slate-600 border-b border-slate-200 z-10 font-semibold shadow-xs">
                <tr>
                  <th className="p-2.5 w-10 text-center">STT</th>
                  <th className="p-2.5 w-72">Nhà Cung Cấp</th>
                  <th className="p-2.5 w-28">Số điện thoại</th>
                  <th className="p-2.5">Địa chỉ</th>
                  <th className="p-2.5 w-32 text-right">Dư đầu kỳ (₫)</th>
                  <th className="p-2.5 w-36 text-right">Tăng (Nhập kho ₫)</th>
                  <th className="p-2.5 w-36 text-right">Giảm (Đã trả ₫)</th>
                  <th className="p-2.5 w-36 text-right font-bold">Dư cuối kỳ (₫)</th>
                  <th className="p-2.5 w-28 text-center">Trạng thái</th>
                  <th className="p-2.5 w-24 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-600 rounded-full animate-spin" />
                        <span>Đang tải số liệu công nợ nhà cung cấp...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Không có phát sinh công nợ nhà cung cấp nào trong kỳ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s, idx) => {
                    const isSelected = selectedSupplierId === s.SupplierId;
                    return (
                      <tr
                        key={s.SupplierId}
                        onClick={() => setSelectedSupplierId(s.SupplierId)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-100/70 text-slate-900 font-medium'
                            : 'hover:bg-amber-50/50 text-slate-700'
                        }`}
                      >
                        <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-semibold text-slate-800">{s.SupplierName}</td>
                        <td className="p-2 font-mono text-slate-600">{s.Phone || '—'}</td>
                        <td className="p-2 truncate max-w-xs text-slate-500">{s.Address || '—'}</td>
                        <td className="p-2 text-right font-mono text-slate-700">
                          {s.DauKy.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-2 text-right font-mono text-blue-700 font-medium">
                          {s.TangTrongKy > 0 ? `+${s.TangTrongKy.toLocaleString('vi-VN')}` : '0'}
                        </td>
                        <td className="p-2 text-right font-mono text-emerald-700 font-medium">
                          {s.GiamTrongKy > 0 ? `-${s.GiamTrongKy.toLocaleString('vi-VN')}` : '0'}
                        </td>
                        <td
                          className={`p-2 text-right font-mono font-bold ${
                            s.CuoiKy > 0
                              ? 'text-rose-700 text-sm'
                              : s.CuoiKy < 0
                              ? 'text-blue-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {s.CuoiKy.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                              s.Status === 'in_debt'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : s.Status === 'overpaid'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {s.Status === 'in_debt'
                              ? 'Còn nợ'
                              : s.Status === 'overpaid'
                              ? 'Đã trả dư'
                              : 'Đã hết nợ'}
                          </span>
                        </td>
                        <td className="p-1.5 text-center">
                          <button
                            title="Chi trả tiền hàng cho NCC này"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSupplierId(s.SupplierId);
                              setCashVoucherOpen(true);
                            }}
                            className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-semibold transition-colors"
                          >
                            💸 Trả tiền
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Detail Panel: Transaction History & Reconciliation */}
          <div className="flex-[48] flex flex-col bg-white border-t border-slate-200 overflow-hidden">
            {/* Detail Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                  <span>📜</span>
                  <span>Sổ Chi tiết Giao dịch & Đối soát Công nợ:</span>
                  <strong className="text-slate-900 underline">
                    {selectedSupplier?.SupplierName || 'Chưa chọn NCC'}
                  </strong>
                </span>
                {selectedSupplier && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    (Dư nợ cuối kỳ:{' '}
                    <strong className="text-rose-700">
                      {selectedSupplier.CuoiKy.toLocaleString('vi-VN')} ₫
                    </strong>
                    )
                  </span>
                )}
              </div>

              {detailReport && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPrintModalOpen(true)}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-medium transition-colors flex items-center gap-1"
                  >
                    <span>🖨️</span>
                    <span>In Biên bản Đối soát</span>
                  </button>
                </div>
              )}
            </div>

            {/* Detail Table */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-slate-50/50">
              <table className="w-full text-left text-xs border-collapse bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="p-2 w-8 text-center">#</th>
                    <th className="p-2 w-24 text-center">Ngày hạch toán</th>
                    <th className="p-2 w-28 text-center">Số chứng từ</th>
                    <th className="p-2 w-32">Nghiệp vụ</th>
                    <th className="p-2">Diễn giải chứng từ</th>
                    <th className="p-2 w-32 text-right">Tăng (Tiền hàng ₫)</th>
                    <th className="p-2 w-32 text-right">Giảm (Thanh toán ₫)</th>
                    <th className="p-2 w-36 text-right font-bold">Dư nợ sau GD (₫)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailLoading ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-600 rounded-full animate-spin" />
                          <span>Đang tải lịch sử giao dịch...</span>
                        </div>
                      </td>
                    </tr>
                  ) : !detailReport ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        Chọn một nhà cung cấp ở bảng trên để xem chi tiết lịch sử mua hàng và thanh toán.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* Dư đầu kỳ row */}
                      <tr className="bg-slate-50/80 font-medium italic text-slate-700">
                        <td className="p-2 text-center text-slate-400">—</td>
                        <td className="p-2 text-center text-slate-500">{detailReport.FromDate}</td>
                        <td className="p-2 text-center font-mono text-slate-500">DƯ_ĐẦU_KỲ</td>
                        <td className="p-2">Số dư nợ chuyển sang</td>
                        <td className="p-2 text-slate-500">
                          Số dư công nợ chuyển sang đầu kỳ này
                          {detailReport.InitialOpeningDebt !== undefined && detailReport.InitialOpeningDebt > 0 && (
                            <span className="ml-1.5 text-[11px] font-semibold text-indigo-700">
                              (Đầu kỳ khai báo: {detailReport.InitialOpeningDebt.toLocaleString('vi-VN')} ₫{detailReport.InitialOpeningDate ? ` ngày ${detailReport.InitialOpeningDate}` : ''})
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right text-slate-400">—</td>
                        <td className="p-2 text-right text-slate-400">—</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800">
                          {detailReport.DauKy.toLocaleString('vi-VN')}
                        </td>
                      </tr>

                      {detailReport.Transactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400">
                            Không có phát sinh giao dịch nhập hàng hoặc thanh toán trong khoảng thời gian này.
                          </td>
                        </tr>
                      ) : (
                        detailReport.Transactions.map((tx, idx) => (
                          <tr key={tx.Id} className="hover:bg-slate-50">
                            <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                            <td className="p-2 text-center text-slate-600">{tx.DocDate}</td>
                            <td className="p-2 text-center font-mono font-bold text-slate-800">
                              {tx.DocCode}
                            </td>
                            <td className="p-2">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                  tx.DocType === 'nhap_kho'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : tx.DocType === 'phieu_chi'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {tx.DocTypeName}
                              </span>
                            </td>
                            <td className="p-2 text-slate-700 font-medium">{tx.Description}</td>
                            <td className="p-2 text-right font-mono text-blue-700 font-medium">
                              {tx.AmountIncrease > 0
                                ? `+${tx.AmountIncrease.toLocaleString('vi-VN')}`
                                : '—'}
                            </td>
                            <td className="p-2 text-right font-mono text-emerald-700 font-medium">
                              {tx.AmountDecrease > 0
                                ? `-${tx.AmountDecrease.toLocaleString('vi-VN')}`
                                : '—'}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">
                              {tx.RunningBalance.toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        ))
                      )}
                    </>
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
              Tổng số NCC phát sinh: <strong className="text-slate-800 font-mono">{suppliers.length}</strong>
            </span>
            <span>
              Tổng công nợ còn lại (TK 331):{' '}
              <strong className="text-rose-700 font-mono font-bold text-sm">
                {kpiTotals.totalPayable.toLocaleString('vi-VN')} ₫
              </strong>
            </span>
            <span>
              Tiền hàng nhập kỳ này:{' '}
              <strong className="text-blue-700 font-mono">
                {kpiTotals.totalPurchased.toLocaleString('vi-VN')} ₫
              </strong>
            </span>
            <span>
              Đã chi thanh toán kỳ này:{' '}
              <strong className="text-emerald-700 font-mono">
                {kpiTotals.totalPaid.toLocaleString('vi-VN')} ₫
              </strong>
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Hạch toán công nợ phải trả Nhà cung cấp • TK 331
          </div>
        </div>
      </div>

      {/* Debt Print Modal */}
      {printModalOpen && detailReport && (
        <DebtPrintModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          report={detailReport}
          companyInfo={companyInfo}
        />
      )}

      {/* Cash Voucher Modal for quick payment to supplier */}
      {cashVoucherOpen && selectedSupplier && (
        <CashVoucherModal
          isOpen={cashVoucherOpen}
          onClose={() => setCashVoucherOpen(false)}
          onSaved={() => {
            loadDebts();
            toast('Đã ghi nhận phiếu chi thanh toán công nợ thành công', 'success');
          }}
          initialType="chi"
          editingVoucher={
            {
              Id: 0,
              Type: 'chi',
              VoucherDate: new Date().toISOString().split('T')[0],
              Code: '',
              Partner: selectedSupplier.SupplierName,
              SupplierId: selectedSupplier.SupplierId,
              PartnerAddress: selectedSupplier.Address || '',
              Receiver: selectedSupplier.SupplierName,
              Reason: `Chi thanh toán tiền hàng cho ${selectedSupplier.SupplierName}`,
              Amount: Math.max(0, selectedSupplier.CuoiKy),
              PaymentMethod: 'Tiền mặt',
            } as any
          }
        />
      )}

      {/* Invoice Modal for quick receiving from supplier */}
      {invoiceModalOpen && selectedSupplier && (
        <InvoiceVoucherModal
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          onSaved={() => {
            loadDebts();
            toast('Đã ghi nhận phiếu nhập kho và cập nhật công nợ thành công', 'success');
          }}
          initialType="in"
          editingInvoice={
            {
              Id: 0,
              Type: 'in',
              InvDate: new Date().toISOString().split('T')[0],
              Code: '',
              Partner: selectedSupplier.SupplierName,
              SupplierId: selectedSupplier.SupplierId,
              Note: `Nhập kho nguyên vật liệu từ ${selectedSupplier.SupplierName}`,
              TotalAmount: 0,
            } as any
          }
          products={products}
          recipes={recipes}
          onProductsUpdated={setProducts}
        />
      )}

      {/* Debt Opening Modal */}
      {debtOpeningModalOpen && (
        <DebtOpeningModal
          isOpen={debtOpeningModalOpen}
          onClose={() => setDebtOpeningModalOpen(false)}
          onSaved={() => {
            loadDebts();
          }}
        />
      )}
    </div>
  );
}
