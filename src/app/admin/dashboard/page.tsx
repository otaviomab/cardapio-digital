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
  Users,
  Bell
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
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [isSendingTest, setIsSendingTest] = useState(false)

  useEffect(() => {
    loadStats()
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setRestaurantId(user.id)
        }
      } catch (error) {
        console.error('Erro ao obter usuário:', error)
      }
    }
    getUser()
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

  const handleTestNotification = () => {
    if (!restaurantId) {
      console.error('RestaurantId não disponível para teste')
      return
    }
    
    setIsSendingTest(true)
    console.log('Iniciando teste de notificação para restaurantId:', restaurantId)
    
    try {
      // Verifica se o socket está disponível
      console.log('window.connectSocket disponível?', typeof window !== 'undefined' && !!window.connectSocket)
      
      if (typeof window !== 'undefined' && window.connectSocket) {
        console.log('Usando Socket.IO diretamente')
        
        // Cria uma instância do socket com a URL correta
        const socket = window.connectSocket()
        console.log('Socket criado:', socket)
        
        // Aguarda a conexão antes de enviar o evento
        socket.on('connect', () => {
          console.log('Socket conectado com ID:', socket.id)
          
          // Envia o evento de teste
          socket.emit('test-notification', { 
            restaurantId,
            orderType: 'delivery' // Define o tipo de pedido como entrega
          })
          console.log('Evento test-notification emitido')
        })
        
        socket.on('test-notification-sent', (data) => {
          console.log('Notificação de teste enviada:', data)
          setIsSendingTest(false)
          socket.disconnect()
        })
        
        socket.on('test-notification-error', (error) => {
          console.error('Erro na notificação de teste:', error)
          setIsSendingTest(false)
          socket.disconnect()
        })
        
        socket.on('connect_error', (error) => {
          console.error('Erro ao conectar ao Socket.IO:', error)
          setIsSendingTest(false)
          socket.disconnect()
          
          // Tenta via API como fallback
          useFallbackApi()
        })
        
        // Timeout para garantir que não ficará esperando indefinidamente
        setTimeout(() => {
          if (isSendingTest) {
            console.log('Timeout atingido, usando API como fallback')
            setIsSendingTest(false)
            socket.disconnect()
            // Tenta via API como fallback
            useFallbackApi()
          }
        }, 5000)
      } else {
        console.log('Socket.IO não disponível, usando API')
        useFallbackApi()
      }
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error)
      setIsSendingTest(false)
      
      // Tenta via API como fallback em caso de erro
      useFallbackApi()
    }
  }
  
  // Função para usar a API como fallback
  const useFallbackApi = () => {
    console.log('Enviando notificação via API')
    fetch('/api/socket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: `new-order-${restaurantId}`,
        room: restaurantId,
        data: {
          _id: `test-${Date.now()}`,
          restaurantId,
          customer: {
            name: 'Cliente de Teste',
            phone: '(11) 99999-9999'
          },
          items: [
            {
              name: 'Produto de Teste',
              price: 10,
              quantity: 1
            }
          ],
          total: 10,
          status: 'pending',
          orderType: 'delivery',
          deliveryMethod: 'delivery',
          address: {
            street: 'Rua de Teste',
            number: '123',
            complement: 'Apto 45',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            cep: '01001-000'
          },
          deliveryAddress: {
            street: 'Rua de Teste',
            number: '123',
            complement: 'Apto 45',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01001-000'
          },
          createdAt: new Date().toISOString()
        }
      }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Notificação de teste enviada via API:', data)
      setIsSendingTest(false)
    })
    .catch(error => {
      console.error('Erro ao enviar notificação de teste via API:', error)
      setIsSendingTest(false)
    })
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
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Teste simples para verificar se o Socket.IO está funcionando
              if (typeof window !== 'undefined' && window.connectSocket) {
                const socket = window.connectSocket()
                console.log('Socket criado para teste simples:', socket)
                
                socket.on('connect', () => {
                  console.log('Socket conectado com ID:', socket.id)
                  alert('Socket.IO conectado com sucesso! ID: ' + socket.id)
                  socket.disconnect()
                })
                
                socket.on('connect_error', (error) => {
                  console.error('Erro ao conectar ao Socket.IO:', error)
                  alert('Erro ao conectar ao Socket.IO: ' + error.message)
                  socket.disconnect()
                })
              } else {
                alert('Socket.IO não está disponível no cliente')
              }
            }}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            Testar Socket
          </button>
          
          <button
            onClick={handleTestNotification}
            disabled={isSendingTest || !restaurantId}
            className="flex items-center gap-2 rounded-lg bg-krato-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-krato-600 disabled:opacity-50"
          >
            <Bell className="h-4 w-4" />
            {isSendingTest ? 'Enviando...' : 'Testar Notificação'}
          </button>
        </div>
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