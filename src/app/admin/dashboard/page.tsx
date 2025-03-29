'use client'

import { useEffect, useState } from 'react'
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Ban,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ChevronRight,
  LayoutDashboard,
  Users
} from 'lucide-react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { getDashboardStats } from '@/lib/api-services'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface Order {
  id: string
  createdAt: string
  status: string
  total: number
  customer: {
    name: string
    phone: string
  }
  items: Array<{
    name: string
    quantity: number
  }>
}

interface DashboardStats {
  todayOrders: number
  activeOrders: number
  todayRevenue: number
  averageTicket: number
  recentOrders: Order[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    activeOrders: 0,
    todayRevenue: 0,
    averageTicket: 0,
    recentOrders: []
  })

  useEffect(() => {
    loadStats()
  }, [supabase])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const dashboardStats = await getDashboardStats(user.id)
      setStats(dashboardStats)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      alert('Erro ao carregar estatísticas. Por favor, tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const statsCards = [
    {
      name: 'Pedidos Hoje',
      value: stats.todayOrders.toString(),
      icon: ShoppingBag,
      trend: 'Hoje'
    },
    {
      name: 'Pedidos em Andamento',
      value: stats.activeOrders.toString(),
      icon: Clock,
      trend: 'Aguardando preparo/entrega'
    },
    {
      name: 'Faturamento do Dia',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(stats.todayRevenue),
      icon: DollarSign,
      trend: `${stats.todayOrders} pedidos`
    },
    {
      name: 'Ticket Médio',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(stats.averageTicket),
      icon: TrendingUp,
      trend: 'Média do dia'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'preparing':
        return 'bg-purple-100 text-purple-800'
      case 'ready':
        return 'bg-krato-100 text-krato-800'
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800'
      case 'delivered':
        return 'bg-krato-100 text-krato-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'confirmed':
        return 'Confirmado'
      case 'preparing':
        return 'Preparando'
      case 'ready':
        return 'Pronto'
      case 'out_for_delivery':
        return 'Saiu para Entrega'
      case 'delivered':
        return 'Entregue'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-krato-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
      </div>

      <div>
        <p className="text-sm text-gray-600 lg:text-base">Visão geral do seu restaurante</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon

          return (
            <div
              key={stat.name}
              className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 lg:p-6"
            >
              <div className="flex items-start gap-3 lg:gap-4">
                <div className="rounded-lg bg-krato-50 p-2 lg:p-3">
                  <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-krato-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-600 lg:text-sm">{stat.name}</p>
                  <p className="mt-1 text-base font-semibold text-gray-900 lg:text-2xl">{stat.value}</p>
                  <p className="mt-1 truncate text-xs text-gray-600 lg:mt-2 lg:text-sm">{stat.trend}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4">
          <h2 className="text-base font-semibold text-gray-900 lg:text-lg">Pedidos Recentes</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recentOrders.length > 0 ? (
            stats.recentOrders.map((order) => (
              <div 
                key={order.id} 
                className="cursor-pointer p-4 transition-colors hover:bg-gray-50 lg:p-6"
                onClick={() => router.push(`/admin/orders/${order.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 lg:h-10 lg:w-10">
                        <ShoppingBag className="h-4 w-4 text-gray-600 lg:h-5 lg:w-5" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-gray-900 lg:text-base">
                          {order.customer.name}
                        </p>
                        <span className="text-xs text-gray-500 lg:text-sm">
                          (#{order.id.slice(-6)})
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        <span className="text-xs text-gray-500 lg:text-sm">
                          {formatDistanceToNow(new Date(order.createdAt), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 lg:text-base">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(order.total)}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 lg:text-sm">
                        {order.items.reduce((acc, item) => acc + item.quantity, 0)} itens
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-gray-600 lg:p-6">
              Nenhum pedido recente encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 