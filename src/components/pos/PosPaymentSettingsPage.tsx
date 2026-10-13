'use client';

import React, { useState, useEffect } from 'react';
import { PosPaymentSettings } from '@/types';
import { useApp } from '@/contexts/AppContext';

export const VIETNAM_BANKS = [
  { bin: '970422', shortName: 'MBBank', fullName: 'Ngân hàng TMCP Quân Đội' },
  { bin: '970436', shortName: 'Vietcombank', fullName: 'Ngân hàng TMCP Ngoại Thương Việt Nam' },
  { bin: '970407', shortName: 'Techcombank', fullName: 'Ngân hàng TMCP Kỹ Thương Việt Nam' },
  { bin: '970454', shortName: 'VPBank', fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  { bin: '970416', shortName: 'ACB', fullName: 'Ngân hàng TMCP Á Châu' },
  { bin: '970418', shortName: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển VN' },
  { bin: '970415', shortName: 'VietinBank', fullName: 'Ngân hàng TMCP Công Thương Việt Nam' },
  { bin: '970423', shortName: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong' },
  { bin: '970405', shortName: 'Agribank', fullName: 'Ngân hàng Nông nghiệp & PTNT VN' },
  { bin: '970448', shortName: 'OCB', fullName: 'Ngân hàng TMCP Phương Đông' },
  { bin: '970441', shortName: 'VIB', fullName: 'Ngân hàng TMCP Quốc Tế Việt Nam' },
  { bin: '970403', shortName: 'Sacombank', fullName: 'Ngân hàng TMCP Sài Gòn Thương Tín' },
  { bin: '970426', shortName: 'MSB', fullName: 'Ngân hàng TMCP Hàng Hải Việt Nam' },
  { bin: '970449', shortName: 'LPBank', fullName: 'Ngân hàng TMCP Lộc Phát Việt Nam' },
  { bin: '970443', shortName: 'SHB', fullName: 'Ngân hàng TMCP Sài Gòn - Hà Nội' },
  { bin: '970437', shortName: 'HDBank', fullName: 'Ngân hàng TMCP Phát triển TP.HCM' },
  { bin: '970440', shortName: 'SeABank', fullName: 'Ngân hàng TMCP Đông Nam Á' },
  { bin: '546034', shortName: 'Cake by VPBank', fullName: 'Ngân hàng số Cake by VPBank' },
  { bin: '963388', shortName: 'Timo', fullName: 'Ngân hàng số Timo by BVBank' },
];

export default function PosPaymentSettingsPage() {
  const { addToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bankBin, setBankBin] = useState('970422');
  const [bankName, setBankName] = useState('MBBank');
  const [accountNumber, setAccountNumber] = useState('0988123456');
  const [accountHolder, setAccountHolder] = useState('TIEM BANH CHUM CHUM');
  const [qrPrefix, setQrPrefix] = useState('CCB');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [testAmount, setTestAmount] = useState('50000');

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await fetch('/api/pos/payment-settings');
        if (res.ok) {
          const data: PosPaymentSettings = await res.json();
          if (data) {
            setBankBin(data.BankBin || '970422');
            setBankName(data.BankName || 'MBBank');
            setAccountNumber(data.AccountNumber || '');
            setAccountHolder(data.AccountHolder || '');
            setQrPrefix(data.QrPrefix || 'CCB');
            setWebhookSecret(data.WebhookSecret || '');
          }
        }
      } catch (err) {
        console.error('Failed to load payment settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSelectBank = (bin: string) => {
    setBankBin(bin);
    const found = VIETNAM_BANKS.find((b) => b.bin === bin);
    if (found) {
      setBankName(found.shortName);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) {
      addToast({ type: 'error', message: 'Vui lòng nhập số tài khoản ngân hàng' });
      return;
    }
    if (!accountHolder.trim()) {
      addToast({ type: 'error', message: 'Vui lòng nhập tên chủ tài khoản' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/pos/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          BankBin: bankBin.trim(),
          BankName: bankName.trim(),
          AccountNumber: accountNumber.trim(),
          AccountHolder: accountHolder.trim().toUpperCase(),
          QrPrefix: qrPrefix.trim().toUpperCase() || 'CCB',
          WebhookSecret: webhookSecret.trim(),
        }),
      });

      if (res.ok) {
        addToast({ type: 'success', message: 'Đã lưu cấu hình tài khoản VietQR thành công!' });
      } else {
        const err = await res.json();
        addToast({ type: 'error', message: err.error || 'Lỗi lưu cấu hình' });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: 'Lỗi kết nối máy chủ' });
    } finally {
      setSaving(false);
    }
  };

  // Preview VietQR Url
  const cleanAccountHolder = accountHolder.trim().toUpperCase();
  const cleanTestContent = `${qrPrefix || 'CCB'} TEST1234`;
  const previewVietQrUrl = `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?amount=${
    testAmount || '50000'
  }&addInfo=${encodeURIComponent(cleanTestContent)}&accountName=${encodeURIComponent(
    cleanAccountHolder
  )}`;

  return (
    <div className="flex flex-col h-full bg-slate-100 select-none overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header Title */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
              <span>🏦 Cấu Hình Ngân Hàng & Thanh Toán VietQR</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                VietQR Chuẩn NAPAS 247
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Thiết lập thông tin tài khoản thụ hưởng để hệ thống tạo mã QR động tự động điền đúng số tiền và cú pháp đơn hàng tại quầy thu ngân.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Lưu Cấu Hình</span>
              </>
            )}
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: Bank Details (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span>💳 Thông Tin Tài Khoản Thụ Hưởng</span>
            </h3>

            {/* Quick Bank Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Chọn Ngân Hàng Thụ Hưởng:
              </label>
              <select
                value={bankBin}
                onChange={(e) => handleSelectBank(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50"
              >
                {VIETNAM_BANKS.map((b) => (
                  <option key={b.bin} value={b.bin}>
                    {b.shortName} - {b.fullName} (Mã BIN: {b.bin})
                  </option>
                ))}
                <option value="custom">-- Ngân hàng khác (Nhập thủ công) --</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên Ngân Hàng (Viết tắt):
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Ví dụ: MBBank, Vietcombank..."
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mã BIN Ngân Hàng (Napas):
                </label>
                <input
                  type="text"
                  value={bankBin}
                  onChange={(e) => setBankBin(e.target.value)}
                  placeholder="Ví dụ: 970422"
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50"
                />
              </div>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Số Tài Khoản Ngân Hàng: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\s+/g, ''))}
                placeholder="Ví dụ: 0988123456"
                className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Nhập chính xác số tài khoản ngân hàng của cửa hàng để nhận tiền chuyển khoản.
              </p>
            </div>

            {/* Account Holder */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tên Chủ Tài Khoản (In hoa không dấu): <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                placeholder="Ví dụ: TIEM BANH CHUM CHUM hoặc NGUYEN VAN A"
                className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tên chủ tài khoản sẽ hiển thị khi khách hàng quét mã QR trên ứng dụng ngân hàng.
              </p>
            </div>

            {/* QR Prefix */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tiền Tố Nội Dung Chuyển Khoản:
              </label>
              <input
                type="text"
                value={qrPrefix}
                onChange={(e) => setQrPrefix(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                placeholder="Ví dụ: CCB"
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Ví dụ: Mã đơn là <strong>ORD-20261009-0012</strong>, nội dung chuyển khoản tự động sẽ là: <strong>{qrPrefix || 'CCB'} ORD-20261009-0012</strong>.
              </p>
            </div>

            {/* Webhook Secret */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Mã Bí Mật Webhook (Tự động xác nhận biến động số dư):</span>
                <span className="text-[10px] text-slate-400 font-normal">Tùy chọn nâng cao</span>
              </label>
              <input
                type="text"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="Nhập Secret Key từ dịch vụ đối soát ngân hàng (nếu có)"
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50"
              />
            </div>
          </div>

          {/* Right Panel: Live VietQR Preview (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 flex flex-col items-center text-center">
            <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <span>📱 Xem Trước Mã VietQR Thực Tế</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live Test
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Mã QR dưới đây là mã thực tế sinh ra từ thông tin cấu hình trên. Bạn có thể mở App ngân hàng quét thử ngay để kiểm tra!
            </p>

            {/* QR Card Container */}
            <div className="w-full max-w-xs bg-gradient-to-b from-rose-50 via-white to-amber-50 p-4 rounded-3xl border-2 border-rose-200 shadow-lg flex flex-col items-center">
              <div className="text-xs font-extrabold text-rose-700 uppercase tracking-wider mb-2">
                QUÉT MÃ ĐỂ THANH TOÁN
              </div>

              {/* QR Image */}
              <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 mb-3">
                {accountNumber ? (
                  <img
                    src={previewVietQrUrl}
                    alt="VietQR Preview"
                    className="w-56 h-56 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <span>Vui lòng nhập số tài khoản</span>
                  </div>
                )}
              </div>

              {/* Beneficiary Details */}
              <div className="w-full space-y-1 text-xs text-slate-700 bg-white/80 p-3 rounded-2xl border border-slate-200/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <strong className="text-slate-900">{bankName} ({bankBin})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <strong className="font-mono text-rose-600 font-bold">{accountNumber || '---'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <strong className="text-slate-900 uppercase text-[11px]">{cleanAccountHolder || '---'}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Nội dung mẫu:</span>
                  <strong className="font-mono text-amber-700 text-[11px]">{cleanTestContent}</strong>
                </div>
              </div>
            </div>

            {/* Test amount changer */}
            <div className="w-full max-w-xs bg-slate-50 p-3 rounded-2xl border border-slate-200 text-left">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Số tiền thử nghiệm trên mã QR:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="10000"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  className="flex-1 p-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                />
                <span className="text-xs text-slate-500 font-bold">VNĐ</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-left text-[11px] text-amber-900 space-y-1 w-full">
              <p className="font-bold flex items-center gap-1">
                <span>💡 Lưu ý quan trọng:</span>
              </p>
              <p>
                • Hệ thống tự động tạo mã QR VietQR theo định dạng chuẩn quốc gia Napas247.
              </p>
              <p>
                • Khách hàng dùng bất kỳ ứng dụng ngân hàng nào (MB, VCB, Techcom, BIDV...) hoặc ví điện tử (MoMo, ZaloPay...) đều có thể quét và chuyển khoản nhận tiền ngay lập tức 24/7.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
