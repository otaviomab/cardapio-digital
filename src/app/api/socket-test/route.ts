import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Verifica se o Socket.IO está disponível globalmente no servidor
    const socketIO = global.io || global.socketIO
    
    if (!socketIO) {
      return NextResponse.json({
        status: 'error',
        message: 'Socket.IO não está disponível no servidor'
      }, { status: 500 })
    }
    
    // Obtém informações sobre as salas e conexões
    const sockets = await socketIO.fetchSockets()
    const rooms = socketIO.sockets.adapter.rooms
    
    return NextResponse.json({
      status: 'success',
      message: 'Socket.IO está disponível no servidor',
      info: {
        connections: sockets.length,
        rooms: Array.from(rooms.keys()),
        socketIds: sockets.map(socket => socket.id)
      }
    })
  } catch (error: any) {
    console.error('Erro ao verificar Socket.IO no servidor:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Erro ao verificar Socket.IO no servidor',
      error: error.message || 'Erro desconhecido'
    }, { status: 500 })
  }
} 