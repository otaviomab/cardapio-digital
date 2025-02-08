const { MongoClient } = require('mongodb')

const MONGODB_URI = 'mongodb://admin:admin123@localhost:27017/cardapio_digital?authSource=admin'

// Dados de exemplo para gerar pedidos aleatórios
const NOMES = [
  'João Silva',
  'Maria Santos',
  'Pedro Oliveira',
  'Ana Souza',
  'Lucas Ferreira',
  'Juliana Costa',
  'Carlos Rodrigues',
  'Fernanda Lima',
  'Marcos Pereira',
  'Patricia Almeida'
]

const TELEFONES = [
  '(11) 98765-4321',
  '(11) 97654-3210',
  '(11) 96543-2109',
  '(11) 95432-1098',
  '(11) 94321-0987'
]

const ENDERECOS = [
  {
    cep: '04538-132',
    street: 'Rua dos Pinheiros',
    number: '123',
    complement: 'Apto 42',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    state: 'SP'
  },
  {
    cep: '04571-010',
    street: 'Rua Joaquim Floriano',
    number: '456',
    complement: 'Casa 2',
    neighborhood: 'Itaim Bibi',
    city: 'São Paulo',
    state: 'SP'
  },
  {
    cep: '05424-150',
    street: 'Rua Oscar Freire',
    number: '789',
    complement: 'Sala 15',
    neighborhood: 'Jardins',
    city: 'São Paulo',
    state: 'SP'
  },
  {
    cep: '01310-200',
    street: 'Avenida Paulista',
    number: '1000',
    complement: 'Bloco A',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP'
  },
  {
    cep: '04545-001',
    street: 'Rua João Cachoeira',
    number: '321',
    complement: '',
    neighborhood: 'Vila Nova Conceição',
    city: 'São Paulo',
    state: 'SP'
  }
]

const FORMAS_PAGAMENTO = [
  { method: 'credit', label: 'Cartão de Crédito' },
  { method: 'debit', label: 'Cartão de Débito' },
  { method: 'pix', label: 'PIX' },
  { method: 'cash', label: 'Dinheiro', change: 'R$ 100,00' },
  { method: 'wallet', label: 'Vale-Refeição' }
]

const STATUS = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered'
]

const STATUS_MESSAGES = {
  pending: 'Pedido realizado',
  confirmed: 'Pedido confirmado pelo restaurante',
  preparing: 'Pedido em preparação',
  ready: 'Pedido pronto para entrega/retirada',
  out_for_delivery: 'Pedido saiu para entrega',
  delivered: 'Pedido entregue com sucesso'
}

// Função para gerar um número aleatório entre min e max
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// Função para gerar um item aleatório de um array
const randomItem = (array) => array[Math.floor(Math.random() * array.length)]

// Função para gerar uma data aleatória nos últimos 7 dias
const randomDate = () => {
  const date = new Date()
  date.setDate(date.getDate() - random(0, 7))
  date.setHours(random(10, 22), random(0, 59), random(0, 59))
  return date
}

// Função para gerar status updates baseado no status atual
const generateStatusUpdates = (status, createdAt) => {
  const updates = []
  const statusIndex = STATUS.indexOf(status)
  
  for (let i = 0; i <= statusIndex; i++) {
    const currentStatus = STATUS[i]
    const date = new Date(createdAt)
    date.setMinutes(date.getMinutes() + (i * 15)) // Adiciona 15 minutos para cada status
    
    updates.push({
      status: currentStatus,
      timestamp: date,
      message: STATUS_MESSAGES[currentStatus]
    })
  }
  
  return updates
}

async function createTestOrders() {
  try {
    console.log('Conectando ao MongoDB...')
    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db('cardapio_digital')
    
    // Limpa os pedidos existentes
    console.log('Limpando pedidos existentes...')
    await db.collection('orders').deleteMany({})
    
    // Busca produtos existentes para usar nos pedidos
    console.log('Buscando produtos existentes...')
    const products = await db.collection('products')
      .find({ restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16' })
      .toArray()

    if (!products.length) {
      throw new Error('Nenhum produto encontrado. Execute o script initialize-menu.js primeiro.')
    }

    console.log('Criando pedidos de teste...')
    const orders = []

    // Gera 20 pedidos de teste
    for (let i = 0; i < 20; i++) {
      // Gera de 1 a 5 itens por pedido
      const numItems = random(1, 5)
      const items = []
      let subtotal = 0

      for (let j = 0; j < numItems; j++) {
        const product = randomItem(products)
        const quantity = random(1, 3)
        const additions = []

        // Adiciona adicionais aleatoriamente
        if (product.additions && Math.random() > 0.5) {
          const numAdditions = random(1, product.additions.length)
          for (let k = 0; k < numAdditions; k++) {
            const addition = randomItem(product.additions)
            additions.push({
              name: addition.name,
              price: addition.price
            })
          }
        }

        const itemTotal = (product.price * quantity) + 
          additions.reduce((sum, add) => sum + add.price, 0)
        
        subtotal += itemTotal

        items.push({
          id: product._id.toString(),
          name: product.name,
          price: product.price,
          quantity,
          additions,
          observation: Math.random() > 0.7 ? 'Capricha no preparo, por favor!' : ''
        })
      }

      // Define tipo do pedido (70% chance de ser delivery)
      const orderType = Math.random() > 0.3 ? 'delivery' : 'pickup'
      
      // Define status aleatório
      const status = randomItem(STATUS)
      
      // Gera data de criação
      const createdAt = randomDate()

      // Calcula taxa de entrega para pedidos delivery
      const deliveryFee = orderType === 'delivery' ? random(5, 15) : 0

      // Gera forma de pagamento
      const payment = randomItem(FORMAS_PAGAMENTO)

      const order = {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        status,
        orderType,
        customer: {
          name: randomItem(NOMES),
          phone: randomItem(TELEFONES)
        },
        address: orderType === 'delivery' ? randomItem(ENDERECOS) : null,
        payment: {
          method: payment.method,
          change: payment.method === 'cash' ? payment.change : null
        },
        items,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        statusUpdates: generateStatusUpdates(status, createdAt),
        createdAt,
        updatedAt: new Date()
      }

      orders.push(order)
    }

    // Insere os pedidos ordenados por data
    orders.sort((a, b) => b.createdAt - a.createdAt)
    await db.collection('orders').insertMany(orders)

    console.log('Pedidos de teste criados com sucesso!')
    console.log(`Total de pedidos criados: ${orders.length}`)
    
    await client.close()
    process.exit(0)
  } catch (error) {
    console.error('Erro ao criar pedidos de teste:', error)
    process.exit(1)
  }
}

createTestOrders() 