import { NextRequest, NextResponse } from 'next/server'
import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer'
import type { Order } from '@/types/order'

async function printOrder(order: Order) {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: 'printer:thermal_printer',
    characterSet: CharacterSet.PC437_USA,
    removeSpecialCharacters: false,
    options: {
      timeout: 5000
    }
  })

  try {
    // Configura o estilo inicial
    printer.alignCenter()
    printer.bold(true)
    printer.setTextSize(1, 1)
    printer.println('NOVO PEDIDO')
    printer.drawLine()
    
    // Informações do pedido
    printer.alignLeft()
    printer.bold(false)
    printer.println(`Pedido #${order._id}`)
    printer.println(`Data: ${new Date().toLocaleString('pt-BR')}`)
    printer.println(`Tipo: ${order.orderType === 'delivery' ? 'Entrega' : 'Retirada'}`)
    printer.drawLine()
    
    // Dados do cliente
    printer.bold(true)
    printer.println('CLIENTE')
    printer.bold(false)
    printer.println(`Nome: ${order.customer.name}`)
    printer.println(`Telefone: ${order.customer.phone}`)
    
    // Endereço (se for delivery)
    if (order.orderType === 'delivery' && order.address) {
      printer.println('\nENDEREGO DE ENTREGA:')
      printer.println(`${order.address.street}, ${order.address.number}`)
      if (order.address.complement) {
        printer.println(`Complemento: ${order.address.complement}`)
      }
      printer.println(`${order.address.neighborhood}`)
      printer.println(`${order.address.city}/${order.address.state}`)
      printer.println(`CEP: ${order.address.cep}`)
    }
    
    printer.drawLine()
    
    // Itens do pedido
    printer.bold(true)
    printer.println('ITENS DO PEDIDO')
    printer.bold(false)
    
    order.items.forEach(item => {
      printer.println(`${item.quantity}x ${item.name}`)
      printer.println(`   R$ ${item.price.toFixed(2)}`)
      
      if (item.observation) {
        printer.println(`   Obs: ${item.observation}`)
      }
      
      if (item.additions && item.additions.length > 0) {
        item.additions.forEach(addition => {
          printer.println(`   + ${addition.name}`)
          printer.println(`   R$ ${addition.price.toFixed(2)}`)
        })
      }
      
      printer.println('')
    })
    
    printer.drawLine()
    
    // Totais
    printer.alignRight()
    printer.println(`Subtotal: R$ ${order.subtotal.toFixed(2)}`)
    if (order.deliveryFee) {
      printer.println(`Taxa de entrega: R$ ${order.deliveryFee.toFixed(2)}`)
    }
    printer.bold(true)
    printer.println(`TOTAL: R$ ${order.total.toFixed(2)}`)
    
    // Forma de pagamento
    printer.bold(false)
    printer.println(`\nPagamento: ${getPaymentMethodLabel(order.payment.method)}`)
    if (order.payment.method === 'cash' && order.payment.change) {
      printer.println(`Troco para: R$ ${order.payment.change}`)
    }
    
    // Finalização
    printer.alignCenter()
    printer.drawLine()
    printer.bold(true)
    printer.println('Pedido confirmado!')
    printer.println('Bom trabalho!')
    printer.cut()
    
    // Executa a impressão
    await printer.execute()
    return true
  } catch (error) {
    console.error('Erro ao imprimir pedido:', error)
    throw new Error('Falha ao imprimir pedido')
  }
}

function getPaymentMethodLabel(method: string): string {
  const methods: { [key: string]: string } = {
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    pix: 'PIX',
    cash: 'Dinheiro',
    meal_voucher: 'Vale-Refeição'
  }
  return methods[method] || method
}

export async function POST(request: NextRequest) {
  try {
    const order = await request.json()
    await printOrder(order)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao imprimir pedido:', error)
    return NextResponse.json(
      { error: 'Falha ao imprimir pedido' },
      { status: 500 }
    )
  }
} 