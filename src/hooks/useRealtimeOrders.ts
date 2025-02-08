import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { Order } from '@/types/order'
import useSound from 'use-sound'

export function useRealtimeOrders(restaurantId: string) {
  const { supabase } = useSupabase()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [playNewOrder] = useSound('/sounds/new-order.mp3', {
    volume: 1.0,
    interrupt: true
  })
  const [newOrder, setNewOrder] = useState<Order | null>(null)
  const [processedOrderIds, setProcessedOrderIds] = useState<Set<string>>(new Set())

  // Carrega os pedidos iniciais
  useEffect(() => {
    const loadOrders = async () => {
      if (!restaurantId) return

      try {
        setLoading(true)
        const response = await fetch(`/api/mongodb?action=getOrders&restaurantId=${restaurantId}`)
        
        if (!response.ok) {
          throw new Error('Erro ao carregar pedidos')
        }

        const data = await response.json()
        
        // Ordena os pedidos por data de criação (mais recentes primeiro)
        const sortedOrders = data.sort((a: Order, b: Order) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        setOrders(sortedOrders)
        
        // Marca todos os pedidos existentes como processados
        const existingIds = new Set(sortedOrders.map(order => order._id))
        setProcessedOrderIds(existingIds)
      } catch (error) {
        console.error('Erro ao carregar pedidos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [restaurantId])

  // Configura polling para buscar novos pedidos
  useEffect(() => {
    if (!restaurantId) return

    const pollOrders = setInterval(async () => {
      try {
        const response = await fetch(`/api/mongodb?action=getOrders&restaurantId=${restaurantId}`)
        if (!response.ok) throw new Error('Erro ao buscar pedidos')
        
        const data = await response.json()
        
        // Ordena os pedidos por data de criação (mais recentes primeiro)
        const sortedOrders = data.sort((a: Order, b: Order) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        // Verifica se há pedidos novos
        for (const order of sortedOrders) {
          if (!processedOrderIds.has(order._id)) {
            console.log('Novo pedido encontrado:', order)
            
            // Se for um pedido pendente, notifica
            if (order.status === 'pending') {
              console.log('Notificando novo pedido pendente')
              playNewOrder()
              setNewOrder(order)
            }
            
            // Marca o pedido como processado
            setProcessedOrderIds(prev => new Set([...prev, order._id]))
          }
        }

        setOrders(sortedOrders)
      } catch (error) {
        console.error('Erro ao atualizar pedidos:', error)
      }
    }, 3000) // Verifica a cada 3 segundos

    return () => clearInterval(pollOrders)
  }, [restaurantId, processedOrderIds, playNewOrder])

  return {
    orders,
    loading,
    newOrder,
    setNewOrder,
    // Função helper para atualizar um pedido localmente
    updateOrder: (orderId: string, updates: Partial<Order>) => {
      setOrders(current =>
        current.map(order =>
          order._id === orderId ? { ...order, ...updates } : order
        )
      )
    }
  }
} 