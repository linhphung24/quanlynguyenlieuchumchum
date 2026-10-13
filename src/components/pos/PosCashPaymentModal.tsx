'use client';

import React, { useState } from 'react';
import { PosOrder } from '@/types';
import { fmtPrice } from '@/lib/utils';
import { playPaymentSuccessSound } from './sound';

interface Props {
  order: PosOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (order: PosOrder) => void;
}

export default function PosCashPaymentModal({
  order,
  isOpen,
  onClose,
  onPaymentSuccess,
}: Props) {
  const [cashReceived, setCashReceived] = useState<number>(order ? order.FinalAmount : 0);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const finalAmount = order.FinalAmount;
  const cashChange = Math.max(0, cashReceived - finalAmount);

  const quickAmounts = [
    finalAmount,
    Math.ceil(finalAmount / 50000) * 50000,
    Math.ceil(finalAmount / 100000) * 100000,
    500000,
  ].filter((v, idx, arr) => v >= finalAmount && arr.indexOf(v) === idx);

  const handleConfirm = async () => {
    if (cashReceived < finalAmount) {
      alert('Số tiền khách đưa chưa đủ!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/pos/orders/${order.Id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'cash',
          cashReceived,
          cashChange,
        }),
      });

      if (res.ok) {
        playPaymentSuccessSound();
        onPaymentSuccess({
          ...order,
          PaymentStatus: 'paid',
          OrderStatus: 'completed',
          PaymentMethod: 'cash',
          CashReceived: cashReceived,
          CashChange: cashChange,
        });
      } else {
        const data = await res.json();
        alert(data.error || 'Lỗi xử lý thanh toán');
      }
    } catch (err: any) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
              💵
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Thanh Toán Tiền Mặt</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                {order.TableName ? `Bàn: ${order.TableName}` : 'Đơn mang về'} • #{order.OrderCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Total Amount Due */}
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-4 text-center">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-0.5">
              Khách Cần Thanh Toán
            </span>
            <span className="text-3xl font-extrabold text-emerald-700">
              {fmtPrice(finalAmount)}{' '}
              <span className="text-lg font-bold text-emerald-600">đ</span>
            </span>
          </div>

          {/* Cash Received Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tiền Khách Đưa (VNĐ):
            </label>
            <div className="relative">
              <input
                type="number"
                step="1000"
                value={cashReceived || ''}
                onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
                placeholder="Nhập số tiền..."
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                đ
              </span>
            </div>
          </div>

          {/* Quick denomination chips */}
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCashReceived(amt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  cashReceived === amt
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {amt === finalAmount ? 'Đúng số tiền' : `${fmtPrice(amt)} đ`}
              </button>
            ))}
          </div>

          {/* Change to return */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Tiền thối lại cho khách:</span>
            <span
              className={`text-xl font-bold font-mono ${
                cashChange > 0 ? 'text-amber-600' : 'text-slate-800'
              }`}
            >
              {fmtPrice(cashChange)} đ
            </span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || cashReceived < finalAmount}
              className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>✓</span>
              )}
              <span>Hoàn tất & In hóa đơn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
