'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PosFloor, PosTable, PosOrder } from '@/types';
import { fmtPrice } from '@/lib/utils';
import PosOrderDrawer from './PosOrderDrawer';
import {
  broadcastCustomerOrder,
  broadcastClearCustomerDisplay,
  subscribeCustomerDisplay,
} from '@/lib/customerDisplaySync';

export default function PosTablesPage() {
  const [floors, setFloors] = useState<PosFloor[]>([]);
  const [tables, setTables] = useState<PosTable[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedFloorId, setSelectedFloorId] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Table for Order Drawer
  const [selectedTable, setSelectedTable] = useState<PosTable | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load tables & floors
  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch('/api/pos/tables');
      if (res.ok) {
        const data = await res.json();
        setFloors(data.floors || []);
        setTables(data.tables || []);
      }
    } catch (err) {
      console.error('Failed to load POS tables:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
    // Auto refresh tables every 10 seconds to sync live order status
    const interval = setInterval(fetchTables, 10000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const matchFloor = selectedFloorId === 'all' || t.FloorId === selectedFloorId;
      const matchStatus = statusFilter === 'all' || t.Status === statusFilter;
      return matchFloor && matchStatus;
    });
  }, [tables, selectedFloorId, statusFilter]);

  // Stats
  const totalTables = tables.length;
  const occupiedCount = tables.filter((t) => t.Status === 'occupied' || t.Status === 'billing').length;
  const availableCount = tables.filter((t) => t.Status === 'available').length;
  const liveTotalAmount = tables.reduce((sum, t) => sum + (t.CurrentOrder?.FinalAmount || 0), 0);

  const handleUpdateLocalTable = useCallback(
    (tableId: number, orderData: PosOrder | null, status: 'available' | 'occupied') => {
      setTables((prev) =>
        prev.map((t) => {
          if (t.Id === tableId) {
            return {
              ...t,
              Status: status,
              CurrentOrderId: orderData?.Id || null,
              CurrentOrder: orderData || undefined,
            };
          }
          return t;
        })
      );
    },
    []
  );

  // Sync active order if customer display asks
  useEffect(() => {
    const unsub = subscribeCustomerDisplay(
      () => {},
      () => {
        if (selectedTable?.CurrentOrder) {
          broadcastCustomerOrder(selectedTable.CurrentOrder);
        }
      }
    );
    return () => unsub();
  }, [selectedTable]);

  const handleSelectTable = (tbl: PosTable) => {
    setSelectedTable(tbl);
    setDrawerOpen(true);
    if (tbl.CurrentOrder) {
      broadcastCustomerOrder(tbl.CurrentOrder);
    } else {
      broadcastClearCustomerDisplay();
    }
  };

  const handleOpenTakeaway = () => {
    // Find or create dummy takeaway table
    setSelectedTable(null);
    setDrawerOpen(true);
    broadcastClearCustomerDisplay();
  };

  const handleOpenCustomerDisplay = () => {
    window.open(
      '/customer-display',
      'CustomerDisplayWindow',
      'width=900,height=900,menubar=no,toolbar=no'
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 select-none overflow-hidden">
      {/* Top Banner / Toolbar */}
      <div className="bg-white border-b border-slate-200/90 px-6 py-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        {/* Left: Quick Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-500">Trống:</span>
            <strong className="text-emerald-700">{availableCount}</strong>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-slate-500">Có khách:</span>
            <strong className="text-amber-700">{occupiedCount}</strong>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
            <span className="text-slate-500">Tạm tính tại bàn:</span>
            <strong className="text-rose-600 font-bold font-mono">
              {fmtPrice(liveTotalAmount)} đ
            </strong>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenTakeaway}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm shadow-amber-500/20 flex items-center gap-1.5 transition-colors"
          >
            <span>🛍️</span>
            <span>Mang Về Nhanh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCustomerDisplay}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>🖥️</span>
            <span>Màn hình phụ</span>
          </button>

          <button
            type="button"
            onClick={fetchTables}
            title="Làm mới trạng thái bàn"
            className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs flex items-center justify-center transition-colors"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Floor Filter Tabs & Status Chips */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Floors */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedFloorId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFloorId === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Tất cả khu vực ({totalTables})
          </button>
          {floors.map((f) => {
            const floorTablesCount = tables.filter((t) => t.FloorId === f.Id).length;
            return (
              <button
                key={f.Id}
                onClick={() => setSelectedFloorId(f.Id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFloorId === f.Id
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {f.Name} ({floorTablesCount})
              </button>
            );
          })}
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-emerald-700 border-emerald-200'
            }`}
          >
            Bàn trống
          </button>
          <button
            onClick={() => setStatusFilter('occupied')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              statusFilter === 'occupied'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-amber-700 border-amber-200'
            }`}
          >
            Đang phục vụ
          </button>
        </div>
      </div>

      {/* Main Content: Tables Grid */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            <span className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mr-2" />
            Đang tải sơ đồ bàn...
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            <span className="text-4xl mb-2">🍽️</span>
            <span>Không tìm thấy bàn nào theo bộ lọc</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredTables.map((tbl) => {
              const isOccupied = tbl.Status === 'occupied' || tbl.Status === 'billing';
              const order = tbl.CurrentOrder;
              const itemCount = (order?.Details || []).length;
              const finalAmount = order?.FinalAmount || 0;

              return (
                <div
                  key={tbl.Id}
                  onClick={() => handleSelectTable(tbl)}
                  className={`relative rounded-3xl p-4 border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 ${
                    isOccupied
                      ? 'bg-gradient-to-b from-amber-50/90 to-orange-50/60 border-amber-300 shadow-sm shadow-amber-500/10'
                      : 'bg-white border-slate-200/90 hover:border-emerald-300'
                  }`}
                >
                  {/* Status Indicator Pill */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isOccupied
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isOccupied ? 'Có khách' : 'Trống'}
                    </span>

                    <span className="text-[11px] text-slate-400 font-medium">
                      {tbl.Capacity} chỗ
                    </span>
                  </div>

                  {/* Table Name */}
                  <div className="my-1">
                    <h3 className="font-extrabold text-base text-slate-800 leading-tight">
                      {tbl.Name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{tbl.Code}</p>
                  </div>

                  {/* Details / Amount */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80">
                    {isOccupied ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span>{itemCount} món</span>
                          <span className="font-bold text-slate-900 font-mono">
                            {fmtPrice(finalAmount)} đ
                          </span>
                        </div>
                        {order?.CustomerName && (
                          <div className="text-[10px] text-slate-500 truncate">
                            👤 {order.CustomerName}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span>+</span>
                        <span>Mở bàn gọi món</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Drawer */}
      <PosOrderDrawer
        table={selectedTable}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOrderUpdated={fetchTables}
        allTables={tables}
        onUpdateLocalTable={handleUpdateLocalTable}
      />
    </div>
  );
}
