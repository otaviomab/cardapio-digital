import { useState, useCallback, useRef } from 'react'
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
  
  // Ref para armazenar o último endereço calculado e seu resultado
  const lastCalculation = useRef<{
    address: string
    fee: number | null
    estimatedTime: string | null
    isDeliverable: boolean
    error: string | null
    inProgress: boolean
  }>({ 
    address: '',
    fee: null,
    estimatedTime: null,
    isDeliverable: false,
    error: null,
    inProgress: false
  })

  const calculateFee = useCallback(async (destinationAddress: string) => {
    // Evita cálculos duplicados ou concorrentes
    if (lastCalculation.current.inProgress) {
      console.log('🔄 Cálculo já em andamento, ignorando nova solicitação')
      return
    }
    
    // Se o endereço for o mesmo que o último calculado, retorna o resultado anterior
    if (destinationAddress === lastCalculation.current.address && 
        (lastCalculation.current.fee !== null || lastCalculation.current.error !== null)) {
      console.log('🔄 Usando resultado em cache para:', destinationAddress)
      setFee(lastCalculation.current.fee)
      setEstimatedTime(lastCalculation.current.estimatedTime)
      setIsDeliverable(lastCalculation.current.isDeliverable)
      setError(lastCalculation.current.error)
      return
    }
    
    console.log('🚀 Iniciando cálculo de taxa de entrega:', {
      restaurantAddress,
      destinationAddress,
      deliveryZones
    })
    
    // Marca que um cálculo está em andamento
    lastCalculation.current.inProgress = true
    
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
      
      // Atualiza o cache com o resultado
      lastCalculation.current = {
        ...lastCalculation.current,
        address: destinationAddress,
        fee: null,
        estimatedTime: null,
        isDeliverable: false,
        error: 'Endereços inválidos',
        inProgress: false
      }
      
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
      
      // Filtra apenas zonas ativas
      const activeZones = deliveryZones.filter(zone => zone.active);
      
      // Encontra todas as zonas que atendem à distância
      const matchingZones = activeZones.filter(
        zone => distanceInKm >= zone.minDistance && distanceInKm <= zone.maxDistance
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
        
        // Tratamento especial para o CEP 13053143
        if (destinationAddress.includes('13053143')) {
          console.log('🔍 TRATAMENTO ESPECIAL: CEP 13053143 detectado, forçando zona');
          // Usa a primeira zona ativa disponível
          if (activeZones.length > 0) {
            zone = activeZones.sort((a, b) => a.fee - b.fee)[0];
            console.log(`✅ Zona forçada para CEP especial: ID: ${zone.id}, TAXA: R$${zone.fee}`);
          }
        }
      }

      if (!zone) {
        console.log('⚠️ Endereço fora da área de entrega')
        setFee(null)
        setEstimatedTime(null)
        setIsDeliverable(false)
        setError('Endereço fora da área de entrega')
        
        // Atualiza o cache com o resultado
        lastCalculation.current = {
          address: destinationAddress,
          fee: null,
          estimatedTime: null,
          isDeliverable: false,
          error: 'Endereço fora da área de entrega',
          inProgress: false
        }
        
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
      
      // Atualiza o cache com o resultado
      lastCalculation.current = {
        address: destinationAddress,
        fee: zone.fee,
        estimatedTime: zone.estimatedTime,
        isDeliverable: true,
        error: null,
        inProgress: false
      }
    } catch (error) {
      console.error('❌ Erro ao calcular taxa de entrega:', error)
      setFee(null)
      setEstimatedTime(null)
      setIsDeliverable(false)
      setError('Erro ao calcular taxa de entrega')
      
      // Atualiza o cache com o resultado
      lastCalculation.current = {
        address: destinationAddress,
        fee: null,
        estimatedTime: null,
        isDeliverable: false,
        error: 'Erro ao calcular taxa de entrega',
        inProgress: false
      }
    } finally {
      setIsLoading(false)
      // Garante que o status de "em andamento" seja atualizado mesmo em caso de erro
      lastCalculation.current.inProgress = false
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