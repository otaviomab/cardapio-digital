import { ObjectId } from 'mongodb'
import clientPromise from './mongodb'
import { Category, Product } from '@/types/restaurant'
import { Order } from '@/types/order'
import { supabase } from '@/lib/supabase'
import { emitToRestaurant } from './socket'
import { connectToDatabase } from './mongodb'

// Funções para Categorias
export async function getCategories(restaurantId: string) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('categories')
  
  console.log('Buscando categorias para restaurantId:', restaurantId)
  
  const categories = await collection
    .find({ restaurantId })
    .sort({ order: 1 })
    .toArray()

  // Normaliza os IDs antes de retornar
  const normalizedCategories = categories.map(category => ({
    ...category,
    id: category._id.toString(), // Garante que sempre temos um id em string
  }))

  console.log('Categorias encontradas:', normalizedCategories)
  return normalizedCategories
}

export async function createCategory(category: Omit<Category, 'id'>) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('categories')
  
  console.log('Criando categoria com dados:', category)
  
  // Garante que o restaurantId está presente
  if (!category.restaurantId) {
    throw new Error('restaurantId é obrigatório para criar uma categoria')
  }

  const result = await collection.insertOne(category)
  const createdCategory = { 
    ...category, 
    id: result.insertedId.toString(),
    _id: result.insertedId
  }
  
  console.log('Categoria criada com sucesso:', createdCategory)
  return createdCategory
}

export async function updateCategory(id: string, category: Partial<Category>) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('categories')
  
  console.log('Iniciando atualização da categoria no MongoDB:', { id, category })

  try {
    // Remove campos que não devem ser atualizados
    const { _id, id: categoryId, ...updateData } = category

    // Primeiro busca a categoria existente
    const existingCategory = await collection.findOne({ 
      _id: new ObjectId(id)
    })

    console.log('Categoria existente:', existingCategory)

    if (!existingCategory) {
      console.error('Categoria não encontrada:', id)
      throw new Error('Categoria não encontrada')
    }

    // Mantém o restaurantId original
    const restaurantId = existingCategory.restaurantId

    // Verifica se o restaurantId da requisição corresponde ao da categoria
    if (category.restaurantId && category.restaurantId !== restaurantId) {
      console.error('Tentativa de edição não autorizada:', {
        categoriaRestaurantId: restaurantId,
        requestRestaurantId: category.restaurantId
      })
      throw new Error('Não autorizado a editar esta categoria')
    }

    // Prepara os dados para atualização
    const updateDoc = {
      $set: {
        name: updateData.name || existingCategory.name,
        description: updateData.description || existingCategory.description,
        order: updateData.order ?? existingCategory.order,
        restaurantId,
        updatedAt: new Date()
      }
    }

    console.log('Dados para atualização:', updateDoc)

    // Faz a atualização
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateDoc,
      { 
        returnDocument: 'after'
      }
    )

    console.log('Resultado da atualização:', result)

    // Na versão mais recente do MongoDB, o resultado vem diretamente no objeto
    const updatedDoc = result

    if (!updatedDoc) {
      console.error('Falha na atualização - documento não encontrado:', { id, result })
      throw new Error('Categoria não encontrada ou não pôde ser atualizada')
    }

    // Formata o resultado para retornar
    const updatedCategory = {
      ...updatedDoc,
      id: updatedDoc._id.toString()
    }

    // Remove campos que não devem ser retornados
    delete updatedCategory._id

    console.log('Categoria atualizada com sucesso:', updatedCategory)
    return updatedCategory
  } catch (error) {
    console.error('Erro ao atualizar categoria no MongoDB:', error)
    throw error
  }
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
    isPizza: product.isPizza ?? false,
    allowHalfHalf: product.allowHalfHalf ?? false,
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
  
  console.log('Iniciando atualização do produto:', { id, product })

  try {
    // Remove campos que não devem ser atualizados
    const { _id, id: productId, ...updateData } = product

    // Primeiro busca o produto existente
    const existingProduct = await collection.findOne({ 
      _id: new ObjectId(id)
    })

    console.log('Produto existente:', existingProduct)

    if (!existingProduct) {
      console.error('Produto não encontrado:', id)
      throw new Error('Produto não encontrado')
    }

    // Mantém o restaurantId original
    const restaurantId = existingProduct.restaurantId

    // Verifica se o restaurantId da requisição corresponde ao do produto
    if (product.restaurantId && product.restaurantId !== restaurantId) {
      console.error('Tentativa de edição não autorizada:', {
        produtoRestaurantId: restaurantId,
        requestRestaurantId: product.restaurantId
      })
      throw new Error('Não autorizado a editar este produto')
    }

    // Prepara os dados para atualização
    const updateDoc = {
      $set: {
        name: updateData.name || existingProduct.name,
        description: updateData.description || existingProduct.description,
        price: updateData.price ?? existingProduct.price,
        categoryId: updateData.categoryId || existingProduct.categoryId,
        available: updateData.available ?? existingProduct.available,
        featured: updateData.featured ?? existingProduct.featured,
        additions: updateData.additions || existingProduct.additions,
        image: updateData.image ?? existingProduct.image,
        isPizza: updateData.isPizza ?? existingProduct.isPizza ?? false,
        allowHalfHalf: updateData.allowHalfHalf ?? existingProduct.allowHalfHalf ?? false,
        restaurantId,
        updatedAt: new Date()
      }
    }

    console.log('Dados para atualização:', updateDoc)

    // Faz a atualização
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateDoc,
      { 
        returnDocument: 'after'
      }
    )

    console.log('Resultado da atualização:', result)

    if (!result) {
      console.error('Falha na atualização - produto não encontrado:', { id, result })
      throw new Error('Produto não encontrado ou não pôde ser atualizado')
    }

    // Formata o resultado para retornar
    const updatedProduct = {
      ...result,
      id: result._id.toString()
    }

    // Remove campos que não devem ser retornados
    delete updatedProduct._id

    console.log('Produto atualizado com sucesso:', updatedProduct)
    return updatedProduct
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    throw error
  }
}

