import { Category, Product } from '@/types/restaurant'
import { Order } from '@/types/order'

// Função auxiliar para construir URLs absolutas
const getBaseUrl = () => {
  // Se estivermos no servidor, retorna apenas o caminho relativo
  if (typeof window === 'undefined') {
    return ''
  }
  // Se estivermos no cliente, usa a URL atual
  return window.location.origin
}

// Funções para Categorias
export async function getCategories(restaurantId: string) {
  try {
    console.log('Buscando categorias para restaurante:', restaurantId)
    const response = await fetch(`${getBaseUrl()}/api/mongodb?action=getCategories&restaurantId=${restaurantId}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao buscar categorias')
    }
    
    const data = await response.json()
    console.log('Categorias encontradas:', data)
    return data
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    throw error
  }
}

export async function createCategory(restaurantId: string, category: Omit<Category, 'id'>) {
  console.log('Chamando API para criar categoria:', { restaurantId, category })
  
  const response = await fetch(`${getBaseUrl()}/api/mongodb?action=createCategory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...category,
      restaurantId
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erro ao criar categoria')
  }

  const data = await response.json()
  console.log('Categoria criada:', data)
  return data
}

export async function updateCategory(id: string, category: Partial<Category>) {
  console.log('Chamando API para atualizar categoria:', { id, category })

  try {
    const response = await fetch(`${getBaseUrl()}/api/mongodb?action=updateCategory&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    })

    const data = await response.json()
    console.log('Resposta da API:', { status: response.status, data })

    if (!response.ok) {
      const errorMessage = data.error || 'Erro ao atualizar categoria'
      console.error('Erro na resposta da API:', { 
        status: response.status, 
        error: errorMessage,
        details: data.details 
      })
      throw new Error(errorMessage)
    }

    return data
  } catch (error) {
    console.error('Erro ao fazer requisição:', error)
    throw error
  }
}

export async function deleteCategory(id: string) {
  const response = await fetch(`${getBaseUrl()}/api/mongodb?action=deleteCategory&id=${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Erro ao excluir categoria')
  return response.json()
}

// Funções para Produtos
export async function getProducts(restaurantId: string) {
  try {
    console.log('Buscando produtos para restaurante:', restaurantId)
    const response = await fetch(`${getBaseUrl()}/api/mongodb?action=getProducts&restaurantId=${restaurantId}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao buscar produtos')
    }
    
    const data = await response.json()
    console.log('Produtos encontrados:', data)
    return data
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    throw error
  }
}

export async function createProduct(restaurantId: string, product: Omit<Product, 'id'>) {
  console.log('Chamando API para criar produto:', { restaurantId, product })
  
  const response = await fetch(`${getBaseUrl()}/api/mongodb?action=createProduct&restaurantId=${restaurantId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
    console.error('Erro ao criar produto:', error)
    throw new Error(error.message || 'Erro ao criar produto')
  }
  
  const result = await response.json()
  console.log('Produto criado com sucesso:', result)
  return result
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const response = await fetch(`${getBaseUrl()}/api/mongodb?action=updateProduct&id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  })
  if (!response.ok) throw new Error('Erro ao atualizar produto')
  return response.json()
}

export async function deleteProduct(id: string) {
  const response = await fetch(`${getBaseUrl()}/api/mongodb?action=deleteProduct&id=${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Erro ao excluir produto')
  return response.json()
}

// Funções para Pedidos
export async function getOrders(restaurantId: string) {
  const response = await fetch(`${getBaseUrl()}/api/mongodb?action=getOrders&restaurantId=${restaurantId}`)
  if (!response.ok) throw new Error('Erro ao buscar pedidos')
  return response.json()
}

export async function getOrder(restaurantId: string, id: string) {
  const response = await fetch(`${getBaseUrl()}/api/mongodb?action=getOrder&restaurantId=${restaurantId}&id=${id}`)
  if (!response.ok) throw new Error('Erro ao buscar pedido')
  return response.json()
}

export async function createOrder(restaurantId: string, order: Omit<Order, 'id'>) {
  const response = await fetch(`${getBaseUrl()}/api/mongodb?action=createOrder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...order,
      restaurantId
    })
  })
  if (!response.ok) throw new Error('Erro ao criar pedido')
  return response.json()
}

export async function updateOrderStatus(id: string, status: string, message: string) {
  const response = await fetch(`${getBaseUrl()}/api/mongodb?action=updateOrderStatus&id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, message })
  })
  if (!response.ok) throw new Error('Erro ao atualizar status do pedido')
  return response.json()
}

// Funções para Dashboard
export async function getDashboardStats(restaurantId: string) {
  const response = await fetch(`${getBaseUrl()}/api/mongodb?action=getDashboardStats&restaurantId=${restaurantId}`)
  if (!response.ok) throw new Error('Erro ao buscar estatísticas')
  return response.json()
}