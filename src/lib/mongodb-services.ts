import { ObjectId } from 'mongodb'
import clientPromise from './mongodb'
import { Category, Product } from '@/types/restaurant'
import { Order } from '@/types/order'
import { supabase } from '@/lib/supabase'

// Funções para Categorias
export async function getCategories(restaurantId: string) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('categories')
  
  return collection
    .find({ restaurantId })
    .sort({ order: 1 })
    .toArray()
}

export async function createCategory(category: Omit<Category, 'id'>) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('categories')
  
  const result = await collection.insertOne(category)
  return { ...category, id: result.insertedId.toString() }
}

export async function updateCategory(id: string, category: Partial<Category>) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('categories')
  
  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: category }
  )
}

export async function deleteCategory(id: string) {
  const client = await clientPromise
  const db = client.db('cardapio_digital')
  
  // Primeiro encontra todos os produtos da categoria
  const products = await db.collection('products')
    .find({ categoryId: id })
    .toArray()

  // Deleta as imagens do Supabase Storage
  for (const product of products) {
    if (product.image) {
      try {
        const imageUrl = new URL(product.image)
        const imagePath = imageUrl.pathname.split('/public/')[1]
        if (imagePath) {
          // Deleta a imagem do storage
          await supabase.storage
            .from('restaurant-images')
            .remove([imagePath])
        }
      } catch (error) {
        console.error('Erro ao deletar imagem do produto:', error)
      }
    }
  }

  // Deleta todos os produtos da categoria
  await db.collection('products')
    .deleteMany({ categoryId: id })

  // Por fim, deleta a categoria
  await db.collection('categories')
    .deleteOne({ _id: new ObjectId(id) })
}

// Funções para Produtos
export async function getProducts(restaurantId: string) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('products')
  
  console.log('Buscando produtos para restaurantId:', restaurantId)
  
  const products = await collection
    .find({ restaurantId })
    .toArray()

  // Normaliza os dados antes de retornar
  const normalizedProducts = products.map(product => ({
    ...product,
    id: product._id.toString(), // Converte ObjectId para string
    image: product.image || product.imageUrl, // Garante compatibilidade com ambos os campos
    imageUrl: undefined // Remove campo duplicado
  }))

  console.log('Produtos encontrados:', normalizedProducts)
  
  return normalizedProducts
}

export async function getProductsByCategory(restaurantId: string, categoryId: string) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('products')
  
  return collection
    .find({ restaurantId, categoryId })
    .toArray()
}

export async function createProduct(product: Omit<Product, 'id'>) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('products')
  
  // Normaliza os campos da imagem e garante todos os campos obrigatórios
  const normalizedProduct = {
    ...product,
    image: product.imageUrl || product.image, // Aceita ambos os campos
    imageUrl: undefined, // Remove o campo imageUrl
    available: product.available ?? true,
    featured: product.featured ?? false,
    additions: product.additions || [],
    createdAt: new Date()
  }

  console.log('Salvando produto no MongoDB:', normalizedProduct)
  
  const result = await collection.insertOne(normalizedProduct)
  const createdProduct = { 
    ...normalizedProduct, 
    id: result.insertedId.toString(),
    _id: undefined // Remove o _id da resposta
  }
  console.log('Produto salvo:', createdProduct)
  
  return createdProduct
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('products')
  
  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: product }
  )
}

export async function deleteProduct(id: string) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('products')
  
  await collection.deleteOne({ _id: new ObjectId(id) })
}

// Funções para Pedidos
export async function getOrders(restaurantId: string) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('orders')
  
  return collection
    .find({ restaurantId })
    .sort({ createdAt: -1 })
    .toArray()
}

export async function getOrder(id: string) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('orders')
  
  return collection.findOne({ _id: new ObjectId(id) })
}

export async function createOrder(order: Omit<Order, 'id'>) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('orders')
  
  const result = await collection.insertOne({
    ...order,
    createdAt: new Date(),
    statusUpdates: [
      {
        status: 'pending',
        timestamp: new Date(),
        message: 'Pedido realizado'
      }
    ]
  })
  
  return { ...order, id: result.insertedId.toString() }
}

