'use client'

import { useState, useRef } from 'react'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  required?: boolean
}

const CLOUD_NAME     = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET  = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export default function ImageUpload({ value, onChange, required }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setErr('Chưa cấu hình Cloudinary (thiếu env NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / UPLOAD_PRESET). Liên hệ quản trị viên.')
      return
    }
    if (!file.type.startsWith('image/')) { setErr('Vui lòng chọn file ảnh'); return }
    if (file.size > 10 * 1024 * 1024)   { setErr('Ảnh quá lớn (tối đa 10 MB)'); return }

    setErr('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', UPLOAD_PRESET!)

      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      onChange(json.secure_url)
    } catch (e) {
      setErr('Lỗi tải ảnh: ' + (e as Error).message)
    } finally {
      setUploading(false)
      // reset input để có thể chọn lại cùng file
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
    setErr('')
  }

  return (
    <div className="space-y-2">
      {value ? (
        /* Preview */
        <div className="relative group">
          <img
            src={value}
            alt="Ảnh hoá đơn"
            className="w-full max-h-56 object-contain rounded-xl border border-[#f0e8d8] bg-[#fdf6ec] p-1"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all" />
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white border border-[#f5e6cc] text-[#8b5e3c] text-xs px-2 py-1 rounded-lg hover:border-[#c8773a] hover:text-[#c8773a] transition-all shadow-sm"
            >
              🔄 Đổi ảnh
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="bg-white border border-[#e0a090] text-[#d94f3d] text-xs px-2 py-1 rounded-lg hover:bg-[#fdecea] transition-all shadow-sm"
            >
              🗑 Xoá
            </button>
          </div>
          {/* Link mở ảnh to */}
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 left-2 bg-white/80 text-[#3d1f0a] text-[10px] px-2 py-0.5 rounded-full hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
          >
            🔍 Xem to
          </a>
        </div>
      ) : (
        /* Upload zone */
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors
            ${uploading ? 'cursor-wait bg-[#fef4e8]' : 'cursor-pointer hover:bg-[#fef4e8]'}
            ${required ? 'border-[#e0a090]' : 'border-[#f5e6cc]'}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[#c8773a] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#8b5e3c]">Đang tải lên Cloudinary...</p>
            </div>
          ) : (
            <>
              <div className="text-3xl mb-2">📷</div>
              <p className="text-sm font-medium text-[#3d1f0a]">Click để chọn ảnh hoá đơn</p>
              <p className="text-xs text-[#8b5e3c] mt-1">JPG, PNG, WEBP · tối đa 10 MB</p>
              {required && (
                <p className="text-xs text-[#d94f3d] mt-1 font-medium">* Bắt buộc phải có ảnh</p>
              )}
            </>
          )}
        </div>
      )}

      {err && <p className="text-xs text-[#d94f3d] flex items-center gap-1">⚠️ {err}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
