/**
 * SocketService - Serviço de comunicação em tempo real
 * 
 * Este serviço gerencia a comunicação em tempo real entre cliente e servidor
 * utilizando Socket.IO, permitindo atualizações instantâneas na interface.
 * 
 * Responsabilidades:
 * - Gerenciar a instância do Socket.IO
 * - Emitir eventos para salas específicas (restaurantes)
 * - Abstrair a comunicação em tempo real para o resto da aplicação
 * - Lidar com diferenças entre cliente e servidor
 * 
 * Uso típico:
 * - Notificações de novos pedidos
 * - Atualizações de status de pedidos
 * - Comunicação entre dashboard e cozinha
 */

import { Server as SocketIOServer } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import type { Socket as NetSocket } from 'net'
import type { NextApiResponse } from 'next'

interface SocketServer extends HTTPServer {
  io?: SocketIOServer | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

// Variável global para armazenar a instância do Socket.IO
declare global {
  var io: SocketIOServer | undefined
}

// Função para obter a instância do Socket.IO
export const getSocketIO = (res?: NextApiResponseWithSocket): SocketIOServer | null => {
  if (res && res.socket && res.socket.server.io) {
    return res.socket.server.io
  }
  
  if (global.io) {
    return global.io
  }
  
  return null
}

// Função para emitir eventos para um restaurante específico
export const emitToRestaurant = (
  event: string,
  restaurantId: string,
  data: any
) => {
  try {
    console.log(`Socket: Tentando emitir evento ${event} para restaurante ${restaurantId}`, {
      dataType: typeof data,
      hasData: !!data,
      isServer: typeof window === 'undefined',
      hasGlobalIo: typeof window === 'undefined' && !!global.io
    })
    
    // Verifica se o restaurantId é válido
    if (!restaurantId) {
      console.error('Socket: restaurantId não fornecido para emissão de evento', {
        event,
        restaurantId
      })
      return false
    }
    
    // Verifica se o Socket.IO está disponível globalmente
    if (typeof window === 'undefined' && global.io) {
      try {
        console.log(`Socket: Emitindo evento ${event} para restaurante ${restaurantId} (servidor)`)
        global.io.to(restaurantId).emit(event, data)
        return true
      } catch (serverEmitError) {
        console.error('Socket: Erro ao emitir evento no servidor:', serverEmitError)
        return false
      }
    } else {
      // No cliente, faz uma chamada para o endpoint interno
      console.log(`Socket: Emitindo evento ${event} para restaurante ${restaurantId} (cliente)`)
      
      // Usa Promise para permitir tratamento de erros assíncrono
      const emitPromise = fetch('/api/socket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          room: restaurantId,
          data,
        }),
      })
      .then(response => {
        if (!response.ok) {
          console.error('Socket: Erro na resposta da API de socket', {
            status: response.status,
            statusText: response.statusText
          })
          return response.json().then(data => {
            throw new Error(`Erro na API: ${data.error || 'Desconhecido'}`)
          })
        }
        console.log(`Socket: Evento ${event} emitido com sucesso via API`)
        return response.json()
      })
      .catch(error => {
        console.error('Socket: Erro ao chamar API de socket:', error)
        throw error
      })
      
      // Inicia a Promise mas não espera por ela (fire and forget)
      emitPromise.catch(error => {
        console.error('Socket: Erro não tratado na emissão do evento:', error)
      })
      
      return true
    }
  } catch (error) {
    console.error('Socket: Erro ao emitir evento via Socket.IO:', error)
    return false
  }
}

/**
 * Inicializa o servidor Socket.IO
 * @param server - O servidor HTTP para anexar o Socket.IO
 * @returns A instância do Socket.IO inicializada
 */
const initSocket = (server: HTTPServer): SocketIOServer => {
  // Se já existir uma instância global, retorna-a
  if (global.io) {
    console.log('Socket.IO: Usando instância existente')
    return global.io
  }

  // Configura as origens permitidas para CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000']

  console.log('Socket.IO: Inicializando com origens permitidas:', allowedOrigins)

  // Cria uma nova instância do Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  })

  // Configura os manipuladores de eventos
  io.on('connection', (socket) => {
    console.log(`Socket.IO: Novo cliente conectado: ${socket.id}`)
    
    // Evento para entrar em uma sala (restaurante)
    socket.on('join-restaurant', (restaurantId) => {
      if (!restaurantId) {
        console.error('Socket.IO: ID do restaurante não fornecido')
        socket.emit('error', 'ID do restaurante não fornecido')
        return
      }
      
      socket.join(restaurantId)
      console.log(`Socket.IO: Cliente ${socket.id} entrou na sala ${restaurantId}`)
      socket.emit('joined', { restaurantId, socketId: socket.id })
    })
    
    // Manipulador de eventos de desconexão
    socket.on('disconnect', () => {
      console.log(`Socket.IO: Cliente desconectado: ${socket.id}`)
    })
    
    // Manipulador de erros do socket
    socket.on('error', (error) => {
      console.error(`Socket.IO: Erro no socket ${socket.id}:`, error)
    })
  })

  // Armazena a instância na variável global
  global.io = io
  console.log('Socket.IO: Servidor inicializado com sucesso')
  
  return io
}

// Exporta a função de inicialização como padrão
export default initSocket 