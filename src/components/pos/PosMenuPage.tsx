'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PosMenuItem, PosMenuItemRecipe, Product, Recipe } from '@/types';
import { fmtPrice, fmtNum, parseDecimal } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { DecimalInput } from '@/components/shared/DecimalInput';

const COMMON_UNITS = ['ly', 'cốc', 'cái', 'ổ', 'miếng', 'hộp', 'hũ', 'phần', 'set'];
const DEFAULT_CATEGORIES = [
  'Cà phê',
  'Trà & Trà sữa',
  'Nước ép',
  'Bánh tươi & Mì',
  'Bánh ngọt',
  'Bánh kem',
  'Đồ ăn vặt',
  'Khác',
];

export default function PosMenuPage() {
  const { toast } = useApp();

  // State
  const [items, setItems] = useState<PosMenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [warehouseProducts, setWarehouseProducts] = useState<Product[]>([]);
  const [recipesTemplates, setRecipesTemplates] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [recipeFilter, setRecipeFilter] = useState<'all' | 'has_recipe' | 'no_recipe'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PosMenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'recipe'>('info');

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState('Bánh ngọt');
  const [formUnit, setFormUnit] = useState('cái');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCostPrice, setFormCostPrice] = useState<number>(0);
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formRecipes, setFormRecipes] = useState<PosMenuItemRecipe[]>([]);
  const [saving, setSaving] = useState(false);

  // Quick view BOM popover item
  const [viewingBomItem, setViewingBomItem] = useState<PosMenuItem | null>(null);

  // Load menu items
  const loadMenu = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pos/menu');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (data.categories && data.categories.length > 0) {
          // Merge unique categories with default categories
          const combined = Array.from(new Set([...data.categories, ...DEFAULT_CATEGORIES]));
          setCategories(combined);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      }
    } catch (err) {
      console.error('Failed to load menu items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load warehouse products & recipes templates for BOM mapping
  useEffect(() => {
    loadMenu();

    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => setWarehouseProducts(d.products || []))
      .catch((e) => console.error(e));

    fetch('/api/recipes')
      .then((r) => r.json())
      .then((d) => setRecipesTemplates(d.recipes || []))
      .catch((e) => console.error(e));
  }, [loadMenu]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === 'Tất cả' || item.Category === selectedCategory;
      const matchSearch =
        !search ||
        item.Name.toLowerCase().includes(search.toLowerCase()) ||
        item.Code.toLowerCase().includes(search.toLowerCase());
      const hasRecipe = (item.RecipeCount || 0) > 0;
      const matchRecipe =
        recipeFilter === 'all' ||
        (recipeFilter === 'has_recipe' && hasRecipe) ||
        (recipeFilter === 'no_recipe' && !hasRecipe);
      return matchCat && matchSearch && matchRecipe;
    });
  }, [items, selectedCategory, search, recipeFilter]);

  // Stats
  const totalCount = items.length;
  const activeCount = items.filter((i) => i.IsActive).length;
  const withBomCount = items.filter((i) => (i.RecipeCount || 0) > 0).length;
  const noBomCount = totalCount - withBomCount;

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormName('');
    const randomCode = 'MN-' + Math.floor(1000 + Math.random() * 9000);
    setFormCode(randomCode);
    setFormCategory('Bánh ngọt');
    setFormUnit('cái');
    setFormPrice(35000);
    setFormCostPrice(0);
    setFormDescription('');
    setFormIsActive(true);
    setFormRecipes([]);
    setActiveTab('info');
    setModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = async (item: PosMenuItem) => {
    setEditingItem(item);
    setFormName(item.Name);
    setFormCode(item.Code);
    setFormCategory(item.Category);
    setFormUnit(item.Unit);
    setFormPrice(item.Price);
    setFormCostPrice(item.CostPrice);
    setFormDescription(item.Description || '');
    setFormIsActive(item.IsActive);
    setActiveTab('info');

    // Fetch full recipes details for this item
    try {
      const res = await fetch(`/api/pos/menu/${item.Id}`);
      if (res.ok) {
        const data = await res.json();
        setFormRecipes(data.item?.Recipes || []);
      } else {
        setFormRecipes([]);
      }
    } catch {
      setFormRecipes([]);
    }

    setModalOpen(true);
  };

  // Toggle active status
  const handleToggleActive = async (item: PosMenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/pos/menu/${item.Id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggleActive: true, isActive: !item.IsActive }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.Id === item.Id ? { ...i, IsActive: !item.IsActive } : i))
        );
        toast(`${!item.IsActive ? 'Đã bật' : 'Đã tạm ngưng'} kinh doanh món: ${item.Name}`, 'success');
      }
    } catch {
      toast('Lỗi cập nhật trạng thái món', 'error');
    }
  };

  // Delete item
  const handleDeleteItem = async (item: PosMenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Bạn có chắc chắn muốn xóa món "${item.Name}" khỏi Menu?`)) return;

    try {
      const res = await fetch(`/api/pos/menu/${item.Id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.Id !== item.Id));
        toast(`Đã xóa món ${item.Name}`, 'success');
      } else {
        const data = await res.json();
        toast(data.error || 'Lỗi khi xóa món', 'error');
      }
    } catch {
      toast('Lỗi máy chủ khi xóa món', 'error');
    }
  };

  // Calculate BOM sum cost
  const bomEstimatedCost = useMemo(() => {
    return formRecipes.reduce((sum, r) => {
      const amt = Number(r.Amount) || 0;
      const p = Number(r.CostPrice) || 0;
      return sum + amt * p;
    }, 0);
  }, [formRecipes]);

  // Handle adding an ingredient row to BOM
  const handleAddRecipeRow = () => {
    // Pick first warehouse product as default
    const firstProd = warehouseProducts[0];
    setFormRecipes((prev) => [
      ...prev,
      {
        ProductId: firstProd?.Id || null,
        ProductName: firstProd?.Name || '',
        Amount: 0.05,
        Unit: firstProd?.Unit || 'kg',
        CostPrice: firstProd?.CostPrice || 0,
        Note: '',
      },
    ]);
  };

  // Handle changing warehouse product for a recipe row
  const handleRecipeProductChange = (index: number, prodName: string) => {
    const prod = warehouseProducts.find(
      (p) => p.Name.toLowerCase() === prodName.trim().toLowerCase()
    );
    setFormRecipes((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        ProductId: prod?.Id || null,
        ProductName: prodName,
        Unit: prod?.Unit || next[index].Unit || 'kg',
        CostPrice: prod?.CostPrice || 0,
      };
      return next;
    });
  };

  // Update recipe row amount or note
  const handleUpdateRecipeRow = (
    index: number,
    field: keyof PosMenuItemRecipe,
    value: any
  ) => {
    setFormRecipes((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  // Remove recipe row
  const handleRemoveRecipeRow = (index: number) => {
    setFormRecipes((prev) => prev.filter((_, i) => i !== index));
  };

  // Import ingredients from existing Recipe template
  const handleImportFromRecipeTemplate = async (templateId: number) => {
    if (!templateId) return;
    try {
      const res = await fetch(`/api/recipes/${templateId}/ingredients`);
      if (res.ok) {
        const data = await res.json();
        const tpl = recipesTemplates.find((r) => r.Id === templateId);
        const baseYield = tpl?.BaseYield || 1;

        if (data.ingredients && data.ingredients.length > 0) {
          const imported: PosMenuItemRecipe[] = data.ingredients.map((ing: any) => {
            const prod = warehouseProducts.find(
              (p) => p.Name.toLowerCase() === (ing.ProductName || '').toLowerCase()
            );
            // Amount per 1 unit = Amount / baseYield
            const perUnitAmount = Number(((ing.Amount || 0) / baseYield).toFixed(4));
            return {
              ProductId: prod?.Id || null,
              ProductName: ing.ProductName,
              Amount: perUnitAmount,
              Unit: ing.Unit || prod?.Unit || 'g',
              CostPrice: prod?.CostPrice || ing.Price || 0,
              Note: `Công thức: ${tpl?.Name}`,
            };
          });

          setFormRecipes(imported);
          toast(
            `Đã nạp ${imported.length} nguyên liệu từ công thức "${tpl?.Name}" (quy đổi theo 1 ${formUnit})`,
            'success'
          );
        }
      }
    } catch (e) {
      toast('Lỗi khi nạp công thức mẫu', 'error');
    }
  };

  // Save item & recipes
  const handleSaveItem = async () => {
    if (!formName.trim()) {
      toast('Vui lòng nhập tên món!', 'error');
      return;
    }
    if (formPrice < 0) {
      toast('Giá bán không được âm!', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        item: {
          Id: editingItem?.Id || 0,
          Code: formCode.trim() || undefined,
          Name: formName.trim(),
          Category: formCategory.trim() || 'Khác',
          Unit: formUnit.trim() || 'cái',
          Price: formPrice,
          CostPrice: bomEstimatedCost > 0 ? Math.round(bomEstimatedCost) : formCostPrice,
          Description: formDescription.trim(),
          IsActive: formIsActive,
        },
        recipes: formRecipes.filter((r) => r.ProductName && Number(r.Amount) > 0),
      };

      const url = editingItem ? `/api/pos/menu/${editingItem.Id}` : '/api/pos/menu';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Lỗi lưu món', 'error');
        return;
      }

      toast(
        editingItem
          ? `Đã cập nhật món "${formName}" thành công!`
          : `Đã thêm món "${formName}" vào Menu thành công!`,
        'success'
      );

      setModalOpen(false);
      loadMenu();
    } catch {
      toast('Lỗi kết nối khi lưu món', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Quick view BOM
  const handleOpenViewBom = async (item: PosMenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/pos/menu/${item.Id}`);
      if (res.ok) {
        const data = await res.json();
        setViewingBomItem(data.item);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 select-none overflow-hidden">
      {/* Top Banner & Stats */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥐</span>
              <h2 className="text-lg font-bold text-slate-800">Menu Bánh & Đồ Uống</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                POS Menu
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Quản lý danh sách món bánh, đồ uống tại quầy và cấu hình định mức trừ kho nguyên vật liệu khi bán hàng
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-2">
              <span className="text-slate-500">Tổng số món:</span>
              <strong className="text-slate-800 font-mono text-sm">{totalCount}</strong>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-700">Đang bán:</span>
              <strong className="text-emerald-800 font-mono text-sm">{activeCount}</strong>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-xl flex items-center gap-2">
              <span className="text-indigo-600">🧪 Đã có định mức NVL:</span>
              <strong className="text-indigo-800 font-mono text-sm">{withBomCount}</strong>
            </div>

            <div className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl flex items-center gap-2">
              <span className="text-amber-700">⚠️ Chưa cấu hình định mức:</span>
              <strong className="text-amber-800 font-mono text-sm">{noBomCount}</strong>
            </div>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-rose-500/20 flex items-center gap-2 transition-all transform active:scale-95"
            >
              <span>➕</span>
              <span>Thêm món mới</span>
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('Tất cả')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === 'Tất cả'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({items.length})
            </button>
            {categories.map((cat) => {
              const countInCat = items.filter((i) => i.Category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-80">({countInCat})</span>
                </button>
              );
            })}
          </div>

          {/* Search & BOM Status Filter */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              value={recipeFilter}
              onChange={(e) => setRecipeFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-rose-500 shadow-2xs font-medium"
            >
              <option value="all">Tất cả định mức</option>
              <option value="has_recipe">🧪 Đã có định mức NVL</option>
              <option value="no_recipe">⚠️ Chưa có định mức</option>
            </select>

            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Tìm tên món, mã món..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-2xs"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Menu Items Cards Grid */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
            <span className="w-6 h-6 border-2 border-rose-500/30 border-t-rose-600 rounded-full animate-spin" />
            <span>Đang tải danh mục Menu Bánh & Đồ uống...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-64 bg-white rounded-2xl border border-slate-200/90 flex flex-col items-center justify-center p-8 text-center shadow-xs">
            <span className="text-4xl mb-2">🍽️</span>
            <h3 className="text-sm font-bold text-slate-800">Không tìm thấy món nào phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Hãy thử tìm kiếm với từ khóa khác hoặc bấm nút &quot;Thêm món mới&quot; để bổ sung vào thực đơn.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold transition-all"
            >
              ➕ Thêm món mới vào Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredItems.map((item) => {
              const hasRecipe = (item.RecipeCount || 0) > 0;
              const grossProfit = item.Price - item.CostPrice;
              const marginPercent =
                item.Price > 0 ? Math.round((grossProfit / item.Price) * 100) : 0;

              return (
                <div
                  key={item.Id}
                  onClick={() => handleOpenEdit(item)}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between overflow-hidden relative group ${
                    !item.IsActive
                      ? 'border-slate-200 opacity-60 bg-slate-50'
                      : 'border-slate-200 hover:border-rose-300'
                  }`}
                >
                  {/* Card Top Banner */}
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase tracking-wider">
                        {item.Category}
                      </span>

                      {/* Active Status Badge & Toggle */}
                      <button
                        onClick={(e) => handleToggleActive(item, e)}
                        title={item.IsActive ? 'Đang bán (bấm để tạm ngưng)' : 'Tạm ngưng (bấm để bán)'}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                          item.IsActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {item.IsActive ? '● Đang bán' : '○ Tạm ngưng'}
                      </button>
                    </div>

                    {/* Item Name & Code */}
                    <h3 className="font-bold text-slate-800 text-sm mt-2 line-clamp-2 group-hover:text-rose-600 transition-colors">
                      {item.Name}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {item.Code}
                    </div>

                    {item.Description && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.Description}
                      </p>
                    )}
                  </div>

                  {/* Card Bottom: Prices & BOM badge */}
                  <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-baseline justify-between mb-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Giá bán</span>
                        <span className="text-base font-extrabold text-rose-600 font-mono">
                          {fmtPrice(item.Price)}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">/{item.Unit}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Vốn NVL</span>
                        <span className="text-xs font-semibold text-slate-700 font-mono">
                          {item.CostPrice > 0 ? fmtPrice(item.CostPrice) : '—'}
                        </span>
                        {item.Price > 0 && item.CostPrice > 0 && (
                          <span className="text-[10px] text-emerald-600 font-bold block">
                            Lãi ~{marginPercent}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* BOM badge */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      {hasRecipe ? (
                        <button
                          onClick={(e) => handleOpenViewBom(item, e)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition-colors"
                          title="Bấm để xem nhanh các nguyên liệu trong định mức"
                        >
                          <span>🧪</span>
                          <span>{item.RecipeCount} NVL trừ kho</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                          <span>⚠️</span>
                          <span>Chưa có định mức</span>
                        </span>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(item);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                          title="Chỉnh sửa món & Định mức"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => handleDeleteItem(item, e)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa món khỏi menu"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK VIEW BOM MODAL */}
      {viewingBomItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧪</span>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Định mức nguyên liệu: {viewingBomItem.Name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mã món: {viewingBomItem.Code} • ĐVT: {viewingBomItem.Unit}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingBomItem(null)}
                className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <p className="text-xs text-slate-600 mb-3 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                Khi thanh toán <strong>1 {viewingBomItem.Unit}</strong> món này tại POS, kho sẽ tự động trừ các nguyên liệu sau:
              </p>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Nguyên liệu kho</th>
                      <th className="p-2.5 text-right">Định mức/món</th>
                      <th className="p-2.5 text-center">ĐVT</th>
                      <th className="p-2.5 text-right">Đơn giá vốn</th>
                      <th className="p-2.5 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewingBomItem.Recipes || []).map((r, idx) => {
                      const cost = (Number(r.Amount) || 0) * (Number(r.CostPrice) || 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-800">{r.ProductName}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                            {fmtNum(r.Amount)}
                          </td>
                          <td className="p-2.5 text-center text-slate-500">{r.Unit}</td>
                          <td className="p-2.5 text-right font-mono text-slate-600">
                            {fmtPrice(r.CostPrice || 0)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
                            {fmtPrice(cost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-3">
                <span>Tổng chi phí vốn NVL định mức:</span>
                <strong className="text-base font-mono font-bold text-rose-600">
                  {fmtPrice(viewingBomItem.CostPrice)}
                </strong>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => {
                  const it = viewingBomItem;
                  setViewingBomItem(null);
                  handleOpenEdit(it);
                }}
                className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                ✏️ Chỉnh sửa định mức
              </button>
              <button
                onClick={() => setViewingBomItem(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center text-lg shadow-sm">
                  {editingItem ? '✏️' : '➕'}
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {editingItem ? `Chỉnh sửa món: ${editingItem.Name}` : 'Thêm món mới vào Menu'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cấu hình thông tin bán hàng và định mức nguyên vật liệu tiêu hao
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center text-base"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 gap-3">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'info'
                    ? 'border-rose-500 text-rose-600 bg-white px-4 rounded-t-xl -mb-px'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>📋</span>
                <span>Thông tin món</span>
              </button>

              <button
                onClick={() => setActiveTab('recipe')}
                className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'recipe'
                    ? 'border-rose-500 text-rose-600 bg-white px-4 rounded-t-xl -mb-px'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🧪</span>
                <span>Định mức trừ kho (BOM)</span>
                {formRecipes.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-mono">
                    {formRecipes.length}
                  </span>
                )}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              {activeTab === 'info' ? (
                <div className="space-y-4">
                  {/* Row 1: Name & Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tên món bánh / đồ uống <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ví dụ: Cà Phê Muối Kem Béo, Bánh Croissant..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mã món <span className="text-slate-400 font-normal">(Code)</span>
                      </label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                        placeholder="DU_CAFE_MUOI"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  {/* Row 2: Category, Unit, Prices */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nhóm món
                      </label>
                      <input
                        list="category-suggestions"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        placeholder="Chọn hoặc nhập nhóm..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      />
                      <datalist id="category-suggestions">
                        {categories.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Đơn vị tính (ĐVT)
                      </label>
                      <input
                        list="unit-suggestions"
                        value={formUnit}
                        onChange={(e) => setFormUnit(e.target.value)}
                        placeholder="ly, cái, ổ..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      />
                      <datalist id="unit-suggestions">
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Giá bán niêm yết (₫) <span className="text-rose-500">*</span>
                      </label>
                      <DecimalInput
                        value={formPrice}
                        onChange={(val) => setFormPrice(val || 0)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-rose-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Giá vốn ước tính (₫)
                      </label>
                      <div className="relative">
                        <DecimalInput
                          value={bomEstimatedCost > 0 ? Math.round(bomEstimatedCost) : formCostPrice}
                          onChange={(val) => setFormCostPrice(val || 0)}
                          disabled={bomEstimatedCost > 0}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-semibold text-slate-700 focus:outline-none focus:border-rose-500 text-right disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>
                      {bomEstimatedCost > 0 && (
                        <span className="text-[10px] text-indigo-600 font-medium block mt-0.5">
                          ✓ Tự động tính từ định mức BOM
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mô tả / Thành phần nổi bật
                    </label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Mô tả hương vị, topping, hướng dẫn pha chế hoặc lưu ý..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  {/* Row 4: Status */}
                  <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      id="form-is-active"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                    />
                    <label htmlFor="form-is-active" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Đang kinh doanh món này trên Menu POS
                    </label>
                  </div>
                </div>
              ) : (
                /* TAB 2: RECIPES / BOM */
                <div className="space-y-4">
                  {/* Guide Alert */}
                  <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 text-xs text-indigo-950 flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <div className="leading-relaxed">
                      <strong className="font-bold text-indigo-900 block mb-0.5">
                        Quy tắc trừ kho tự động theo Định mức (BOM):
                      </strong>
                      Khi thu ngân thanh toán <strong>{formName || 'món'}</strong> trên màn hình POS, hệ thống sẽ tự động nhân số lượng bán với định mức bên dưới để sinh Phiếu xuất kho NVL, tự động trừ các lô hàng FIFO và cập nhật tồn kho tức thì.
                    </div>
                  </div>

                  {/* Action row: Load template & Add row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Nạp nhanh từ:</span>
                      <select
                        onChange={(e) => handleImportFromRecipeTemplate(Number(e.target.value))}
                        defaultValue=""
                        className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-rose-500 shadow-2xs"
                      >
                        <option value="" disabled>
                          -- Chọn Công thức Bánh sẵn có --
                        </option>
                        {recipesTemplates.map((r) => (
                          <option key={r.Id} value={r.Id}>
                            🥖 {r.Name} (Cơ sở: {r.BaseYield})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {formRecipes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormRecipes([])}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Xóa hết định mức
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleAddRecipeRow}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all transform active:scale-95"
                      >
                        <span>➕</span>
                        <span>Thêm nguyên liệu kho</span>
                      </button>
                    </div>
                  </div>

                  {/* Table of BOM items */}
                  {formRecipes.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50">
                      <span className="text-3xl block mb-2">🥣</span>
                      <h4 className="text-xs font-bold text-slate-700">Món này chưa có định mức nguyên liệu</h4>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                        Nếu món này không cấu hình định mức, khi bán hàng POS sẽ không trừ nguyên liệu kho (phù hợp với món mua sẵn bán thẳng hoặc không quản lý kho).
                      </p>
                      <button
                        type="button"
                        onClick={handleAddRecipeRow}
                        className="mt-3 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs shadow-2xs"
                      >
                        + Cấu hình định mức ngay
                      </button>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Nguyên liệu trong Kho</th>
                            <th className="p-3 w-32 text-right">
                              Định mức / 1 {formUnit}
                            </th>
                            <th className="p-3 w-20 text-center">ĐVT</th>
                            <th className="p-3 w-28 text-right">Đơn giá vốn</th>
                            <th className="p-3 w-28 text-right">Thành tiền</th>
                            <th className="p-3 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formRecipes.map((r, idx) => {
                            const lineCost = (Number(r.Amount) || 0) * (Number(r.CostPrice) || 0);

                            return (
                              <tr key={idx} className="hover:bg-slate-50/80">
                                <td className="p-2.5">
                                  <input
                                    list={`warehouse-prod-list-${idx}`}
                                    value={r.ProductName}
                                    onChange={(e) => handleRecipeProductChange(idx, e.target.value)}
                                    placeholder="Gõ tìm nguyên liệu kho..."
                                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-rose-500"
                                  />
                                  <datalist id={`warehouse-prod-list-${idx}`}>
                                    {warehouseProducts.map((p) => (
                                      <option key={p.Id} value={p.Name}>
                                        {p.Code} - {p.Unit} - Giá: {fmtPrice(p.CostPrice)}
                                      </option>
                                    ))}
                                  </datalist>
                                </td>

                                <td className="p-2.5 text-right">
                                  <DecimalInput
                                    value={r.Amount}
                                    onChange={(val) => handleUpdateRecipeRow(idx, 'Amount', val)}
                                    step={0.01}
                                    min={0.0001}
                                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-rose-600 text-right focus:outline-none focus:border-rose-500"
                                  />
                                </td>

                                <td className="p-2.5 text-center text-slate-600 font-medium">
                                  {r.Unit}
                                </td>

                                <td className="p-2.5 text-right font-mono text-slate-600">
                                  {fmtPrice(r.CostPrice || 0)}
                                </td>

                                <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                                  {fmtPrice(lineCost)}
                                </td>

                                <td className="p-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRecipeRow(idx)}
                                    className="w-6 h-6 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center text-xs"
                                    title="Xóa dòng nguyên liệu này"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Summary footer */}
                      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">
                          Số lượng nguyên liệu: <strong>{formRecipes.length} loại</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Ước tính giá vốn 1 {formUnit}:</span>
                          <strong className="text-sm font-mono font-extrabold text-rose-600">
                            {fmtPrice(bomEstimatedCost)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                {activeTab === 'info' ? (
                  <span>
                    Chuyển sang tab <strong>Định mức trừ kho (BOM)</strong> để cấu hình NVL tiêu hao
                  </span>
                ) : (
                  <span>
                    Tổng chi phí nguyên liệu: <strong className="text-rose-600">{fmtPrice(bomEstimatedCost)}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-xl text-xs transition-colors"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  onClick={handleSaveItem}
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>{editingItem ? 'Lưu thay đổi' : 'Thêm vào Menu'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
