/**
 * Utilitário para carregar dados mock de forma segura
 * usando verificação de ambiente para garantir que mocks
 * não sejam usados em produção
 */

import { Restaurant, Category, Product } from '@/types/restaurant';
import { isDevelopment } from '@/lib/utils/env';

// Função segura para carregar o mock do restaurante
export function getRestaurantMock(): Restaurant | null {
  if (isDevelopment()) {
    // Importação dinâmica apenas em ambiente de desenvolvimento
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { restaurantMock } = require('@/__mocks__/restaurant');
    return restaurantMock;
  }
  
  console.warn('Tentativa de carregar dados mock em ambiente de produção.');
  return null;
}

// Função segura para carregar as categorias mock
export function getCategoriesMock(): Category[] | null {
  if (isDevelopment()) {
    // Importação dinâmica apenas em ambiente de desenvolvimento
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { categoriesMock } = require('@/__mocks__/restaurant');
    return categoriesMock;
  }
  
  console.warn('Tentativa de carregar dados mock em ambiente de produção.');
  return null;
}

// Função segura para carregar os produtos mock
export function getProductsMock(): Product[] | null {
  if (isDevelopment()) {
    // Importação dinâmica apenas em ambiente de desenvolvimento
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { productsMock } = require('@/__mocks__/restaurant');
    return productsMock;
  }
  
  console.warn('Tentativa de carregar dados mock em ambiente de produção.');
  return null;
}

// Função que retorna dados reais ou mock conforme o ambiente
export async function getSafeData<T>(
  fetchRealData: () => Promise<T>,
  getMockData: () => T | null,
  fallbackData: T
): Promise<T> {
  try {
    // Tenta buscar dados reais primeiro
    return await fetchRealData();
  } catch (error) {
    console.error('Erro ao buscar dados reais:', error);
    
    // Se estiver em desenvolvimento, usa mock
    const mockData = getMockData();
    if (mockData) {
      console.info('Usando dados mock em ambiente de desenvolvimento');
      return mockData;
    }
    
    // Fallback final
    console.warn('Usando dados fallback');
    return fallbackData;
  }
} 