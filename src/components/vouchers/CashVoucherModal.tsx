'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CashVoucher, CashVoucherDetail, Supplier } from '@/types';
import { toVietnameseWords } from '@/lib/amountInWords';
import { safeHeaderValue } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { ACCOUNT_LIST } from '@/lib/accounts';
import { DecimalInput } from '@/components/shared/DecimalInput';

interface CashVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialType?: 'thu' | 'chi';
  editingVoucher?: CashVoucher | null;
}

export default function CashVoucherModal({
  isOpen,
  onClose,
  onSaved,
  initialType = 'chi',
  editingVoucher = null,
}: CashVoucherModalProps) {
  const { user } = useApp();
  const [type, setType] = useState<'thu' | 'chi'>(initialType);
  const [voucherDate, setVoucherDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [code, setCode] = useState<string>('');
  const [partner, setPartner] = useState<string>('');
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentDebt, setCurrentDebt] = useState<number | null>(null);
  const [partnerAddress, setPartnerAddress] = useState<string>('');
  const [receiver, setReceiver] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Tiền mặt');
  const [attachedDocs, setAttachedDocs] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [details, setDetails] = useState<CashVoucherDetail[]>([
    { Description: '', DebitAccount: '111', CreditAccount: '', Amount: 0 },
  ]);

  const [saving, setSaving] = useState(false);

  // Load suppliers list
  useEffect(() => {
    fetch('/api/suppliers')
      .then((r) => r.json())
      .then((d) => {
        if (d.suppliers) setSuppliers(d.suppliers);
      })
      .catch((err) => console.error(err));
  }, []);

  // Track debt when partner changes
  useEffect(() => {
    if (!partner?.trim()) {
      setCurrentDebt(null);
      return;
    }
    const match = suppliers.find(
      (s) => s.Name.trim().toLowerCase() === partner.trim().toLowerCase()
    );
    if (match) {
      setSupplierId(match.Id);
      if (!partnerAddress && match.Address) setPartnerAddress(match.Address);
      if (!receiver) setReceiver(match.Name);
      fetch(`/api/debts?supplierId=${match.Id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.detail) setCurrentDebt(d.detail.CuoiKy);
        })
        .catch(() => {});
    } else {
      setSupplierId(null);
      setCurrentDebt(null);
    }
  }, [partner, suppliers, partnerAddress, receiver]);

  // Auto fetch next code when type changes
  const fetchNextCode = async (voucherType: 'thu' | 'chi') => {
    try {
      const res = await fetch(`/api/cash-vouchers/next-code?type=${voucherType}`);
      const data = await res.json();
      if (data.code) setCode(data.code);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (editingVoucher) {
      setType(editingVoucher.Type);
      setVoucherDate(editingVoucher.VoucherDate);
      setCode(editingVoucher.Code);
      setPartner(editingVoucher.Partner || '');
      setSupplierId(editingVoucher.SupplierId || null);
      setPartnerAddress(editingVoucher.PartnerAddress || '');
      setReceiver(editingVoucher.Receiver || '');
      setReason(editingVoucher.Reason || '');
      setPaymentMethod(editingVoucher.PaymentMethod || 'Tiền mặt');
      setAttachedDocs(editingVoucher.AttachedDocs || '');
      setNote(editingVoucher.Note || '');

      fetch(`/api/cash-vouchers/${editingVoucher.Id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.details && data.details.length > 0) {
            setDetails(data.details);
          } else {
            setDetails([
              {
                Description: editingVoucher.Reason || '',
                DebitAccount: editingVoucher.Type === 'thu' ? '111' : '',
                CreditAccount: editingVoucher.Type === 'chi' ? '111' : '',
                Amount: editingVoucher.Amount || 0,
              },
            ]);
          }
        })
        .catch((err) => console.error(err));
    } else {
      setType(initialType);
      setVoucherDate(new Date().toISOString().split('T')[0]);
      setPartner('');
      setSupplierId(null);
      setCurrentDebt(null);
      setPartnerAddress('');
      setReceiver('');
      setReason('');
      setPaymentMethod('Tiền mặt');
      setAttachedDocs('');
      setNote('');
      setDetails([
        {
          Description: '',
          DebitAccount: initialType === 'thu' ? '111' : '331',
          CreditAccount: initialType === 'thu' ? '131' : '111',
          Amount: 0,
        },
      ]);
      fetchNextCode(initialType);
    }
  }, [isOpen, editingVoucher, initialType]);

  const handleTypeChange = (newType: 'thu' | 'chi') => {
    setType(newType);
    if (!editingVoucher) {
      fetchNextCode(newType);
      // Swap default accounts
      setDetails((prev) =>
        prev.map((d) => ({
          ...d,
          DebitAccount: newType === 'thu' ? '111' : '331',
          CreditAccount: newType === 'thu' ? '131' : '111',
        }))
      );
    }
  };

  const totalAmount = useMemo(() => {
    return details.reduce((sum, d) => sum + Number(d.Amount || 0), 0);
  }, [details]);

  const handleDetailChange = (index: number, field: keyof CashVoucherDetail, val: any) => {
    const next = [...details];
    next[index] = { ...next[index], [field]: val };
    setDetails(next);
  };

  const addRow = () => {
    setDetails([
      ...details,
      {
        Description: reason,
        DebitAccount: type === 'thu' ? '111' : '331',
        CreditAccount: type === 'thu' ? '131' : '111',
        Amount: 0,
      },
    ]);
  };

  const removeRow = (index: number) => {
    if (details.length <= 1) return;
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const validDetails = details.filter((d) => Number(d.Amount) > 0);
    if (validDetails.length === 0) {
      alert('Vui lòng nhập ít nhất 1 dòng hạch toán có số tiền > 0.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        voucher: {
          Type: type,
          VoucherDate: voucherDate,
          Code: code,
          Partner: partner,
          SupplierId: supplierId,
          PartnerAddress: partnerAddress,
          Receiver: receiver,
          Reason: reason,
          Amount: totalAmount,
          PaymentMethod: paymentMethod,
          AttachedDocs: attachedDocs,
          Note: note,
        },
        details: validDetails.map((d) => ({
          ...d,
          Description: d.Description.trim() || reason || 'Thu/chi tiền mặt',
        })),
      };

      const userName = user?.FullName || user?.Username || 'system';
      const requestPayload = {
        ...payload,
        currentUser: userName,
      };
      const requestHeaders = {
        'Content-Type': 'application/json',
        'x-user': safeHeaderValue(userName, 'system'),
      };

      let res;
      if (editingVoucher) {
        res = await fetch(`/api/cash-vouchers/${editingVoucher.Id}`, {
          method: 'PUT',
          headers: requestHeaders,
          body: JSON.stringify(requestPayload),
        });
      } else {
        res = await fetch('/api/cash-vouchers', {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestPayload),
        });
      }

      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'Lỗi khi lưu phiếu thu/chi');
        return;
      }

      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{type === 'thu' ? '💵' : '💸'}</span>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {editingVoucher
                  ? `Sửa ${type === 'thu' ? 'Phiếu Thu' : 'Phiếu Chi'}`
                  : `Lập ${type === 'thu' ? 'Phiếu Thu' : 'Phiếu Chi'} Tiền Mặt`}
              </h2>
              <p className="text-xs text-slate-500">
                {type === 'thu' ? 'Mẫu 01 - TT' : 'Mẫu 02 - TT'} • Chuẩn Thông tư 132/2018/TT-BTC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Top Form Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Loại phiếu
              </label>
              <select
                disabled={Boolean(editingVoucher)}
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as 'thu' | 'chi')}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              >
                <option value="thu">💵 Phiếu thu tiền (PT)</option>
                <option value="chi">💸 Phiếu chi tiền (PC)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Số phiếu
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-amber-700 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Ngày lập phiếu
              </label>
              <input
                type="date"
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Hình thức TT
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              >
                <option value="Tiền mặt">Tiền mặt</option>
                <option value="Chuyển khoản">Chuyển khoản</option>
                <option value="Thẻ">Thẻ ngân hàng</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                {type === 'thu' ? 'Đối tượng nộp tiền' : 'Đối tượng nhận tiền / NCC'}
              </label>
              <input
                list="voucher-suppliers-datalist"
                type="text"
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                placeholder="Chọn hoặc nhập tên Nhà cung cấp / Khách hàng"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              />
              <datalist id="voucher-suppliers-datalist">
                {suppliers.map((s) => (
                  <option key={s.Id} value={s.Name}>
                    {s.Phone ? `SĐT: ${s.Phone}` : ''}
                  </option>
                ))}
              </datalist>

              {currentDebt !== null && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                  <span className="text-slate-500">Công nợ hiện tại:</span>
                  <span
                    className={`font-mono font-bold ${
                      currentDebt > 0
                        ? 'text-rose-600'
                        : currentDebt < 0
                        ? 'text-blue-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {currentDebt.toLocaleString('vi-VN')} ₫
                  </span>
                  {currentDebt > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...details];
                        if (next.length > 0) {
                          next[0].Amount = currentDebt;
                          next[0].Description = `Thanh toán tiền hàng cho ${partner}`;
                          setDetails(next);
                        }
                      }}
                      className="text-[10px] text-amber-700 underline font-semibold ml-2 hover:text-amber-800"
                    >
                      (Điền số nợ vào phiếu)
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                {type === 'thu' ? 'Người nộp tiền' : 'Người nhận tiền'}
              </label>
              <input
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder="Họ tên người giao dịch"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Kèm theo chứng từ
              </label>
              <input
                type="text"
                value={attachedDocs}
                onChange={(e) => setAttachedDocs(e.target.value)}
                placeholder="VD: HĐ số 0128"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Địa chỉ đối tượng
              </label>
              <input
                type="text"
                value={partnerAddress}
                onChange={(e) => setPartnerAddress(e.target.value)}
                placeholder="Địa chỉ hoặc bộ phận"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Lý do {type === 'thu' ? 'nộp tiền' : 'chi tiền'}
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={type === 'thu' ? 'Thu tiền bán hàng, thu nợ...' : 'Chi trả tiền nguyên liệu, chi phí điện nước...'}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>
          </div>

          {/* Double-entry Accounting Lines Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Định khoản kép (TK Nợ / TK Có)
              </h3>
              <button
                type="button"
                onClick={addRow}
                className="px-3 py-1 bg-white hover:bg-slate-50 text-amber-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
              >
                <span>➕</span>
                <span>Thêm dòng định khoản</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className="p-2.5">Diễn giải nội dung hạch toán</th>
                    <th className="p-2.5 w-48 text-left">TK Nợ (Tăng/Tiếp nhận)</th>
                    <th className="p-2.5 w-48 text-left">TK Có (Giảm/Nguồn chi)</th>
                    <th className="p-2.5 w-36 text-right">Số tiền (₫)</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {details.map((d, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="p-2 text-center text-slate-400">{index + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={d.Description}
                          onChange={(e) => handleDetailChange(index, 'Description', e.target.value)}
                          placeholder={reason || 'Diễn giải dòng'}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={d.DebitAccount || ''}
                          onChange={(e) => handleDetailChange(index, 'DebitAccount', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium text-emerald-800 focus:outline-none focus:border-amber-500 shadow-xs"
                        >
                          <option value="">-- Chọn TK Nợ --</option>
                          {ACCOUNT_LIST.map((acc) => (
                            <option key={acc.code} value={acc.code}>
                              {acc.code} - {acc.name}
                            </option>
                          ))}
                          {d.DebitAccount && !ACCOUNT_LIST.some((a) => a.code === d.DebitAccount) && (
                            <option value={d.DebitAccount}>{d.DebitAccount} (Tùy chỉnh)</option>
                          )}
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={d.CreditAccount || ''}
                          onChange={(e) => handleDetailChange(index, 'CreditAccount', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium text-amber-800 focus:outline-none focus:border-amber-500 shadow-xs"
                        >
                          <option value="">-- Chọn TK Có --</option>
                          {ACCOUNT_LIST.map((acc) => (
                            <option key={acc.code} value={acc.code}>
                              {acc.code} - {acc.name}
                            </option>
                          ))}
                          {d.CreditAccount && !ACCOUNT_LIST.some((a) => a.code === d.CreditAccount) && (
                            <option value={d.CreditAccount}>{d.CreditAccount} (Tùy chỉnh)</option>
                          )}
                        </select>
                      </td>
                      <td className="p-2 text-right">
                        <DecimalInput
                          min={0}
                          value={d.Amount}
                          onChange={(val) =>
                            handleDetailChange(index, 'Amount', val)
                          }
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-right font-mono font-semibold text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount in Words & Total */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-xs text-slate-500">Viết bằng chữ: </span>
              <span className="text-xs font-semibold text-slate-700 italic">
                {toVietnameseWords(totalAmount)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 uppercase font-semibold">Tổng tiền:</span>
              <span className="text-xl font-bold font-mono text-amber-700">
                {totalAmount.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>Lưu phiếu thu chi</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