export async function deleteProduct(id: string) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('products')
  
  await collection.deleteOne({ _id: new ObjectId(id) })
}

// Funções para Pedidos
export async function getOrders(restaurantId: string) {
  try {
    const { db } = await connectToDatabase()
    const orders = await db
      .collection('orders')
      .find({ restaurantId })
      .sort({ createdAt: -1 })
      .toArray()

    return orders
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    throw new Error('Erro ao buscar pedidos')
  }
}

export async function getOrder(id: string) {
  const client = await clientPromise
  const collection = client.db('cardapio_digital').collection('orders')
  
  console.log('Buscando pedido com ID:', id)
  
  try {
    const order = await collection.findOne({ _id: new ObjectId(id) })
    
    if (!order) {
      console.log('Pedido não encontrado:', id)
      return null
    }
    
    // Debug para verificar a presença do campo categoria nos itens
    if (order.items && Array.isArray(order.items)) {
      console.log('Depuração de itens do pedido no MongoDB:');
      order.items.forEach((item, index) => {
        console.log(`MongoDB - Item ${index + 1}: ${item.name}`);
        console.log('Campos disponíveis:', Object.keys(item));
        console.log('Categoria do item:', item.category || 'NÃO ENCONTRADA');
      });
    }
    
    // Normaliza o ID antes de retornar
    const normalizedOrder = {
      ...order,
      id: order._id.toString(),
      _id: order._id.toString() // Mantém _id como string para compatibilidade
    }
    
    console.log('Pedido encontrado:', normalizedOrder)
    return normalizedOrder
  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    throw error
  }
}

