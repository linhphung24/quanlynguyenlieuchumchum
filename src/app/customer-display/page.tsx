'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PosOrder, PosPaymentSettings } from '@/types';
import { fmtPrice } from '@/lib/utils';
import { playPaymentSuccessSound } from '@/components/pos/sound';
import {
  subscribeCustomerDisplay,
  getActiveOrderFromStorage,
  CustomerDisplayPayload,
} from '@/lib/customerDisplaySync';

export default function CustomerDisplayPage() {
  const [order, setOrder] = useState<PosOrder | null>(null);
  const [settings, setSettings] = useState<PosPaymentSettings | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [showQrFromPos, setShowQrFromPos] = useState(false);
  const [qrInfoFromPos, setQrInfoFromPos] = useState<CustomerDisplayPayload['qrInfo'] | undefined>(undefined);

  // Load payment settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/pos/payment-settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {}
    }
    loadSettings();
  }, []);

  // 1. Real-time BroadcastChannel & LocalStorage sync
  useEffect(() => {
    // Check initial local storage on mount
    const cached = getActiveOrderFromStorage();
    if (cached) {
      if (cached.order) setOrder(cached.order);
      setShowQrFromPos(Boolean(cached.showQr));
      setQrInfoFromPos(cached.qrInfo);
      if (cached.isPaidSuccess) {
        setIsPaid(true);
        playPaymentSuccessSound();
      }
    }

    const unsubscribe = subscribeCustomerDisplay((payload) => {
      if (payload.isPaidSuccess) {
        setIsPaid(true);
        playPaymentSuccessSound();
      } else {
        setIsPaid(false);
      }

      setOrder(payload.order);
      setShowQrFromPos(Boolean(payload.showQr));
      setQrInfoFromPos(payload.qrInfo);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fallback Polling for orders (only if orderId is a positive integer > 0 or looking up occupied tables)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get('orderId');
    const numericOrderId = orderIdParam ? parseInt(orderIdParam, 10) : 0;

    const fetchOrder = async () => {
      try {
        if (numericOrderId > 0) {
          const res = await fetch(`/api/pos/orders/${numericOrderId}`);
          if (res.ok) {
            const data = await res.json();
            setOrder(data);
            if (data.PaymentStatus === 'paid' && !isPaid) {
              setIsPaid(true);
              playPaymentSuccessSound();
            }
          }
        } else if (!order) {
          // If no active broadcast order, check if any table is currently occupied
          const res = await fetch('/api/pos/tables');
          if (res.ok) {
            const data = await res.json();
            const occupied = (data.tables || []).find((t: any) => t.CurrentOrder && t.CurrentOrder.Details?.length > 0);
            if (occupied && occupied.CurrentOrder) {
              setOrder(occupied.CurrentOrder);
            }
          }
        }
      } catch (err) {}
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [isPaid, order]);

  const bankBin = qrInfoFromPos?.bankName ? qrInfoFromPos.bankName : (settings?.BankBin || '970422');
  const accountNumber = qrInfoFromPos?.accountNumber || settings?.AccountNumber || '0988123456';
  const accountHolder = qrInfoFromPos?.accountHolder || settings?.AccountHolder || 'TIEM BANH CHUM CHUM';
  const bankName = qrInfoFromPos?.bankName || settings?.BankName || 'MBBank';
  const qrPrefix = settings?.QrPrefix || 'CCB';

  const transferContent = qrInfoFromPos?.transferContent || (order ? `${qrPrefix} ${order.OrderCode}` : '');
  const vietQrUrl = qrInfoFromPos?.vietQrUrl || (order && order.FinalAmount > 0
    ? `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?amount=${order.FinalAmount}&addInfo=${encodeURIComponent(
        transferContent
      )}&accountName=${encodeURIComponent(accountHolder)}`
    : '');

  const hasItems = Boolean(order && order.Details && order.Details.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-950 via-stone-900 to-amber-950 text-white flex flex-col justify-between p-6 md:p-8 select-none">
      {/* Top Banner */}
      <header className="flex items-center justify-between pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-3xl shadow-lg shadow-rose-950/40">
            🥖
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-amber-200 via-rose-200 to-amber-100 bg-clip-text text-transparent">
              CHUM CHUM BAKERY
            </h1>
            <p className="text-xs text-amber-200/80">Bánh Tươi Mỗi Ngày • Hương Vị Chuẩn Pháp</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {order?.TableName && (
            <div className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-2">
              <span>📍 {order.TableName}</span>
            </div>
          )}
          <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Màn hình phục vụ khách hàng</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 my-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-6xl mx-auto w-full">
        {/* Left: Basket Items */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col h-[540px] shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>🧾 Danh sách món</span>
              {order?.TableName && (
                <span className="text-xs bg-amber-500/30 text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-500/40">
                  {order.TableName}
                </span>
              )}
            </h2>
            <span className="text-xs text-amber-200/80 font-mono font-semibold">
              {order?.Details?.length || 0} món đã chọn
            </span>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 custom-scrollbar pr-1">
            {!hasItems ? (
              <div className="h-full flex flex-col items-center justify-center text-white/40 text-center">
                <span className="text-6xl mb-3 animate-pulse">🥐</span>
                <span className="text-base font-semibold text-white/70">Xin chào Quý khách!</span>
                <span className="text-xs text-white/40 mt-1 max-w-xs">
                  Đơn hàng của Quý khách sẽ tự động hiển thị tại đây khi nhân viên chọn món.
                </span>
              </div>
            ) : (
              order?.Details?.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors animate-in fade-in-50 duration-150"
                >
                  <div className="flex-1 pr-3">
                    <h4 className="font-semibold text-sm text-white leading-snug">{it.ProductName}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-amber-200/80 font-mono">
                        {it.Quantity} x {fmtPrice(it.Price)} đ
                      </span>
                      {it.Note && (
                        <span className="text-[11px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md italic">
                          ({it.Note})
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-base text-amber-400 whitespace-nowrap">
                    {fmtPrice(it.Subtotal)} đ
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Subtotals Footer */}
          {hasItems && order && (
            <div className="pt-4 border-t border-white/10 space-y-1.5 text-xs text-white/70">
              <div className="flex justify-between">
                <span>Tạm tính tiền hàng:</span>
                <span className="font-mono font-semibold text-white">{fmtPrice(order.Subtotal)} đ</span>
              </div>
              {order.DiscountAmount > 0 && (
                <div className="flex justify-between text-rose-300">
                  <span>Chiết khấu / Giảm giá:</span>
                  <span className="font-mono font-semibold">-{fmtPrice(order.DiscountAmount)} đ</span>
                </div>
              )}
              {order.VatAmount > 0 && (
                <div className="flex justify-between text-amber-200">
                  <span>Thuế VAT:</span>
                  <span className="font-mono font-semibold">+{fmtPrice(order.VatAmount)} đ</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2.5 border-t border-white/15 text-white">
                <span className="font-bold text-base tracking-wide">TỔNG CỘNG:</span>
                <span className="font-mono font-extrabold text-2xl text-amber-400">
                  {fmtPrice(order.FinalAmount)} đ
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Payment QR & Status */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-center text-center shadow-2xl h-[540px]">
          {isPaid ? (
            <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              <div className="w-24 h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center text-5xl mb-4 shadow-xl shadow-emerald-500/40 animate-bounce">
                ✓
              </div>
              <h3 className="text-2xl font-black text-white tracking-wide">THANH TOÁN THÀNH CÔNG!</h3>
              <p className="text-sm text-emerald-200 mt-2 font-medium">
                Cảm ơn Quý khách đã ủng hộ Chum Chum Bakery.
              </p>
              <p className="text-xs text-white/60 mt-1">Hân hạnh phục vụ Quý khách lần sau!</p>
            </div>
          ) : (showQrFromPos || hasItems) && vietQrUrl ? (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-150">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>📱 Quét mã VietQR chuyển khoản</span>
              </div>

              <div className="text-3xl font-black text-white mb-3 font-mono">
                {fmtPrice(order?.FinalAmount || 0)}{' '}
                <span className="text-lg font-bold text-amber-400">VNĐ</span>
              </div>

              {/* QR Image Card */}
              <div className="bg-white p-3 rounded-2xl shadow-2xl mb-3 border-2 border-rose-400/80">
                <img
                  src={vietQrUrl}
                  alt="VietQR Chuyển khoản"
                  className="w-56 h-56 object-contain rounded-xl"
                />
              </div>

              <div className="space-y-1 text-xs text-white/80 max-w-xs">
                <p>
                  Ngân hàng: <strong className="text-white">{bankName}</strong> • STK: <strong className="text-amber-300 font-mono">{accountNumber}</strong>
                </p>
                <p>
                  Chủ TK: <strong className="text-white uppercase">{accountHolder}</strong>
                </p>
                <p className="text-amber-300 font-mono text-[11px] bg-white/5 py-0.5 px-2 rounded-lg border border-white/10 mt-1">
                  Nội dung: <strong>{transferContent}</strong>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-white/40 space-y-3 p-6">
              <span className="text-6xl block animate-pulse">🥖</span>
              <h3 className="text-xl font-bold text-white/70">TIỆM BÁNH CHUM CHUM</h3>
              <p className="text-xs max-w-xs leading-relaxed text-amber-100/60">
                Thơm lừng bánh mới mỗi ngày! Quý khách vui lòng gọi món tại quầy thu ngân.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center pt-4 border-t border-white/10 text-[11px] text-white/40 flex items-center justify-between max-w-6xl mx-auto w-full">
        <span>Hotline đặt bánh: <strong>0988.123.456</strong></span>
        <span>WiFi: <strong>ChumChum_Bakery</strong> / Mật khẩu: <strong>chumchum68</strong></span>
        <span>Hương vị tươi mới từ tình yêu làm bánh ❤️</span>
      </footer>
    </div>
  );
}
