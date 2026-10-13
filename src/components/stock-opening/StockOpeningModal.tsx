'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { StockOpeningAdj, Product } from '@/types';
import { DecimalInput } from '@/components/shared/DecimalInput';
import { parseDecimal } from '@/lib/utils';

interface StockOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: StockOpeningAdj, andContinue?: boolean) => Promise<boolean>;
  editingItem: StockOpeningAdj | null;
  products: Product[];
  period: { month: number; year: number };
}

export default function StockOpeningModal({
  isOpen,
  onClose,
  onSave,
  editingItem,
  products,
  period,
}: StockOpeningModalProps) {
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [invDate, setInvDate] = useState('');
  const [voucherCode, setVoucherCode] = useState('OPN');
  const [warehouse, setWarehouse] = useState('Kho Tổng');
  const [batchNo, setBatchNo] = useState('');
  const [expDate, setExpDate] = useState('');
  const [specification, setSpecification] = useState('');
  const [location, setLocation] = useState('');
  const [unit, setUnit] = useState('kg');
  const [adjQty, setAdjQty] = useState<number | string>(0);
  const [costPrice, setCostPrice] = useState<number | string>(0);
  const [saving, setSaving] = useState(false);

  // Khởi tạo form khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    const defaultDate = `${period.year}-${String(period.month).padStart(2, '0')}-01`;

    if (editingItem) {
      const prod = products.find(
        (p) => p.Name.toLowerCase() === editingItem.ProductName.toLowerCase()
      );
      setSelectedProduct(prod || null);
      setProductSearch(editingItem.ProductName);
      setInvDate(editingItem.InvDate || defaultDate);
      setVoucherCode(editingItem.VoucherCode || 'OPN');
      setWarehouse(editingItem.Warehouse || (prod?.Category === 'Vật liệu' ? 'Kho Vật liệu' : 'Kho Nguyên liệu'));
      setBatchNo(editingItem.BatchNo || '');
      setExpDate(editingItem.ExpDate ? editingItem.ExpDate.substring(0, 10) : '');
      setSpecification(editingItem.Specification || '');
      setLocation(editingItem.Location || '');
      setUnit(editingItem.Unit || prod?.Unit || 'kg');
      setAdjQty(editingItem.AdjQty || 0);
      setCostPrice(
        editingItem.CostPrice !== undefined && editingItem.CostPrice !== null
          ? editingItem.CostPrice
          : (prod?.CostPrice || 0)
      );
    } else {
      resetForm();
    }
  }, [isOpen, editingItem, period, products]);

  const resetForm = () => {
    const defaultDate = `${period.year}-${String(period.month).padStart(2, '0')}-01`;
    setSelectedProduct(null);
    setProductSearch('');
    setInvDate(defaultDate);
    setVoucherCode('OPN');
    setWarehouse('Kho Tổng');
    setBatchNo('');
    setExpDate('');
    setSpecification('');
    setLocation('');
    setUnit('kg');
    setAdjQty(0);
    setCostPrice(0);
  };

  // Lọc sản phẩm theo từ khóa tìm kiếm
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 25);
    const q = productSearch.toLowerCase().trim();
    return products
      .filter(
        (p) =>
          p.Name.toLowerCase().includes(q) ||
          (p.Code && p.Code.toLowerCase().includes(q))
      )
      .slice(0, 25);
  }, [products, productSearch]);

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setProductSearch(p.Name);
    setUnit(p.Unit || 'kg');
    setWarehouse(p.Category === 'Vật liệu' ? 'Kho Vật liệu' : 'Kho Nguyên liệu');
    if (Number(costPrice) <= 0 && p.CostPrice) {
      setCostPrice(p.CostPrice);
    }
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (andContinue: boolean = false) => {
    const productName = selectedProduct ? selectedProduct.Name : productSearch.trim();
    if (!productName) {
      alert('Vui lòng chọn hoặc nhập tên Hàng hóa!');
      return;
    }

    const qty = parseDecimal(adjQty);
    if (isNaN(qty) || qty <= 0) {
      alert('Số lượng tồn phải lớn hơn 0!');
      return;
    }

    const price = parseDecimal(costPrice);
    if (isNaN(price) || price < 0) {
      alert('Đơn giá tồn đầu không hợp lệ!');
      return;
    }

    setSaving(true);
    try {
      const itemToSave: StockOpeningAdj = {
        Id: editingItem?.Id,
        ProductName: productName,
        ProductCode: selectedProduct?.Code || editingItem?.ProductCode || '',
        Category: selectedProduct?.Category || editingItem?.Category || 'Nguyên liệu',
        Warehouse: warehouse,
        VoucherCode: voucherCode || 'OPN',
        InvDate: invDate,
        BatchNo: batchNo,
        ExpDate: expDate || null,
        Specification: specification,
        Location: location,
        Unit: selectedProduct?.Unit || unit || 'kg',
        CostPrice: price,
        Year: period.year,
        Month: period.month,
        AdjQty: qty,
      };

      const success = await onSave(itemToSave, andContinue);
      if (success) {
        if (andContinue) {
          resetForm();
        } else {
          onClose();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📦</span>
            <h2 className="text-base font-bold tracking-tight">
              {editingItem ? 'Sửa tồn kho đầu kỳ' : 'Thêm tồn kho đầu kỳ'}
            </h2>
            <div
              className="text-xs bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded cursor-help transition-colors"
              title="Khai báo số lượng tồn kho đầu kỳ theo chuẩn AMIS Kho trước khi xuất/nhập thực tế"
            >
              ?
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Hàng hóa */}
          <div className="relative">
            <label className="block font-semibold text-slate-700 mb-1">
              Hàng hóa <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Gõ tìm kiếm mã hoặc tên vật tư hàng hóa..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                {selectedProduct && (
                  <span className="absolute right-2.5 top-2 text-[11px] bg-blue-50 text-blue-700 font-mono px-1.5 py-0.5 rounded border border-blue-200">
                    {selectedProduct.Unit}
                  </span>
                )}
              </div>
            </div>

            {/* Dropdown danh sách gợi ý */}
            {isDropdownOpen && filteredProducts.length > 0 && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.Id}
                      onClick={() => handleSelectProduct(p)}
                      className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{p.Name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Mã: {p.Code || '—'} • Loại: {p.Category || 'Nguyên liệu'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {p.Unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Ngày nhập kho & Số phiếu nhập */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ngày nhập kho
              </label>
              <input
                type="date"
                value={invDate}
                onChange={(e) => setInvDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Số phiếu nhập
              </label>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="OPN"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Kho */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kho <span className="text-red-500">*</span>
            </label>
            <select
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="Kho Tổng">Kho Tổng (Chính)</option>
              <option value="Kho Nguyên liệu">Kho Nguyên liệu (NL)</option>
              <option value="Kho Vật liệu">Kho Vật liệu & Bao bì (VL)</option>
              <option value="Kho Bánh">Kho Thành phẩm / Bánh (TP)</option>
            </select>
          </div>

          {/* Số lô, Hạn sử dụng, Mã quy cách, Vị trí (4 cột chuẩn MISA) */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Số lô
              </label>
              <input
                type="text"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                placeholder="Lô hàng..."
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hạn sử dụng
              </label>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mã quy cách
              </label>
              <input
                type="text"
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
                placeholder="vd: Thùng 25kg..."
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vị trí
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Kệ A1, Tủ mát..."
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Đơn vị tính & Số lượng tồn & Đơn giá tồn đầu & Thành tiền */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Đơn vị tính</span>
                <span className="text-[10px] text-slate-400 font-normal">🔒 Cố định</span>
              </label>
              <input
                type="text"
                readOnly
                tabIndex={-1}
                value={unit}
                title="Đơn vị tính mặc định theo danh mục sản phẩm (không thể chỉnh sửa)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 cursor-not-allowed select-none focus:outline-none shadow-xs text-center"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Số lượng tồn <span className="text-red-500">*</span>
              </label>
              <DecimalInput
                min={0}
                value={adjQty}
                onChange={(val, raw) => setAdjQty(raw)}
                className="w-full px-3 py-2 border border-blue-400 bg-white rounded-lg text-sm text-blue-900 font-bold font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Đơn giá tồn đầu (₫)
              </label>
              <DecimalInput
                min={0}
                value={costPrice}
                onChange={(val, raw) => setCostPrice(raw)}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm text-slate-800 font-bold font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Thành tiền tồn đầu (₫)
              </label>
              <div className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-sm text-emerald-800 font-bold font-mono text-right select-none shadow-xs truncate">
                {(parseDecimal(adjQty) * parseDecimal(costPrice)).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-medium text-xs transition-colors"
          >
            Hủy
          </button>

          {!editingItem && (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-xs transition-colors disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu và Thêm'}
            </button>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit(false)}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>Lưu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
