'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ClipboardList, 
  UtensilsCrossed, 
  Settings, 
  ChartBar,
  LogOut,
  Menu,
  AlertCircle
} from 'lucide-react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'
import { OrderNotification } from '@/components/order-notification'
import Image from 'next/image'
import { SocketStatus } from '@/components/socket-status'

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard'
  },
  {
    title: 'Pedidos',
    icon: ClipboardList,
    href: '/admin/orders'
  },
  {
    title: 'Cardápio',
    icon: UtensilsCrossed,
    href: '/admin/menu'
  },
  {
    title: 'Configurações',
    icon: Settings,
    href: '/admin/settings'
  },
  {
    title: 'Relatórios',
    icon: ChartBar,
    href: '/admin/reports'
  }
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isMounted, setIsMounted] = useState(false)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [timestamp] = useState(() => new Date().getTime())
  const [isLoading, setIsLoading] = useState(true)
  const [socketError, setSocketError] = useState<string | null>(null)
  
  // Verifica se estamos em uma página que precisa de pedidos em tempo real
  const needsRealtimeOrders = pathname?.includes('/admin/orders') || pathname?.includes('/admin/dashboard')
  
  // Inicializa o hook sempre, mas ele só fará algo se as condições forem atendidas
  const { newOrder, socketConnected, reactivateSocket } = useRealtimeOrders(restaurantId || '')

  // Marca o componente como montado
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Verifica se o usuário está logado e busca o ID do restaurante
  useEffect(() => {
    const getUser = async () => {
      try {
        setIsLoading(true)
        
        // Adiciona um timeout de segurança para garantir que o loading seja desativado
        const safetyTimeout = setTimeout(() => {
          if (isLoading) {
            console.log('Layout: Timeout de segurança ativado - desativando estado de loading')
            setIsLoading(false)
          }
        }, 3000) // Reduzido para 3 segundos
        
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          console.log('Layout: Usuário autenticado', { userId: user.id })
          setIsLoggedIn(true)
          setRestaurantId(user.id)
        } else {
          console.log('Layout: Usuário não autenticado')
          setIsLoggedIn(false)
          setRestaurantId(null)
          
          // Se não estiver em uma página de login/signup, redireciona imediatamente
          if (pathname !== '/admin/login' && pathname !== '/admin/signup') {
            console.log('Layout: Redirecionando para login (usuário não encontrado)')
            router.push('/admin/login')
          }
        }
        
        // Limpa o timeout de segurança
        clearTimeout(safetyTimeout)
      } catch (error) {
        console.error('Layout: Erro ao verificar usuário', error)
        setIsLoggedIn(false)
        setRestaurantId(null)
      } finally {
        setIsLoading(false)
      }
    }
    
    // Só executa a verificação se o componente estiver montado
    if (isMounted) {
      getUser()
    }
  }, [supabase, isMounted, pathname, router])

  // Efeito adicional para garantir que o loading não fique preso
  useEffect(() => {
    // Se o componente estiver montado e o loading estiver ativo por mais de 5 segundos
    if (isMounted && isLoading) {
      const loadingTimeout = setTimeout(() => {
        console.log('Layout: Detectado loading prolongado, forçando desativação')
        setIsLoading(false)
      }, 5000)
      
      return () => clearTimeout(loadingTimeout)
    }
  }, [isMounted, isLoading])

  // Adiciona novos pedidos à lista de pendentes
  useEffect(() => {
    if (newOrder) {
      setPendingOrders(prev => {
        if (!prev.find(order => order._id === newOrder._id)) {
          return [...prev, newOrder]
        }
        return prev
      })
    }
  }, [newOrder])

  // Monitora o status da conexão do socket
  useEffect(() => {
    if (needsRealtimeOrders && !socketConnected && isLoggedIn && restaurantId) {
      console.log('Layout: Socket não conectado, mas deveria estar')
      setSocketError('Não foi possível estabelecer conexão em tempo real para pedidos')
    } else if (socketConnected) {
      setSocketError(null)
    }
  }, [socketConnected, needsRealtimeOrders, isLoggedIn, restaurantId])

  // Fecha o menu mobile quando mudar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Remove um pedido da lista de pendentes
  const handleCloseOrder = (orderId: string) => {
    setPendingOrders(prev => prev.filter(order => order._id !== orderId))
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/admin/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  if (!isMounted) {
    return null
  }

  // Renderiza apenas o conteúdo para páginas de login/signup
  if (pathname === '/admin/login' || pathname === '/admin/signup') {
    return <>{children}</>
  }

  // Se não estiver logado, mostra um indicador de carregamento enquanto o redirecionamento acontece
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#FE5F02]" />
      </div>
    )
  }

  // Renderiza o layout
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-krato-200 border-t-krato-500"></div>
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn && pathname !== '/admin/login' && pathname !== '/admin/signup') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alerta de erro de conexão do Socket.IO */}
      {socketError && (
        <div className="bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erro de conexão com o servidor de notificações
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Não foi possível conectar ao servidor de notificações. Você pode não receber notificações de novos pedidos.
                </p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    onClick={reactivateSocket}
                    className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                  >
                    Reconectar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Mobile (Branco) */}
      <header className="border-b border-gray-200 bg-white lg:hidden">
        <div className="relative flex h-20 items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          {/* Logo centralizada no mobile */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/admin/dashboard" className="flex items-center">
              <img
                src="/images/logotipo-new2.png"
                alt="Krato"
                className="h-[36px] w-auto" /* Aumentado em mais 10% (de 33px para 36px) */
              />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Botão de logout */}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Header Desktop (Branco) */}
      <header className="hidden border-b border-gray-200 bg-white lg:block">
        <div className="relative flex h-20 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <img
                src="/images/logotipo-new2.png"
                alt="Krato"
                className="h-[58px] w-auto" /* Aumentado em 35% (de 43px para 58px) */
              />
            </Link>
          </div>
            
          {/* Menu Desktop Horizontal Centralizado */}
          <nav className="absolute left-1/2 -translate-x-1/2">
            <ul className="flex items-center space-x-6">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-krato-50 text-krato-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            {/* Botão de logout */}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-md p-2 text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Sair</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Menu Mobile Overlay - Fundo escuro quando o menu está aberto */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Menu Mobile Slide-out - Abre do lado esquerdo */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col justify-between p-4">
          <div>
            <div className="flex justify-between items-center mb-6">
              <Link href="/admin/dashboard" className="flex items-center">
                <img
                  src="/images/logotipo-new2.png"
                  alt="Krato"
                  className="h-[36px] w-auto"
                />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <nav className="py-4">
              <ul className="space-y-3">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-krato-50 text-krato-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {item.title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </div>

      {/* Main Content - Ajustado para centralizar melhor o conteúdo */}
      <main className="min-h-screen pb-20 pt-20 lg:pt-20">
        <div className="px-4 mx-auto max-w-7xl lg:px-6">
          {children}
        </div>
      </main>

      {/* Bottom Navigation Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:hidden">
        <div className="flex items-center justify-around px-2 py-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                  isActive
                    ? 'text-krato-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs">{item.title}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Notificações de Novos Pedidos */}
      <div className="fixed right-4 top-20 z-[9999] flex flex-col gap-4 lg:top-4">
        {pendingOrders.map((order, index) => (
          <OrderNotification
            key={order._id}
            order={order}
            onClose={() => handleCloseOrder(order._id)}
            style={{ top: `${index * (24 + 16)}px` }}
          />
        ))}
      </div>
    </div>
  )
} 