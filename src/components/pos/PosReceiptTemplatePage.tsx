'use client';

import React, { useState, useEffect } from 'react';
import { PosReceiptTemplate } from '@/types';
import { fmtPrice } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

export default function PosReceiptTemplatePage() {
  const { toast } = useApp();
  const [template, setTemplate] = useState<PosReceiptTemplate>({
    Id: 1,
    TemplateName: 'Mẫu in chuẩn K80',
    PaperSize: 'k80',
    ShopName: 'CHUM CHUM BAKERY',
    ShopAddress: 'Số 18 Ngõ 120 Trần Cung, Cầu Giấy, Hà Nội',
    ShopPhone: '0988.123.456',
    WifiInfo: 'WiFi: ChumChum_Bakery / Pass: chumchum68',
    HeaderTitle: 'PHIẾU THANH TOÁN',
    FooterMessage: 'Cảm ơn Quý khách & Hẹn gặp lại!',
    ShowLogo: true,
    ShowCashier: true,
    ShowTable: true,
    ShowCustomer: false,
    ShowItemNote: true,
    ShowQrCode: true,
    QrType: 'vietqr',
    CustomQrUrl: 'https://facebook.com/chumchumbakery',
    IsDefault: true,
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load from API
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/pos/receipt-template');
        if (res.ok) {
          const data = await res.json();
          if (data && data.ShopName) {
            setTemplate((prev) => ({ ...prev, ...data }));
          }
        }
      } catch (err) {
        console.error('Error loading template:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/pos/receipt-template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (res.ok) {
        toast('Đã lưu mẫu thiết kế hóa đơn thành công!', 'success');
      } else {
        toast('Lỗi lưu mẫu hóa đơn', 'error');
      }
    } catch (err) {
      toast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintTest = () => {
    window.print();
  };

  const isK57 = template.PaperSize === 'k57';
  const widthClass = isK57 ? 'w-[58mm] max-w-[280px]' : 'w-[80mm] max-w-[340px]';

  // Mock demo items for preview
  const demoItems = [
    { name: 'Bánh Croissant Bơ Pháp', qty: 2, price: 35000, subtotal: 70000, note: 'Hâm nóng giòn' },
    { name: 'Bánh Su Kem Vani (Hộp 6c)', qty: 1, price: 45000, subtotal: 45000, note: '' },
    { name: 'Cà Phê Muối Kem Béo', qty: 2, price: 35000, subtotal: 70000, note: 'Ít đá, ít ngọt' },
  ];
  const demoSubtotal = 185000;
  const demoDiscount = 15000;
  const demoFinal = demoSubtotal - demoDiscount;

  return (
    <div className="flex flex-col h-full bg-slate-100 select-none overflow-hidden">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200/90 px-6 py-4 flex items-center justify-between shadow-xs print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Thiết Kế Mẫu Hóa Đơn In Nhiệt (K80 / K57)</span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
              Trực quan WYSIWYG
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tùy chỉnh thông tin cửa hàng, bật/tắt các trường dữ liệu và xem trước ngay lập tức
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintTest}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>🖨️</span>
            <span>In thử kiểm tra</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>💾</span>
            )}
            <span>Lưu mẫu thiết kế</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ================= LEFT COLUMN: SETTINGS FORM ================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar print:hidden">
          {/* Card 1: Khổ giấy */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span>📏</span>
              <span>1. Định dạng Khổ giấy máy in</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                  template.PaperSize === 'k80'
                    ? 'border-rose-500 bg-rose-50/50 text-rose-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paperSize"
                  checked={template.PaperSize === 'k80'}
                  onChange={() => setTemplate({ ...template, PaperSize: 'k80' })}
                  className="accent-rose-600"
                />
                <div>
                  <div className="text-xs font-bold">Khổ 80mm (K80)</div>
                  <div className="text-[11px] text-slate-500">Chuẩn máy in bill quầy thu ngân</div>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                  template.PaperSize === 'k57'
                    ? 'border-rose-500 bg-rose-50/50 text-rose-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paperSize"
                  checked={template.PaperSize === 'k57'}
                  onChange={() => setTemplate({ ...template, PaperSize: 'k57' })}
                  className="accent-rose-600"
                />
                <div>
                  <div className="text-xs font-bold">Khổ 58mm (K57)</div>
                  <div className="text-[11px] text-slate-500">Máy in cầm tay / di động</div>
                </div>
              </label>
            </div>
          </div>

          {/* Card 2: Thông tin cửa hàng */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span>🏬</span>
              <span>2. Thông tin Đầu trang (Header)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Tiệm Bánh:
                </label>
                <input
                  type="text"
                  value={template.ShopName}
                  onChange={(e) => setTemplate({ ...template, ShopName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số Hotline / Điện thoại:
                </label>
                <input
                  type="text"
                  value={template.ShopPhone}
                  onChange={(e) => setTemplate({ ...template, ShopPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa Chỉ Cửa Hàng:
                </label>
                <input
                  type="text"
                  value={template.ShopAddress}
                  onChange={(e) => setTemplate({ ...template, ShopAddress: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thông Tin WiFi Quán:
                </label>
                <input
                  type="text"
                  value={template.WifiInfo}
                  onChange={(e) => setTemplate({ ...template, WifiInfo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="WiFi: TenWifi / Pass: MatKhau"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu Đề Phiếu:
                </label>
                <input
                  type="text"
                  value={template.HeaderTitle}
                  onChange={(e) => setTemplate({ ...template, HeaderTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="HÓA ĐƠN BÁN HÀNG / PHIẾU THANH TOÁN"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Bật / Tắt các trường dữ liệu */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span>🔘</span>
              <span>3. Bật / Tắt Khối Nội Dung Hiển Thị</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer">
                <span>In Logo thương hiệu</span>
                <input
                  type="checkbox"
                  checked={template.ShowLogo}
                  onChange={(e) => setTemplate({ ...template, ShowLogo: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer">
                <span>In Tên Thu ngân</span>
                <input
                  type="checkbox"
                  checked={template.ShowCashier}
                  onChange={(e) => setTemplate({ ...template, ShowCashier: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer">
                <span>In Tên Bàn / Khu vực</span>
                <input
                  type="checkbox"
                  checked={template.ShowTable}
                  onChange={(e) => setTemplate({ ...template, ShowTable: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer">
                <span>In Tên Khách hàng</span>
                <input
                  type="checkbox"
                  checked={template.ShowCustomer}
                  onChange={(e) => setTemplate({ ...template, ShowCustomer: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer">
                <span>In Ghi chú món (ít ngọt, hâm nóng...)</span>
                <input
                  type="checkbox"
                  checked={template.ShowItemNote}
                  onChange={(e) => setTemplate({ ...template, ShowItemNote: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer">
                <span>In Mã QR chân trang (Fanpage/Zalo)</span>
                <input
                  type="checkbox"
                  checked={template.ShowQrCode}
                  onChange={(e) => setTemplate({ ...template, ShowQrCode: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
              </label>
            </div>
          </div>

          {/* Card 4: Chân trang (Footer) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span>✍️</span>
              <span>4. Lời Cảm Ơn & QR Chân Trang</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lời cảm ơn chân trang:
              </label>
              <input
                type="text"
                value={template.FooterMessage}
                onChange={(e) => setTemplate({ ...template, FooterMessage: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Cảm ơn Quý khách & Hẹn gặp lại!"
              />
            </div>

            {template.ShowQrCode && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đường dẫn (Link) mã QR chân trang:
                </label>
                <input
                  type="text"
                  value={template.CustomQrUrl || ''}
                  onChange={(e) => setTemplate({ ...template, CustomQrUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="https://facebook.com/chumchumbakery hoặc Zalo OA"
                />
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: LIVE PREVIEW ================= */}
        <div className="w-full lg:w-[480px] bg-slate-200/60 p-6 flex flex-col items-center justify-start overflow-y-auto custom-scrollbar border-t lg:border-t-0 lg:border-l border-slate-200">
          <div className="text-center mb-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Bản Xem Trước Trực Tiếp ({template.PaperSize.toUpperCase()})
            </span>
            <span className="text-[11px] text-slate-500">Mô phỏng cuộn giấy in bill thực tế</span>
          </div>

          {/* Thermal Receipt Paper */}
          <div
            id="receipt-print-area"
            className={`bg-white shadow-xl rounded-xl p-4 border border-slate-300 text-slate-900 font-mono text-[12px] leading-tight ${widthClass} transition-all duration-200`}
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
              {template.ShowLogo && <div className="text-3xl mb-1">🥖</div>}
              <h2 className="font-bold text-base tracking-wide uppercase">{template.ShopName}</h2>
              {template.ShopAddress && (
                <p className="text-[11px] text-slate-600">{template.ShopAddress}</p>
              )}
              {template.ShopPhone && (
                <p className="text-[11px] text-slate-600">Hotline: {template.ShopPhone}</p>
              )}
              {template.WifiInfo && (
                <p className="text-[10px] text-slate-500 italic">{template.WifiInfo}</p>
              )}

              <div className="pt-2">
                <h3 className="font-bold text-sm tracking-wider uppercase">
                  {template.HeaderTitle}
                </h3>
                <p className="text-[10px] text-slate-500">Mã đơn: #ORD-20261006-0001</p>
              </div>
            </div>

            {/* Info Section */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Thời gian:</span>
                <span>
                  {new Date().toLocaleDateString('vi-VN')}{' '}
                  {new Date().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {template.ShowCashier && (
                <div className="flex justify-between">
                  <span>Thu ngân:</span>
                  <span>Nguyễn Thu Ngân</span>
                </div>
              )}
              {template.ShowTable && (
                <div className="flex justify-between">
                  <span>Vị trí:</span>
                  <span className="font-bold">Bàn 03 (Tầng 1)</span>
                </div>
              )}
              {template.ShowCustomer && (
                <div className="flex justify-between">
                  <span>Khách hàng:</span>
                  <span>Chị Lan (0912.xxx)</span>
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
                  {demoItems.map((it, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="py-1 pr-1">
                        <div className="font-semibold text-slate-900">{it.name}</div>
                        {template.ShowItemNote && it.note && (
                          <div className="text-[10px] text-slate-500 italic">↳ {it.note}</div>
                        )}
                      </td>
                      <td className="py-1 text-center font-bold text-slate-800">{it.qty}</td>
                      <td className="py-1 text-right text-slate-600">{fmtPrice(it.price)}</td>
                      <td className="py-1 text-right font-semibold text-slate-900">
                        {fmtPrice(it.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính:</span>
                <span>{fmtPrice(demoSubtotal)} đ</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Chiết khấu / Giảm giá:</span>
                <span>-{fmtPrice(demoDiscount)} đ</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-300">
                <span>TỔNG CỘNG:</span>
                <span className="text-base">{fmtPrice(demoFinal)} đ</span>
              </div>

              <div className="pt-1.5 border-t border-dotted border-slate-200 space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Hình thức:</span>
                  <span className="font-semibold">Chuyển khoản QR</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 space-y-2">
              <p className="font-semibold text-[11px] italic text-slate-800">
                {template.FooterMessage}
              </p>

              {template.ShowQrCode && (
                <div className="flex flex-col items-center pt-1">
                  <div className="w-20 h-20 border border-slate-300 rounded-lg p-1 bg-white">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        template.CustomQrUrl || 'https://facebook.com'
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
