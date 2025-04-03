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
      
      // Função auxiliar para obter categorias de produtos que não as têm
      const ensureCategories = async (items: any[]) => {
        const restaurantId = orderData.restaurantId;
        if (!restaurantId || !items || !Array.isArray(items)) return items;
        
        // Filtra apenas itens sem categoria
        const itemsWithoutCategory = items.filter(item => !item.category);
        if (itemsWithoutCategory.length === 0) return items;
        
        try {
          // Busca produtos para tentar encontrar categorias
          const response = await fetch(`/api/mongodb?action=getProducts&restaurantId=${restaurantId}`);
          if (!response.ok) return items;
          
          const products = await response.json();
          if (!products || !Array.isArray(products)) return items;
          
          // Atualiza os itens com as categorias encontradas
          return items.map(item => {
            if (item.category) return item;
            
            // Busca o produto correspondente
            const matchingProduct = products.find(p => 
              p._id === item.productId || 
              p.id === item.productId || 
              p.name === item.name
            );
            
            if (matchingProduct && matchingProduct.category) {
              console.log(`Categoria encontrada para impressão: ${item.name} -> ${matchingProduct.category}`);
              return { ...item, category: matchingProduct.category };
            }
            
            return item;
          });
        } catch (error) {
          console.error('Erro ao buscar categorias para impressão:', error);
          return items;
        }
      };
      
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
      let items = orderData.items || [];
      
      // Adicionar logs para depuração
      console.log('[IMPRESSÃO] Estrutura completa do pedido:', JSON.stringify(orderData, null, 2));
      console.log('[IMPRESSÃO] Itens do pedido antes do processamento:', JSON.stringify(items, null, 2));
      
      // Simplificar o processamento e garantir que todos os itens tenham categoria
      items = items.map((item: any) => {
        // Logs específicos para itens meio a meio
        if (item.isHalfHalf && item.halfHalf) {
          console.log('[IMPRESSÃO] Item meio a meio encontrado:', item.name);
          console.log('[IMPRESSÃO] Estrutura do item meio a meio:', JSON.stringify(item, null, 2));
          console.log('[IMPRESSÃO] Categoria primeira metade:', item.halfHalf.firstHalf?.category);
          console.log('[IMPRESSÃO] Categoria segunda metade:', item.halfHalf.secondHalf?.category);
          
          // Garantir que as metades tenham categorias
          if (item.halfHalf.firstHalf && !item.halfHalf.firstHalf.category) {
            item.halfHalf.firstHalf.category = item.category || 'Não classificado';
          }
          
          if (item.halfHalf.secondHalf && !item.halfHalf.secondHalf.category) {
            item.halfHalf.secondHalf.category = item.category || 'Não classificado';
          }
        }
        
        // Se não tiver categoria, aplicar uma padrão
        if (!item.category) {
          return { ...item, category: 'Não classificado' };
        }
        return item;
      });
      
      let itemsHtml = '';
      
      for (const item of items) {
        // Criar um formato mais simples e robusto para a impressão
        itemsHtml += `
          <div class="item">
            <div class="bold">${item.quantity}x ${item.name}</div>
        `;
        
        // Se for meia a meia, mostrar categorias das metades
        if (item.isHalfHalf && item.halfHalf) {
          // Implementação melhorada para obter categorias das metades
          let firstHalfCategory = 'Não classificado';
          let secondHalfCategory = 'Não classificado';
          
          // Tentativa 1: Usar diretamente da estrutura halfHalf
          if (item.halfHalf.firstHalf && item.halfHalf.firstHalf.category) {
            firstHalfCategory = item.halfHalf.firstHalf.category;
          }
          
          if (item.halfHalf.secondHalf && item.halfHalf.secondHalf.category) {
            secondHalfCategory = item.halfHalf.secondHalf.category;
          }
          
          // Tentativa 2: Se não encontrou categoria, tenta obter do item principal
          if (firstHalfCategory === 'Não classificado' && item.category) {
            firstHalfCategory = item.category;
          }
          
          if (secondHalfCategory === 'Não classificado' && item.category) {
            secondHalfCategory = item.category;
          }
          
          // Registra as categorias que serão mostradas
          console.log('[IMPRESSÃO] Categorias usadas na impressão:');
          console.log(`Primeira metade: ${firstHalfCategory}`);
          console.log(`Segunda metade: ${secondHalfCategory}`);
          
          // Adiciona ao HTML
          itemsHtml += `<div class="item-category">CATEGORIA (1/2): ${firstHalfCategory}</div>`;
          itemsHtml += `<div class="item-category">CATEGORIA (2/2): ${secondHalfCategory}</div>`;
        } else {
          // Se não for meia a meia, mostrar a categoria principal
          itemsHtml += `<div class="item-category">CATEGORIA: ${item.category || 'Não classificado'}</div>`;
        }
        
        itemsHtml += `
            <div>${formatCurrency(item.price * item.quantity)}</div>
        `;
        
        // Se for meia a meia
        if (item.isHalfHalf && item.halfHalf) {
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
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
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
            .item-category {
              font-weight: bold;
              text-decoration: underline;
              padding: 2px 0;
              margin: 2px 0;
            }
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
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                width: 100%;
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
            <p>Certifique-se de selecionar a impressora térmica na caixa de diálogo de impressão e <strong>desabilitar cabeçalhos e rodapés</strong>.</p>
            <p><strong>Importante:</strong> Nas opções de impressão, selecione "Simplificado" ou "Modo rascunho" se disponível.</p>
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
            ${deliveryFee > 0 ? `<div class="total">Taxa de entrega: ${formatCurrency(deliveryFee)}</div>` : `<div class="total">Taxa de entrega: ${formatCurrency(0)}</div>`}
            ${discount > 0 ? `<div>Desconto: -${formatCurrency(discount)}</div>` : ''}
            <div class="total large">TOTAL: ${formatCurrency(total)}</div>
            <div class="center">* * * * * * * * * * * * * * * *</div>
            <div class="center">Obrigado pela preferência!</div>
          </div>
          
          <button class="print-button" onclick="printReceipt();">Imprimir</button>
          <button class="close-button" onclick="window.close();">Fechar</button>
          
          <script>
            function printReceipt() {
              // Configurações para impressão
              const mediaQueryList = window.matchMedia('print');
              
              // Configurar a página para impressão
              const style = document.createElement('style');
              style.textContent = '@page { size: 80mm auto; margin: 0; }';
              document.head.appendChild(style);
              
              // Remover cabeçalhos e rodapés
              const oldTitle = document.title;
              document.title = "";
              
              window.print();
              
              // Restaurar título
              document.title = oldTitle;
              document.head.removeChild(style);
            }
            
            // Função para configurar a impressão quando a página carrega
            window.onload = function() {
              // Configurar impressão
              const mediaQueryList = window.matchMedia('print');
              mediaQueryList.addListener(function(mql) {
                if (mql.matches) {
                  // Antes de imprimir
                  document.body.classList.add('printing');
                } else {
                  // Depois de imprimir
                  document.body.classList.remove('printing');
                }
              });
            };
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
