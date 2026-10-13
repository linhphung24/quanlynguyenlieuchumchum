'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { DecimalInput } from '@/components/shared/DecimalInput';

export default function ProductsPage() {
  const { hasPermission, toast } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    Code: '',
    Name: '',
    Category: 'Nguyên liệu',
    Unit: 'kg',
    CostPrice: 0,
    SellPrice: 0,
    MinStock: 0,
    Supplier: '',
    Description: '',
  });

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error(err);
    }
  }, [search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.Category) set.add(p.Category);
    }
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory && p.Category !== selectedCategory) return false;
      return true;
    });
  }, [products, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      Code: '',
      Name: '',
      Category: 'Nguyên liệu',
      Unit: 'kg',
      CostPrice: 0,
      SellPrice: 0,
      MinStock: 0,
      Supplier: '',
      Description: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({ ...p });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Name?.trim()) {
      alert('Tên sản phẩm không được để trống.');
      return;
    }
    if (!formData.Unit?.trim()) {
      alert('Đơn vị tính mặc định không được để trống.');
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast(editingProduct ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm mới thành công', 'success');
        setModalOpen(false);
        loadProducts();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi lưu sản phẩm');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!hasPermission('Menu_Products', 'delete')) {
      alert('Bạn không có quyền xóa sản phẩm.');
      return;
    }
    const ok = confirm(`Bạn có chắc muốn xóa sản phẩm '${p.Name}' khỏi danh mục?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/products?id=${p.Id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Đã xóa sản phẩm thành công', 'success');
        loadProducts();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi xóa sản phẩm');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalStockValue = filteredProducts.reduce(
    (sum, p) => sum + p.StockQty * p.CostPrice,
    0
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 overflow-hidden select-none">
      {/* Toolbar */}
      <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
          >
            <span>➕</span>
            <span>Thêm sản phẩm</span>
          </button>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc mã SP..."
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 w-56 focus:outline-none focus:border-amber-500 shadow-xs"
          />

          <button
            onClick={loadProducts}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>🔄</span>
            <span>Nạp lại</span>
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Hiển thị: <strong className="text-slate-800">{filteredProducts.length}</strong> sản phẩm
        </div>
      </div>

      {/* Products Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-100 text-slate-600 border-b border-slate-200 z-10 font-semibold shadow-xs">
            <tr>
              <th className="p-2.5 w-12 text-center">STT</th>
              <th className="p-2.5 w-28">Mã SP</th>
              <th className="p-2.5">Tên sản phẩm / Nguyên liệu</th>
              <th className="p-2.5 w-32">Danh mục</th>
              <th className="p-2.5 w-24 text-center" title="Đơn vị tính mặc định theo sản phẩm dùng khi xuất / nhập kho">
                ĐVT mặc định
              </th>
              <th className="p-2.5 w-28 text-right">Tồn kho hiện tại</th>
              <th className="p-2.5 w-24 text-right">Tồn tối thiểu</th>
              <th className="p-2.5 w-32 text-right">Giá vốn (₫)</th>
              <th className="p-2.5 w-36 text-right">Giá trị tồn (₫)</th>
              <th className="p-2.5 w-40">Nhà cung cấp</th>
              <th className="p-2.5 w-24 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map((p, idx) => {
              const isWarning = p.MinStock > 0 && p.StockQty <= p.MinStock;
              const stockVal = p.StockQty * p.CostPrice;
              return (
                <tr key={p.Id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                  <td className="p-2 font-mono text-slate-600">{p.Code || '—'}</td>
                  <td className="p-2 font-medium text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span>{p.Name}</span>
                      {isWarning && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                          ⚠️ Thiếu hàng
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-slate-500">{p.Category}</td>
                  <td className="p-2 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                      {p.Unit || 'kg'}
                    </span>
                  </td>
                  <td
                    className={`p-2 text-right font-mono font-bold ${
                      p.StockQty <= 0
                        ? 'text-red-600'
                        : isWarning
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {Number(p.StockQty).toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 text-right text-slate-400">
                    {Number(p.MinStock).toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 text-right font-mono text-slate-600">
                    {Number(p.CostPrice).toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 text-right font-mono font-semibold text-slate-900">
                    {stockVal.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 truncate text-slate-500">{p.Supplier || '—'}</td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                        title="Sửa"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-1 rounded hover:bg-red-50 text-red-600 transition-colors"
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="h-10 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-6">
          <span>
            Tổng giá trị tồn kho:{' '}
            <strong className="text-amber-800 font-mono">
              {totalStockValue.toLocaleString('vi-VN')} ₫
            </strong>
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Số lượng tồn kho được tự động tính toán từ Lịch sử Hóa đơn và Khai báo tồn đầu kỳ.
        </div>
      </div>

      {/* Product Edit / Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">
                {editingProduct ? 'Sửa Thông Tin Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Mã sản phẩm
                  </label>
                  <input
                    type="text"
                    value={formData.Code || ''}
                    onChange={(e) => setFormData({ ...formData, Code: e.target.value })}
                    placeholder="VD: NL-BOTMI"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Danh mục
                  </label>
                  <select
                    value={formData.Category || 'Nguyên liệu'}
                    onChange={(e) => setFormData({ ...formData, Category: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
                  >
                    <option value="Nguyên liệu">Nguyên liệu</option>
                    <option value="Vật liệu">Vật liệu</option>
                    <option value="Bánh tươi">Bánh tươi</option>
                    <option value="Bánh khô">Bánh khô</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Tên sản phẩm / Nguyên vật liệu *
                </label>
                <input
                  type="text"
                  required
                  value={formData.Name || ''}
                  onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                  placeholder="VD: Bột mì hoa ngọc lan 1kg"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Đơn vị tính mặc định *
                  </label>
                  <input
                    type="text"
                    list="commonUnitsList"
                    required
                    value={formData.Unit || ''}
                    onChange={(e) => setFormData({ ...formData, Unit: e.target.value })}
                    placeholder="VD: kg, g, hộp, lít..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-center font-semibold text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                  <datalist id="commonUnitsList">
                    <option value="kg" />
                    <option value="g" />
                    <option value="lít" />
                    <option value="ml" />
                    <option value="hộp" />
                    <option value="chai" />
                    <option value="gói" />
                    <option value="lon" />
                    <option value="cái" />
                    <option value="thùng" />
                    <option value="bao" />
                    <option value="quả" />
                    <option value="can" />
                    <option value="bịch" />
                    <option value="cây" />
                    <option value="cuộn" />
                  </datalist>
                  <p className="text-[10px] text-slate-400 mt-1">
                    🔒 Cố định khi xuất/nhập kho
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Đơn giá vốn (₫)
                  </label>
                  <DecimalInput
                    min={0}
                    value={formData.CostPrice || 0}
                    onChange={(val) =>
                      setFormData({ ...formData, CostPrice: val })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-right text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Tồn tối thiểu
                  </label>
                  <DecimalInput
                    min={0}
                    value={formData.MinStock || 0}
                    onChange={(val) =>
                      setFormData({ ...formData, MinStock: val })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-right text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Nhà cung cấp chính
                </label>
                <input
                  type="text"
                  value={formData.Supplier || ''}
                  onChange={(e) => setFormData({ ...formData, Supplier: e.target.value })}
                  placeholder="Tên nhà cung cấp"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={formData.Description || ''}
                  onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
