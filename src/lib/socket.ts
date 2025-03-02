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