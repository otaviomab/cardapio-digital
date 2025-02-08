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
  }
  contact: {
    phone: string
    whatsapp: string
    email: string
  }
  openingHours: {
    days: string
    hours: string
  }[]
  deliveryInfo: {
    minimumOrder: number
    deliveryTime: string
    deliveryFee: number
    paymentMethods: string[]
  }
}

export interface Category {
  id: string
  name: string
  description?: string
  order: number
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  categoryId: string
  available: boolean
  featured: boolean
  additions?: Addition[]
}

export interface Addition {
  id: string
  name: string
  price: number
  available: boolean
} 