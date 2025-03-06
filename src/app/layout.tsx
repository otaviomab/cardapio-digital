import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/contexts/SupabaseContext'
import { SocketIOProvider } from '@/components/socket-io-provider'
import { Toaster as ShadcnToaster } from '@/components/ui/toaster'
import { Toaster as HotToaster } from 'react-hot-toast'
import { CacheManager } from '@/components/cache-manager'

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
          <ShadcnToaster />
          <HotToaster position="top-right" toastOptions={{
            duration: 5000,
            style: {
              background: '#fff',
              color: '#333',
              border: '1px solid #eaeaea',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            },
            success: {
              style: {
                border: '1px solid #10b981',
              },
            },
            error: {
              style: {
                border: '1px solid #ef4444',
              },
            },
          }} />
          <CacheManager />
        </SupabaseProvider>
      </body>
    </html>
  )
}
