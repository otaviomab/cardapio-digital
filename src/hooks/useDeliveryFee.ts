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
  
  // Ref para armazenar o último endereço calculado e seu status
  const lastCalculation = useRef<{
    address: string
    isOutOfRange?: boolean
  }>({ address: '' })

  const calculateFee = useCallback(async (destinationAddress: string) => {
    console.log('🚀 Iniciando cálculo de taxa de entrega:', {
      restaurantAddress,
      destinationAddress,
      deliveryZones,
      lastCalculation: lastCalculation.current
    })
    
    // Se o endereço for o mesmo que o último calculado E já sabemos que está fora da área
    if (
      destinationAddress === lastCalculation.current.address && 
      lastCalculation.current.isOutOfRange
    ) {
      console.log('🔄 Endereço já verificado e está fora da área, ignorando novo cálculo')
      return
    }

    // Se o endereço for o mesmo que o último calculado e não está marcado como fora da área
    if (destinationAddress === lastCalculation.current.address && !lastCalculation.current.isOutOfRange) {
      console.log('🔄 Mesmo endereço que o último cálculo válido, retornando...')
      return
    }

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

    // DEBUG: Log de zonas de entrega
    console.log('📋 ZONAS DE ENTREGA DISPONÍVEIS:')
    deliveryZones.forEach(zone => {
      console.log(`- ZONA ID: ${zone.id}, MIN: ${zone.minDistance}km, MAX: ${zone.maxDistance}km, TAXA: R$${zone.fee}, ATIVA: ${zone.active}`)
    })

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

      // Arredonda a distância para 2 casas decimais para evitar problemas de precisão
      const roundedDistance = Math.round(distanceInKm * 100) / 100
      console.log('🔢 Distância arredondada para comparação:', roundedDistance, 'km')

      // Margem de tolerância para endereços próximos aos limites das zonas
      const toleranceMargin = 0.3 // 300 metros em km
      console.log(`🔍 Usando margem de tolerância de ${toleranceMargin}km (${toleranceMargin * 1000}m)`)
      
      // Encontra todas as zonas que poderiam atender com a tolerância
      const matchingZones = deliveryZones.filter(
        zone => {
          // Verifica se a zona está ativa
          if (!zone.active) {
            console.log(`- ZONA ID: ${zone.id} - INATIVA, ignorando`);
            return false;
          }
          
          // Caso 1: Dentro da zona normalmente
          const withinZone = roundedDistance >= zone.minDistance && roundedDistance <= zone.maxDistance;
          
          // Caso 2: Dentro da zona com tolerância
          const withinZoneWithTolerance = 
            roundedDistance >= (zone.minDistance - toleranceMargin) && 
            roundedDistance <= (zone.maxDistance + toleranceMargin);
          
          // Caso 3: Exatamente na fronteira entre zonas
          const onZoneBoundary = 
            Math.abs(roundedDistance - zone.minDistance) < 0.05 || 
            Math.abs(roundedDistance - zone.maxDistance) < 0.05;
            
          const zoneFits = withinZone || withinZoneWithTolerance || onZoneBoundary;
            
          console.log(`- ZONA ID: ${zone.id}, MIN: ${zone.minDistance}km, MAX: ${zone.maxDistance}km - CORRESPONDE: ${zoneFits ? 'SIM' : 'NÃO'}`);
          console.log(`  • Dentro da zona: ${withinZone ? 'SIM' : 'NÃO'}`);
          console.log(`  • Dentro com tolerância: ${withinZoneWithTolerance ? 'SIM' : 'NÃO'}`);
          console.log(`  • Na fronteira: ${onZoneBoundary ? 'SIM' : 'NÃO'}`);
          
          return zoneFits;
        }
      );

      console.log('🎯 Zonas correspondentes encontradas:', matchingZones.length ? matchingZones : 'Nenhuma');

      // Se encontrou múltiplas zonas, seleciona a mais favorável (menor taxa)
      let zone = null;
      if (matchingZones.length > 0) {
        // Ordena por taxa (menor primeiro) e pega a primeira
        zone = matchingZones.sort((a, b) => a.fee - b.fee)[0];
        console.log(`✅ Zona selecionada: ID: ${zone.id}, MIN: ${zone.minDistance}km, MAX: ${zone.maxDistance}km, TAXA: R$${zone.fee}`);
      } else {
        console.log('❌ Nenhuma zona correspondente encontrada para a distância calculada');
      }

      // Atualiza o último endereço calculado
      lastCalculation.current = {
        address: destinationAddress,
        isOutOfRange: !zone
      }

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
    } catch (error) {
      console.error('❌ Erro ao calcular taxa de entrega:', error)
      setFee(null)
      setEstimatedTime(null)
      setIsDeliverable(false)
      setError('Erro ao calcular taxa de entrega')
    } finally {
      setIsLoading(false)
    }
  }, [restaurantAddress, deliveryZones])

  // Verifica se o restaurante tem endereço e zonas de entrega configuradas
  useEffect(() => {
    if (!restaurantAddress || (!deliveryZones || deliveryZones.length === 0)) {
      console.log('⚠️ Restaurante sem endereço ou zonas de entrega configuradas:', {
        temEndereco: !!restaurantAddress,
        temZonas: deliveryZones && deliveryZones.length > 0
      })
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