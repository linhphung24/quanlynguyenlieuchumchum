'use client';

import React from 'react';
import { SupplierDebtDetailReport, CompanyInfo } from '@/types';
import { toVietnameseWords } from '@/lib/amountInWords';

interface DebtPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SupplierDebtDetailReport;
  companyInfo?: CompanyInfo | null;
}

export default function DebtPrintModal({
  isOpen,
  onClose,
  report,
  companyInfo,
}: DebtPrintModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const words = toVietnameseWords(Math.max(0, report.CuoiKy));
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print-modal-overlay">
      <div className="bg-white text-black w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl p-8 print-modal-box">
        {/* Action bar (hidden on print) */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 print:hidden no-print">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Mẫu in:</span>
            <span className="font-semibold text-gray-900">
              Biên bản Đối soát & Xác nhận Công nợ Nhà cung cấp
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>🖨️</span>
              <span>In biên bản ngay</span>
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
        <div
          id="printable-document"
          className="print-area text-[13px] leading-relaxed p-4 print:p-0"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6 border-b border-black pb-4">
            <div>
              <p className="font-bold text-sm uppercase">{companyInfo?.Name || 'CHUM CHUM BAKERY'}</p>
              <p className="text-xs text-gray-700">{companyInfo?.Address || 'Hà Nội'}</p>
              {companyInfo?.TaxCode && <p className="text-xs text-gray-700">MST: {companyInfo.TaxCode}</p>}
              {companyInfo?.Phone && <p className="text-xs text-gray-700">SĐT: {companyInfo.Phone}</p>}
            </div>
            <div className="text-right">
              <p className="font-bold text-xs uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="text-[11px] italic">Độc lập - Tự do - Hạnh phúc</p>
              <p className="text-[11px] text-gray-600 mt-1">
                Hà Nội, ngày {day} tháng {month} năm {year}
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold tracking-wide uppercase">
              BIÊN BẢN ĐỐI SOÁT VÀ XÁC NHẬN CÔNG NỢ
            </h2>
            <p className="italic text-xs text-gray-700 mt-1">
              (Kỳ đối soát: từ ngày <strong className="font-mono">{report.FromDate}</strong> đến ngày{' '}
              <strong className="font-mono">{report.ToDate}</strong>)
            </p>
          </div>

          {/* Partner Info */}
          <div className="bg-gray-50 border border-gray-300 p-3 rounded mb-6 space-y-1 text-xs">
            <div className="flex">
              <span className="w-40 font-semibold">- Tên Nhà cung cấp:</span>
              <span className="flex-1 font-bold uppercase text-sm">{report.SupplierName}</span>
            </div>
            <div className="flex">
              <span className="w-40 font-semibold">- Điện thoại liên hệ:</span>
              <span className="flex-1 font-mono">{report.Phone || '—'}</span>
            </div>
            <div className="flex">
              <span className="w-40 font-semibold">- Địa chỉ:</span>
              <span className="flex-1">{report.Address || '—'}</span>
            </div>
          </div>

          {/* Balance Summary Box */}
          <div className="grid grid-cols-4 gap-2 border border-black p-3 mb-6 text-center text-xs bg-gray-50">
            <div>
              <p className="text-gray-600 text-[11px] uppercase">Dư nợ đầu kỳ</p>
              <p className="font-bold font-mono text-sm mt-1">{report.DauKy.toLocaleString('vi-VN')} ₫</p>
            </div>
            <div>
              <p className="text-gray-600 text-[11px] uppercase">Phát sinh TĂNG (Mua hàng)</p>
              <p className="font-bold font-mono text-sm mt-1 text-blue-800">
                +{report.TangTrongKy.toLocaleString('vi-VN')} ₫
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-[11px] uppercase">Phát sinh GIẢM (Thanh toán)</p>
              <p className="font-bold font-mono text-sm mt-1 text-emerald-800">
                -{report.GiamTrongKy.toLocaleString('vi-VN')} ₫
              </p>
            </div>
            <div className="bg-amber-100/60 p-1 rounded border border-amber-300">
              <p className="text-amber-900 font-bold text-[11px] uppercase">DƯ NỢ CUỐI KỲ CÒN LẠI</p>
              <p className="font-bold font-mono text-base mt-0.5 text-rose-800">
                {report.CuoiKy.toLocaleString('vi-VN')} ₫
              </p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="mb-4">
            <p className="font-bold text-xs uppercase mb-2">Chi tiết các phát sinh trong kỳ:</p>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-gray-100 text-center font-bold">
                  <th className="border border-black p-1.5 w-8">STT</th>
                  <th className="border border-black p-1.5 w-24">Ngày chứng từ</th>
                  <th className="border border-black p-1.5 w-28">Số chứng từ</th>
                  <th className="border border-black p-1.5">Diễn giải nghiệp vụ</th>
                  <th className="border border-black p-1.5 w-28 text-right">Tăng nợ (Mua hàng)</th>
                  <th className="border border-black p-1.5 w-28 text-right">Giảm nợ (Đã trả)</th>
                  <th className="border border-black p-1.5 w-32 text-right">Dư nợ sau GD</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-50 italic font-semibold">
                  <td className="border border-black p-1.5 text-center">—</td>
                  <td className="border border-black p-1.5 text-center">{report.FromDate}</td>
                  <td className="border border-black p-1.5 text-center font-mono">DƯ_ĐẦU_KỲ</td>
                  <td className="border border-black p-1.5">Số dư công nợ chuyển sang đầu kỳ này</td>
                  <td className="border border-black p-1.5 text-right">—</td>
                  <td className="border border-black p-1.5 text-right">—</td>
                  <td className="border border-black p-1.5 text-right font-mono font-bold">
                    {report.DauKy.toLocaleString('vi-VN')}
                  </td>
                </tr>

                {report.Transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-black p-4 text-center text-gray-500 italic">
                      Không có giao dịch phát sinh mua hàng hoặc thanh toán trong kỳ này.
                    </td>
                  </tr>
                ) : (
                  report.Transactions.map((tx, idx) => (
                    <tr key={idx}>
                      <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                      <td className="border border-black p-1.5 text-center">{tx.DocDate}</td>
                      <td className="border border-black p-1.5 text-center font-mono font-semibold">
                        {tx.DocCode}
                      </td>
                      <td className="border border-black p-1.5">{tx.Description}</td>
                      <td className="border border-black p-1.5 text-right font-mono">
                        {tx.AmountIncrease > 0 ? tx.AmountIncrease.toLocaleString('vi-VN') : '—'}
                      </td>
                      <td className="border border-black p-1.5 text-right font-mono">
                        {tx.AmountDecrease > 0 ? tx.AmountDecrease.toLocaleString('vi-VN') : '—'}
                      </td>
                      <td className="border border-black p-1.5 text-right font-mono font-semibold">
                        {tx.RunningBalance.toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))
                )}

                <tr className="font-bold text-center bg-gray-100">
                  <td colSpan={4} className="border border-black p-2 uppercase">
                    Tổng phát sinh trong kỳ & Dư cuối kỳ
                  </td>
                  <td className="border border-black p-2 text-right font-mono text-blue-900">
                    {report.TangTrongKy.toLocaleString('vi-VN')}
                  </td>
                  <td className="border border-black p-2 text-right font-mono text-emerald-900">
                    {report.GiamTrongKy.toLocaleString('vi-VN')}
                  </td>
                  <td className="border border-black p-2 text-right font-mono text-rose-900 text-sm">
                    {report.CuoiKy.toLocaleString('vi-VN')} ₫
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Words */}
          <div className="mb-4 text-xs space-y-1">
            <p>
              - Số tiền còn phải thanh toán (viết bằng chữ):{' '}
              <strong className="italic">{report.CuoiKy > 0 ? words : 'Không còn dư nợ'}</strong>
            </p>
            <p className="italic text-gray-700">
              Hai bên cùng thống nhất đối chiếu, xác nhận các số liệu và số dư công nợ nêu trên là hoàn toàn chính xác.
            </p>
          </div>

          {/* Signatures */}
          <div className="signature-section grid grid-cols-2 gap-12 text-center text-xs mt-8">
            <div>
              <p className="font-bold uppercase">ĐẠI DIỆN BÊN MUA (CHUM CHUM BAKERY)</p>
              <p className="italic text-[11px] text-gray-600">(Ký, ghi rõ họ tên và đóng dấu)</p>
              <div className="h-20" />
              <p className="font-semibold text-sm">Giám đốc / Kế toán trưởng</p>
            </div>
            <div>
              <p className="font-bold uppercase">ĐẠI DIỆN BÊN BÁN (NHÀ CUNG CẤP)</p>
              <p className="italic text-[11px] text-gray-600">(Ký, ghi rõ họ tên và đóng dấu)</p>
              <div className="h-20" />
              <p className="font-semibold text-sm">{report.SupplierName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
