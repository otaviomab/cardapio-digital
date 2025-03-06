import { useState, useCallback, useRef } from 'react'
import { DeliveryZone } from '@/types/delivery'
import { 
  InvalidParametersError, 
  AddressNotFoundError, 
  DistanceCalculationError, 
  GoogleApiError, 
  OutOfDeliveryAreaError 
} from '@/services/errors'
import { findMatchingZones, findBestZone, DEFAULT_TOLERANCE_KM } from '@/services/zoneService'

interface UseDeliveryFeeResult {
  fee: number | null
  isLoading: boolean
  error: string | null
  errorType: string | null
  estimatedTime: string | null
  isDeliverable: boolean
  zone: DeliveryZone | null
  matchingZones: Array<{
    zone: DeliveryZone
    isExactlyInZone: boolean
    isInZoneWithTolerance: boolean
    isOnBoundary: boolean
  }>
  calculateFee: (destinationAddress: string, toleranceKm?: number) => Promise<void>
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
  const [errorType, setErrorType] = useState<string | null>(null)
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null)
  const [isDeliverable, setIsDeliverable] = useState(false)
  const [zone, setZone] = useState<DeliveryZone | null>(null)
  const [matchingZones, setMatchingZones] = useState<Array<{
    zone: DeliveryZone
    isExactlyInZone: boolean
    isInZoneWithTolerance: boolean
    isOnBoundary: boolean
  }>>([])
  
  // Ref para armazenar o último endereço calculado e seu resultado
  const lastCalculation = useRef<{
    address: string
    toleranceKm: number
    fee: number | null
    estimatedTime: string | null
    isDeliverable: boolean
    error: string | null
    errorType: string | null
    zone: DeliveryZone | null
    matchingZones: Array<{
      zone: DeliveryZone
      isExactlyInZone: boolean
      isInZoneWithTolerance: boolean
      isOnBoundary: boolean
    }>
    inProgress: boolean
  }>({ 
    address: '',
    toleranceKm: DEFAULT_TOLERANCE_KM,
    fee: null,
    estimatedTime: null,
    isDeliverable: false,
    error: null,
    errorType: null,
    zone: null,
    matchingZones: [],
    inProgress: false
  })

  const calculateFee = useCallback(async (
    destinationAddress: string, 
    toleranceKm: number = DEFAULT_TOLERANCE_KM
  ) => {
    // Evita cálculos duplicados ou concorrentes
    if (lastCalculation.current.inProgress) {
      console.log('🔄 Cálculo já em andamento, ignorando nova solicitação')
      return
    }
    
    // Se o endereço for o mesmo que o último calculado e a tolerância for a mesma, retorna o resultado anterior
    if (destinationAddress === lastCalculation.current.address && 
        toleranceKm === lastCalculation.current.toleranceKm &&
        (lastCalculation.current.fee !== null || lastCalculation.current.error !== null)) {
      console.log('🔄 Usando resultado em cache para:', destinationAddress)
      setFee(lastCalculation.current.fee)
      setEstimatedTime(lastCalculation.current.estimatedTime)
      setIsDeliverable(lastCalculation.current.isDeliverable)
      setError(lastCalculation.current.error)
      setErrorType(lastCalculation.current.errorType)
      setZone(lastCalculation.current.zone)
      setMatchingZones(lastCalculation.current.matchingZones)
      return
    }
    
    console.log('🚀 Iniciando cálculo de taxa de entrega:', {
      restaurantAddress,
      destinationAddress,
      deliveryZones,
      toleranceKm
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
      const errorMessage = 'Endereços inválidos';
      console.log(`❌ ${errorMessage}:`, { restaurantAddress, destinationAddress })
      setError(errorMessage)
      setErrorType('InvalidParametersError')
      setZone(null)
      setMatchingZones([])
      
      // Atualiza o cache com o resultado
      lastCalculation.current = {
        ...lastCalculation.current,
        address: destinationAddress,
        toleranceKm,
        fee: null,
        estimatedTime: null,
        isDeliverable: false,
        error: errorMessage,
        errorType: 'InvalidParametersError',
        zone: null,
        matchingZones: [],
        inProgress: false
      }
      
      return
    }

    setIsLoading(true)
    setError(null)
    setErrorType(null)

    try {
      // Formata o endereço do restaurante se for um objeto
      const formattedRestaurantAddress = typeof restaurantAddress === 'string'
        ? restaurantAddress
        : `${restaurantAddress.street}, ${restaurantAddress.number} - ${restaurantAddress.neighborhood}, ${restaurantAddress.city} - ${restaurantAddress.state}, ${restaurantAddress.zipCode}`

      console.log('📍 Endereços formatados:', {
        restaurante: formattedRestaurantAddress,
        destino: destinationAddress
      })

      // Obter distância usando a API centralizada
      const response = await fetch(
        `/api/calculate-distance?origin=${encodeURIComponent(formattedRestaurantAddress)}&destination=${encodeURIComponent(destinationAddress)}`
      )
      const data = await response.json()

      console.log('📊 Resposta da API de distância:', data)

      if (!response.ok) {
        // Extrai o tipo de erro da resposta, se disponível
        const errorType = data.errorType || 'UnknownError';
        throw new Error(data.error || 'Erro ao calcular distância', { cause: errorType });
      }

      const distanceInKm = data.distance

      console.log('📏 Distância calculada:', distanceInKm, 'km')

      // Encontrar zona de entrega correspondente usando o serviço de zonas
      console.log('🔍 Procurando zona de entrega para distância:', distanceInKm, 'km')
      
      // Filtra apenas zonas ativas
      const activeZones = deliveryZones.filter(zone => zone.active);
      
      // Encontra todas as zonas que atendem à distância com tolerância
      const matchingZonesResult = findMatchingZones(distanceInKm, activeZones, toleranceKm);

      console.log('🎯 Zonas correspondentes encontradas:', matchingZonesResult.length ? matchingZonesResult : 'Nenhuma');

      // Encontra a melhor zona
      const bestZone = findBestZone(distanceInKm, activeZones, toleranceKm);

      if (!bestZone) {
        const errorMessage = `Endereço fora da área de entrega (${distanceInKm.toFixed(2)} km)`;
        console.log(`⚠️ ${errorMessage}`)
        setFee(null)
        setEstimatedTime(null)
        setIsDeliverable(false)
        setError(errorMessage)
        setErrorType('OutOfDeliveryAreaError')
        setZone(null)
        setMatchingZones(matchingZonesResult)
        
        // Atualiza o cache com o resultado
        lastCalculation.current = {
          address: destinationAddress,
          toleranceKm,
          fee: null,
          estimatedTime: null,
          isDeliverable: false,
          error: errorMessage,
          errorType: 'OutOfDeliveryAreaError',
          zone: null,
          matchingZones: matchingZonesResult,
          inProgress: false
        }
        
        setIsLoading(false)
        return
      }

      console.log('✅ Taxa de entrega calculada:', {
        taxa: bestZone.fee,
        tempoEstimado: bestZone.estimatedTime,
        zona: bestZone.id
      })

      setFee(bestZone.fee)
      setEstimatedTime(bestZone.estimatedTime)
      setIsDeliverable(true)
      setError(null)
      setErrorType(null)
      setZone(bestZone)
      setMatchingZones(matchingZonesResult)
      
      // Atualiza o cache com o resultado
      lastCalculation.current = {
        address: destinationAddress,
        toleranceKm,
        fee: bestZone.fee,
        estimatedTime: bestZone.estimatedTime,
        isDeliverable: true,
        error: null,
        errorType: null,
        zone: bestZone,
        matchingZones: matchingZonesResult,
        inProgress: false
      }
    } catch (error) {
      console.error('❌ Erro ao calcular taxa de entrega:', error)
      
      let errorMessage = 'Erro ao calcular taxa de entrega';
      let errorTypeName = 'UnknownError';
      
      // Tenta extrair o tipo de erro da causa, se disponível
      if (error instanceof Error && error.cause) {
        errorTypeName = error.cause.toString();
      }
      
      // Mensagens de erro mais específicas baseadas no tipo
      if (errorTypeName === 'AddressNotFoundError') {
        errorMessage = `Endereço não encontrado: ${destinationAddress}`;
      } else if (errorTypeName === 'DistanceCalculationError') {
        errorMessage = `Não foi possível calcular a distância para: ${destinationAddress}`;
      } else if (errorTypeName === 'GoogleApiError') {
        errorMessage = 'Erro no serviço de mapas. Tente novamente mais tarde.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setFee(null)
      setEstimatedTime(null)
      setIsDeliverable(false)
      setError(errorMessage)
      setErrorType(errorTypeName)
      setZone(null)
      setMatchingZones([])
      
      // Atualiza o cache com o resultado
      lastCalculation.current = {
        address: destinationAddress,
        toleranceKm,
        fee: null,
        estimatedTime: null,
        isDeliverable: false,
        error: errorMessage,
        errorType: errorTypeName,
        zone: null,
        matchingZones: [],
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
    errorType,
    estimatedTime,
    isDeliverable,
    zone,
    matchingZones,
    calculateFee
  }
} 