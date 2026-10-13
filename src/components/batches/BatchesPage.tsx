'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Batch } from '@/types';
import { useApp } from '@/contexts/AppContext';

export default function BatchesPage() {
  const { toast } = useApp();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [rebuilding, setRebuilding] = useState(false);

  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch(`/api/batches?search=${encodeURIComponent(search)}&status=${statusFilter}`);
      const data = await res.json();
      if (data.batches) {
        setBatches(data.batches);
      }
    } catch (err) {
      console.error(err);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const handleRebuild = async () => {
    const ok = confirm(
      'Hành động này sẽ xóa và tính toán lại toàn bộ số dư lô hàng FIFO từ Khai báo tồn đầu và các Hóa đơn. Bạn có chắc chắn muốn tiếp tục?'
    );
    if (!ok) return;

    setRebuilding(true);
    try {
      const res = await fetch('/api/batches/rebuild', { method: 'POST' });
      if (res.ok) {
        toast('Đã tính toán lại toàn bộ lô FIFO thành công!', 'success');
        loadBatches();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi rebuild');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRebuilding(false);
    }
  };

  const totalRemaining = batches.reduce((sum, b) => sum + Number(b.RemainingQty || 0), 0);
  const totalValue = batches.reduce(
    (sum, b) => sum + (Number(b.RemainingQty || 0) * Number(b.Price || 0)),
    0
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 overflow-hidden select-none">
      {/* Toolbar */}
      <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                statusFilter === 'active'
                  ? 'bg-amber-500 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Còn hàng ({batches.filter((b) => b.RemainingQty > 0.001).length})
            </button>
            <button
              onClick={() => setStatusFilter('empty')}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                statusFilter === 'empty'
                  ? 'bg-amber-500 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Đã hết ({batches.filter((b) => b.RemainingQty <= 0.001).length})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                statusFilter === 'all'
                  ? 'bg-amber-500 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã SP, tên SP, số HĐ..."
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 w-56 focus:outline-none focus:border-amber-500 shadow-xs"
          />

          <button
            onClick={loadBatches}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>🔄</span>
            <span>Nạp lại</span>
          </button>
        </div>

        <button
          disabled={rebuilding}
          onClick={handleRebuild}
          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {rebuilding ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang tính toán lại FIFO...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Rebuild toàn bộ Lô FIFO</span>
            </>
          )}
        </button>
      </div>

      {/* Batches Table Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-100 text-slate-600 border-b border-slate-200 z-10 font-semibold shadow-xs">
            <tr>
              <th className="p-2.5 w-12 text-center">STT</th>
              <th className="p-2.5 w-28">Mã SP</th>
              <th className="p-2.5">Tên sản phẩm / Nguyên liệu</th>
              <th className="p-2.5 w-32">Số HĐ nhập</th>
              <th className="p-2.5 w-24">Ngày nhập</th>
              <th className="p-2.5 w-24 text-right">SL ban đầu</th>
              <th className="p-2.5 w-24 text-right">SL còn lại</th>
              <th className="p-2.5 w-16 text-center">ĐVT</th>
              <th className="p-2.5 w-28 text-right">Đơn giá (₫)</th>
              <th className="p-2.5 w-32 text-right">Giá trị tồn (₫)</th>
              <th className="p-2.5 w-28 text-center">Hạn sử dụng</th>
              <th className="p-2.5 w-24 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {batches.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-8 text-center text-slate-400">
                  Không tìm thấy lô hàng nào phù hợp.
                </td>
              </tr>
            ) : (
              batches.map((b, idx) => {
                const isOutOfStock = b.RemainingQty <= 0.001;
                const value = b.RemainingQty * b.Price;

                // Expiry calculation
                let expBadge = null;
                if (b.ExpDate) {
                  const now = new Date();
                  const exp = new Date(b.ExpDate);
                  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
                  if (diffDays <= 0) {
                    expBadge = <span className="text-red-600 font-bold">Hết hạn</span>;
                  } else if (diffDays <= 30) {
                    expBadge = <span className="text-amber-600 font-semibold">{diffDays} ngày</span>;
                  } else {
                    expBadge = <span className="text-slate-500">{exp.toLocaleDateString('vi-VN')}</span>;
                  }
                }

                return (
                  <tr
                    key={b.Id}
                    className={`transition-colors hover:bg-slate-50 ${
                      isOutOfStock ? 'opacity-50 text-slate-400' : 'text-slate-700'
                    }`}
                  >
                    <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                    <td className="p-2 font-mono text-slate-600">{b.ProductCode || '—'}</td>
                    <td className="p-2 font-medium text-slate-800">{b.ProductName}</td>
                    <td className="p-2 font-mono text-amber-700">{b.InvoiceCode}</td>
                    <td className="p-2 text-slate-600">{b.InvoiceDate ? b.InvoiceDate.split('T')[0] : '—'}</td>
                    <td className="p-2 text-right">{Number(b.Quantity).toLocaleString('vi-VN')}</td>
                    <td className="p-2 text-right font-semibold text-slate-800">
                      {Number(b.RemainingQty).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-2 text-center text-slate-600">{b.Unit}</td>
                    <td className="p-2 text-right text-slate-600">{Number(b.Price).toLocaleString('vi-VN')}</td>
                    <td className="p-2 text-right font-mono font-semibold text-slate-900">
                      {value.toLocaleString('vi-VN')}
                    </td>
                    <td className="p-2 text-center text-[11px]">{expBadge || '—'}</td>
                    <td className="p-2 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isOutOfStock
                            ? 'bg-gray-100 text-gray-500 border-gray-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isOutOfStock ? 'Đã hết' : 'Còn hàng'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="h-10 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-6">
          <span>
            Tổng số lô hiển thị: <strong className="text-slate-800 font-mono">{batches.length}</strong>
          </span>
          <span>
            Tổng lượng tồn còn lại:{' '}
            <strong className="text-emerald-700 font-mono">
              {totalRemaining.toLocaleString('vi-VN')}
            </strong>
          </span>
          <span>
            Tổng giá trị tồn kho FIFO:{' '}
            <strong className="text-amber-800 font-mono">
              {totalValue.toLocaleString('vi-VN')} ₫
            </strong>
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Quy tắc FIFO: Lô nhập trước được tự động xuất trước theo thời gian
        </div>
      </div>
    </div>
  );
}
