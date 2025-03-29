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
  timestamp: string | Date
  message: string
}

export interface Order {
  _id?: string
  restaurantId: string
  customer: {
    name: string
    email: string
    phone: string
  }
  items: {
    productId: string
    name: string
    price: number
    quantity: number
    observations?: string
    category?: string
    isHalfHalf?: boolean
    halfHalf?: {
      firstHalf: {
        name: string
        additions?: Array<{name: string, price: number}>
      }
      secondHalf: {
        name: string
        additions?: Array<{name: string, price: number}>
      }
    }
    additions?: Array<{id?: string, name: string, price: number}>
  }[]
  total: number
  subtotal?: number
  status: OrderStatus
  statusUpdates?: OrderStatusUpdate[]
  
  // Campos para o tipo de pedido (compatibilidade)
  orderType?: 'delivery' | 'pickup'
  deliveryMethod?: 'delivery' | 'pickup'
  
  // Campos para endereço (compatibilidade)
  address?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    cep: string
  }
  deliveryAddress?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  
  paymentMethod: 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'meal_voucher'
  
  // Campo para troco (quando o pagamento é em dinheiro)
  change?: number
  
  // Campo para compatibilidade com estrutura de pagamento alternativa
  payment?: {
    method: 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'meal_voucher'
    change?: number
  }
  
  createdAt: string
  updatedAt: string
} 