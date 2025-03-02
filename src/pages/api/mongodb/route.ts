import { NextRequest, NextResponse } from 'next/server'
import { 
  getOrders, 
  createOrder, 
  updateOrderStatus 
} from '@/lib/mongodb-services'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const restaurantId = searchParams.get('restaurantId')

    if (!action) {
      return NextResponse.json({ error: 'Ação não especificada' }, { status: 400 })
    }

    if (action === 'getOrders') {
      if (!restaurantId) {
        return NextResponse.json({ error: 'ID do restaurante não especificado' }, { status: 400 })
      }

      const orders = await getOrders(restaurantId)
      return NextResponse.json(orders)
    }

    return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 })
  } catch (error) {
    console.error('Erro na API MongoDB:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'Ação não especificada' }, { status: 400 })
    }

    if (action === 'createOrder') {
      const order = await createOrder(data)
      return NextResponse.json(order)
    }

    if (action === 'updateOrderStatus') {
      const { orderId, status } = data
      
      if (!orderId || !status) {
        return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
      }
      
      const updatedOrder = await updateOrderStatus(orderId, status)
      return NextResponse.json(updatedOrder)
    }

    return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 })
  } catch (error) {
    console.error('Erro na API MongoDB:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 