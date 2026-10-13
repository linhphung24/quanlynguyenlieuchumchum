'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, InvoiceDetail, Product, Recipe, RecipeIngredient, Supplier } from '@/types';
import { toVietnameseWords } from '@/lib/amountInWords';
import { safeHeaderValue } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { DecimalInput } from '@/components/shared/DecimalInput';

interface InvoiceVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialType?: 'in' | 'out';
  editingInvoice?: Invoice | null;
  products: Product[];
  recipes: Recipe[];
  onProductsUpdated?: (products: Product[]) => void;
}

export default function InvoiceVoucherModal({
  isOpen,
  onClose,
  onSaved,
  initialType = 'in',
  editingInvoice = null,
  products,
  recipes,
  onProductsUpdated,
}: InvoiceVoucherModalProps) {
  const { user, currentModule } = useApp();
  const [type, setType] = useState<'in' | 'out'>(initialType);
  const [invDate, setInvDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [code, setCode] = useState<string>('');
  const [partner, setPartner] = useState<string>('');
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentDebt, setCurrentDebt] = useState<number | null>(null);
  const [note, setNote] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');

  const [details, setDetails] = useState<InvoiceDetail[]>([
    { ProductName: '', Unit: 'kg', Amount: 1, Price: 0 },
  ]);

  // Product catalog state (fresh copy to allow immediate reloading without whole-page refresh)
  const [productList, setProductList] = useState<Product[]>(products);
  const [reloadingUnits, setReloadingUnits] = useState(false);
  const [unitReloadNotice, setUnitReloadNotice] = useState<string | null>(null);

  // Sync with prop when prop changes
  useEffect(() => {
    if (products && products.length > 0) {
      setProductList(products);
    }
  }, [products]);

  // Recipe load for export
  const [selectedRecipeId, setSelectedRecipeId] = useState<number>(0);
  const [recipeYield, setRecipeYield] = useState<number>(1);

  const [saving, setSaving] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);

  // Load suppliers list
  useEffect(() => {
    fetch('/api/suppliers')
      .then((r) => r.json())
      .then((d) => {
        if (d.suppliers) setSuppliers(d.suppliers);
      })
      .catch((err) => console.error(err));
  }, []);

  // Track debt for selected partner
  useEffect(() => {
    if (type !== 'in' || !partner?.trim()) {
      setCurrentDebt(null);
      return;
    }
    const match = suppliers.find(
      (s) => s.Name.trim().toLowerCase() === partner.trim().toLowerCase()
    );
    if (match) {
      setSupplierId(match.Id);
      fetch(`/api/debts?supplierId=${match.Id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.detail) setCurrentDebt(d.detail.CuoiKy);
        })
        .catch(() => {});
    } else {
      setSupplierId(null);
      setCurrentDebt(null);
    }
  }, [partner, type, suppliers]);

  // Initialize modal state on open or invoice change
  useEffect(() => {
    if (!isOpen) return;

    // Load freshest product list on modal open
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => {
        if (d.products && d.products.length > 0) {
          setProductList(d.products);
          if (onProductsUpdated) onProductsUpdated(d.products);
        }
      })
      .catch((err) => console.error(err));

    if (editingInvoice) {
      setType(editingInvoice.Type);
      setInvDate(editingInvoice.InvDate);
      setCode(editingInvoice.Code);
      setPartner(editingInvoice.Partner || '');
      setSupplierId(editingInvoice.SupplierId || null);
      setNote(editingInvoice.Note || '');
      setImageUrl(editingInvoice.ImageUrl || '');

      // Load details concurrently with freshest products
      Promise.all([
        fetch('/api/products').then((r) => r.json()).catch(() => ({ products: [] })),
        fetch(`/api/invoices/${editingInvoice.Id}/details`).then((res) => res.json()).catch(() => ({ details: [] })),
      ]).then(([prodData, invData]) => {
        const fresh: Product[] = (prodData.products && prodData.products.length > 0) ? prodData.products : productList;
        if (prodData.products && prodData.products.length > 0) {
          setProductList(fresh);
          if (onProductsUpdated) onProductsUpdated(fresh);
        }
        if (invData.details && invData.details.length > 0) {
          const mapped = invData.details.map((d: InvoiceDetail) => {
            const prod = fresh.find(
              (p) =>
                (d.ProductId && p.Id === d.ProductId) ||
                p.Name.toLowerCase() === d.ProductName?.toLowerCase()
            );
            return {
              ...d,
              Unit: prod?.Unit || d.Unit || 'kg',
            };
          });
          setDetails(mapped);
        }
      });
    } else {
      setType(initialType);
      const today = new Date().toISOString().split('T')[0];
      setInvDate(today);
      const prefix = initialType === 'in' ? 'NK-' : 'XK-';
      const rand = Math.floor(1000 + Math.random() * 9000);
      setCode(`${prefix}${today.replace(/-/g, '').slice(2)}-${rand}`);
      setPartner('');
      setSupplierId(null);
      setCurrentDebt(null);
      setNote('');
      setImageUrl('');
      setDetails([{ ProductName: '', Unit: 'kg', Amount: 1, Price: 0 }]);
    }
    setViolations([]);
  }, [isOpen, editingInvoice?.Id]);

  const totalAmount = useMemo(() => {
    return details.reduce((sum, d) => sum + (Number(d.Amount || 0) * Number(d.Price || 0)), 0);
  }, [details]);

  const [fetchingFifo, setFetchingFifo] = useState(false);

  const fetchFifoPrice = async (pName: string, qty: number, fallback: number = 0) => {
    if (!pName || !pName.trim()) return null;
    try {
      const res = await fetch(
        `/api/batches/fifo-price?productName=${encodeURIComponent(pName.trim())}&qty=${qty || 0}&fallbackPrice=${fallback || 0}`
      );
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.error('Error fetching FIFO price:', e);
    }
    return null;
  };

  /**
   * Tải lại đơn vị tính mặc định từ Danh mục Sản phẩm cho tất cả các dòng hiện tại
   * mà không cần xóa đi nhập lại.
   */
  const handleReloadUnits = async () => {
    setReloadingUnits(true);
    setUnitReloadNotice(null);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Không thể tải danh mục sản phẩm từ máy chủ');
      const data = await res.json();
      const freshProducts: Product[] = data.products || [];
      setProductList(freshProducts);
      if (onProductsUpdated) {
        onProductsUpdated(freshProducts);
      }

      let updatedCount = 0;
      setDetails((prevDetails) => {
        return prevDetails.map((row) => {
          if (!row.ProductName?.trim()) return row;
          const trimmed = row.ProductName.trim().toLowerCase();
          const prod = freshProducts.find(
            (p) =>
              (row.ProductId && p.Id === row.ProductId) ||
              p.Name.trim().toLowerCase() === trimmed
          );
          if (prod) {
            const hasChanged = row.Unit !== prod.Unit || row.ProductId !== prod.Id;
            if (hasChanged) {
              updatedCount++;
            }
            return {
              ...row,
              ProductId: prod.Id,
              ProductCode: prod.Code || '',
              Unit: prod.Unit || 'kg',
            };
          }
          return row;
        });
      });

      const msg = updatedCount > 0
        ? `Đã cập nhật ĐVT cho ${updatedCount} dòng theo danh mục sản phẩm mới nhất!`
        : `Đã làm mới danh mục (${freshProducts.length} sản phẩm). ĐVT các dòng hiện tại đã khớp chuẩn!`;
      setUnitReloadNotice(msg);
      setTimeout(() => {
        setUnitReloadNotice(null);
      }, 4500);
    } catch (err: any) {
      console.error('Lỗi nạp lại ĐVT:', err);
      alert('Lỗi khi nạp lại đơn vị tính: ' + (err.message || 'Không thể kết nối'));
    } finally {
      setReloadingUnits(false);
    }
  };

  /**
   * Tải lại ĐVT riêng cho 1 dòng cụ thể
   */
  const handleReloadRowUnit = async (index: number) => {
    const row = details[index];
    if (!row || !row.ProductName?.trim()) return;

    try {
      let freshProducts = productList;
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          freshProducts = data.products;
          setProductList(freshProducts);
          if (onProductsUpdated) onProductsUpdated(freshProducts);
        }
      }

      const trimmed = row.ProductName.trim().toLowerCase();
      const prod = freshProducts.find(
        (p) =>
          (row.ProductId && p.Id === row.ProductId) ||
          p.Name.trim().toLowerCase() === trimmed
      );

      if (prod) {
        const oldUnit = row.Unit;
        const next = [...details];
        next[index] = {
          ...next[index],
          ProductId: prod.Id,
          ProductCode: prod.Code || '',
          Unit: prod.Unit || 'kg',
        };
        setDetails(next);
        const msg = oldUnit !== prod.Unit
          ? `Đã đổi ĐVT dòng #${index + 1} (${prod.Name}): ${oldUnit} ➜ ${prod.Unit}`
          : `ĐVT dòng #${index + 1} (${prod.Name}) đã là "${prod.Unit}" chuẩn`;
        setUnitReloadNotice(msg);
        setTimeout(() => setUnitReloadNotice(null), 3500);
      } else {
        alert(`Không tìm thấy sản phẩm "${row.ProductName}" trong danh mục sản phẩm.`);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleProductChange = (index: number, productName: string) => {
    const trimmed = productName.trim().toLowerCase();
    const prod = productList.find((p) => p.Name.toLowerCase() === trimmed);
    const next = [...details];

    next[index] = {
      ...next[index],
      ProductName: productName,
      ProductId: prod ? prod.Id : next[index].ProductId,
      ProductCode: prod ? prod.Code : next[index].ProductCode,
      Unit: prod?.Unit || (productName ? next[index].Unit : 'kg'),
      Price: prod ? (prod.CostPrice || 0) : next[index].Price,
      BatchInfo: prod ? next[index].BatchInfo : '',
    };
    // Cập nhật state đồng bộ ngay lập tức để bộ gõ tiếng Việt (Telex/VNI) không bị nuốt ký tự đầu hay nhảy chữ
    setDetails(next);

    // Nếu khớp tên sản phẩm và là hóa đơn xuất, lấy giá FIFO ngầm mà không chặn việc gõ phím
    if (type === 'out' && prod) {
      const amount = next[index].Amount || 1;
      fetchFifoPrice(prod.Name, amount, prod.CostPrice || 0).then((fifo) => {
        if (fifo && fifo.hasBatch) {
          setDetails((prev) => {
            const updated = [...prev];
            if (updated[index] && (updated[index].ProductId === prod.Id || updated[index].ProductName.toLowerCase() === trimmed)) {
              updated[index] = {
                ...updated[index],
                Price: fifo.price,
                BatchInfo: `Lô ${fifo.batchCode || ''} (tồn ${fifo.remainingQty || 0} ${fifo.unit || 'kg'}) • Giá: ${Number(fifo.price || 0).toLocaleString('vi-VN')} ₫`,
              };
            }
            return updated;
          });
        }
      });
    }
  };

  const handleProductBlur = (index: number) => {
    const row = details[index];
    if (!row || !row.ProductName?.trim() || type !== 'out') return;
    const trimmed = row.ProductName.trim().toLowerCase();
    const prod = productList.find((p) => p.Name.toLowerCase() === trimmed);
    if (prod) {
      fetchFifoPrice(prod.Name, row.Amount || 1, prod.CostPrice || 0).then((fifo) => {
        if (fifo && fifo.hasBatch) {
          setDetails((prev) => {
            const updated = [...prev];
            if (updated[index] && (updated[index].ProductId === prod.Id || updated[index].ProductName.toLowerCase() === trimmed)) {
              updated[index] = {
                ...updated[index],
                Price: fifo.price,
                BatchInfo: `Lô ${fifo.batchCode || ''} (tồn ${fifo.remainingQty || 0} ${fifo.unit || 'kg'}) • Giá: ${Number(fifo.price || 0).toLocaleString('vi-VN')} ₫`,
              };
            }
            return updated;
          });
        }
      });
    }
  };

  const handleRefreshFifoPrices = async () => {
    if (type !== 'out') return;
    setFetchingFifo(true);
    try {
      const updated = await Promise.all(
        details.map(async (d) => {
          if (!d.ProductName.trim()) return d;
          const prod = productList.find((p) => p.Name.toLowerCase() === d.ProductName.toLowerCase());
          const fifo = await fetchFifoPrice(d.ProductName, d.Amount || 1, prod?.CostPrice || 0);
          if (fifo && fifo.hasBatch) {
            return {
              ...d,
              Price: fifo.price,
              BatchInfo: `Lô ${fifo.batchCode || ''} (tồn ${fifo.remainingQty || 0} ${fifo.unit || 'kg'}) • Giá: ${Number(fifo.price || 0).toLocaleString('vi-VN')} ₫`,
            };
          }
          return {
            ...d,
            Price: d.Price > 0 ? d.Price : (prod?.CostPrice || 0),
          };
        })
      );
      setDetails(updated);
    } finally {
      setFetchingFifo(false);
    }
  };

  const handleDetailChange = (index: number, field: keyof InvoiceDetail, val: any) => {
    if (field === 'Unit') return; // Cố định đơn vị tính theo danh mục sản phẩm
    const next = [...details];
    next[index] = { ...next[index], [field]: val };
    setDetails(next);
  };

  const addRow = () => {
    setDetails([...details, { ProductName: '', Unit: 'kg', Amount: 1, Price: 0 }]);
  };

  const removeRow = (index: number) => {
    if (details.length <= 1) return;
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleApplyRecipe = async () => {
    if (!selectedRecipeId || selectedRecipeId === 0) return;
    try {
      const res = await fetch(`/api/recipes/${selectedRecipeId}/ingredients`);
      const data = await res.json();
      if (data.ingredients && data.ingredients.length > 0) {
        const recipeObj = recipes.find((r) => r.Id === selectedRecipeId);
        const baseYield = recipeObj?.BaseYield || 1;
        const multiplier = recipeYield / baseYield;

        const newLines: InvoiceDetail[] = await Promise.all(
          data.ingredients.map(async (ing: RecipeIngredient) => {
            const prod = productList.find((p) => p.Name.toLowerCase() === ing.ProductName.toLowerCase());
            const amount = Number((ing.Amount * multiplier).toFixed(4));
            let price = prod?.CostPrice || ing.Price || 0;
            let batchInfo = '';

            if (type === 'out') {
              const fifo = await fetchFifoPrice(ing.ProductName, amount, price);
              if (fifo && fifo.hasBatch) {
                price = fifo.price;
                batchInfo = `Lô ${fifo.batchCode || ''} (tồn ${fifo.remainingQty || 0} ${fifo.unit || 'kg'}) • Giá: ${Number(fifo.price || 0).toLocaleString('vi-VN')} ₫`;
              }
            }

            return {
              ProductId: prod?.Id || null,
              ProductCode: prod?.Code || '',
              ProductName: ing.ProductName,
              Unit: prod?.Unit || ing.Unit || 'kg',
              Amount: amount,
              Price: price,
              BatchInfo: batchInfo,
            };
          })
        );

        setDetails(newLines);
        setNote(`Xuất nguyên liệu làm bánh theo công thức: ${recipeObj?.Name || ''} (${recipeYield} mẻ)`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleValidateFifo = async () => {
    try {
      const res = await fetch('/api/invoices/validate-fifo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          excludeInvoiceId: editingInvoice?.Id || 0,
          invDate,
          type,
          details: details
            .filter((d) => d.ProductName && d.Amount > 0)
            .map((d) => {
              const prod = productList.find(
                (p) =>
                  (d.ProductId && p.Id === d.ProductId) ||
                  p.Name.toLowerCase() === d.ProductName.trim().toLowerCase()
              );
              return {
                ...d,
                Unit: prod?.Unit || d.Unit || 'kg',
              };
            }),
        }),
      });
      const data = await res.json();
      if (data.violations && data.violations.length > 0) {
        setViolations(data.violations);
        return false;
      } else {
        setViolations([]);
        return true;
      }
    } catch (err) {
      return true;
    }
  };

  const handleSave = async () => {
    const validDetails = details
      .filter((d) => d.ProductName.trim() && Number(d.Amount) > 0)
      .map((d) => {
        const prod = productList.find(
          (p) =>
            (d.ProductId && p.Id === d.ProductId) ||
            p.Name.toLowerCase() === d.ProductName.trim().toLowerCase()
        );
        return {
          ...d,
          ProductId: prod?.Id || d.ProductId || null,
          ProductCode: prod?.Code || d.ProductCode || '',
          Unit: prod?.Unit || d.Unit || 'kg',
        };
      });

    if (validDetails.length === 0) {
      alert('Vui lòng thêm ít nhất 1 dòng hàng hóa hợp lệ (tên và số lượng > 0).');
      return;
    }

    if (type === 'out') {
      const isValid = await handleValidateFifo();
      if (!isValid) {
        const ok = confirm(
          'Phát hiện cảnh báo âm kho nếu xuất số lượng này. Bạn có chắc chắn muốn lưu (chứng từ sẽ chờ phê duyệt)?'
        );
        if (!ok) return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        invoice: {
          Type: type,
          InvDate: invDate,
          Code: code,
          Partner: partner,
          SupplierId: supplierId,
          Note: note,
          ImageUrl: imageUrl,
        },
        details: validDetails,
        sourceModule: currentModule,
        currentUser: user?.FullName || user?.Username || 'system',
      };

      const userName = user?.FullName || user?.Username || 'system';
      const userRole = user?.Role || 'staff';

      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user': safeHeaderValue(userName, 'system'),
        'x-user-role': safeHeaderValue(userRole, 'staff'),
        'x-can-approve': String(
          currentModule !== 'warehouse' &&
            ['admin', 'manager', 'ketoan', 'accountant'].includes(userRole.toLowerCase())
        ),
      };

      let res;
      if (editingInvoice) {
        res = await fetch(`/api/invoices/${editingInvoice.Id}`, {
          method: 'PUT',
          headers: requestHeaders,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/invoices', {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Lỗi khi lưu chứng từ kho');
        return;
      }

      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{type === 'in' ? '📥' : '📤'}</span>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {editingInvoice ? 'Sửa Chứng từ Kho' : 'Lập Chứng từ Kho Mới'}
              </h2>
              <p className="text-xs text-slate-500">
                {type === 'in' ? 'Phiếu Nhập Kho (Mẫu 01-VT)' : 'Phiếu Xuất Kho (Mẫu 02-VT)'} • TT 99/2025/TT-BTC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Accounting approval notice */}
        <div className="px-6 py-2 bg-amber-50/80 border-b border-amber-200/60 text-amber-800 text-[11px] flex items-center gap-2">
          <span>ℹ️</span>
          <span>
            Quy trình kho: Tất cả phiếu nhập/xuất kho lập từ bộ phận Kho đều ở trạng thái <strong>Chờ kế toán duyệt</strong> trước khi chính thức ghi nhận vào sổ kho và phân bổ lô FIFO.
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Violations Warning Alert */}
          {violations.length > 0 && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-red-800">
                <span>⚠️</span>
                <span>Cảnh báo vi phạm dòng thời gian FIFO:</span>
              </div>
              {violations.map((v, i) => (
                <p key={i} className="pl-5 list-disc">
                  • {v}
                </p>
              ))}
            </div>
          )}

          {/* Master Form Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Loại chứng từ
              </label>
              <select
                disabled={Boolean(editingInvoice)}
                value={type}
                onChange={(e) => setType(e.target.value as 'in' | 'out')}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              >
                <option value="in">📥 Nhập kho</option>
                <option value="out">📤 Xuất kho</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Số chứng từ
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Ngày hạch toán
              </label>
              <input
                type="date"
                value={invDate}
                onChange={(e) => setInvDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                {type === 'in' ? 'Nhà cung cấp / Đối tác' : 'Người nhận / Bộ phận'}
              </label>
              <input
                list="invoice-suppliers-datalist"
                type="text"
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                placeholder={type === 'in' ? 'Chọn hoặc nhập tên NCC' : 'Bếp bánh / Phân xưởng'}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              />
              <datalist id="invoice-suppliers-datalist">
                {suppliers.map((s) => (
                  <option key={s.Id} value={s.Name}>
                    {s.Phone ? `SĐT: ${s.Phone}` : ''}
                  </option>
                ))}
              </datalist>

              {type === 'in' && currentDebt !== null && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                  <span className="text-slate-500">Công nợ hiện tại:</span>
                  <span
                    className={`font-mono font-bold ${
                      currentDebt > 0
                        ? 'text-rose-600'
                        : currentDebt < 0
                        ? 'text-blue-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {currentDebt.toLocaleString('vi-VN')} ₫
                  </span>
                  {currentDebt > 0 && (
                    <span className="text-[10px] text-rose-500 font-semibold">(Chưa thanh toán)</span>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Diễn giải / Lý do
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú hoặc lý do nhập/xuất"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                URL Ảnh đính kèm
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>
          </div>

          {/* Quick BOM loading for Export */}
          {type === 'out' && (
            <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl flex items-center gap-3 text-xs text-slate-800">
              <span className="font-semibold text-amber-800">🥖 Xuất theo công thức bánh (BOM):</span>
              <select
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(Number(e.target.value))}
                className="bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              >
                <option value={0}>-- Chọn công thức bánh --</option>
                {recipes.map((r) => (
                  <option key={r.Id} value={r.Id}>
                    {r.Name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">Số mẻ:</span>
                <DecimalInput
                  min={0.1}
                  step={0.5}
                  value={recipeYield}
                  onChange={(val) => setRecipeYield(val || 1)}
                  className="w-16 bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-center text-xs text-slate-800 shadow-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyRecipe}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors shadow-xs"
              >
                ⚡ Áp dụng định mức
              </button>
            </div>
          )}

          {/* Detail Grid */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chi tiết Hàng hóa & Nguyên vật liệu
                </h3>
                {unitReloadNotice && (
                  <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 shadow-xs animate-fade-in">
                    <span>✅</span>
                    <span>{unitReloadNotice}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={reloadingUnits}
                  onClick={handleReloadUnits}
                  className="px-3 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                  title="Tải lại đơn vị tính mặc định mới nhất từ danh mục sản phẩm cho tất cả các dòng mà không cần xóa đi"
                >
                  <span className={reloadingUnits ? 'inline-block animate-spin' : ''}>🔄</span>
                  <span>{reloadingUnits ? 'Đang nạp ĐVT...' : 'Reload ĐVT từ danh mục'}</span>
                </button>
                {type === 'out' && (
                  <button
                    type="button"
                    disabled={fetchingFifo}
                    onClick={handleRefreshFifoPrices}
                    className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                    title="Truy vấn đơn giá của các lô cũ nhất còn tồn theo nguyên tắc FIFO cho tất cả các dòng"
                  >
                    <span>⚡</span>
                    <span>{fetchingFifo ? 'Đang lấy giá...' : 'Lấy giá xuất theo lô FIFO'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={addRow}
                  className="px-3 py-1 bg-white hover:bg-slate-50 text-amber-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                >
                  <span>➕</span>
                  <span>Thêm dòng</span>
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className="p-2.5">Tên sản phẩm / Nguyên liệu</th>
                    <th className="p-2.5 w-32 text-center" title="Đơn vị tính mặc định theo danh mục sản phẩm (nhấn 🔄 để tải lại)">
                      <div className="flex items-center justify-center gap-1">
                        <span>ĐVT mặc định</span>
                        <button
                          type="button"
                          disabled={reloadingUnits}
                          onClick={handleReloadUnits}
                          title="Tải lại ĐVT từ danh mục sản phẩm cho các dòng"
                          className="text-slate-400 hover:text-amber-600 active:scale-95 transition-all text-xs p-0.5 rounded hover:bg-slate-200"
                        >
                          <span className={reloadingUnits ? 'inline-block animate-spin' : ''}>🔄</span>
                        </button>
                      </div>
                    </th>
                    <th className="p-2.5 w-28 text-right">Số lượng</th>
                    <th className="p-2.5 w-32 text-right">Đơn giá (₫)</th>
                    <th className="p-2.5 w-36 text-right">Thành tiền (₫)</th>
                    {type === 'in' && <th className="p-2.5 w-32">Hạn sử dụng</th>}
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {details.map((d, index) => {
                    const subtotal = Number(d.Amount || 0) * Number(d.Price || 0);
                    return (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="p-2 text-center text-slate-400">{index + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            list="productList"
                            autoComplete="off"
                            value={d.ProductName}
                            onChange={(e) => handleProductChange(index, e.target.value)}
                            onBlur={() => handleProductBlur(index)}
                            placeholder="Gõ hoặc chọn tên sản phẩm"
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
                          />
                          {type === 'out' && d.BatchInfo && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-900 bg-amber-50/90 px-2 py-0.5 rounded border border-amber-200 w-fit">
                              <span>🏷️</span>
                              <span className="font-mono font-medium">{d.BatchInfo}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              readOnly
                              tabIndex={-1}
                              value={d.Unit || '—'}
                              title={`Đơn vị tính mặc định: ${d.Unit || '—'} (Cố định theo danh mục sản phẩm)`}
                              className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 pr-7 text-xs text-center text-slate-700 font-semibold cursor-not-allowed select-none focus:outline-none shadow-xs"
                            />
                            <button
                              type="button"
                              disabled={reloadingUnits || !d.ProductName}
                              onClick={() => handleReloadRowUnit(index)}
                              className="absolute right-1 text-slate-400 hover:text-amber-600 hover:scale-110 active:scale-95 transition-all p-1 text-[11px] rounded disabled:opacity-25 disabled:hover:scale-100"
                              title="Tải lại ĐVT dòng này từ danh mục sản phẩm"
                            >
                              🔄
                            </button>
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          <DecimalInput
                            min={0}
                            value={d.Amount}
                            onChange={(val) =>
                              handleDetailChange(index, 'Amount', val)
                            }
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-right text-slate-800 font-medium shadow-xs"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <DecimalInput
                            min={0}
                            value={d.Price}
                            onChange={(val) =>
                              handleDetailChange(index, 'Price', val)
                            }
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-right text-slate-800 shadow-xs"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-2 text-right font-mono font-semibold text-slate-900">
                          {subtotal.toLocaleString('vi-VN')}
                        </td>
                        {type === 'in' && (
                          <td className="p-2">
                            <input
                              type="date"
                              value={d.ExpDate || ''}
                              onChange={(e) =>
                                handleDetailChange(index, 'ExpDate', e.target.value || null)
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 shadow-xs"
                            />
                          </td>
                        )}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <datalist id="productList">
                {productList.map((p) => (
                  <option key={p.Id} value={p.Name}>
                    {p.Code ? `[${p.Code}] ` : ''}{p.Name} (ĐVT: {p.Unit || 'kg'} | Tồn: {p.StockQty} {p.Unit || 'kg'})
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          {/* Summary Row */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-xs text-slate-500">Bằng chữ: </span>
              <span className="text-xs font-semibold text-slate-700 italic">
                {toVietnameseWords(totalAmount)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 uppercase font-semibold">Tổng cộng:</span>
              <span className="text-xl font-bold font-mono text-amber-600">
                {totalAmount.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>Lưu chứng từ</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
