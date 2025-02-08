export interface DeliveryZone {
  id: string
  minDistance: number
  maxDistance: number
  fee: number
  estimatedTime: string
  active: boolean
}

export interface DeliverySettings {
  zones: DeliveryZone[]
  minimumOrderValue: number
  restaurantAddress: {
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
} 