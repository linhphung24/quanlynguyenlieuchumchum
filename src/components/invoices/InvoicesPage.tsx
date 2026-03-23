'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Invoice, InvoiceItem } from '@/types'
import { todayStr, fmtDate, fmtTs, fmtNum, genCode } from '@/lib/utils'
import { UNITS } from '@/lib/constants'
import ProductPicker from '@/components/shared/ProductPicker'

function doPrint(inv: Invoice, recipes: { id: number; name: string }[]) {
  const isIn = inv.type === 'in'
  const rows = isIn
    ? (inv.items as { name: string; amount: number; unit: string }[])
        .map((it, i) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${i + 1}</td><td style="padding:6px 8px;border-bottom:1px solid #eee">${it.name}</td><td style="text-align:right;padding:6px 8px;border-bottom:1px solid #eee">${fmtNum(it.amount!)} ${it.unit}</td></tr>`)
        .join('')
    : (inv.items as { recipeId?: number; recipe_id?: number; qty: number }[])
        .map((it, i) => {
          const r = recipes.find(x => x.id === (it.recipeId || it.recipe_id))
          return `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${i + 1}</td><td style="padding:6px 8px;border-bottom:1px solid #eee">${r ? r.name : '?'}</td><td style="text-align:right;padding:6px 8px;border-bottom:1px solid #eee">${it.qty} chiếc</td></tr>`
        })
        .join('')

  const w = window.open('', '_blank')!
  w.document.write(`<html>
<head><title>Hoá đơn ${inv.code}</title>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#222}h2{color:#c8773a}table{width:100%;border-collapse:collapse}th{background:#f5e6cc;text-align:left;padding:6px 8px}td{padding:6px 8px;border-bottom:1px solid #eee}.meta{display:flex;gap:24px;margin-bottom:16px;font-size:13px}</style>
</head>
<body>
<h2>${isIn ? 'HOÁ ĐƠN NHẬP HÀNG' : 'HOÁ ĐƠN XUẤT/BÁN HÀNG'}</h2>
<div class="meta">
  <div><b>Mã:</b> ${inv.code}</div>
  <div><b>Ngày:</b> ${fmtDate(inv.inv_date)}</div>
  ${inv.partner ? `<div><b>${isIn ? 'NCC' : 'KH'}:</b> ${inv.partner}</div>` : ''}
</div>
${inv.note ? `<div style="font-size:12px;color:#888;margin-bottom:12px">Ghi chú: ${inv.note}</div>` : ''}
<table>
  <thead><tr><th>#</th><th>${isIn ? 'Nguyên liệu' : 'Sản phẩm'}</th><th style="text-align:right">Số lượng</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div style="margin-top:20px;font-size:12px;color:#aaa">In lúc: ${new Date().toLocaleString('vi-VN')}</div>
</body></html>`)
  w.document.close()
  w.print()
}

interface FormItem {
  name: string
  amount: number
  unit: string
  recipeId: number
  qty: number
}

export default function InvoicesPage() {
  const { sb, user, recipes, allProducts, toast, startLoading, stopLoading, writeAudit } = useApp()

  const [invType, setInvType] = useState<'in' | 'out'>('in')
  const [invDate, setInvDate] = useState(todayStr())
  const [code, setCode] = useState(genCode())
  const [partner, setPartner] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<FormItem[]>([{ name: '', amount: 0, unit: UNITS[0], recipeId: 0, qty: 0 }])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [openInvs, setOpenInvs] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadInvoices()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadInvoices = async () => {
    const { data } = await sb.from('invoices').select('*').order('inv_date', { ascending: false }).order('id', { ascending: false })
    if (data) setInvoices(data as Invoice[])
  }

  const toggleInv = (id: number) => {
    setOpenInvs(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const addItem = () => setItems([...items, { name: '', amount: 0, unit: UNITS[0], recipeId: 0, qty: 0 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: string, val: unknown) => {
    setItems(items.map((it, i) => i === idx ? { ...it, [field]: val } : it))
  }

  const handleSave = async () => {
    if (!user) return
    const invItems: InvoiceItem[] = invType === 'in'
      ? items.filter(it => it.name && it.amount > 0).map(it => ({ name: it.name, amount: it.amount, unit: it.unit }))
      : items.filter(it => it.recipeId && it.qty > 0).map(it => ({ recipeId: it.recipeId, qty: it.qty }))

    if (invItems.length === 0) { toast('Thêm ít nhất một mặt hàng hợp lệ', 'error'); return }

    startLoading()
    const { data, error } = await sb.from('invoices').insert({
      type: invType,
      inv_date: invDate,
      code,
      partner,
      note,
      items: invItems,
      created_by: user.id,
      created_at: new Date().toISOString(),
    }).select().single()

    if (!error && data) {
      await writeAudit('create', 'invoices', String(data.id), `Tạo hoá đơn ${invType === 'in' ? 'nhập' : 'xuất'}: ${code}`)
      toast('Đã lưu hoá đơn')
      setInvoices(prev => [data as Invoice, ...prev])
      setCode(genCode())
      setPartner('')
      setNote('')
      setItems([{ name: '', amount: 0, unit: UNITS[0], recipeId: 0, qty: 0 }])
    } else if (error) {
      toast('Lỗi lưu: ' + error.message, 'error')
    }
    stopLoading()
  }

  const handleDelete = async (inv: Invoice) => {
    if (!window.confirm(`Xoá hoá đơn ${inv.code}?`)) return
    startLoading()
    const { error } = await sb.from('invoices').delete().eq('id', inv.id)
    if (!error) {
      await writeAudit('delete', 'invoices', String(inv.id), `Xoá hoá đơn: ${inv.code}`)
      toast('Đã xoá hoá đơn')
      setInvoices(prev => prev.filter(i => i.id !== inv.id))
    } else {
      toast('Lỗi xoá: ' + error.message, 'error')
    }
    stopLoading()
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3d1f0a] mb-4">🧾 Hoá đơn</h2>

      {/* Form */}
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
            <input type="date" value={invDate} onChange={e => setInvDate(e.target.value)}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Mã hoá đơn</label>
            <input value={code} onChange={e => setCode(e.target.value)}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8b5e3c] mb-1">{invType === 'in' ? 'Nhà cung cấp' : 'Khách hàng'}</label>
            <input value={partner} onChange={e => setPartner(e.target.value)} placeholder={invType === 'in' ? 'Tên NCC...' : 'Tên khách...'}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Ghi chú</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú..."
              className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
          </div>
        </div>

        {/* Items */}
        <div className="overflow-x-auto rounded-lg border border-[#f0e8d8] mb-3">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {invType === 'in' ? (
                  <>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Nguyên liệu</th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc] w-24">Số lượng</th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc] w-32">ĐVT</th>
                  </>
                ) : (
                  <>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Công thức</th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc] w-24">Số lượng</th>
                  </>
                )}
                <th className="bg-[#f5e6cc] w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  {invType === 'in' ? (
                    <>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                        <ProductPicker
                          products={allProducts}
                          value={it.name}
                          onChange={(name, unit) => { updateItem(idx, 'name', name); updateItem(idx, 'unit', unit) }}
                        />
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                        <input type="number" min={0} step="any" value={it.amount}
                          onChange={e => updateItem(idx, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border-[1.5px] border-[#f5e6cc] rounded text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                        <select value={it.unit} onChange={e => updateItem(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1 border-[1.5px] border-[#f5e6cc] rounded text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none">
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                        <select value={it.recipeId} onChange={e => updateItem(idx, 'recipeId', Number(e.target.value))}
                          className="w-full px-2 py-1 border-[1.5px] border-[#f5e6cc] rounded text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none">
                          <option value={0}>-- Chọn công thức --</option>
                          {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                        <input type="number" min={0} value={it.qty}
                          onChange={e => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border-[1.5px] border-[#f5e6cc] rounded text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors" />
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-center">
                    <button onClick={() => removeItem(idx)} className="bg-transparent border-none text-[#e0a090] text-base cursor-pointer px-1.5 py-0.5 rounded hover:bg-[#fdecea] hover:text-[#c0392b] transition-all">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={addItem} className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-transparent border-[1.5px] border-dashed border-[#c8773a] rounded-lg text-[#c8773a] text-xs cursor-pointer hover:bg-[#fef4e8] transition-all">
            + Thêm dòng
          </button>
          <button onClick={handleSave} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-[#c8773a] to-[#e8a44a] text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-all mt-2">
            💾 Lưu hoá đơn
          </button>
        </div>
      </div>

      {/* Invoice list */}
      <div className="bg-[#fffaf4] rounded-2xl p-5 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <h3 className="text-sm font-semibold text-[#3d1f0a] mb-3">Danh sách hoá đơn</h3>
        {invoices.length === 0 ? (
          <div className="text-sm text-[#8b5e3c] text-center py-4">Chưa có hoá đơn nào</div>
        ) : (
          <div className="space-y-2">
            {invoices.map(inv => (
              <div key={inv.id} className="border border-[#f0e8d8] rounded-xl overflow-hidden">
                <div className="flex justify-between items-center p-3 px-4 cursor-pointer select-none bg-[#fdf6ec] hover:bg-[#fef4e8] transition-all" onClick={() => toggleInv(inv.id)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${inv.type === 'in' ? 'bg-[#d4f5e3] text-[#1e7a4a]' : 'bg-[#fdf0e0] text-[#c8773a]'}`}>
                      {inv.type === 'in' ? '↓ Nhập' : '↑ Xuất'}
                    </span>
                    <span className="text-sm font-medium text-[#3d1f0a]">{inv.code}</span>
                    <span className="text-xs text-[#8b5e3c]">{fmtDate(inv.inv_date)}</span>
                    {inv.partner && <span className="text-xs text-[#8b5e3c]">| {inv.partner}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#8b5e3c] text-sm">{openInvs.has(inv.id) ? '▲' : '▼'}</span>
                  </div>
                </div>
                {openInvs.has(inv.id) && (
                  <div className="border-t border-[#f0e8d8] bg-white p-3">
                    {inv.note && <p className="text-xs text-[#8b5e3c] mb-2">📝 {inv.note}</p>}
                    <div className="overflow-x-auto rounded border border-[#f0e8d8]">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr>
                            <th className="text-left text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-1.5 bg-[#f5e6cc]">#</th>
                            <th className="text-left text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-1.5 bg-[#f5e6cc]">{inv.type === 'in' ? 'Nguyên liệu' : 'Sản phẩm'}</th>
                            <th className="text-right text-[10px] font-medium uppercase text-[#8b5e3c] px-2 py-1.5 bg-[#f5e6cc]">Số lượng</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inv.type === 'in'
                            ? (inv.items as { name: string; amount: number; unit: string }[]).map((it, i) => (
                                <tr key={i}>
                                  <td className="px-2 py-1.5 border-b border-[#f0e8d8]">{i + 1}</td>
                                  <td className="px-2 py-1.5 border-b border-[#f0e8d8]">{it.name}</td>
                                  <td className="px-2 py-1.5 border-b border-[#f0e8d8] text-right">{fmtNum(it.amount)} {it.unit}</td>
                                </tr>
                              ))
                            : (inv.items as { recipeId?: number; recipe_id?: number; qty: number }[]).map((it, i) => {
                                const r = recipes.find(x => x.id === (it.recipeId || it.recipe_id))
                                return (
                                  <tr key={i}>
                                    <td className="px-2 py-1.5 border-b border-[#f0e8d8]">{i + 1}</td>
                                    <td className="px-2 py-1.5 border-b border-[#f0e8d8]">{r ? r.name : '?'}</td>
                                    <td className="px-2 py-1.5 border-b border-[#f0e8d8] text-right">{it.qty} chiếc</td>
                                  </tr>
                                )
                              })
                          }
                        </tbody>
                      </table>
                    </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
