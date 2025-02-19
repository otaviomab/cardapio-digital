import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const restaurantId = searchParams.get('restaurantId')

  if (!restaurantId) {
    return NextResponse.json(
      { error: 'restaurantId é obrigatório' },
      { status: 400 }
    )
  }

  try {
    const client = await clientPromise
    const db = client.db('cardapio_digital')

    // Endereços reais de Hortolândia
    const enderecos = [
      {
        cep: '13183-250',
        street: 'Rua José Camargo',
        number: '123',
        complement: 'Casa',
        neighborhood: 'Jardim Santa Clara do Lago',
        city: 'Hortolândia',
        state: 'SP'
      },
      {
        cep: '13184-010',
        street: 'Rua Luiz Camilo de Camargo',
        number: '456',
        neighborhood: 'Jardim Amanda',
        city: 'Hortolândia',
        state: 'SP'
      },
      {
        cep: '13183-721',
        street: 'Rua das Petúnias',
        number: '789',
        complement: 'Apto 12',
        neighborhood: 'Jardim das Flores',
        city: 'Hortolândia',
        state: 'SP'
      },
      {
        cep: '13184-350',
        street: 'Rua João Beraldo',
        number: '321',
        neighborhood: 'Vila Real',
        city: 'Hortolândia',
        state: 'SP'
      },
      {
        cep: '13183-480',
        street: 'Rua Santarém',
        number: '654',
        complement: 'Casa 2',
        neighborhood: 'Jardim São Sebastião',
        city: 'Hortolândia',
        state: 'SP'
      }
    ]

    // Produtos mais populares para os pedidos
    const produtos = [
      {
        name: 'X TUDO',
        price: 24.00,
        quantity: 1,
        observation: 'Sem cebola'
      },
      {
        name: 'X BACON',
        price: 20.00,
        quantity: 2,
        observation: 'Bem passado'
      },
      {
        name: 'COCA-COLA 2L',
        price: 15.00,
        quantity: 1
      },
      {
        name: 'HOT DOG COM TUDO DENTRO',
        price: 30.00,
        quantity: 1,
        observation: 'Capricha no molho'
      },
      {
        name: 'BATATA COM BACON E CHEDDAR',
        price: 25.00,
        quantity: 1
      },
      {
        name: 'PASTEL DE TRÊS QUEIJOS',
        price: 10.00,
        quantity: 3
      }
    ]

    // Nomes e telefones para os pedidos
    const clientes = [
      { name: 'João Silva', phone: '(19) 99123-4567' },
      { name: 'Maria Santos', phone: '(19) 98765-4321' },
      { name: 'Pedro Oliveira', phone: '(19) 97654-3210' },
      { name: 'Ana Costa', phone: '(19) 96543-2109' },
      { name: 'Carlos Souza', phone: '(19) 95432-1098' }
    ]

    // Formas de pagamento
    const pagamentos = [
      { method: 'credit_card' },
      { method: 'debit_card' },
      { method: 'pix' },
      { method: 'cash', change: '50.00' }
    ]

    // Função para gerar data aleatória entre ontem e hoje
    const gerarData = () => {
      const hoje = new Date()
      const ontem = new Date(hoje)
      ontem.setDate(ontem.getDate() - 1)
      
      const dataAleatoria = new Date(ontem.getTime() + Math.random() * (hoje.getTime() - ontem.getTime()))
      return dataAleatoria
    }

    // Criar 10 pedidos
    const pedidos = []
    for (let i = 0; i < 10; i++) {
      // Seleciona 1-3 produtos aleatoriamente para cada pedido
      const produtosPedido = []
      const numProdutos = Math.floor(Math.random() * 3) + 1
      for (let j = 0; j < numProdutos; j++) {
        const produto = produtos[Math.floor(Math.random() * produtos.length)]
        produtosPedido.push({
          ...produto,
          id: new ObjectId().toString()
        })
      }

      // Calcula valores
      const subtotal = produtosPedido.reduce((acc, item) => acc + (item.price * item.quantity), 0)
      const deliveryFee = Math.random() > 0.3 ? 5 : 0 // 70% chance de ser delivery
      const total = subtotal + deliveryFee

      // Define o tipo de pedido baseado na taxa de entrega
      const orderType = deliveryFee > 0 ? 'delivery' : 'pickup'
      
      // Define o status final baseado no tipo de pedido
      const finalStatus = orderType === 'delivery' ? 'delivered' : 'completed'
      const statusMessage = orderType === 'delivery' ? 'Pedido entregue' : 'Pedido retirado'

      // Cria o pedido
      const pedido = {
        restaurantId,
        status: finalStatus,
        orderType,
        customer: clientes[Math.floor(Math.random() * clientes.length)],
        address: deliveryFee > 0 ? enderecos[Math.floor(Math.random() * enderecos.length)] : null,
        payment: pagamentos[Math.floor(Math.random() * pagamentos.length)],
        items: produtosPedido,
        subtotal,
        deliveryFee,
        total,
        createdAt: gerarData(),
        updatedAt: new Date(),
        statusUpdates: [
          {
            status: 'pending',
            timestamp: gerarData(),
            message: 'Pedido realizado'
          },
          {
            status: finalStatus,
            timestamp: new Date(),
            message: statusMessage
          }
        ]
      }

      pedidos.push(pedido)
    }

    // Ordena pedidos por data
    pedidos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Limpa pedidos existentes
    await db.collection('orders').deleteMany({ restaurantId })

    // Insere os novos pedidos
    const result = await db.collection('orders').insertMany(pedidos)

    return NextResponse.json({
      message: 'Pedidos de teste criados com sucesso',
      insertedCount: result.insertedCount,
      orders: pedidos
    })

  } catch (error) {
    console.error('Erro ao criar pedidos de teste:', error)
    return NextResponse.json(
      { error: 'Erro ao criar pedidos de teste' },
      { status: 500 }
    )
  }
} 