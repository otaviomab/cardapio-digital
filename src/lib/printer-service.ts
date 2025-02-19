import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer'
import type { Order } from '@/types/order'

interface PrinterConfig {
  type: PrinterTypes
  interface: string
  characterSet: CharacterSet
  removeSpecialCharacters: boolean
  timeout?: number
}

class PrinterService {
  private printer: ThermalPrinter
  private config: PrinterConfig

  constructor() {
    // Configuração padrão
    this.config = {
      type: PrinterTypes.EPSON,
      interface: 'printer:thermal_printer',
      characterSet: CharacterSet.PC437_USA,
      removeSpecialCharacters: false,
      timeout: 5000
    }
    
    this.initializePrinter()
  }

  private initializePrinter() {
    this.printer = new ThermalPrinter({
      type: this.config.type,
      interface: this.config.interface,
      characterSet: this.config.characterSet,
      removeSpecialCharacters: this.config.removeSpecialCharacters,
      options: {
        timeout: this.config.timeout
      }
    })
  }

  public async updateConfig(newConfig: Partial<PrinterConfig>) {
    this.config = {
      ...this.config,
      ...newConfig
    }
    
    // Reinicializa a impressora com as novas configurações
    this.initializePrinter()
    
    // Testa a conexão
    await this.getStatus()
  }

  public getConfig(): PrinterConfig {
    return { ...this.config }
  }

  public async getStatus() {
    try {
      const isConnected = await this.printer.isPrinterConnected()
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

  public async testPrint() {
    try {
      this.printer.alignCenter()
      this.printer.bold(true)
      this.printer.setTextSize(1, 1)
      this.printer.println('TESTE DE IMPRESSÃO')
      this.printer.drawLine()
      
      this.printer.alignLeft()
      this.printer.bold(false)
      this.printer.println('Sistema de Cardápio Digital')
      this.printer.println(`Data: ${new Date().toLocaleString('pt-BR')}`)
      this.printer.println('Impressora configurada com sucesso!')
      
      this.printer.drawLine()
      this.printer.cut()
      
      await this.printer.execute()
      return true
    } catch (error) {
      console.error('Erro no teste de impressão:', error)
      throw new Error('Falha no teste de impressão')
    }
  }

  public async printOrder(order: Order) {
    try {
      // Configura o estilo inicial
      this.printer.alignCenter()
      this.printer.bold(true)
      this.printer.setTextSize(1, 1)
      this.printer.println('NOVO PEDIDO')
      this.printer.drawLine()
      
      // Informações do pedido
      this.printer.alignLeft()
      this.printer.bold(false)
      this.printer.println(`Pedido #${order._id}`)
      this.printer.println(`Data: ${new Date().toLocaleString('pt-BR')}`)
      this.printer.println(`Tipo: ${order.orderType === 'delivery' ? 'Entrega' : 'Retirada'}`)
      this.printer.drawLine()
      
      // Dados do cliente
      this.printer.bold(true)
      this.printer.println('CLIENTE')
      this.printer.bold(false)
      this.printer.println(`Nome: ${order.customer.name}`)
      this.printer.println(`Telefone: ${order.customer.phone}`)
      
      // Endereço (se for delivery)
      if (order.orderType === 'delivery' && order.address) {
        this.printer.println('\nENDEREGO DE ENTREGA:')
        this.printer.println(`${order.address.street}, ${order.address.number}`)
        if (order.address.complement) {
          this.printer.println(`Complemento: ${order.address.complement}`)
        }
        this.printer.println(`${order.address.neighborhood}`)
        this.printer.println(`${order.address.city}/${order.address.state}`)
        this.printer.println(`CEP: ${order.address.cep}`)
      }
      
      this.printer.drawLine()
      
      // Itens do pedido
      this.printer.bold(true)
      this.printer.println('ITENS DO PEDIDO')
      this.printer.bold(false)
      
      order.items.forEach(item => {
        this.printer.println(`${item.quantity}x ${item.name}`)
        this.printer.println(`   R$ ${item.price.toFixed(2)}`)
        
        if (item.observation) {
          this.printer.println(`   Obs: ${item.observation}`)
        }
        
        if (item.additions && item.additions.length > 0) {
          item.additions.forEach(addition => {
            this.printer.println(`   + ${addition.name}`)
            this.printer.println(`   R$ ${addition.price.toFixed(2)}`)
          })
        }
        
        this.printer.println('')
      })
      
      this.printer.drawLine()
      
      // Totais
      this.printer.alignRight()
      this.printer.println(`Subtotal: R$ ${order.subtotal.toFixed(2)}`)
      if (order.deliveryFee) {
        this.printer.println(`Taxa de entrega: R$ ${order.deliveryFee.toFixed(2)}`)
      }
      this.printer.bold(true)
      this.printer.println(`TOTAL: R$ ${order.total.toFixed(2)}`)
      
      // Forma de pagamento
      this.printer.bold(false)
      this.printer.println(`\nPagamento: ${this.getPaymentMethodLabel(order.payment.method)}`)
      if (order.payment.method === 'cash' && order.payment.change) {
        this.printer.println(`Troco para: R$ ${order.payment.change}`)
      }
      
      // Finalização
      this.printer.alignCenter()
      this.printer.drawLine()
      this.printer.bold(true)
      this.printer.println('Pedido confirmado!')
      this.printer.println('Bom trabalho!')
      this.printer.cut()
      
      // Executa a impressão
      await this.printer.execute()
    } catch (error) {
      console.error('Erro ao imprimir pedido:', error)
      throw new Error('Falha ao imprimir pedido')
    }
  }
  
  private getPaymentMethodLabel(method: string): string {
    const methods: { [key: string]: string } = {
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      pix: 'PIX',
      cash: 'Dinheiro',
      meal_voucher: 'Vale-Refeição'
    }
    return methods[method] || method
  }
}

// Exporta uma única instância do serviço
export const printerService = new PrinterService() 