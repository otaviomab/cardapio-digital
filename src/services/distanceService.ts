/**
 * Serviço centralizado para cálculo de distância entre endereços
 * Este serviço encapsula a lógica de comunicação com a API do Google Maps
 * e fornece funções reutilizáveis para todo o sistema
 */

import { 
  InvalidParametersError, 
  DistanceCalculationError, 
  GoogleApiError, 
  AddressNotFoundError 
} from './errors';
import { coordinatesCache, distanceCache, Coordinates } from './cacheService';
import { 
  calculateHaversineDistance, 
  calculateOptimalDistance, 
  isPointWithinRadius 
} from './distanceCalculationService';

// Configuração para uso de algoritmos locais vs. API do Google
export const DISTANCE_CONFIG = {
  // Se true, usa algoritmos locais para cálculos preliminares
  useLocalAlgorithms: true,
  
  // Distância máxima (em km) para confiar apenas em algoritmos locais
  // Para distâncias maiores que isso, a API do Google será usada para confirmação
  maxDistanceForLocalOnly: 5,
  
  // Se true, usa a API do Google para confirmar resultados de algoritmos locais
  useGoogleForConfirmation: true,
  
  // Limite de diferença (em km) entre o cálculo local e o do Google
  // Se a diferença for maior que isso, o resultado do Google será usado
  maxDifferenceTolerance: 0.5
};

/**
 * Calcula a distância entre dois endereços usando a API Distance Matrix do Google
 * @param origin Endereço de origem (pode ser texto completo ou apenas CEP)
 * @param destination Endereço de destino (pode ser texto completo ou apenas CEP)
 * @returns Distância em quilômetros (arredondada para 2 casas decimais)
 */
export async function calculateDistance(
  origin: string,
  destination: string
): Promise<number> {
  try {
    if (!origin || !destination) {
      throw new InvalidParametersError('Origem e destino são obrigatórios');
    }

    // Verifica se a distância já está em cache
    const cachedDistance = distanceCache.get(origin, destination);
    if (cachedDistance !== null) {
      console.log('✅ Usando distância em cache:', cachedDistance, 'km');
      return cachedDistance;
    }

    // Tenta obter coordenadas do cache primeiro
    let originCoords: Coordinates | null = coordinatesCache.get(origin);
    let destinationCoords: Coordinates | null = coordinatesCache.get(destination);

    // Se as coordenadas não estiverem em cache, busca na API
    if (!originCoords) {
      originCoords = await getAddressCoordinates(origin);
      // Armazena no cache para uso futuro
      coordinatesCache.set(origin, originCoords);
    }

    if (!destinationCoords) {
      destinationCoords = await getAddressCoordinates(destination);
      // Armazena no cache para uso futuro
      coordinatesCache.set(destination, destinationCoords);
    }

    // Se configurado para usar algoritmos locais, calcula a distância localmente primeiro
    let distance: number;
    let useGoogleApi = true;

    if (DISTANCE_CONFIG.useLocalAlgorithms) {
      // Calcula a distância usando o algoritmo local mais adequado
      const localDistance = calculateOptimalDistance(originCoords, destinationCoords);
      console.log('📏 Distância calculada localmente:', localDistance, 'km');
      
      // Se a distância for pequena o suficiente, podemos confiar apenas no cálculo local
      if (localDistance <= DISTANCE_CONFIG.maxDistanceForLocalOnly && !DISTANCE_CONFIG.useGoogleForConfirmation) {
        useGoogleApi = false;
        distance = localDistance;
      } else {
        // Caso contrário, usamos o Google para confirmar
        if (DISTANCE_CONFIG.useGoogleForConfirmation) {
          const googleDistance = await calculateDistanceByCoordinatesWithGoogle(originCoords, destinationCoords);
          console.log('📏 Distância calculada pelo Google:', googleDistance, 'km');
          
          // Compara os resultados
          const difference = Math.abs(localDistance - googleDistance);
          console.log('📊 Diferença entre cálculos:', difference, 'km');
          
          if (difference <= DISTANCE_CONFIG.maxDifferenceTolerance) {
            // Se a diferença for aceitável, usa o cálculo local (mais rápido para próximas consultas)
            distance = localDistance;
          } else {
            // Se a diferença for grande, confia no Google
            distance = googleDistance;
          }
        } else {
          // Se não estamos usando o Google para confirmação, usa o cálculo local
          distance = localDistance;
        }
      }
    } else {
      // Se não estamos usando algoritmos locais, usa diretamente a API do Google
      distance = await calculateDistanceByCoordinatesWithGoogle(originCoords, destinationCoords);
    }
    
    // Armazena a distância calculada no cache
    distanceCache.set(origin, destination, distance);
    
    return distance;
  } catch (error) {
    // Se já for um erro específico, propaga
    if (error instanceof InvalidParametersError || 
        error instanceof DistanceCalculationError || 
        error instanceof GoogleApiError ||
        error instanceof AddressNotFoundError) {
      console.error(`❌ ${error.name}:`, error.message);
      throw error;
    }
    
    // Caso contrário, converte para um erro específico
    console.error('❌ Erro ao calcular distância:', error);
    throw new DistanceCalculationError(
      origin, 
      destination, 
      error instanceof Error ? error.message : 'Erro desconhecido'
    );
  }
}

