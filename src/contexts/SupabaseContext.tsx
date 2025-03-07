'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter, usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

const Context = createContext<any>(null)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Mudança de estado de autenticação:', event, 'Pathname atual:', pathname)
      
      // Atualiza o estado da aplicação
      router.refresh()
      
      // Se o usuário fez logout, redireciona para a página de login apenas se estiver na área admin
      if (event === 'SIGNED_OUT' && pathname?.startsWith('/admin')) {
        console.log('Usuário deslogado na área admin, redirecionando para login')
        router.push('/admin/login')
      }
      
      // Se o usuário fez login, não fazemos nada aqui
      // O redirecionamento é tratado na página de login para evitar conflitos
      if (event === 'SIGNED_IN') {
        console.log('Usuário logado, atualizando estado da aplicação')
        // Não redirecionamos aqui para evitar conflito com o redirecionamento na página de login
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase, pathname])

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === null) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
} 