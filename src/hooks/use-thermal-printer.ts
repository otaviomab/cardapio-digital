'use client'

import { useState, useCallback } from 'react'

interface UseThermalPrinterReturn {
  isPrinting: boolean;
  isSupported: boolean;
  hasPrinterAccess: boolean;
  printerName: string | null;
  requestPrinterAccess: () => Promise<boolean>;
  print: (orderData: any, restaurantName?: string) => Promise<boolean>;
  error: string | null;
}

// Função auxiliar para formatar moeda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function useThermalPrinter(): UseThermalPrinterReturn {
  const [isPrinting, setIsPrinting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // No novo modelo, sempre disponível para todos os navegadores
  const isSupported = true
  const hasPrinterAccess = true
  const printerName = 'Impressora do Sistema'

  // Solicitação de acesso à impressora (mantida por compatibilidade)
  const requestPrinterAccess = useCallback(async (): Promise<boolean> => {
    return true
  }, [])

  // Função de impressão usando API nativa do navegador
  const print = useCallback(async (orderData: any, restaurantName = "KRATO CARDÁPIO DIGITAL"): Promise<boolean> => {
    try {
      setIsPrinting(true)
      setError(null)
      
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
        wallet: "Vale-Refeição",
        money: "Dinheiro"
      }
      
      // Criar uma janela em tela cheia para garantir que os botões fiquem visíveis
      const printWindow = window.open('', '_blank', 'fullscreen=yes,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes,status=no')
      
      if (!printWindow) {
        throw new Error('Não foi possível abrir janela de impressão')
      }
      
      // Obter informações do pedido
      const orderId = orderData._id || orderData.id || orderData.number || '000';
      const orderDate = new Date(orderData.createdAt || new Date());
      const formattedDate = orderDate.toLocaleDateString('pt-BR');
      const formattedTime = orderDate.toLocaleTimeString('pt-BR');
      
      // Informações do cliente
      const customerName = orderData.customer?.name || 'Cliente';
      const customerPhone = orderData.customer?.phone || '-';
      
      // Tipo de pedido
      const isDelivery = orderData.orderType === 'delivery' || orderData.deliveryMethod === 'delivery';
      const orderType = isDelivery ? 'Entrega' : 'Retirada no local';
      
      // Endereço de entrega
      let deliveryAddressHtml = '';
      const deliveryAddress = orderData.deliveryAddress || orderData.address;
      
      if (isDelivery && deliveryAddress) {
        if (typeof deliveryAddress === 'string') {
          deliveryAddressHtml = `<div>Endereço: ${deliveryAddress}</div>`;
        } else {
          // Formatação detalhada do endereço
          deliveryAddressHtml = `
            <div>Endereço: ${deliveryAddress.street}, ${deliveryAddress.number}${
              deliveryAddress.complement ? ` - ${deliveryAddress.complement}` : ''
            }</div>
            <div>Bairro: ${deliveryAddress.neighborhood || '-'}</div>
            <div>Cidade: ${deliveryAddress.city || '-'}${deliveryAddress.state ? ` - ${deliveryAddress.state}` : ''}</div>
            ${deliveryAddress.zipCode ? `<div>CEP: ${deliveryAddress.zipCode}</div>` : ''}
            ${deliveryAddress.reference ? `<div>Referência: ${deliveryAddress.reference}</div>` : ''}
          `;
        }
      }
      
      // Informações de pagamento
      const paymentMethod = orderData.paymentMethod || (orderData.payment && orderData.payment.method) || '-';
      const formattedPaymentMethod = paymentMethodNames[paymentMethod] || paymentMethod;
      
      // Troco
      const change = orderData.change || (orderData.payment && orderData.payment.change);
      let changeHtml = '';
      if ((paymentMethod === 'cash' || paymentMethod === 'money') && change !== undefined) {
        changeHtml = `<div>Troco para: ${formatCurrency(change)}</div>`;
      }
      
      // Itens do pedido
      const items = orderData.items || [];
      let itemsHtml = '';
      
      for (const item of items) {
        itemsHtml += `
          <div class="item">
            <div class="bold">${item.quantity}x ${item.name}</div>
            <div>${formatCurrency(item.price * item.quantity)}</div>
        `;
        
        // Se for meia a meia
        if (item.isHalfHalf || item.isHalfAndHalf || item.halfHalf) {
          if (item.halfHalf) {
            // Nova estrutura com halfHalf
            itemsHtml += `<div>½ ${item.halfHalf.firstHalf.name}</div>`;
            
            // Adicionais da primeira metade
            if (item.halfHalf.firstHalf.additions && item.halfHalf.firstHalf.additions.length > 0) {
              for (const addition of item.halfHalf.firstHalf.additions) {
                itemsHtml += `<div>&nbsp;&nbsp;+ ${addition.name}</div>`;
              }
            }
            
            itemsHtml += `<div>½ ${item.halfHalf.secondHalf.name}</div>`;
            
            // Adicionais da segunda metade
            if (item.halfHalf.secondHalf.additions && item.halfHalf.secondHalf.additions.length > 0) {
              for (const addition of item.halfHalf.secondHalf.additions) {
                itemsHtml += `<div>&nbsp;&nbsp;+ ${addition.name}</div>`;
              }
            }
          } else if (item.firstHalf && item.secondHalf) {
            // Estrutura antiga com firstHalf e secondHalf diretamente no item
            itemsHtml += `<div>½ ${item.firstHalf}</div>`;
            
            // Adicionais da primeira metade
            if (item.firstHalfAdditions && item.firstHalfAdditions.length > 0) {
              for (const addition of item.firstHalfAdditions) {
                itemsHtml += `<div>&nbsp;&nbsp;+ ${addition.name}</div>`;
              }
            }
            
            itemsHtml += `<div>½ ${item.secondHalf}</div>`;
            
            // Adicionais da segunda metade
            if (item.secondHalfAdditions && item.secondHalfAdditions.length > 0) {
              for (const addition of item.secondHalfAdditions) {
                itemsHtml += `<div>&nbsp;&nbsp;+ ${addition.name}</div>`;
              }
            }
          }
        } 
        // Adicionais normais (para itens que não são meia a meia)
        else if (item.additions && item.additions.length > 0) {
          for (const addition of item.additions) {
            itemsHtml += `<div>&nbsp;&nbsp;+ ${addition.name}</div>`;
          }
        }
        
        // Observações do item
        if (item.notes || item.observations || item.observation) {
          itemsHtml += `<div>Obs: ${item.notes || item.observations || item.observation}</div>`;
        }
        
        itemsHtml += `</div><hr>`;
      }
      
      // Calcular totais
      const subtotal = orderData.subtotal || items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
      const deliveryFee = orderData.deliveryFee || (orderData.delivery && orderData.delivery.fee) || 0;
      const discount = orderData.discount || 0;
      const total = orderData.total || (subtotal + deliveryFee - discount);
      
      // Configurar o conteúdo para impressão térmica (largura fixa de 80mm)
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Impressão de Pedido</title>
          <style>
            @page {
              size: 80mm auto;  /* Largura típica de papel térmico */
              margin: 0;
            }
            body {
              font-family: monospace;
              font-size: 12px;
              width: 80mm;
              margin: 0 auto;
              padding: 5px;
            }
            .print-container {
              width: 80mm;
              margin: 20px auto;
              border: 1px dashed #ccc;
              padding: 10px;
              background-color: white;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .large { font-size: 14px; }
            hr { border-top: 1px dashed #000; }
            .item { margin-bottom: 5px; }
            .total { font-weight: bold; margin-top: 10px; }
            .print-button {
              display: block;
              width: 200px;
              margin: 20px auto;
              padding: 10px;
              background-color: #4CAF50;
              color: white;
              font-size: 16px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            .print-button:hover {
              background-color: #45a049;
            }
            .close-button {
              display: block;
              width: 200px;
              margin: 10px auto;
              padding: 10px;
              background-color: #f44336;
              color: white;
              font-size: 16px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            .close-button:hover {
              background-color: #d32f2f;
            }
            .instructions {
              max-width: 500px;
              margin: 20px auto;
              padding: 10px;
              background-color: #f9f9f9;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            .section {
              margin-bottom: 10px;
            }
            @media print {
              .print-button, .close-button, .instructions {
                display: none;
              }
              .print-container {
                border: none;
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="instructions">
            <h2>Impressão de Pedido</h2>
            <p>Clique no botão "Imprimir" abaixo para enviar o pedido para a impressora.</p>
            <p>Certifique-se de selecionar a impressora térmica na caixa de diálogo de impressão.</p>
          </div>
          
          <div class="print-container">
            <!-- Cabeçalho -->
            <div class="center bold large">${restaurantName}</div>
            <div class="center">${formattedDate} ${formattedTime}</div>
            <div class="center bold">PEDIDO #${orderId}</div>
            <hr>
            
            <!-- Informações do Cliente -->
            <div class="section">
              <div class="bold">CLIENTE:</div>
              <div>Nome: ${customerName}</div>
              <div>Telefone: ${customerPhone}</div>
            </div>
            
            <!-- Tipo de Pedido -->
            <div class="section">
              <div class="bold">TIPO DE PEDIDO:</div>
              <div>${orderType}</div>
              ${isDelivery ? deliveryAddressHtml : ''}
            </div>
            
            <!-- Forma de Pagamento -->
            <div class="section">
              <div class="bold">PAGAMENTO:</div>
              <div>${formattedPaymentMethod}</div>
              ${changeHtml}
            </div>
            <hr>
            
            <!-- Itens do Pedido -->
            <div class="bold">ITENS DO PEDIDO:</div>
            ${itemsHtml}
            
            <!-- Totais -->
            <div class="total">Subtotal: ${formatCurrency(subtotal)}</div>
            ${deliveryFee > 0 ? `<div>Taxa de entrega: ${formatCurrency(deliveryFee)}</div>` : ''}
            ${discount > 0 ? `<div>Desconto: -${formatCurrency(discount)}</div>` : ''}
            <div class="total large">TOTAL: ${formatCurrency(total)}</div>
            <div class="center">* * * * * * * * * * * * * * * *</div>
            <div class="center">Obrigado pela preferência!</div>
          </div>
          
          <button class="print-button" onclick="window.print();">Imprimir</button>
          <button class="close-button" onclick="window.close();">Fechar</button>
          
          <script>
            // Função para imprimir automaticamente após 1 segundo
            setTimeout(function() {
              // Não imprime automaticamente, aguarda o clique no botão
              // window.print();
            }, 1000);
          </script>
        </body>
        </html>
      `)
      
      printWindow.document.close()
      
      // Não fechamos a janela automaticamente, o usuário deve clicar em "Fechar" após imprimir
      setIsPrinting(false)
      
      return true
    } catch (err: any) {
      console.error('Erro ao imprimir:', err)
      setError(err.message || 'Erro desconhecido ao imprimir')
      setIsPrinting(false)
      return false
    }
  }, [])
  
  return {
    isPrinting,
    isSupported,
    hasPrinterAccess,
    printerName,
    requestPrinterAccess,
    print,
    error
  }
} 