export async function updateOrderStatus(id: string, status: string, message: string) {
  const client = await clientPromise
  const db = client.db('cardapio_digital')
  const collection = db.collection('orders')

  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: { status },
      $push: {
        statusUpdates: {
          status,
          timestamp: new Date(),
          message
        }
      }
    }
  )

  if (!result.modifiedCount) {
    throw new Error('Pedido não encontrado')
  }

  return result
}

// Funções para Relatórios
export async function getOrderStats(restaurantId: string, startDate: Date, endDate: Date) {
  const client = await clientPromise
  const db = client.db('cardapio_digital')
  const ordersCollection = db.collection('orders')
  
  // Estatísticas básicas
  const basicStats = await ordersCollection.aggregate([
    {
      $match: {
        restaurantId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $nin: ['cancelled', 'rejected'] }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageTicket: { $avg: '$total' },
        // Calcula tempo médio de entrega para pedidos delivery
        deliveryTime: {
          $avg: {
            $cond: [
              { $eq: ['$orderType', 'delivery'] },
              {
                $divide: [
                  {
                    $subtract: [
                      { $arrayElemAt: ['$statusUpdates.timestamp', -1] },
                      '$createdAt'
                    ]
                  },
                  60000 // Converte para minutos
                ]
              },
              null
            ]
          }
        }
      }
    }
  ]).toArray()

  // Produtos mais vendidos
  const bestSellingProducts = await ordersCollection.aggregate([
    {
      $match: {
        restaurantId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $nin: ['cancelled', 'rejected'] }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.id',
        name: { $first: '$items.name' },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { quantity: -1 } },
    { $limit: 10 }
  ]).toArray()

  // Faturamento por dia
  const revenueByDay = await ordersCollection.aggregate([
    {
      $match: {
        restaurantId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $nin: ['cancelled', 'rejected'] }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        value: { $sum: '$total' }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        value: 1
      }
    },
    { $sort: { date: 1 } }
  ]).toArray()

  // Pedidos por horário
  const ordersByHour = await ordersCollection.aggregate([
    {
      $match: {
        restaurantId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $nin: ['cancelled', 'rejected'] }
      }
    },
    {
      $group: {
        _id: {
          $concat: [
            { $toString: { $hour: '$createdAt' } },
            'h'
          ]
        },
        quantity: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        hour: '$_id',
        quantity: 1
      }
    },
    { $sort: { hour: 1 } }
  ]).toArray()

  // Combina todos os resultados
  return {
    ...basicStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageTicket: 0,
      deliveryTime: 0
    },
    bestSellingProducts,
    revenueByDay,
    ordersByHour
  }
}

export async function getBestSellingProducts(restaurantId: string, startDate: Date, endDate: Date) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('orders')
  
  return collection.aggregate([
    {
      $match: {
        restaurantId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $nin: ['cancelled', 'rejected'] }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.id',
        name: { $first: '$items.name' },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { quantity: -1 } },
    { $limit: 5 }
  ]).toArray()
}

// Funções para Dashboard
export async function getDashboardStats(restaurantId: string) {
  const client = await clientPromise
  const ordersCollection = client.db('cardapio_digital').collection('orders')
  
  // Data de hoje
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Pedidos de hoje
  const todayOrders = await ordersCollection.countDocuments({
    restaurantId,
    createdAt: { $gte: today }
  })

  // Pedidos em andamento
  const activeOrders = await ordersCollection.countDocuments({
    restaurantId,
    status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] }
  })

  // Faturamento do dia
  const todayRevenue = await ordersCollection.aggregate([
    {
      $match: {
        restaurantId,
        createdAt: { $gte: today },
        status: { $nin: ['cancelled', 'rejected'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$total' }
      }
    }
  ]).toArray()

  // Ticket médio do dia
  const averageTicket = todayOrders > 0 ? (todayRevenue[0]?.total || 0) / todayOrders : 0

  // Buscar pedidos recentes
  const recentOrders = await ordersCollection
    .find({ restaurantId })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray()

  // Formata os pedidos para retornar
  const formattedOrders = recentOrders.map(order => ({
    ...order,
    id: order._id.toString(),
    _id: undefined
  }))

  return {
    todayOrders,
    activeOrders,
    todayRevenue: todayRevenue[0]?.total || 0,
    averageTicket,
    recentOrders: formattedOrders
  }
} 