/**
 * Obtém as coordenadas geográficas de um endereço usando a API Geocoding do Google
 * @param address Endereço completo ou CEP
 * @returns Objeto com latitude e longitude
 */
export async function getAddressCoordinates(address: string): Promise<Coordinates> {
  try {
    if (!address) {
      throw new InvalidParametersError('Endereço é obrigatório');
    }

    // Verifica se as coordenadas já estão em cache
    const cachedCoords = coordinatesCache.get(address);
    if (cachedCoords !== null) {
      console.log('✅ Usando coordenadas em cache para:', address);
      return cachedCoords;
    }

    console.log('🌐 Buscando coordenadas na API para:', address);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    // Verifica se a API retornou um status de erro
    if (data.status !== 'OK') {
      if (data.status === 'ZERO_RESULTS') {
        throw new AddressNotFoundError(address);
      } else {
        throw new GoogleApiError(data.status, data.error_message);
      }
    }

    // Verifica se há resultados
    if (!data.results || data.results.length === 0) {
      throw new AddressNotFoundError(address);
    }

    const { lat, lng } = data.results[0].geometry.location;
    const coordinates = { lat, lng };

    // Armazena as coordenadas no cache
    coordinatesCache.set(address, coordinates);

    return coordinates;
  } catch (error) {
    // Se já for um erro específico, propaga
    if (error instanceof InvalidParametersError || 
        error instanceof AddressNotFoundError || 
        error instanceof GoogleApiError) {
      console.error(`❌ ${error.name}:`, error.message);
      throw error;
    }
    
    // Caso contrário, converte para um erro específico
    console.error('❌ Erro ao buscar coordenadas:', error);
    throw new AddressNotFoundError(address);
  }
}

/**
 * Calcula a distância entre dois pontos usando a API do Google
 * @param origin Coordenadas de origem
 * @param destination Coordenadas de destino
 * @returns Distância em quilômetros (arredondada para 2 casas decimais)
 */
export async function calculateDistanceByCoordinatesWithGoogle(
  origin: Coordinates,
  destination: Coordinates
): Promise<number> {
  try {
    if (!origin || !destination || 
        typeof origin.lat !== 'number' || typeof origin.lng !== 'number' ||
        typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
      throw new InvalidParametersError('Coordenadas de origem e destino são obrigatórias e devem ser números');
    }

    // Verifica se a distância já está em cache
    const cachedDistance = distanceCache.get(origin, destination);
    if (cachedDistance !== null) {
      console.log('✅ Usando distância em cache:', cachedDistance, 'km');
      return cachedDistance;
    }

    // Calcula a distância usando a Google Maps Distance Matrix API
    console.log('🌐 Enviando requisição para Google Maps API');
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();
    console.log('📡 Resposta do Google Maps API:', data);

    // Verifica se a API retornou um status de erro
    if (data.status !== 'OK') {
      throw new GoogleApiError(data.status, data.error_message);
    }

    // Verifica se a resposta é válida
    if (!data.rows?.[0]?.elements?.[0]) {
      throw new DistanceCalculationError(
        `${origin.lat},${origin.lng}`, 
        `${destination.lat},${destination.lng}`, 
        'Resposta da API inválida'
      );
    }

    // Verifica se o elemento tem um status de erro
    if (data.rows[0].elements[0].status !== 'OK') {
      throw new GoogleApiError(data.rows[0].elements[0].status);
    }

    // Pega a distância em metros e converte para km
    const distanceInMeters = data.rows[0].elements[0].distance.value;
    const distanceInKm = distanceInMeters / 1000;
    
    // Arredonda para duas casas decimais
    const roundedDistance = Math.round(distanceInKm * 100) / 100;
    
    // Armazena a distância calculada no cache
    distanceCache.set(origin, destination, roundedDistance);
    
    return roundedDistance;
  } catch (error) {
    // Se já for um erro específico, propaga
    if (error instanceof InvalidParametersError || 
        error instanceof DistanceCalculationError || 
        error instanceof GoogleApiError) {
      console.error(`❌ ${error.name}:`, error.message);
      throw error;
    }
    
    // Caso contrário, converte para um erro específico
    console.error('❌ Erro ao calcular distância por coordenadas:', error);
    throw new DistanceCalculationError(
      `${origin.lat},${origin.lng}`, 
      `${destination.lat},${destination.lng}`, 
      error instanceof Error ? error.message : 'Erro desconhecido'
    );
  }
}

