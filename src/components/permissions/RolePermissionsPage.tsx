'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RolePermission } from '@/types';
import { useApp } from '@/contexts/AppContext';

export default function RolePermissionsPage() {
  const { toast } = useApp();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('ketoan');
  const [saving, setSaving] = useState(false);

  const loadPermissions = useCallback(async () => {
    try {
      const res = await fetch('/api/permissions');
      const data = await res.json();
      if (data.permissions) {
        setPermissions(data.permissions);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const roles = ['admin', 'manager', 'ketoan', 'thukho', 'staff'];

  const roleLabels: Record<string, string> = {
    admin: 'Quản trị viên (admin)',
    manager: 'Quản lý (manager)',
    ketoan: 'Kế toán (ketoan)',
    thukho: 'Thủ kho (thukho)',
    staff: 'Nhân viên (staff)',
  };

  const currentRolePermissions = useMemo(() => {
    return permissions.filter((p) => p.Role === selectedRole);
  }, [permissions, selectedRole]);

  const handleToggle = (
    id: number,
    field: 'CanView' | 'CanCreate' | 'CanEdit' | 'CanDelete'
  ) => {
    setPermissions((prev) =>
      prev.map((p) => (p.Id === id ? { ...p, [field]: !p[field] } : p))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: currentRolePermissions }),
      });

      if (res.ok) {
        toast('Đã lưu phân quyền vai trò thành công!', 'success');
        loadPermissions();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi lưu phân quyền');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 font-semibold uppercase">Chọn vai trò:</span>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedRole === r
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={loadPermissions}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>🔄</span>
            <span>Nạp lại</span>
          </button>
        </div>

        <button
          disabled={saving || selectedRole === 'admin'}
          onClick={handleSave}
          className="px-5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-40"
        >
          {saving ? 'Đang lưu...' : 'Lưu ma trận phân quyền'}
        </button>
      </div>

      {/* Role Notice */}
      {selectedRole === 'admin' ? (
        <div className="p-3.5 bg-blue-50 border-b border-blue-200 text-blue-800 text-xs flex items-center gap-2">
          <span>ℹ️</span>
          <span>Vai trò Quản trị viên (admin) luôn có toàn quyền tuyệt đối đối với tất cả chức năng hệ thống.</span>
        </div>
      ) : null}

      {/* Matrix Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4">
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 text-slate-600 border-b border-slate-200 z-10 font-semibold shadow-xs">
              <tr>
                <th className="p-2.5 w-12 text-center">STT</th>
                <th className="p-2.5">Chức năng / Phân hệ</th>
                <th className="p-2.5 w-48 font-mono">Mã phân hệ (Key)</th>
                <th className="p-2.5 w-24 text-center">Xem</th>
                <th className="p-2.5 w-24 text-center">Thêm</th>
                <th className="p-2.5 w-24 text-center">Sửa</th>
                <th className="p-2.5 w-24 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentRolePermissions.map((p, idx) => (
                <tr key={p.Id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                  <td className="p-2.5 font-semibold text-slate-800">{p.FeatureName}</td>
                  <td className="p-2.5 font-mono text-slate-500">{p.FeatureKey}</td>
                  <td className="p-2.5 text-center">
                    <input
                      type="checkbox"
                      disabled={selectedRole === 'admin'}
                      checked={p.CanView}
                      onChange={() => handleToggle(p.Id, 'CanView')}
                      className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-2.5 text-center">
                    <input
                      type="checkbox"
                      disabled={selectedRole === 'admin'}
                      checked={p.CanCreate}
                      onChange={() => handleToggle(p.Id, 'CanCreate')}
                      className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-2.5 text-center">
                    <input
                      type="checkbox"
                      disabled={selectedRole === 'admin'}
                      checked={p.CanEdit}
                      onChange={() => handleToggle(p.Id, 'CanEdit')}
                      className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-2.5 text-center">
                    <input
                      type="checkbox"
                      disabled={selectedRole === 'admin'}
                      checked={p.CanDelete}
                      onChange={() => handleToggle(p.Id, 'CanDelete')}
                      className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="h-12 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-600 shadow-xs">
        <div>
          Đang xem quyền của vai trò: <strong className="text-amber-800 font-semibold">{roleLabels[selectedRole] || selectedRole}</strong>
        </div>
        <div className="text-[11px] text-slate-400">
          Quyền được áp dụng ngay sau khi lưu và người dùng đăng nhập lại hoặc chuyển trang.
        </div>
      </div>
    </div>
  );
}
