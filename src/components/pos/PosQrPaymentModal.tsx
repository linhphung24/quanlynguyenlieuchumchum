'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PosOrder, PosReceiptTemplate, PosPaymentSettings } from '@/types';
import { fmtPrice } from '@/lib/utils';
import { playPaymentSuccessSound } from './sound';
import { broadcastCustomerOrder, broadcastPaymentSuccess } from '@/lib/customerDisplaySync';
import { VIETNAM_BANKS } from './PosPaymentSettingsPage';

interface Props {
  order: PosOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (order: PosOrder) => void;
  receiptTemplate?: PosReceiptTemplate | null;
}

export default function PosQrPaymentModal({
  order,
  isOpen,
  onClose,
  onPaymentSuccess,
  receiptTemplate,
}: Props) {
  const [settings, setSettings] = useState<PosPaymentSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [manualConfirming, setManualConfirming] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [savingQuickSettings, setSavingQuickSettings] = useState(false);

  // Edit settings form
  const [editBankBin, setEditBankBin] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editAccountHolder, setEditAccountHolder] = useState('');

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/pos/payment-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setEditBankBin(data.BankBin || '970422');
        setEditBankName(data.BankName || 'MBBank');
        setEditAccountNumber(data.AccountNumber || '');
        setEditAccountHolder(data.AccountHolder || '');
      }
    } catch (err) {
      console.error('Failed to load payment settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Load payment settings
  useEffect(() => {
    if (!isOpen) return;
    setIsPaidSuccess(false);
    setShowQuickSettings(false);
    loadSettings();
  }, [isOpen]);

  const bankBin = settings?.BankBin || '970422';
  const accountNumber = settings?.AccountNumber || '0988123456';
  const accountHolder = settings?.AccountHolder || 'CHUM CHUM BAKERY';
  const bankName = settings?.BankName || 'MBBank';
  const qrPrefix = settings?.QrPrefix || 'CCB';
  const transferContent = order ? `${qrPrefix} ${order.OrderCode}` : '';

  const vietQrUrl = order
    ? `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?amount=${order.FinalAmount}&addInfo=${encodeURIComponent(
        transferContent
      )}&accountName=${encodeURIComponent(accountHolder)}`
    : '';

  // Broadcast to Customer Display whenever QR is ready or order changes
  useEffect(() => {
    if (!isOpen || !order) return;
    broadcastCustomerOrder(order, true, {
      vietQrUrl,
      bankName,
      accountNumber,
      accountHolder,
      transferContent,
      amount: order.FinalAmount,
    });
  }, [isOpen, order, vietQrUrl, bankName, accountNumber, accountHolder, transferContent]);

  // Polling order status (only when order.Id > 0)
  useEffect(() => {
    if (!isOpen || !order || isPaidSuccess || !order.Id || order.Id <= 0) return;

    setIsVerifying(true);
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pos/orders/${order.Id}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.isPaid) {
            // Success!
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setIsVerifying(false);
            setIsPaidSuccess(true);
            playPaymentSuccessSound();
            broadcastPaymentSuccess(order);

            setTimeout(() => {
              onPaymentSuccess({
                ...order,
                PaymentStatus: 'paid',
                OrderStatus: 'completed',
                PaymentMethod: 'qr_transfer',
              });
            }, 1200);
          }
        }
      } catch (err) {
        console.error('Polling payment status error:', err);
      }
    }, 2000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, order, isPaidSuccess, onPaymentSuccess]);

  if (!isOpen || !order) return null;

  const handleManualConfirm = async () => {
    if (!confirm('Xác nhận khách đã chuyển khoản thành công vào tài khoản tiệm?')) return;
    setManualConfirming(true);
    try {
      const res = await fetch(`/api/pos/orders/${order.Id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'qr_transfer',
          cashReceived: order.FinalAmount,
          cashChange: 0,
          transactionRef: 'Thu ngân xác nhận thủ công',
        }),
      });
      if (res.ok) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setIsPaidSuccess(true);
        playPaymentSuccessSound();
        broadcastPaymentSuccess(order);
        setTimeout(() => {
          onPaymentSuccess({
            ...order,
            PaymentStatus: 'paid',
            OrderStatus: 'completed',
            PaymentMethod: 'qr_transfer',
          });
        }, 1000);
      }
    } catch (err) {
      alert('Lỗi xác nhận thanh toán thủ công');
    } finally {
      setManualConfirming(false);
    }
  };

  const handleOpenCustomerDisplay = () => {
    const url = order.Id > 0 ? `/customer-display?orderId=${order.Id}` : '/customer-display';
    window.open(url, 'CustomerDisplayWindow', 'width=900,height=900,menubar=no,toolbar=no');
  };

  const handleSaveQuickSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccountNumber.trim() || !editAccountHolder.trim()) {
      alert('Vui lòng điền đủ STK và Tên chủ tài khoản');
      return;
    }
    setSavingQuickSettings(true);
    try {
      const res = await fetch('/api/pos/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          BankBin: editBankBin.trim(),
          BankName: editBankName.trim(),
          AccountNumber: editAccountNumber.trim(),
          AccountHolder: editAccountHolder.trim().toUpperCase(),
          QrPrefix: settings?.QrPrefix || 'CCB',
        }),
      });
      if (res.ok) {
        await loadSettings();
        setShowQuickSettings(false);
      } else {
        alert('Lỗi lưu cài đặt');
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setSavingQuickSettings(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
              📱
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Thanh Toán Chuyển Khoản QR</h3>
              <p className="text-xs text-rose-100 mt-0.5">
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
        <div className="p-6 flex flex-col items-center">
          {showQuickSettings ? (
            <form onSubmit={handleSaveQuickSettings} className="w-full space-y-4 text-left">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-sm text-slate-800">Cấu hình nhanh tài khoản nhận tiền</h4>
                <button
                  type="button"
                  onClick={() => setShowQuickSettings(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Chọn Ngân hàng:</label>
                <select
                  value={editBankBin}
                  onChange={(e) => {
                    setEditBankBin(e.target.value);
                    const b = VIETNAM_BANKS.find((x) => x.bin === e.target.value);
                    if (b) setEditBankName(b.shortName);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none"
                >
                  {VIETNAM_BANKS.map((b) => (
                    <option key={b.bin} value={b.bin}>
                      {b.shortName} - {b.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Số tài khoản:</label>
                <input
                  type="text"
                  value={editAccountNumber}
                  onChange={(e) => setEditAccountNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none"
                  placeholder="Nhập số tài khoản"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tên chủ tài khoản:</label>
                <input
                  type="text"
                  value={editAccountHolder}
                  onChange={(e) => setEditAccountHolder(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold uppercase focus:outline-none"
                  placeholder="TIEM BANH CHUM CHUM"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickSettings(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 rounded-xl border border-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingQuickSettings}
                  className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700"
                >
                  {savingQuickSettings ? 'Đang lưu...' : 'Lưu & Đổi QR ngay'}
                </button>
              </div>
            </form>
          ) : isPaidSuccess ? (
            <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl mb-4 shadow-lg shadow-emerald-500/20 animate-bounce">
                ✓
              </div>
              <h4 className="text-xl font-bold text-slate-800">Đã Thanh Toán Thành Công!</h4>
              <p className="text-sm text-slate-500 mt-1">
                Số tiền: <strong className="text-emerald-600">{fmtPrice(order.FinalAmount)} đ</strong>
              </p>
              <span className="mt-4 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Hệ thống đang tự động in hóa đơn & giải phóng bàn...
              </span>
            </div>
          ) : (
            <>
              {/* Amount badge */}
              <div className="w-full bg-rose-50/80 border border-rose-100 rounded-2xl p-3.5 text-center mb-3">
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block mb-0.5">
                  Số tiền cần thanh toán
                </span>
                <span className="text-3xl font-extrabold text-rose-600">
                  {fmtPrice(order.FinalAmount)}{' '}
                  <span className="text-lg font-bold text-rose-500">đ</span>
                </span>
              </div>

              {/* QR Image Frame */}
              <div className="relative p-2.5 bg-white rounded-2xl border-2 border-dashed border-rose-200 shadow-sm flex flex-col items-center">
                {loadingSettings ? (
                  <div className="w-60 h-60 flex items-center justify-center text-slate-400">
                    <span className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <img
                    src={vietQrUrl}
                    alt="Mã VietQR"
                    className="w-60 h-60 object-contain rounded-xl"
                  />
                )}

                {/* Live pulsing listening pill */}
                <div className="mt-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full flex items-center gap-2 text-xs font-medium text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Đang tự động nhận diện chuyển khoản (1-2s)...</span>
                </div>
              </div>

              {/* Account details */}
              <div className="w-full mt-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs space-y-1.5 text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{bankName}</span>
                    <button
                      type="button"
                      onClick={() => setShowQuickSettings(true)}
                      className="text-[10px] text-rose-600 hover:underline font-bold"
                    >
                      ⚙️ Đổi
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <span className="font-mono font-bold text-slate-900">{accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <span className="font-semibold uppercase">{accountHolder}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span className="text-slate-500">Nội dung CK:</span>
                  <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                    {transferContent}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="w-full grid grid-cols-2 gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleOpenCustomerDisplay}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>🖥️</span>
                  <span>Màn hình phụ</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualConfirm}
                  disabled={manualConfirming}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  {manualConfirming ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>✓</span>
                  )}
                  <span>Xác nhận thủ công</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
