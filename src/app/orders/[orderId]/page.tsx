import { CheckCircle2 } from 'lucide-react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

interface PageProps {
  params: {
    orderId: string
  }
}

export default async function OrderDetailsPage({ params }: PageProps) {
  const { orderId } = params
  
  // Conecta ao MongoDB
  const client = await clientPromise
  const db = client.db('cardapio_digital')
  
  // Busca o pedido específico
  const order = await db.collection('orders').findOne({
    _id: new ObjectId(orderId)
  })

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Pedido não encontrado</h1>
          <p className="mt-2 text-gray-600">O pedido que você procura não existe ou não está disponível.</p>
        </div>
      </div>
    )
  }

  // Busca todos os pedidos do mesmo dia para gerar o número sequencial
  const orderDate = new Date(order.createdAt)
  const startOfDay = new Date(orderDate.setHours(0, 0, 0, 0))
  const endOfDay = new Date(orderDate.setHours(23, 59, 59, 999))

  const ordersFromSameDay = await db.collection('orders')
    .find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .sort({ createdAt: 1 })
    .toArray()

  // Função para gerar o número do pedido
  const generateOrderNumber = () => {
    // Encontra a posição do pedido atual
    const orderPosition = ordersFromSameDay.findIndex(o => 
      o._id.toString() === orderId
    ) + 1

    // Formata o número do pedido: número sequencial do dia
    return orderPosition.toString().padStart(2, '0')
  }

  // Define o status do pedido
  const status = {
    label: order.status === 'pending' ? 'Pendente' :
           order.status === 'preparing' ? 'Em preparação' :
           order.status === 'ready' ? 'Pronto' :
           order.status === 'delivered' ? 'Entregue' : 'Cancelado'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Pedido #{generateOrderNumber()}
          </h2>
          <p className="text-sm text-gray-500">
            {status.label}
          </p>
        </div>
      </div>
      
      {/* Resto dos detalhes do pedido */}
      <div className="mt-6">
        <h3 className="text-md font-semibold">Detalhes do Pedido</h3>
        <pre className="mt-2 whitespace-pre-wrap bg-gray-50 p-4 rounded">
          {JSON.stringify(order, null, 2)}
        </pre>
      </div>
    </div>
  )
} 