import { NextRequest, NextResponse } from 'next/server'
import { printerService } from '@/lib/printer-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'testPrint':
        await printerService.testPrint()
        return NextResponse.json({ success: true })

      case 'updateConfig':
        const { config } = body
        await printerService.updateConfig(config)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro na API da impressora:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    switch (action) {
      case 'getConfig':
        const config = await printerService.getConfig()
        return NextResponse.json(config)

      case 'getStatus':
        const status = await printerService.getStatus()
        return NextResponse.json(status)

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro na API da impressora:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 