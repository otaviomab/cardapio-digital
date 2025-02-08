import clientPromise from './mongodb'

export async function initializeDatabase() {
  try {
    const client = await clientPromise
    const db = client.db('cardapio_digital')

    // Cria índices para as coleções
    await db.collection('categories').createIndex({ restaurantId: 1, order: 1 })
    await db.collection('products').createIndex({ restaurantId: 1, categoryId: 1 })
    await db.collection('orders').createIndex({ restaurantId: 1, createdAt: -1 })
    await db.collection('orders').createIndex({ status: 1 })

    console.log('Índices criados com sucesso!')

    // Insere algumas categorias de exemplo se não existirem
    const categoriesCount = await db.collection('categories').countDocuments()
    if (categoriesCount === 0) {
      await db.collection('categories').insertMany([
        {
          restaurantId: '1',
          name: 'Destaques',
          description: 'Os mais pedidos',
          order: 1,
          active: true
        },
        {
          restaurantId: '1',
          name: 'Entradas',
          description: 'Para começar bem',
          order: 2,
          active: true
        },
        {
          restaurantId: '1',
          name: 'Principais',
          description: 'Pratos principais',
          order: 3,
          active: true
        }
      ])
      console.log('Categorias de exemplo inseridas!')
    }

    // Insere alguns produtos de exemplo se não existirem
    const productsCount = await db.collection('products').countDocuments()
    if (productsCount === 0) {
      await db.collection('products').insertMany([
        {
          restaurantId: '1',
          categoryId: '1',
          name: 'X-Tudo',
          description: 'O melhor hambúrguer da casa',
          price: 32.90,
          imageUrl: '/images/hamburguer.png',
          available: true,
          featured: true,
          additions: [
            { name: 'Bacon Extra', price: 5.90, available: true },
            { name: 'Queijo Extra', price: 3.90, available: true }
          ]
        },
        {
          restaurantId: '1',
          categoryId: '2',
          name: 'Batata Frita',
          description: 'Porção de batata frita crocante',
          price: 24.90,
          imageUrl: '/images/batata.jpg',
          available: true,
          featured: false,
          additions: [
            { name: 'Cheddar', price: 5.90, available: true },
            { name: 'Bacon', price: 4.90, available: true }
          ]
        }
      ])
      console.log('Produtos de exemplo inseridos!')
    }

    console.log('Banco de dados inicializado com sucesso!')
    return true
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error)
    throw error
  }
} 