'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Recipe, RecipeIngredient, Product } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { DecimalInput } from '@/components/shared/DecimalInput';

export default function RecipesPage() {
  const { hasPermission, toast } = useApp();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [baseYield, setBaseYield] = useState(1);
  const [formIngredients, setFormIngredients] = useState<RecipeIngredient[]>([]);
  const [saving, setSaving] = useState(false);

  const loadRecipes = useCallback(async () => {
    try {
      const res = await fetch('/api/recipes');
      const data = await res.json();
      if (data.recipes) {
        setRecipes(data.recipes);
        if (data.recipes.length > 0) {
          const cur = data.recipes.find((r: Recipe) => r.Id === selectedRecipe?.Id);
          setSelectedRecipe(cur || data.recipes[0]);
        } else {
          setSelectedRecipe(null);
          setIngredients([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedRecipe?.Id]);

  useEffect(() => {
    loadRecipes();
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []));
  }, [loadRecipes]);

  useEffect(() => {
    if (!selectedRecipe) {
      setIngredients([]);
      return;
    }
    fetch(`/api/recipes/${selectedRecipe.Id}/ingredients`)
      .then((r) => r.json())
      .then((d) => setIngredients(d.ingredients || []));
  }, [selectedRecipe]);

  const handleOpenAdd = () => {
    setSelectedRecipe(null);
    setRecipeName('');
    setBaseYield(1);
    setFormIngredients([{ RecipeId: 0, ProductName: '', Amount: 100, Unit: 'g', Price: 0 }]);
    setModalOpen(true);
  };

  const handleOpenEdit = async (r: Recipe) => {
    setRecipeName(r.Name);
    setBaseYield(r.BaseYield);
    try {
      const res = await fetch(`/api/recipes/${r.Id}/ingredients`);
      const d = await res.json();
      setFormIngredients(
        d.ingredients && d.ingredients.length > 0
          ? d.ingredients
          : [{ RecipeId: r.Id, ProductName: '', Amount: 100, Unit: 'g', Price: 0 }]
      );
    } catch {
      setFormIngredients([{ RecipeId: r.Id, ProductName: '', Amount: 100, Unit: 'g', Price: 0 }]);
    }
    setModalOpen(true);
  };

  const handleAddIngredientRow = () => {
    setFormIngredients([
      ...formIngredients,
      { RecipeId: selectedRecipe?.Id || 0, ProductName: '', Amount: 100, Unit: 'g', Price: 0 },
    ]);
  };

  const handleRemoveIngredientRow = (idx: number) => {
    if (formIngredients.length <= 1) return;
    setFormIngredients(formIngredients.filter((_, i) => i !== idx));
  };

  const handleProductSelect = (idx: number, name: string) => {
    const prod = products.find((p) => p.Name.toLowerCase() === name.toLowerCase());
    const next = [...formIngredients];
    next[idx] = {
      ...next[idx],
      ProductName: name,
      Unit: prod?.Unit || next[idx].Unit || 'kg',
      Price: prod?.CostPrice || 0,
    };
    setFormIngredients(next);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName.trim()) {
      alert('Tên công thức không được để trống.');
      return;
    }

    const valid = formIngredients
      .filter((i) => i.ProductName.trim() && i.Amount > 0)
      .map((i) => {
        const prod = products.find(
          (p) => p.Name.toLowerCase() === i.ProductName.trim().toLowerCase()
        );
        return {
          ...i,
          Unit: prod?.Unit || i.Unit || 'kg',
        };
      });
    if (valid.length === 0) {
      alert('Vui lòng thêm ít nhất 1 nguyên liệu hợp lệ.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe: {
            Id: selectedRecipe?.Id || 0,
            Name: recipeName,
            BaseYield: baseYield,
          },
          ingredients: valid,
        }),
      });

      if (res.ok) {
        toast('Đã lưu công thức bánh thành công', 'success');
        setModalOpen(false);
        loadRecipes();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi lưu');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: Recipe) => {
    if (!hasPermission('Menu_Recipes', 'delete')) {
      alert('Bạn không có quyền xóa công thức.');
      return;
    }
    const ok = confirm(`Bạn có chắc muốn xóa công thức '${r.Name}'?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/recipes?id=${r.Id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Đã xóa công thức thành công', 'success');
        loadRecipes();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalCost = useMemo(() => {
    return ingredients.reduce((sum, ing) => sum + ing.Amount * ing.Price, 0);
  }, [ingredients]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 overflow-hidden select-none">
      {/* Toolbar */}
      <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
          >
            <span>➕</span>
            <span>Thêm công thức</span>
          </button>

          {selectedRecipe && (
            <>
              <button
                onClick={() => handleOpenEdit(selectedRecipe)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>✏️</span>
                <span>Sửa</span>
              </button>
              <button
                onClick={() => handleDelete(selectedRecipe)}
                className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>🗑️</span>
                <span>Xóa</span>
              </button>
            </>
          )}

          <button
            onClick={loadRecipes}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>🔄</span>
            <span>Nạp lại</span>
          </button>
        </div>
        <div className="text-xs text-slate-500">
          Tổng số công thức: <strong className="text-slate-800">{recipes.length}</strong>
        </div>
      </div>

      {/* Main Split: Left Recipes List (40%) & Right Ingredients Detail (60%) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left List */}
        <div className="w-2/5 border-r border-slate-200 overflow-y-auto custom-scrollbar bg-white">
          <div className="p-3 bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
            Danh sách Công thức bánh ({recipes.length})
          </div>
          <div className="divide-y divide-slate-100">
            {recipes.map((r) => {
              const isSelected = selectedRecipe?.Id === r.Id;
              return (
                <div
                  key={r.Id}
                  onClick={() => setSelectedRecipe(r)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-amber-50/80 text-amber-950 border-l-4 border-amber-500 pl-3' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-slate-800">{r.Name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-medium">
                      Cơ sở: {r.BaseYield} mẻ
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Cập nhật: {r.UpdatedAt ? r.UpdatedAt.split('T')[0] : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Ingredients Table */}
        <div className="w-3/5 flex flex-col bg-slate-50 overflow-hidden">
          <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
            <span className="text-xs font-bold text-amber-800">
              Định mức Nguyên vật liệu (BOM) — {selectedRecipe?.Name || 'Chưa chọn công thức'}
            </span>
            {selectedRecipe && (
              <span className="text-xs text-slate-600">
                Ước tính giá thành: <strong className="font-mono text-emerald-700 font-bold">{totalCost.toLocaleString('vi-VN')} ₫</strong> / {selectedRecipe.BaseYield} mẻ
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="p-2.5 w-12 text-center">#</th>
                    <th className="p-2.5">Tên nguyên liệu</th>
                    <th className="p-2.5 w-28 text-right">Định mức</th>
                    <th className="p-2.5 w-20 text-center">ĐVT</th>
                    <th className="p-2.5 w-32 text-right">Đơn giá vốn (₫)</th>
                    <th className="p-2.5 w-36 text-right">Thành tiền (₫)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ingredients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        Công thức này chưa có nguyên liệu nào.
                      </td>
                    </tr>
                  ) : (
                    ingredients.map((ing, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 text-center text-slate-400">{i + 1}</td>
                        <td className="p-2.5 font-medium text-slate-800">{ing.ProductName}</td>
                        <td className="p-2.5 text-right font-mono font-semibold text-amber-700">
                          {Number(ing.Amount).toLocaleString('vi-VN', { maximumFractionDigits: 4 })}
                        </td>
                        <td className="p-2.5 text-center text-slate-600">{ing.Unit}</td>
                        <td className="p-2.5 text-right font-mono text-slate-600">
                          {Number(ing.Price).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold text-slate-900">
                          {(Number(ing.Amount) * Number(ing.Price)).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">
                {selectedRecipe ? 'Sửa Công Thức Bánh' : 'Thêm Công Thức Mới'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Tên bánh / Sản phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="VD: Bánh mì hoa cúc 500g"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Cơ sở (mẻ/chiếc)
                  </label>
                  <DecimalInput
                    min={0.01}
                    step={1}
                    value={baseYield}
                    onChange={(val) => setBaseYield(val || 1)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-center text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    placeholder="1"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Định mức Nguyên vật liệu (BOM)
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>➕</span>
                    <span>Thêm nguyên liệu</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                        <th className="p-2 text-center w-10">#</th>
                        <th className="p-2">Nguyên liệu</th>
                        <th className="p-2 w-28 text-right">Định mức</th>
                        <th className="p-2 w-24 text-center" title="Đơn vị tính mặc định theo sản phẩm (không sửa)">
                          ĐVT mặc định
                        </th>
                        <th className="p-2 w-28 text-right">Đơn giá (₫)</th>
                        <th className="p-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formIngredients.map((ing, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              list="prodRecipeList"
                              value={ing.ProductName}
                              onChange={(e) => handleProductSelect(idx, e.target.value)}
                              placeholder="Tên nguyên liệu"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <DecimalInput
                              min={0}
                              value={ing.Amount}
                              onChange={(val) => {
                                const next = [...formIngredients];
                                next[idx].Amount = val;
                                setFormIngredients(next);
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-right text-slate-800 font-semibold focus:outline-none focus:border-amber-500"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              readOnly
                              tabIndex={-1}
                              value={ing.Unit || '—'}
                              title="Đơn vị tính mặc định theo danh mục (không thể sửa)"
                              className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center text-slate-700 font-semibold cursor-not-allowed select-none focus:outline-none shadow-xs"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <DecimalInput
                              min={0}
                              value={ing.Price}
                              onChange={(val) => {
                                const next = [...formIngredients];
                                next[idx].Price = val;
                                setFormIngredients(next);
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-right text-slate-800 focus:outline-none focus:border-amber-500"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredientRow(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1 font-bold"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <datalist id="prodRecipeList">
                    {products.map((p) => (
                      <option key={p.Id} value={p.Name}>
                        {p.Code ? `[${p.Code}] ` : ''}{p.Name} (ĐVT: {p.Unit || 'kg'})
                      </option>
                    ))}
                  </datalist>
                </div>
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
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu công thức'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
