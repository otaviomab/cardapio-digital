const { MongoClient } = require('mongodb')

const MONGODB_URI = 'mongodb://admin:admin123@localhost:27017/cardapio_digital?authSource=admin'

async function initializeMenu() {
  try {
    console.log('Iniciando configuração do cardápio...')
    
    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db('cardapio_digital')

    // Limpa as coleções existentes
    await db.collection('categories').deleteMany({})
    await db.collection('products').deleteMany({})
    
    console.log('Coleções limpas com sucesso!')

    // Insere as novas categorias
    const categoriesResult = await db.collection('categories').insertMany([
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        name: 'Lanches',
        description: 'Hambúrgueres e lanches especiais',
        order: 1,
        active: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        name: 'Hot Dogs',
        description: 'Cachorros-quentes especiais',
        order: 2,
        active: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        name: 'Porções',
        description: 'Porções e acompanhamentos',
        order: 3,
        active: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        name: 'Pastéis',
        description: 'Pastéis variados',
        order: 4,
        active: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        name: 'Bebidas',
        description: 'Refrigerantes e bebidas',
        order: 5,
        active: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        name: 'Sobremesas',
        description: 'Doces e sobremesas',
        order: 6,
        active: true
      }
    ])

    const categoryIds = {
      lanches: categoriesResult.insertedIds[0],
      hotDogs: categoriesResult.insertedIds[1],
      porcoes: categoriesResult.insertedIds[2],
      pasteis: categoriesResult.insertedIds[3],
      bebidas: categoriesResult.insertedIds[4],
      sobremesas: categoriesResult.insertedIds[5]
    }

    console.log('Categorias inseridas com sucesso!')

    // Insere os produtos - Parte 1: Lanches e Hot Dogs
    const products = [
      // Lanches
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.lanches.toString(),
        name: 'MISTO QUENTE',
        description: 'Pão de forma, presunto e queijo',
        price: 10.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.lanches.toString(),
        name: 'X BURGER',
        description: 'Pão, hambúrguer 56g, presunto e queijo',
        price: 14.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.lanches.toString(),
        name: 'X SALADA',
        description: 'Pão, hambúrguer 90g, presunto, queijo, alface e tomate',
        price: 17.50,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.lanches.toString(),
        name: 'X BACON',
        description: 'Pão, hambúrguer 90g, bacon, presunto, queijo, alface e tomate',
        price: 20.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.lanches.toString(),
        name: 'X CALABRESA',
        description: 'Pão, hambúrguer 90g, calabresa, presunto, queijo, alface e tomate',
        price: 19.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.lanches.toString(),
        name: 'X EGG',
        description: 'Pão, hambúrguer 90g, ovo, presunto, queijo, alface e tomate',
        price: 18.50,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.lanches.toString(),
        name: 'X TUDO',
        description: 'Pão, hambúrguer 90g, ovo, bacon, calabresa, presunto, queijo, alface e tomate',
        price: 24.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.lanches.toString(),
        name: 'X TUDO DUPLO',
        description: 'Pão, 2 hambúrgueres 180g, 2 ovos, bacon, calabresa, presunto, queijo, alface e tomate',
        price: 30.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.lanches.toString(),
        name: 'X FRANGO Nº1',
        description: 'Pão, filé de frango, presunto, queijo, alface e tomate',
        price: 22.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.lanches.toString(),
        name: 'X FRANGO Nº2',
        description: 'Pão, filé de frango, ovo, bacon, calabresa, presunto, queijo, alface e tomate',
        price: 24.00,
        available: true,
        featured: false
      },
      // Hot Dogs
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.hotDogs.toString(),
        name: 'HOT DOG TRADICIONAL',
        description: 'Pão, salsicha Perdigão, milho, ervilha, vinagrete, purê de batata artesanal, batata palha e molhos',
        price: 14.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.hotDogs.toString(),
        name: 'HOT DOG FRANGO',
        description: 'Pão, salsicha Perdigão, ervilha, vinagrete, frango, purê de batata artesanal, batata palha e molhos',
        price: 17.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.hotDogs.toString(),
        name: 'HOT DOG CALABRESA',
        description: 'Pão, salsicha Perdigão, milho, ervilha, vinagrete, calabresa, purê de batata artesanal, batata palha e molhos',
        price: 17.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.hotDogs.toString(),
        name: 'HOT DOG PRESUNTO E QUEIJO',
        description: 'Pão, salsicha Perdigão, milho, ervilha, vinagrete, presunto, queijo, purê de batata artesanal, batata palha e molhos',
        price: 17.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.hotDogs.toString(),
        name: 'HOT DOG BACON',
        description: 'Pão, salsicha Perdigão, milho, ervilha, vinagrete, bacon, purê de batata artesanal, batata palha e molhos',
        price: 18.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.hotDogs.toString(),
        name: 'HOT DOG COM TUDO DENTRO',
        description: 'Pão, 2 salsichas Perdigão, frango, bacon, calabresa, catupiry, milho, ervilha, vinagrete, purê de batata artesanal, batata palha e molhos',
        price: 30.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.hotDogs.toString(),
        name: 'HOT DOG NA BANDEJA PEQUENA',
        description: '2 salsichas Perdigão, milho, ervilha, vinagrete, mussarela, purê de batata artesanal, batata palha e molhos',
        price: 25.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.hotDogs.toString(),
        name: 'HOT DOG NA BANDEJA GRANDE',
        description: '2 salsichas Perdigão, milho, ervilha, vinagrete, mussarela, purê de batata artesanal, batata palha e molhos',
        price: 34.00,
        available: true,
        featured: false
      }
    ]

    await db.collection('products').insertMany(products)
    console.log('Lanches e Hot Dogs inseridos com sucesso!')

    // Parte 2: Porções, Pastéis, Bebidas e Sobremesas
    const moreProducts = [
      // Porções
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.porcoes.toString(),
        name: 'BATATA SIMPLES',
        description: '300g',
        price: 18.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.porcoes.toString(),
        name: 'BATATA COM BACON E CHEDDAR',
        description: '380g',
        price: 25.00,
        available: true,
        featured: true
      },
      // Pastéis
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.pasteis.toString(),
        name: 'PASTEL DE QUEIJO',
        description: 'Queijo',
        price: 8.50,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.pasteis.toString(),
        name: 'PASTEL DE CARNE',
        description: 'Carne',
        price: 8.50,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.pasteis.toString(),
        name: 'PASTEL DE PIZZA',
        description: 'Pizza',
        price: 8.50,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.pasteis.toString(),
        name: 'PASTEL DE DOIS QUEIJOS',
        description: 'Mussarela e catupiry',
        price: 10.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.pasteis.toString(),
        name: 'PASTEL DE CREMOSINHO',
        description: 'Carne e catupiry',
        price: 10.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.pasteis.toString(),
        name: 'PASTEL DE FRANGO COM CATUPIRY',
        description: 'Frango e catupiry',
        price: 10.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.pasteis.toString(),
        name: 'PASTEL DE CALABRESA COM CATUPIRY',
        description: 'Calabresa e catupiry',
        price: 10.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.pasteis.toString(),
        name: 'PASTEL DE TRÊS QUEIJOS',
        description: 'Mussarela, cheddar e catupiry',
        price: 10.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.pasteis.toString(),
        name: 'PASTEL DE CARNE COM QUEIJO',
        description: 'Carne e queijo',
        price: 10.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.pasteis.toString(),
        name: 'PASTEL DE CARNE COM CHEDDAR',
        description: 'Carne e cheddar',
        price: 10.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.pasteis.toString(),
        name: 'PASTEL DE FRANGO COM CATUPIRY E BACON',
        description: 'Frango, catupiry e bacon',
        price: 10.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.pasteis.toString(),
        name: 'PASTEL DE FRANGO COM QUEIJO',
        description: 'Frango e queijo',
        price: 10.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.pasteis.toString(),
        name: 'PASTEL DE CALABRESA COM QUEIJO',
        description: 'Calabresa e queijo',
        price: 10.00,
        available: true,
        featured: false
      },
      // Bebidas
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'COCA-COLA LATA',
        description: '350ml',
        price: 6.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'FANTA UVA LATA',
        description: '350ml',
        price: 6.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'FANTA LARANJA LATA',
        description: '350ml',
        price: 6.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'SPRITE LATA',
        description: '350ml',
        price: 6.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'SCHWEPPES CÍTRICOS LATA',
        description: '350ml',
        price: 6.50,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'COCA-COLA 200ML PET',
        description: '200ml',
        price: 3.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'GUARANÁ ANTÁRTICA 200ML',
        description: '200ml',
        price: 3.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'ÁGUA COM GÁS',
        description: '500ml',
        price: 4.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'ÁGUA NATURAL',
        description: '500ml',
        price: 3.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'COCA-COLA 600ML',
        description: '600ml',
        price: 7.50,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'GUARANÁ ANTÁRTICA 600ML',
        description: '600ml',
        price: 7.50,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'FANTA UVA 600ML',
        description: '600ml',
        price: 7.50,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'COCA-COLA 2L',
        description: '2 litros',
        price: 15.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'FANTA UVA 2L',
        description: '2 litros',
        price: 14.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'FANTA LARANJA 2L',
        description: '2 litros',
        price: 14.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'SPRITE ORIGINAL 2L',
        description: '2 litros',
        price: 14.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'XERETA 2L TUBAÍNA',
        description: '2 litros',
        price: 8.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'XERETA 2L ABACAXI',
        description: '2 litros',
        price: 8.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'XERETA 2L GUARANÁ',
        description: '2 litros',
        price: 8.00,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'DELL VALLE LATA',
        description: 'Sabores: Pêssego, Maracujá, Uva, Manga, Goiaba',
        price: 6.50,
        available: true,
        featured: false
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.bebidas.toString(),
        name: 'SUCO KAPO',
        description: 'Sabores: Morango, Uva',
        price: 4.00,
        available: true,
        featured: false
      },
      // Sobremesas
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.sobremesas.toString(),
        name: 'BOLO DE POTE PRESTÍGIO',
        description: 'Delicioso bolo de pote sabor prestígio',
        price: 15.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.sobremesas.toString(),
        name: 'BOLO DE POTE CHOCONINHO',
        description: 'Delicioso bolo de pote sabor chocolate com leite ninho',
        price: 15.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.sobremesas.toString(),
        name: 'BOLO DE POTE NINHO COM ABACAXI',
        description: 'Delicioso bolo de pote de leite ninho com abacaxi',
        price: 15.00,
        available: true,
        featured: true
      },
      {
        restaurantId: 'e0dba73b-0870-4b0d-8026-7341db950c16',
        categoryId: categoryIds.sobremesas.toString(),
        name: 'PÃO DE MEL DE DOCE DE LEITE',
        description: 'Delicioso pão de mel recheado com doce de leite',
        price: 8.00,
        available: true,
        featured: true
      }
    ]

    await db.collection('products').insertMany(moreProducts)
    console.log('Produtos adicionais inseridos com sucesso!')

    console.log('Cardápio inicializado com sucesso!')
    await client.close()
    process.exit(0)
  } catch (error) {
    console.error('Erro ao inicializar cardápio:', error)
    process.exit(1)
  }
}

initializeMenu() 