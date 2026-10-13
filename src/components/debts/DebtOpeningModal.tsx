'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SupplierOpeningDebtItem } from '@/types';
import { useApp } from '@/contexts/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function DebtOpeningModal({ isOpen, onClose, onSaved }: Props) {
  const { toast } = useApp();
  const [suppliers, setSuppliers] = useState<SupplierOpeningDebtItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [bulkDate, setBulkDate] = useState('2026-01-01');

  // Load suppliers and their opening debt
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/debts/opening');
      const data = await res.json();
      if (data.suppliers) {
        setSuppliers(data.suppliers);
      }
    } catch (err: any) {
      console.error(err);
      toast('Lỗi khi tải danh sách số dư đầu kỳ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const filteredSuppliers = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return suppliers;
    return suppliers.filter(
      (s) =>
        s.SupplierName.toLowerCase().includes(kw) ||
        (s.Phone && s.Phone.toLowerCase().includes(kw)) ||
        (s.Address && s.Address.toLowerCase().includes(kw))
    );
  }, [suppliers, keyword]);

  // Overall totals
  const totalOpeningDebt = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (Number(s.OpeningDebt) || 0), 0);
  }, [suppliers]);

  const countWithOpening = useMemo(() => {
    return suppliers.filter((s) => Number(s.OpeningDebt) !== 0).length;
  }, [suppliers]);

  const handleDebtChange = (supplierId: number, valStr: string) => {
    // Strip non-digits and negative sign
    const cleanStr = valStr.replace(/[^0-9-]/g, '');
    const num = Number(cleanStr) || 0;
    setSuppliers((prev) =>
      prev.map((s) => (s.SupplierId === supplierId ? { ...s, OpeningDebt: num } : s))
    );
  };

  const handleDateChange = (supplierId: number, dateStr: string) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.SupplierId === supplierId ? { ...s, OpeningDate: dateStr } : s))
    );
  };

  const handleNoteChange = (supplierId: number, noteStr: string) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.SupplierId === supplierId ? { ...s, Note: noteStr } : s))
    );
  };

  const handleApplyBulkDate = () => {
    if (!bulkDate) return;
    setSuppliers((prev) => prev.map((s) => ({ ...s, OpeningDate: bulkDate })));
    toast(`Đã áp dụng ngày ${bulkDate} cho tất cả NCC`, 'info');
  };

  const handleSaveSingle = async (item: SupplierOpeningDebtItem) => {
    try {
      const res = await fetch('/api/debts/opening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: item.SupplierId,
          openingDebt: item.OpeningDebt,
          openingDate: item.OpeningDate,
          note: item.Note,
        }),
      });
      if (res.ok) {
        toast(`Đã lưu số dư đầu kỳ cho ${item.SupplierName}`, 'success');
        onSaved();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi lưu số dư đầu kỳ');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const itemsToSave = suppliers.map((s) => ({
        supplierId: s.SupplierId,
        openingDebt: s.OpeningDebt,
        openingDate: s.OpeningDate || '2026-01-01',
        note: s.Note || '',
      }));

      const res = await fetch('/api/debts/opening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToSave }),
      });

      if (res.ok) {
        toast('Đã lưu toàn bộ số dư đầu kỳ công nợ nhà cung cấp thành công!', 'success');
        onSaved();
        onClose();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi lưu số dư đầu kỳ');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50/80 to-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-600/20">
              📝
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Khai Báo Số Dư Đầu Kỳ Công Nợ Đầu Vào (Mua Hàng - TK 331)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập số dư nợ cũ còn phải trả cho từng Nhà cung cấp / Khách hàng đầu vào khi bắt đầu dùng phần mềm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Toolbar & KPI Banner */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Quick Summary Pill */}
          <div className="flex items-center gap-4 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <span className="text-slate-500">NCC có số dư nợ: </span>
              <strong className="text-indigo-700 font-bold font-mono">
                {countWithOpening} / {suppliers.length}
              </strong>
            </div>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div>
              <span className="text-slate-500">Tổng nợ đầu kỳ đã khai báo: </span>
              <strong className="text-rose-700 font-bold font-mono text-sm">
                {totalOpeningDebt.toLocaleString('vi-VN')} ₫
              </strong>
            </div>
          </div>

          {/* Quick Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-[11px]">Ngày chốt chung:</span>
              <input
                type="date"
                value={bulkDate}
                onChange={(e) => setBulkDate(e.target.value)}
                className="bg-transparent border-none text-slate-800 font-mono text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyBulkDate}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-[11px] transition-colors"
                title="Gán ngày này cho tất cả NCC bên dưới"
              >
                Áp dụng hết
              </button>
            </div>

            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên NCC, SĐT..."
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 w-52 focus:outline-none focus:border-indigo-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <span className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin inline-block mr-2" />
              <span>Đang tải danh sách nhà cung cấp...</span>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              Không tìm thấy nhà cung cấp nào phù hợp với từ khóa tìm kiếm.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="p-2.5 w-10 text-center">STT</th>
                  <th className="p-2.5 w-72">Nhà Cung Cấp / Đối Tác</th>
                  <th className="p-2.5 w-28">Điện thoại</th>
                  <th className="p-2.5 w-32 text-center">Ngày chốt số dư</th>
                  <th className="p-2.5 w-44 text-right">Số dư nợ đầu kỳ (₫)</th>
                  <th className="p-2.5">Ghi chú / Diễn giải</th>
                  <th className="p-2.5 w-20 text-center">Lưu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((s, idx) => {
                  const hasDebt = Number(s.OpeningDebt) > 0;
                  return (
                    <tr
                      key={s.SupplierId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        hasDebt ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-2.5">
                        <div className="font-semibold text-slate-800">{s.SupplierName}</div>
                        {s.Address && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">
                            {s.Address}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">{s.Phone || '—'}</td>
                      <td className="p-2.5 text-center">
                        <input
                          type="date"
                          value={s.OpeningDate || '2026-01-01'}
                          onChange={(e) => handleDateChange(s.SupplierId, e.target.value)}
                          className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 text-xs font-mono focus:outline-none focus:border-indigo-500 text-center shadow-2xs"
                        />
                      </td>
                      <td className="p-2.5 text-right">
                        <div className="relative">
                          <input
                            type="text"
                            value={
                              s.OpeningDebt !== undefined && s.OpeningDebt !== null
                                ? s.OpeningDebt === 0
                                  ? ''
                                  : Number(s.OpeningDebt).toLocaleString('vi-VN')
                                : ''
                            }
                            onChange={(e) => handleDebtChange(s.SupplierId, e.target.value)}
                            placeholder="0"
                            className={`w-full text-right font-mono font-bold text-xs bg-white border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 shadow-2xs ${
                              hasDebt
                                ? 'border-rose-300 text-rose-700 bg-rose-50/30'
                                : 'border-slate-200 text-slate-700'
                            }`}
                          />
                        </div>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={s.Note || ''}
                          onChange={(e) => handleNoteChange(s.SupplierId, e.target.value)}
                          placeholder="VD: Dư nợ chuyển sang từ năm 2025..."
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 placeholder-slate-300 focus:outline-none focus:border-indigo-500 shadow-2xs"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleSaveSingle(s)}
                          className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 rounded text-[11px] font-semibold transition-colors"
                          title="Lưu dòng này"
                        >
                          Lưu
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>💡</span>
            <span>
              <strong>Ghi chú:</strong> Số tiền nhập là số tiền tiệm còn nợ nhà cung cấp tính đến ngày chốt số dư.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving || loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Lưu Toàn Bộ Số Dư Đầu Kỳ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
