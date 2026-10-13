'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuditLogItem } from '@/types';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(100);

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/audit-logs?limit=${limit}`);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  }, [limit]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.Action.toLowerCase().includes(q) ||
        l.Entity.toLowerCase().includes(q) ||
        l.UserName.toLowerCase().includes(q) ||
        l.Detail.toLowerCase().includes(q) ||
        l.EntityId.toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 overflow-hidden select-none">
      {/* Toolbar */}
      <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo thao tác, người dùng, chi tiết..."
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 w-72 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
          />

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
          >
            <option value={50}>50 dòng gần nhất</option>
            <option value={100}>100 dòng gần nhất</option>
            <option value={200}>200 dòng gần nhất</option>
            <option value={500}>500 dòng gần nhất</option>
          </select>

          <button
            onClick={loadLogs}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>🔄</span>
            <span>Nạp lại</span>
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Hiển thị: <strong className="text-slate-800">{filteredLogs.length}</strong> sự kiện
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4">
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 text-slate-600 border-b border-slate-200 z-10 font-semibold shadow-xs">
              <tr>
                <th className="p-2.5 w-12 text-center">STT</th>
                <th className="p-2.5 w-40">Thời gian</th>
                <th className="p-2.5 w-32">Người thực hiện</th>
                <th className="p-2.5 w-28 text-center">Hành động</th>
                <th className="p-2.5 w-28">Đối tượng</th>
                <th className="p-2.5 w-24">ID</th>
                <th className="p-2.5">Chi tiết thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Không có nhật ký hoạt động nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l, idx) => {
                  const actionColor =
                    l.Action.includes('DELETE') || l.Action.includes('REJECT')
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : l.Action.includes('CREATE') || l.Action.includes('APPROVE')
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : l.Action.includes('UPDATE')
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200';

                  return (
                    <tr key={l.Id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-mono text-slate-500">
                        {l.CreatedAt ? new Date(l.CreatedAt).toLocaleString('vi-VN') : '—'}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-800">{l.UserName || l.UserId || 'System'}</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${actionColor}`}
                        >
                          {l.Action}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-amber-800 font-medium">{l.Entity}</td>
                      <td className="p-2.5 font-mono text-slate-500">{l.EntityId}</td>
                      <td className="p-2.5 text-slate-600">{l.Detail}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-500 shadow-xs">
        <span>Audit Trail ghi lại toàn bộ hoạt động của tất cả người dùng và giao dịch kho</span>
      </div>
    </div>
  );
}
