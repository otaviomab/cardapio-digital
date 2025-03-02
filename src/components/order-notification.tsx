'use client'

import { useEffect, useState, useRef } from 'react'
import { ShoppingBag, X } from 'lucide-react'
import { Order } from '@/types/order'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import useSound from 'use-sound'

interface OrderNotificationProps {
  order: Order
  onClose: () => void
  onAccept?: () => Promise<void>
  onReject?: () => Promise<void>
  style?: React.CSSProperties
}

export function OrderNotification({ order, onClose, onAccept, onReject, style }: OrderNotificationProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [playNewOrder] = useSound('/sounds/new-order.mp3', {
    volume: 0.7,
    interrupt: true
  })
  const intervalRef = useRef<NodeJS.Timeout>()

  // Log quando o componente é montado
  useEffect(() => {
    console.log('OrderNotification: Componente montado para o pedido', {
      orderId: order._id,
      restaurantId: order.restaurantId,
      customer: order.customer.name,
      total: order.total,
      items: order.items.length,
      orderType: order.orderType || 'não especificado',
      createdAt: order.createdAt
    })
    
    // Toca o som imediatamente
    playNewOrder()
    
    return () => {
      console.log('OrderNotification: Componente desmontado para o pedido', order._id)
    }
  }, [order, playNewOrder])

  // Toca o som a cada 10 segundos até que haja interação
  useEffect(() => {
    if (isVisible && !isUpdating) {
      console.log('OrderNotification: Tocando som de notificação para o pedido', order._id)
      playNewOrder()

      intervalRef.current = setInterval(() => {
        if (isVisible && !isUpdating) {
          console.log('OrderNotification: Repetindo som de notificação para o pedido', order._id)
          playNewOrder()
        }
      }, 10000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = undefined
      }
    }
  }, [playNewOrder, isVisible, isUpdating, order._id])

  const handleAction = async (action: 'confirmed' | 'rejected') => {
    console.log(`OrderNotification: Ação ${action} iniciada para o pedido`, order._id)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
    
    setIsUpdating(true)

    try {
      if (action === 'confirmed' && onAccept) {
        await onAccept()
      } else if (action === 'rejected' && onReject) {
        await onReject()
      } else {
        const response = await fetch(`/api/mongodb?action=updateOrderStatus&id=${order._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: action,
            message: action === 'confirmed' 
              ? 'Pedido confirmado pelo restaurante'
              : 'Pedido recusado pelo restaurante'
          })
        })

        if (!response.ok) {
          throw new Error('Erro ao atualizar status')
        }

        if (action === 'confirmed') {
          router.push(`/admin/orders/${order._id}`)
        }
      }

      setIsVisible(false)
      setTimeout(onClose, 300)
    } catch (error) {
      console.error('OrderNotification: Erro ao atualizar pedido:', error)
      alert('Erro ao atualizar pedido. Tente novamente.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClose = () => {
    console.log('OrderNotification: Fechando notificação para o pedido', order._id)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
    
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  if (!isVisible) return null

  return (
    <div className="w-96 max-w-full" style={style}>
      <div className={`transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-krato-100 p-2">
                <ShoppingBag className="h-5 w-5 text-krato-500" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Novo Pedido!</h3>
                <p className="text-sm text-gray-600">
                  {formatDistanceToNow(new Date(order.createdAt), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            <div className="text-sm text-gray-900">
              <span className="font-medium">Cliente:</span> {order.customer.name}
            </div>
            
            <div className="text-sm text-gray-900">
              <span className="font-medium">Telefone:</span> {order.customer.phone || 'Não informado'}
            </div>
            
            <div className="text-sm text-gray-900">
              <span className="font-medium">Tipo:</span> {
                order.orderType === 'delivery' || order.deliveryMethod === 'delivery' 
                  ? 'Entrega' 
                  : order.orderType === 'pickup' || order.deliveryMethod === 'pickup' 
                    ? 'Retirada' 
                    : 'Não especificado'
              }
            </div>
            
            {(order.orderType === 'delivery' || order.deliveryMethod === 'delivery') && 
              (order.address || order.deliveryAddress) && (
              <div className="mt-1 text-sm text-gray-600">
                <span className="font-medium">Endereço:</span><br />
                {order.address ? (
                  <>
                    {order.address.street}, {order.address.number}
                    {order.address.complement && ` - ${order.address.complement}`}<br />
                    {order.address.neighborhood} - {order.address.city}/{order.address.state}<br />
                    CEP: {order.address.cep}
                  </>
                ) : order.deliveryAddress ? (
                  <>
                    {order.deliveryAddress.street}, {order.deliveryAddress.number}
                    {order.deliveryAddress.complement && ` - ${order.deliveryAddress.complement}`}<br />
                    {order.deliveryAddress.neighborhood} - {order.deliveryAddress.city}/{order.deliveryAddress.state}<br />
                    CEP: {order.deliveryAddress.zipCode}
                  </>
                ) : null}
              </div>
            )}
            
            <div className="mt-1 text-sm text-gray-900">
              <span className="font-medium">Itens:</span>
            </div>
            
            <div className="max-h-40 overflow-y-auto text-sm text-gray-600">
              <ul className="space-y-1">
                {order.items.map((item, index) => (
                  <li key={index} className="flex flex-col">
                    <div className="flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                      <span>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(item.price * item.quantity)}
                      </span>
                    </div>
                    
                    {/* Informações de Meia a Meia */}
                    {item.isHalfHalf && item.halfHalf && (
                      <div className="ml-3 mt-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-krato-500"></div>
                          <span>Primeira metade: {item.halfHalf.firstHalf.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-krato-700"></div>
                          <span>Segunda metade: {item.halfHalf.secondHalf.name}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Observações */}
                    {item.observations && (
                      <div className="ml-3 text-xs text-gray-600">
                        Obs: {item.observations}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-2 text-sm font-medium text-gray-900 flex justify-between">
              <span>Total:</span>
              <span>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(order.total)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => handleAction('rejected')}
              disabled={isUpdating}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Recusar
            </button>
            <button
              onClick={() => handleAction('confirmed')}
              disabled={isUpdating}
              className="rounded-lg bg-krato-500 px-4 py-2 text-sm font-medium text-white hover:bg-krato-600 disabled:opacity-50"
            >
              {isUpdating ? 'Processando...' : 'Aceitar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 