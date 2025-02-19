'use client'

import { useEffect, useState, useRef } from 'react'
import { ShoppingBag, X } from 'lucide-react'
import { Order } from '@/types/order'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import useSound from 'use-sound'

const PRINTER_SERVER = process.env.NEXT_PUBLIC_PRINTER_SERVER || 'http://localhost:3002'

interface OrderNotificationProps {
  order: Order
  onClose: () => void
  style?: React.CSSProperties
}

export function OrderNotification({ order, onClose, style }: OrderNotificationProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playNewOrder] = useSound('/sounds/new-order.mp3', {
    volume: 0.7,
    interrupt: true
  })
  const intervalRef = useRef<NodeJS.Timeout>()

  // Toca o som a cada 10 segundos até que haja interação
  useEffect(() => {
    if (isVisible && !isUpdating) {
      playNewOrder()

      intervalRef.current = setInterval(() => {
        if (isVisible && !isUpdating) {
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
  }, [playNewOrder, isVisible, isUpdating])

  const handleAction = async (action: 'confirmed' | 'rejected') => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
    
    setIsUpdating(true)
    setError(null)

    try {
      // Atualiza o status do pedido
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

      // Se o pedido foi confirmado, tenta imprimir
      if (action === 'confirmed') {
        try {
          const printResponse = await fetch(`${PRINTER_SERVER}/print-order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
          })

          if (!printResponse.ok) {
            const error = await printResponse.json()
            throw new Error(error.error || 'Erro ao imprimir pedido')
          }

          // Redireciona para a página do pedido
          router.push(`/admin/orders/${order._id}`)
        } catch (printError) {
          console.error('Erro ao imprimir pedido:', printError)
          setError('Pedido aceito, mas não foi possível imprimir. Verifique a impressora.')
          // Aguarda 3 segundos antes de fechar para mostrar o erro
          setTimeout(() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }, 3000)
          return
        }
      }

      setIsVisible(false)
      setTimeout(onClose, 300)
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error)
      setError('Erro ao atualizar pedido. Tente novamente.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClose = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
    
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  if (!isVisible) return null

  return (
    <div className="w-96" style={style}>
      <div className={`transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <ShoppingBag className="h-5 w-5 text-green-600" />
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

          <div className="mt-3">
            <div className="text-sm text-gray-900">
              <span className="font-medium">Cliente:</span> {order.customer.name}
            </div>
            {order.orderType === 'delivery' && order.address && (
              <div className="mt-1 text-sm text-gray-600">
                <span className="font-medium">Endereço:</span><br />
                {order.address.street}, {order.address.number}
                {order.address.complement && ` - ${order.address.complement}`}<br />
                {order.address.neighborhood} - {order.address.city}/{order.address.state}<br />
                CEP: {order.address.cep}
              </div>
            )}
            <div className="mt-1 text-sm text-gray-600">
              {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} ·{' '}
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(order.total)}
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
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isUpdating ? 'Processando...' : 'Aceitar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 