const express = require('express')
const cors = require('cors')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)
require('dotenv').config()

const app = express()
const port = process.env.PORT || 3002

// Configuração padrão da impressora
let printerConfig = {
  name: process.env.PRINTER_INTERFACE || 'GEZHI_micro_printer',
  options: {
    media: 'Custom.72x200mm',
    'fit-to-page': true,
    'page-left': '0',
    'page-top': '0',
    'page-right': '0',
    'page-bottom': '0',
    'raw': true
  }
}

// Configuração do CORS
app.use(cors({
  origin: '*', // Permite todas as origens em desenvolvimento
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

// Middleware de log
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err)
  res.status(500).json({ error: err.message || 'Erro interno do servidor' })
})

// Função para formatar o texto do pedido
function formatOrderText(order) {
  try {
    console.log('Formatando pedido:', JSON.stringify(order, null, 2))
    
    let text = ''
    
    // Cabeçalho
    text += '================================\n'
    text += '         NOVO PEDIDO            \n'
    text += '================================\n\n'
    
    // Informações do pedido
    text += `Pedido #${order._id || order.id}\n`
    text += `Data: ${new Date().toLocaleString('pt-BR')}\n`
    text += `Tipo: ${order.orderType === 'delivery' ? 'Entrega' : 'Retirada'}\n\n`
    
    // Dados do cliente
    text += '------------ CLIENTE ------------\n'
    text += `Nome: ${order.customer?.name || 'N/A'}\n`
    text += `Telefone: ${order.customer?.phone || 'N/A'}\n\n`
    
    // Endereço (se for delivery)
    if (order.orderType === 'delivery' && order.address) {
      text += '---------- ENDEREÇO -----------\n'
      text += `${order.address.street}, ${order.address.number}\n`
      if (order.address.complement) {
        text += `Complemento: ${order.address.complement}\n`
      }
      text += `${order.address.neighborhood}\n`
      text += `${order.address.city}/${order.address.state}\n`
      text += `CEP: ${order.address.cep}\n\n`
    }
    
    // Itens do pedido
    text += '----------- ITENS -------------\n'
    if (Array.isArray(order.items)) {
      order.items.forEach(item => {
        text += `${item.quantity}x ${item.name}\n`
        text += `   R$ ${Number(item.price).toFixed(2)}\n`
        
        if (item.observation) {
          text += `   Obs: ${item.observation}\n`
        }
        
        if (Array.isArray(item.additions) && item.additions.length > 0) {
          item.additions.forEach(addition => {
            text += `   + ${addition.name}\n`
            text += `     R$ ${Number(addition.price).toFixed(2)}\n`
          })
        }
        
        text += '\n'
      })
    }
    
    text += '--------------------------------\n'
    
    // Totais
    text += `Subtotal: R$ ${Number(order.subtotal).toFixed(2)}\n`
    if (order.deliveryFee) {
      text += `Taxa de entrega: R$ ${Number(order.deliveryFee).toFixed(2)}\n`
    }
    text += `TOTAL: R$ ${Number(order.total).toFixed(2)}\n\n`
    
    // Forma de pagamento
    text += '--------- PAGAMENTO -----------\n'
    text += `Forma: ${getPaymentMethodLabel(order.payment?.method)}\n`
    if (order.payment?.method === 'cash' && order.payment?.change) {
      text += `Troco para: R$ ${Number(order.payment.change).toFixed(2)}\n`
    }
    
    // Finalização
    text += '\n================================\n'
    text += '      Pedido confirmado!        \n'
    text += '        Bom trabalho!           \n'
    text += '================================\n'
    
    console.log('Texto formatado:', text)
    return text
  } catch (error) {
    console.error('Erro ao formatar texto do pedido:', error)
    throw error
  }
}

