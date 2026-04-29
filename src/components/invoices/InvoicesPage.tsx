'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Invoice, InvoiceItem, Batch, BatchDeduction } from '@/types'
import { todayStr, fmtDate, fmtNum, fmtPrice, genCode } from '@/lib/utils'
import { UNITS } from '@/lib/constants'
import ProductPicker from '@/components/shared/ProductPicker'
import DateInput from '@/components/shared/DateInput'
import TextPicker from '@/components/shared/TextPicker'
import ImageUpload from '@/components/shared/ImageUpload'
import BatchesTab from './BatchesTab'

// ─── helpers ────────────────────────────────────────────────
function calcTotal(items: { amount: number; price?: number }[]) {
  return items.reduce((sum, it) => sum + (it.amount || 0) * (it.price || 0), 0)
}

type CastItem = { name: string; amount: number; unit: string; price?: number; mfg_date?: string; exp_date?: string }

interface BatchAlloc {
  batch_id: number
  inv_code: string
  inv_date: string
  qty: number
  price: number
  unit: string
  insufficient?: boolean   // không còn lô nào trong kho
  exceedsBatch?: boolean   // số lượng vượt quá lô hiện tại, phải tách HĐ
  maxQty?: number          // tối đa được xuất từ lô này
}

interface FormItem {
  name: string
  amount: number
  unit: string
  price: number
  mfg_date: string
  exp_date: string
  recipeId: number
  qty: number
}

// ─── in-browser print ────────────────────────────────────────
function doPrint(inv: Invoice, recipes: { id: number; name: string }[]) {
  const isIn = inv.type === 'in'
  const castItems = inv.items as CastItem[]
  const total = calcTotal(castItems)
  const rows = castItems
    .map((it, i) => {
      const subtotal = (it.amount || 0) * (it.price || 0)
      return `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${i + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${it.name}</td>
        <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #eee">${fmtNum(it.amount)} ${it.unit}</td>
        <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #eee">${it.price ? fmtPrice(it.price) : '—'}</td>
        <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #eee">${subtotal ? fmtPrice(subtotal) : '—'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${it.mfg_date ? fmtDate(it.mfg_date) : '—'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${it.exp_date ? fmtDate(it.exp_date) : '—'}</td>
      </tr>`
    })
    .join('')

  const w = window.open('', '_blank')!
  w.document.write(`<html>
<head><title>Hoá đơn ${inv.code}</title>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#222}h2{color:#c8773a}table{width:100%;border-collapse:collapse}th{background:#f5e6cc;text-align:left;padding:6px 8px}td{padding:6px 8px;border-bottom:1px solid #eee}.meta{display:flex;gap:24px;margin-bottom:16px;font-size:13px}.total{text-align:right;font-weight:bold;margin-top:8px;font-size:14px}</style>
</head><body>
<h2>${isIn ? 'HOÁ ĐƠN NHẬP HÀNG' : 'HOÁ ĐƠN XUẤT/BÁN HÀNG'}</h2>
<div class="meta">
  <div><b>Mã:</b> ${inv.code}</div>
  <div><b>Ngày:</b> ${fmtDate(inv.inv_date)}</div>
  ${inv.partner ? `<div><b>${isIn ? 'NCC' : 'KH'}:</b> ${inv.partner}</div>` : ''}
</div>
${inv.note ? `<div style="font-size:12px;color:#888;margin-bottom:12px">Ghi chú: ${inv.note}</div>` : ''}
<table>
  <thead><tr><th>#</th><th>${isIn ? 'Nguyên liệu' : 'Sản phẩm'}</th><th style="text-align:right">Số lượng</th><th style="text-align:right">${isIn ? 'Giá nhập' : 'Giá bán'}</th><th style="text-align:right">Thành tiền</th><th>NSX</th><th>HSD</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
${total ? `<div class="total">Tổng cộng: ${fmtPrice(total)}</div>` : ''}
<div style="margin-top:20px;font-size:12px;color:#aaa">In lúc: ${new Date().toLocaleString('vi-VN')}</div>
</body></html>`)
  w.document.close()
  w.print()
}

