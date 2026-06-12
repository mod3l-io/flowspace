import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Flowspace Mod3l',
  description: 'Tu espacio de trabajo colaborativo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
