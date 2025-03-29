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
  CreditCard,
  QrCode,
  Banknote,
  Wallet
} from 'lucide-react'

// Função auxiliar para formatar moeda
const formatCurrency = (value?: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

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
  confirmed: 'text-krato-500',
  rejected: 'text-red-500',
  preparing: 'text-krato-500',
  ready: 'text-krato-500',
  out_for_delivery: 'text-blue-500',
  delivered: 'text-krato-500',
  completed: 'text-krato-500',
  cancelled: 'text-red-500',
}

// Adiciona o mapeamento de métodos de pagamento
const paymentMethods = {
  credit_card: {
    label: 'Cartão de Crédito',
    icon: <CreditCard className="h-5 w-5 text-zinc-400" />
  },
  debit_card: {
    label: 'Cartão de Débito',
    icon: <CreditCard className="h-5 w-5 text-zinc-400" />
  },
  pix: {
    label: 'PIX',
    icon: <QrCode className="h-5 w-5 text-zinc-400" />
  },
  cash: {
    label: 'Dinheiro',
    icon: <Banknote className="h-5 w-5 text-zinc-400" />
  },
  meal_voucher: {
    label: 'Vale-Refeição',
    icon: <Wallet className="h-5 w-5 text-zinc-400" />
  },
  // Compatibilidade com formatos antigos
  credit: {
    label: 'Cartão de Crédito',
    icon: <CreditCard className="h-5 w-5 text-zinc-400" />
  },
  debit: {
    label: 'Cartão de Débito',
    icon: <CreditCard className="h-5 w-5 text-zinc-400" />
  },
  wallet: {
    label: 'Vale-Refeição',
    icon: <Wallet className="h-5 w-5 text-zinc-400" />
  }
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

        // Valida os dados do pedido
        if (!data._id || !data.status || !data.customer) {
          console.error('Dados do pedido inválidos:', data)
          throw new Error('Dados do pedido inválidos')
        }

        // Garante que statusUpdates existe
        if (!data.statusUpdates) {
          data.statusUpdates = [{
            status: data.status,
            message: statusMessages[data.status],
            timestamp: data.createdAt
          }]
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

  // Garante que o status é válido
  const status = order.status in statusMessages ? order.status : 'pending'
  const StatusIcon = statusIcons[status] || AlertCircle

  return (
    <div className="min-h-screen bg-zinc-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Status Atual */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={statusColors[status] || 'text-yellow-500'}>
              <StatusIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-zinc-900">
                {statusMessages[status] || 'Status desconhecido'}
              </h1>
              <p className="text-sm text-zinc-600">
                Pedido #{order._id}
              </p>
            </div>
          </div>

          {/* Tempo estimado (apenas para alguns status) */}
          {['confirmed', 'preparing'].includes(status) && (
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
            {order.customer?.name && (
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-zinc-400" />
                <span className="text-sm text-zinc-900">{order.customer.name}</span>
              </div>
            )}
            {order.customer?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-zinc-400" />
                <span className="text-sm text-zinc-900">{order.customer.phone}</span>
              </div>
            )}
            {/* Método de Pagamento */}
            {(order.paymentMethod || order.payment?.method) && (
              <div className="flex items-center gap-2">
                {paymentMethods[order.paymentMethod || order.payment?.method]?.icon || 
                  <CreditCard className="h-5 w-5 text-zinc-400" />}
                <span className="text-sm text-zinc-900">
                  {paymentMethods[order.paymentMethod || order.payment?.method]?.label || 
                   'Método de pagamento não especificado'}
                  {((order.paymentMethod === 'cash' && order.change) || 
                    (order.payment?.method === 'cash' && order.payment?.change)) && 
                    ` (Troco para ${formatCurrency(order.change || order.payment?.change)})`}
                </span>
              </div>
            )}
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
        {order.statusUpdates && order.statusUpdates.length > 0 && (
          <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium text-zinc-900">Atualizações do Pedido</h2>

            <div className="mt-6 space-y-6">
              {order.statusUpdates.map((update, index) => {
                const UpdateStatusIcon = statusIcons[update.status] || AlertCircle
                return (
                  <div key={index} className="flex gap-4">
                    <div className={statusColors[update.status] || 'text-yellow-500'}>
                      <UpdateStatusIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900">
                        {update.message || statusMessages[update.status] || 'Status atualizado'}
                      </p>
                      <p className="text-sm text-zinc-600">
                        {formatDistanceToNow(new Date(update.timestamp), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Itens do Pedido */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-zinc-900">Itens do Pedido</h2>
          
          <div className="mt-4 space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="rounded-lg border border-zinc-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-zinc-900">
                      {item.quantity}x {item.name}
                    </p>
                    
                    {/* Informações de Meia a Meia */}
                    {item.isHalfHalf && item.halfHalf && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1">
                          <div className="h-3 w-3 rounded-full bg-krato-500"></div>
                          <p className="text-sm text-zinc-700">
                            <span className="font-medium">Primeira metade:</span> {item.halfHalf.firstHalf.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-3 w-3 rounded-full bg-krato-700"></div>
                          <p className="text-sm text-zinc-700">
                            <span className="font-medium">Segunda metade:</span> {item.halfHalf.secondHalf.name}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Adicionais da primeira metade */}
                    {item.isHalfHalf && item.halfHalf && item.halfHalf.firstHalf.additions?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-zinc-700">Adicionais (Primeira metade):</p>
                        {item.halfHalf.firstHalf.additions.map((addition, idx) => (
                          <p key={`first-half-add-${idx}`} className="text-sm text-zinc-600">
                            + {addition.name}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    {/* Adicionais da segunda metade */}
                    {item.isHalfHalf && item.halfHalf && item.halfHalf.secondHalf.additions?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-zinc-700">Adicionais (Segunda metade):</p>
                        {item.halfHalf.secondHalf.additions.map((addition, idx) => (
                          <p key={`second-half-add-${idx}`} className="text-sm text-zinc-600">
                            + {addition.name}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    {/* Observações */}
                    {item.observations && (
                      <p className="mt-2 text-sm text-zinc-600">
                        <span className="font-medium">Observação:</span> {item.observations}
                      </p>
                    )}
                    
                    {/* Adições regulares para produtos que não são meia a meia */}
                    {!item.isHalfHalf && item.additions && item.additions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-zinc-700">Adicionais:</p>
                        {item.additions.map((addition, idx) => (
                          <p key={`addition-${idx}`} className="text-sm text-zinc-600">
                            + {addition.name}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <p className="font-medium text-zinc-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-between border-t border-zinc-200 pt-4">
            <p className="font-medium text-zinc-900">Subtotal</p>
            <p className="font-medium text-zinc-900">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(order.subtotal || order.total - (order.deliveryFee || 0))}
            </p>
          </div>
          
          {order.deliveryFee > 0 && (
            <div className="mt-2 flex justify-between">
              <p className="text-zinc-700">Taxa de entrega</p>
              <p className="text-zinc-700">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(order.deliveryFee)}
              </p>
            </div>
          )}

          <div className="mt-2 flex justify-between font-medium">
            <p className="text-zinc-900">Total</p>
            <p className="text-zinc-900">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(order.total)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 