/**
 * Serviço para gerenciar zonas de entrega
 * Fornece funções para encontrar zonas de entrega com base na distância
 * e implementa tolerância em limites de zonas
 */

import { DeliveryZone } from '@/types/delivery'

// Configuração padrão de tolerância
export const DEFAULT_TOLERANCE_KM = 0.2 // 200 metros de tolerância

/**
 * Verifica se uma distância está dentro de uma zona, considerando a tolerância
 * @param distance Distância em quilômetros
 * @param zone Zona de entrega
 * @param toleranceKm Tolerância em quilômetros (opcional)
 * @returns Objeto com o resultado da verificação
 */
export function isInZone(
  distance: number,
  zone: DeliveryZone,
  toleranceKm: number = DEFAULT_TOLERANCE_KM
): {
  isInZone: boolean;
  isExactlyInZone: boolean;
  isInZoneWithTolerance: boolean;
  isOnBoundary: boolean;
} {
  // Verifica se a zona está ativa
  if (!zone.active) {
    return {
      isInZone: false,
      isExactlyInZone: false,
      isInZoneWithTolerance: false,
      isOnBoundary: false
    }
  }

  // Caso 1: Dentro da zona normalmente (sem tolerância)
  const isExactlyInZone = distance >= zone.minDistance && distance <= zone.maxDistance

  // Caso 2: Dentro da zona com tolerância
  const isInZoneWithTolerance = 
    distance >= (zone.minDistance - toleranceKm) && 
    distance <= (zone.maxDistance + toleranceKm)

  // Caso 3: Exatamente na fronteira entre zonas
  const isOnBoundary = 
    Math.abs(distance - zone.minDistance) < 0.05 || 
    Math.abs(distance - zone.maxDistance) < 0.05

  // Resultado final: está na zona se qualquer um dos casos for verdadeiro
  const isInZone = isExactlyInZone || isInZoneWithTolerance || isOnBoundary

  return {
    isInZone,
    isExactlyInZone,
    isInZoneWithTolerance,
    isOnBoundary
  }
}

/**
 * Encontra todas as zonas que atendem a uma distância, considerando a tolerância
 * @param distance Distância em quilômetros
 * @param zones Lista de zonas de entrega
 * @param toleranceKm Tolerância em quilômetros (opcional)
 * @returns Lista de zonas que atendem à distância, com detalhes
 */
export function findMatchingZones(
  distance: number,
  zones: DeliveryZone[],
  toleranceKm: number = DEFAULT_TOLERANCE_KM
): Array<{
  zone: DeliveryZone;
  isExactlyInZone: boolean;
  isInZoneWithTolerance: boolean;
  isOnBoundary: boolean;
}> {
  // Filtra apenas zonas ativas
  const activeZones = zones.filter(zone => zone.active)

  // Verifica cada zona
  return activeZones
    .map(zone => {
      const result = isInZone(distance, zone, toleranceKm)
      return {
        zone,
        isExactlyInZone: result.isExactlyInZone,
        isInZoneWithTolerance: result.isInZoneWithTolerance,
        isOnBoundary: result.isOnBoundary
      }
    })
    .filter(result => result.isExactlyInZone || result.isInZoneWithTolerance || result.isOnBoundary)
}

/**
 * Encontra a melhor zona para uma distância, considerando a tolerância
 * @param distance Distância em quilômetros
 * @param zones Lista de zonas de entrega
 * @param toleranceKm Tolerância em quilômetros (opcional)
 * @returns A melhor zona ou null se nenhuma zona for encontrada
 */
export function findBestZone(
  distance: number,
  zones: DeliveryZone[],
  toleranceKm: number = DEFAULT_TOLERANCE_KM
): DeliveryZone | null {
  // Encontra todas as zonas que atendem à distância
  const matchingZones = findMatchingZones(distance, zones, toleranceKm)

  if (matchingZones.length === 0) {
    return null
  }

  // Prioridade de seleção:
  // 1. Zonas que atendem exatamente (sem tolerância)
  // 2. Zonas que estão na fronteira
  // 3. Zonas que atendem com tolerância

  // Primeiro, tenta encontrar zonas que atendem exatamente
  const exactMatches = matchingZones.filter(match => match.isExactlyInZone)
  if (exactMatches.length > 0) {
    // Se houver múltiplas zonas exatas, seleciona a com menor taxa
    return exactMatches.sort((a, b) => a.zone.fee - b.zone.fee)[0].zone
  }

  // Em seguida, tenta encontrar zonas que estão na fronteira
  const boundaryMatches = matchingZones.filter(match => match.isOnBoundary)
  if (boundaryMatches.length > 0) {
    // Se houver múltiplas zonas na fronteira, seleciona a com menor taxa
    return boundaryMatches.sort((a, b) => a.zone.fee - b.zone.fee)[0].zone
  }

  // Por fim, usa zonas que atendem com tolerância
  const toleranceMatches = matchingZones.filter(match => match.isInZoneWithTolerance)
  if (toleranceMatches.length > 0) {
    // Se houver múltiplas zonas com tolerância, seleciona a com menor taxa
    return toleranceMatches.sort((a, b) => a.zone.fee - b.zone.fee)[0].zone
  }

  // Não deveria chegar aqui, mas por segurança, retorna a primeira zona
  return matchingZones[0].zone
}

/**
 * Calcula a taxa de entrega com base na distância e nas zonas disponíveis
 * @param distance Distância em quilômetros
 * @param zones Lista de zonas de entrega
 * @param toleranceKm Tolerância em quilômetros (opcional)
 * @returns Objeto com informações sobre a entrega
 */
export function calculateDeliveryFeeByDistance(
  distance: number,
  zones: DeliveryZone[],
  toleranceKm: number = DEFAULT_TOLERANCE_KM
): {
  isDeliverable: boolean;
  fee: number;
  estimatedTime: string;
  zone: DeliveryZone | null;
  matchingZones: Array<{
    zone: DeliveryZone;
    isExactlyInZone: boolean;
    isInZoneWithTolerance: boolean;
    isOnBoundary: boolean;
  }>;
} {
  // Encontra todas as zonas que atendem à distância
  const matchingZones = findMatchingZones(distance, zones, toleranceKm)

  // Encontra a melhor zona
  const bestZone = findBestZone(distance, zones, toleranceKm)

  if (!bestZone) {
    return {
      isDeliverable: false,
      fee: 0,
      estimatedTime: '',
      zone: null,
      matchingZones
    }
  }

  return {
    isDeliverable: true,
    fee: bestZone.fee,
    estimatedTime: bestZone.estimatedTime,
    zone: bestZone,
    matchingZones
  }
} 