'use client'

import { useEffect, useState, use } from 'react'
import { Order } from '@/types/order'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  Package,
  Truck,
  MapPin,
  AlertCircle,
  ArrowLeft,
  User,
  Phone,
  CreditCard
} from 'lucide-react'

interface OrderDetailsPageProps {
  params: Promise<{
    orderId: string
  }>
}

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle2,
  rejected: XCircle,
  preparing: ChefHat,
  ready: Package,
  out_for_delivery: Truck,
  delivered: MapPin,
  completed: CheckCircle2,
  cancelled: AlertCircle,
}

const statusMessages = {
  pending: 'Aguardando confirmação do restaurante',
  confirmed: 'Pedido confirmado',
  rejected: 'Pedido recusado pelo restaurante',
  preparing: 'Pedido em preparação',
  ready: 'Pronto para entrega/retirada',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Pedido entregue',
  completed: 'Pedido finalizado',
  cancelled: 'Pedido cancelado',
}

const statusColors = {
  pending: 'text-yellow-500 bg-yellow-50',
  confirmed: 'text-blue-500 bg-blue-50',
  rejected: 'text-red-500 bg-red-50',
  preparing: 'text-orange-500 bg-orange-50',
  ready: 'text-green-500 bg-green-50',
  out_for_delivery: 'text-purple-500 bg-purple-50',
  delivered: 'text-green-500 bg-green-50',
  completed: 'text-green-500 bg-green-50',
  cancelled: 'text-red-500 bg-red-50',
}

