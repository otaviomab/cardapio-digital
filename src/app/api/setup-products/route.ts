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

  try {
    const client = await clientPromise
    const db = client.db('cardapio_digital')
    const collection = db.collection('products')

    // Primeiro busca as categorias existentes
    const categories = await db.collection('categories')
      .find({ restaurantId })
      .toArray()

    // Mapeia os IDs das categorias por nome para facilitar a referência
    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.name.toLowerCase()] = cat._id.toString()
      return acc
    }, {} as Record<string, string>)

    console.log('Categorias encontradas:', categoryMap)

    // Define os produtos com as categorias corretas
    const products = [
      // Lanches
      ...([
        {
          name: 'MISTO QUENTE',
          description: 'Pão de forma, presunto e queijo',
          price: 10.00,
          categoryId: categoryMap['lanches'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'X BURGER',
          description: 'Pão, hambúrguer 56g, presunto e queijo',
          price: 14.00,
          categoryId: categoryMap['lanches'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'X SALADA',
          description: 'Pão, hambúrguer 90g, presunto, queijo, alface e tomate',
          price: 17.50,
          categoryId: categoryMap['lanches'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'X BACON',
          description: 'Pão, hambúrguer 90g, bacon, presunto, queijo, alface e tomate',
          price: 20.00,
          categoryId: categoryMap['lanches'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'X CALABRESA',
          description: 'Pão, hambúrguer 90g, calabresa, presunto, queijo, alface e tomate',
          price: 19.00,
          categoryId: categoryMap['lanches'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'X EGG',
          description: 'Pão, hambúrguer 90g, ovo, presunto, queijo, alface e tomate',
          price: 18.50,
          categoryId: categoryMap['lanches'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'X TUDO',
          description: 'Pão, hambúrguer 90g, ovo, bacon, calabresa, presunto, queijo, alface e tomate',
          price: 24.00,
          categoryId: categoryMap['lanches'],
          available: true,
          featured: true,
          restaurantId
        },
        {
          name: 'X TUDO DUPLO',
          description: 'Pão, 2 hambúrgueres 180g, 2 ovos, bacon, calabresa, presunto, queijo, alface e tomate',
          price: 30.00,
          categoryId: categoryMap['lanches'],
          available: true,
          featured: true,
          restaurantId
        },
        {
          name: 'X FRANGO Nº1',
          description: 'Pão, filé de frango, presunto, queijo, alface e tomate',
          price: 22.00,
          categoryId: categoryMap['lanches'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'X FRANGO Nº2',
          description: 'Pão, filé de frango, ovo, bacon, calabresa, presunto, queijo, alface e tomate',
          price: 24.00,
          categoryId: categoryMap['lanches'],
          available: true,
          featured: false,
          restaurantId
        }
      ]),

      // Hot Dogs
      ...([
        {
          name: 'HOT DOG TRADICIONAL',
          description: 'Pão, salsicha Perdigão, milho, ervilha, vinagrete, purê de batata artesanal, batata palha e molhos',
          price: 14.00,
          categoryId: categoryMap['hot dogs'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'HOT DOG FRANGO',
          description: 'Pão, salsicha Perdigão, ervilha, vinagrete, frango, purê de batata artesanal, batata palha e molhos',
          price: 17.00,
          categoryId: categoryMap['hot dogs'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'HOT DOG CALABRESA',
          description: 'Pão, salsicha Perdigão, milho, ervilha, vinagrete, calabresa, purê de batata artesanal, batata palha e molhos',
          price: 17.00,
          categoryId: categoryMap['hot dogs'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'HOT DOG PRESUNTO E QUEIJO',
          description: 'Pão, salsicha Perdigão, milho, ervilha, vinagrete, presunto, queijo, purê de batata artesanal, batata palha e molhos',
          price: 17.00,
          categoryId: categoryMap['hot dogs'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'HOT DOG BACON',
          description: 'Pão, salsicha Perdigão, milho, ervilha, vinagrete, bacon, purê de batata artesanal, batata palha e molhos',
          price: 18.00,
          categoryId: categoryMap['hot dogs'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'HOT DOG COM TUDO DENTRO',
          description: 'Pão, 2 salsichas Perdigão, frango, bacon, calabresa, catupiry, milho, ervilha, vinagrete, purê de batata artesanal, batata palha e molhos',
          price: 30.00,
          categoryId: categoryMap['hot dogs'],
          available: true,
          featured: true,
          restaurantId
        },
        {
          name: 'HOT DOG NA BANDEJA PEQUENA',
          description: '2 salsichas Perdigão, milho, ervilha, vinagrete, mussarela, purê de batata artesanal, batata palha e molhos',
          price: 25.00,
          categoryId: categoryMap['hot dogs'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'HOT DOG NA BANDEJA GRANDE',
          description: '2 salsichas Perdigão, milho, ervilha, vinagrete, mussarela, purê de batata artesanal, batata palha e molhos',
          price: 34.00,
          categoryId: categoryMap['hot dogs'],
          available: true,
          featured: false,
          restaurantId
        }
      ]),

      // Porções
      ...([
        {
          name: 'BATATA SIMPLES',
          description: '300g',
          price: 18.00,
          categoryId: categoryMap['porções'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'BATATA COM BACON E CHEDDAR',
          description: '380g',
          price: 25.00,
          categoryId: categoryMap['porções'],
          available: true,
          featured: true,
          restaurantId
        }
      ]),

      // Pastéis
      ...([
        {
          name: 'PASTEL DE QUEIJO',
          description: 'Queijo',
          price: 8.50,
          categoryId: categoryMap['pastéis'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'PASTEL DE CARNE',
          description: 'Carne',
          price: 8.50,
          categoryId: categoryMap['pastéis'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'PASTEL DE PIZZA',
          description: 'Pizza',
          price: 8.50,
          categoryId: categoryMap['pastéis'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'PASTEL DE DOIS QUEIJOS',
          description: 'Mussarela e catupiry',
          price: 10.00,
          categoryId: categoryMap['pastéis'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'PASTEL DE CREMOSINHO',
          description: 'Carne e catupiry',
          price: 10.00,
          categoryId: categoryMap['pastéis'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'PASTEL DE FRANGO COM CATUPIRY',
          description: 'Frango e catupiry',
          price: 10.00,
          categoryId: categoryMap['pastéis'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'PASTEL DE CALABRESA COM CATUPIRY',
          description: 'Calabresa e catupiry',
          price: 10.00,
          categoryId: categoryMap['pastéis'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'PASTEL DE TRÊS QUEIJOS',
          description: 'Mussarela, cheddar e catupiry',
          price: 10.00,
          categoryId: categoryMap['pastéis'],
          available: true,
          featured: true,
          restaurantId
        },
        {
          name: 'PASTEL DE CARNE COM QUEIJO',
          description: 'Carne e queijo',
          price: 10.00,
          categoryId: categoryMap['pastéis'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'PASTEL DE CARNE COM CHEDDAR',
          description: 'Carne e cheddar',
          price: 10.00,
          categoryId: categoryMap['pastéis'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'PASTEL DE FRANGO COM CATUPIRY E BACON',
          description: 'Frango, catupiry e bacon',
          price: 10.00,
          categoryId: categoryMap['pastéis'],
          available: true,
          featured: true,
          restaurantId
        },
        {
          name: 'PASTEL DE FRANGO COM QUEIJO',
          description: 'Frango e queijo',
          price: 10.00,
          categoryId: categoryMap['pastéis'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'PASTEL DE CALABRESA COM QUEIJO',
          description: 'Calabresa e queijo',
          price: 10.00,
          categoryId: categoryMap['pastéis'],
          available: true,
          featured: false,
          restaurantId
        }
      ]),

      // Bebidas
      ...([
        {
          name: 'COCA-COLA LATA',
          description: 'Refrigerante Coca-Cola Lata',
          price: 6.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'FANTA UVA LATA',
          description: 'Refrigerante Fanta Uva Lata',
          price: 6.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'FANTA LARANJA LATA',
          description: 'Refrigerante Fanta Laranja Lata',
          price: 6.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'SPRITE LATA',
          description: 'Refrigerante Sprite Lata',
          price: 6.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'SCHWEPPES CÍTRICOS LATA',
          description: 'Refrigerante Schweppes Cítricos Lata',
          price: 6.50,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'COCA-COLA 200ML PET',
          description: 'Refrigerante Coca-Cola 200ML PET',
          price: 3.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'GUARANÁ ANTÁRTICA 200ML',
          description: 'Refrigerante Guaraná Antártica 200ML',
          price: 3.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'ÁGUA COM GÁS 500ML',
          description: 'Água Com Gás 500ML',
          price: 4.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'ÁGUA NATURAL 500ML',
          description: 'Água Natural 500ML',
          price: 3.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'COCA-COLA 600ML',
          description: 'Refrigerante Coca-Cola 600ML',
          price: 7.50,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'GUARANÁ ANTÁRTICA 600ML',
          description: 'Refrigerante Guaraná Antártica 600ML',
          price: 7.50,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'FANTA UVA 600ML',
          description: 'Refrigerante Fanta Uva 600ML',
          price: 7.50,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'COCA-COLA 2L',
          description: 'Refrigerante Coca-Cola 2L',
          price: 15.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'FANTA UVA 2L',
          description: 'Refrigerante Fanta Uva 2L',
          price: 14.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'FANTA LARANJA 2L',
          description: 'Refrigerante Fanta Laranja 2L',
          price: 14.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'SPRITE ORIGINAL 2L',
          description: 'Refrigerante Sprite Original 2L',
          price: 14.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'XERETA 2L TUBAÍNA',
          description: 'Refrigerante Xereta 2L Tubaína',
          price: 8.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'XERETA 2L ABACAXI',
          description: 'Refrigerante Xereta 2L Abacaxi',
          price: 8.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'XERETA 2L GUARANÁ',
          description: 'Refrigerante Xereta 2L Guaraná',
          price: 8.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'DELL VALLE LATA',
          description: 'Sabores: Pêssego, Maracujá, Uva, Manga, Goiaba',
          price: 6.50,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        },
        {
          name: 'SUCO KAPO',
          description: 'Sabores: Morango, Uva',
          price: 4.00,
          categoryId: categoryMap['bebidas'],
          available: true,
          featured: false,
          restaurantId
        }
      ]),

      // Sobremesas
      ...([
        {
          name: 'BOLO DE POTE PRESTÍGIO',
          description: 'Delicioso bolo de pote sabor prestígio',
          price: 15.00,
          categoryId: categoryMap['sobremesas'],
          available: true,
          featured: true,
          restaurantId
        },
        {
          name: 'BOLO DE POTE CHOCONINHO',
          description: 'Delicioso bolo de pote sabor choconinho',
          price: 15.00,
          categoryId: categoryMap['sobremesas'],
          available: true,
          featured: true,
          restaurantId
        },
        {
          name: 'BOLO DE POTE NINHO COM ABACAXI',
          description: 'Delicioso bolo de pote sabor ninho com abacaxi',
          price: 15.00,
          categoryId: categoryMap['sobremesas'],
          available: true,
          featured: true,
          restaurantId
        },
        {
          name: 'PÃO DE MEL DE DOCE DE LEITE',
          description: 'Delicioso pão de mel recheado com doce de leite',
          price: 8.00,
          categoryId: categoryMap['sobremesas'],
          available: true,
          featured: true,
          restaurantId
        }
      ])
    ]

    // Limpa produtos existentes deste restaurante
    await collection.deleteMany({ restaurantId })

    // Insere os novos produtos
    const result = await collection.insertMany(products)

    console.log('Produtos criados:', result)

    return NextResponse.json({
      message: 'Produtos criados com sucesso',
      insertedCount: result.insertedCount,
      products: products
    })
  } catch (error) {
    console.error('Erro ao criar produtos:', error)
    return NextResponse.json(
      { error: 'Erro ao criar produtos' },
      { status: 500 }
    )
  }
} 