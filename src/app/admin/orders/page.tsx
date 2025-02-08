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
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useSupabase } from '@/contexts/SupabaseContext'
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'
import { OrderNotification } from '@/components/order-notification'
import { Order } from '@/types/order'

// Tipos de status possíveis
const orderStatuses = {
  pendente: {
    label: 'Pendente',
    icon: Clock,
    color: 'text-yellow-500 bg-yellow-50'
  },
  confirmado: {
    label: 'Confirmado',
    icon: CheckCircle2,
    color: 'text-blue-500 bg-blue-50'
  },
  preparando: {
    label: 'Em Preparo',
    icon: ChefHat,
    color: 'text-orange-500 bg-orange-50'
  },
  pronto: {
    label: 'Pronto',
    icon: Package,
    color: 'text-green-500 bg-green-50'
  },
  saiu_para_entrega: {
    label: 'Saiu para Entrega',
    icon: Truck,
    color: 'text-purple-500 bg-purple-50'
  },
  entregue: {
    label: 'Entregue',
    icon: CheckCircle2,
    color: 'text-green-500 bg-green-50'
  },
  cancelado: {
    label: 'Cancelado',
    icon: Ban,
    color: 'text-red-500 bg-red-50'
  },
  rejeitado: {
    label: 'Rejeitado',
    icon: Ban,
    color: 'text-red-500 bg-red-50'
  }
} as const

type OrderStatus = keyof typeof orderStatuses

export default function OrdersPage() {
  const { supabase } = useSupabase()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  // Busca o ID do restaurante do usuário logado
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setRestaurantId(user?.id || 'e0dba73b-0870-4b0d-8026-7341db950c16') // ID fixo para desenvolvimento
    }
    getUser()
  }, [supabase])

  // Usa o hook de pedidos em tempo real
  const { orders, loading, updateOrder } = useRealtimeOrders(restaurantId || '')

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
      return !statusFilter || order.status === statusFilter
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
        return !statusFilter || order.status === statusFilter
      }
    }

    // Prepara os campos de busca normalizados
    const searchFields = [
      normalizeText(order.customer.name || ''),           // Nome do cliente
      normalizeText(order.address?.street || ''),         // Rua
      normalizeText(order.address?.number || ''),         // Número
      normalizeText(order.address?.neighborhood || ''),   // Bairro
      normalizeText(order.address?.city || ''),          // Cidade
      normalizeText(order.address?.state || ''),         // Estado
      normalizeText(order.address?.complement || ''),     // Complemento
      normalizeText(order.payment.method || ''),         // Método de pagamento
      order._id.toString(),                              // ID interno
      order.orderType === 'delivery' ? 'entrega' : 'retirada', // Tipo de pedido
      normalizePhone(order.customer.phone || '')         // Adiciona o telefone normalizado aos campos de busca
    ].filter(Boolean)

    // Verifica se algum campo contém o termo de busca
    const matchesSearch = searchFields.some(field => 
      field.includes(searchTermNormalized)
    )

    // Aplica o filtro de status se estiver selecionado
    return matchesSearch && (!statusFilter || order.status === statusFilter)
  })

  if (!restaurantId || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-600">Gerencie os pedidos do seu restaurante</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, endereço, telefone ou número do pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos os status</option>
            {Object.entries(orderStatuses).map(([value, { label }]) => (
              <option key={`status-${value}`} value={value}>
                {label}
              </option>
            ))}
          </select>
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
                  case 'pending': statusKey = 'pendente'; break;
                  case 'confirmed': statusKey = 'confirmado'; break;
                  case 'preparing': statusKey = 'preparando'; break;
                  case 'ready': statusKey = 'pronto'; break;
                  case 'out_for_delivery': statusKey = 'saiu_para_entrega'; break;
                  case 'delivered': statusKey = 'entregue'; break;
                  case 'cancelled': statusKey = 'cancelado'; break;
                  case 'rejected': statusKey = 'rejeitado'; break;
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
                        {order.orderType === 'delivery' ? 'Entrega' : 'Retirada'}
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
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="text-sm font-medium text-green-600 hover:text-green-700"
                      >
                        Ver detalhes
                      </Link>
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