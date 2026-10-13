'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TongHopRow } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { safeHeaderValue } from '@/lib/utils';
import * as XLSX from 'xlsx';
import StockCardModal from './StockCardModal';

export default function SummaryPage() {
  const { currentModule, user, toast } = useApp();
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [rows, setRows] = useState<TongHopRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Stock card state
  const [selectedProductForStockCard, setSelectedProductForStockCard] = useState<string | null>(null);

  // Period lock state
  const [periodLocked, setPeriodLocked] = useState(false);
  const [periodLockedBy, setPeriodLockedBy] = useState<string | null>(null);
  const [periodLockedAt, setPeriodLockedAt] = useState<string | null>(null);
  const [locking, setLocking] = useState(false);

  const loadPeriodStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/periods?year=${year}&month=${month}`);
      const data = await res.json();
      setPeriodLocked(Boolean(data.isLocked));
      setPeriodLockedBy(data.lockedBy || null);
      setPeriodLockedAt(data.lockedAt || null);
    } catch (err) {
      console.error(err);
    }
  }, [year, month]);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/summary?year=${year}&month=${month}`);
      const data = await res.json();
      if (data.summary) {
        setRows(data.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadSummary();
    loadPeriodStatus();
  }, [loadSummary, loadPeriodStatus]);

  const handleTogglePeriodLock = async () => {
    const nextLocked = !periodLocked;
    const confirmMsg = nextLocked
      ? `Bạn có chắc muốn KHÓA SỔ kỳ kế toán Tháng ${month}/${year}? Sau khi khóa, hệ thống sẽ NGĂN CHẶN mọi hành vi thêm, sửa, xóa chứng từ kho và thu chi trong tháng này.`
      : `Bạn có chắc muốn MỞ KHÓA SỔ kỳ kế toán Tháng ${month}/${year}?`;
    if (!confirm(confirmMsg)) return;

    setLocking(true);
    try {
      const userName = user?.FullName || user?.Username || 'ketoan';
      const res = await fetch('/api/periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user': safeHeaderValue(userName, 'ketoan'),
        },
        body: JSON.stringify({
          year,
          month,
          isLocked: nextLocked,
          currentUser: userName,
        }),
      });

      if (res.ok) {
        toast(
          nextLocked
            ? `Đã khóa sổ kỳ Tháng ${month}/${year}`
            : `Đã mở khóa sổ kỳ Tháng ${month}/${year}`,
          'success'
        );
        loadPeriodStatus();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi cập nhật trạng thái khóa sổ');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLocking(false);
    }
  };

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.Name.toLowerCase().includes(q) ||
        (r.Code && r.Code.toLowerCase().includes(q)) ||
        (r.Category && r.Category.toLowerCase().includes(q))
    );
  }, [rows, search]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => ({
        tienDau: acc.tienDau + r.TienDau,
        tienNhap: acc.tienNhap + r.TienNhap,
        tienXuat: acc.tienXuat + r.TienXuat,
        tienCuoi: acc.tienCuoi + r.TienCuoi,
      }),
      { tienDau: 0, tienNhap: 0, tienXuat: 0, tienCuoi: 0 }
    );
  }, [filteredRows]);

  const exportExcel = () => {
    const dataToExport = filteredRows.map((r, i) => ({
      STT: i + 1,
      'Mã hàng': r.Code,
      'Tên hàng': r.Name,
      'Danh mục': r.Category,
      ĐVT: r.Unit,
      'Đơn giá (₫)': r.DonGia,
      'Tồn đầu': r.TonDau,
      'Tiền đầu (₫)': r.TienDau,
      'Nhập trong kỳ': r.Nhap,
      'Tiền nhập (₫)': r.TienNhap,
      'Xuất trong kỳ': r.Xuat,
      'Tiền xuất (₫)': r.TienXuat,
      'Tồn cuối': r.TonCuoi,
      'Tiền cuối (₫)': r.TienCuoi,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `NXT_${month}_${year}`);
    XLSX.writeFile(wb, `TongHop_NXT_Thang_${month}_${year}.xlsx`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 font-medium">Tháng:</span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 font-medium">Năm:</span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã hoặc tên sản phẩm..."
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 w-56 focus:outline-none focus:border-amber-500 shadow-xs"
          />

          <button
            onClick={loadSummary}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>🔄</span>
            <span>Xem báo cáo</span>
          </button>
        </div>

        <button
          onClick={exportExcel}
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
        >
          <span>📑</span>
          <span>Xuất Excel</span>
        </button>
      </div>

      {/* Module Context & Period Lock Banner */}
      <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {currentModule === 'warehouse' ? (
            <span className="px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-900 font-semibold flex items-center gap-1.5 border border-amber-200">
              <span>🥖</span>
              <span>Phân hệ Kho: Bấm nút "📋 Thẻ kho" ở mỗi dòng để xem lịch sử Nhập - Xuất - Tồn chi tiết từng ngày</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-indigo-100/80 text-indigo-900 font-semibold flex items-center gap-1.5 border border-indigo-200">
              <span>💼</span>
              <span>Phân hệ Kế toán: Báo cáo Tổng hợp Nhập - Xuất - Tồn đầy đủ Số lượng & Giá trị tiền tệ</span>
            </span>
          )}
        </div>

        {/* Period Lock Status & Actions */}
        <div className="flex items-center gap-2">
          {periodLocked ? (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-200 text-rose-800 font-bold flex items-center gap-1.5 shadow-xs">
                <span>🔒</span>
                <span>ĐÃ KHÓA SỔ THÁNG {month}/{year}</span>
                {periodLockedBy && (
                  <span className="font-normal text-[11px] text-rose-600">({periodLockedBy})</span>
                )}
              </span>
              {(user?.Role === 'admin' || user?.Role === 'manager' || user?.Role === 'ketoan') && (
                <button
                  onClick={handleTogglePeriodLock}
                  disabled={locking}
                  className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-lg shadow-xs transition-colors"
                >
                  {locking ? 'Đang mở...' : '🔓 Mở khóa sổ'}
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium flex items-center gap-1.5">
                <span>🔓</span>
                <span>Kỳ kế toán đang mở</span>
              </span>
              {(user?.Role === 'admin' || user?.Role === 'manager' || user?.Role === 'ketoan') && (
                <button
                  onClick={handleTogglePeriodLock}
                  disabled={locking}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1"
                >
                  <span>🔒</span>
                  <span>{locking ? 'Đang khóa...' : `Khóa sổ Tháng ${month}/${year}`}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-white">
        <table className="w-full text-left text-xs border-collapse min-w-[1280px]">
          <thead className="sticky top-0 bg-slate-100 text-slate-700 border-b border-slate-200 z-10 font-semibold shadow-xs">
            <tr>
              <th rowSpan={2} className="p-2 w-10 text-center border-r border-slate-200">
                STT
              </th>
              <th rowSpan={2} className="p-2 w-24 border-r border-slate-200">
                Mã hàng
              </th>
              <th rowSpan={2} className="p-2 border-r border-slate-200">
                Tên hàng hóa, vật tư
              </th>
              <th rowSpan={2} className="p-2 w-16 text-center border-r border-slate-200">
                ĐVT
              </th>
              <th rowSpan={2} className="p-2 w-24 text-right border-r border-slate-200">
                Đơn giá vốn
              </th>
              <th colSpan={2} className="p-1.5 text-center border-r border-slate-200 bg-amber-50 text-amber-900">
                Tồn đầu kỳ
              </th>
              <th colSpan={2} className="p-1.5 text-center border-r border-slate-200 bg-blue-50 text-blue-900">
                Nhập trong kỳ
              </th>
              <th colSpan={2} className="p-1.5 text-center border-r border-slate-200 bg-orange-50 text-orange-900">
                Xuất trong kỳ
              </th>
              <th colSpan={2} className="p-1.5 text-center border-r border-slate-200 bg-emerald-50 text-emerald-900">
                Tồn cuối kỳ
              </th>
              <th rowSpan={2} className="p-2 w-20 text-center">
                Thao tác
              </th>
            </tr>
            <tr className="border-b border-slate-200 text-[11px]">
              <th className="p-1.5 text-right w-20 border-r border-slate-200 bg-amber-50 text-amber-900">
                Số lượng
              </th>
              <th className="p-1.5 text-right w-28 border-r border-slate-200 bg-amber-50 text-amber-900">
                Thành tiền
              </th>
              <th className="p-1.5 text-right w-20 border-r border-slate-200 bg-blue-50 text-blue-900">
                Số lượng
              </th>
              <th className="p-1.5 text-right w-28 border-r border-slate-200 bg-blue-50 text-blue-900">
                Thành tiền
              </th>
              <th className="p-1.5 text-right w-20 border-r border-slate-200 bg-orange-50 text-orange-900">
                Số lượng
              </th>
              <th className="p-1.5 text-right w-28 border-r border-slate-200 bg-orange-50 text-orange-900">
                Thành tiền
              </th>
              <th className="p-1.5 text-right w-20 border-r border-slate-200 bg-emerald-50 text-emerald-900">
                Số lượng
              </th>
              <th className="p-1.5 text-right w-28 border-r border-slate-200 bg-emerald-50 text-emerald-900">
                Thành tiền
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={14} className="p-8 text-center text-slate-400">
                  Đang tổng hợp số liệu tồn kho...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={14} className="p-8 text-center text-slate-400">
                  Không có phát sinh hàng hóa trong tháng {month}/{year}.
                </td>
              </tr>
            ) : (
              filteredRows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2 text-center text-slate-400 border-r border-slate-100">
                    {i + 1}
                  </td>
                  <td className="p-2 font-mono text-slate-600 border-r border-slate-100">
                    {r.Code || '—'}
                  </td>
                  <td className="p-2 font-medium text-slate-800 border-r border-slate-100">
                    <button
                      onClick={() => setSelectedProductForStockCard(r.Name)}
                      className="text-left hover:text-amber-600 hover:underline transition-colors"
                      title="Bấm để xem Thẻ kho chi tiết"
                    >
                      {r.Name}
                    </button>
                  </td>
                  <td className="p-2 text-center text-slate-600 border-r border-slate-100">
                    {r.Unit}
                  </td>
                  <td className="p-2 text-right text-slate-600 border-r border-slate-100">
                    {r.DonGia.toLocaleString('vi-VN')}
                  </td>

                  {/* Tồn đầu */}
                  <td className="p-2 text-right border-r border-slate-100">
                    {Number(r.TonDau).toLocaleString('vi-VN', { maximumFractionDigits: 4 })}
                  </td>
                  <td className="p-2 text-right font-mono border-r border-slate-100">
                    {r.TienDau.toLocaleString('vi-VN')}
                  </td>

                  {/* Nhập */}
                  <td className="p-2 text-right text-blue-700 font-medium border-r border-slate-100">
                    {Number(r.Nhap).toLocaleString('vi-VN', { maximumFractionDigits: 4 })}
                  </td>
                  <td className="p-2 text-right font-mono text-blue-700 border-r border-slate-100">
                    {r.TienNhap.toLocaleString('vi-VN')}
                  </td>

                  {/* Xuất */}
                  <td className="p-2 text-right text-amber-800 font-medium border-r border-slate-100">
                    {Number(r.Xuat).toLocaleString('vi-VN', { maximumFractionDigits: 4 })}
                  </td>
                  <td className="p-2 text-right font-mono text-amber-800 border-r border-slate-100">
                    {r.TienXuat.toLocaleString('vi-VN')}
                  </td>

                  {/* Tồn cuối */}
                  <td className="p-2 text-right font-semibold text-emerald-800 border-r border-slate-100">
                    {Number(r.TonCuoi).toLocaleString('vi-VN', { maximumFractionDigits: 4 })}
                  </td>
                  <td className="p-2 text-right font-mono font-semibold text-emerald-800 border-r border-slate-100">
                    {r.TienCuoi.toLocaleString('vi-VN')}
                  </td>

                  {/* Thao tác Thẻ kho */}
                  <td className="p-1 text-center">
                    <button
                      onClick={() => setSelectedProductForStockCard(r.Name)}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 mx-auto shadow-xs"
                      title="Xem Thẻ kho chi tiết từng ngày"
                    >
                      <span>📋</span>
                      <span>Thẻ kho</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="h-10 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-6">
          <span>
            Tiền đầu kỳ:{' '}
            <strong className="text-slate-800 font-mono">
              {totals.tienDau.toLocaleString('vi-VN')} ₫
            </strong>
          </span>
          <span>
            Tiền nhập:{' '}
            <strong className="text-blue-700 font-mono">
              {totals.tienNhap.toLocaleString('vi-VN')} ₫
            </strong>
          </span>
          <span>
            Tiền xuất:{' '}
            <strong className="text-amber-800 font-mono">
              {totals.tienXuat.toLocaleString('vi-VN')} ₫
            </strong>
          </span>
          <span>
            Tiền cuối kỳ:{' '}
            <strong className="text-emerald-700 font-mono">
              {totals.tienCuoi.toLocaleString('vi-VN')} ₫
            </strong>
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Số lượng mặt hàng: {filteredRows.length}
        </div>
      </div>

      {/* Stock Card Modal */}
      {selectedProductForStockCard && (
        <StockCardModal
          isOpen={Boolean(selectedProductForStockCard)}
          onClose={() => setSelectedProductForStockCard(null)}
          productName={selectedProductForStockCard}
          initialFromDate={`${year}-${String(month).padStart(2, '0')}-01`}
          initialToDate={`${year}-${String(month).padStart(2, '0')}-${String(
            new Date(year, month, 0).getDate()
          ).padStart(2, '0')}`}
        />
      )}
    </div>
  );
}
