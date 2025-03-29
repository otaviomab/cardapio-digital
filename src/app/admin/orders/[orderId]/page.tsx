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
  CreditCard,
  QrCode,
  Banknote,
  Wallet
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { OrderStatus } from '@/components/order-status'
import { ThermalPrintButton } from '@/components/thermal-print-button'
import { CategoryBadge } from '@/components/category-badge'

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
  confirmed: 'text-krato-500 bg-krato-50',
  rejected: 'text-red-500 bg-red-50',
  preparing: 'text-krato-500 bg-krato-50',
  ready: 'text-krato-500 bg-krato-50',
  out_for_delivery: 'text-purple-500 bg-purple-50',
  delivered: 'text-krato-500 bg-krato-50',
  completed: 'text-krato-500 bg-krato-50',
  cancelled: 'text-red-500 bg-red-50',
}

const paymentMethods = {
  credit_card: {
    label: 'Cartão de Crédito',
    icon: <CreditCard className="h-4 w-4 mr-1" />,
    color: 'text-green-500'
  },
  debit_card: {
    label: 'Cartão de Débito',
    icon: <CreditCard className="h-4 w-4 mr-1" />,
    color: 'text-blue-500'
  },
  pix: {
    label: 'PIX',
    icon: <QrCode className="h-4 w-4 mr-1" />,
    color: 'text-purple-500'
  },
  cash: {
    label: 'Dinheiro',
    icon: <Banknote className="h-4 w-4 mr-1" />,
    color: 'text-yellow-500'
  },
  meal_voucher: {
    label: 'Vale-Refeição',
    icon: <Wallet className="h-4 w-4 mr-1" />,
    color: 'text-orange-500'
  },
  // Compatibilidade com formatos antigos
  credit: {
    label: 'Cartão de Crédito',
    icon: <CreditCard className="h-4 w-4 mr-1" />,
    color: 'text-green-500'
  },
  debit: {
    label: 'Cartão de Débito',
    icon: <CreditCard className="h-4 w-4 mr-1" />,
    color: 'text-blue-500'
  },
  wallet: {
    label: 'Vale-Refeição',
    icon: <Wallet className="h-4 w-4 mr-1" />,
    color: 'text-orange-500'
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

        // Garante que statusUpdates existe
        if (!data.statusUpdates) {
          data.statusUpdates = [{
            status: data.status,
            message: statusMessages[data.status as keyof typeof statusMessages],
            timestamp: data.createdAt
          }]
        }

        // Debug - verificar se os itens têm categoria
        if (data.items && Array.isArray(data.items)) {
          console.log('Itens do pedido carregado:');
          data.items.forEach((item, index) => {
            // Adicione este log para verificar todas as propriedades do item
            console.log(`Item ${index + 1} completo:`, JSON.stringify(item));
            console.log(`Item ${index + 1}: ${item.name}, Categoria: ${item.category || 'não definida'}`);
            console.log('Propriedades do item:', Object.keys(item));
            
            // Verifica se a categoria existe, mas em outra propriedade
            if (!item.category && item.categoryId) {
              console.log(`Item tem categoryId mas não category: ${item.categoryId}`);
              // Podemos tentar usar o categoryId para obter o nome da categoria
              item.category = `Categoria ID: ${item.categoryId}`;
            }
            
            if (!item.category && item.categoryName) {
              console.log(`Item tem categoryName mas não category: ${item.categoryName}`);
              item.category = item.categoryName;
            }
          });
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
  const getAvailableStatuses = (currentStatus: string, deliveryMethod: string) => {
    switch (currentStatus) {
      case 'pending':
        return ['confirmed', 'rejected', 'cancelled']
      case 'confirmed':
        return ['preparing', 'cancelled']
      case 'preparing':
        return ['ready', 'cancelled']
      case 'ready':
        return deliveryMethod === 'delivery' ? ['out_for_delivery', 'cancelled'] : ['delivered', 'cancelled']
      case 'out_for_delivery':
        return ['delivered', 'cancelled']
      case 'delivered':
        return ['completed']
      default:
        return []
    }
  }

  // Adiciona função para obter todos os status possíveis
  const getAllStatuses = (deliveryMethod: string) => {
    if (deliveryMethod === 'delivery') {
      return ['pending', 'confirmed', 'rejected', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled']
    } else {
      // Para retirada, não tem out_for_delivery
      return ['pending', 'confirmed', 'rejected', 'preparing', 'ready', 'delivered', 'completed', 'cancelled']
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return

    setIsUpdating(true)
    try {
      // Atualiza o status no MongoDB
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

      // Formata o número do telefone do cliente (remove caracteres não numéricos)
      const phoneNumber = order.customer.phone.replace(/\D/g, '');
      
      // Adiciona o prefixo 55 se não estiver presente
      const formattedPhone = phoneNumber.startsWith('55') ? phoneNumber : `55${phoneNumber}`;
      
      // Busca o ID real do restaurante na tabela restaurant_settings
      try {
        // Primeiro busca as configurações do restaurante usando o restaurantId do pedido
        const settingsResponse = await fetch(`/api/supabase?action=getRestaurantSettings&userId=${order.restaurantId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!settingsResponse.ok) {
          throw new Error('Erro ao buscar informações do restaurante');
        }
        
        const settingsData = await settingsResponse.json();
        const restaurantId = settingsData.id; // Usa o id da tabela restaurant_settings, não o user_id
        
        // Envia notificação para o webhook do Krato.ai com o ID correto
        const webhookResponse = await fetch('https://api.krato.ai/webhook/b717c84e-8500-4fd2-9ee6-df3cab7e66d3', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            number: formattedPhone,
            text: statusMessages[newStatus as keyof typeof statusMessages],
            id: restaurantId // ID do restaurante na tabela restaurant_settings
          })
        });
        
        if (!webhookResponse.ok) {
          console.error('Erro ao enviar notificação para o webhook:', await webhookResponse.text());
        } else {
          console.log('Notificação de status enviada com sucesso para', formattedPhone);
        }
      } catch (webhookError) {
        // Se houver erro ao buscar as configurações do restaurante, tenta usar o restaurantId diretamente
        console.error('Erro ao buscar configurações do restaurante:', webhookError);
        console.log('Tentando enviar com o restaurantId do pedido como fallback...');
        
        try {
          const fallbackWebhookResponse = await fetch('https://api.krato.ai/webhook/b717c84e-8500-4fd2-9ee6-df3cab7e66d3', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              number: formattedPhone,
              text: statusMessages[newStatus as keyof typeof statusMessages],
              id: order.restaurantId // Usa o restaurantId do pedido como fallback
            })
          });
          
          if (!fallbackWebhookResponse.ok) {
            console.error('Erro ao enviar notificação para o webhook (fallback):', await fallbackWebhookResponse.text());
          } else {
            console.log('Notificação de status enviada com sucesso usando fallback para', formattedPhone);
          }
        } catch (fallbackError) {
          console.error('Erro ao enviar notificação para o webhook (fallback):', fallbackError);
        }
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

  const availableStatuses = getAvailableStatuses(order.status, order.deliveryMethod)

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

        <div className="flex items-center gap-4">
          {/* Botão de Impressão Térmica */}
          <ThermalPrintButton order={order} />
          
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
                {order.deliveryAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-zinc-900">
                      {order.deliveryAddress.street}, {order.deliveryAddress.number}
                      {order.deliveryAddress.complement && ` - ${order.deliveryAddress.complement}`}
                      <br />
                      {order.deliveryAddress.neighborhood} - {order.deliveryAddress.city}/{order.deliveryAddress.state}
                      <br />
                      CEP: {order.deliveryAddress.zipCode}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CreditCard className={`h-4 w-4 ${
                    paymentMethods[(order.paymentMethod || order.payment?.method) as keyof typeof paymentMethods]?.color || 'text-zinc-400'
                  }`} />
                  <span className="text-sm text-zinc-900">
                    {paymentMethods[(order.paymentMethod || order.payment?.method) as keyof typeof paymentMethods]?.label || 'Método não definido'}
                    {((order.paymentMethod === 'cash' && order.change) || 
                      (order.payment?.method === 'cash' && order.payment?.change)) && 
                      ` (Troco para ${formatCurrency(order.change || order.payment?.change)})`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Atualizar Status */}
          <div className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-6 py-4">
              <h2 className="font-semibold text-zinc-900">Atualizar Status</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                {getAllStatuses(order.deliveryMethod).map((statusKey) => {
                  const StatusIcon = statusIcons[statusKey as keyof typeof statusIcons]
                  const isCurrentStatus = statusKey === order.status
                  const isAvailable = availableStatuses.includes(statusKey)
                  
                  return (
                    <button
                      key={statusKey}
                      onClick={() => isAvailable ? handleUpdateStatus(statusKey) : null}
                      disabled={isUpdating || !isAvailable}
                      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors
                        ${isCurrentStatus 
                          ? 'border-2 border-zinc-800' 
                          : isAvailable 
                            ? `${statusColors[statusKey as keyof typeof statusColors]} border-transparent cursor-pointer` 
                            : 'bg-zinc-100 text-zinc-400 border-transparent cursor-not-allowed'}`}
                    >
                      <StatusIcon className="h-4 w-4" />
                      {statusMessages[statusKey as keyof typeof statusMessages]}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

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
                <div key={`item-${item.id || Math.random()}`} className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900">
                        {item.quantity}x {item.name}
                      </p>
                      
                      {/* Exibir a categoria do produto */}
                      <CategoryBadge 
                        category={item.category} 
                        productName={item.name}
                        restaurantId={order.restaurantId}
                      />
                      
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
                          {item.halfHalf.firstHalf.additions.map((addition, index) => (
                            <p key={`addition-first-half-${index}`} className="text-sm text-zinc-600">
                              + {addition.name}
                            </p>
                          ))}
                        </div>
                      )}
                      
                      {/* Adicionais da segunda metade */}
                      {item.isHalfHalf && item.halfHalf && item.halfHalf.secondHalf.additions?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-zinc-700">Adicionais (Segunda metade):</p>
                          {item.halfHalf.secondHalf.additions.map((addition, index) => (
                            <p key={`addition-second-half-${index}`} className="text-sm text-zinc-600">
                              + {addition.name}
                            </p>
                          ))}
                        </div>
                      )}
                      
                      {/* Adicionais regulares (não meio a meio) */}
                      {!item.isHalfHalf && item.additions && item.additions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-zinc-700">Adicionais:</p>
                          {item.additions.map((addition, idx) => (
                            <p key={`addition-${addition.id || addition.name || idx}`} className="text-sm text-zinc-600">
                              + {addition.name}
                            </p>
                          ))}
                        </div>
                      )}
                      
                      {/* Observações */}
                      {(item.observations || item.observation) && (
                        <p className="mt-2 text-sm text-zinc-600">
                          <span className="font-medium">Observação:</span> {item.observations || item.observation}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-zinc-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(item.price * item.quantity)}
                      </p>
                    </div>
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
                    }).format(order.subtotal || order.total - (order.deliveryFee || 0))}
                  </span>
                </div>

                {order.deliveryFee > 0 && (
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