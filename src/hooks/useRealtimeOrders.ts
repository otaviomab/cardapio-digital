import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { Order } from '@/types/order'
import useSound from 'use-sound'
import io from 'socket.io-client'
import { usePathname } from 'next/navigation'

// Variável global para controlar se o Socket.IO está desativado
let isSocketIODisabled = false

export function useRealtimeOrders(restaurantId: string) {
  const { supabase } = useSupabase()
  const [socket, setSocket] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [socketConnected, setSocketConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [playNewOrder] = useSound('/sounds/new-order.mp3', {
    volume: 1.0,
    interrupt: true
  })
  const [newOrder, setNewOrder] = useState<Order | null>(null)
  const pathname = usePathname()
  
  // Limpa configurações antigas do Socket.IO no localStorage
  useEffect(() => {
    try {
      if (localStorage.getItem('socketio_disabled')) {
        console.log('useRealtimeOrders: Removendo configuração antiga do Socket.IO')
        localStorage.removeItem('socketio_disabled')
        isSocketIODisabled = false
      }
    } catch (error) {
      console.error('useRealtimeOrders: Erro ao limpar localStorage:', error)
    }
  }, [])
  
  // Usamos useMemo para garantir que esses valores não mudem entre renderizações
  // a menos que suas dependências mudem
  const conditions = useMemo(() => {
    const needsRealtimeOrders = pathname?.includes('/admin/orders') || pathname?.includes('/admin/dashboard')
    const hasValidRestaurantId = !!restaurantId && restaurantId.length > 0
    
    return {
      needsRealtimeOrders,
      hasValidRestaurantId,
      shouldInitialize: needsRealtimeOrders && hasValidRestaurantId && !isSocketIODisabled
    }
  }, [pathname, restaurantId])

  // Carrega os pedidos iniciais
  useEffect(() => {
    // Verifica todas as condições necessárias
    if (!conditions.shouldInitialize) {
      console.log('useRealtimeOrders: Condições não atendidas, pulando carregamento de pedidos', {
        needsRealtimeOrders: conditions.needsRealtimeOrders,
        hasValidRestaurantId: conditions.hasValidRestaurantId
      })
      setLoading(false)
      return
    }

    console.log('useRealtimeOrders: Iniciando carregamento de pedidos para restaurantId:', restaurantId)
    
    const loadOrders = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/mongodb?action=getOrders&restaurantId=${restaurantId}`)
        
        if (!response.ok) {
          console.error('useRealtimeOrders: Erro na resposta da API', {
            status: response.status,
            statusText: response.statusText
          })
          throw new Error('Erro ao carregar pedidos')
        }

        const data = await response.json()
        console.log(`useRealtimeOrders: ${data.length} pedidos carregados com sucesso`)
        
        // Ordena os pedidos por data de criação (mais recentes primeiro)
        const sortedOrders = data.sort((a: Order, b: Order) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        setOrders(sortedOrders)
      } catch (error) {
        console.error('useRealtimeOrders: Erro ao carregar pedidos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [restaurantId, conditions])

  // Configura o Socket.IO
  useEffect(() => {
    // Verifica todas as condições necessárias
    if (!conditions.shouldInitialize) {
      console.log('useRealtimeOrders: Condições não atendidas, pulando configuração do Socket.IO', {
        isSocketIODisabled,
        needsRealtimeOrders: conditions.needsRealtimeOrders,
        hasValidRestaurantId: conditions.hasValidRestaurantId
      })
      return
    }

    // Inicializa o socket
    const initSocket = async () => {
      try {
        console.log('useRealtimeOrders: Iniciando conexão com Socket.IO')
        
        // Determina a URL do servidor com fallback
        const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
        console.log(`useRealtimeOrders: Tentando conectar ao servidor: ${serverUrl}`)
        
        // Conecta ao Socket.IO com opções de reconexão
        const socketIo = io(serverUrl, {
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          transports: ['websocket', 'polling'],
          forceNew: true,
          autoConnect: true
        })
        
        // Configura listeners de eventos de conexão
        socketIo.on('connect', () => {
          console.log('useRealtimeOrders: Conectado ao Socket.IO com ID:', socketIo.id)
          setSocketConnected(true)
          setReconnectAttempts(0)
          
          // Entra na sala do restaurante após conectar
          socketIo.emit('join-restaurant', restaurantId)
          console.log('useRealtimeOrders: Solicitação para entrar na sala:', restaurantId)
        })
        
        socketIo.on('connect_error', (error) => {
          console.error('useRealtimeOrders: Erro de conexão com Socket.IO:', error)
          setSocketConnected(false)
          setReconnectAttempts(prev => prev + 1)
          
          // Registra a tentativa de reconexão, mas não desativa o Socket.IO
          console.log(`useRealtimeOrders: Tentativa de reconexão ${reconnectAttempts + 1}/5`)
        })
        
        socketIo.on('disconnect', (reason) => {
          console.log('useRealtimeOrders: Desconectado do Socket.IO, motivo:', reason)
          setSocketConnected(false)
        })
        
        // Confirmação de entrada na sala
        socketIo.on('joined-restaurant', (data) => {
          console.log('useRealtimeOrders: Confirmação de entrada na sala recebida:', data)
        })
        
        setSocket(socketIo)

        // Escuta por novos pedidos
        socketIo.on('new-order', (order: Order) => {
          console.log('useRealtimeOrders: Novo pedido recebido via WebSocket:', order)
          
          // Verifica se o pedido é para este restaurante
          if (order.restaurantId === restaurantId) {
            console.log('useRealtimeOrders: Pedido é para este restaurante, processando...')
            
            // Adiciona o novo pedido à lista
            setOrders(prev => [order, ...prev])
            
            // Notifica sobre o novo pedido
            playNewOrder()
            setNewOrder(order)
          } else {
            console.warn('useRealtimeOrders: Pedido recebido para outro restaurante:', order.restaurantId)
          }
        })

        // Mantém a compatibilidade com o formato antigo do evento
        socketIo.on(`new-order-${restaurantId}`, (order: Order) => {
          console.log('useRealtimeOrders: Novo pedido recebido via formato antigo:', order)
          
          // Adiciona o novo pedido à lista
          setOrders(prev => [order, ...prev])
          
          // Notifica sobre o novo pedido
          playNewOrder()
          setNewOrder(order)
        })

        // Escuta por atualizações de pedidos
        socketIo.on(`order-updated-${restaurantId}`, (updatedOrder: Order) => {
          console.log('useRealtimeOrders: Pedido atualizado via WebSocket:', updatedOrder)
          
          // Atualiza o pedido na lista
          setOrders(prev => 
            prev.map(order => 
              order._id === updatedOrder._id ? updatedOrder : order
            )
          )
        })
      } catch (error) {
        console.error('useRealtimeOrders: Erro ao inicializar Socket.IO:', error)
      }
    }

    // Inicializa o socket apenas se estiver em uma página que precisa dele
    initSocket()

    // Limpeza ao desmontar
    return () => {
      if (socket) {
        console.log('useRealtimeOrders: Desconectando do WebSocket')
        socket.off('new-order')
        socket.off(`new-order-${restaurantId}`)
        socket.off(`order-updated-${restaurantId}`)
        socket.off('connect')
        socket.off('connect_error')
        socket.off('disconnect')
        socket.off('joined-restaurant')
        
        socket.emit('leave-restaurant', restaurantId)
        socket.disconnect()
        setSocketConnected(false)
      }
    }
  }, [restaurantId, playNewOrder, reconnectAttempts, conditions])

  return {
    orders,
    loading,
    newOrder,
    setNewOrder,
    socketConnected,
    // Função helper para atualizar um pedido localmente
    updateOrder: (orderId: string, updates: Partial<Order>) => {
      console.log('useRealtimeOrders: Atualizando pedido localmente', {
        orderId,
        updates
      })
      setOrders(current =>
        current.map(order =>
          order._id === orderId ? { ...order, ...updates } : order
        )
      )
    },
    // Função para reativar o Socket.IO se estiver desativado
    reactivateSocket: () => {
      if (isSocketIODisabled) {
        console.log('useRealtimeOrders: Reativando Socket.IO')
        isSocketIODisabled = false
        try {
          localStorage.removeItem('socketio_disabled')
        } catch (storageError) {
          console.error('useRealtimeOrders: Erro ao remover preferência do localStorage:', storageError)
        }
        // Força um recarregamento da página para reinicializar o Socket.IO
        window.location.reload()
      }
    }
  }
} 