// Rota para imprimir pedido
app.post('/print-order', async (req, res) => {
  try {
    console.log('Recebido pedido para impressão:', JSON.stringify(req.body, null, 2))
    const order = req.body
    const text = formatOrderText(order)
    
    // Cria um arquivo temporário com o texto
    const tempFile = `/tmp/order-${order._id || order.id || Date.now()}.txt`
    await execAsync(`echo "${text}" > ${tempFile}`)
    
    // Imprime usando lp em modo texto puro
    const { stdout, stderr } = await execAsync(
      `lp -d ${printerConfig.name} -o raw ${tempFile}`
    )
    
    // Remove o arquivo temporário
    await execAsync(`rm ${tempFile}`)
    
    console.log('Impressão realizada com sucesso:', { stdout, stderr })
    res.json({ success: true, stdout, stderr })
  } catch (error) {
    console.error('Erro ao imprimir pedido:', error)
    res.status(500).json({ error: error.message || 'Falha ao imprimir pedido' })
  }
})

// Rota para testar impressora
app.post('/test-print', async (req, res) => {
  try {
    console.log('Iniciando teste de impressão')
    const testText = `================================
         TESTE DE IMPRESSAO         
================================

Data: ${new Date().toLocaleString('pt-BR')}

TEXTO SIMPLES PARA TESTE
1 2 3 4 5 6 7 8 9 0

ACENTUACAO:
aeiou AEIOU

CARACTERES ESPECIAIS:
& @ $ % #

================================
      TESTE CONCLUIDO           
================================\n\n\n\n`
    
    // Cria um arquivo temporário com o texto de teste
    const tempFile = '/tmp/printer-test.txt'
    await execAsync(`echo "${testText}" > ${tempFile}`)
    
    // Imprime usando lp em modo texto puro
    const { stdout, stderr } = await execAsync(
      `lp -d ${printerConfig.name} -o raw ${tempFile}`
    )
    
    // Remove o arquivo temporário
    await execAsync(`rm ${tempFile}`)
    
    console.log('Teste de impressão realizado com sucesso:', { stdout, stderr })
    res.json({ success: true, stdout, stderr })
  } catch (error) {
    console.error('Erro no teste de impressão:', error)
    res.status(500).json({ error: error.message })
  }
})

// Rota para verificar status
app.get('/status', async (req, res) => {
  try {
    console.log('Verificando status da impressora')
    const { stdout, stderr } = await execAsync(`lpstat -p ${printerConfig.name}`)
    const isOnline = !stderr && stdout.includes('enabled')
    
    const status = {
      connected: isOnline,
      status: isOnline ? 'online' : 'offline',
      details: stdout
    }
    
    console.log('Status da impressora:', status)
    res.json(status)
  } catch (error) {
    console.error('Erro ao verificar status:', error)
    res.status(500).json({
      connected: false,
      status: 'error',
      error: error.message
    })
  }
})

// Rota para atualizar configuração
app.post('/config', (req, res) => {
  try {
    console.log('Recebida nova configuração:', req.body)
    const { config } = req.body
    if (!config) {
      return res.status(400).json({ error: 'Configuração não fornecida' })
    }

    // Atualiza apenas o nome da impressora, mantendo as opções padrão
    printerConfig.name = config.interface || printerConfig.name

    console.log('Configuração atualizada:', printerConfig)
    res.json({ success: true, config: printerConfig })
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error)
    res.status(500).json({ error: error.message })
  }
})

// Rota para obter configuração atual
app.get('/config', (req, res) => {
  console.log('Retornando configuração atual')
  res.json({
    type: 'epson',
    interface: printerConfig.name,
    characterSet: 'PC860_PORTUGUESE',
    removeSpecialCharacters: false,
    timeout: 5000
  })
})

function getPaymentMethodLabel(method) {
  const methods = {
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    pix: 'PIX',
    cash: 'Dinheiro',
    meal_voucher: 'Vale-Refeição'
  }
  return methods[method] || method
}

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor da impressora rodando na porta ${port}`)
  console.log('Configuração inicial:', printerConfig)
}) 