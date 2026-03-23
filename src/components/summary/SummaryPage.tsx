'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { DailyLog, Invoice } from '@/types'
import { fmtNum } from '@/lib/utils'
import { MONTHS_VN } from '@/lib/constants'

interface IngRow {
  name: string
  unit: string
  imported: number
  used: number
  exported: number
  remain: number
}

interface Stats {
  daysProduced: number
  totalProduced: number
  totalSold: number
  invCount: number
}

export default function SummaryPage() {
  const { sb, recipes } = useApp()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [ingRows, setIngRows] = useState<IngRow[]>([])
  const [stats, setStats] = useState<Stats>({ daysProduced: 0, totalProduced: 0, totalSold: 0, invCount: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, recipes])

  const loadData = async () => {
    setLoading(true)
    const pad = (n: number) => String(n).padStart(2, '0')
    const from = `${year}-${pad(month)}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${pad(month)}-${pad(lastDay)}`

    const [{ data: logData }, { data: invData }] = await Promise.all([
      sb.from('daily_log').select('*').gte('log_date', from).lte('log_date', to),
      sb.from('invoices').select('*').gte('inv_date', from).lte('inv_date', to),
    ])

    const logs = (logData || []) as DailyLog[]
    const invs = (invData || []) as Invoice[]

    // recipeProd: recipe_id → total qty produced
    const recipeProd = new Map<number, number>()
    for (const l of logs) {
      recipeProd.set(l.recipe_id, (recipeProd.get(l.recipe_id) || 0) + Number(l.qty))
    }

    // ingMap: `name|||unit` → { imported, used, exported }
    const ingMap = new Map<string, { imported: number; used: number; exported: number }>()
    const getOrCreate = (name: string, unit: string) => {
      const k = `${name}|||${unit}`
      if (!ingMap.has(k)) ingMap.set(k, { imported: 0, used: 0, exported: 0 })
      return ingMap.get(k)!
    }

    // used: from daily log
    for (const [recipeId, totalQty] of recipeProd.entries()) {
      const recipe = recipes.find(r => r.id === recipeId)
      if (!recipe || !recipe.ingredients) continue
      for (const ing of recipe.ingredients) {
        const entry = getOrCreate(ing.name, ing.unit)
        entry.used += ing.amount * (totalQty / recipe.base_yield)
      }
    }

    // imported: from 'in' invoices
    for (const inv of invs) {
      if (inv.type === 'in') {
        for (const it of (inv.items as { name: string; amount: number; unit: string }[])) {
          const entry = getOrCreate(it.name, it.unit)
          entry.imported += Number(it.amount || 0)
        }
      }
    }

    // exported: from 'out' invoices
    for (const inv of invs) {
      if (inv.type === 'out') {
        for (const it of (inv.items as { recipeId?: number; recipe_id?: number; qty: number }[])) {
          const recipeId = it.recipeId || it.recipe_id
          if (!recipeId) continue
          const recipe = recipes.find(r => r.id === recipeId)
          if (!recipe || !recipe.ingredients) continue
          for (const ing of recipe.ingredients) {
            const entry = getOrCreate(ing.name, ing.unit)
            entry.exported += ing.amount * (Number(it.qty) / recipe.base_yield)
          }
        }
      }
    }

    const rows: IngRow[] = []
    for (const [k, v] of ingMap.entries()) {
      const [name, unit] = k.split('|||')
      rows.push({
        name,
        unit,
        imported: v.imported,
        used: v.used,
        exported: v.exported,
        remain: v.imported - v.used - v.exported,
      })
    }
    rows.sort((a, b) => a.name.localeCompare(b.name))
    setIngRows(rows)

    // Stats
    const daySet = new Set(logs.map(l => l.log_date))
    const totalProduced = logs.reduce((s, l) => s + Number(l.qty), 0)
    const totalSold = invs
      .filter(i => i.type === 'out')
      .flatMap(i => i.items as { qty: number }[])
      .reduce((s, it) => s + Number(it.qty || 0), 0)

    setStats({
      daysProduced: daySet.size,
      totalProduced,
      totalSold,
      invCount: invs.length,
    })
    setLoading(false)
  }

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3d1f0a] mb-4">📊 Tổng kết tháng</h2>

      {/* Month/Year selector */}
      <div className="bg-[#fffaf4] rounded-2xl p-5 mb-4 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <div className="flex gap-3 items-center flex-wrap">
          <div>
            <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Tháng</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none pr-7">
              {MONTHS_VN.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Năm</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none pr-7">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Ngày sản xuất', value: stats.daysProduced, unit: 'ngày', icon: '📅' },
          { label: 'Tổng sản xuất', value: fmtNum(stats.totalProduced), unit: 'cái', icon: '🥐' },
          { label: 'Tổng bán ra', value: fmtNum(stats.totalSold), unit: 'cái', icon: '💰' },
          { label: 'Số hoá đơn', value: stats.invCount, unit: 'cái', icon: '🧾' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border-[1.5px] border-[#f5e6cc] text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold text-[#c8773a]">{s.value}</div>
            <div className="text-xs text-[#8b5e3c]">{s.unit}</div>
            <div className="text-[10px] text-[#8b5e3c] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ingredient balance table */}
      <div className="bg-[#fffaf4] rounded-2xl p-5 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <h3 className="text-sm font-semibold text-[#3d1f0a] mb-3">Bảng cân đối nguyên liệu</h3>
        {loading ? (
          <div className="text-center py-8 text-sm text-[#8b5e3c]">Đang tải...</div>
        ) : ingRows.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#8b5e3c]">Không có dữ liệu trong tháng này</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#f0e8d8]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Nguyên liệu</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">ĐVT</th>
                  <th className="text-right text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Nhập</th>
                  <th className="text-right text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Dùng</th>
                  <th className="text-right text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Xuất</th>
                  <th className="text-right text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Còn lại</th>
                </tr>
              </thead>
              <tbody>
                {ingRows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? '' : 'bg-[#fdf6ec]'}>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-sm font-medium text-[#3d1f0a]">{row.name}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-sm text-[#8b5e3c]">{row.unit}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-sm text-right text-[#3aaa6e]">{fmtNum(row.imported)}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-sm text-right text-[#c8773a]">{fmtNum(row.used)}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-sm text-right text-[#3a7fc1]">{fmtNum(row.exported)}</td>
                    <td className={`px-3 py-2.5 border-b border-[#f0e8d8] text-sm text-right font-semibold ${row.remain < 0 ? 'text-[#d94f3d]' : 'text-[#3d1f0a]'}`}>
                      {fmtNum(row.remain)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
