import type { Metadata } from 'next'
import { Be_Vietnam_Pro, Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/contexts/AppContext'

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Quản lý kho - Quản lý tiệm bánh',
  description: 'Ứng dụng quản lý tiệm bánh Việt Nam',
  // Xác thực quyền sở hữu domain với Zalo (cách thẻ meta)
  other: {
    'zalo-platform-site-verification': 'UlYFSx_f6r9aueDnvFSbAI3XiJNCbsHYDZGu',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${inter.variable}`}>
      <body className="antialiased font-sans">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
