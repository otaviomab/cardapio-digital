/**
 * Serviço para cálculos de distância com diferentes algoritmos
 * Fornece funções para calcular distâncias entre coordenadas geográficas
 * usando diferentes métodos, desde aproximações simples até cálculos precisos
 */

import { Coordinates } from './cacheService';

// Raio médio da Terra em quilômetros
const EARTH_RADIUS_KM = 6371;

/**
 * Converte graus para radianos
 * @param degrees Ângulo em graus
 * @returns Ângulo em radianos
 */
function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 * Esta fórmula considera a curvatura da Terra e é precisa para distâncias curtas e médias
 * @param lat1 Latitude do ponto 1 (em graus)
 * @param lon1 Longitude do ponto 1 (em graus)
 * @param lat2 Latitude do ponto 2 (em graus)
 * @param lon2 Longitude do ponto 2 (em graus)
 * @returns Distância em quilômetros
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Converte coordenadas de graus para radianos
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  
  // Fórmula de Haversine
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;
  
  // Arredonda para 2 casas decimais
  return Math.round(distance * 100) / 100;
}

/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 * @param point1 Coordenadas do ponto 1
 * @param point2 Coordenadas do ponto 2
 * @returns Distância em quilômetros
 */
export function calculateHaversineDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  return haversineDistance(
    point1.lat,
    point1.lng,
    point2.lat,
    point2.lng
  );
}

/**
 * Calcula a distância entre dois pontos usando a fórmula de Vincenty
 * Esta fórmula é mais precisa que Haversine, especialmente para distâncias longas,
 * pois considera o formato elipsoidal da Terra
 * @param lat1 Latitude do ponto 1 (em graus)
 * @param lon1 Longitude do ponto 1 (em graus)
 * @param lat2 Latitude do ponto 2 (em graus)
 * @param lon2 Longitude do ponto 2 (em graus)
 * @returns Distância em quilômetros
 */
export function vincentyDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Parâmetros do elipsoide WGS-84
  const a = 6378.137; // Raio equatorial em km
  const b = 6356.752314245; // Raio polar em km
  const f = 1 / 298.257223563; // Achatamento
  
  // Converte para radianos
  const L = degreesToRadians(lon2 - lon1);
  const U1 = Math.atan((1 - f) * Math.tan(degreesToRadians(lat1)));
  const U2 = Math.atan((1 - f) * Math.tan(degreesToRadians(lat2)));
  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);
  
  // Inicializa variáveis para o algoritmo iterativo
  let lambda = L;
  let lambdaP;
  let iterLimit = 100;
  let sinLambda, cosLambda, sinSigma, cosSigma, sigma, sinAlpha, cosSqAlpha, cos2SigmaM;
  
  do {
    sinLambda = Math.sin(lambda);
    cosLambda = Math.cos(lambda);
    sinSigma = Math.sqrt(
      (cosU2 * sinLambda) * (cosU2 * sinLambda) +
      (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda)
    );
    
    if (sinSigma === 0) {
      return 0; // Pontos coincidentes
    }
    
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
    cosSqAlpha = 1 - sinAlpha * sinAlpha;
    
    cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
    
    if (isNaN(cos2SigmaM)) {
      cos2SigmaM = 0; // Linha equatorial
    }
    
    const C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    lambdaP = lambda;
    lambda = L + (1 - C) * f * sinAlpha * (
      sigma + C * sinSigma * (
        cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)
      )
    );
  } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);
  
  if (iterLimit === 0) {
    return NaN; // Falha na convergência
  }
  
  const uSq = cosSqAlpha * (a * a - b * b) / (b * b);
  const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  
  const deltaSigma = B * sinSigma * (
    cos2SigmaM + B / 4 * (
      cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
      B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)
    )
  );
  
  const distance = b * A * (sigma - deltaSigma);
  
  // Arredonda para 2 casas decimais
  return Math.round(distance * 100) / 100;
}

/**
 * Calcula a distância entre dois pontos usando a fórmula de Vincenty
 * @param point1 Coordenadas do ponto 1
 * @param point2 Coordenadas do ponto 2
 * @returns Distância em quilômetros
 */
export function calculateVincentyDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  return vincentyDistance(
    point1.lat,
    point1.lng,
    point2.lat,
    point2.lng
  );
}

/**
 * Calcula a distância aproximada entre dois pontos usando a fórmula de Pythagoras
 * Esta é uma aproximação rápida e menos precisa, adequada apenas para distâncias curtas
 * @param lat1 Latitude do ponto 1 (em graus)
 * @param lon1 Longitude do ponto 1 (em graus)
 * @param lat2 Latitude do ponto 2 (em graus)
 * @param lon2 Longitude do ponto 2 (em graus)
 * @returns Distância aproximada em quilômetros
 */
export function approximateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Converte coordenadas para radianos
  const lat1Rad = degreesToRadians(lat1);
  const lon1Rad = degreesToRadians(lon1);
  const lat2Rad = degreesToRadians(lat2);
  const lon2Rad = degreesToRadians(lon2);
  
  // Calcula a diferença de coordenadas
  const x = (lon2Rad - lon1Rad) * Math.cos((lat1Rad + lat2Rad) / 2);
  const y = lat2Rad - lat1Rad;
  
  // Calcula a distância
  const distance = Math.sqrt(x * x + y * y) * EARTH_RADIUS_KM;
  
  // Arredonda para 2 casas decimais
  return Math.round(distance * 100) / 100;
}

/**
 * Calcula a distância aproximada entre dois pontos
 * @param point1 Coordenadas do ponto 1
 * @param point2 Coordenadas do ponto 2
 * @returns Distância aproximada em quilômetros
 */
export function calculateApproximateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  return approximateDistance(
    point1.lat,
    point1.lng,
    point2.lat,
    point2.lng
  );
}

/**
 * Verifica se um ponto está dentro de um raio de distância de outro ponto
 * Usa a fórmula de Haversine para o cálculo
 * @param center Coordenadas do ponto central
 * @param point Coordenadas do ponto a verificar
 * @param radiusKm Raio em quilômetros
 * @returns true se o ponto estiver dentro do raio, false caso contrário
 */
export function isPointWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusKm: number
): boolean {
  const distance = calculateHaversineDistance(center, point);
  return distance <= radiusKm;
}

/**
 * Calcula a distância entre dois pontos usando o algoritmo mais adequado
 * Para distâncias curtas (< 10km), usa a aproximação rápida
 * Para distâncias médias (< 100km), usa Haversine
 * Para distâncias longas, usa Vincenty
 * @param point1 Coordenadas do ponto 1
 * @param point2 Coordenadas do ponto 2
 * @returns Distância em quilômetros
 */
export function calculateOptimalDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  // Primeiro, faz uma estimativa rápida
  const approxDistance = calculateApproximateDistance(point1, point2);
  
  // Com base na estimativa, escolhe o algoritmo mais adequado
  if (approxDistance < 10) {
    // Para distâncias curtas, a aproximação já é suficiente
    return approxDistance;
  } else if (approxDistance < 100) {
    // Para distâncias médias, usa Haversine
    return calculateHaversineDistance(point1, point2);
  } else {
    // Para distâncias longas, usa Vincenty
    return calculateVincentyDistance(point1, point2);
  }
} 