/**
 * Calcula a distância entre dois pontos usando coordenadas geográficas
 * Usa algoritmos locais ou a API do Google, dependendo da configuração
 * @param origin Coordenadas de origem
 * @param destination Coordenadas de destino
 * @returns Distância em quilômetros (arredondada para 2 casas decimais)
 */
export async function calculateDistanceByCoordinates(
  origin: Coordinates,
  destination: Coordinates
): Promise<number> {
  try {
    if (!origin || !destination || 
        typeof origin.lat !== 'number' || typeof origin.lng !== 'number' ||
        typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
      throw new InvalidParametersError('Coordenadas de origem e destino são obrigatórias e devem ser números');
    }

    // Verifica se a distância já está em cache
    const cachedDistance = distanceCache.get(origin, destination);
    if (cachedDistance !== null) {
      console.log('✅ Usando distância em cache:', cachedDistance, 'km');
      return cachedDistance;
    }

    // Se configurado para usar algoritmos locais, calcula a distância localmente primeiro
    let distance: number;

    if (DISTANCE_CONFIG.useLocalAlgorithms) {
      // Calcula a distância usando o algoritmo local mais adequado
      const localDistance = calculateOptimalDistance(origin, destination);
      console.log('📏 Distância calculada localmente:', localDistance, 'km');
      
      // Se a distância for pequena o suficiente, podemos confiar apenas no cálculo local
      if (localDistance <= DISTANCE_CONFIG.maxDistanceForLocalOnly && !DISTANCE_CONFIG.useGoogleForConfirmation) {
        distance = localDistance;
      } else {
        // Caso contrário, usamos o Google para confirmar
        if (DISTANCE_CONFIG.useGoogleForConfirmation) {
          try {
            const googleDistance = await calculateDistanceByCoordinatesWithGoogle(origin, destination);
            console.log('📏 Distância calculada pelo Google:', googleDistance, 'km');
            
            // Compara os resultados
            const difference = Math.abs(localDistance - googleDistance);
            console.log('📊 Diferença entre cálculos:', difference, 'km');
            
            if (difference <= DISTANCE_CONFIG.maxDifferenceTolerance) {
              // Se a diferença for aceitável, usa o cálculo local (mais rápido para próximas consultas)
              distance = localDistance;
            } else {
              // Se a diferença for grande, confia no Google
              distance = googleDistance;
            }
          } catch (error) {
            // Se houver erro na API do Google, usa o cálculo local como fallback
            console.warn('⚠️ Erro na API do Google, usando cálculo local como fallback:', error);
            distance = localDistance;
          }
        } else {
          // Se não estamos usando o Google para confirmação, usa o cálculo local
          distance = localDistance;
        }
      }
    } else {
      // Se não estamos usando algoritmos locais, usa diretamente a API do Google
      distance = await calculateDistanceByCoordinatesWithGoogle(origin, destination);
    }
    
    // Armazena a distância calculada no cache
    distanceCache.set(origin, destination, distance);
    
    return distance;
  } catch (error) {
    // Se já for um erro específico, propaga
    if (error instanceof InvalidParametersError || 
        error instanceof DistanceCalculationError || 
        error instanceof GoogleApiError) {
      console.error(`❌ ${error.name}:`, error.message);
      throw error;
    }
    
    // Caso contrário, converte para um erro específico
    console.error('❌ Erro ao calcular distância por coordenadas:', error);
    throw new DistanceCalculationError(
      `${origin.lat},${origin.lng}`, 
      `${destination.lat},${destination.lng}`, 
      error instanceof Error ? error.message : 'Erro desconhecido'
    );
  }
}

/**
 * Verifica rapidamente se um ponto está dentro de um raio de distância de outro ponto
 * Usa algoritmos locais para cálculo rápido, sem precisar da API do Google
 * @param center Coordenadas do ponto central
 * @param point Coordenadas do ponto a verificar
 * @param radiusKm Raio em quilômetros
 * @returns true se o ponto estiver dentro do raio, false caso contrário
 */
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusKm: number
): boolean {
  return isPointWithinRadius(center, point, radiusKm);
} 