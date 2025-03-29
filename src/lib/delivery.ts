import { DeliveryZone } from '@/types/delivery'
import { calculateDistanceByCoordinates, getAddressCoordinates } from '@/services/distanceService'
import { OutOfDeliveryAreaError, InvalidParametersError } from '@/services/errors'
import { calculateDeliveryFeeByDistance, DEFAULT_TOLERANCE_KM } from '@/services/zoneService'

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
  toleranceKm?: number
}

interface DeliveryFeeResult {
  distance: number
  fee: number
  estimatedTime: string
  isDeliverable: boolean
  zone?: DeliveryZone
}

export async function calculateDeliveryFee({
  origin,
  destination,
  zones,
  toleranceKm = DEFAULT_TOLERANCE_KM
}: CalculateDeliveryFeeParams): Promise<DeliveryFeeResult> {
  try {
    if (!origin || !destination || !zones) {
      throw new InvalidParametersError('Origem, destino e zonas são obrigatórios');
    }

    // Filtra apenas zonas ativas
    const activeZones = zones.filter(zone => zone.active);
    
    if (activeZones.length === 0) {
      throw new InvalidParametersError('Não há zonas de entrega ativas configuradas');
    }

    // Usa o serviço centralizado para calcular a distância
    const distanceInKm = await calculateDistanceByCoordinates(origin, destination)

    // Usa o serviço de zonas para calcular a taxa de entrega com tolerância
    const result = calculateDeliveryFeeByDistance(distanceInKm, activeZones, toleranceKm)

    if (!result.isDeliverable) {
      // Formata as coordenadas para mensagem de erro
      const originStr = `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`;
      const destinationStr = `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`;
      
      throw new OutOfDeliveryAreaError(destinationStr, distanceInKm);
    }

    return {
      distance: distanceInKm,
      fee: result.fee,
      estimatedTime: result.estimatedTime,
      isDeliverable: true,
      zone: result.zone
    }
  } catch (error) {
    // Se for um erro específico, propaga
    if (error instanceof OutOfDeliveryAreaError || error instanceof InvalidParametersError) {
      throw error;
    }
    
    console.error('Erro ao calcular taxa de entrega:', error)
    throw error
  }
}

// Função para validar se um endereço está dentro do raio de entrega
export async function validateDeliveryAddress(
  restaurantAddress: string,
  customerAddress: string,
  zones: DeliveryZone[],
  toleranceKm = DEFAULT_TOLERANCE_KM
): Promise<{
  isValid: boolean
  distance?: number
  fee?: number
  estimatedTime?: string
  zone?: DeliveryZone
}> {
  try {
    if (!restaurantAddress || !customerAddress || !zones) {
      throw new InvalidParametersError('Endereço do restaurante, endereço do cliente e zonas são obrigatórios');
    }

    // Obtém as coordenadas do restaurante usando o serviço centralizado
    const restaurantCoords = await getAddressCoordinates(restaurantAddress)
    
    // Obtém as coordenadas do cliente usando o serviço centralizado
    const customerCoords = await getAddressCoordinates(customerAddress)

    // Calcula a taxa de entrega
    try {
      const deliveryInfo = await calculateDeliveryFee({
        origin: restaurantCoords,
        destination: customerCoords,
        zones,
        toleranceKm
      })

      return {
        isValid: deliveryInfo.isDeliverable,
        distance: deliveryInfo.distance,
        fee: deliveryInfo.fee,
        estimatedTime: deliveryInfo.estimatedTime,
        zone: deliveryInfo.zone
      }
    } catch (error) {
      // Se o endereço estiver fora da área de entrega, retorna isValid = false
      if (error instanceof OutOfDeliveryAreaError) {
        return {
          isValid: false,
          distance: error.message.match(/\(([0-9.]+) km\)/)
            ? parseFloat(error.message.match(/\(([0-9.]+) km\)/)[1])
            : undefined
        }
      }
      
      // Propaga outros erros
      throw error;
    }
  } catch (error) {
    console.error('Erro ao validar endereço:', error)
    throw error
  }
} 