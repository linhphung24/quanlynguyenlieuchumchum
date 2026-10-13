'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { fmtPrice } from '@/lib/utils';

export default function PosShiftsPage() {
  const { user, toast } = useApp();
  const [shiftData, setShiftData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Open Shift Form
  const [openingCash, setOpeningCash] = useState<number>(1000000);
  const [openingNotes, setOpeningNotes] = useState('');
  const [openingLoading, setOpeningLoading] = useState(false);

  // Close Shift Modal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');
  const [closingLoading, setClosingLoading] = useState(false);

  // Cash denomination counter
  const [denominations, setDenominations] = useState<Record<number, number>>({
    500000: 0,
    200000: 0,
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  });

  // Shift Report Details
  const [shiftReport, setShiftReport] = useState<any>(null);
  const [showZReportModal, setShowZReportModal] = useState(false);

  const fetchCurrentShift = useCallback(async () => {
    try {
      const res = await fetch('/api/pos/shifts');
      if (res.ok) {
        const data = await res.json();
        setShiftData(data.activeShift);
        if (data.activeShift?.Id) {
          // Fetch report stats for this active shift
          const repRes = await fetch(`/api/pos/reports/shift/${data.activeShift.Id}`);
          if (repRes.ok) {
            const repData = await repRes.json();
            setShiftReport(repData);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch shift:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentShift();
  }, [fetchCurrentShift]);

  // Handle open shift
  const handleOpenShift = async () => {
    setOpeningLoading(true);
    try {
      const res = await fetch('/api/pos/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          openingCash,
          cashierId: user?.Id || 1,
          cashierName: user?.FullName || user?.Username || 'Thu ngân',
          notes: openingNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast('Mở ca bán hàng mới thành công!', 'success');
        fetchCurrentShift();
      } else {
        toast(data.error || 'Lỗi mở ca bán hàng', 'error');
      }
    } catch (err) {
      toast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setOpeningLoading(false);
    }
  };

  // Denominations count calculation
  const totalCountedCash = useMemo(() => {
    return Object.entries(denominations).reduce(
      (sum, [valueStr, count]) => sum + Number(valueStr) * (count || 0),
      0
    );
  }, [denominations]);

  const handleDenomChange = (val: number, count: number) => {
    setDenominations((prev) => ({
      ...prev,
      [val]: Math.max(0, count || 0),
    }));
  };

  // Handle close shift
  const handleCloseShift = async () => {
    setClosingLoading(true);
    try {
      const res = await fetch('/api/pos/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          closingCashActual: totalCountedCash,
          notes: closeNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast('Chốt ca bán hàng thành công! Đã tự động hạch toán vào sổ quỹ.', 'success');
        setShowCloseModal(false);
        setShowZReportModal(true);
        fetchCurrentShift();
      } else {
        toast(data.error || 'Lỗi chốt ca', 'error');
      }
    } catch (err) {
      toast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setClosingLoading(false);
    }
  };

  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 select-none overflow-y-auto custom-scrollbar">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200/90 px-6 py-4 flex items-center justify-between shadow-xs print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Quản Lý Ca Bán Hàng & Báo Cáo Chốt Ca</span>
            {shiftData && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Ca đang mở
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mở ca, kiểm đếm két tiền thực tế, đối soát chênh lệch và in phiếu bàn giao Z-Report
          </p>
        </div>

        {shiftData && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowZReportModal(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>📋</span>
              <span>Xem Báo cáo ca (Z-Report)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCloseModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-colors"
            >
              <span>🔒</span>
              <span>Chốt Ca & Bàn Giao</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="h-40 flex items-center justify-center text-slate-400 text-xs">
            Đang tải thông tin ca...
          </div>
        ) : !shiftData ? (
          /* ================= NO OPEN SHIFT ================= */
          <div className="max-w-lg mx-auto bg-white rounded-3xl p-8 border border-slate-200/90 shadow-lg text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
              💰
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800">Hiện Chưa Mở Ca Bán Hàng</h3>
              <p className="text-xs text-slate-500 mt-1">
                Vui lòng nhập số tiền mặt có sẵn trong két để bắt đầu ca bán hàng mới
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiền mặt đầu ca trong két (VNĐ):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50000"
                    value={openingCash || ''}
                    onChange={(e) => setOpeningCash(Number(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 pr-12"
                    placeholder="1.000.000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                    đ
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thu ngân phụ trách ca:
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.FullName || user?.Username || 'Thu ngân'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú mở ca (nếu có):
                </label>
                <input
                  type="text"
                  value={openingNotes}
                  onChange={(e) => setOpeningNotes(e.target.value)}
                  placeholder="Ví dụ: Ca sáng 06:30 - 14:30..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <button
                type="button"
                onClick={handleOpenShift}
                disabled={openingLoading}
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {openingLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>🚀</span>
                )}
                <span>Bắt Đầu & Mở Ca Bán Hàng</span>
              </button>
            </div>
          </div>
        ) : (
          /* ================= ACTIVE SHIFT DASHBOARD ================= */
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Mã Ca & Thu Ngân
                </span>
                <h4 className="text-base font-bold text-slate-800">{shiftData.ShiftCode}</h4>
                <p className="text-xs text-slate-500">
                  Thu ngân: <strong className="text-slate-700">{shiftData.CashierName}</strong>
                </p>
                <p className="text-[10px] text-slate-400">
                  Mở lúc: {new Date(shiftData.OpenedAt).toLocaleTimeString('vi-VN')}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Tiền Mặt Đầu Ca
                </span>
                <h4 className="text-xl font-extrabold text-slate-800 font-mono">
                  {fmtPrice(shiftData.OpeningCash)} đ
                </h4>
                <p className="text-xs text-slate-500">Tiền thối sẵn trong két</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Doanh Thu Trong Ca
                </span>
                <h4 className="text-xl font-extrabold text-rose-600 font-mono">
                  {fmtPrice(shiftData.LiveTotalSales || 0)} đ
                </h4>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>💵 Mặt: {fmtPrice(shiftData.LiveCashSales || 0)} đ</span>
                  <span>📱 QR: {fmtPrice(shiftData.LiveQRSales || 0)} đ</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Tiền Mặt Kỳ Vọng Trong Két
                </span>
                <h4 className="text-xl font-extrabold text-emerald-600 font-mono">
                  {fmtPrice(shiftData.ExpectedCash || 0)} đ
                </h4>
                <p className="text-[11px] text-slate-500">Đầu ca + Doanh thu tiền mặt</p>
              </div>
            </div>

            {/* Sales breakdown by items */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <span>🥐 Mặt Hàng Bán Chạy Trong Ca</span>
                    <span className="text-xs text-slate-400 font-normal">
                      ({shiftReport?.itemStats?.length || 0} món)
                    </span>
                  </h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Tên Sản Phẩm / Món</th>
                      <th className="py-2.5 px-3">ĐVT</th>
                      <th className="py-2.5 px-3 text-center">Số Lượng Bán</th>
                      <th className="py-2.5 px-3 text-right">Đơn Giá</th>
                      <th className="py-2.5 px-3 text-right">Tổng Doanh Thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(!shiftReport?.itemStats || shiftReport.itemStats.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Chưa có món nào được thanh toán trong ca này
                        </td>
                      </tr>
                    ) : (
                      shiftReport.itemStats.map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {it.ProductName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{it.Unit}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                            {it.TotalQty}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                            {fmtPrice(it.Price)} đ
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-rose-600 font-mono">
                            {fmtPrice(it.TotalAmount)} đ
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ================= MODAL CHỐT CA & KIỂM ĐẾM TIỀN KÉT ================= */}
      {showCloseModal && shiftData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">
                  Chốt Ca & Kiểm Két ({shiftData.ShiftCode})
                </h3>
                <p className="text-xs text-slate-500">
                  Nhập số tờ theo từng mệnh giá tiền mặt thực tế trong két
                </p>
              </div>
              <button
                onClick={() => setShowCloseModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Denomination Counter */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Bảng Kê Mệnh Giá Tiền Mặt:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.keys(denominations)
                  .map(Number)
                  .sort((a, b) => b - a)
                  .map((val) => (
                    <div key={val} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                      <span className="font-mono font-bold text-slate-700 w-16">
                        {fmtPrice(val)}:
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={denominations[val] || ''}
                          onChange={(e) => handleDenomChange(val, Number(e.target.value))}
                          placeholder="0"
                          className="w-16 px-2 py-1 text-center font-mono font-bold border rounded-lg focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400">tờ</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Reconciliation summary */}
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200/90 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tiền mặt kỳ vọng trong phần mềm:</span>
                <span className="font-bold font-mono text-slate-800">
                  {fmtPrice(shiftData.ExpectedCash || 0)} đ
                </span>
              </div>

              <div className="flex justify-between text-slate-800 font-bold">
                <span>Tổng tiền thực tế kiểm đếm:</span>
                <span className="text-base text-rose-600 font-mono">
                  {fmtPrice(totalCountedCash)} đ
                </span>
              </div>

              {/* Difference */}
              {(() => {
                const diff = totalCountedCash - (shiftData.ExpectedCash || 0);
                const isExact = diff === 0;
                const isSurplus = diff > 0;
                return (
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between font-semibold ${
                      isExact
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : isSurplus
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    <span>Chênh lệch két:</span>
                    <span className="font-mono font-bold">
                      {isExact
                        ? 'Khớp quỹ hoàn hảo (0 đ)'
                        : isSurplus
                        ? `Thừa quỹ +${fmtPrice(diff)} đ`
                        : `Thiếu quỹ ${fmtPrice(diff)} đ`}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ghi chú chốt ca (nếu có lệch tiền):
              </label>
              <textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Lý do chênh lệch, bàn giao cho ai..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCloseShift}
                disabled={closingLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                {closingLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>🔒</span>
                )}
                <span>Khóa Ca & Xuất Báo Cáo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XEM & IN Z-REPORT (BÁO CÁO CHỐT CA) ================= */}
      {showZReportModal && shiftData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:w-full">
            {/* Top Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <span className="font-semibold text-sm">Báo Cáo Bàn Giao Ca (Z-Report)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintZReport}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  🖨️ In Z-Report K80
                </button>
                <button
                  onClick={() => setShowZReportModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center print:bg-white print:p-0">
              <div
                id="z-report-area"
                className="w-[80mm] max-w-[340px] bg-white p-4 rounded-xl border border-slate-200 print:border-none text-slate-900 font-mono text-[12px] leading-tight space-y-2.5"
              >
                <div className="text-center pb-2 border-b border-dashed border-slate-400">
                  <h2 className="font-bold text-base uppercase">CHUM CHUM BAKERY</h2>
                  <h3 className="font-bold text-sm uppercase mt-1">BÁO CÁO CHỐT CA BÁN HÀNG</h3>
                  <p className="text-[10px] text-slate-500">Mã ca: {shiftData.ShiftCode}</p>
                </div>

                <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Thu ngân:</span>
                    <span className="font-bold">{shiftData.CashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mở ca:</span>
                    <span>{new Date(shiftData.OpenedAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chốt ca:</span>
                    <span>{new Date().toLocaleString('vi-VN')}</span>
                  </div>
                </div>

                {/* Sales Details */}
                <div className="py-2 border-b border-dashed border-slate-400 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Tiền mặt đầu ca:</span>
                    <span>{fmtPrice(shiftData.OpeningCash)} đ</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Doanh thu Tiền mặt:</span>
                    <span>{fmtPrice(shiftData.LiveCashSales || shiftData.TotalCashSales || 0)} đ</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Doanh thu QR:</span>
                    <span>{fmtPrice(shiftData.LiveQRSales || shiftData.TotalQRSales || 0)} đ</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                    <span>TỔNG DOANH THU:</span>
                    <span>{fmtPrice(shiftData.LiveTotalSales || (shiftData.TotalCashSales + shiftData.TotalQRSales) || 0)} đ</span>
                  </div>
                </div>

                {/* Cash Reconciliation */}
                <div className="py-2 border-b border-dashed border-slate-400 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Tiền mặt kỳ vọng:</span>
                    <span>{fmtPrice(shiftData.ExpectedCash || 0)} đ</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Tiền thực tế kiểm đếm:</span>
                    <span>{fmtPrice(totalCountedCash || shiftData.ClosingCashActual || 0)} đ</span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-600">
                    <span>Chênh lệch:</span>
                    <span>
                      {fmtPrice(
                        (totalCountedCash || shiftData.ClosingCashActual || 0) - (shiftData.ExpectedCash || 0)
                      )}{' '}
                      đ
                    </span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-4 flex justify-between text-center text-[10px]">
                  <div>
                    <p className="font-bold">Thu ngân giao ca</p>
                    <p className="text-slate-400 italic mt-8">(Ký, họ tên)</p>
                  </div>
                  <div>
                    <p className="font-bold">Quản lý nhận ca</p>
                    <p className="text-slate-400 italic mt-8">(Ký, họ tên)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
