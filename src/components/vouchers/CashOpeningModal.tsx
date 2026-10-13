'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function CashOpeningModal({ isOpen, onClose, onSaved }: Props) {
  const { toast } = useApp();
  const [openingDate, setOpeningDate] = useState('2026-01-01');
  const [openingAmount, setOpeningAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/cash-opening')
        .then((res) => res.json())
        .then((data) => {
          if (data.opening) {
            setOpeningDate(data.opening.OpeningDate || '2026-01-01');
            setOpeningAmount(Number(data.opening.OpeningAmount) || 0);
            setNote(data.opening.Note || '');
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleAmountChange = (valStr: string) => {
    const cleanStr = valStr.replace(/[^0-9]/g, '');
    const num = Number(cleanStr) || 0;
    setOpeningAmount(num);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/cash-opening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openingDate,
          openingAmount,
          note,
        }),
      });

      if (res.ok) {
        toast('Đã lưu số dư tồn quỹ tiền mặt đầu kỳ thành công!', 'success');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50/80 to-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-600/20">
              💵
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Khai Báo Tồn Quỹ Tiền Mặt Đầu Kỳ (TK 111)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cài đặt số tiền mặt thực tế trong két khi bắt đầu ghi chép sổ quỹ
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

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {loading ? (
            <div className="py-8 text-center text-slate-400">
              <span className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin inline-block mr-2" />
              <span>Đang tải số dư tồn quỹ...</span>
            </div>
          ) : (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Ngày chốt số dư tồn quỹ đầu kỳ: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={openingDate}
                  onChange={(e) => setOpeningDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Các chứng từ thu chi trước ngày này sẽ không cộng dồn thêm vào số dư này.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Số tiền tồn quỹ đầu kỳ (₫): <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={openingAmount === 0 ? '' : openingAmount.toLocaleString('vi-VN')}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-sm text-right focus:outline-none focus:border-emerald-500 shadow-2xs pr-10"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-semibold">₫</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Ghi chú giải trình:
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Tồn tiền mặt trong két sắt chuyển sang từ năm 2025..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-xl text-emerald-800 text-[11px] leading-relaxed">
                💡 <strong>Công thức tính tồn quỹ:</strong> Tồn quỹ hiện tại = Tồn đầu kỳ đã khai báo + Tổng tiền phiếu thu (PT) - Tổng tiền phiếu chi (PC).
              </div>
            </>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-semibold shadow-2xs transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-md shadow-emerald-600/25 transition-all flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Lưu Số Dư Tồn Quỹ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
