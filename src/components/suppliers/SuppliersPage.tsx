'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Supplier } from '@/types';
import { useApp } from '@/contexts/AppContext';

export default function SuppliersPage() {
  const { hasPermission, toast } = useApp();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    Name: '',
    Phone: '',
    Address: '',
    Note: '',
  });

  const loadSuppliers = useCallback(async () => {
    try {
      const res = await fetch(`/api/suppliers?keyword=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.suppliers) {
        setSuppliers(data.suppliers);
      }
    } catch (err) {
      console.error(err);
    }
  }, [search]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({ Name: '', Phone: '', Address: '', Note: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({ ...s });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Name?.trim()) {
      alert('Tên nhà cung cấp không được để trống.');
      return;
    }

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast(editingSupplier ? 'Cập nhật nhà cung cấp thành công' : 'Thêm nhà cung cấp mới thành công', 'success');
        setModalOpen(false);
        loadSuppliers();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi lưu');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (s: Supplier) => {
    if (!hasPermission('Menu_Suppliers', 'delete')) {
      alert('Bạn không có quyền xóa nhà cung cấp.');
      return;
    }
    const ok = confirm(`Bạn có chắc muốn xóa nhà cung cấp '${s.Name}'?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/suppliers?id=${s.Id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Đã xóa nhà cung cấp thành công', 'success');
        loadSuppliers();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 overflow-hidden select-none">
      {/* Toolbar */}
      <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
          >
            <span>➕</span>
            <span>Thêm nhà cung cấp</span>
          </button>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc số điện thoại..."
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 w-64 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
          />

          <button
            onClick={loadSuppliers}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>🔄</span>
            <span>Nạp lại</span>
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Tổng số NCC: <strong className="text-slate-800">{suppliers.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4">
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 text-slate-600 border-b border-slate-200 z-10 font-semibold shadow-xs">
              <tr>
                <th className="p-2.5 w-12 text-center">STT</th>
                <th className="p-2.5 w-64">Tên nhà cung cấp</th>
                <th className="p-2.5 w-36">Điện thoại</th>
                <th className="p-2.5">Địa chỉ</th>
                <th className="p-2.5 w-64">Ghi chú</th>
                <th className="p-2.5 w-24 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    Không tìm thấy nhà cung cấp nào.
                  </td>
                </tr>
              ) : (
                suppliers.map((s, idx) => (
                  <tr key={s.Id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 font-medium text-slate-800">{s.Name}</td>
                    <td className="p-2.5 font-mono text-amber-700 font-medium">{s.Phone || '—'}</td>
                    <td className="p-2.5 text-slate-600">{s.Address || '—'}</td>
                    <td className="p-2.5 text-slate-500 truncate max-w-xs">{s.Note || '—'}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Sửa"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-1 rounded hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">
                {editingSupplier ? 'Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Tên nhà cung cấp *
                </label>
                <input
                  type="text"
                  required
                  value={formData.Name || ''}
                  onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                  placeholder="VD: Công ty TNHH Nhất Hương"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={formData.Phone || ''}
                  onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                  placeholder="VD: 0988xxxxxx"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={formData.Address || ''}
                  onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                  placeholder="VD: Hà Nội"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={formData.Note || ''}
                  onChange={(e) => setFormData({ ...formData, Note: e.target.value })}
                  placeholder="Ghi chú thêm..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  Lưu nhà cung cấp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
