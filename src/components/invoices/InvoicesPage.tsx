'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Invoice, InvoiceDetail, Product, Recipe, CompanyInfo } from '@/types';
import { safeHeaderValue } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import InvoiceVoucherModal from './InvoiceVoucherModal';
import InvoicePrintModal from './InvoicePrintModal';

export default function InvoicesPage() {
  const { user, hasPermission, toast, currentModule } = useApp();
  const canApprove = ['admin', 'manager', 'ketoan', 'accountant'].includes((user?.Role || '').toLowerCase());

  // Data states
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<InvoiceDetail[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  // Filter states
  const [period, setPeriod] = useState<string>('this_month');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'in' | 'out'>('in');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Detail panel tab
  const [detailTab, setDetailTab] = useState<'items' | 'image'>('items');

  // Initialize dates based on period
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

  // Load invoices
  const loadInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      if (keyword) params.set('keyword', keyword);
      if (filterType) params.set('type', filterType);

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      if (data.invoices) {
        setInvoices(data.invoices);
        if (data.invoices.length > 0) {
          // Keep current selection or default to first
          const existing = data.invoices.find((i: Invoice) => i.Id === selectedInvoice?.Id);
          setSelectedInvoice(existing || data.invoices[0]);
        } else {
          setSelectedInvoice(null);
          setSelectedDetails([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [fromDate, toDate, keyword, filterType, selectedInvoice?.Id]);

  // Load details when selected invoice changes
  const loadSelectedDetails = useCallback((invoiceId: number) => {
    fetch(`/api/invoices/${invoiceId}/details`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedDetails(data.details || []);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedInvoice) {
      setSelectedDetails([]);
      return;
    }
    loadSelectedDetails(selectedInvoice.Id);
  }, [selectedInvoice, loadSelectedDetails]);

  // Load products & recipes & company info
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((d) => setProducts(d.products || []));

    fetch('/api/recipes')
      .then((res) => res.json())
      .then((d) => setRecipes(d.recipes || []));

    fetch('/api/company-info')
      .then((res) => res.json())
      .then((d) => setCompanyInfo(d.info || null));
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      loadInvoices();
    }
  }, [fromDate, toDate, loadInvoices]);

  // Filtered invoices by status
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (filterStatus && inv.ApprovalStatus !== filterStatus) return false;
      return true;
    });
  }, [invoices, filterStatus]);

  // Summary totals
  const totals = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const inv of filteredInvoices) {
      if (inv.Type === 'in') {
        if (!filterStatus ? inv.ApprovalStatus === 'approved' : true) totalIn += inv.TotalAmount;
      } else {
        if (!filterStatus ? inv.ApprovalStatus === 'approved' : true) totalOut += inv.TotalAmount;
      }
    }
    return {
      count: filteredInvoices.length,
      totalIn,
      totalOut,
      diff: totalIn - totalOut,
    };
  }, [filteredInvoices, filterStatus]);

  const pendingCount = useMemo(() => {
    return invoices.filter((i) => i.ApprovalStatus === 'pending').length;
  }, [invoices]);

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    if (!hasPermission('Menu_Invoices_Import', 'delete')) {
      alert('Bạn không có quyền xóa chứng từ này.');
      return;
    }
    const ok = confirm(`Bạn có chắc muốn xóa vĩnh viễn chứng từ ${selectedInvoice.Code}? Dữ liệu lô hàng FIFO sẽ được tính toán lại.`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/invoices/${selectedInvoice.Id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Đã xóa chứng từ và rebuild lô FIFO', 'success');
        loadInvoices();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi xóa chứng từ');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApproval = async (status: 'approved' | 'rejected' | 'pending') => {
    if (!selectedInvoice) return;
    if (!canApprove) {
      alert('Chỉ tài khoản Kế toán hoặc Quản trị viên mới có quyền phê duyệt chứng từ kho!');
      return;
    }
    const isImport = selectedInvoice.Type === 'in';
    const confirmMsg =
      status === 'approved'
        ? `Bạn có chắc muốn DUYỆT chứng từ ${isImport ? 'nhập' : 'xuất'} kho ${selectedInvoice.Code}? Lô hàng FIFO và tồn kho sẽ được cập nhật ngay lập tức.`
        : status === 'rejected'
        ? `Bạn có chắc muốn TỪ CHỐI duyệt chứng từ kho ${selectedInvoice.Code}?`
        : `Bạn có chắc muốn chuyển chứng từ kho ${selectedInvoice.Code} về trạng thái Chờ duyệt?`;

    if (!confirm(confirmMsg)) return;

    try {
      const userName = user?.FullName || user?.Username || 'ketoan';
      const userRole = user?.Role || 'ketoan';
      const res = await fetch(`/api/invoices/${selectedInvoice.Id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user': safeHeaderValue(userName, 'ketoan'),
          'x-user-role': safeHeaderValue(userRole, 'ketoan'),
        },
        body: JSON.stringify({ status, currentUser: userName }),
      });
      if (res.ok) {
        toast(
          status === 'approved'
            ? `Đã duyệt thành công chứng từ ${isImport ? 'nhập kho' : 'xuất kho'} ${selectedInvoice.Code}`
            : status === 'rejected'
            ? `Đã từ chối chứng từ kho ${selectedInvoice.Code}`
            : `Đã chuyển chứng từ ${selectedInvoice.Code} về Chờ duyệt`,
          'success'
        );
        loadInvoices();
        if (selectedInvoice) loadSelectedDetails(selectedInvoice.Id);
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi phê duyệt chứng từ');
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
            {/* Add Dropdown */}
            <div className="relative group">
              <button
                className={`px-3.5 py-1.5 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all ${
                  currentModule === 'warehouse'
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                }`}
              >
                <span>➕</span>
                <span>
                  {currentModule === 'warehouse' ? 'Lập phiếu kho' : 'Lập chứng từ kho'}
                </span>
                <span className="text-[10px]">▼</span>
              </button>
              <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 hidden group-hover:block z-30">
                <button
                  onClick={() => {
                    setEditingInvoice(null);
                    setModalType('in');
                    setModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2"
                >
                  <span>📥</span>
                  <span>Phiếu Nhập kho</span>
                </button>
                <button
                  onClick={() => {
                    setEditingInvoice(null);
                    setModalType('out');
                    setModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2"
                >
                  <span>📤</span>
                  <span>Phiếu Xuất kho</span>
                </button>
              </div>
            </div>

            {pendingCount > 0 && (
              <button
                onClick={() => setFilterStatus(filterStatus === 'pending' ? '' : 'pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                  filterStatus === 'pending'
                    ? 'bg-amber-500 text-white shadow-amber-500/25 ring-2 ring-amber-300'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                }`}
                title="Bấm để lọc danh sách chứng từ đang chờ duyệt"
              >
                <span>⏳</span>
                <span>{pendingCount} chờ duyệt</span>
              </button>
            )}

            <button
              disabled={!selectedInvoice}
              onClick={() => {
                setEditingInvoice(selectedInvoice);
                setModalType(selectedInvoice?.Type || 'in');
                setModalOpen(true);
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>✏️</span>
              <span>Sửa</span>
            </button>

            <button
              disabled={!selectedInvoice}
              onClick={handleDelete}
              className="px-3 py-1.5 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 hover:border-red-300 text-xs font-medium rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>🗑️</span>
              <span>Xóa</span>
            </button>

            <div className="h-5 w-[1px] bg-slate-200 mx-1" />

            {/* Approval buttons for accountant / manager / admin */}
            {selectedInvoice?.ApprovalStatus === 'pending' ? (
              canApprove ? (
                <>
                  <button
                    onClick={() => handleApproval('approved')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                    title="Kế toán duyệt chứng từ để ghi sổ kho và phân bổ lô FIFO"
                  >
                    <span>✅</span>
                    <span>{selectedInvoice.Type === 'in' ? 'Duyệt nhập kho' : 'Duyệt xuất kho'}</span>
                  </button>
                  <button
                    onClick={() => handleApproval('rejected')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                    title="Kế toán từ chối chứng từ"
                  >
                    <span>❌</span>
                    <span>Từ chối</span>
                  </button>
                  <div className="h-5 w-[1px] bg-slate-200 mx-1" />
                </>
              ) : (
                <>
                  <div className="px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-xs">
                    <span className="text-[10px]">⏳</span>
                    <span>Chờ kế toán duyệt</span>
                  </div>
                  <div className="h-5 w-[1px] bg-slate-200 mx-1" />
                </>
              )
            ) : selectedInvoice?.ApprovalStatus === 'approved' ? (
              canApprove && (
                <>
                  <button
                    onClick={() => handleApproval('pending')}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                    title="Bỏ duyệt, chuyển chứng từ về trạng thái Chờ duyệt"
                  >
                    <span>↩️</span>
                    <span>Bỏ duyệt</span>
                  </button>
                  <div className="h-5 w-[1px] bg-slate-200 mx-1" />
                </>
              )
            ) : selectedInvoice?.ApprovalStatus === 'rejected' ? (
              canApprove && (
                <>
                  <button
                    onClick={() => handleApproval('approved')}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                    title="Duyệt lại chứng từ"
                  >
                    <span>✅</span>
                    <span>Duyệt lại</span>
                  </button>
                  <div className="h-5 w-[1px] bg-slate-200 mx-1" />
                </>
              )
            ) : null}

            <button
              disabled={!selectedInvoice}
              onClick={() => setPrintModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>🖨️</span>
              <span>In chứng từ</span>
            </button>

            <button
              onClick={() => {
                loadInvoices();
                fetch('/api/products')
                  .then((res) => res.json())
                  .then((d) => setProducts(d.products || []));
                if (selectedInvoice) loadSelectedDetails(selectedInvoice.Id);
              }}
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="">Tất cả loại</option>
              <option value="in">📥 Nhập kho</option>
              <option value="out">📤 Xuất kho</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="approved">Đã duyệt</option>
              <option value="pending">Chờ duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>

            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadInvoices()}
              placeholder="Tìm số HĐ, đối tác, tên SP..."
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 placeholder-slate-400 w-48 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>
        </div>

        {/* Main Workspace: Split Master (Top 55%) & Detail (Bottom 45%) */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Master Table Grid */}
          <div className="flex-[55] overflow-y-auto border-b border-slate-200 custom-scrollbar bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 text-slate-600 border-b border-slate-200 z-10 font-semibold shadow-xs">
                <tr>
                  <th className="p-2.5 w-12 text-center">STT</th>
                  <th className="p-2.5 w-28">Số chứng từ</th>
                  <th className="p-2.5 w-24">Ngày lập</th>
                  <th className="p-2.5 w-24">Loại</th>
                  <th className="p-2.5 w-48">Đối tượng / NCC</th>
                  <th className="p-2.5">Diễn giải</th>
                  <th className="p-2.5 w-32 text-right">Tổng tiền (₫)</th>
                  <th className="p-2.5 w-28 text-center">Trạng thái</th>
                  <th className="p-2.5 w-28">Người lập</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Không có chứng từ kho nào trong kỳ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv, idx) => {
                    const isSelected = selectedInvoice?.Id === inv.Id;
                    const isImport = inv.Type === 'in';
                    return (
                      <tr
                        key={inv.Id}
                        onClick={() => setSelectedInvoice(inv)}
                        onDoubleClick={() => {
                          setEditingInvoice(inv);
                          setModalType(inv.Type);
                          setModalOpen(true);
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-100/70 text-slate-900 font-medium'
                            : 'hover:bg-amber-50/50 text-slate-700'
                        }`}
                      >
                        <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-mono font-semibold text-slate-800">{inv.Code}</td>
                        <td className="p-2 text-slate-600">{inv.InvDate}</td>
                        <td className="p-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              isImport
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {isImport ? 'Nhập kho' : 'Xuất kho'}
                          </span>
                        </td>
                        <td className="p-2 truncate font-medium text-slate-800">
                          {inv.Partner || '—'}
                        </td>
                        <td className="p-2 truncate max-w-xs text-slate-600">{inv.Note || '—'}</td>
                        <td className="p-2 text-right font-mono font-semibold text-slate-800">
                          {inv.TotalAmount.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              inv.ApprovalStatus === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : inv.ApprovalStatus === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                            title={
                              inv.ApprovalStatus === 'approved'
                                ? `Đã duyệt bởi: ${inv.ApprovedBy || 'Kế toán'} ${
                                    inv.ApprovedAt
                                      ? `(${new Date(inv.ApprovedAt).toLocaleDateString('vi-VN')})`
                                      : ''
                                  }`
                                : inv.ApprovalStatus === 'rejected'
                                ? 'Chứng từ bị từ chối'
                                : 'Chứng từ chờ Kế toán kiểm tra & phê duyệt'
                            }
                          >
                            {inv.ApprovalStatus === 'approved'
                              ? '✓ Đã duyệt'
                              : inv.ApprovalStatus === 'rejected'
                              ? '✕ Từ chối'
                              : '⏳ Chờ duyệt'}
                          </span>
                        </td>
                        <td className="p-2 truncate text-slate-600">{inv.CreatedBy || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Detail Panel */}
          <div className="flex-[45] flex flex-col bg-white border-t border-slate-200 overflow-hidden">
            {/* Detail Tab Navigation */}
            <div className="flex items-center justify-between px-4 pt-2 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDetailTab('items')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-all border-t border-x ${
                    detailTab === 'items'
                      ? 'bg-white text-amber-700 border-slate-200 border-t-2 border-t-amber-500'
                      : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
                >
                  Chi tiết hàng hóa ({selectedDetails.length})
                </button>
                {selectedInvoice?.ImageUrl && (
                  <button
                    onClick={() => setDetailTab('image')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-all border-t border-x ${
                      detailTab === 'image'
                        ? 'bg-white text-amber-700 border-slate-200 border-t-2 border-t-amber-500'
                        : 'text-slate-500 border-transparent hover:text-slate-700'
                    }`}
                  >
                    Ảnh chứng từ gốc 📎
                  </button>
                )}
              </div>

              {selectedInvoice && (
                <div className="flex items-center gap-2 pb-1">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Chứng từ đang chọn: <strong className="text-slate-800">{selectedInvoice.Code}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      loadSelectedDetails(selectedInvoice.Id);
                      fetch('/api/products')
                        .then((r) => r.json())
                        .then((d) => setProducts(d.products || []));
                      toast('Đã làm mới dữ liệu chi tiết chứng từ', 'info');
                    }}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded text-[11px] font-medium flex items-center gap-1 transition-colors shadow-xs"
                    title="Tải lại chi tiết và đơn vị tính mới nhất cho chứng từ này"
                  >
                    <span>🔄</span>
                    <span>Làm mới chi tiết</span>
                  </button>
                </div>
              )}
            </div>

            {/* Detail Tab Content */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-slate-50/50">
              {/* Approval status banner for selected invoice */}
              {selectedInvoice && (
                <div
                  className={`mb-3 p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                    selectedInvoice.ApprovalStatus === 'approved'
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                      : selectedInvoice.ApprovalStatus === 'rejected'
                      ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                      : 'bg-amber-50/80 border-amber-300 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {selectedInvoice.ApprovalStatus === 'approved'
                        ? '✅'
                        : selectedInvoice.ApprovalStatus === 'rejected'
                        ? '❌'
                        : '⏳'}
                    </span>
                    <div>
                      <strong>
                        {selectedInvoice.ApprovalStatus === 'approved'
                          ? 'Chứng từ đã được Kế toán duyệt'
                          : selectedInvoice.ApprovalStatus === 'rejected'
                          ? 'Chứng từ đã bị từ chối'
                          : 'Chứng từ đang chờ Kế toán duyệt'}
                      </strong>
                      <span className="ml-2 text-[11px] opacity-80">
                        {selectedInvoice.ApprovalStatus === 'approved'
                          ? `(Bởi ${selectedInvoice.ApprovedBy || 'Kế toán'}${
                              selectedInvoice.ApprovedAt
                                ? ` - ${new Date(selectedInvoice.ApprovedAt).toLocaleDateString('vi-VN')}`
                                : ''
                            }) • Đã hạch toán và tính tồn kho FIFO.`
                          : selectedInvoice.ApprovalStatus === 'rejected'
                          ? '• Không ghi nhận vào tồn kho và không phát sinh công nợ.'
                          : '• Chỉ khi Kế toán duyệt thì số liệu mới được ghi sổ và cập nhật lô hàng FIFO.'}
                      </span>
                    </div>
                  </div>
                  {canApprove && selectedInvoice.ApprovalStatus === 'pending' && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApproval('approved')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px] transition-colors shadow-xs"
                      >
                        ✓ Duyệt ngay
                      </button>
                      <button
                        onClick={() => handleApproval('rejected')}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium text-[11px] transition-colors shadow-xs"
                      >
                        ✕ Từ chối
                      </button>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'items' ? (
                <table className="w-full text-left text-xs border-collapse bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                      <th className="p-2 w-10 text-center">#</th>
                      <th className="p-2 w-28">Mã SP</th>
                      <th className="p-2">Tên sản phẩm / Nguyên liệu</th>
                      <th className="p-2 w-20 text-center">ĐVT</th>
                      <th className="p-2 w-28 text-right">Số lượng</th>
                      <th className="p-2 w-32 text-right">Đơn giá (₫)</th>
                      <th className="p-2 w-36 text-right">Thành tiền (₫)</th>
                      <th className="p-2 w-28">Hạn dùng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDetails.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400">
                          Chưa chọn chứng từ hoặc chứng từ không có dòng chi tiết.
                        </td>
                      </tr>
                    ) : (
                      selectedDetails.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 text-center text-slate-400">{i + 1}</td>
                          <td className="p-2 font-mono text-slate-600">{d.ProductCode || '—'}</td>
                          <td className="p-2 font-medium text-slate-800">{d.ProductName}</td>
                          <td className="p-2 text-center text-slate-600">{d.Unit}</td>
                          <td className="p-2 text-right font-medium text-slate-800">
                            {Number(d.Amount).toLocaleString('vi-VN', { maximumFractionDigits: 4 })}
                          </td>
                          <td className="p-2 text-right text-slate-600">
                            {Number(d.Price).toLocaleString('vi-VN')}
                          </td>
                          <td className="p-2 text-right font-mono font-semibold text-slate-900">
                            {(Number(d.Amount) * Number(d.Price)).toLocaleString('vi-VN')}
                          </td>
                          <td className="p-2 text-slate-500">{d.ExpDate || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center p-4">
                  {selectedInvoice?.ImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedInvoice.ImageUrl}
                      alt="Chứng từ gốc"
                      className="max-h-72 max-w-full rounded-xl border border-slate-200 shadow-md object-contain bg-white p-2"
                    />
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Summary Bar */}
        <div className="h-10 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-600 print:hidden no-print">
          <div className="flex items-center gap-6">
            <span>
              Số chứng từ: <strong className="text-slate-800 font-mono">{totals.count}</strong>
            </span>
            <span>
              Tổng nhập: <strong className="text-blue-700 font-mono">{totals.totalIn.toLocaleString('vi-VN')} ₫</strong>
            </span>
            <span>
              Tổng xuất: <strong className="text-amber-800 font-mono">{totals.totalOut.toLocaleString('vi-VN')} ₫</strong>
            </span>
            <span>
              Chênh lệch: <strong className="text-emerald-700 font-mono">{totals.diff.toLocaleString('vi-VN')} ₫</strong>
            </span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300 flex items-center gap-1">
                <span>⏳</span>
                <span>{pendingCount} chứng từ chờ kế toán duyệt</span>
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            Quy tắc: Hóa đơn Nhập và Xuất kho đều cần Kế toán duyệt trước khi ghi sổ tồn kho FIFO
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalOpen && (
        <InvoiceVoucherModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            loadInvoices();
            if (selectedInvoice) loadSelectedDetails(selectedInvoice.Id);
          }}
          initialType={modalType}
          editingInvoice={editingInvoice}
          products={products}
          recipes={recipes}
          onProductsUpdated={setProducts}
        />
      )}

      {printModalOpen && selectedInvoice && (
        <InvoicePrintModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          invoice={selectedInvoice}
          details={selectedDetails}
          companyInfo={companyInfo}
        />
      )}
    </div>
  );
}
