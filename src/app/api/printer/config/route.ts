import { NextRequest, NextResponse } from 'next/server'
import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer'

let printerConfig = {
  type: PrinterTypes.EPSON,
  interface: 'printer:thermal_printer',
  characterSet: CharacterSet.PC437_USA,
  removeSpecialCharacters: false,
  timeout: 5000
}

async function testPrinter(config = printerConfig) {
  const printer = new ThermalPrinter({
    type: config.type,
    interface: config.interface,
    characterSet: config.characterSet,
    removeSpecialCharacters: config.removeSpecialCharacters,
    options: {
      timeout: config.timeout
    }
  })

  try {
    const isConnected = await printer.isPrinterConnected()
    
    if (!isConnected) {
      throw new Error('Impressora não conectada')
    }

    printer.alignCenter()
    printer.bold(true)
    printer.setTextSize(1, 1)
    printer.println('TESTE DE IMPRESSÃO')
    printer.drawLine()
    
    printer.alignLeft()
    printer.bold(false)
    printer.println('Sistema de Cardápio Digital')
    printer.println(`Data: ${new Date().toLocaleString('pt-BR')}`)
    printer.println('Impressora configurada com sucesso!')
    
    printer.drawLine()
    printer.cut()
    
    await printer.execute()
    return true
  } catch (error) {
    console.error('Erro no teste de impressão:', error)
    throw error
  }
}

async function checkPrinterStatus(config = printerConfig) {
  const printer = new ThermalPrinter({
    type: config.type,
    interface: config.interface,
    characterSet: config.characterSet,
    removeSpecialCharacters: config.removeSpecialCharacters,
    options: {
      timeout: config.timeout
    }
  })

  try {
    const isConnected = await printer.isPrinterConnected()
    return {
      connected: isConnected,
      status: isConnected ? 'online' : 'offline'
    }
  } catch (error) {
    console.error('Erro ao verificar status da impressora:', error)
    return {
      connected: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'getConfig':
        return NextResponse.json(printerConfig)

      case 'getStatus':
        const status = await checkPrinterStatus()
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, config } = body

    switch (action) {
      case 'testPrint':
        await testPrinter()
        return NextResponse.json({ success: true })

      case 'updateConfig':
        if (!config) {
          return NextResponse.json(
            { error: 'Configuração não fornecida' },
            { status: 400 }
          )
        }

        // Atualiza a configuração
        printerConfig = {
          ...printerConfig,
          ...config
        }

        // Testa a nova configuração
        await testPrinter(printerConfig)
        
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
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
} 