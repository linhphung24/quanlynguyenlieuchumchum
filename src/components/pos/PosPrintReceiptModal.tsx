'use client';

import React from 'react';
import { PosOrder, PosReceiptTemplate } from '@/types';
import { fmtPrice, fmtDate } from '@/lib/utils';

interface Props {
  order: PosOrder | null;
  template: PosReceiptTemplate | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PosPrintReceiptModal({
  order,
  template,
  isOpen,
  onClose,
}: Props) {
  if (!isOpen || !order) return null;

  const tpl = template || {
    TemplateName: 'Mẫu chuẩn K80',
    PaperSize: 'k80',
    ShopName: 'CHUM CHUM BAKERY',
    ShopAddress: 'Số 18 Ngõ 120 Trần Cung, Cầu Giấy, Hà Nội',
    ShopPhone: '0988.123.456',
    WifiInfo: 'WiFi: ChumChum / Pass: chumchum68',
    HeaderTitle: 'PHIẾU THANH TOÁN',
    FooterMessage: 'Cảm ơn Quý khách & Hẹn gặp lại!',
    ShowLogo: true,
    ShowCashier: true,
    ShowTable: true,
    ShowCustomer: false,
    ShowItemNote: true,
    ShowQrCode: true,
    QrType: 'vietqr',
    CustomQrUrl: null,
    Id: 1,
    IsDefault: true,
  };

  const isK57 = tpl.PaperSize === 'k57';
  const widthClass = isK57 ? 'w-[58mm] max-w-[280px]' : 'w-[80mm] max-w-[340px]';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        {/* Modal Top Bar (hidden on print) */}
        <div className="p-4 bg-slate-800 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-lg">🖨️</span>
            <span className="font-semibold text-sm">Xem trước & In Hóa đơn ({tpl.PaperSize.toUpperCase()})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
            >
              <span>🖨️</span>
              <span>In Hóa Đơn</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Receipt Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70 flex justify-center print:bg-white print:p-0">
          <div
            id="receipt-print-area"
            className={`bg-white shadow-md print:shadow-none p-4 rounded-xl border border-slate-200 print:border-none text-slate-900 font-mono text-[12px] leading-tight ${widthClass}`}
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
              {tpl.ShowLogo && (
                <div className="text-2xl mb-1">🥖</div>
              )}
              <h2 className="font-bold text-base tracking-wide uppercase">{tpl.ShopName}</h2>
              {tpl.ShopAddress && <p className="text-[11px] text-slate-600">{tpl.ShopAddress}</p>}
              {tpl.ShopPhone && <p className="text-[11px] text-slate-600">Hotline: {tpl.ShopPhone}</p>}
              {tpl.WifiInfo && <p className="text-[10px] text-slate-500 italic">{tpl.WifiInfo}</p>}
              
              <div className="pt-2">
                <h3 className="font-bold text-sm tracking-wider uppercase">{tpl.HeaderTitle}</h3>
                <p className="text-[10px] text-slate-500">Mã đơn: #{order.OrderCode}</p>
              </div>
            </div>

            {/* Info Section */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Thời gian:</span>
                <span>{new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {tpl.ShowCashier && (
                <div className="flex justify-between">
                  <span>Thu ngân:</span>
                  <span>{order.CreatedBy || 'Thu ngân'}</span>
                </div>
              )}
              {tpl.ShowTable && (
                <div className="flex justify-between">
                  <span>Vị trí:</span>
                  <span className="font-bold">{order.TableName || 'Mang về (Takeaway)'}</span>
                </div>
              )}
              {tpl.ShowCustomer && order.CustomerName && (
                <div className="flex justify-between">
                  <span>Khách hàng:</span>
                  <span>{order.CustomerName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-400">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-300 pb-1 text-slate-600">
                    <th className="text-left font-semibold pb-1">Món</th>
                    <th className="text-center font-semibold pb-1 w-8">SL</th>
                    <th className="text-right font-semibold pb-1">Đ.Giá</th>
                    <th className="text-right font-semibold pb-1">T.Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dotted divide-slate-200">
                  {(order.Details || []).map((it, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="py-1 pr-1">
                        <div className="font-semibold text-slate-900">{it.ProductName}</div>
                        {tpl.ShowItemNote && it.Note && (
                          <div className="text-[10px] text-slate-500 italic">↳ {it.Note}</div>
                        )}
                      </td>
                      <td className="py-1 text-center font-bold text-slate-800">{it.Quantity}</td>
                      <td className="py-1 text-right text-slate-600">{fmtPrice(it.Price)}</td>
                      <td className="py-1 text-right font-semibold text-slate-900">{fmtPrice(it.Subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính:</span>
                <span>{fmtPrice(order.Subtotal)} đ</span>
              </div>
              {order.DiscountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Chiết khấu / Giảm giá:</span>
                  <span>-{fmtPrice(order.DiscountAmount)} đ</span>
                </div>
              )}
              {order.VatAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Thuế VAT:</span>
                  <span>+{fmtPrice(order.VatAmount)} đ</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-300">
                <span>TỔNG CỘNG:</span>
                <span className="text-base">{fmtPrice(order.FinalAmount)} đ</span>
              </div>

              {order.PaymentMethod && (
                <div className="pt-1.5 border-t border-dotted border-slate-200 space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Hình thức:</span>
                    <span className="font-semibold">
                      {order.PaymentMethod === 'cash'
                        ? 'Tiền mặt'
                        : order.PaymentMethod === 'qr_transfer'
                        ? 'Chuyển khoản QR'
                        : 'Thẻ / Khác'}
                    </span>
                  </div>
                  {order.PaymentMethod === 'cash' && order.CashReceived > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>Tiền khách đưa:</span>
                        <span>{fmtPrice(order.CashReceived)} đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tiền thối lại:</span>
                        <span>{fmtPrice(order.CashChange)} đ</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 space-y-2">
              <p className="font-semibold text-[11px] italic text-slate-800">{tpl.FooterMessage}</p>
              
              {tpl.ShowQrCode && (
                <div className="flex flex-col items-center pt-1">
                  <div className="w-20 h-20 border border-slate-300 rounded-lg p-1 bg-white">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        tpl.CustomQrUrl || 'https://facebook.com'
                      )}`}
                      alt="QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5">Quét để theo dõi tiệm</span>
                </div>
              )}

              <p className="text-[9px] text-slate-400 pt-1">
                Phần mềm Chum Chum POS • Powered by Antigravity
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
