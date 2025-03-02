import { formatCurrency } from "@/lib/utils"

// Comandos ESC/POS para impressoras térmicas
const ESC = 0x1B
const GS = 0x1D
const INIT = [ESC, 0x40] // Inicializar impressora
const CUT = [GS, 0x56, 0x41, 0x03] // Cortar papel
const CENTER = [ESC, 0x61, 0x01] // Alinhamento centralizado
const LEFT = [ESC, 0x61, 0x00] // Alinhamento à esquerda
const RIGHT = [ESC, 0x61, 0x02] // Alinhamento à direita
const BOLD_ON = [ESC, 0x45, 0x01] // Ativar negrito
const BOLD_OFF = [ESC, 0x45, 0x00] // Desativar negrito
const DOUBLE_HEIGHT = [ESC, 0x21, 0x10] // Texto com altura dupla
const NORMAL_TEXT = [ESC, 0x21, 0x00] // Texto normal
const FEED_LINE = [0x0A] // Alimentar linha

// Função auxiliar para converter texto para Uint8Array (codificação UTF-8)
function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

// Função para combinar arrays de bytes
function combineArrays(...arrays: (Uint8Array | number[])[]): Uint8Array {
  // Calcular o tamanho total
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0)
  
  // Criar um novo array com o tamanho total
  const result = new Uint8Array(totalLength)
  
  // Copiar cada array para o resultado
  let offset = 0
  for (const arr of arrays) {
    if (arr instanceof Uint8Array) {
      result.set(arr, offset)
      offset += arr.length
    } else {
      result.set(new Uint8Array(arr), offset)
      offset += arr.length
    }
  }
  
  return result
}

/**
 * Formata um pedido para impressão térmica
 * @param order Objeto do pedido
 * @param restaurantName Nome do restaurante para exibir no cabeçalho
 * @returns Uint8Array com os dados formatados para impressão
 */
