'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'

type AuthMode = 'login' | 'register' | 'forgot'

export default function AuthScreen() {
  const { sb, toast } = useApp()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast('Vui lòng nhập đầy đủ thông tin', 'error'); return }
    setLoading(true)
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) toast('Đăng nhập thất bại: ' + error.message, 'error')
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !fullName) { toast('Vui lòng nhập đầy đủ thông tin', 'error'); return }
    if (password.length < 6) { toast('Mật khẩu tối thiểu 6 ký tự', 'error'); return }
    setLoading(true)
    const { data, error } = await sb.auth.signUp({ email, password })
    if (error) {
      toast('Đăng ký thất bại: ' + error.message, 'error')
      setLoading(false)
      return
    }
    if (data.user) {
      await sb.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName.trim(),
        role: 'staff',
      })
      toast('Đăng ký thành công! Vui lòng đăng nhập.')
      setMode('login')
    }
    setLoading(false)
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { toast('Nhập email để đặt lại mật khẩu', 'error'); return }
    setLoading(true)
    const { error } = await sb.auth.resetPasswordForEmail(email)
    if (error) {
      toast('Lỗi: ' + error.message, 'error')
    } else {
      setForgotSent(true)
      toast('Email đặt lại mật khẩu đã được gửi')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-[rgba(253,246,236,0.97)] z-[900] flex items-center justify-center p-5 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl animate-float inline-block mb-2">🥐</div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#3d1f0a]">Chum Chum Bakery</h1>
          <p className="text-xs text-[#8b5e3c] mt-1">Quản lý kho tiệm bánh chum chum </p>
        </div>

        <div className="bg-[#fffaf4] rounded-2xl p-6 border border-[#f5e6cc] shadow-[0_8px_40px_rgba(200,119,58,0.12)]">
          {/* Tab switcher */}
          <div className="flex gap-1 mb-6 bg-[#fdf6ec] rounded-xl p-1">
            {(['login', 'register'] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setForgotSent(false) }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  mode === m
                    ? 'bg-white text-[#c8773a] shadow-sm border border-[#f5e6cc]'
                    : 'text-[#8b5e3c] hover:text-[#c8773a]'
                }`}
              >
                {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </button>
            ))}
          </div>

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8b5e3c] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-[9px] text-sm font-sans text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8b5e3c] mb-1.5">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-[9px] text-sm font-sans text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors bg-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-br from-[#c8773a] to-[#e8a44a] border-none rounded-xl text-white text-sm font-semibold cursor-pointer hover:opacity-90 hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="w-full text-center text-xs text-[#8b5e3c] hover:text-[#c8773a] transition-colors cursor-pointer bg-transparent border-none"
              >
                Quên mật khẩu?
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8b5e3c] mb-1.5">Họ tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-[9px] text-sm font-sans text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8b5e3c] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-[9px] text-sm font-sans text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8b5e3c] mb-1.5">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-[9px] text-sm font-sans text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors bg-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-br from-[#c8773a] to-[#e8a44a] border-none rounded-xl text-white text-sm font-semibold cursor-pointer hover:opacity-90 hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <div>
              {forgotSent ? (
                <div className="text-center py-4">
                  <div className="text-3xl mb-3">📧</div>
                  <p className="text-sm text-[#3d1f0a] font-medium mb-1">Email đã được gửi!</p>
                  <p className="text-xs text-[#8b5e3c] mb-4">Kiểm tra hộp thư để đặt lại mật khẩu.</p>
                  <button
                    onClick={() => { setMode('login'); setForgotSent(false) }}
                    className="text-xs text-[#c8773a] hover:underline cursor-pointer bg-transparent border-none"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <p className="text-xs text-[#8b5e3c] mb-3">Nhập email để nhận link đặt lại mật khẩu.</p>
                  <div>
                    <label className="block text-xs font-medium text-[#8b5e3c] mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-[9px] text-sm font-sans text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors bg-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-br from-[#c8773a] to-[#e8a44a] border-none rounded-xl text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Đang gửi...' : 'Gửi email'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-center text-xs text-[#8b5e3c] hover:text-[#c8773a] transition-colors cursor-pointer bg-transparent border-none"
                  >
                    Quay lại đăng nhập
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
