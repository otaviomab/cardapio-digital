import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/contexts/SupabaseContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cardápio Digital',
  description: 'Plataforma de cardápio digital para restaurantes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <SupabaseProvider>
          <main className="min-h-screen bg-zinc-50">
            {children}
          </main>
        </SupabaseProvider>
      </body>
    </html>
  )
}
