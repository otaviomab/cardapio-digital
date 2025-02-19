import clientPromise from '../src/lib/mongodb'

async function setupCategories() {
  const restaurantId = 'e7b5d726-203b-47b6-b93f-65bbce28b4e4'
  
  const categories = [
    {
      name: 'Lanches',
      description: 'Hambúrgueres e sanduíches',
      order: 0,
      restaurantId
    },
    {
      name: 'Hot Dogs',
      description: 'Cachorros-quentes especiais',
      order: 1,
      restaurantId
    },
    {
      name: 'Porções',
      description: 'Porções para compartilhar',
      order: 2,
      restaurantId
    },
    {
      name: 'Pastéis',
      description: 'Pastéis fresquinhos',
      order: 3,
      restaurantId
    },
    {
      name: 'Bebidas',
      description: 'Refrigerantes, sucos e bebidas',
      order: 4,
      restaurantId
    },
    {
      name: 'Sobremesas',
      description: 'Doces e sobremesas',
      order: 5,
      restaurantId
    }
  ]

  try {
    console.log('Conectando ao MongoDB...')
    const client = await clientPromise
    const collection = client.db('cardapio_digital').collection('categories')

    console.log('Limpando categorias existentes...')
    await collection.deleteMany({ restaurantId })

    console.log('Inserindo novas categorias...')
    const result = await collection.insertMany(categories)

    console.log('Categorias criadas com sucesso!')
    console.log('Quantidade inserida:', result.insertedCount)
    console.log('IDs gerados:', result.insertedIds)

    process.exit(0)
  } catch (error) {
    console.error('Erro ao criar categorias:', error)
    process.exit(1)
  }
}

setupCategories() 