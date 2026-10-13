'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, RecipeIngredient, Product } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { DecimalInput } from '@/components/shared/DecimalInput';

export default function RecipeCalcPage() {
  const { setActivePage } = useApp();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number>(0);
  const [targetYield, setTargetYield] = useState<number>(1);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/recipes')
      .then((r) => r.json())
      .then((d) => {
        if (d.recipes && d.recipes.length > 0) {
          setRecipes(d.recipes);
          setSelectedRecipeId(d.recipes[0].Id);
        }
      });

    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []));
  }, []);

  useEffect(() => {
    if (!selectedRecipeId) return;
    fetch(`/api/recipes/${selectedRecipeId}/ingredients`)
      .then((r) => r.json())
      .then((d) => setIngredients(d.ingredients || []));
  }, [selectedRecipeId]);

  const selectedRecipe = useMemo(() => {
    return recipes.find((r) => r.Id === selectedRecipeId);
  }, [recipes, selectedRecipeId]);

  const calculatedItems = useMemo(() => {
    if (!selectedRecipe) return [];
    const base = selectedRecipe.BaseYield || 1;
    const multiplier = targetYield / base;

    return ingredients.map((ing) => {
      const needed = Number((ing.Amount * multiplier).toFixed(4));
      const prod = products.find(
        (p) => p.Name.toLowerCase() === ing.ProductName.toLowerCase()
      );
      const stock = prod ? prod.StockQty : 0;
      const isShort = stock < needed;
      const subtotal = needed * (prod?.CostPrice || ing.Price);

      return {
        ...ing,
        needed,
        stock,
        isShort,
        unit: ing.Unit || prod?.Unit || 'g',
        price: prod?.CostPrice || ing.Price,
        subtotal,
      };
    });
  }, [selectedRecipe, targetYield, ingredients, products]);

  const totalCost = calculatedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const hasShortage = calculatedItems.some((item) => item.isShort);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 overflow-hidden select-none">
      {/* Top Controller */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-semibold uppercase">Chọn bánh:</span>
            <select
              value={selectedRecipeId}
              onChange={(e) => setSelectedRecipeId(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
            >
              {recipes.map((r) => (
                <option key={r.Id} value={r.Id}>
                  🥖 {r.Name} (Cơ sở: {r.BaseYield} mẻ)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-semibold uppercase">
              Số lượng sản xuất:
            </span>
            <DecimalInput
              min={0.01}
              step={0.5}
              value={targetYield}
              onChange={(val) => setTargetYield(val || 1)}
              className="w-24 bg-white border border-slate-300 rounded-xl px-3 py-2 text-center text-xs font-bold text-amber-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
              placeholder="1"
            />
            <span className="text-xs text-slate-600 font-medium">mẻ / chiếc</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('invoices')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>📤</span>
            <span>Xuất kho sản xuất ngay</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
        {hasShortage && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 shadow-xs">
            <span className="text-base">⚠️</span>
            <span>
              Cảnh báo: Có nguyên liệu trong kho không đủ để sản xuất số lượng mẻ này. Hãy kiểm tra các dòng đánh dấu đỏ bên dưới.
            </span>
          </div>
        )}

        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3">Tên nguyên vật liệu</th>
                <th className="p-3 w-28 text-right">Định mức/mẻ</th>
                <th className="p-3 w-32 text-right">Tổng cần dùng</th>
                <th className="p-3 w-20 text-center">ĐVT</th>
                <th className="p-3 w-32 text-right">Tồn kho hiện có</th>
                <th className="p-3 w-32 text-right">Đơn giá vốn (₫)</th>
                <th className="p-3 w-36 text-right">Thành tiền (₫)</th>
                <th className="p-3 w-28 text-center">Tình trạng kho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculatedItems.map((item, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    item.isShort ? 'bg-rose-50/70' : ''
                  }`}
                >
                  <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                  <td className="p-3 font-medium text-slate-800">{item.ProductName}</td>
                  <td className="p-3 text-right font-mono text-slate-600">
                    {Number(item.Amount).toLocaleString('vi-VN', { maximumFractionDigits: 4 })}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-amber-700 text-sm">
                    {item.needed.toLocaleString('vi-VN', { maximumFractionDigits: 4 })}
                  </td>
                  <td className="p-3 text-center text-slate-600">{item.unit}</td>
                  <td className="p-3 text-right font-mono text-slate-700 font-medium">
                    {Number(item.stock).toLocaleString('vi-VN', { maximumFractionDigits: 4 })}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-600">
                    {Number(item.price).toLocaleString('vi-VN')}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold text-slate-900">
                    {item.subtotal.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.isShort
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {item.isShort ? 'Thiếu hàng' : 'Đủ nguyên liệu'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Total */}
      <div className="h-14 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-600 shadow-xs">
        <div>
          <span>Tổng số nguyên liệu: </span>
          <strong className="text-slate-800 font-mono font-bold">{calculatedItems.length}</strong>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 uppercase font-semibold">Ước tính giá thành sản xuất:</span>
          <span className="text-xl font-bold font-mono text-amber-700">
            {totalCost.toLocaleString('vi-VN')} ₫
          </span>
        </div>
      </div>
    </div>
  );
}
