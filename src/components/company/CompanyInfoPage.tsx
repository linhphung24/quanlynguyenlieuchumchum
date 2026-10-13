'use client';

import React, { useState, useEffect } from 'react';
import { CompanyInfo } from '@/types';
import { useApp } from '@/contexts/AppContext';

export default function CompanyInfoPage() {
  const { toast } = useApp();
  const [info, setInfo] = useState<CompanyInfo>({
    Id: 1,
    Name: 'CHUM CHUM BAKERY',
    Address: '',
    TaxCode: '',
    Phone: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/company-info')
      .then((r) => r.json())
      .then((d) => {
        if (d.info) setInfo(d.info);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/company-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      });

      if (res.ok) {
        toast('Đã lưu thông tin doanh nghiệp thành công!', 'success');
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi lưu');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 overflow-y-auto p-6 custom-scrollbar select-none">
      <div className="max-w-2xl mx-auto w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/80 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-2xl shadow-sm text-white">
            🏬
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Thông Tin Đơn Vị / Doanh Nghiệp</h2>
            <p className="text-xs text-slate-500">
              Thông tin in trên đầu các biểu mẫu Phiếu Nhập Kho, Phiếu Xuất Kho, Phiếu Thu, Phiếu Chi
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Tên đơn vị / Tên cửa hàng *
            </label>
            <input
              type="text"
              required
              value={info.Name}
              onChange={(e) => setInfo({ ...info, Name: e.target.value })}
              placeholder="VD: CÔNG TY TNHH BÁNH NGỌT CHUM CHUM"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Địa chỉ kinh doanh / Xưởng sản xuất
            </label>
            <input
              type="text"
              value={info.Address}
              onChange={(e) => setInfo({ ...info, Address: e.target.value })}
              placeholder="VD: Số 123 Đường Bánh Mì, Quận Đống Đa, Hà Nội"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Mã số thuế (nếu có)
              </label>
              <input
                type="text"
                value={info.TaxCode}
                onChange={(e) => setInfo({ ...info, TaxCode: e.target.value })}
                placeholder="VD: 0108xxxxxx"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="text"
                value={info.Phone}
                onChange={(e) => setInfo({ ...info, Phone: e.target.value })}
                placeholder="VD: 0988xxxxxx"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-700 space-y-1">
            <p className="font-semibold text-amber-800">💡 Hướng dẫn in ấn chứng từ:</p>
            <p>
              • Tiêu đề này sẽ được điền tự động vào góc trên bên trái của Mẫu 01-VT, 02-VT (TT 99/2025/TT-BTC) và Mẫu 01-TT, 02-TT (TT 132/2018/TT-BTC).
            </p>
            <p>• Dữ liệu được lưu trữ tập trung trên máy chủ cơ sở dữ liệu VPS.</p>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? 'Đang lưu...' : 'Lưu thông tin doanh nghiệp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
