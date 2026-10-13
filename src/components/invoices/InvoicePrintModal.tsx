'use client';

import React from 'react';
import { Invoice, InvoiceDetail, CompanyInfo } from '@/types';
import { toVietnameseWords } from '@/lib/amountInWords';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  details: InvoiceDetail[];
  companyInfo?: CompanyInfo | null;
}

export default function InvoicePrintModal({
  isOpen,
  onClose,
  invoice,
  details,
  companyInfo,
}: InvoicePrintModalProps) {
  if (!isOpen) return null;

  const isImport = invoice.Type === 'in';
  const totalAmount = details.reduce((sum, d) => sum + (d.Amount * d.Price), 0);
  const words = toVietnameseWords(totalAmount);

  const handlePrint = () => {
    window.print();
  };

  const invDate = new Date(invoice.InvDate);
  const day = invDate.getDate();
  const month = invDate.getMonth() + 1;
  const year = invDate.getFullYear();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print-modal-overlay">
      <div className="bg-white text-black w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-8 print-modal-box">
        {/* Action bar (hidden on print) */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 print:hidden no-print">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Mẫu in:</span>
            <span className="font-semibold text-gray-900">
              {isImport ? '01-VT (Phiếu Nhập Kho)' : '02-VT (Phiếu Xuất Kho)'}
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
            <div className="text-center">
              <p className="font-bold text-sm uppercase">
                {isImport ? 'Mẫu số 01 - VT' : 'Mẫu số 02 - VT'}
              </p>
              <p className="text-[11px] italic text-gray-600 max-w-[220px]">
                (Ban hành theo Thông tư số 99/2025/TT-BTC ngày 28/11/2025 của BTC)
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold tracking-wide uppercase">
              {isImport ? 'PHIẾU NHẬP KHO' : 'PHIẾU XUẤT KHO'}
            </h2>
            <p className="italic text-xs text-gray-700 mt-1">
              Ngày {day} tháng {month} năm {year}
            </p>
            <p className="text-xs font-semibold mt-1">
              Số: <span className="font-mono">{invoice.Code}</span>
            </p>
          </div>

          {/* Metadata */}
          <div className="space-y-1.5 mb-6 text-sm">
            <div className="flex">
              <span className="w-48 font-medium">
                {isImport ? '- Họ và tên người giao hàng:' : '- Họ và tên người nhận hàng:'}
              </span>
              <span className="flex-1 font-semibold">{invoice.Partner || '—'}</span>
            </div>
            <div className="flex">
              <span className="w-48 font-medium">
                {isImport ? '- Theo hóa đơn/chứng từ:' : '- Lý do xuất kho:'}
              </span>
              <span className="flex-1">{invoice.Note || 'Theo kế hoạch sản xuất'}</span>
            </div>
            <div className="flex">
              <span className="w-48 font-medium">
                {isImport ? '- Nhập tại kho:' : '- Xuất tại kho:'}
              </span>
              <span className="flex-1 font-semibold">Kho Nguyên vật liệu Chum Chum Bakery</span>
            </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border border-black mb-4 text-xs">
            <thead>
              <tr className="bg-gray-100 text-center font-bold">
                <th className="border border-black p-2 w-10">STT</th>
                <th className="border border-black p-2">Tên, nhãn hiệu, quy cách hàng hóa</th>
                <th className="border border-black p-2 w-16">Mã số</th>
                <th className="border border-black p-2 w-16">ĐVT</th>
                <th className="border border-black p-2 w-20">Số lượng</th>
                <th className="border border-black p-2 w-24">Đơn giá</th>
                <th className="border border-black p-2 w-28">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {details.map((d, index) => {
                const sub = d.Amount * d.Price;
                return (
                  <tr key={index} className="text-center">
                    <td className="border border-black p-1.5">{index + 1}</td>
                    <td className="border border-black p-1.5 text-left font-medium">
                      {d.ProductName}
                    </td>
                    <td className="border border-black p-1.5 font-mono">{d.ProductCode || '—'}</td>
                    <td className="border border-black p-1.5">{d.Unit}</td>
                    <td className="border border-black p-1.5 text-right font-medium">
                      {Number(d.Amount).toLocaleString('vi-VN', { maximumFractionDigits: 4 })}
                    </td>
                    <td className="border border-black p-1.5 text-right">
                      {Number(d.Price).toLocaleString('vi-VN')}
                    </td>
                    <td className="border border-black p-1.5 text-right font-semibold">
                      {sub.toLocaleString('vi-VN')}
                    </td>
                  </tr>
                );
              })}
              <tr className="font-bold text-center bg-gray-50">
                <td colSpan={4} className="border border-black p-2 uppercase">
                  Cộng
                </td>
                <td className="border border-black p-2 text-right">
                  {details.reduce((sum, d) => sum + Number(d.Amount), 0).toLocaleString('vi-VN', { maximumFractionDigits: 4 })}
                </td>
                <td className="border border-black p-2 text-right">x</td>
                <td className="border border-black p-2 text-right">
                  {totalAmount.toLocaleString('vi-VN')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount in words */}
          <div className="mb-8 text-xs">
            <p className="italic">
              - Tổng số tiền (viết bằng chữ): <span className="font-bold">{words}</span>
            </p>
          </div>

          {/* Signatures */}
          <div className="signature-section grid grid-cols-4 gap-4 text-center text-xs mt-8">
            <div>
              <p className="font-bold uppercase">Người lập phiếu</p>
              <p className="italic text-[11px] text-gray-600">(Ký, họ tên)</p>
              <div className="h-16" />
              <p className="font-semibold">{invoice.CreatedBy || '—'}</p>
            </div>
            <div>
              <p className="font-bold uppercase">
                {isImport ? 'Người giao hàng' : 'Người nhận hàng'}
              </p>
              <p className="italic text-[11px] text-gray-600">(Ký, họ tên)</p>
              <div className="h-16" />
              <p className="font-semibold">{invoice.Partner || '—'}</p>
            </div>
            <div>
              <p className="font-bold uppercase">Thủ kho</p>
              <p className="italic text-[11px] text-gray-600">(Ký, họ tên)</p>
              <div className="h-16" />
              <p className="font-semibold">Thủ kho</p>
            </div>
            <div>
              <p className="font-bold uppercase">Kế toán trưởng</p>
              <p className="italic text-[11px] text-gray-600">(Ký, họ tên)</p>
              <div className="h-16" />
              <p className="font-semibold">
                {invoice.ApprovalStatus === 'approved'
                  ? (invoice.ApprovedBy || 'Đã duyệt')
                  : invoice.ApprovalStatus === 'rejected'
                  ? 'Từ chối duyệt'
                  : '(Chưa duyệt)'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
