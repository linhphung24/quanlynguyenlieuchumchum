import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/contexts/AppContext'

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
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
    <html lang="vi" className={`${playfairDisplay.variable} ${dmSans.variable}`}>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
