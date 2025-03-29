import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const restaurantId = searchParams.get('restaurantId')

  if (!restaurantId) {
    return NextResponse.json(
      { error: 'restaurantId é obrigatório' },
      { status: 400 }
    )
  }
  
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
    const client = await clientPromise
    const collection = client.db('cardapio_digital').collection('categories')

    // Limpa categorias existentes deste restaurante
    await collection.deleteMany({ restaurantId })

    // Insere as novas categorias
    const result = await collection.insertMany(categories)

    console.log('Categorias criadas:', result)

    return NextResponse.json({
      message: 'Categorias criadas com sucesso',
      insertedCount: result.insertedCount,
      categories: categories
    })
  } catch (error) {
    console.error('Erro ao criar categorias:', error)
    return NextResponse.json(
      { error: 'Erro ao criar categorias' },
      { status: 500 }
    )
  }
} 