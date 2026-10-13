'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { StockOpeningAdj, Product } from '@/types';
import { parseDecimal } from '@/lib/utils';

interface StockOpeningImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: StockOpeningAdj[]) => Promise<void>;
  products: Product[];
  period: { month: number; year: number };
}

interface ParsedRow {
  productCode: string;
  productName: string;
  category: string;
  warehouse: string;
  unit: string;
  qty: number;
  costPrice: number;
  voucherCode: string;
  invDate: string;
  batchNo: string;
  expDate: string;
  isValid: boolean;
  error?: string;
}

export default function StockOpeningImportModal({
  isOpen,
  onClose,
  onImport,
  products,
  period,
}: StockOpeningImportModalProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Tải file mẫu Excel
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Ngày nhập kho': `${String(period.month).padStart(2, '0')}/01/${period.year}`,
        'Số phiếu nhập': 'OPN',
        'Mã hàng': products[0]?.Code || 'NL-001',
        'Tên hàng': products[0]?.Name || 'Bột mì số 8 Baker Choice',
        'Nhóm VTHH': products[0]?.Category || 'Nguyên liệu',
        'Mã kho': 'Kho Nguyên liệu',
        'Số lô': 'L260901',
        'Hạn sử dụng': '2026-12-31',
        'ĐVT': products[0]?.Unit || 'kg',
        'Số lượng tồn': 50.5,
        'Đơn giá tồn': products[0]?.CostPrice || 18500,
      },
      {
        'Ngày nhập kho': `${String(period.month).padStart(2, '0')}/01/${period.year}`,
        'Số phiếu nhập': 'OPN',
        'Mã hàng': products[1]?.Code || 'VL-002',
        'Tên hàng': products[1]?.Name || 'Hộp bánh gato 20cm',
        'Nhóm VTHH': products[1]?.Category || 'Vật liệu',
        'Mã kho': 'Kho Vật liệu',
        'Số lô': '',
        'Hạn sử dụng': '',
        'ĐVT': products[1]?.Unit || 'cái',
        'Số lượng tồn': 100,
        'Đơn giá tồn': products[1]?.CostPrice || 3500,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TonKhoDauKy');
    XLSX.writeFile(wb, `Mau_Nhap_Ton_Kho_Dau_Ky_MISA_${period.month}_${period.year}.xlsx`);
  };

  // Đọc file Excel tải lên
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (!data || data.length === 0) {
          setErrorMsg('File Excel không có dữ liệu!');
          return;
        }

        const parsed: ParsedRow[] = data.map((item, idx) => {
          // Linh hoạt lấy tên cột
          const name = (
            item['Tên hàng'] ||
            item['Tên sản phẩm'] ||
            item['TenHang'] ||
            item['ProductName'] ||
            ''
          ).toString().trim();

          const code = (
            item['Mã hàng'] ||
            item['Mã sản phẩm'] ||
            item['MaHang'] ||
            item['ProductCode'] ||
            ''
          ).toString().trim();

          const unit = (item['ĐVT'] || item['Đơn vị tính'] || item['Unit'] || 'kg').toString().trim();
          const category = (item['Nhóm VTHH'] || item['Nhóm'] || item['Category'] || 'Nguyên liệu').toString().trim();
          const warehouse = (item['Mã kho'] || item['Kho'] || item['Warehouse'] || 'Kho Tổng').toString().trim();
          const voucherCode = (item['Số phiếu nhập'] || item['Số phiếu'] || 'OPN').toString().trim();
          const invDate = (item['Ngày nhập kho'] || `${period.year}-${String(period.month).padStart(2, '0')}-01`).toString().trim();
          const batchNo = (item['Số lô'] || item['Lô'] || '').toString().trim();
          const expDate = (item['Hạn sử dụng'] || item['HSD'] || '').toString().trim();

          const rawQty = item['Số lượng tồn'] || item['Số lượng'] || item['SL Tồn'] || item['AdjQty'] || 0;
          const qty = parseDecimal(rawQty);

          let isValid = true;
          let error = '';

          if (!name) {
            isValid = false;
            error = 'Thiếu tên hàng';
          } else if (isNaN(qty) || qty <= 0) {
            isValid = false;
            error = 'SL tồn không hợp lệ';
          }

          // Kiểm tra xem có trong danh mục sản phẩm không
          const matchedProd = products.find(
            (p) =>
              p.Name.toLowerCase() === name.toLowerCase() ||
              (code && p.Code && p.Code.toLowerCase() === code.toLowerCase())
          );

          const rawPrice = item['Đơn giá tồn'] || item['Đơn giá'] || item['Giá'] || item['CostPrice'] || 0;
          let parsedPrice = parseDecimal(rawPrice);
          if (isNaN(parsedPrice) || parsedPrice < 0) {
            parsedPrice = matchedProd?.CostPrice || 0;
          }

          return {
            productCode: matchedProd?.Code || code,
            productName: matchedProd?.Name || name,
            category: matchedProd?.Category || category,
            warehouse,
            unit: matchedProd?.Unit || unit,
            qty: isNaN(qty) ? 0 : qty,
            costPrice: parsedPrice,
            voucherCode,
            invDate,
            batchNo,
            expDate,
            isValid,
            error,
          };
        });

        setRows(parsed);
      } catch (err: any) {
        setErrorMsg('Không thể đọc file Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteImport = async () => {
    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('Không có dòng dữ liệu nào hợp lệ để nhập khẩu!');
      return;
    }

    setLoading(true);
    try {
      const itemsToSave: StockOpeningAdj[] = validRows.map((r) => ({
        ProductName: r.productName,
        ProductCode: r.productCode,
        Category: r.category,
        Warehouse: r.warehouse,
        VoucherCode: r.voucherCode,
        InvDate: r.invDate,
        BatchNo: r.batchNo,
        ExpDate: r.expDate || null,
        Unit: r.unit,
        CostPrice: r.costPrice,
        Year: period.year,
        Month: period.month,
        AdjQty: r.qty,
      }));

      await onImport(itemsToSave);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const validCount = rows.filter((r) => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📥</span>
            <h2 className="text-base font-bold tracking-tight">
              Nhập khẩu từ excel vật tư hàng hóa đầu kỳ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Bước 1 & 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center">
                  1
                </span>
                <span>Tải file Excel mẫu</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Tải file mẫu chuẩn MISA để điền thông tin tồn kho đầu kỳ nhanh chóng.
              </p>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-blue-700 border border-blue-300 font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
              >
                <span>📄</span>
                <span>Tải file mẫu Excel</span>
              </button>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[11px] flex items-center justify-center">
                  2
                </span>
                <span>Chọn file đã điền dữ liệu</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Chọn file Excel (.xlsx, .xls) chứa danh sách tồn kho đầu kỳ cần nhập.
              </p>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Preview Table */}
          {rows.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Xem trước dữ liệu ({rows.length} dòng):
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Hợp lệ: {validCount}
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      ✕ Không hợp lệ: {invalidCount}
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="p-2 w-10 text-center">STT</th>
                      <th className="p-2 w-24">Mã hàng</th>
                      <th className="p-2">Tên hàng hóa</th>
                      <th className="p-2 w-20 text-center">ĐVT</th>
                      <th className="p-2 w-28">Kho</th>
                      <th className="p-2 w-24 text-right">SL tồn</th>
                      <th className="p-2 w-24 text-right">Đơn giá</th>
                      <th className="p-2 w-24 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((r, i) => (
                      <tr
                        key={i}
                        className={`hover:bg-slate-50 ${!r.isValid ? 'bg-red-50/60' : ''}`}
                      >
                        <td className="p-2 text-center text-slate-400">{i + 1}</td>
                        <td className="p-2 font-mono text-slate-600">{r.productCode || '—'}</td>
                        <td className="p-2 font-medium text-slate-800">{r.productName}</td>
                        <td className="p-2 text-center text-slate-600">{r.unit}</td>
                        <td className="p-2 text-slate-600">{r.warehouse}</td>
                        <td className="p-2 text-right font-mono font-bold text-blue-700">
                          {r.qty.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-700">
                          {r.costPrice ? r.costPrice.toLocaleString('vi-VN') : '—'}
                        </td>
                        <td className="p-2 text-center">
                          {r.isValid ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-medium">
                              Hợp lệ
                            </span>
                          ) : (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-800 font-medium"
                              title={r.error}
                            >
                              {r.error || 'Lỗi'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-slate-500 text-[11px]">
            Hệ thống sẽ cập nhật vào bảng tồn đầu kỳ và đồng bộ lại Lô FIFO.
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-medium text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={loading || validCount === 0}
              onClick={handleExecuteImport}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>Thực hiện nhập khẩu ({validCount} dòng)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
