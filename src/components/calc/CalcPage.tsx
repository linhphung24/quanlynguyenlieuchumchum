'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { fmtNum } from '@/lib/utils'

export default function CalcPage() {
  const { recipes } = useApp()
  const [selectedId, setSelectedId] = useState<number | ''>('')
  const [qty, setQty] = useState(1)

  const recipe = recipes.find(r => r.id === Number(selectedId)) || null

  const scaledIngredients = recipe
    ? recipe.ingredients.map(ing => ({
        ...ing,
        scaledAmount: (ing.amount * qty) / recipe.base_yield,
      }))
    : []

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3d1f0a] mb-4">🧮 Tính nhanh nguyên liệu</h2>

      <div className="bg-[#fffaf4] rounded-2xl p-5 mb-4 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <div className="flex gap-3 flex-wrap mb-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Chọn công thức</label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none"
            >
              <option value="">-- Chọn công thức --</option>
              {recipes.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Số lượng cần làm</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={e => setQty(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
            />
          </div>
        </div>

        {recipe && (
          <div className="text-xs text-[#8b5e3c] mb-3 bg-[#fef4e8] px-3 py-2 rounded-lg">
            Công thức gốc: <strong className="text-[#c8773a]">{recipe.base_yield}</strong> cái →
            Cần làm: <strong className="text-[#c8773a]">{qty}</strong> cái
            (tỉ lệ: <strong className="text-[#c8773a]">{(qty / recipe.base_yield).toFixed(2)}x</strong>)
          </div>
        )}

        {!recipe && (
          <div className="text-sm text-[#8b5e3c] text-center py-6">
            Chọn công thức để xem nguyên liệu cần dùng
          </div>
        )}

        {recipe && scaledIngredients.length === 0 && (
          <div className="text-sm text-[#8b5e3c] text-center py-4">
            Công thức này chưa có nguyên liệu
          </div>
        )}

        {recipe && scaledIngredients.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-[#f0e8d8]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Nguyên liệu</th>
                  <th className="text-right text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Gốc ({recipe.base_yield})</th>
                  <th className="text-right text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Cần ({qty})</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">ĐVT</th>
                </tr>
              </thead>
              <tbody>
                {scaledIngredients.map((ing, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? '' : 'bg-[#fdf6ec]'}>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-sm text-[#3d1f0a]">{ing.name}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-sm text-right text-[#8b5e3c]">{fmtNum(ing.amount)}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-sm text-right font-semibold text-[#c8773a]">{fmtNum(ing.scaledAmount)}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-sm text-[#8b5e3c]">{ing.unit}</td>
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
