'use client'

import { useState, useEffect } from 'react'
import { coordinatesCache, distanceCache } from '@/services/cacheService'
import { toast } from 'react-hot-toast'

/**
 * Componente para gerenciar o cache de coordenadas e distâncias
 * Permite visualizar o tamanho do cache e limpá-lo quando necessário
 * Este componente só é exibido em ambiente de desenvolvimento
 */
export function CacheManager() {
  const [coordsCacheSize, setCoordsCacheSize] = useState<number>(0)
  const [distanceCacheSize, setDistanceCacheSize] = useState<number>(0)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isDev, setIsDev] = useState<boolean>(false)

  // Verifica se está em ambiente de desenvolvimento
  useEffect(() => {
    // Só executa no cliente
    if (typeof window !== 'undefined') {
      // Verifica se está em ambiente de desenvolvimento
      const isDevEnvironment = 
        process.env.NODE_ENV === 'development' || 
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.href.includes('debug');
      
      setIsDev(isDevEnvironment);
      updateCacheSizes();
    }
  }, []);

  // Atualiza o tamanho do cache
  const updateCacheSizes = () => {
    setCoordsCacheSize(coordinatesCache.size())
    setDistanceCacheSize(distanceCache.size())
  }

  // Limpa o cache de coordenadas
  const clearCoordsCache = () => {
    coordinatesCache.clear()
    updateCacheSizes()
    toast.success('Cache de coordenadas limpo com sucesso')
  }

  // Limpa o cache de distâncias
  const clearDistanceCache = () => {
    distanceCache.clear()
    updateCacheSizes()
    toast.success('Cache de distâncias limpo com sucesso')
  }

  // Limpa todos os caches
  const clearAllCaches = () => {
    coordinatesCache.clear()
    distanceCache.clear()
    updateCacheSizes()
    toast.success('Todos os caches foram limpos com sucesso')
  }

  // Se não estiver em ambiente de desenvolvimento, não renderiza nada
  if (!isDev) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-gray-800 p-3 text-white shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        aria-label="Gerenciar cache"
        title="Gerenciar cache"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg bg-white p-4 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Gerenciador de Cache</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <div className="rounded-md bg-gray-50 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Cache de Coordenadas</p>
              <p className="text-xs text-gray-500">{coordsCacheSize} endereços armazenados</p>
            </div>
            <button
              onClick={clearCoordsCache}
              className="rounded-md bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="rounded-md bg-gray-50 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Cache de Distâncias</p>
              <p className="text-xs text-gray-500">{distanceCacheSize} distâncias armazenadas</p>
            </div>
            <button
              onClick={clearDistanceCache}
              className="rounded-md bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Limpar
            </button>
          </div>
        </div>

        <button
          onClick={clearAllCaches}
          className="w-full rounded-md bg-red-100 py-2 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Limpar Todos os Caches
        </button>

        <div className="rounded-md bg-blue-50 p-3">
          <p className="text-xs text-blue-700">
            O cache ajuda a reduzir o número de requisições à API do Google Maps, economizando custos e melhorando o desempenho.
          </p>
        </div>
      </div>
    </div>
  )
} 