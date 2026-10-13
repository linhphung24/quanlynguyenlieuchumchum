'use client';

import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';

export default function AuthScreen() {
  const { login, loading } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('654321');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await login(username, password);
    if (!res.success) {
      setError(res.error || 'Đăng nhập không thành công');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffbeb] via-[#fef3c7]/30 to-[#fed7aa]/20 flex items-center justify-center p-4">
      {/* Decorative background glow */}
      <div className="absolute w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none -top-10 -left-10" />
      <div className="absolute w-96 h-96 bg-orange-300/15 rounded-full blur-3xl pointer-events-none -bottom-10 -right-10" />

      <div className="relative w-full max-w-md bg-white border border-amber-200/80 rounded-2xl p-8 shadow-2xl shadow-amber-900/5 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25 mb-3 text-white">
            <span className="text-3xl">🥖</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-wide">
            CHUM CHUM BAKERY
          </h1>
          <p className="text-xs text-amber-700 font-semibold uppercase tracking-widest mt-1">
            Hệ thống Quản lý Kho
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Tên tài khoản
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập (vd: admin)"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang kết nối cơ sở dữ liệu...</span>
              </>
            ) : (
              <span>Đăng nhập hệ thống</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Phiên bản Quản lý Kho VPS MSSQL • TT 99/2025/TT-BTC
          </p>
        </div>
      </div>
    </div>
  );
}
