'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Recipe, RecipeIngredient } from '@/types'
import { UNITS } from '@/lib/constants'

export default function RecipesPage() {
  const { sb, user, profile, recipes, setRecipes, currentRecipeId, setCurrentRecipeId, toast, startLoading, stopLoading, writeAudit } = useApp()

  const [editName, setEditName] = useState('')
  const [editYield, setEditYield] = useState(1)
  const [editIngredients, setEditIngredients] = useState<RecipeIngredient[]>([])
  const [dirty, setDirty] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newYield, setNewYield] = useState(1)

  const currentRecipe = recipes.find(r => r.id === currentRecipeId) || null

  useEffect(() => {
    if (currentRecipe) {
      setEditName(currentRecipe.name)
      setEditYield(currentRecipe.base_yield)
      setEditIngredients(currentRecipe.ingredients ? [...currentRecipe.ingredients] : [])
      setDirty(false)
    }
  }, [currentRecipeId, recipes])

  const handleIngChange = (idx: number, field: keyof RecipeIngredient, val: string | number) => {
    const updated = editIngredients.map((ing, i) => {
      if (i !== idx) return ing
      return { ...ing, [field]: val }
    })
    setEditIngredients(updated)
    setDirty(true)
  }

  const addIngredient = () => {
    setEditIngredients([...editIngredients, { name: '', amount: 0, unit: UNITS[0] }])
    setDirty(true)
  }

  const removeIngredient = (idx: number) => {
    setEditIngredients(editIngredients.filter((_, i) => i !== idx))
    setDirty(true)
  }

  const handleSave = async () => {
    if (!currentRecipe) return
    if (!user) { toast('Chưa đăng nhập — vui lòng tải lại trang', 'error'); return }
    const validIngs = editIngredients.filter(i => i.name.trim())
    startLoading()
    try {
      const { data: updated, error } = await sb.from('recipes').update({
        name: editName.trim(),
        base_yield: editYield,
        ingredients: validIngs,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }).eq('id', currentRecipe.id).select().single()
      if (error) {
        toast('Lỗi lưu: ' + error.message, 'error')
      } else if (!updated) {
        toast('Không thể lưu — kiểm tra quyền truy cập trong Supabase', 'error')
      } else {
        setRecipes(prev => prev.map(r => r.id === currentRecipe.id
          ? { ...r, name: editName.trim(), base_yield: editYield, ingredients: validIngs }
          : r
        ))
        await writeAudit('update', 'recipes', String(currentRecipe.id), `Cập nhật công thức: ${editName}`)
        toast('Đã lưu công thức')
        setDirty(false)
      }
    } catch (e) {
      toast('Lỗi: ' + (e as Error).message, 'error')
    }
    stopLoading()
  }

  const handleDelete = async () => {
    if (!currentRecipe) return
    if (!window.confirm(`Xoá công thức "${currentRecipe.name}"?`)) return
    startLoading()
    const { error } = await sb.from('recipes').delete().eq('id', currentRecipe.id)
    if (!error) {
      await writeAudit('delete', 'recipes', String(currentRecipe.id), `Xoá công thức: ${currentRecipe.name}`)
      toast('Đã xoá công thức')
      const remaining = recipes.filter(r => r.id !== currentRecipe.id)
      setRecipes(remaining)
      setCurrentRecipeId(remaining.length > 0 ? remaining[0].id : null)
    } else {
      toast('Lỗi xoá: ' + error.message, 'error')
    }
    stopLoading()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !user) return
    startLoading()
    const { data, error } = await sb.from('recipes').insert({
      name: newName.trim(),
      base_yield: newYield,
      ingredients: [],
      created_by: user.id,
      created_at: new Date().toISOString(),
    }).select().single()
    if (!error && data) {
      await writeAudit('create', 'recipes', String(data.id), `Tạo công thức: ${newName}`)
      setRecipes(prev => [...prev, data as Recipe].sort((a, b) => a.name.localeCompare(b.name)))
      setCurrentRecipeId((data as Recipe).id)
      toast('Đã tạo công thức mới')
      setShowNewForm(false)
      setNewName('')
      setNewYield(1)
    } else if (error) {
      toast('Lỗi tạo: ' + error.message, 'error')
    }
    stopLoading()
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3d1f0a]">📖 Công thức bánh</h2>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-[#c8773a] to-[#e8a44a] text-white text-xs font-medium cursor-pointer hover:opacity-90 hover:-translate-y-px transition-all"
        >
          + Thêm công thức
        </button>
      </div>

      {/* New recipe form */}
      {showNewForm && (
        <div className="bg-[#fffaf4] rounded-2xl p-5 mb-4 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)] animate-fadeIn">
          <h3 className="text-sm font-semibold text-[#3d1f0a] mb-3">Tạo công thức mới</h3>
          <form onSubmit={handleCreate} className="flex gap-2 flex-wrap">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onBlur={e => setNewName(e.target.value.trim())}
              placeholder="Tên công thức..."
              className="flex-1 min-w-[160px] px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
              required
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#8b5e3c] whitespace-nowrap">Số lượng gốc:</label>
              <input
                type="number"
                min={1}
                value={newYield}
                onChange={e => setNewYield(Number(e.target.value))}
                className="w-20 px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
              />
            </div>
            <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-[#c8773a] to-[#e8a44a] text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-all">
              Tạo
            </button>
            <button type="button" onClick={() => setShowNewForm(false)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border-[1.5px] border-[#f5e6cc] text-[#8b5e3c] text-xs font-medium cursor-pointer hover:border-[#c8773a] hover:text-[#c8773a] transition-all">
              Hủy
            </button>
          </form>
        </div>
      )}

      {/* Recipe tabs */}
      {recipes.length === 0 ? (
        <div className="bg-[#fffaf4] rounded-2xl p-8 text-center border border-[#f5e6cc]">
          <div className="text-4xl mb-2">🍞</div>
          <p className="text-sm text-[#8b5e3c]">Chưa có công thức nào. Hãy tạo công thức đầu tiên!</p>
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 flex-wrap mb-4">
            {recipes.map(r => (
              <button
                key={r.id}
                onClick={() => { if (dirty) { if (!window.confirm('Bạn có thay đổi chưa lưu. Tiếp tục?')) return } setCurrentRecipeId(r.id) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                  r.id === currentRecipeId
                    ? 'bg-[#c8773a] text-white border-[#c8773a]'
                    : 'bg-white text-[#8b5e3c] border-[#f5e6cc] hover:border-[#c8773a] hover:text-[#c8773a]'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* Recipe editor */}
          {currentRecipe && (
            <div className="bg-[#fffaf4] rounded-2xl p-5 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
              <div className="flex gap-3 mb-4 flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Tên công thức</label>
                  <input
                    value={editName}
                    onChange={e => { setEditName(e.target.value); setDirty(true) }}
                    onBlur={e => setEditName(e.target.value.trim())}
                    className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Số lượng gốc</label>
                  <input
                    type="number"
                    min={1}
                    value={editYield}
                    onChange={e => { setEditYield(Number(e.target.value)); setDirty(true) }}
                    className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
                  />
                </div>
              </div>

              {/* Ingredients table */}
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-[#8b5e3c] uppercase tracking-wider mb-2">Nguyên liệu</h4>
                <div className="overflow-visible rounded-lg border border-[#f0e8d8]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Nguyên liệu</th>
                        <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc] w-24">Số lượng</th>
                        <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc] w-32">Đơn vị</th>
                        <th className="bg-[#f5e6cc] w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {editIngredients.map((ing, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                            <input
                              value={ing.name}
                              onChange={e => handleIngChange(idx, 'name', e.target.value)}
                              onBlur={e => handleIngChange(idx, 'name', e.target.value.trim())}
                              placeholder="Tên nguyên liệu..."
                              className="w-full px-2 py-1 border-[1.5px] border-[#f5e6cc] rounded text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
                            />
                          </td>
                          <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={ing.amount}
                              onChange={e => handleIngChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border-[1.5px] border-[#f5e6cc] rounded text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
                            />
                          </td>
                          <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                            <select
                              value={ing.unit}
                              onChange={e => handleIngChange(idx, 'unit', e.target.value)}
                              className="w-full px-2 py-1 border-[1.5px] border-[#f5e6cc] rounded text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none"
                            >
                              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-center">
                            <button
                              onClick={() => removeIngredient(idx)}
                              className="bg-transparent border-none text-[#e0a090] text-base cursor-pointer px-1.5 py-0.5 rounded hover:bg-[#fdecea] hover:text-[#c0392b] transition-all"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={addIngredient}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-transparent border-[1.5px] border-dashed border-[#c8773a] rounded-lg text-[#c8773a] text-xs cursor-pointer hover:bg-[#fef4e8] transition-all"
                >
                  + Thêm nguyên liệu
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap pt-2 border-t border-[#f0e8d8]">
                <button
                  onClick={handleSave}
                  disabled={!dirty}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-[#c8773a] to-[#e8a44a] text-white text-xs font-medium cursor-pointer hover:opacity-90 hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💾 Lưu
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border-[1.5px] border-[#e0a090] text-[#d94f3d] text-xs font-medium cursor-pointer hover:bg-[#fdecea] transition-all"
                >
                  🗑 Xoá
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
