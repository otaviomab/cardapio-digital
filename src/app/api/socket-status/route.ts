import { NextResponse } from 'next/server'
import { io } from 'socket.io-client'

export async function GET(request: Request) {
  try {
    console.log('API: Verificando status do Socket.IO')
    
    // Obtém a URL do servidor Socket.IO
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'
    console.log('API: URL do servidor Socket.IO:', serverUrl)
    
    // Tenta conectar ao servidor Socket.IO
    console.log('API: Tentando conectar ao servidor Socket.IO')
    const socket = io(serverUrl, {
      timeout: 5000,
      transports: ['websocket', 'polling']
    })
    
    // Aguarda a conexão ou timeout
    const status = await new Promise<{ connected: boolean, id?: string, error?: string }>((resolve) => {
      // Define um timeout para a conexão
      const timeoutId = setTimeout(() => {
        console.log('API: Timeout ao conectar ao servidor Socket.IO')
        socket.disconnect()
        resolve({ connected: false, error: 'Timeout ao conectar ao servidor Socket.IO' })
      }, 5000)
      
      // Evento de conexão bem-sucedida
      socket.on('connect', () => {
        console.log('API: Conectado ao servidor Socket.IO com ID:', socket.id)
        clearTimeout(timeoutId)
        resolve({ connected: true, id: socket.id })
        socket.disconnect()
      })
      
      // Evento de erro de conexão
      socket.on('connect_error', (error) => {
        console.log('API: Erro ao conectar ao servidor Socket.IO:', error.message)
        clearTimeout(timeoutId)
        resolve({ connected: false, error: error.message })
        socket.disconnect()
      })
    })
    
    console.log('API: Resultado da verificação:', status)
    
    return NextResponse.json({
      status: status.connected ? 'online' : 'offline',
      serverUrl,
      ...status
    })
  } catch (error: any) {
    console.error('API: Erro ao verificar status do Socket.IO:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        error: error.message || 'Erro desconhecido ao verificar status do Socket.IO' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { restaurantId } = body
    
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId é obrigatório' },
        { status: 400 }
      )
    }
    
    // Obtém a URL do servidor Socket.IO
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'
    console.log('API: Tentando conectar ao servidor Socket.IO:', serverUrl)
    
    // Conecta ao servidor Socket.IO
    const socket = io(serverUrl, {
      timeout: 5000,
      transports: ['websocket', 'polling']
    })
    
    // Aguarda a conexão
    const result = await new Promise<{ success: boolean, message: string, error?: string }>((resolve) => {
      // Define um timeout para a conexão
      const timeoutId = setTimeout(() => {
        socket.disconnect()
        resolve({ 
          success: false, 
          message: 'Timeout ao conectar ao servidor Socket.IO',
          error: 'Timeout'
        })
      }, 5000)
      
      // Evento de conexão bem-sucedida
      socket.on('connect', () => {
        clearTimeout(timeoutId)
        
        // Entra na sala do restaurante
        socket.emit('join-restaurant', restaurantId)
        
        // Aguarda confirmação
        socket.on('joined-restaurant', (data) => {
          socket.disconnect()
          resolve({ 
            success: true, 
            message: `Conectado com sucesso ao Socket.IO e entrou na sala ${restaurantId}`
          })
        })
        
        // Define um timeout para a entrada na sala
        const roomTimeoutId = setTimeout(() => {
          socket.disconnect()
          resolve({ 
            success: false, 
            message: 'Timeout ao entrar na sala do restaurante',
            error: 'Room timeout'
          })
        }, 3000)
        
        // Limpa o timeout se receber confirmação
        socket.on('joined-restaurant', () => {
          clearTimeout(roomTimeoutId)
        })
      })
      
      // Evento de erro de conexão
      socket.on('connect_error', (error) => {
        clearTimeout(timeoutId)
        socket.disconnect()
        resolve({ 
          success: false, 
          message: 'Erro ao conectar ao servidor Socket.IO',
          error: error.message
        })
      })
    })
    
    return NextResponse.json({
      ...result,
      serverUrl
    })
  } catch (error: any) {
    console.error('Erro ao reconectar ao Socket.IO:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao processar a solicitação',
        error: error.message || 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
} 