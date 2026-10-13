'use client';

import React from 'react';
import { CashReportData, CompanyInfo } from '@/types';
import { toVietnameseWords } from '@/lib/amountInWords';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: CashReportData;
  companyInfo?: CompanyInfo | null;
}

export default function CashReportPrintModal({
  isOpen,
  onClose,
  report,
  companyInfo,
}: Props) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const words = toVietnameseWords(Math.max(0, report.closingCash));
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 print-modal-overlay">
      <div className="bg-white text-black w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl p-8 print-modal-box">
        {/* Action bar (hidden on print) */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 print:hidden no-print">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Mẫu in:</span>
            <span className="font-semibold text-gray-900">
              Sổ Quỹ Tiền Mặt (Mẫu số S11-DN / S07-DNN TT 132/2018/TT-BTC)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>🖨️</span>
              <span>In Sổ Quỹ Ngay</span>
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
              <p className="font-bold text-xs uppercase">Mẫu số: S11-DN</p>
              <p className="text-[11px] italic">(Ban hành theo TT 132/2018/TT-BTC</p>
              <p className="text-[11px] italic">& TT 133/2016/TT-BTC của Bộ Tài chính)</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold tracking-wide uppercase">SỔ QUỸ TIỀN MẶT</h2>
            <p className="text-xs italic text-gray-700 mt-1">
              Từ ngày <strong className="font-mono">{report.fromDate}</strong> đến ngày{' '}
              <strong className="font-mono">{report.toDate}</strong>
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Tài khoản: 111 - Tiền mặt • Loại tiền: VNĐ</p>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border border-black text-xs mb-6">
            <thead>
              <tr className="bg-gray-100 font-bold text-center">
                <th className="border border-black p-2 w-8" rowSpan={2}>STT</th>
                <th className="border border-black p-2 w-20" rowSpan={2}>Ngày ghi sổ</th>
                <th className="border border-black p-2 w-20" rowSpan={2}>Ngày chứng từ</th>
                <th className="border border-black p-2" colSpan={2}>Số hiệu chứng từ</th>
                <th className="border border-black p-2" rowSpan={2}>Diễn giải nghiệp vụ</th>
                <th className="border border-black p-2 w-28 text-right" rowSpan={2}>Thu (đ)</th>
                <th className="border border-black p-2 w-28 text-right" rowSpan={2}>Chi (đ)</th>
                <th className="border border-black p-2 w-32 text-right" rowSpan={2}>Tồn quỹ (đ)</th>
              </tr>
              <tr className="bg-gray-100 font-bold text-center">
                <th className="border border-black p-1 w-20">Thu</th>
                <th className="border border-black p-1 w-20">Chi</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Opening */}
              <tr className="bg-gray-50 font-bold">
                <td className="border border-black p-2 text-center">—</td>
                <td className="border border-black p-2 text-center">{report.fromDate}</td>
                <td className="border border-black p-2 text-center">{report.fromDate}</td>
                <td className="border border-black p-2 text-center">—</td>
                <td className="border border-black p-2 text-center">—</td>
                <td className="border border-black p-2">Số dư tồn quỹ đầu kỳ</td>
                <td className="border border-black p-2 text-right">—</td>
                <td className="border border-black p-2 text-right">—</td>
                <td className="border border-black p-2 text-right font-mono">
                  {report.openingCash.toLocaleString('vi-VN')}
                </td>
              </tr>

              {/* Transactions */}
              {report.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-black p-4 text-center text-gray-500 italic">
                    Không có phát sinh thu chi tiền mặt trong kỳ này.
                  </td>
                </tr>
              ) : (
                report.items.map((it, idx) => (
                  <tr key={it.Id}>
                    <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                    <td className="border border-black p-1.5 text-center">{it.VoucherDate}</td>
                    <td className="border border-black p-1.5 text-center">{it.VoucherDate}</td>
                    <td className="border border-black p-1.5 text-center font-mono">
                      {it.Type === 'thu' ? it.Code : ''}
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono">
                      {it.Type === 'chi' ? it.Code : ''}
                    </td>
                    <td className="border border-black p-1.5">
                      {it.Reason} {it.Partner ? `(${it.Partner})` : ''}
                    </td>
                    <td className="border border-black p-1.5 text-right font-mono">
                      {it.ThuAmount > 0 ? it.ThuAmount.toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="border border-black p-1.5 text-right font-mono">
                      {it.ChiAmount > 0 ? it.ChiAmount.toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="border border-black p-1.5 text-right font-mono font-semibold">
                      {it.RunningBalance.toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))
              )}

              {/* Period Totals */}
              <tr className="bg-gray-100 font-bold">
                <td className="border border-black p-2 text-center" colSpan={6}>
                  CỘNG PHÁT SINH TRONG KỲ
                </td>
                <td className="border border-black p-2 text-right font-mono">
                  {report.totalThu.toLocaleString('vi-VN')}
                </td>
                <td className="border border-black p-2 text-right font-mono">
                  {report.totalChi.toLocaleString('vi-VN')}
                </td>
                <td className="border border-black p-2 text-right font-mono text-gray-500">—</td>
              </tr>

              {/* Closing Balance */}
              <tr className="bg-gray-200 font-bold text-sm">
                <td className="border border-black p-2.5 text-center uppercase" colSpan={6}>
                  SỐ DƯ TỒN QUỸ CUỐI KỲ (NGÀY {report.toDate})
                </td>
                <td className="border border-black p-2.5 text-right font-mono text-gray-500">—</td>
                <td className="border border-black p-2.5 text-right font-mono text-gray-500">—</td>
                <td className="border border-black p-2.5 text-right font-mono text-base font-black">
                  {report.closingCash.toLocaleString('vi-VN')} đ
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount in Words */}
          <div className="mb-6 p-3 bg-gray-50 border border-gray-300 rounded text-xs space-y-1">
            <p>
              - Số dư tồn quỹ bằng chữ:{' '}
              <strong className="italic capitalize">{words}</strong>
            </p>
            <p className="text-gray-600">
              - Chênh lệch Thu - Chi trong kỳ:{' '}
              <strong>{report.netCash >= 0 ? '+' : ''}{report.netCash.toLocaleString('vi-VN')} đ</strong>{' '}
              ({report.netCash >= 0 ? 'Thu lớn hơn Chi' : 'Chi lớn hơn Thu'})
            </p>
          </div>

          {/* Date & Signature Blocks */}
          <div className="mt-8">
            <div className="text-right italic text-xs mb-4">
              Ngày {day} tháng {month} năm {year}
            </div>

            <div className="grid grid-cols-4 gap-4 text-center text-xs">
              <div>
                <p className="font-bold uppercase">Người ghi sổ</p>
                <p className="text-[11px] italic text-gray-500">(Ký, họ tên)</p>
                <div className="h-20" />
              </div>
              <div>
                <p className="font-bold uppercase">Thủ quỹ</p>
                <p className="text-[11px] italic text-gray-500">(Ký, họ tên)</p>
                <div className="h-20" />
              </div>
              <div>
                <p className="font-bold uppercase">Kế toán trưởng</p>
                <p className="text-[11px] italic text-gray-500">(Ký, họ tên)</p>
                <div className="h-20" />
              </div>
              <div>
                <p className="font-bold uppercase">Người đại diện</p>
                <p className="text-[11px] italic text-gray-500">(Ký, đóng dấu, họ tên)</p>
                <div className="h-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
