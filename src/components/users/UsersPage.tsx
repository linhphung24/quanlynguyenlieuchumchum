'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { useApp } from '@/contexts/AppContext';

export default function UsersPage() {
  const { hasPermission, toast, user: currentUser } = useApp();
  const [users, setUsers] = useState<User[]>([]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'ketoan' | 'thukho' | 'staff'>('staff');

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('123456');
    setFullName('');
    setRole('staff');
    setModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setUsername(u.Username);
    setPassword('');
    setFullName(u.FullName);
    setRole(u.Role);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      alert('Vui lòng điền đầy đủ tên đăng nhập và họ tên.');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            Id: editingUser?.Id || 0,
            Username: username,
            FullName: fullName,
            Role: role,
          },
          password,
        }),
      });

      if (res.ok) {
        toast(editingUser ? 'Cập nhật tài khoản thành công' : 'Thêm tài khoản thành công', 'success');
        setModalOpen(false);
        loadUsers();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi lưu');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (u: User) => {
    if (u.Id === currentUser?.Id) {
      alert('Bạn không thể xóa chính tài khoản đang đăng nhập.');
      return;
    }
    const ok = confirm(`Bạn có chắc muốn xóa tài khoản '${u.Username}'?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/users?id=${u.Id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Đã xóa tài khoản thành công', 'success');
        loadUsers();
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
            <span>Thêm tài khoản</span>
          </button>

          <button
            onClick={loadUsers}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>🔄</span>
            <span>Nạp lại</span>
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Tổng số tài khoản: <strong className="text-slate-800">{users.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4">
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 text-slate-600 border-b border-slate-200 z-10 font-semibold shadow-xs">
              <tr>
                <th className="p-2.5 w-12 text-center">STT</th>
                <th className="p-2.5 w-40">Tên đăng nhập</th>
                <th className="p-2.5 w-52">Họ và tên</th>
                <th className="p-2.5 w-36 text-center">Vai trò</th>
                <th className="p-2.5 w-36">Ngày tạo</th>
                <th className="p-2.5 w-36">Người tạo</th>
                <th className="p-2.5 w-24 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u, idx) => {
                const roleDisplay =
                  u.Role === 'admin'
                    ? 'Quản trị viên'
                    : u.Role === 'manager'
                    ? 'Quản lý'
                    : u.Role === 'ketoan'
                    ? 'Kế toán'
                    : u.Role === 'thukho'
                    ? 'Thủ kho'
                    : 'Nhân viên';

                const roleBadgeColor =
                  u.Role === 'admin'
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : u.Role === 'manager'
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : u.Role === 'ketoan'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                return (
                  <tr key={u.Id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-semibold text-slate-900">{u.Username}</td>
                    <td className="p-2.5 font-medium text-slate-800">{u.FullName}</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${roleBadgeColor}`}
                      >
                        {roleDisplay}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-500">
                      {u.CreatedAt ? u.CreatedAt.split('T')[0] : '—'}
                    </td>
                    <td className="p-2.5 text-slate-500">{u.CreatedBy || '—'}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Sửa"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1 rounded hover:bg-rose-50 text-rose-600 transition-colors"
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
      </div>

      {/* User Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">
                {editingUser ? 'Sửa Tài Khoản' : 'Thêm Tài Khoản Mới'}
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
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingUser)}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="VD: ketoan01"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-50 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Vai trò (Role)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="admin">Quản trị viên (admin)</option>
                  <option value="manager">Quản lý (manager)</option>
                  <option value="ketoan">Kế toán (ketoan)</option>
                  <option value="thukho">Thủ kho (thukho)</option>
                  <option value="staff">Nhân viên (staff)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  {editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu khởi tạo'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? '••••••••' : 'Nhập mật khẩu'}
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
                  Lưu tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
