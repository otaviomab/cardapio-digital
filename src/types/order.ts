export type OrderStatus = 
  | 'pending' // Aguardando confirmação do restaurante
  | 'confirmed' // Pedido aceito, em preparação
  | 'rejected' // Pedido recusado pelo restaurante
  | 'preparing' // Em preparação
  | 'ready' // Pronto para entrega/retirada
  | 'out_for_delivery' // Saiu para entrega
  | 'delivered' // Entregue
  | 'completed' // Finalizado (retirada)
  | 'cancelled' // Cancelado

export interface OrderStatusUpdate {
  status: OrderStatus
  timestamp: Date
  message: string
}

export interface Order {
  _id: string
  restaurantId: string
  status: OrderStatus
  orderType: 'delivery' | 'pickup'
  customer: {
    name: string
    phone: string
  }
  address?: {
    cep: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
  }
  payment: {
    method: string
    change?: string
  }
  items: {
    id: string
    name: string
    price: number
    quantity: number
    observation?: string
    additions: {
      name: string
      price: number
    }[]
  }[]
  subtotal: number
  deliveryFee?: number
  total: number
  statusUpdates: OrderStatusUpdate[]
  createdAt: Date
  updatedAt: Date
} 