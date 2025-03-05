'use client'

import { useState, useCallback, useEffect } from 'react'

interface UseThermalPrinterReturn {
  isPrinting: boolean;
  isSupported: boolean;
  hasPrinterAccess: boolean;
  printerName: string | null;
  requestPrinterAccess: () => Promise<boolean>;
  print: (orderData: any, restaurantName?: string) => Promise<boolean>;
  error: string | null;
}

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
      
      // Criar uma janela em tela cheia para garantir que os botões fiquem visíveis
      const printWindow = window.open('', '_blank', 'fullscreen=yes,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes,status=no')
      
      if (!printWindow) {
        throw new Error('Não foi possível abrir janela de impressão')
      }
      
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
            <div class="center bold large">${restaurantName}</div>
            <div class="center">${new Date().toLocaleString()}</div>
            <div class="center bold">PEDIDO #${orderData._id || orderData.id || '000'}</div>
            <hr>
            <div>Cliente: ${orderData.customer?.name || 'Cliente'}</div>
            <div>Telefone: ${orderData.customer?.phone || '-'}</div>
            <div>Tipo: ${
              (orderData.orderType === 'delivery' || orderData.deliveryMethod === 'delivery')
                ? 'Entrega'
                : 'Retirada'
            }</div>
            ${(orderData.orderType === 'delivery' || orderData.deliveryMethod === 'delivery') && orderData.deliveryAddress 
              ? `<div>Endereço: ${
                  typeof orderData.deliveryAddress === 'string' 
                    ? orderData.deliveryAddress 
                    : `${orderData.deliveryAddress.street}, ${orderData.deliveryAddress.number}${
                        orderData.deliveryAddress.complement ? ` - ${orderData.deliveryAddress.complement}` : ''
                      }, ${orderData.deliveryAddress.neighborhood}, ${orderData.deliveryAddress.city}`
                }</div>` 
              : ''}
            <hr>
            <div class="bold">ITENS DO PEDIDO:</div>
            ${(orderData.items || []).map((item: any) => `
              <div class="item">
                <div class="bold">${item.quantity}x ${item.name}</div>
                <div>R$ ${(item.price * item.quantity).toFixed(2)}</div>
                ${
                  // Verificar se é meia a meia
                  item.isHalfHalf || item.isHalfAndHalf || item.halfHalf
                    ? `
                      <div>
                        ${
                          item.halfHalf
                            ? `
                              <div>½ ${item.halfHalf.firstHalf.name}</div>
                              ${
                                item.halfHalf.firstHalf.additions && item.halfHalf.firstHalf.additions.length > 0
                                  ? item.halfHalf.firstHalf.additions.map((addition: any) => 
                                      `<div>&nbsp;&nbsp;+ ${addition.name}</div>`
                                    ).join('')
                                  : ''
                              }
                              <div>½ ${item.halfHalf.secondHalf.name}</div>
                              ${
                                item.halfHalf.secondHalf.additions && item.halfHalf.secondHalf.additions.length > 0
                                  ? item.halfHalf.secondHalf.additions.map((addition: any) => 
                                      `<div>&nbsp;&nbsp;+ ${addition.name}</div>`
                                    ).join('')
                                  : ''
                              }
                            `
                            : `
                              <div>½ ${item.firstHalf}</div>
                              ${
                                item.firstHalfAdditions && item.firstHalfAdditions.length > 0
                                  ? item.firstHalfAdditions.map((addition: any) => 
                                      `<div>&nbsp;&nbsp;+ ${addition.name}</div>`
                                    ).join('')
                                  : ''
                              }
                              <div>½ ${item.secondHalf}</div>
                              ${
                                item.secondHalfAdditions && item.secondHalfAdditions.length > 0
                                  ? item.secondHalfAdditions.map((addition: any) => 
                                      `<div>&nbsp;&nbsp;+ ${addition.name}</div>`
                                    ).join('')
                                  : ''
                              }
                            `
                        }
                      </div>
                    `
                    : item.additions && item.additions.length > 0
                      ? item.additions.map((addition: any) => 
                          `<div>&nbsp;&nbsp;+ ${addition.name}</div>`
                        ).join('')
                      : ''
                }
                ${
                  item.notes || item.observations || item.observation
                    ? `<div>Obs: ${item.notes || item.observations || item.observation}</div>`
                    : ''
                }
              </div>
            `).join('<hr>')}
            <hr>
            <div class="total">Subtotal: R$ ${
              (orderData.subtotal || 
               (orderData.items || []).reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)
              ).toFixed(2)
            }</div>
            ${
              orderData.deliveryFee || (orderData.delivery && orderData.delivery.fee)
                ? `<div>Taxa de entrega: R$ ${
                    (orderData.deliveryFee || (orderData.delivery && orderData.delivery.fee)).toFixed(2)
                  }</div>`
                : ''
            }
            ${
              orderData.discount && orderData.discount > 0
                ? `<div>Desconto: -R$ ${orderData.discount.toFixed(2)}</div>`
                : ''
            }
            <div class="total large">TOTAL: R$ ${orderData.total.toFixed(2)}</div>
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