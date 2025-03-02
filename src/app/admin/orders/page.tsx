'use client'

import { useState, useEffect } from 'react'
import { 
  Clock, 
  CheckCircle2, 
  Ban, 
  ChefHat,
  Package,
  Truck,
  Search,
  Filter,
  AlertCircle,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { useSupabase } from '@/contexts/SupabaseContext'
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'
import { OrderNotification } from '@/components/order-notification'
import { Order } from '@/types/order'
import { useRouter } from 'next/navigation'

// Tipos de status possíveis
const orderStatuses = {
  pending: { label: 'Aguardando', color: 'text-yellow-500', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'text-blue-500', icon: CheckCircle2 },
  preparing: { label: 'Preparando', color: 'text-orange-500', icon: ChefHat },
  ready: { label: 'Pronto', color: 'text-purple-500', icon: Package },
  out_for_delivery: { label: 'Saiu para Entrega', color: 'text-blue-500', icon: Truck },
  delivered: { label: 'Entregue', color: 'text-green-500', icon: CheckCircle2 },
  completed: { label: 'Retirado', color: 'text-green-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'text-red-500', icon: Ban },
  rejected: { label: 'Rejeitado', color: 'text-red-500', icon: Ban }
} as const

type OrderStatus = keyof typeof orderStatuses

// Adiciona o mapeamento de métodos de pagamento
const paymentMethods = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  cash: 'Dinheiro',
  meal_voucher: 'Vale-Refeição',
  // Compatibilidade com formatos antigos
  credit: 'Cartão de Crédito',
  debit: 'Cartão de Débito',
  wallet: 'Vale-Refeição'
} as const

export default function OrdersPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [dateFilter, setDateFilter] = useState('today')
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  
  // Inicializa o hook apenas quando tivermos o restaurantId
  const { orders, loading, updateOrder } = useRealtimeOrders(restaurantId || '')

  // Função para atualizar o status do pedido
  const handleUpdateStatus = async (status: 'confirmed' | 'rejected') => {
    if (!selectedOrder) return

    try {
      const response = await fetch(`/api/mongodb?action=updateOrderStatus&id=${selectedOrder._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          message: status === 'confirmed' 
            ? 'Pedido confirmado pelo restaurante'
            : 'Pedido recusado pelo restaurante',
          statusUpdates: selectedOrder.statusUpdates || [{
            status: selectedOrder.status,
            message: 'Status inicial do pedido',
            timestamp: selectedOrder.createdAt
          }]
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar status')
      }

      if (status === 'confirmed') {
        router.push(`/admin/orders/${selectedOrder._id}`)
      }
    } catch (error) {
      console.error('OrdersPage: Erro ao atualizar pedido:', error)
      alert('Erro ao atualizar pedido. Tente novamente.')
    }
  }

  // Marca o componente como montado
  useEffect(() => {
    setIsMounted(true)
    
    // Verifica se o usuário está logado e busca o ID do restaurante
    const getUser = async () => {
      try {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          console.log('OrdersPage: Usuário autenticado', { userId: user.id })
          setIsLoggedIn(true)
          setRestaurantId(user.id)
        } else {
          console.log('OrdersPage: Usuário não autenticado')
          setIsLoggedIn(false)
          setRestaurantId(null)
          // Não redirecionamos aqui, deixamos o layout fazer isso
        }
      } catch (error) {
        console.error('OrdersPage: Erro ao verificar usuário', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    getUser()
  }, [supabase])

  // Adicione um console.log para depuração
  useEffect(() => {
    if (isMounted) {
      console.log('OrdersPage: Estado da página de pedidos:', {
        isLoggedIn,
        restaurantId,
        isMounted,
        ordersCount: orders.length,
        loading,
        isLoading,
        pathname: window.location.pathname
      })
    }
  }, [isLoggedIn, restaurantId, isMounted, orders.length, loading, isLoading])

  // Função para gerar o número do pedido baseado na data e ordem de criação
  const generateOrderNumber = (order: Order) => {
    const orderDate = new Date(order.createdAt)
    
    // Agrupa pedidos do mesmo dia
    const ordersFromSameDay = orders.filter(o => {
      const date = new Date(o.createdAt)
      return date.toDateString() === orderDate.toDateString()
    })

    // Ordena os pedidos do dia por data de criação
    ordersFromSameDay.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    // Encontra a posição do pedido atual
    const orderPosition = ordersFromSameDay.findIndex(o => o._id === order._id) + 1

    // Formata o número do pedido: ID + número sequencial do dia
    return orderPosition.toString().padStart(2, '0')
  }

  // Filtra os pedidos baseado na busca e status
  const filteredOrders = orders.filter(order => {
    // Se não houver termo de busca, só aplica o filtro de status
    if (!searchTerm) {
      return statusFilter === 'all' || order.status === statusFilter
    }

    // Verifica se é uma busca por número de pedido (apenas números)
    const isOrderNumberSearch = /^\d+$/.test(searchTerm)
    
    if (isOrderNumberSearch) {
      // Para busca de número de pedido, considera apenas pedidos de hoje
      const today = new Date()
      const orderDate = new Date(order.createdAt)
      const isToday = orderDate.toDateString() === today.toDateString()
      
      if (!isToday) return false

      const orderNumber = generateOrderNumber(order)
      return orderNumber === searchTerm.padStart(2, '0')
    }

    // Normaliza o termo de busca (remove acentos, espaços extras e converte para minúsculo)
    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, ' ')
    }

    // Função para normalizar número de telefone (remove tudo exceto números)
    const normalizePhone = (phone: string) => {
      return phone?.replace(/\D/g, '') || ''
    }

    // Normaliza o termo de busca
    const searchTermNormalized = normalizeText(searchTerm)
    const searchTermNumbers = normalizePhone(searchTerm)

    // Se o termo de busca contém números, tenta buscar por telefone
    if (searchTermNumbers.length > 0) {
      const customerPhone = normalizePhone(order.customer.phone)
      
      // Debug logs
      console.log('Busca por telefone:', {
        termoBusca: searchTerm,
        numerosBusca: searchTermNumbers,
        telefoneCliente: order.customer.phone,
        telefoneLimpo: customerPhone,
        encontrou: customerPhone.includes(searchTermNumbers)
      })

      // Verifica se o número buscado está contido no telefone do cliente
      if (customerPhone.includes(searchTermNumbers)) {
        return statusFilter === 'all' || order.status === statusFilter
      }
    }

    // Prepara os campos de busca normalizados
    const searchFields = [
      normalizeText(order.customer.name || ''),           // Nome do cliente
      normalizeText(order.deliveryAddress?.street || ''),         // Rua
      normalizeText(order.deliveryAddress?.number || ''),         // Número
      normalizeText(order.deliveryAddress?.neighborhood || ''),   // Bairro
      normalizeText(order.deliveryAddress?.city || ''),          // Cidade
      normalizeText(order.deliveryAddress?.state || ''),         // Estado
      normalizeText(order.deliveryAddress?.complement || ''),     // Complemento
      normalizeText(order.paymentMethod || order.payment?.method || ''),         // Método de pagamento
      order._id.toString(),                              // ID interno
      order.deliveryMethod === 'delivery' ? 'entrega' : 'retirada', // Tipo de pedido
      normalizePhone(order.customer.phone || '')         // Adiciona o telefone normalizado aos campos de busca
    ].filter(Boolean)

    // Verifica se algum campo contém o termo de busca
    const matchesSearch = searchFields.some(field => 
      field.includes(searchTermNormalized)
    )

    // Aplica o filtro de status se estiver selecionado
    return matchesSearch && (statusFilter === 'all' || order.status === statusFilter)
  })

  // Função para lidar com o clique em "Ver detalhes"
  const handleViewDetails = (order: Order) => {
    if (order.status === 'pending') {
      setSelectedOrder(order)
    } else {
      router.push(`/admin/orders/${order._id}`)
    }
  }

  if (!restaurantId || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-krato-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {selectedOrder && (
        <OrderNotification
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAccept={async () => {
            await handleUpdateStatus('confirmed')
            setSelectedOrder(null)
          }}
          onReject={async () => {
            await handleUpdateStatus('rejected')
            setSelectedOrder(null)
          }}
        />
      )}

      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">Pedidos</h1>
            <p className="text-gray-600">Gerencie os pedidos do seu restaurante</p>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-600 focus:outline-none"
              >
                <option value="all">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="preparing">Preparando</option>
                <option value="ready">Pronto</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-600 focus:outline-none"
              >
                <option value="today">Hoje</option>
                <option value="yesterday">Ontem</option>
                <option value="last7days">Últimos 7 dias</option>
                <option value="last30days">Últimos 30 dias</option>
                <option value="all">Todos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">
                  Pedido
                </th>
                <th className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">
                  Cliente
                </th>
                <th className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">
                  Status
                </th>
                <th className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">
                  Tipo
                </th>
                <th className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">
                  Pagamento
                </th>
                <th className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">
                  Total
                </th>
                <th className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">
                  Data
                </th>
                <th className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                // Mapeia os status antigos para os novos
                let statusKey = order.status
                switch (order.status) {
                  case 'pending': statusKey = 'pending'; break;
                  case 'confirmed': statusKey = 'confirmed'; break;
                  case 'preparing': statusKey = 'preparing'; break;
                  case 'ready': statusKey = 'ready'; break;
                  case 'out_for_delivery': statusKey = 'out_for_delivery'; break;
                  case 'delivered': statusKey = 'delivered'; break;
                  case 'completed': statusKey = 'completed'; break;
                  case 'cancelled': statusKey = 'cancelled'; break;
                  case 'rejected': statusKey = 'rejected'; break;
                }

                const status = orderStatuses[statusKey as OrderStatus] || {
                  label: `Status: ${statusKey}`,
                  icon: AlertCircle,
                  color: 'text-gray-500 bg-gray-50'
                }
                const StatusIcon = status.icon

                return (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          Pedido #{generateOrderNumber(order)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm text-gray-900">{order.customer.name}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${status.color}`} />
                        <span className="text-sm text-gray-900">{status.label}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {order.deliveryMethod === 'delivery' ? 'Entrega' : 'Retirada'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {paymentMethods[(order.paymentMethod || order.payment?.method) as keyof typeof paymentMethods] || 'Não definido'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(order.total)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="text-sm font-medium text-green-600 hover:text-green-700"
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-600">
            Nenhum pedido encontrado.
          </div>
        )}
      </div>
    </div>
  )
} 