export function formatOrderForPrinting(
  order: any, 
  restaurantName: string = "KRATO CARDÁPIO DIGITAL"
): Uint8Array {
  const chunks: (Uint8Array | number[])[] = []

  // Mapeamento de métodos de pagamento
  const paymentMethodNames: Record<string, string> = {
    credit_card: "Cartão de Crédito",
    debit_card: "Cartão de Débito",
    pix: "PIX",
    cash: "Dinheiro",
    meal_voucher: "Vale-Refeição",
    // Compatibilidade com formatos antigos
    credit: "Cartão de Crédito",
    debit: "Cartão de Débito",
    wallet: "Vale-Refeição"
  }

  // Inicializar impressora
  chunks.push(INIT)
  
  // Cabeçalho
  chunks.push(CENTER)
  chunks.push(BOLD_ON)
  chunks.push(DOUBLE_HEIGHT)
  chunks.push(textToBytes(restaurantName + "\n"))
  chunks.push(NORMAL_TEXT)
  chunks.push(textToBytes("Pedido #" + (order._id || order.id) + "\n"))
  
  // Data e hora
  const orderDate = new Date(order.createdAt)
  chunks.push(textToBytes(
    orderDate.toLocaleDateString() + " " + 
    orderDate.toLocaleTimeString() + "\n"
  ))
  chunks.push(BOLD_OFF)
  chunks.push(FEED_LINE)
  
  // Informações do cliente
  chunks.push(LEFT)
  chunks.push(BOLD_ON)
  chunks.push(textToBytes("CLIENTE:\n"))
  chunks.push(BOLD_OFF)
  chunks.push(textToBytes("Nome: " + order.customer.name + "\n"))
  chunks.push(textToBytes("Telefone: " + order.customer.phone + "\n"))
  
  // Tipo de pedido (Entrega ou Retirada)
  chunks.push(BOLD_ON)
  chunks.push(textToBytes("\nTIPO DE PEDIDO:\n"))
  chunks.push(BOLD_OFF)
  chunks.push(textToBytes(
    (order.orderType === 'delivery' || order.deliveryMethod === 'delivery') 
      ? "Entrega" 
      : "Retirada no local" + "\n"
  ))
  
  // Endereço se for entrega
  const deliveryAddress = order.deliveryAddress || order.address
  if ((order.orderType === 'delivery' || order.deliveryMethod === 'delivery') && deliveryAddress) {
    chunks.push(BOLD_ON)
    chunks.push(textToBytes("\nENDEREÇO DE ENTREGA:\n"))
    chunks.push(BOLD_OFF)
    chunks.push(textToBytes(
      deliveryAddress.street + ", " + 
      deliveryAddress.number + 
      (deliveryAddress.complement ? " - " + deliveryAddress.complement : "") + "\n" +
      deliveryAddress.neighborhood + "\n" +
      deliveryAddress.city + " - " + deliveryAddress.state + "\n" +
      "CEP: " + deliveryAddress.zipCode + "\n"
    ))
  }
  
  // Forma de pagamento
  chunks.push(BOLD_ON)
  chunks.push(textToBytes("\nPAGAMENTO:\n"))
  chunks.push(BOLD_OFF)
  
  const paymentMethod = order.paymentMethod || (order.payment && order.payment.method)
  const formattedPaymentMethod = paymentMethodNames[paymentMethod] || paymentMethod
  chunks.push(textToBytes(formattedPaymentMethod + "\n"))
  
  // Troco
  const change = order.change || (order.payment && order.payment.change)
  if ((paymentMethod === 'cash' || paymentMethod === 'money') && change !== undefined) {
    chunks.push(textToBytes("Troco para: " + formatCurrency(change) + "\n"))
  }
  chunks.push(FEED_LINE)
  
  // Linha separadora
  chunks.push(textToBytes("----------------------------------------\n"))
  
  // Itens do pedido
  chunks.push(BOLD_ON)
  chunks.push(textToBytes("ITENS DO PEDIDO:\n"))
  chunks.push(BOLD_OFF)
  
  const items = order.items || []
  for (const item of items) {
    // Quantidade e nome do item
    chunks.push(BOLD_ON)
    chunks.push(textToBytes(item.quantity + "x " + item.name + "\n"))
    chunks.push(BOLD_OFF)
    
    // Se for meia a meia - verifica múltiplas propriedades possíveis
    if (item.isHalfHalf || item.isHalfAndHalf || item.halfHalf) {
      // Verifica a estrutura correta dos dados de meia a meia
      if (item.halfHalf) {
        // Nova estrutura com halfHalf
        chunks.push(textToBytes("  ½ " + item.halfHalf.firstHalf.name + "\n"))
        
        // Adicionais da primeira metade
        if (item.halfHalf.firstHalf.additions && item.halfHalf.firstHalf.additions.length > 0) {
          for (const addition of item.halfHalf.firstHalf.additions) {
            chunks.push(textToBytes("    + " + addition.name + "\n"))
          }
        }
        
        chunks.push(textToBytes("  ½ " + item.halfHalf.secondHalf.name + "\n"))
        
        // Adicionais da segunda metade
        if (item.halfHalf.secondHalf.additions && item.halfHalf.secondHalf.additions.length > 0) {
          for (const addition of item.halfHalf.secondHalf.additions) {
            chunks.push(textToBytes("    + " + addition.name + "\n"))
          }
        }
      } else if (item.firstHalf && item.secondHalf) {
        // Estrutura antiga com firstHalf e secondHalf diretamente no item
        chunks.push(textToBytes("  ½ " + item.firstHalf + "\n"))
        
        // Adicionais da primeira metade
        if (item.firstHalfAdditions && item.firstHalfAdditions.length > 0) {
          for (const addition of item.firstHalfAdditions) {
            chunks.push(textToBytes("    + " + addition.name + "\n"))
          }
        }
        
        chunks.push(textToBytes("  ½ " + item.secondHalf + "\n"))
        
        // Adicionais da segunda metade
        if (item.secondHalfAdditions && item.secondHalfAdditions.length > 0) {
          for (const addition of item.secondHalfAdditions) {
            chunks.push(textToBytes("    + " + addition.name + "\n"))
          }
        }
      }
    } 
    // Adicionais normais (para itens que não são meia a meia)
    else if (item.additions && item.additions.length > 0) {
      for (const addition of item.additions) {
        chunks.push(textToBytes("  + " + addition.name + "\n"))
      }
    }
    
    // Observações do item - verifica múltiplas propriedades possíveis
    if (item.notes || item.observations || item.observation) {
      chunks.push(textToBytes("  Obs: " + (item.notes || item.observations || item.observation) + "\n"))
    }
    
    // Preço do item
    chunks.push(RIGHT)
    chunks.push(textToBytes(formatCurrency(item.price * item.quantity) + "\n"))
    chunks.push(LEFT)
    chunks.push(textToBytes("----------------------------------------\n"))
  }
  
  // Totais
  chunks.push(RIGHT)
  
  // Calcula o subtotal a partir dos itens se não estiver definido
  const subtotal = order.subtotal || order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  chunks.push(textToBytes("Subtotal: " + formatCurrency(subtotal) + "\n"))
  
  const deliveryFee = order.deliveryFee || order.delivery?.fee || 0
  if (deliveryFee > 0) {
    chunks.push(textToBytes("Taxa de entrega: " + formatCurrency(deliveryFee) + "\n"))
  }
  
  if (order.discount > 0) {
    chunks.push(textToBytes("Desconto: -" + formatCurrency(order.discount) + "\n"))
  }
  
  chunks.push(BOLD_ON)
  chunks.push(textToBytes("TOTAL: " + formatCurrency(order.total) + "\n"))
  chunks.push(BOLD_OFF)
  chunks.push(FEED_LINE)
  
  // Mensagem final
  chunks.push(CENTER)
  chunks.push(textToBytes("----------------------------------------\n"))
  chunks.push(textToBytes("Obrigado pela preferência!\n"))
  chunks.push(FEED_LINE)
  chunks.push(FEED_LINE)
  
  // Cortar papel
  chunks.push(CUT)
  
  // Combinar todos os chunks em um único Uint8Array
  return combineArrays(...chunks)
} 