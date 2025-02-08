import { useState, useCallback, useRef, useEffect } from 'react'
import { DeliveryZone } from '@/types/delivery'

interface UseDeliveryFeeResult {
  fee: number | null
  isLoading: boolean
  error: string | null
  estimatedTime: string | null
  isDeliverable: boolean
  calculateFee: (destinationAddress: string) => Promise<void>
}

interface RestaurantAddress {
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

export function useDeliveryFee(
  restaurantAddress: RestaurantAddress | string,
  deliveryZones: DeliveryZone[]
): UseDeliveryFeeResult {
  const [fee, setFee] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null)
  const [isDeliverable, setIsDeliverable] = useState(false)
  
  // Ref para armazenar o último endereço calculado
  const lastCalculatedAddress = useRef<string>('')

  const calculateFee = useCallback(async (destinationAddress: string) => {
    console.log('🚀 Iniciando cálculo de taxa de entrega:', {
      restaurantAddress,
      destinationAddress,
      deliveryZones,
      lastCalculatedAddress: lastCalculatedAddress.current
    })

    // Se não houver zonas de entrega configuradas, usa uma zona padrão
    if (!deliveryZones || deliveryZones.length === 0) {
      console.log('⚠️ Nenhuma zona de entrega configurada, usando zona padrão')
      deliveryZones = [{
        id: 'default',
        minDistance: 0,
        maxDistance: 5,
        fee: 5,
        estimatedTime: '30-45 min',
        active: true
      }]
    }

    // Se o endereço for o mesmo que o último calculado, não recalcula
    if (destinationAddress === lastCalculatedAddress.current) {
      console.log('🔄 Mesmo endereço que o último cálculo, retornando...')
      return
    }

    if (!restaurantAddress || !destinationAddress) {
      console.log('❌ Endereços inválidos:', { restaurantAddress, destinationAddress })
      setError('Endereços inválidos')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Formata o endereço do restaurante se for um objeto
      const formattedRestaurantAddress = typeof restaurantAddress === 'string'
        ? restaurantAddress
        : `${restaurantAddress.street}, ${restaurantAddress.number} - ${restaurantAddress.neighborhood}, ${restaurantAddress.city} - ${restaurantAddress.state}, ${restaurantAddress.zipCode}`

      console.log('📍 Endereços formatados:', {
        restaurante: formattedRestaurantAddress,
        destino: destinationAddress
      })

      // Obter distância usando Google Distance Matrix API
      const response = await fetch(
        `/api/calculate-distance?origin=${encodeURIComponent(formattedRestaurantAddress)}&destination=${encodeURIComponent(destinationAddress)}`
      )
      const data = await response.json()

      console.log('📊 Resposta da API de distância:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao calcular distância')
      }

      const distanceInKm = data.distance

      console.log('📏 Distância calculada:', distanceInKm, 'km')

      // Encontrar zona de entrega correspondente
      console.log('🔍 Procurando zona de entrega para distância:', distanceInKm, 'km')
      console.log('📍 Zonas disponíveis:', deliveryZones)

      const zone = deliveryZones.find(
        zone => zone.active && 
        distanceInKm >= zone.minDistance && 
        distanceInKm <= zone.maxDistance
      )

      console.log('🎯 Zona de entrega encontrada:', zone)

      if (!zone) {
        console.log('⚠️ Endereço fora da área de entrega')
        setFee(null)
        setEstimatedTime(null)
        setIsDeliverable(false)
        setError('Endereço fora da área de entrega')
        setIsLoading(false)
        return
      }

      console.log('✅ Taxa de entrega calculada:', {
        taxa: zone.fee,
        tempoEstimado: zone.estimatedTime
      })

      setFee(zone.fee)
      setEstimatedTime(zone.estimatedTime)
      setIsDeliverable(true)
      setError(null)
      
      // Atualiza o último endereço calculado
      lastCalculatedAddress.current = destinationAddress
    } catch (err) {
      console.error('❌ Erro no cálculo:', err)
      setFee(null)
      setEstimatedTime(null)
      setIsDeliverable(false)
      setError(err instanceof Error ? err.message : 'Erro ao calcular taxa de entrega')
    } finally {
      setIsLoading(false)
    }
  }, [restaurantAddress, deliveryZones])

  // Limpa os estados quando o endereço do restaurante ou as zonas mudam
  useEffect(() => {
    // Só reseta se realmente não houver endereço do restaurante ou zonas
    if (!restaurantAddress || (!deliveryZones || deliveryZones.length === 0)) {
      console.log('🔄 Resetando estados pois não há endereço ou zonas:', {
        temRestaurante: !!restaurantAddress,
        temZonas: deliveryZones && deliveryZones.length > 0
      })
      setFee(null)
      setEstimatedTime(null)
      setIsDeliverable(false)
      setError(null)
      lastCalculatedAddress.current = ''
    }
  }, [restaurantAddress, deliveryZones])

  return {
    fee,
    isLoading,
    error,
    estimatedTime,
    isDeliverable,
    calculateFee
  }
} 