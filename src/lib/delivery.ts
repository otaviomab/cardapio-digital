import { DeliveryZone } from '@/types/delivery'

interface CalculateDeliveryFeeParams {
  origin: {
    lat: number
    lng: number
  }
  destination: {
    lat: number
    lng: number
  }
  zones: DeliveryZone[]
}

interface DeliveryFeeResult {
  distance: number
  fee: number
  estimatedTime: string
  isDeliverable: boolean
}

export async function calculateDeliveryFee({
  origin,
  destination,
  zones
}: CalculateDeliveryFeeParams): Promise<DeliveryFeeResult> {
  try {
    // Calcula a distância usando a Google Maps Distance Matrix API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    )

    const data = await response.json()

    if (data.status !== 'OK') {
      throw new Error('Erro ao calcular distância')
    }

    // Pega a distância em metros e converte para km
    const distanceInMeters = data.rows[0].elements[0].distance.value
    const distanceInKm = distanceInMeters / 1000

    // Encontra a zona correspondente à distância
    const zone = zones.find(
      zone =>
        zone.active &&
        distanceInKm >= zone.minDistance &&
        distanceInKm <= zone.maxDistance
    )

    if (!zone) {
      return {
        distance: distanceInKm,
        fee: 0,
        estimatedTime: '',
        isDeliverable: false
      }
    }

    return {
      distance: distanceInKm,
      fee: zone.fee,
      estimatedTime: zone.estimatedTime,
      isDeliverable: true
    }
  } catch (error) {
    console.error('Erro ao calcular taxa de entrega:', error)
    throw error
  }
}

export async function getAddressCoordinates(address: string) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    )

    const data = await response.json()

    if (data.status !== 'OK') {
      throw new Error('Endereço não encontrado')
    }

    const { lat, lng } = data.results[0].geometry.location

    return { lat, lng }
  } catch (error) {
    console.error('Erro ao buscar coordenadas:', error)
    throw error
  }
}

// Função para validar se um endereço está dentro do raio de entrega
export async function validateDeliveryAddress(
  restaurantAddress: string,
  customerAddress: string,
  zones: DeliveryZone[]
): Promise<{
  isValid: boolean
  distance?: number
  fee?: number
  estimatedTime?: string
}> {
  try {
    // Obtém as coordenadas do restaurante
    const restaurantCoords = await getAddressCoordinates(restaurantAddress)
    
    // Obtém as coordenadas do cliente
    const customerCoords = await getAddressCoordinates(customerAddress)

    // Calcula a taxa de entrega
    const deliveryInfo = await calculateDeliveryFee({
      origin: restaurantCoords,
      destination: customerCoords,
      zones
    })

    return {
      isValid: deliveryInfo.isDeliverable,
      distance: deliveryInfo.distance,
      fee: deliveryInfo.fee,
      estimatedTime: deliveryInfo.estimatedTime
    }
  } catch (error) {
    console.error('Erro ao validar endereço:', error)
    throw error
  }
} 