import { NextRequest, NextResponse } from 'next/server'
import { 
  getCategories, 
  getProducts, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  getOrderStats,
  getBestSellingProducts,
  getDashboardStats
} from '@/lib/mongodb-services'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'getCategories':
        const restaurantId = searchParams.get('restaurantId')
        if (!restaurantId) {
          return NextResponse.json({ error: 'restaurantId é obrigatório' }, { status: 400 })
        }
        const categories = await getCategories(restaurantId)
        return NextResponse.json(categories)

      case 'getProducts':
        const restaurantIdForProducts = searchParams.get('restaurantId')
        if (!restaurantIdForProducts) {
          return NextResponse.json({ error: 'restaurantId é obrigatório' }, { status: 400 })
        }
        const products = await getProducts(restaurantIdForProducts)
        return NextResponse.json(products)

      case 'getOrders':
        const restaurantIdForOrders = searchParams.get('restaurantId')
        if (!restaurantIdForOrders) {
          return NextResponse.json({ error: 'restaurantId é obrigatório' }, { status: 400 })
        }
        console.log('API: Buscando pedidos para restaurantId:', restaurantIdForOrders)
        const orders = await getOrders(restaurantIdForOrders)
        console.log(`API: ${orders.length} pedidos encontrados`)
        return NextResponse.json(orders)

      case 'getOrder':
        const orderId = searchParams.get('id')
        if (!orderId) {
          return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
        }
        try {
          const order = await getOrder(orderId)
          if (!order) {
            return NextResponse.json(
              { error: 'Pedido não encontrado' },
              { status: 404 }
            )
          }
          return NextResponse.json(order)
        } catch (error) {
          console.error('Erro ao buscar pedido:', error)
          if (error instanceof Error && error.message.includes('ObjectId')) {
            return NextResponse.json(
              { error: 'ID do pedido inválido' },
              { status: 400 }
            )
          }
          return NextResponse.json(
            { error: 'Erro ao buscar pedido' },
            { status: 500 }
          )
        }

      case 'getDashboardStats': {
        const restaurantIdForStats = searchParams.get('restaurantId')
        if (!restaurantIdForStats) {
          return NextResponse.json({ error: 'restaurantId é obrigatório' }, { status: 400 })
        }

        try {
          const stats = await getDashboardStats(restaurantIdForStats)
          return NextResponse.json(stats)
        } catch (error) {
          console.error('Erro ao buscar estatísticas do dashboard:', error)
          return NextResponse.json(
            { error: 'Erro ao buscar estatísticas do dashboard' },
            { status: 500 }
          )
        }
      }

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  try {
    const body = await request.json()

    switch (action) {
      case 'createCategory':
        const newCategory = await createCategory(body)
        return NextResponse.json(newCategory)

      case 'updateCategory':
        try {
          const { id: categoryId, ...categoryData } = body
          console.log('Atualizando categoria na API:', { categoryId, categoryData })
          
          if (!categoryId) {
            return NextResponse.json(
              { error: 'ID da categoria é obrigatório' },
              { status: 400 }
            )
          }

          const result = await updateCategory(categoryId, categoryData)
          console.log('Categoria atualizada com sucesso:', result)
          return NextResponse.json({ success: true, result })
        } catch (error) {
          console.error('Erro ao atualizar categoria:', error)
          return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erro ao atualizar categoria' },
            { status: 500 }
          )
        }

      case 'deleteCategory':
        await deleteCategory(body.id)
        return NextResponse.json({ success: true })

      case 'createProduct':
        console.log('API: Criando produto com dados:', body)
        const newProduct = await createProduct(body)
        console.log('API: Produto criado com sucesso:', newProduct)
        return NextResponse.json(newProduct)

      case 'updateProduct':
        const { id: productId, ...productData } = body
        await updateProduct(productId, productData)
        return NextResponse.json({ success: true })

      case 'deleteProduct':
        await deleteProduct(body.id)
        return NextResponse.json({ success: true })

      case 'createOrder':
        const newOrder = await createOrder(body)
        return NextResponse.json(newOrder)

      case 'updateOrderStatus':
        const { status, message } = body
        console.log('API: Atualizando status do pedido', {
          id,
          status,
          message
        })
        try {
          const updatedOrder = await updateOrderStatus(id, status, message)
          console.log('API: Status do pedido atualizado com sucesso', {
            id,
            status,
            updatedOrder
          })
          return NextResponse.json({ success: true, order: updatedOrder })
        } catch (error) {
          console.error('API: Erro ao atualizar status do pedido:', error)
          return NextResponse.json(
            { error: 'Erro ao atualizar status do pedido', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
          )
        }

      case 'getOrderStats': {
        const { restaurantId, startDate, endDate } = body
        
        // Validações
        if (!restaurantId || !startDate || !endDate) {
          return NextResponse.json(
            { error: 'restaurantId, startDate e endDate são obrigatórios' },
            { status: 400 }
          )
        }

        try {
          // Busca as estatísticas
          const stats = await getOrderStats(
            restaurantId,
            new Date(startDate),
            new Date(endDate)
          )

          return NextResponse.json(stats)
        } catch (error) {
          console.error('Erro ao buscar estatísticas:', error)
          return NextResponse.json(
            { error: 'Erro ao buscar estatísticas' },
            { status: 500 }
          )
        }
      }

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
  }

  try {
    const body = await request.json()
    console.log('PUT request recebido:', { action, id, body })

    switch (action) {
      case 'updateCategory':
        try {
          console.log('Iniciando atualização de categoria:', { id, body })
          const result = await updateCategory(id, body)
          console.log('Categoria atualizada com sucesso:', result)
          return NextResponse.json(result)
        } catch (error) {
          console.error('Erro ao atualizar categoria na API:', error)
          return NextResponse.json(
            { 
              error: error instanceof Error ? error.message : 'Erro ao atualizar categoria',
              details: error
            }, 
            { status: 500 }
          )
        }

      case 'updateProduct':
        await updateProduct(id, body)
        return NextResponse.json({ success: true })

      case 'updateOrderStatus':
        const { status, message } = body
        await updateOrderStatus(id, status, message)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro geral na API:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
  }

  try {
    switch (action) {
      case 'deleteCategory':
        await deleteCategory(id)
        return NextResponse.json({ success: true })

      case 'deleteProduct':
        await deleteProduct(id)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 