// ─── main component ──────────────────────────────────────────
export default function InvoicesPage() {
  const { sb, user, recipes, allProducts, setAllProducts, toast, startLoading, stopLoading, writeAudit } = useApp()

  // form state
  const [invType, setInvType] = useState<'in' | 'out'>('in')
  const [invDate, setInvDate] = useState(todayStr())
  const [code, setCode] = useState(genCode())
  const [partner, setPartner] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<FormItem[]>([{ name: '', amount: 0, unit: UNITS[0], price: 0, mfg_date: '', exp_date: '', recipeId: 0, qty: 0 }])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [openInvs, setOpenInvs] = useState<Set<number>>(new Set())
  const [imageUrl, setImageUrl] = useState('')

  // batch state
  const [tab, setTab] = useState<'invoices' | 'batches'>('invoices')
  const [batchPreviews, setBatchPreviews] = useState<Record<number, BatchAlloc[]>>({})
  const [invBatchUsage, setInvBatchUsage] = useState<Record<number, BatchDeduction[]>>({})
  const [uploadingImgFor, setUploadingImgFor] = useState<number | null>(null)

  useEffect(() => { loadInvoices() }, [])

  const loadInvoices = async () => {
    const { data } = await sb.from('invoices').select('*').order('inv_date', { ascending: false }).order('id', { ascending: false })
    if (data) setInvoices(data as Invoice[])
  }

  // ─── FIFO batch preview (chỉ cho xuất) ───────────────────
  useEffect(() => {
    if (invType !== 'out') { setBatchPreviews({}); return }
    const timer = setTimeout(() => { computeBatchPreviews() }, 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invType, items])

  const computeBatchPreviews = useCallback(async () => {
    const relevant = items.filter(it => it.name.trim() && (it.amount || it.qty) > 0)
    if (relevant.length === 0) { setBatchPreviews({}); return }

    const names = [...new Set(relevant.map(it => it.name.trim()))]
    // Match case-insensitively bằng cách query song song với ilike (1 query / name)
    const queries = names.map(n =>
      sb.from('batches')
        .select('id, product_name, inv_code, inv_date, remaining_qty, price, unit')
        .ilike('product_name', n)
        .gt('remaining_qty', 0)
        .order('inv_date', { ascending: true })
        .order('id', { ascending: true })
    )
    const results = await Promise.all(queries)
    const data = results.flatMap(r => r.data || [])

    // group by product_name (key = lowercase) — bỏ qua batch gần 0 (floating-point dư)
    const byProduct: Record<string, typeof data> = {}
    for (const b of data) {
      if (parseFloat(b.remaining_qty.toFixed(2)) <= 0) continue
      const key = b.product_name.toLowerCase().trim()
      if (!byProduct[key]) byProduct[key] = []
      byProduct[key]!.push(b)
    }

    const previews: Record<number, BatchAlloc[]> = {}
    items.forEach((item, idx) => {
      if (!item.name.trim() || !(item.amount || item.qty)) return
      const qty = item.amount || item.qty
      const batchList = (byProduct[item.name.trim().toLowerCase()] || [])

      if (batchList.length === 0) {
        // Không có lô nào trong kho
        previews[idx] = [{ batch_id: -1, inv_code: '', inv_date: '', qty, price: 0, unit: item.unit, insufficient: true }]
        return
      }

      const oldest = batchList[0]!
      if (qty <= oldest.remaining_qty) {
        // Đủ hàng trong lô cũ nhất — OK
        previews[idx] = [{ batch_id: oldest.id, inv_code: oldest.inv_code, inv_date: oldest.inv_date, qty, price: oldest.price, unit: oldest.unit }]
      } else {
        // Vượt quá lô hiện tại — phải tách hoá đơn
        previews[idx] = [{
          batch_id: oldest.id,
          inv_code: oldest.inv_code,
          inv_date: oldest.inv_date,
          qty,
          price: oldest.price,
          unit: oldest.unit,
          exceedsBatch: true,
          maxQty: oldest.remaining_qty,
        }]
      }
    })
    setBatchPreviews(previews)
  }, [sb, items])

  // ─── load batch usage for a specific export invoice ───────
  const loadBatchUsageForInv = useCallback(async (invId: number) => {
    if (invBatchUsage[invId] !== undefined) return
    const { data } = await sb
      .from('batch_deductions')
      .select('*')
      .eq('inv_id', invId)
      .order('batch_inv_date', { ascending: true })
    setInvBatchUsage(prev => ({ ...prev, [invId]: (data || []) as BatchDeduction[] }))
  }, [sb, invBatchUsage])

  // ─── create batch records when saving nhập invoice ────────
  const createBatchesForImport = async (
    invId: number, invCode: string, invDateStr: string,
    invItems: { name: string; amount: number; unit: string; price?: number; mfg_date?: string; exp_date?: string }[]
  ): Promise<string | null> => {
    const records = invItems
      .filter(it => it.name && it.amount > 0)
      .map(it => {
        // Chuẩn hoá tên về tên gốc trong products table (tránh "Cam" vs "cam")
        const canonical = allProducts.find(
          p => p.name.trim().toLowerCase() === it.name.trim().toLowerCase()
        )
        return {
          product_name: (canonical?.name || it.name).trim(),
          inv_id: invId,
          inv_code: invCode,
          inv_date: invDateStr,
          quantity: it.amount,
          remaining_qty: it.amount,
          price: it.price || 0,
          unit: it.unit,
          mfg_date: it.mfg_date || null,
          exp_date: it.exp_date || null,
        }
      })
    if (records.length === 0) return null
    const { error } = await sb.from('batches').insert(records)
    return error ? error.message : null
  }

  // ─── FIFO deduction when saving xuất invoice ─────────────
  const deductBatchesFifo = async (invItems: { name: string; amount: number; unit: string }[], exportInvId: number) => {
    const names = [...new Set(invItems.filter(it => it.name && it.amount > 0).map(it => it.name.trim()))]
    if (names.length === 0) return

    // Case-insensitive: 1 ilike query per name, chạy song song
    const queries = names.map(n =>
      sb.from('batches')
        .select('*')
        .ilike('product_name', n)
        .gt('remaining_qty', 0)
        .order('inv_date', { ascending: true })
        .order('id', { ascending: true })
    )
    const results = await Promise.all(queries)
    const allBatches = results.flatMap(r => r.data || []) as Batch[]

    const byProduct: Record<string, Batch[]> = {}
    for (const b of allBatches) {
      const key = b.product_name.toLowerCase().trim()
      if (!byProduct[key]) byProduct[key] = []
      byProduct[key]!.push(b)
    }

    const deductionRows: Omit<BatchDeduction, 'id' | 'created_at'>[] = []
    const batchUpdates: Promise<unknown>[] = []

    for (const item of invItems) {
      if (!item.name || !item.amount) continue
      const batchList = byProduct[item.name.trim().toLowerCase()] || []
      let rem = item.amount

      for (const batch of batchList) {
        if (rem <= 0) break
        const take = Math.min(rem, batch.remaining_qty)
        const newRemaining = Math.max(0, +(batch.remaining_qty - take).toFixed(2))
        batchUpdates.push(sb.from('batches').update({ remaining_qty: newRemaining }).eq('id', batch.id))
        deductionRows.push({
          batch_id: batch.id,
          inv_id: exportInvId,
          qty_used: take,
          batch_inv_code: batch.inv_code,
          batch_inv_date: batch.inv_date,
          batch_price: batch.price,
          batch_unit: batch.unit,
        })
        batch.remaining_qty = newRemaining
        rem -= take
      }
    }

    // Chạy tất cả batch updates + insert deductions song song
    await Promise.all([
      ...batchUpdates,
      deductionRows.length > 0 ? sb.from('batch_deductions').insert(deductionRows) : Promise.resolve(),
    ])
  }

  // ─── restore batches when deleting xuất invoice ──────────
  const restoreBatchDeductions = async (invId: number) => {
    const { data: deductions } = await sb
      .from('batch_deductions')
      .select('batch_id, qty_used')
      .eq('inv_id', invId)

    if (!deductions || deductions.length === 0) return

    for (const d of deductions as { batch_id: number; qty_used: number }[]) {
      const { data: batch } = await sb
        .from('batches')
        .select('quantity, remaining_qty')
        .eq('id', d.batch_id)
        .single()
      if (batch) {
        const restored = Math.min(batch.quantity, +(batch.remaining_qty + d.qty_used).toFixed(2))
        await sb.from('batches').update({ remaining_qty: restored }).eq('id', d.batch_id)
      }
    }

    await sb.from('batch_deductions').delete().eq('inv_id', invId)
  }

  // ─── delete batch records when deleting nhập invoice ─────
  const deleteBatchRecords = async (invId: number) => {
    await sb.from('batches').delete().eq('inv_id', invId)
  }

  // ─── stock update ─────────────────────────────────────────
  const updateStock = async (invItems: { name: string; amount: number }[], type: 'in' | 'out', multiplier: 1 | -1) => {
    const sign = (type === 'in' ? 1 : -1) * multiplier
    const deltas = new Map<number, number>()
    for (const item of invItems) {
      if (!item.name || !item.amount) continue
      const product = allProducts.find(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase())
      if (!product) continue
      deltas.set(product.id, (deltas.get(product.id) ?? 0) + item.amount * sign)
    }
    if (deltas.size === 0) return
    await Promise.all(Array.from(deltas.entries()).map(([id, delta]) => {
      const product = allProducts.find(p => p.id === id)!
      return sb.from('products').update({ stock_qty: (product.stock_qty || 0) + delta }).eq('id', id)
    }))
    // Cập nhật local state thay vì re-fetch toàn bộ sản phẩm
    setAllProducts(prev => prev.map(p => {
      const delta = deltas.get(p.id)
      return delta !== undefined ? { ...p, stock_qty: (p.stock_qty || 0) + delta } : p
    }))
  }

  // ─── item form helpers ────────────────────────────────────
  const addItem = () => setItems([...items, { name: '', amount: 0, unit: UNITS[0], price: 0, mfg_date: '', exp_date: '', recipeId: 0, qty: 0 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: string, val: unknown) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it))
  }

  // ─── auto-fill khi chọn sản phẩm ─────────────────────────
  // Nhập: điền giá vốn + đvt từ danh mục sản phẩm
  // Xuất: điền giá nhập lô + đvt + NSX/HSD từ lô FIFO cũ nhất
  const handleProductSelect = async (idx: number, name: string, unit: string) => {
    updateItem(idx, 'name', name)
    if (unit) updateItem(idx, 'unit', unit)
    if (!name.trim()) return

    if (invType === 'in') {
      // Nhập: lấy giá vốn từ danh mục sản phẩm
      const product = allProducts.find(
        p => p.name.trim().toLowerCase() === name.trim().toLowerCase()
      )
      if (product) {
        if (product.cost_price > 0) updateItem(idx, 'price', product.cost_price)
        if (!unit && product.unit) updateItem(idx, 'unit', product.unit)
      }
    } else {
      // Xuất: fill giá bán từ danh mục + ĐVT/NSX/HSD từ lô FIFO cũ nhất
      const product = allProducts.find(
        p => p.name.trim().toLowerCase() === name.trim().toLowerCase()
      )
      if (product) {
        if (product.sell_price > 0) updateItem(idx, 'price', product.sell_price)
        if (!unit && product.unit) updateItem(idx, 'unit', product.unit)
      }
      const { data } = await sb
        .from('batches')
        .select('unit, mfg_date, exp_date')
        .eq('product_name', name.trim())
        .gt('remaining_qty', 0)
        .order('inv_date', { ascending: true })
        .order('id', { ascending: true })
        .limit(1)
      if (data && data.length > 0) {
        const b = data[0] as { unit: string; mfg_date: string | null; exp_date: string | null }
        if (b.unit) updateItem(idx, 'unit', b.unit)
        if (b.mfg_date) updateItem(idx, 'mfg_date', b.mfg_date)
        if (b.exp_date)  updateItem(idx, 'exp_date',  b.exp_date)
      }
    }
  }

  // ─── save invoice ─────────────────────────────────────────
  const handleSave = async () => {
    if (!user) { toast('Chưa đăng nhập — vui lòng tải lại trang', 'error'); return }
    const invItems = items
      .filter(it => it.name && (it.amount > 0 || it.qty > 0))
      .map(it => ({
        name: it.name.trim(),
        amount: it.amount || it.qty,
        unit: it.unit,
        ...(it.price > 0 ? { price: it.price } : {}),
        ...(it.mfg_date ? { mfg_date: it.mfg_date } : {}),
        ...(it.exp_date ? { exp_date: it.exp_date } : {}),
      }))

    if (invItems.length === 0) { toast('Thêm ít nhất một mặt hàng hợp lệ', 'error'); return }

    startLoading()
    try {
      // ── Kiểm tra FIFO: mỗi dòng xuất chỉ được lấy từ 1 lô ──
      if (invType === 'out') {
        const names = [...new Set(invItems.map(it => it.name))]
        // Case-insensitive: 1 ilike query per name, song song
        const checkQueries = names.map(n =>
          sb.from('batches')
            .select('id, product_name, inv_code, remaining_qty, unit')
            .ilike('product_name', n)
            .gt('remaining_qty', 0)
            .order('inv_date', { ascending: true })
            .order('id', { ascending: true })
        )
        const checkResults = await Promise.all(checkQueries)
        const batchCheck = checkResults.flatMap(r => r.data || [])

        // Lấy lô cũ nhất cho từng sản phẩm (key = lowercase), bỏ qua batch gần 0
        const oldestBatch: Record<string, { inv_code: string; remaining_qty: number; unit: string }> = {}
        for (const b of batchCheck as { id: number; product_name: string; inv_code: string; remaining_qty: number; unit: string }[]) {
          if (parseFloat(b.remaining_qty.toFixed(2)) <= 0) continue
          const key = b.product_name.toLowerCase().trim()
          if (!oldestBatch[key]) oldestBatch[key] = { inv_code: b.inv_code, remaining_qty: b.remaining_qty, unit: b.unit }
        }

        const violations: string[] = []
        for (const item of invItems) {
          const batch = oldestBatch[item.name.toLowerCase().trim()]
          if (!batch) {
            // CHẶN: không có batch nào để xuất → tránh xuất "ảo" làm lệch tồn kho
            violations.push(
              `"${item.name}": KHÔNG CÓ lô tồn kho. Tạo hoá đơn nhập trước khi xuất, ` +
              `hoặc liên hệ admin chạy SQL khởi tạo lô (init_batches_for_existing_stock.sql).`
            )
            continue
          }
          const batchEff = parseFloat(batch.remaining_qty.toFixed(2))
          if (item.amount > batchEff) {
            violations.push(
              `"${item.name}": lô ${batch.inv_code} chỉ còn ${fmtNum(batchEff)} ${batch.unit}. ` +
              `Xuất tối đa ${fmtNum(batchEff)} để hết lô này, rồi tạo hoá đơn mới cho ${fmtNum(item.amount - batchEff)} còn lại.`
            )
          }
        }

        if (violations.length > 0) {
          toast('Không thể xuất vượt lô hiện tại:\n' + violations.join('\n'), 'error')
          return
        }
      }

      const { data, error } = await sb.from('invoices').insert({
        type: invType,
        inv_date: invDate,
        code,
        partner,
        note,
        items: invItems,
        image_url: imageUrl,
        created_by: user.id,
        created_at: new Date().toISOString(),
      }).select().single()

      if (!error && data) {
        // Chạy song song: audit log + cập nhật stock
        await Promise.all([
          writeAudit('create', 'invoices', String(data.id), `Tạo hoá đơn ${invType === 'in' ? 'nhập' : 'xuất'}: ${code}`),
          updateStock(invItems as { name: string; amount: number }[], invType, 1),
        ])

        if (invType === 'in') {
          const batchErr = await createBatchesForImport(data.id, code, invDate, invItems)
          if (batchErr) {
            toast(`Hoá đơn đã lưu nhưng KHÔNG tạo được lô: ${batchErr}. Hãy chạy migration_batches.sql trong Supabase!`, 'error')
          } else {
            toast('Đã lưu hoá đơn & tạo lô hàng')
          }
        } else {
          await deductBatchesFifo(invItems as { name: string; amount: number; unit: string }[], data.id)
          toast('Đã lưu hoá đơn & phân bổ lô FIFO')
        }
        setInvoices(prev => [data as Invoice, ...prev])
        setCode(genCode())
        setPartner('')
        setNote('')
        setImageUrl('')
        setItems([{ name: '', amount: 0, unit: UNITS[0], price: 0, mfg_date: '', exp_date: '', recipeId: 0, qty: 0 }])
        setBatchPreviews({})
      } else if (error) {
        toast('Lỗi lưu: ' + error.message, 'error')
      }
    } catch (e) {
      toast('Lỗi: ' + (e as Error).message, 'error')
    } finally {
      stopLoading()
    }
  }

  // ─── delete invoice ───────────────────────────────────────
  const handleDelete = async (inv: Invoice) => {
    if (!window.confirm(`Xoá hoá đơn ${inv.code}?`)) return
    startLoading()
    try {
      const { error } = await sb.from('invoices').delete().eq('id', inv.id)
      if (!error) {
        const castItems = (inv.items as CastItem[]).map(it => ({ name: it.name, amount: it.amount || 0 }))
        await updateStock(castItems, inv.type, -1)

        if (inv.type === 'in') {
          await deleteBatchRecords(inv.id)
        } else {
          await restoreBatchDeductions(inv.id)
        }

        await writeAudit('delete', 'invoices', String(inv.id), `Xoá hoá đơn: ${inv.code}`)
        toast('Đã xoá hoá đơn')
        setInvoices(prev => prev.filter(i => i.id !== inv.id))
        setInvBatchUsage(prev => { const next = { ...prev }; delete next[inv.id]; return next })
      } else {
        toast('Lỗi xoá: ' + error.message, 'error')
      }
    } catch (e) {
      toast('Lỗi xoá: ' + (e instanceof Error ? e.message : String(e)), 'error')
    } finally {
      stopLoading()
    }
  }

  // ─── upload ảnh bổ sung cho hoá đơn đã lưu ───────────────
  const handleSaveImage = async (invId: number, url: string) => {
    const { error } = await sb.from('invoices').update({ image_url: url }).eq('id', invId)
    if (error) { toast('Lỗi lưu ảnh: ' + error.message, 'error'); return }
    setInvoices(prev => prev.map(i => i.id === invId ? { ...i, image_url: url } : i))
    setUploadingImgFor(null)
    toast('Đã lưu ảnh hoá đơn')
  }

  // ─── toggle accordion + auto-load batch usage ─────────────
  const toggleInv = (id: number) => {
    setOpenInvs(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        const inv = invoices.find(i => i.id === id)
        if (inv?.type === 'out') loadBatchUsageForInv(id)
      }
      return next
    })
  }

  // ─── partner suggestions ──────────────────────────────────
  const partnerSuggestions = useMemo(() => {
    const names = invoices
      .filter(inv => inv.type === invType && inv.partner?.trim())
      .map(inv => inv.partner.trim())
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'vi'))
  }, [invoices, invType])

  const formTotal = items.reduce((s, it) => s + (it.amount || it.qty || 0) * (it.price || 0), 0)

  const hasBatchPreview = invType === 'out' && Object.keys(batchPreviews).length > 0

  // ─── render ───────────────────────────────────────────────
  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3d1f0a]">🧾 Hoá đơn</h2>
        {/* Tab navigation */}
        <div className="flex bg-[#f5e6cc] rounded-xl p-1 gap-1">
          <button
            onClick={() => setTab('invoices')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${tab === 'invoices' ? 'bg-white text-[#c8773a] shadow-sm' : 'text-[#8b5e3c] hover:text-[#c8773a]'}`}
          >
            📋 Hoá đơn
          </button>
          <button
            onClick={() => setTab('batches')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${tab === 'batches' ? 'bg-white text-[#c8773a] shadow-sm' : 'text-[#8b5e3c] hover:text-[#c8773a]'}`}
          >
            📦 Tồn theo lô
          </button>
        </div>
      </div>

      {tab === 'batches' ? (
        <BatchesTab />
      ) : (
        <>
          {/* ── Form ── */}
          <div className="bg-[#fffaf4] rounded-2xl p-5 mb-4 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
            {/* Type toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInvType('in')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-2 ${invType === 'in' ? 'bg-[#3aaa6e] text-white border-[#3aaa6e]' : 'bg-white text-[#8b5e3c] border-[#f5e6cc] hover:border-[#3aaa6e]'}`}
              >
                ↓ Nhập hàng
              </button>
              <button
                onClick={() => setInvType('out')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-2 ${invType === 'out' ? 'bg-[#c8773a] text-white border-[#c8773a]' : 'bg-white text-[#8b5e3c] border-[#f5e6cc] hover:border-[#c8773a]'}`}
              >
                ↑ Xuất/Bán
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Ngày</label>
                <DateInput value={invDate} onChange={setInvDate}
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Mã hoá đơn</label>
                <input value={code} onChange={e => setCode(e.target.value)} onBlur={e => setCode(e.target.value.trim())}
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8b5e3c] mb-1">{invType === 'in' ? 'Nhà cung cấp' : 'Khách hàng'}</label>
                <TextPicker
                  value={partner}
                  onChange={setPartner}
                  suggestions={partnerSuggestions}
                  placeholder={invType === 'in' ? '🔍 Tên NCC...' : '🔍 Tên khách...'}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Ghi chú</label>
                <input value={note} onChange={e => setNote(e.target.value)} onBlur={e => setNote(e.target.value.trim())} placeholder="Ghi chú..."
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
              </div>
            </div>

            {/* Ảnh hoá đơn */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-[#8b5e3c] mb-1">
                Ảnh hoá đơn <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
              </label>
              <ImageUpload value={imageUrl} onChange={setImageUrl} />
            </div>

            {/* Items table */}
            <div className="rounded-lg border border-[#f0e8d8] mb-3 overflow-x-auto">
              <table className="border-collapse w-full">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">{invType === 'in' ? 'Nguyên liệu' : 'Sản phẩm'}</th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc] w-24">Số lượng</th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc] w-24">
                      ĐVT <span className="text-[#c8773a] normal-case font-normal">✦</span>
                    </th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc] w-32">
                      {invType === 'in' ? 'Giá nhập' : 'Giá bán'} <span className="text-[#c8773a] normal-case font-normal">✦</span>
                    </th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc] w-32">NSX</th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc] w-32">HSD</th>
                    <th className="bg-[#f5e6cc] w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                        <ProductPicker
                          products={allProducts}
                          value={it.name}
                          onChange={(name, unit) => handleProductSelect(idx, name, unit)}
                        />
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                        <input type="number" min={0} step="any" value={it.amount || it.qty || 0}
                          onChange={e => { const v = parseFloat(e.target.value) || 0; updateItem(idx, 'amount', v); updateItem(idx, 'qty', v) }}
                          className="w-full px-2 py-1 border-[1.5px] border-[#f5e6cc] rounded text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                        <select value={it.unit} onChange={e => updateItem(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1 border-[1.5px] border-[#f5e6cc] rounded text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none">
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                        <input type="number" min={0} step="any" value={it.price || 0}
                          onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border-[1.5px] border-[#f5e6cc] rounded text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                        <DateInput value={it.mfg_date || ''} onChange={v => updateItem(idx, 'mfg_date', v)}
                          className="w-full px-2 py-1 border-[1.5px] border-[#f5e6cc] rounded text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                        <DateInput value={it.exp_date || ''} onChange={v => updateItem(idx, 'exp_date', v)}
                          className="w-full px-2 py-1 border-[1.5px] border-[#f5e6cc] rounded text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-center">
                        <button onClick={() => removeItem(idx)} className="bg-transparent border-none text-[#e0a090] text-base cursor-pointer px-1.5 py-0.5 rounded hover:bg-[#fdecea] hover:text-[#c0392b] transition-all">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FIFO batch preview (chỉ hiện khi xuất) */}
            {hasBatchPreview && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-[11px] font-semibold text-amber-800 mb-2">📦 Phân bổ lô hàng theo FIFO</p>
                {items.map((item, idx) => {
                  const allocs = batchPreviews[idx]
                  if (!allocs || !item.name.trim()) return null
                  return (
                    <div key={idx} className="mb-2 last:mb-0">
                      <p className="text-[11px] font-medium text-amber-700 mb-0.5">{item.name}:</p>
                      <div className="ml-2 space-y-0.5">
                        {allocs.map((a, ai) => (
                          a.insufficient
                            ? <p key={ai} className="text-[11px] text-red-600">⚠ Không có lô tồn kho cho sản phẩm này</p>
                          : a.exceedsBatch
                            ? <div key={ai} className="rounded-lg bg-red-50 border border-red-200 px-2 py-1.5">
                                <p className="text-[11px] font-semibold text-red-700">🚫 Vượt quá lô {a.inv_code} ({fmtDate(a.inv_date)})</p>
                                <p className="text-[11px] text-red-600 mt-0.5">
                                  Lô này chỉ còn <strong>{fmtNum(a.maxQty!)} {a.unit}</strong>, bạn muốn xuất <strong>{fmtNum(a.qty)} {a.unit}</strong>.
                                </p>
                                <p className="text-[11px] text-red-600">
                                  ① Xuất HĐ này với tối đa <strong>{fmtNum(a.maxQty!)} {a.unit}</strong> để hết lô {a.inv_code}.<br/>
                                  ② Tạo HĐ mới cho <strong>{fmtNum(a.qty - a.maxQty!)} {a.unit}</strong> còn lại từ lô tiếp theo.
                                </p>
                              </div>
                            : <p key={ai} className="text-[11px] text-amber-700">
                                ✓ Lô <span className="font-medium">{a.inv_code}</span> ({fmtDate(a.inv_date)}): {fmtNum(a.qty)} {a.unit} × {fmtPrice(a.price)} = <span className="font-semibold">{fmtPrice(a.qty * a.price)}</span>
                              </p>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {formTotal > 0 && (
              <div className="text-right text-sm font-semibold text-[#c8773a] mb-2">
                Tổng: {fmtPrice(formTotal)}
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <button onClick={addItem} className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-transparent border-[1.5px] border-dashed border-[#c8773a] rounded-lg text-[#c8773a] text-xs cursor-pointer hover:bg-[#fef4e8] transition-all">
                + Thêm dòng
              </button>
              <button onClick={handleSave} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-[#c8773a] to-[#e8a44a] text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-all mt-2">
                💾 Lưu hoá đơn
              </button>
            </div>
          </div>

          {/* ── Invoice list ── */}
          <div className="bg-[#fffaf4] rounded-2xl p-5 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
            <h3 className="text-sm font-semibold text-[#3d1f0a] mb-3">Danh sách hoá đơn</h3>
            {invoices.length === 0 ? (
              <div className="text-sm text-[#8b5e3c] text-center py-4">Chưa có hoá đơn nào</div>
            ) : (
              <div className="space-y-2">
                {invoices.map(inv => {
                  const castItems = inv.items as CastItem[]
                  const invTotal = calcTotal(castItems)
                  return (
                    <div key={inv.id} className="border border-[#f0e8d8] rounded-xl overflow-hidden">
                      <div className="flex justify-between items-center p-3 px-4 cursor-pointer select-none bg-[#fdf6ec] hover:bg-[#fef4e8] transition-all" onClick={() => toggleInv(inv.id)}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${inv.type === 'in' ? 'bg-[#d4f5e3] text-[#1e7a4a]' : 'bg-[#fdf0e0] text-[#c8773a]'}`}>
                            {inv.type === 'in' ? '↓ Nhập' : '↑ Xuất'}
                          </span>
                          <span className="text-sm font-medium text-[#3d1f0a]">{inv.code}</span>
                          <span className="text-xs text-[#8b5e3c]">{fmtDate(inv.inv_date)}</span>
                          {inv.partner && <span className="text-xs text-[#8b5e3c]">| {inv.partner}</span>}
                          {invTotal > 0 && <span className="text-xs font-semibold text-[#c8773a]">{fmtPrice(invTotal)}</span>}
                        </div>
                        <span className="text-[#8b5e3c] text-sm">{openInvs.has(inv.id) ? '▲' : '▼'}</span>
                      </div>

                      {openInvs.has(inv.id) && (
                        <div className="border-t border-[#f0e8d8] bg-white p-3">
                          {inv.note && <p className="text-xs text-[#8b5e3c] mb-2">📝 {inv.note}</p>}

                          {/* Ảnh hoá đơn */}
                          {inv.image_url ? (
                            <div className="mb-3">
                              <a href={inv.image_url} target="_blank" rel="noopener noreferrer">
                                <img src={inv.image_url} alt="Ảnh hoá đơn"
                                  className="max-h-48 rounded-xl border border-[#f0e8d8] object-contain bg-[#fdf6ec] p-1 hover:opacity-90 transition-opacity cursor-zoom-in" />
                              </a>
                              <p className="text-[10px] text-[#8b5e3c] mt-1">📷 Ảnh hoá đơn — click để xem to</p>
                            </div>
                          ) : uploadingImgFor === inv.id ? (
                            <div className="mb-3 p-3 bg-[#fdf6ec] border border-[#f5e6cc] rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-[#3d1f0a]">📷 Tải lên ảnh hoá đơn</p>
                                <button onClick={() => setUploadingImgFor(null)} className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer">✕ Huỷ</button>
                              </div>
                              <ImageUpload
                                value=""
                                onChange={url => { if (url) handleSaveImage(inv.id, url) }}
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => setUploadingImgFor(inv.id)}
                              className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[#c8773a] text-[#c8773a] text-xs cursor-pointer hover:bg-[#fef4e8] transition-all"
                            >
                              📷 Thêm ảnh hoá đơn
                            </button>
                          )}

                          {/* Items table */}
                          <div className="overflow-x-auto rounded border border-[#f0e8d8]">
                            <table className="w-full border-collapse text-xs">
                              <thead>
                                <tr>
                                  <th className="text-left text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-1.5 bg-[#f5e6cc]">#</th>
                                  <th className="text-left text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-1.5 bg-[#f5e6cc]">{inv.type === 'in' ? 'Nguyên liệu' : 'Sản phẩm'}</th>
                                  <th className="text-right text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-1.5 bg-[#f5e6cc]">Số lượng</th>
                                  <th className="text-right text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-1.5 bg-[#f5e6cc]">{inv.type === 'in' ? 'Giá nhập' : 'Giá bán'}</th>
                                  <th className="text-right text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-1.5 bg-[#f5e6cc]">Thành tiền</th>
                                  <th className="text-left text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-1.5 bg-[#f5e6cc]">NSX</th>
                                  <th className="text-left text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-1.5 bg-[#f5e6cc]">HSD</th>
                                </tr>
                              </thead>
                              <tbody>
                                {castItems.map((it, i) => (
                                  <tr key={i}>
                                    <td className="px-2 py-1.5 border-b border-[#f0e8d8]">{i + 1}</td>
                                    <td className="px-2 py-1.5 border-b border-[#f0e8d8]">{it.name}</td>
                                    <td className="px-2 py-1.5 border-b border-[#f0e8d8] text-right">{fmtNum(it.amount)} {it.unit}</td>
                                    <td className="px-2 py-1.5 border-b border-[#f0e8d8] text-right">{it.price ? fmtPrice(it.price) : '—'}</td>
                                    <td className="px-2 py-1.5 border-b border-[#f0e8d8] text-right font-medium text-[#3d1f0a]">
                                      {it.price ? fmtPrice((it.amount || 0) * it.price) : '—'}
                                    </td>
                                    <td className="px-2 py-1.5 border-b border-[#f0e8d8] whitespace-nowrap">{it.mfg_date ? fmtDate(it.mfg_date) : '—'}</td>
                                    <td className={`px-2 py-1.5 border-b border-[#f0e8d8] whitespace-nowrap ${it.exp_date && new Date(it.exp_date) < new Date() ? 'text-[#d94f3d] font-semibold' : ''}`}>
                                      {it.exp_date ? fmtDate(it.exp_date) : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              {invTotal > 0 && (
                                <tfoot>
                                  <tr>
                                    <td colSpan={6} className="px-2 py-1.5 text-right text-xs font-semibold text-[#3d1f0a]">Tổng cộng</td>
                                    <td className="px-2 py-1.5 text-right text-xs font-bold text-[#c8773a]">{fmtPrice(invTotal)}</td>
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>

                          {/* Batch usage (chỉ hiện cho xuất) */}
                          {inv.type === 'out' && (() => {
                            const usage = invBatchUsage[inv.id]
                            if (usage === undefined) return (
                              <p className="text-[10px] text-[#8b5e3c] mt-2 italic">Đang tải thông tin lô...</p>
                            )
                            if (usage.length === 0) return (
                              <p className="text-[10px] text-[#8b5e3c] mt-2 italic">Không có thông tin lô (hoá đơn cũ)</p>
                            )
                            // group by batch_inv_code for display
                            return (
                              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-[10px] font-semibold text-amber-800 mb-1.5">📦 Lô hàng đã dùng (FIFO)</p>
                                <div className="space-y-0.5">
                                  {usage.map((d, di) => (
                                    <p key={di} className="text-[10px] text-amber-700">
                                      • Lô <span className="font-medium">{d.batch_inv_code}</span>
                                      {d.batch_inv_date ? ` (${fmtDate(d.batch_inv_date)})` : ''}: {fmtNum(d.qty_used)} {d.batch_unit}
                                      {d.batch_price > 0 ? ` × ${fmtPrice(d.batch_price)} = ${fmtPrice(d.qty_used * d.batch_price)}` : ''}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}

                          <div className="flex gap-2 mt-2">
                            <button onClick={() => doPrint(inv, recipes)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-[1.5px] border-[#f5e6cc] text-[#8b5e3c] text-xs font-medium cursor-pointer hover:border-[#c8773a] hover:text-[#c8773a] transition-all">
                              🖨 In
                            </button>
                            <button onClick={() => handleDelete(inv)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-[1.5px] border-[#e0a090] text-[#d94f3d] text-xs font-medium cursor-pointer hover:bg-[#fdecea] transition-all">
                              🗑 Xoá
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
