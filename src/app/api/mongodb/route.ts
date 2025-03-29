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
        const categoryIds = searchParams.get('ids')
        
        if (categoryIds) {
          // Buscar categorias específicas por IDs
          try {
            // Conecta ao MongoDB
            const client = await clientPromise;
            const db = client.db('cardapio_digital');
            
            // Converte a string de IDs em um array
            const idArray = categoryIds.split(',');
            
            // Converte os IDs em ObjectIds para a consulta
            const objectIds = idArray.map(id => {
              try {
                return new ObjectId(id);
              } catch (error) {
                console.error(`ID inválido: ${id}`);
                return null;
              }
            }).filter(id => id !== null);
            
            // Busca as categorias pelo ID
            const categories = await db.collection('categories').find({
              _id: { $in: objectIds }
            }).toArray();
            
            return NextResponse.json(categories);
          } catch (error) {
            console.error('Erro ao buscar categorias por IDs:', error);
            return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
          }
        }
        
        // Caso tradicional: buscar categorias por restaurante
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
        
        const order = await getOrder(orderId)
        
        // Adiciona categorias aos itens do pedido que não as têm
        if (order && order.items && Array.isArray(order.items)) {
          // Verifica quais itens precisam de categorias
          const itemsWithoutCategory = order.items.filter(item => !item.category);
          const hasUpdates = itemsWithoutCategory.length > 0;
          
          if (hasUpdates) {
            console.log(`Encontrados ${itemsWithoutCategory.length} itens sem categoria no pedido ${orderId}`);
            
            // Buscar produtos para obter categorias
            try {
              const client = await clientPromise;
              const db = client.db('cardapio_digital');
              const productsCollection = db.collection('products');
              const categoriesCollection = db.collection('categories');
              const ordersCollection = db.collection('orders');
              
              let hasChanges = false;
              
              for (const item of order.items) {
                if (!item.category) {
                  console.log(`Buscando categoria para item "${item.name}" (ID: ${item.productId})`);
                  
                  // Tenta encontrar o produto pelo ID
                  let product;
                  try {
                    product = await productsCollection.findOne({
                      $or: [
                        { _id: new ObjectId(item.productId) },
                        { id: item.productId },
                        { productId: item.productId }
                      ]
                    });
                    
                    if (product) {
                      console.log(`Encontrado produto para item '${item.name}': ${product.name}`);
                    } else {
                      // Busca por nome se não encontrar por ID
                      product = await productsCollection.findOne({
                        name: item.name
                      });
                      
                      if (product) {
                        console.log(`Encontrado produto pelo nome: ${product.name}`);
                      }
                    }
                  } catch (e) {
                    console.log(`Erro ao buscar produto pelo ID ${item.productId}`, e);
                  }
                  
                  if (product) {
                    let categoryName = null;
                    
                    // Tenta obter a categoria de várias fontes
                    if (product.category) {
                      // Se o produto já tem a categoria diretamente
                      categoryName = product.category;
                      console.log(`Categoria do produto: ${categoryName}`);
                    } else if (product.categoryId) {
                      // Se o produto tem um categoryId, busca a categoria
                      try {
                        const category = await categoriesCollection.findOne({
                          $or: [
                            { _id: new ObjectId(product.categoryId) },
                            { id: product.categoryId }
                          ]
                        });
                        
                        if (category) {
                          categoryName = category.name;
                          console.log(`Categoria encontrada pelo ID: ${categoryName}`);
                        }
                      } catch (e) {
                        console.log(`Erro ao buscar categoria pelo ID ${product.categoryId}`, e);
                      }
                    } else if (product.categoryName) {
                      // Alguns produtos podem ter categoryName direto
                      categoryName = product.categoryName;
                      console.log(`Usando categoryName do produto: ${categoryName}`);
                    }
                    
                    if (categoryName) {
                      // Atualiza o item em memória
                      item.category = categoryName;
                      hasChanges = true;
                      
                      // Atualiza no banco de dados também
                      try {
                        const updateResult = await ordersCollection.updateOne(
                          { _id: new ObjectId(orderId), "items.productId": item.productId },
                          { $set: { "items.$.category": categoryName } }
                        );
                        
                        console.log(`Atualização no banco: ${updateResult.modifiedCount} item(s) modificado(s)`);
                      } catch (updateError) {
                        console.error("Erro ao atualizar categoria no banco:", updateError);
                      }
                    } else {
                      console.log(`Não foi possível determinar a categoria para o item '${item.name}'`);
                    }
                  } else {
                    console.log(`Produto não encontrado para item '${item.name}'`);
                  }
                }
              }
              
              if (hasChanges) {
                console.log("Categorias atualizadas com sucesso para o pedido:", orderId);
              }
            } catch (error) {
              console.error('Erro ao enriquecer pedido com categorias:', error);
            }
          }
        }
        
        return NextResponse.json(order)

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
        // Log detalhado de categorias
        if (body.items && Array.isArray(body.items)) {
          console.log('Categorias dos itens enviados para MongoDB:'); 
          body.items.forEach(item => {
            console.log(`- ${item.name}: categoria [${item.category || 'não definida'}]`);
          });
        }
        
        // Não modificamos os itens - usa exatamente o que foi enviado
        const newOrder = await createOrder(body)
        return NextResponse.json(newOrder)

      case 'updateOrderStatus':
        const { id, status, message } = body
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
          // Logs para debug
          console.log('API getOrderStats - Datas recebidas:', {
            startDate,
            endDate,
            startDateObj: new Date(startDate),
            endDateObj: new Date(endDate)
          })
          
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