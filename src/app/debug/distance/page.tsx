'use client'

import { useState, useEffect } from 'react'
import { Coordinates } from '@/services/cacheService'
import { DISTANCE_CONFIG } from '@/services/distanceService'
import { 
  calculateHaversineDistance, 
  calculateVincentyDistance, 
  calculateApproximateDistance, 
  calculateOptimalDistance 
} from '@/services/distanceCalculationService'

interface DistanceResult {
  algorithm: string
  distance: number
  executionTime: number
}

export default function DebugDistancePage() {
  const [origin, setOrigin] = useState<Coordinates>({ lat: -22.9068, lng: -47.0622 }) // Campinas
  const [destination, setDestination] = useState<Coordinates>({ lat: -23.5505, lng: -46.6333 }) // São Paulo
  const [results, setResults] = useState<DistanceResult[]>([])
  const [googleDistance, setGoogleDistance] = useState<number | null>(null)
  const [googleExecutionTime, setGoogleExecutionTime] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState(DISTANCE_CONFIG)
  
  // Calcula as distâncias usando diferentes algoritmos
  const calculateDistances = () => {
    setIsLoading(true)
    setError(null)
    setResults([])
    setGoogleDistance(null)
    setGoogleExecutionTime(null)
    
    try {
      // Algoritmo aproximado (Pythagoras)
      const startApprox = performance.now()
      const approxDistance = calculateApproximateDistance(origin, destination)
      const endApprox = performance.now()
      
      // Algoritmo de Haversine
      const startHaversine = performance.now()
      const haversineDistance = calculateHaversineDistance(origin, destination)
      const endHaversine = performance.now()
      
      // Algoritmo de Vincenty
      const startVincenty = performance.now()
      const vincentyDistance = calculateVincentyDistance(origin, destination)
      const endVincenty = performance.now()
      
      // Algoritmo ótimo (escolhe o melhor com base na distância)
      const startOptimal = performance.now()
      const optimalDistance = calculateOptimalDistance(origin, destination)
      const endOptimal = performance.now()
      
      // Atualiza os resultados
      setResults([
        {
          algorithm: 'Aproximado (Pythagoras)',
          distance: approxDistance,
          executionTime: endApprox - startApprox
        },
        {
          algorithm: 'Haversine',
          distance: haversineDistance,
          executionTime: endHaversine - startHaversine
        },
        {
          algorithm: 'Vincenty',
          distance: vincentyDistance,
          executionTime: endVincenty - startVincenty
        },
        {
          algorithm: 'Ótimo',
          distance: optimalDistance,
          executionTime: endOptimal - startOptimal
        }
      ])
      
      // Calcula a distância usando a API do Google
      calculateGoogleDistance()
    } catch (error) {
      console.error('Erro ao calcular distâncias:', error)
      setError('Erro ao calcular distâncias')
      setIsLoading(false)
    }
  }
  
  // Calcula a distância usando a API do Google
  const calculateGoogleDistance = async () => {
    try {
      const startGoogle = performance.now()
      
      const response = await fetch(
        `/api/calculate-distance?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`
      )
      
      if (!response.ok) {
        throw new Error('Erro ao calcular distância com a API do Google')
      }
      
      const data = await response.json()
      const endGoogle = performance.now()
      
      setGoogleDistance(data.distance)
      setGoogleExecutionTime(endGoogle - startGoogle)
    } catch (error) {
      console.error('Erro ao calcular distância com a API do Google:', error)
      setError('Erro ao calcular distância com a API do Google')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Atualiza a configuração
  const updateConfig = (key: keyof typeof DISTANCE_CONFIG, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }))
    
    // Atualiza a configuração global
    DISTANCE_CONFIG[key] = value
  }
  
  // Calcula as distâncias quando a página carrega
  useEffect(() => {
    calculateDistances()
  }, [])
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Debug de Algoritmos de Distância</h1>
      
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Coordenadas</h2>
          
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Origem (Latitude, Longitude)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.0001"
                value={origin.lat}
                onChange={(e) => setOrigin(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="Latitude"
              />
              <input
                type="number"
                step="0.0001"
                value={origin.lng}
                onChange={(e) => setOrigin(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="Longitude"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Destino (Latitude, Longitude)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.0001"
                value={destination.lat}
                onChange={(e) => setDestination(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="Latitude"
              />
              <input
                type="number"
                step="0.0001"
                value={destination.lng}
                onChange={(e) => setDestination(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="Longitude"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <button
              onClick={calculateDistances}
              disabled={isLoading}
              className="w-full rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:bg-blue-300"
            >
              {isLoading ? 'Calculando...' : 'Calcular Distâncias'}
            </button>
          </div>
          
          {error && (
            <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Configurações</h2>
          
          <div className="mb-4">
            <label className="mb-1 flex items-center text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={config.useLocalAlgorithms}
                onChange={(e) => updateConfig('useLocalAlgorithms', e.target.checked)}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Usar algoritmos locais
            </label>
            <p className="text-xs text-gray-500">
              Se ativado, usa algoritmos locais para cálculos preliminares
            </p>
          </div>
          
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Distância máxima para confiar apenas em algoritmos locais: {config.maxDistanceForLocalOnly} km
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={config.maxDistanceForLocalOnly}
              onChange={(e) => updateConfig('maxDistanceForLocalOnly', parseInt(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>1 km</span>
              <span>10 km</span>
              <span>20 km</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="mb-1 flex items-center text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={config.useGoogleForConfirmation}
                onChange={(e) => updateConfig('useGoogleForConfirmation', e.target.checked)}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Usar Google para confirmação
            </label>
            <p className="text-xs text-gray-500">
              Se ativado, usa a API do Google para confirmar resultados de algoritmos locais
            </p>
          </div>
          
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tolerância máxima de diferença: {config.maxDifferenceTolerance} km
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={config.maxDifferenceTolerance}
              onChange={(e) => updateConfig('maxDifferenceTolerance', parseFloat(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>0.1 km</span>
              <span>1 km</span>
              <span>2 km</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Resultados</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Algoritmo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Distância (km)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tempo de Execução (ms)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Diferença do Google (km)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {results.map((result) => (
                <tr key={result.algorithm}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {result.algorithm}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {result.distance.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {result.executionTime.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {googleDistance !== null ? (
                      <span className={Math.abs(result.distance - googleDistance) <= config.maxDifferenceTolerance ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(result.distance - googleDistance).toFixed(2)}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              ))}
              {googleDistance !== null && (
                <tr className="bg-blue-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-900">
                    Google Maps API
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-900">
                    {googleDistance.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-900">
                    {googleExecutionTime !== null ? googleExecutionTime.toFixed(2) : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-900">
                    0.00
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {results.length > 0 && googleDistance !== null && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium">Análise de Desempenho</h3>
            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-sm">
                <strong>Algoritmo mais rápido:</strong>{' '}
                {results.sort((a, b) => a.executionTime - b.executionTime)[0].algorithm}{' '}
                ({results.sort((a, b) => a.executionTime - b.executionTime)[0].executionTime.toFixed(2)} ms)
              </p>
              <p className="text-sm">
                <strong>Algoritmo mais preciso:</strong>{' '}
                {results.sort((a, b) => Math.abs(a.distance - googleDistance) - Math.abs(b.distance - googleDistance))[0].algorithm}{' '}
                (diferença de {Math.abs(results.sort((a, b) => Math.abs(a.distance - googleDistance) - Math.abs(b.distance - googleDistance))[0].distance - googleDistance).toFixed(2)} km)
              </p>
              <p className="text-sm">
                <strong>Google Maps API:</strong>{' '}
                {googleExecutionTime !== null ? googleExecutionTime.toFixed(2) : 'N/A'} ms
              </p>
              <p className="text-sm">
                <strong>Economia de tempo:</strong>{' '}
                {googleExecutionTime !== null ? (
                  `${((googleExecutionTime - results.sort((a, b) => a.executionTime - b.executionTime)[0].executionTime) / googleExecutionTime * 100).toFixed(2)}%`
                ) : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 