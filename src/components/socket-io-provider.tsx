'use client'

import { useEffect } from 'react'
import { io } from 'socket.io-client'

export function SocketIOProvider() {
  useEffect(() => {
    try {
      // Verifica se o Socket.IO já está disponível
      if (typeof window !== 'undefined') {
        console.log('Inicializando Socket.IO no cliente')
        
        // Adiciona a função io ao objeto window
        window.io = io
        
        // Cria uma função para conectar ao servidor
        window.connectSocket = (url?: string) => {
          const serverUrl = url || window.location.origin
          console.log('Conectando ao servidor Socket.IO:', serverUrl)
          return io(serverUrl)
        }
        
        console.log('Socket.IO inicializado com sucesso')
      }
    } catch (error) {
      console.error('Erro ao inicializar Socket.IO no cliente:', error)
    }
  }, [])
  
  return null
}

// Adiciona a definição de tipos para o objeto window
declare global {
  interface Window {
    io: typeof io
    connectSocket: (url?: string) => ReturnType<typeof io>
  }
} 