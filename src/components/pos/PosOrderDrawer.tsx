'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { PosTable, PosOrder, PosOrderDetail, Product, PosReceiptTemplate } from '@/types';
import { fmtPrice } from '@/lib/utils';
import PosQrPaymentModal from './PosQrPaymentModal';
import PosCashPaymentModal from './PosCashPaymentModal';
import PosPrintReceiptModal from './PosPrintReceiptModal';
import { broadcastCustomerOrder, broadcastClearCustomerDisplay } from '@/lib/customerDisplaySync';

interface Props {
  table: PosTable | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
  allTables: PosTable[];
  onUpdateLocalTable?: (tableId: number, order: PosOrder | null, status: 'available' | 'occupied') => void;
}

export default function PosOrderDrawer({
  table,
  isOpen,
  onClose,
  onOrderUpdated,
  allTables,
  onUpdateLocalTable,
}: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Current Order State
  const [activeOrder, setActiveOrder] = useState<PosOrder | null>(table?.CurrentOrder || null);
  const [orderItems, setOrderItems] = useState<PosOrderDetail[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [vatAmount, setVatAmount] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [savingOrder, setSavingOrder] = useState(false);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modals
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showMoveTableModal, setShowMoveTableModal] = useState(false);
  const [receiptTemplate, setReceiptTemplate] = useState<PosReceiptTemplate | null>(null);

  // Move table state
  const [targetTableId, setTargetTableId] = useState<number | ''>('');
  const [moveAction, setMoveAction] = useState<'move' | 'merge'>('move');

  // Load products
  useEffect(() => {
    if (!isOpen) return;
    async function loadProducts() {
      setLoadingProducts(true);
      try {
        const res = await fetch('/api/pos/menu?onlyActive=true');
        if (res.ok) {
          const data = await res.json();
          const menuList = (data.items || []).map((m: any) => ({
            Id: m.Id,
            Code: m.Code,
            Name: m.Name,
            Category: m.Category,
            Unit: m.Unit,
            SellPrice: m.Price,
            CostPrice: m.CostPrice,
            StockQty: 999,
            MinStock: 0,
            IsActive: m.IsActive,
            Supplier: '',
            Description: m.Description,
            RecipeCount: m.RecipeCount,
          }));
          setProducts(menuList);
        }
      } catch (err) {
        console.error('Failed to load menu items:', err);
      } finally {
        setLoadingProducts(false);
      }
    }

    async function loadTemplate() {
      try {
        const res = await fetch('/api/pos/receipt-template');
        if (res.ok) {
          const tpl = await res.json();
          setReceiptTemplate(tpl);
        }
      } catch (err) {}
    }

    loadProducts();
    loadTemplate();
  }, [isOpen]);

  // Sync order from table
  useEffect(() => {
    if (table && table.CurrentOrder) {
      const ord = table.CurrentOrder;
      setActiveOrder(ord);
      setOrderItems(ord.Details || []);
      setDiscountAmount(ord.DiscountAmount || 0);
      setVatAmount(ord.VatAmount || 0);
      setCustomerName(ord.CustomerName || '');
    } else {
      setActiveOrder(null);
      setOrderItems([]);
      setDiscountAmount(0);
      setVatAmount(0);
      setCustomerName('');
    }
  }, [table, isOpen]);

  // Compute Categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.Category).filter(Boolean)));
    return ['Tất cả', ...cats];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Tất cả' || p.Category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.Code && p.Code.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Item handlers
  const handleAddItem = (prod: any) => {
    setOrderItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => (i.MenuItemId && i.MenuItemId === prod.Id) || i.ProductId === prod.Id
      );
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          Quantity: next[existingIdx].Quantity + 1,
          Subtotal: (next[existingIdx].Quantity + 1) * next[existingIdx].Price,
        };
        return next;
      }
      return [
        ...prev,
        {
          OrderId: table?.CurrentOrderId || 0,
          MenuItemId: prod.Id,
          ProductId: prod.Id,
          ProductCode: prod.Code,
          ProductName: prod.Name,
          Unit: prod.Unit || 'cái',
          Quantity: 1,
          Price: prod.SellPrice || prod.CostPrice || 0,
          Discount: 0,
          Subtotal: prod.SellPrice || prod.CostPrice || 0,
          Note: '',
          Status: 'served',
        },
      ];
    });
  };

  const handleUpdateQty = (index: number, delta: number) => {
    setOrderItems((prev) => {
      const next = [...prev];
      const newQty = next[index].Quantity + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== index);
      }
      next[index] = {
        ...next[index],
        Quantity: newQty,
        Subtotal: newQty * next[index].Price,
      };
      return next;
    });
  };

  const handleUpdateNote = (index: number, note: string) => {
    setOrderItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], Note: note };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Basket calculations
  const subtotal = useMemo(() => {
    return orderItems.reduce((sum, it) => sum + it.Quantity * it.Price, 0);
  }, [orderItems]);

  const finalAmount = Math.max(0, subtotal - discountAmount + vatAmount);

  const currentOrderObject: PosOrder = useMemo(() => ({
    Id: activeOrder?.Id || table?.CurrentOrderId || 0,
    OrderCode: activeOrder?.OrderCode || table?.CurrentOrder?.OrderCode || `ORD-TMP-${Date.now().toString().slice(-4)}`,
    TableId: table?.Id,
    TableName: table?.Name,
    OrderType: table ? 'dine_in' : 'takeaway',
    CustomerName: customerName,
    Subtotal: subtotal,
    DiscountAmount: discountAmount,
    VatAmount: vatAmount,
    FinalAmount: finalAmount,
    CashReceived: 0,
    CashChange: 0,
    PaymentStatus: 'unpaid',
    OrderStatus: 'serving',
    CreatedBy: 'Thu ngân',
    CreatedAt: activeOrder?.CreatedAt || new Date().toISOString(),
    Details: orderItems,
  }), [activeOrder, table, customerName, subtotal, discountAmount, vatAmount, finalAmount, orderItems]);

  // Sync to Customer Display and update local table status immediately
  useEffect(() => {
    if (!isOpen) return;
    if (orderItems.length > 0) {
      broadcastCustomerOrder(currentOrderObject, false);
      if (table?.Id) {
        onUpdateLocalTable?.(table.Id, currentOrderObject, 'occupied');
      }
    } else {
      broadcastClearCustomerDisplay();
    }
  }, [orderItems, currentOrderObject, isOpen, table?.Id, onUpdateLocalTable]);

  // Debounced auto-save to database when picking items on dine-in table
  useEffect(() => {
    if (!isOpen || !table?.Id) return;
    if (orderItems.length === 0) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/pos/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableId: table.Id,
            orderType: 'dine_in',
            customerName,
            items: orderItems,
            discountAmount,
            vatAmount,
            createdBy: 'Thu ngân',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            setActiveOrder(data.order);
            onUpdateLocalTable?.(table.Id, data.order, 'occupied');
            onOrderUpdated();
          }
        }
      } catch (err) {
        console.error('Auto-save error:', err);
      }
    }, 600);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [orderItems, discountAmount, vatAmount, customerName, table?.Id, isOpen, onUpdateLocalTable, onOrderUpdated]);

  // Close drawer and guarantee table is saved & marked occupied if items present
  const handleCloseDrawer = useCallback(async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    if (table?.Id && orderItems.length > 0) {
      try {
        const res = await fetch('/api/pos/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableId: table.Id,
            orderType: 'dine_in',
            customerName,
            items: orderItems,
            discountAmount,
            vatAmount,
            createdBy: 'Thu ngân',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            onUpdateLocalTable?.(table.Id, data.order, 'occupied');
            onOrderUpdated();
          }
        }
      } catch (err) {
        console.error('Error auto-saving on close:', err);
      }
    }

    onClose();
  }, [table?.Id, orderItems, customerName, discountAmount, vatAmount, onUpdateLocalTable, onOrderUpdated, onClose]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!showQrModal && !showCashModal && !showPrintModal && !showMoveTableModal) {
          handleCloseDrawer();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showQrModal, showCashModal, showPrintModal, showMoveTableModal, handleCloseDrawer]);

  // Save / Sync Order with API
  const handleSaveOrder = async (): Promise<PosOrder | null> => {
    if (orderItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 món!');
      return null;
    }
    setSavingOrder(true);
    try {
      const res = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: table?.Id,
          orderType: table ? 'dine_in' : 'takeaway',
          customerName,
          items: orderItems,
          discountAmount,
          vatAmount,
          createdBy: 'Thu ngân',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Lỗi lưu đơn hàng');
        return null;
      }
      setActiveOrder(data.order);
      if (table?.Id) {
        onUpdateLocalTable?.(table.Id, data.order, 'occupied');
      }
      onOrderUpdated();
      return data.order;
    } catch (err: any) {
      alert('Lỗi kết nối khi lưu đơn');
      return null;
    } finally {
      setSavingOrder(false);
    }
  };

  const handleOpenPayment = async (type: 'cash' | 'qr') => {
    const saved = await handleSaveOrder();
    if (!saved) return;
    setActiveOrder(saved);
    if (type === 'cash') {
      setShowCashModal(true);
    } else {
      setShowQrModal(true);
    }
  };

  const handlePaymentSuccess = (updatedOrder: PosOrder) => {
    setShowCashModal(false);
    setShowQrModal(false);
    setShowPrintModal(true);
    setActiveOrder(null);
    setOrderItems([]);
    if (table?.Id) {
      onUpdateLocalTable?.(table.Id, null, 'available');
    }
    onOrderUpdated();
  };

  const handleMoveOrMerge = async () => {
    if (!targetTableId) {
      alert('Vui lòng chọn bàn đích!');
      return;
    }
    try {
      const res = await fetch('/api/pos/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: moveAction,
          sourceTableId: table?.Id,
          targetTableId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Thành công!');
        setShowMoveTableModal(false);
        onClose();
        onOrderUpdated();
      } else {
        alert(data.error || 'Thao tác không thành công');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex justify-end" onClick={handleCloseDrawer}>
      <div
        className="bg-white w-full max-w-6xl h-full shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= LEFT PANE: MENU PICKER ================= */}
        <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-200/90 overflow-hidden">
          {/* Header & Search */}
          <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span>{table ? `Bàn: ${table.Name}` : 'Đơn Mang Về'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                  Thực đơn Bán hàng
                </span>
              </h2>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Tìm món bánh, nước..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                🔍
              </span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loadingProducts ? (
              <div className="h-40 flex items-center justify-center text-slate-400 text-xs">
                Đang tải thực đơn...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs">
                <span>Không tìm thấy món nào phù hợp</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map((p) => {
                  const inBasketCount =
                    orderItems.find((i) => i.ProductId === p.Id)?.Quantity || 0;
                  return (
                    <div
                      key={p.Id}
                      onClick={() => handleAddItem(p)}
                      className={`relative bg-white rounded-2xl p-3 border transition-all cursor-pointer select-none flex flex-col justify-between hover:shadow-md hover:border-rose-300 ${
                        inBasketCount > 0
                          ? 'border-rose-400 ring-2 ring-rose-400/20 shadow-sm'
                          : 'border-slate-200/90'
                      }`}
                    >
                      {inBasketCount > 0 && (
                        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center shadow-md animate-in zoom-in-50">
                          {inBasketCount}
                        </span>
                      )}

                      <div>
                        <div className="w-full h-16 rounded-xl bg-gradient-to-tr from-amber-50 to-orange-100/50 flex items-center justify-center text-3xl mb-2 shadow-inner">
                          {p.Category.includes('Nước') || p.Category.includes('uống') || p.Category.includes('Trà')
                            ? '🥤'
                            : p.Category.includes('Cà phê') || p.Category.includes('Cafe')
                            ? '☕'
                            : p.Category.includes('kem')
                            ? '🎂'
                            : '🥐'}
                        </div>
                        <h4 className="font-semibold text-xs text-slate-800 line-clamp-2 leading-tight">
                          {p.Name}
                        </h4>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">{p.Unit}</span>
                        <span className="text-xs font-bold text-rose-600">
                          {fmtPrice(p.SellPrice || p.CostPrice || 0)} đ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT PANE: BASKET & BILLING ================= */}
        <div className="w-full md:w-96 bg-white flex flex-col h-full border-t md:border-t-0 shadow-lg z-10">
          {/* Basket Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🧾</span>
                <h3 className="font-bold text-sm">
                  {table ? `Bàn: ${table.Name}` : 'Đơn Mang Về'}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {orderItems.length} món đã chọn
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {table && table.CurrentOrderId && (
                <button
                  type="button"
                  onClick={() => setShowMoveTableModal(true)}
                  title="Chuyển bàn / Gộp bàn"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  ⇄ Đổi/Gộp
                </button>
              )}
              <button
                onClick={handleCloseDrawer}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Customer Input */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
            <input
              type="text"
              placeholder="Tên khách hàng / Ghi chú bàn..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
            />
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {orderItems.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                <span className="text-3xl mb-2">🛒</span>
                <span>Chưa có món nào trong đơn.</span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Nhấp vào món ở cột trái để thêm vào đơn.
                </span>
              </div>
            ) : (
              orderItems.map((it, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-800 leading-tight">
                      {it.ProductName}
                    </span>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-red-600 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      {fmtPrice(it.Price)} đ/{it.Unit}
                    </span>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQty(idx, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center transition-colors"
                      >
                        -
                      </button>
                      <span className="font-bold font-mono text-slate-800 min-w-5 text-center">
                        {it.Quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(idx, 1)}
                        className="w-6 h-6 rounded-lg bg-rose-50 hover:bg-rose-100 font-bold text-rose-600 flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-bold text-slate-900 font-mono">
                      {fmtPrice(it.Subtotal)} đ
                    </span>
                  </div>

                  {/* Note input */}
                  <div>
                    <input
                      type="text"
                      placeholder="Ghi chú món (ít đường, hâm nóng...)"
                      value={it.Note || ''}
                      onChange={(e) => handleUpdateNote(idx, e.target.value)}
                      className="w-full px-2 py-1 text-[11px] rounded-lg border border-slate-200/80 bg-slate-50 focus:outline-none focus:bg-white text-slate-600"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Billing Summary */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính món:</span>
              <span className="font-semibold font-mono">{fmtPrice(subtotal)} đ</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Chiết khấu / Giảm giá:</span>
              <input
                type="number"
                step="5000"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-24 px-2 py-0.5 text-right font-mono text-xs rounded border border-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800 text-sm">TỔNG CỘNG:</span>
              <span className="font-extrabold text-lg text-rose-600 font-mono">
                {fmtPrice(finalAmount)} đ
              </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSaveOrder()}
                disabled={savingOrder || orderItems.length === 0}
                className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {savingOrder ? 'Đang lưu...' : '💾 Lưu / Tạm tính'}
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                disabled={orderItems.length === 0}
                className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <span>🖨️</span>
                <span>In Bill tạm</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleOpenPayment('cash')}
                disabled={orderItems.length === 0}
                className="px-3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <span>💵</span>
                <span>Tiền Mặt</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenPayment('qr')}
                disabled={orderItems.length === 0}
                className="px-3 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <span>📱</span>
                <span>Quét VietQR</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Payment Modal */}
      <PosQrPaymentModal
        order={activeOrder || currentOrderObject}
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        receiptTemplate={receiptTemplate}
      />

      {/* Cash Payment Modal */}
      <PosCashPaymentModal
        order={activeOrder || currentOrderObject}
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Print Bill Modal */}
      <PosPrintReceiptModal
        order={activeOrder || currentOrderObject}
        template={receiptTemplate}
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
      />

      {/* Move / Merge Table Modal */}
      {showMoveTableModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-800">
              Đổi bàn / Gộp bàn ({table?.Name})
            </h3>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMoveAction('move')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  moveAction === 'move'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Chuyển sang bàn trống
              </button>
              <button
                type="button"
                onClick={() => setMoveAction('merge')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  moveAction === 'merge'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Gộp vào bàn khác
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chọn bàn đích:
              </label>
              <select
                value={targetTableId}
                onChange={(e) => setTargetTableId(Number(e.target.value) || '')}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none"
              >
                <option value="">-- Chọn bàn --</option>
                {allTables
                  .filter((t) => t.Id !== table?.Id)
                  .filter((t) =>
                    moveAction === 'move' ? t.Status === 'available' : t.Status !== 'available'
                  )
                  .map((t) => (
                    <option key={t.Id} value={t.Id}>
                      {t.Name} ({t.Status === 'available' ? 'Bàn trống' : 'Đang có khách'})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMoveTableModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleMoveOrMerge}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
