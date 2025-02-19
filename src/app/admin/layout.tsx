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
  Home,
  ShoppingBag,
  Printer
} from 'lucide-react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'
import { OrderNotification } from '@/components/order-notification'

const menuItems = [
  {
    title: 'Dashboard',
    icon: Home,
    href: '/admin'
  },
  {
    title: 'Pedidos',
    icon: ShoppingBag,
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
    title: 'Impressora',
    icon: Printer,
    href: '/admin/settings/printer'
  },
  {
    title: 'Relatórios',
    icon: ChartBar,
    href: '/admin/reports'
  },
  {
    title: 'Sair',
    icon: LogOut,
    href: '/admin/logout'
  }
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isMounted, setIsMounted] = useState(false)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])

  // Busca o ID do restaurante do usuário logado
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setRestaurantId(user?.id || 'e0dba73b-0870-4b0d-8026-7341db950c16') // ID fixo para desenvolvimento
    }
    getUser()
  }, [supabase])

  // Usa o hook de pedidos em tempo real
  const { newOrder } = useRealtimeOrders(restaurantId || '')

  // Adiciona novos pedidos à lista de pendentes
  useEffect(() => {
    if (newOrder) {
      setPendingOrders(prev => {
        // Verifica se o pedido já existe na lista
        if (!prev.find(order => order._id === newOrder._id)) {
          return [...prev, newOrder]
        }
        return prev
      })
    }
  }, [newOrder])

  // Remove um pedido da lista de pendentes
  const handleCloseOrder = (orderId: string) => {
    setPendingOrders(prev => prev.filter(order => order._id !== orderId))
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/admin/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // Previne renderização no servidor
  if (!isMounted) {
    return null
  }

  // Se estiver na página de login ou signup, não mostra o layout administrativo
  if (pathname === '/admin/login' || pathname === '/admin/signup') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
        <div className="flex h-full flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="border-b border-gray-200 px-6 py-5">
              <h1 className="text-xl font-semibold text-gray-900">
                Painel Admin
              </h1>
            </div>

            {/* Menu */}
            <nav className="p-4">
              <ul className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-green-50 text-green-600'
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

          {/* Logout */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>

      {/* Notificações de Novos Pedidos */}
      <div className="fixed right-4 top-4 z-[9999] flex flex-col gap-4">
        {pendingOrders.map((order, index) => (
          <OrderNotification
            key={order._id}
            order={order}
            onClose={() => handleCloseOrder(order._id)}
            style={{ top: `${index * (24 + 16)}px` }} // 24 = altura do popup, 16 = gap
          />
        ))}
      </div>
    </div>
  )
} 