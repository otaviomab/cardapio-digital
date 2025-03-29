import { NextRequest, NextResponse } from 'next/server'
import { io } from 'socket.io-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, room, data } = body
    
    console.log('API Socket: Recebendo solicitação para emitir evento', {
      event,
      room,
      dataType: typeof data
    })
    
    if (!event || !room || !data) {
      console.log('API Socket: Parâmetros inválidos', { event, room, data })
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      )
    }
    
    try {
      // Conecta ao servidor Socket.IO
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000')

      // Aguarda a conexão
      await new Promise<void>((resolve) => {
        socket.on('connect', () => {
          console.log('API conectada ao servidor Socket.IO com ID:', socket.id)
          resolve()
        })
        
        socket.on('connect_error', (error) => {
          console.error('API Socket: Erro ao conectar ao Socket.IO:', error)
          // Resolve mesmo com erro para continuar o fluxo
          resolve()
        })
        
        // Timeout para não ficar esperando indefinidamente
        setTimeout(() => {
          console.log('API Socket: Timeout ao conectar ao Socket.IO')
          resolve()
        }, 5000)
      })

      // Envia o evento
      socket.emit(event, data)
      console.log(`API: Evento ${event} enviado para a sala ${room}`)

      // Desconecta após enviar
      socket.disconnect()

      return NextResponse.json({ 
        success: true,
        message: `Evento ${event} emitido com sucesso para ${room}`
      })
    } catch (emitError) {
      console.error('API Socket: Erro ao emitir evento:', emitError)
      return NextResponse.json(
        { 
          error: 'Erro ao emitir evento',
          details: emitError instanceof Error ? emitError.message : 'Erro desconhecido'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API Socket: Erro ao processar solicitação:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
} 