export async function createOrder(order: Order) {
  try {
    const { db } = await connectToDatabase()
    
    // Adiciona data de criação e garante que orderType esteja definido
    const orderWithTimestamp = {
      ...order,
      // Garante que orderType esteja definido (compatibilidade com deliveryMethod)
      orderType: order.orderType || order.deliveryMethod || 'delivery',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const result = await db.collection('orders').insertOne(orderWithTimestamp)
    
    // Recupera o pedido completo com o ID gerado
    const createdOrder = {
      ...orderWithTimestamp,
      _id: result.insertedId.toString()
    }
    
    // Emite evento via Socket.IO para notificar sobre o novo pedido
    emitToRestaurant(
      `new-order-${order.restaurantId}`,
      order.restaurantId,
      createdOrder
    )
    
    // Também emite no novo formato (sem sufixo)
    emitToRestaurant(
      'new-order',
      order.restaurantId,
      createdOrder
    )
    
    return createdOrder
  } catch (error) {
    console.error('Erro ao criar pedido:', error)
    throw new Error('Erro ao criar pedido')
  }
}

export async function updateOrderStatus(orderId: string, status: string, message?: string) {
  try {
    console.log('MongoDB Service: Iniciando atualização de status do pedido', {
      orderId,
      status,
      message
    })
    
    const { db } = await connectToDatabase()
    
    // Verifica se o ID é válido
    let objectId;
    try {
      objectId = new ObjectId(orderId);
      console.log('MongoDB Service: ID do pedido válido', orderId)
    } catch (error) {
      console.error('MongoDB Service: ID do pedido inválido', orderId)
      throw new Error('ID do pedido inválido')
    }
    
    // Atualiza o pedido
    const updateResult = await db.collection('orders').updateOne(
      { _id: objectId },
      { 
        $set: { 
          status,
          updatedAt: new Date().toISOString()
        } 
      }
    )
    
    console.log('MongoDB Service: Resultado da atualização', {
      orderId,
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount
    })
    
    if (updateResult.matchedCount === 0) {
      console.error('MongoDB Service: Pedido não encontrado', orderId)
      throw new Error('Pedido não encontrado')
    }
    
    // Busca o pedido atualizado para enviar via WebSocket
    const updatedOrder = await db
      .collection('orders')
      .findOne({ _id: objectId })
    
    if (!updatedOrder) {
      console.error('MongoDB Service: Pedido não encontrado após atualização', orderId)
      throw new Error('Pedido não encontrado após atualização')
    }
    
    console.log('MongoDB Service: Pedido atualizado com sucesso', {
      orderId,
      status,
      restaurantId: updatedOrder.restaurantId
    })
    
    // Emite evento via Socket.IO para notificar sobre a atualização do pedido
    const emitResult = emitToRestaurant(
      `order-updated-${updatedOrder.restaurantId}`,
      updatedOrder.restaurantId,
      updatedOrder
    )
    
    console.log('MongoDB Service: Resultado da emissão do evento', {
      event: `order-updated-${updatedOrder.restaurantId}`,
      room: updatedOrder.restaurantId,
      result: emitResult
    })
    
    return updatedOrder
  } catch (error) {
    console.error('MongoDB Service: Erro ao atualizar status do pedido:', error)
    throw error
  }
}

// Funções para Relatórios
export async function getOrderStats(restaurantId: string, startDate: Date, endDate: Date) {
  const client = await clientPromise
  const db = client.db('cardapio_digital')
  const ordersCollection = db.collection('orders')
  
  console.log('getOrderStats - Parâmetros recebidos:', {
    restaurantId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  })
  
  // Buscar todos os pedidos do restaurante e filtrar por data em memória
  const allOrders = await ordersCollection.find({ restaurantId }).toArray()
  
  // Filtra pedidos por data
  const startTimestamp = startDate.getTime()
  const endTimestamp = endDate.getTime()
  
  const filteredOrders = allOrders.filter(order => {
    // Converte a string de data para timestamp
    const orderDate = new Date(order.createdAt)
    const orderTimestamp = orderDate.getTime()
    
    return orderTimestamp >= startTimestamp && orderTimestamp <= endTimestamp && 
           !['cancelled', 'rejected'].includes(order.status)
  })
  
  console.log(`getOrderStats - Encontrados ${filteredOrders.length} pedidos no período`)
  
  // Calcula estatísticas básicas
  const totalOrders = filteredOrders.length
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0
  
  // Calcula tempo médio de entrega (pedidos delivery)
  const deliveryOrders = filteredOrders.filter(o => o.orderType === 'delivery' && o.statusUpdates && o.statusUpdates.length > 0)
  let deliveryTime = 0
  
  if (deliveryOrders.length > 0) {
    const totalDeliveryTime = deliveryOrders.reduce((sum, order) => {
      const lastUpdate = order.statusUpdates[order.statusUpdates.length - 1]
      if (lastUpdate && lastUpdate.timestamp) {
        const start = new Date(order.createdAt).getTime()
        const end = new Date(lastUpdate.timestamp).getTime()
        return sum + ((end - start) / 60000) // minutos
      }
      return sum
    }, 0)
    
    deliveryTime = totalDeliveryTime / deliveryOrders.length
  }
  
  // Produtos mais vendidos
  const productsMap = new Map()
  
  filteredOrders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const id = item.id || item.productId
        if (!productsMap.has(id)) {
          productsMap.set(id, {
            _id: id,
            name: item.name,
            quantity: 0,
            revenue: 0
          })
        }
        
        const product = productsMap.get(id)
        product.quantity += item.quantity || 1
        product.revenue += (item.price * (item.quantity || 1))
      })
    }
  })
  
  const bestSellingProducts = Array.from(productsMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map(({ _id, ...rest }) => ({ ...rest }))
  
  // Faturamento por dia
  const revenueByDayMap = new Map()
  
  filteredOrders.forEach(order => {
    const date = new Date(order.createdAt)
    const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD
    
    if (!revenueByDayMap.has(dateString)) {
      revenueByDayMap.set(dateString, 0)
    }
    
    revenueByDayMap.set(dateString, revenueByDayMap.get(dateString) + (order.total || 0))
  })
  
  const revenueByDay = Array.from(revenueByDayMap.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
  
  // Pedidos por horário
  const ordersByHourMap = new Map()
  
  filteredOrders.forEach(order => {
    const date = new Date(order.createdAt)
    const hour = `${date.getHours()}h`
    
    if (!ordersByHourMap.has(hour)) {
      ordersByHourMap.set(hour, 0)
    }
    
    ordersByHourMap.set(hour, ordersByHourMap.get(hour) + 1)
  })
  
  const ordersByHour = Array.from(ordersByHourMap.entries())
    .map(([hour, quantity]) => ({ hour, quantity }))
    .sort((a, b) => {
      const hourA = parseInt(a.hour)
      const hourB = parseInt(b.hour)
      return hourA - hourB
    })
  
  // Retorna resultado final
  return {
    totalOrders,
    totalRevenue,
    averageTicket,
    deliveryTime,
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