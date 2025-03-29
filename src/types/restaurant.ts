export interface Restaurant {
  id: string
  slug: string
  name: string
  description: string
  logo: string
  coverImage: string
  address: {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  contact: {
    phone: string
    whatsapp: string
    email: string
  }
  openingHours: {
    days: string[]
    start: string
    end: string
    enabled: boolean
  }[]
  deliveryInfo: {
    minimumOrder: number
    deliveryTime: string
    paymentMethods: string[]
    zones: {
      name: string
      minDistance: number
      maxDistance: number
      fee: number
    }[]
  }
  restaurantType: RestaurantType
}

export enum RestaurantType {
  RESTAURANT = 'restaurant',
  PIZZARIA = 'pizzaria',
  HAMBURGUERIA = 'hamburgueria',
  CAFETERIA = 'cafeteria',
  OUTROS = 'outros'
}

export interface Category {
  id: string
  name: string
  active: boolean
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  active: boolean
  additions?: Addition[]
  isPizza?: boolean
  allowHalfHalf?: boolean
}

export interface Addition {
  id: string
  name: string
  price: number
  active: boolean
  selected?: boolean
}

// Nova interface para representar produtos no carrinho com opção de meia-pizza
export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  observation?: string
  additions?: Addition[]
  halfHalf?: {
    firstHalf: {
      productId: string
      name: string
      price: number
    },
    secondHalf: {
      productId: string
      name: string
      price: number
    }
  }
} 