const paymentMethods = {
  credit_card: {
    label: 'Cartão de Crédito',
    icon: CreditCard,
    color: 'text-blue-600'
  },
  debit_card: {
    label: 'Cartão de Débito',
    icon: CreditCard,
    color: 'text-green-600'
  },
  pix: {
    label: 'PIX',
    icon: CreditCard,
    color: 'text-purple-600'
  },
  cash: {
    label: 'Dinheiro',
    icon: CreditCard,
    color: 'text-gray-600',
    hasChange: true
  },
  meal_voucher: {
    label: 'Vale-Refeição',
    icon: CreditCard,
    color: 'text-orange-600'
  }
} as const

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const { orderId } = use(params)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/mongodb?action=getOrder&id=${orderId}`)
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao carregar pedido')
        }

        const data = await response.json()
        if (!data) {
          throw new Error('Pedido não encontrado')
        }

        setOrder(data)
      } catch (err) {
        console.error('Erro ao carregar pedido:', err)
        setError('Erro ao carregar pedido')
      }
    }

    fetchOrder()

    // Configura polling para atualizar o status do pedido
    const interval = setInterval(fetchOrder, 10000) // Atualiza a cada 10 segundos

    return () => clearInterval(interval)
  }, [orderId])

  // Define quais status estão disponíveis para transição
  const getAvailableStatuses = (currentStatus: string, orderType: string) => {
    switch (currentStatus) {
      case 'pending':
        return ['confirmed', 'rejected']
      case 'confirmed':
        return ['preparing']
      case 'preparing':
        return ['ready']
      case 'ready':
        return orderType === 'delivery' ? ['out_for_delivery'] : ['delivered']
      case 'out_for_delivery':
        return ['delivered']
      default:
        return []
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/mongodb?action=updateOrderStatus&id=${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          message: statusMessages[newStatus as keyof typeof statusMessages]
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar status')
      }

      // Atualiza o pedido localmente
      setOrder(prev => {
        if (!prev) return null
        return {
          ...prev,
          status: newStatus,
          statusUpdates: [
            ...prev.statusUpdates,
            {
              status: newStatus,
              timestamp: new Date(),
              message: statusMessages[newStatus as keyof typeof statusMessages]
            }
          ]
        }
      })
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      alert('Erro ao atualizar status do pedido')
    } finally {
      setIsUpdating(false)
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-lg font-medium text-zinc-900">{error}</h1>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-green-600" />
      </div>
    )
  }

  const availableStatuses = getAvailableStatuses(order.status, order.orderType)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="mb-4 flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para pedidos
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Pedido #{order._id}</h1>
        </div>

        {/* Status Atual */}
        <div className={`rounded-lg ${statusColors[order.status]} px-4 py-2`}>
          <div className="flex items-center gap-2">
            {(() => {
              const StatusIcon = statusIcons[order.status as keyof typeof statusIcons]
              return <StatusIcon className="h-5 w-5" />
            })()}
            <span className="font-medium">{statusMessages[order.status]}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Detalhes do Cliente */}
        <div className="space-y-6">
          {/* Informações do Cliente */}
          <div className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-6 py-4">
              <h2 className="font-semibold text-zinc-900">Informações do Cliente</h2>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-zinc-900">{order.customer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-zinc-900">{order.customer.phone}</span>
                </div>
                {order.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-zinc-900">
                      {order.address.street}, {order.address.number}
                      {order.address.complement && ` - ${order.address.complement}`}
                      <br />
                      {order.address.neighborhood} - {order.address.city}/{order.address.state}
                      <br />
                      CEP: {order.address.cep}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CreditCard className={`h-4 w-4 ${
                    paymentMethods[order.payment.method as keyof typeof paymentMethods]?.color || 'text-zinc-400'
                  }`} />
                  <span className="text-sm text-zinc-900">
                    {paymentMethods[order.payment.method as keyof typeof paymentMethods]?.label || 'Método não definido'}
                    {order.payment.method === 'cash' && order.payment.change && ` (Troco para R$ ${order.payment.change})`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Atualizar Status */}
          {availableStatuses.length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-white">
              <div className="border-b border-zinc-200 px-6 py-4">
                <h2 className="font-semibold text-zinc-900">Atualizar Status</h2>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-3">
                  {availableStatuses.map((statusKey) => {
                    const StatusIcon = statusIcons[statusKey as keyof typeof statusIcons]
                    return (
                      <button
                        key={statusKey}
                        onClick={() => handleUpdateStatus(statusKey)}
                        disabled={isUpdating}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors
                          ${statusColors[statusKey as keyof typeof statusColors]} border-transparent`}
                      >
                        <StatusIcon className="h-4 w-4" />
                        {statusMessages[statusKey as keyof typeof statusMessages]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Timeline de Status */}
          <div className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-6 py-4">
              <h2 className="font-semibold text-zinc-900">Atualizações do Pedido</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {order.statusUpdates.map((update, index) => {
                  const StatusIcon = statusIcons[update.status]
                  return (
                    <div key={index} className="flex gap-4">
                      <div className={`${statusColors[update.status]}`}>
                        <StatusIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900">
                          {update.message}
                        </p>
                        <p className="text-sm text-zinc-600">
                          {formatDistanceToNow(new Date(update.timestamp), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Itens do Pedido */}
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-6 py-4">
            <h2 className="font-semibold text-zinc-900">Itens do Pedido</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={`item-${item.id || Math.random()}`} className="flex justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {item.quantity}x {item.name}
                    </p>
                    {item.observation && (
                      <p className="text-sm text-zinc-600">Obs: {item.observation}</p>
                    )}
                    {item.additions?.map((addition) => (
                      <p key={`addition-${addition.id || addition.name}`} className="text-sm text-zinc-600">
                        + {addition.name}
                      </p>
                    ))}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(item.price * item.quantity)}
                    </p>
                    {item.additions?.map((addition) => (
                      <p key={`addition-price-${addition.id || addition.name}`} className="text-sm text-zinc-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(addition.price)}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              <div className="border-t border-zinc-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-zinc-900">Subtotal</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(order.subtotal)}
                  </span>
                </div>

                {order.deliveryFee && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Taxa de entrega</span>
                    <span className="text-zinc-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(order.deliveryFee)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-medium">
                  <span className="text-zinc-900">Total</span>
                  <span className="text-zinc-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 