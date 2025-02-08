import { config } from 'dotenv'
import { resolve } from 'path'
import { MongoClient } from 'mongodb'

// Carrega as variáveis de ambiente do arquivo .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const MONGODB_URI = 'mongodb://admin:admin123@localhost:27017/cardapio_digital?authSource=admin'

async function initializeDatabase() {
  try {
    console.log('Iniciando configuração do banco de dados...')
    
    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db('cardapio_digital')

    // Cria índices para as coleções
    await db.collection('categories').createIndex({ restaurantId: 1, order: 1 })
    await db.collection('products').createIndex({ restaurantId: 1, categoryId: 1 })
    await db.collection('orders').createIndex({ restaurantId: 1, createdAt: -1 })
    await db.collection('orders').createIndex({ status: 1 })

    console.log('Índices criados com sucesso!')

    // Insere categorias padrão
    const categoriesResult = await db.collection('categories').insertMany([
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        name: 'Burgers',
        description: 'Nossos deliciosos hambúrgueres artesanais',
        order: 1,
        active: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        name: 'Acompanhamentos',
        description: 'Porções e acompanhamentos',
        order: 2,
        active: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        name: 'Bebidas',
        description: 'Refrigerantes, sucos e bebidas',
        order: 3,
        active: true
      }
    ])

    console.log('Categorias padrão inseridas!')

    // Insere produtos padrão
    const productsResult = await db.collection('products').insertMany([
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoriesResult.insertedIds[0].toString(), // Burgers
        name: 'Classic Burger',
        description: 'Hambúrguer artesanal 180g, queijo cheddar, alface, tomate e molho especial',
        price: 32.90,
        image: '/images/hamburguer.png',
        available: true,
        featured: true,
        additions: [
          { name: 'Bacon', price: 5.90, available: true },
          { name: 'Ovo', price: 3.90, available: true },
          { name: 'Cheddar Extra', price: 4.90, available: true }
        ]
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoriesResult.insertedIds[0].toString(), // Burgers
        name: 'Double Cheese',
        description: 'Dois hambúrgueres artesanais 180g, queijo cheddar duplo, bacon e molho especial',
        price: 42.90,
        image: '/images/hamburguer.png',
        available: true,
        featured: true,
        additions: [
          { name: 'Bacon Extra', price: 5.90, available: true },
          { name: 'Cheddar Extra', price: 4.90, available: true }
        ]
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoriesResult.insertedIds[1].toString(), // Acompanhamentos
        name: 'Batata Frita',
        description: 'Porção de batatas fritas crocantes',
        price: 19.90,
        image: '/images/batata.jpg',
        available: true,
        featured: false,
        additions: [
          { name: 'Cheddar', price: 5.90, available: true },
          { name: 'Bacon', price: 4.90, available: true }
        ]
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoriesResult.insertedIds[1].toString(), // Acompanhamentos
        name: 'Onion Rings',
        description: 'Anéis de cebola empanados',
        price: 24.90,
        image: '/images/batata.jpg',
        available: true,
        featured: false,
        additions: [
          { name: 'Molho Ranch', price: 3.90, available: true }
        ]
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoriesResult.insertedIds[2].toString(), // Bebidas
        name: 'Refrigerante',
        description: 'Coca-Cola, Guaraná ou Sprite (350ml)',
        price: 6.90,
        image: '/images/coca cola.webp',
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoriesResult.insertedIds[2].toString(), // Bebidas
        name: 'Suco Natural',
        description: 'Laranja, Limão ou Maracujá (400ml)',
        price: 8.90,
        image: '/images/coca cola.webp',
        available: true,
        featured: false
      }
    ])

    console.log('Produtos padrão inseridos!')
    console.log('Banco de dados inicializado com sucesso!')

    await client.close()
    process.exit(0)
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error)
    process.exit(1)
  }
}

initializeDatabase() 