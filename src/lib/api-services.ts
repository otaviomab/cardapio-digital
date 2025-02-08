import { Category, Product } from '@/types/restaurant'
import { Order } from '@/types/order'

const API_BASE = '/api/mongodb'

// Funções para Categorias
export async function getCategories(restaurantId: string) {
  const response = await fetch(`${API_BASE}?action=getCategories&restaurantId=${restaurantId}`)
  if (!response.ok) throw new Error('Erro ao buscar categorias')
  return response.json()
}

export async function createCategory(restaurantId: string, category: Omit<Category, 'id'>) {
  const response = await fetch(`${API_BASE}?action=createCategory&restaurantId=${restaurantId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category)
  })
  if (!response.ok) throw new Error('Erro ao criar categoria')
  return response.json()
}

export async function updateCategory(id: string, category: Partial<Category>) {
  const response = await fetch(`${API_BASE}?action=updateCategory&id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category)
  })
  if (!response.ok) throw new Error('Erro ao atualizar categoria')
  return response.json()
}

export async function deleteCategory(id: string) {
  const response = await fetch(`${API_BASE}?action=deleteCategory&id=${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Erro ao excluir categoria')
  return response.json()
}

// Funções para Produtos
export async function getProducts(restaurantId: string) {
  const response = await fetch(`${API_BASE}?action=getProducts&restaurantId=${restaurantId}`)
  if (!response.ok) throw new Error('Erro ao buscar produtos')
  return response.json()
}

export async function createProduct(restaurantId: string, product: Omit<Product, 'id'>) {
  const response = await fetch(`${API_BASE}?action=createProduct&restaurantId=${restaurantId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  })
  if (!response.ok) throw new Error('Erro ao criar produto')
  return response.json()
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const response = await fetch(`${API_BASE}?action=updateProduct&id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  })
  if (!response.ok) throw new Error('Erro ao atualizar produto')
  return response.json()
}

export async function deleteProduct(id: string) {
  const response = await fetch(`${API_BASE}?action=deleteProduct&id=${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Erro ao excluir produto')
  return response.json()
}

// Funções para Pedidos
export async function getOrders(restaurantId: string) {
  const response = await fetch(`${API_BASE}?action=getOrders&restaurantId=${restaurantId}`)
  if (!response.ok) throw new Error('Erro ao buscar pedidos')
  return response.json()
}

export async function getOrder(restaurantId: string, id: string) {
  const response = await fetch(`${API_BASE}?action=getOrder&restaurantId=${restaurantId}&id=${id}`)
  if (!response.ok) throw new Error('Erro ao buscar pedido')
  return response.json()
}

export async function createOrder(restaurantId: string, order: Omit<Order, 'id'>) {
  const response = await fetch(`${API_BASE}?action=createOrder&restaurantId=${restaurantId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  })
  if (!response.ok) throw new Error('Erro ao criar pedido')
  return response.json()
}

export async function updateOrderStatus(id: string, status: string, message: string) {
  const response = await fetch(`${API_BASE}?action=updateOrderStatus&id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, message })
  })
  if (!response.ok) throw new Error('Erro ao atualizar status do pedido')
  return response.json()
}

// Funções para Dashboard
export async function getDashboardStats(restaurantId: string) {
  const response = await fetch(`${API_BASE}?action=getDashboardStats&restaurantId=${restaurantId}`)
  if (!response.ok) throw new Error('Erro ao buscar estatísticas')
  return response.json()
} 