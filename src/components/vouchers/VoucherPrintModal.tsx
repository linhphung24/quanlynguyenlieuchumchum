'use client';

import React from 'react';
import { CashVoucher, CashVoucherDetail, CompanyInfo } from '@/types';
import { toVietnameseWords } from '@/lib/amountInWords';
import { getAccountName } from '@/lib/accounts';

interface VoucherPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: CashVoucher;
  details: CashVoucherDetail[];
  companyInfo?: CompanyInfo | null;
}

export default function VoucherPrintModal({
  isOpen,
  onClose,
  voucher,
  details,
  companyInfo,
}: VoucherPrintModalProps) {
  if (!isOpen) return null;

  const isReceipt = voucher.Type === 'thu';
  const totalAmount = voucher.Amount || details.reduce((sum, d) => sum + Number(d.Amount || 0), 0);
  const words = toVietnameseWords(totalAmount);

  const handlePrint = () => {
    window.print();
  };

  const vDate = new Date(voucher.VoucherDate);
  const day = vDate.getDate();
  const month = vDate.getMonth() + 1;
  const year = vDate.getFullYear();

  // Combine accounts for header box
  const debitAccounts = Array.from(new Set(details.map((d) => d.DebitAccount).filter(Boolean))).join(', ');
  const creditAccounts = Array.from(new Set(details.map((d) => d.CreditAccount).filter(Boolean))).join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print-modal-overlay">
      <div className="bg-white text-black w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-8 print-modal-box">
        {/* Action bar (hidden on print) */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 print:hidden no-print">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Mẫu in:</span>
            <span className="font-semibold text-gray-900">
              {isReceipt ? '01-TT (Phiếu Thu Tiền Mặt)' : '02-TT (Phiếu Chi Tiền Mặt)'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>🖨️</span>
              <span>In phiếu ngay</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div id="printable-document" className="print-area text-[13px] leading-relaxed p-4 print:p-0" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="font-bold text-sm uppercase">{companyInfo?.Name || 'CHUM CHUM BAKERY'}</p>
              <p className="text-xs text-gray-700">{companyInfo?.Address || 'Hà Nội'}</p>
              {companyInfo?.TaxCode && <p className="text-xs text-gray-700">MST: {companyInfo.TaxCode}</p>}
              {companyInfo?.Phone && <p className="text-xs text-gray-700">SĐT: {companyInfo.Phone}</p>}
            </div>
            <div className="text-right">
              <p className="font-bold text-sm uppercase">
                {isReceipt ? 'Mẫu số 01 - TT' : 'Mẫu số 02 - TT'}
              </p>
              <p className="text-[11px] italic text-gray-600 max-w-[240px]">
                (Ban hành theo Thông tư số 132/2018/TT-BTC ngày 28/12/2018 của Bộ Tài chính)
              </p>
              <div className="mt-2 text-xs font-mono text-left inline-block border border-gray-300 p-1.5 rounded">
                <p>Số: <strong>{voucher.Code}</strong></p>
                <p>Nợ: {debitAccounts || '111'} {getAccountName(debitAccounts) ? `(${getAccountName(debitAccounts)})` : ''}</p>
                <p>Có: {creditAccounts || '—'} {getAccountName(creditAccounts) ? `(${getAccountName(creditAccounts)})` : ''}</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold tracking-wide uppercase">
              {isReceipt ? 'PHIẾU THU' : 'PHIẾU CHI'}
            </h2>
            <p className="italic text-xs text-gray-700 mt-1">
              Ngày {day} tháng {month} năm {year}
            </p>
          </div>

          {/* Metadata */}
          <div className="space-y-2 mb-6 text-sm">
            <div className="flex">
              <span className="w-56 font-medium">
                {isReceipt ? '- Họ và tên người nộp tiền:' : '- Họ và tên người nhận tiền:'}
              </span>
              <span className="flex-1 font-semibold">{voucher.Receiver || voucher.Partner || '—'}</span>
            </div>
            <div className="flex">
              <span className="w-56 font-medium">- Địa chỉ / Đơn vị:</span>
              <span className="flex-1">{voucher.PartnerAddress || voucher.Partner || '—'}</span>
            </div>
            <div className="flex">
              <span className="w-56 font-medium">
                {isReceipt ? '- Lý do nộp:' : '- Lý do chi:'}
              </span>
              <span className="flex-1">{voucher.Reason || '—'}</span>
            </div>
            <div className="flex">
              <span className="w-56 font-medium">- Số tiền:</span>
              <span className="flex-1 font-bold text-base font-mono">
                {totalAmount.toLocaleString('vi-VN')} ₫
              </span>
            </div>
            <div className="flex">
              <span className="w-56 font-medium">- Viết bằng chữ:</span>
              <span className="flex-1 italic font-semibold">{words}</span>
            </div>
            <div className="flex">
              <span className="w-56 font-medium">- Kèm theo:</span>
              <span className="flex-1">{voucher.AttachedDocs || '—'} chứng từ gốc</span>
            </div>
          </div>

          {/* Accounting details table if multiple lines */}
          {details.length > 1 && (
            <table className="w-full border-collapse border border-black mb-6 text-xs">
              <thead>
                <tr className="bg-gray-100 text-center font-bold">
                  <th className="border border-black p-1.5 w-10">#</th>
                  <th className="border border-black p-1.5 text-left">Nội dung hạch toán</th>
                  <th className="border border-black p-1.5 w-32">TK Nợ</th>
                  <th className="border border-black p-1.5 w-32">TK Có</th>
                  <th className="border border-black p-1.5 w-32 text-right">Số tiền (₫)</th>
                </tr>
              </thead>
              <tbody>
                {details.map((d, index) => (
                  <tr key={index}>
                    <td className="border border-black p-1.5 text-center">{index + 1}</td>
                    <td className="border border-black p-1.5">{d.Description}</td>
                    <td className="border border-black p-1.5 text-center font-mono">
                      <div>{d.DebitAccount || '—'}</div>
                      {getAccountName(d.DebitAccount) && (
                        <div className="text-[10px] text-gray-700 font-sans">{getAccountName(d.DebitAccount)}</div>
                      )}
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono">
                      <div>{d.CreditAccount || '—'}</div>
                      {getAccountName(d.CreditAccount) && (
                        <div className="text-[10px] text-gray-700 font-sans">{getAccountName(d.CreditAccount)}</div>
                      )}
                    </td>
                    <td className="border border-black p-1.5 text-right font-mono font-medium">
                      {Number(d.Amount).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Signatures */}
          <div className="signature-section grid grid-cols-4 gap-4 text-center text-xs mt-8">
            <div>
              <p className="font-bold uppercase">Thủ trưởng đơn vị</p>
              <p className="italic text-[11px] text-gray-600">(Ký, họ tên, đóng dấu)</p>
              <div className="h-16" />
              <p className="font-semibold">Giám đốc</p>
            </div>
            <div>
              <p className="font-bold uppercase">Kế toán trưởng</p>
              <p className="italic text-[11px] text-gray-600">(Ký, họ tên)</p>
              <div className="h-16" />
              <p className="font-semibold">Phụ trách KT</p>
            </div>
            <div>
              <p className="font-bold uppercase">Người lập phiếu</p>
              <p className="italic text-[11px] text-gray-600">(Ký, họ tên)</p>
              <div className="h-16" />
              <p className="font-semibold">{voucher.CreatedBy || '—'}</p>
            </div>
            <div>
              <p className="font-bold uppercase">
                {isReceipt ? 'Người nộp tiền' : 'Người nhận tiền'}
              </p>
              <p className="italic text-[11px] text-gray-600">(Ký, họ tên)</p>
              <div className="h-16" />
              <p className="font-semibold">{voucher.Receiver || voucher.Partner || '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
