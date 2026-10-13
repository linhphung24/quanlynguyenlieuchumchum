'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StockOpeningAdj, Product } from '@/types';
import { useApp } from '@/contexts/AppContext';
import StockOpeningModal from './StockOpeningModal';
import StockOpeningImportModal from './StockOpeningImportModal';

export default function StockOpeningPage() {
  const { toast, setActivePage } = useApp();

  const [period, setPeriod] = useState<{ month: number; year: number; exists: boolean }>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    exists: false,
  });

  const [stocks, setStocks] = useState<StockOpeningAdj[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [onlyHasStock, setOnlyHasStock] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Modal State
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockOpeningAdj | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Tải dữ liệu tồn đầu và danh mục sản phẩm
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resStocks, resProducts] = await Promise.all([
        fetch('/api/stock-opening'),
        fetch('/api/products'),
      ]);

      const dataStocks = await resStocks.json();
      if (dataStocks.period) setPeriod(dataStocks.period);
      if (dataStocks.stocks) setStocks(dataStocks.stocks);

      const dataProducts = await resProducts.json();
      if (Array.isArray(dataProducts)) {
        setProducts(dataProducts);
      }
    } catch (err: any) {
      console.error(err);
      toast('Lỗi tải dữ liệu tồn đầu kỳ: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lưu hoặc cập nhật một mục tồn đầu kỳ
  const handleSaveItem = async (item: StockOpeningAdj, andContinue: boolean = false): Promise<boolean> => {
    try {
      const res = await fetch('/api/stock-opening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: period.month,
          year: period.year,
          stocks: [item],
        }),
      });

      if (res.ok) {
        toast(`Đã lưu tồn đầu cho '${item.ProductName}'!`, 'success');
        await loadData();
        return true;
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi lưu khai báo tồn đầu');
        return false;
      }
    } catch (err: any) {
      alert(err.message);
      return false;
    }
  };

  // Nhập khẩu hàng loạt từ Excel
  const handleImportItems = async (items: StockOpeningAdj[]) => {
    try {
      const res = await fetch('/api/stock-opening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: period.month,
          year: period.year,
          stocks: items,
        }),
      });

      if (res.ok) {
        toast(`Đã nhập khẩu thành công ${items.length} mặt hàng tồn đầu kỳ!`, 'success');
        await loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi nhập khẩu Excel');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Xóa một mục tồn đầu kỳ
  const handleDeleteItem = async (item: StockOpeningAdj) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa khai báo tồn đầu kỳ của '${item.ProductName}'?`)) {
      return;
    }

    try {
      const res = await fetch(
        `/api/stock-opening?productName=${encodeURIComponent(item.ProductName)}&month=${period.month}&year=${period.year}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        toast(`Đã xóa tồn đầu kỳ của '${item.ProductName}'!`, 'success');
        await loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi xóa');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Lọc danh sách
  const filteredStocks = useMemo(() => {
    let list = stocks;

    if (onlyHasStock) {
      list = list.filter((s) => Number(s.AdjQty || 0) > 0);
    }

    if (selectedWarehouse !== 'all') {
      list = list.filter((s) => s.Warehouse === selectedWarehouse);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.ProductName.toLowerCase().includes(q) ||
          (s.ProductCode && s.ProductCode.toLowerCase().includes(q)) ||
          (s.Category && s.Category.toLowerCase().includes(q))
      );
    }

    return list;
  }, [stocks, search, selectedWarehouse, onlyHasStock]);

  // Phân trang
  const totalPages = Math.ceil(filteredStocks.length / pageSize) || 1;
  const paginatedStocks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStocks.slice(start, start + pageSize);
  }, [filteredStocks, page, pageSize]);

  // Thống kê
  const totalStockQty = useMemo(() => {
    return filteredStocks.reduce((sum, s) => sum + Number(s.AdjQty || 0), 0);
  }, [filteredStocks]);

  const totalStockValue = useMemo(() => {
    return filteredStocks.reduce(
      (sum, s) => sum + Number(s.AdjQty || 0) * Number(s.CostPrice || 0),
      0
    );
  }, [filteredStocks]);

  const declaredCount = useMemo(() => {
    return stocks.filter((s) => Number(s.AdjQty || 0) > 0).length;
  }, [stocks]);

  // Checkbox select all
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(new Set(paginatedStocks.map((s) => s.ProductName)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (name: string) => {
    const next = new Set(selectedItems);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedItems(next);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-100 text-slate-800 overflow-hidden select-none font-sans">
      {/* 1. MISA Header Tabs Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 pt-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pb-2.5">
            <span>Kho hàng</span>
            <span>›</span>
            <span>Quản lý kho</span>
            <span>›</span>
            <span className="text-slate-800 font-semibold">Tồn kho đầu kỳ</span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <button
              onClick={() => setActivePage('products')}
              className="pb-2.5 text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5"
            >
              <span>Danh mục VTHH</span>
              <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {products.length}
              </span>
            </button>

            <button className="pb-2.5 font-bold text-blue-700 border-b-2 border-blue-600 transition-colors flex items-center gap-1.5">
              <span>Tồn kho đầu kỳ</span>
              <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                {declaredCount}
              </span>
            </button>

            <button
              onClick={() => setActivePage('invoices')}
              className="pb-2.5 text-slate-500 hover:text-blue-600 transition-colors"
            >
              Quy trình nhập kho
            </button>

            <button
              onClick={() => setActivePage('batches')}
              className="pb-2.5 text-slate-500 hover:text-blue-600 transition-colors"
            >
              Phân bổ lô FIFO
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pb-2">
          <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs flex items-center gap-1.5">
            <span className="text-slate-500">Kỳ gốc:</span>
            <span className="font-bold text-amber-900 font-mono">
              Tháng {String(period.month).padStart(2, '0')}/{period.year}
            </span>
          </div>
        </div>
      </div>

      {/* 2. MISA AMIS Toolbar */}
      <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Ô Tìm kiếm */}
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm kiếm theo mã, tên VTHH..."
              className="bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Lọc Kho */}
          <div className="flex items-center text-xs">
            <select
              value={selectedWarehouse}
              onChange={(e) => {
                setSelectedWarehouse(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 shadow-2xs"
            >
              <option value="all">Kho: Tất cả</option>
              <option value="Kho Tổng">Kho Tổng</option>
              <option value="Kho Nguyên liệu">Kho Nguyên liệu</option>
              <option value="Kho Vật liệu">Kho Vật liệu & Bao bì</option>
              <option value="Kho Bánh">Kho Thành phẩm / Bánh</option>
            </select>
          </div>

          {/* Checkbox lọc đã có tồn */}
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer hover:text-slate-800 ml-1">
            <input
              type="checkbox"
              checked={onlyHasStock}
              onChange={(e) => {
                setOnlyHasStock(e.target.checked);
                setPage(1);
              }}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>Chỉ hiện SP đã có tồn</span>
          </label>
        </div>

        {/* Các nút hành động chính theo MISA AMIS */}
        <div className="flex items-center gap-2">
          {/* Định mức VTHH */}
          <button
            onClick={() => setActivePage('recipes')}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Xem và chỉnh sửa định mức công thức"
          >
            <span>⭐</span>
            <span>Định mức VTHH</span>
          </button>

          {/* Nạp lại */}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 px-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs rounded-lg transition-colors shadow-2xs"
            title="Tải lại danh sách"
          >
            <span className={loading ? 'animate-spin inline-block' : ''}>🔄</span>
          </button>

          {/* Nhập từ Excel (Nút 3 trong ảnh MISA) */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-300 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span>📥</span>
            <span>Nhập từ Excel</span>
          </button>

          {/* Nút Thêm (Nút xanh MISA trong ảnh) */}
          <button
            onClick={() => {
              setEditingItem(null);
              setIsAddEditModalOpen(true);
            }}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Thêm</span>
          </button>
        </div>
      </div>

      {/* 3. Lưới dữ liệu Master Grid chuẩn MISA */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-50 text-slate-700 border-b border-slate-200 z-10 font-bold shadow-2xs">
            <tr className="divide-x divide-slate-200">
              <th className="p-2.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    paginatedStocks.length > 0 &&
                    paginatedStocks.every((s) => selectedItems.has(s.ProductName))
                  }
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="p-2.5 w-28">Ngày nhập kho</th>
              <th className="p-2.5 w-28">Số phiếu nhập</th>
              <th className="p-2.5 w-28">Mã hàng</th>
              <th className="p-2.5">Tên hàng</th>
              <th className="p-2.5 w-28">Nhóm VTHH</th>
              <th className="p-2.5 w-32">Mã kho</th>
              <th className="p-2.5 w-24">Số lô</th>
              <th className="p-2.5 w-24 text-center">Hạn sử dụng</th>
              <th className="p-2.5 w-16 text-center">ĐVT</th>
              <th className="p-2.5 w-28 text-right">Số lượng tồn</th>
              <th className="p-2.5 w-28 text-right">Đơn giá tồn (₫)</th>
              <th className="p-2.5 w-32 text-right">Thành tiền tồn (₫)</th>
              <th className="p-2.5 w-28 text-right">Tồn hiện tại</th>
              <th className="p-2.5 w-20 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedStocks.length === 0 ? (
              <tr>
                <td colSpan={15} className="p-12 text-center text-slate-400">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải danh sách tồn kho đầu kỳ...</span>
                    </div>
                  ) : (
                    <div>Không tìm thấy vật tư hàng hóa nào phù hợp.</div>
                  )}
                </td>
              </tr>
            ) : (
              paginatedStocks.map((s, idx) => {
                const hasStock = Number(s.AdjQty || 0) > 0;
                const isSelected = selectedItems.has(s.ProductName);
                const itemCost = Number(s.CostPrice || 0);
                const itemSubtotal = Number(s.AdjQty || 0) * itemCost;

                return (
                  <tr
                    key={s.ProductName}
                    className={`hover:bg-blue-50/50 transition-colors divide-x divide-slate-100 ${
                      isSelected ? 'bg-blue-50/70' : hasStock ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectItem(s.ProductName)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-2 font-mono text-slate-600 whitespace-nowrap">
                      {s.InvDate
                        ? new Date(s.InvDate).toLocaleDateString('vi-VN')
                        : `01/${String(period.month).padStart(2, '0')}/${period.year}`}
                    </td>
                    <td className="p-2 font-mono text-slate-700 font-medium">
                      {s.VoucherCode || 'OPN'}
                    </td>
                    <td className="p-2 font-mono text-slate-700 font-semibold">
                      {s.ProductCode || '—'}
                    </td>
                    <td className="p-2 font-medium text-slate-900">
                      <span>{s.ProductName}</span>
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          s.Category === 'Vật liệu'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {s.Category || 'Nguyên liệu'}
                      </span>
                    </td>
                    <td className="p-2 text-slate-700 whitespace-nowrap">
                      {s.Warehouse || 'Kho Tổng'}
                    </td>
                    <td className="p-2 font-mono text-slate-600">
                      {s.BatchNo || '—'}
                    </td>
                    <td className="p-2 text-center font-mono text-slate-600 whitespace-nowrap">
                      {s.ExpDate ? new Date(s.ExpDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="p-2 text-center text-slate-600 font-medium">
                      {s.Unit || 'kg'}
                    </td>
                    <td className="p-2 text-right">
                      <span
                        className={`font-mono font-bold text-xs ${
                          hasStock ? 'text-blue-700' : 'text-slate-400'
                        }`}
                      >
                        {Number(s.AdjQty || 0).toLocaleString('vi-VN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="p-2 text-right font-mono text-slate-700">
                      {itemCost > 0 ? (
                        <span>{itemCost.toLocaleString('vi-VN')}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-2 text-right font-mono font-semibold text-emerald-800">
                      {hasStock && itemCost > 0 ? (
                        <span>{itemSubtotal.toLocaleString('vi-VN')}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-600">
                      {Number(s.CurrentStock || 0).toLocaleString('vi-VN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingItem(s);
                            setIsAddEditModalOpen(true);
                          }}
                          className="p-1 hover:bg-blue-100 text-blue-700 rounded transition-colors"
                          title="Chỉnh sửa tồn đầu"
                        >
                          ✏
                        </button>
                        {hasStock && (
                          <button
                            onClick={() => handleDeleteItem(s)}
                            className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                            title="Xóa tồn đầu"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Footer Bar & Pagination */}
      <div className="h-11 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-600 shadow-xs">
        <div className="flex items-center gap-6">
          <span>
            Tổng số: <strong className="text-slate-900 font-mono">{filteredStocks.length}</strong> bản ghi
          </span>
          {selectedItems.size > 0 && (
            <span className="text-blue-700 font-medium">
              Đã chọn: <strong className="font-mono">{selectedItems.size}</strong>
            </span>
          )}
          <span>
            Tổng lượng tồn đầu:{' '}
            <strong className="text-blue-700 font-mono font-bold">
              {totalStockQty.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </span>
          <span>
            Tổng giá trị tồn đầu:{' '}
            <strong className="text-emerald-700 font-mono font-bold">
              {totalStockValue.toLocaleString('vi-VN')} ₫
            </strong>
          </span>
        </div>

        {/* Phân trang */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Số dòng/trang:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="border border-slate-300 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>Tất cả</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-0.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              ‹
            </button>
            <span className="font-mono text-slate-700 px-1">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-0.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Modal Thêm / Sửa tồn đầu kỳ chuẩn MISA AMIS */}
      <StockOpeningModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editingItem={editingItem}
        products={products}
        period={period}
      />

      {/* Modal Nhập khẩu từ Excel */}
      <StockOpeningImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportItems}
        products={products}
        period={period}
      />
    </div>
  );
}
