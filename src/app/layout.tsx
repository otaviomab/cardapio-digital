import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/contexts/SupabaseContext'
import { SocketIOProvider } from '@/components/socket-io-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Krato - Cardápio Digital',
  description: 'Plataforma de cardápio digital para seu restaurante',
  icons: {
    icon: [
      {
        url: '/icon.png',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/apple-icon.png',
        type: 'image/png',
        sizes: '180x180',
      },
    ],
    apple: [
      {
        url: '/apple-icon.png',
        sizes: '180x180',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.png" type="image/png" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <SupabaseProvider>
          <SocketIOProvider />
          <main className="min-h-screen bg-zinc-50">
            {children}
          </main>
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  )
}
