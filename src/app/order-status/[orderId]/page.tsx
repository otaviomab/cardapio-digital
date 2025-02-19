'use client'

import { useEffect, useState, use } from 'react'
import { Order } from '@/types/order'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  Package,
  Truck,
  MapPin,
  AlertCircle,
  User,
  Phone,
  Store,
} from 'lucide-react'

interface OrderStatusPageProps {
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
  pending: 'text-yellow-500',
  confirmed: 'text-green-500',
  rejected: 'text-red-500',
  preparing: 'text-blue-500',
  ready: 'text-green-500',
  out_for_delivery: 'text-blue-500',
  delivered: 'text-green-500',
  completed: 'text-green-500',
  cancelled: 'text-red-500',
}

export default function OrderStatusPage({ params }: OrderStatusPageProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { orderId } = use(params)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || orderId === 'undefined') {
        setError('ID do pedido inválido')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        console.log('Buscando pedido:', orderId)
        
        const response = await fetch(`/api/mongodb?action=getOrder&id=${orderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          const data = await response.json()
          console.error('Erro na resposta:', data)
          throw new Error(data.error || 'Erro ao carregar pedido')
        }

        const data = await response.json()

        if (!data) {
          console.error('Pedido não encontrado')
          throw new Error('Pedido não encontrado')
        }

        console.log('Pedido carregado:', data)
        setOrder(data)
        setError(null)
      } catch (err) {
        console.error('Erro ao carregar pedido:', err)
        setOrder(null)
        setError(err instanceof Error ? err.message : 'Erro ao carregar pedido')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()

    // Configura polling para atualizar o status do pedido
    const interval = setInterval(fetchOrder, 10000) // Atualiza a cada 10 segundos

    return () => clearInterval(interval)
  }, [orderId])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-lg font-medium text-zinc-900">{error}</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Não foi possível carregar as informações do pedido. Por favor, verifique se o link está correto.
          </p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
          <h1 className="mt-4 text-lg font-medium text-zinc-900">Pedido não encontrado</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Não foi possível encontrar o pedido solicitado. Por favor, verifique se o número do pedido está correto.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Status Atual */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`${statusColors[order.status]}`}>
              {(() => {
                const StatusIcon = statusIcons[order.status]
                return <StatusIcon className="h-8 w-8" />
              })()}
            </div>
            <div>
              <h1 className="text-lg font-medium text-zinc-900">
                {statusMessages[order.status]}
              </h1>
              <p className="text-sm text-zinc-600">
                Pedido #{order._id}
              </p>
            </div>
          </div>

          {/* Tempo estimado (apenas para alguns status) */}
          {['confirmed', 'preparing'].includes(order.status) && (
            <div className="mt-4 rounded-lg bg-zinc-50 p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-zinc-400" />
                <span className="text-sm text-zinc-600">
                  Tempo estimado: 30-45 minutos
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dados do Cliente */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-zinc-900">Dados do Cliente</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-zinc-400" />
              <span className="text-sm text-zinc-900">{order.customer.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-zinc-400" />
              <span className="text-sm text-zinc-900">{order.customer.phone}</span>
            </div>
            {order.orderType === 'delivery' && order.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-zinc-400" />
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-900">
                    {order.address.street}, {order.address.number}
                    {order.address.complement && ` - ${order.address.complement}`}
                  </span>
                  <span className="text-sm text-zinc-600">
                    {order.address.neighborhood}
                  </span>
                  <span className="text-sm text-zinc-600">
                    {order.address.city}/{order.address.state}
                  </span>
                  <span className="text-sm text-zinc-600">
                    CEP: {order.address.cep}
                  </span>
                </div>
              </div>
            )}
            {order.orderType === 'pickup' && (
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-zinc-400" />
                <span className="text-sm text-zinc-900">Retirada no local</span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline de Status */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-zinc-900">Atualizações do Pedido</h2>

          <div className="mt-6 space-y-6">
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

        {/* Detalhes do Pedido */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-zinc-900">Detalhes do Pedido</h2>

          <div className="mt-6 space-y-6">
            {/* Itens */}
            <div>
              <h3 className="text-sm font-medium text-zinc-900">Itens</h3>
              <div className="mt-2 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-zinc-600">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-zinc-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Valores */}
            <div className="border-t border-zinc-200 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">Subtotal</span>
                  <span className="text-zinc-900">
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

            {/* Endereço de Entrega */}
            {order.address && (
              <div className="border-t border-zinc-200 pt-4">
                <h3 className="text-sm font-medium text-zinc-900">Endereço de Entrega</h3>
                <p className="mt-2 text-sm text-zinc-600">
                  {order.address.street}, {order.address.number}
                  {order.address.complement && ` - ${order.address.complement}`}
                  <br />
                  {order.address.neighborhood} - {order.address.city}/{order.address.state}
                  <br />
                  CEP: {order.address.cep}
                </p>
              </div>
            )}

            {/* Forma de Pagamento */}
            <div className="border-t border-zinc-200 pt-4">
              <h3 className="text-sm font-medium text-zinc-900">Forma de Pagamento</h3>
              <p className="mt-2 text-sm text-zinc-600">
                {order.payment.method === 'credit' && 'Cartão de Crédito'}
                {order.payment.method === 'debit' && 'Cartão de Débito'}
                {order.payment.method === 'pix' && 'PIX'}
                {order.payment.method === 'cash' && 'Dinheiro'}
                {order.payment.method === 'wallet' && 'Vale-Refeição'}
                {order.payment.change && ` (Troco para ${order.payment.change})`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 