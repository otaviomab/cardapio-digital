'use client'

import { useState, useEffect } from 'react'
import { DeliveryZone } from '@/types/delivery'
import { DEFAULT_TOLERANCE_KM } from '@/services/zoneService'

interface DeliveryZoneVisualizerProps {
  zones: DeliveryZone[]
  distance?: number
  selectedZone?: DeliveryZone | null
  matchingZones?: Array<{
    zone: DeliveryZone
    isExactlyInZone?: boolean
    isInZoneWithTolerance?: boolean
    isOnBoundary?: boolean
  }>
  toleranceKm?: number
  onToleranceChange?: (tolerance: number) => void
}

export function DeliveryZoneVisualizer({
  zones,
  distance,
  selectedZone,
  matchingZones = [],
  toleranceKm = DEFAULT_TOLERANCE_KM,
  onToleranceChange
}: DeliveryZoneVisualizerProps) {
  const [tolerance, setTolerance] = useState(toleranceKm)
  
  // Atualiza a tolerância quando a prop muda
  useEffect(() => {
    setTolerance(toleranceKm)
  }, [toleranceKm])
  
  // Calcula o valor máximo para o eixo X (distância)
  const maxDistance = Math.max(
    ...zones.map(zone => zone.maxDistance),
    distance ? distance + 2 : 0
  )
  
  // Função para converter distância em pixels
  const distanceToPixels = (dist: number) => {
    return (dist / maxDistance) * 100
  }
  
  // Função para lidar com a mudança de tolerância
  const handleToleranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTolerance = parseFloat(e.target.value)
    setTolerance(newTolerance)
    
    if (onToleranceChange) {
      onToleranceChange(newTolerance)
    }
  }
  
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-medium text-gray-900">Visualização de Zonas de Entrega</h3>
      
      {/* Controle de tolerância */}
      <div className="mb-4">
        <label htmlFor="tolerance" className="mb-1 block text-sm font-medium text-gray-700">
          Tolerância: {tolerance.toFixed(1)} km
        </label>
        <input
          type="range"
          id="tolerance"
          min="0"
          max="1"
          step="0.1"
          value={tolerance}
          onChange={handleToleranceChange}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>0 km</span>
          <span>0.5 km</span>
          <span>1 km</span>
        </div>
      </div>
      
      {/* Visualização das zonas */}
      <div className="relative h-20 w-full overflow-hidden rounded-lg bg-gray-100">
        {/* Eixo X (distância) */}
        <div className="absolute bottom-0 left-0 h-6 w-full border-t border-gray-300">
          {/* Marcadores de distância */}
          {Array.from({ length: Math.ceil(maxDistance) + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 h-2 w-px bg-gray-400"
              style={{ left: `${distanceToPixels(i)}%` }}
            >
              <span className="absolute -left-2 top-2 text-xs text-gray-500">{i}</span>
            </div>
          ))}
        </div>
        
        {/* Zonas de entrega */}
        {zones
          .filter(zone => zone.active)
          .map(zone => {
            // Verifica se esta zona é a selecionada
            const isSelected = selectedZone?.id === zone.id
            
            // Verifica se esta zona está entre as correspondentes
            const matchingZone = matchingZones.find(match => match.zone.id === zone.id)
            
            // Determina a classe de cor com base no status da zona
            let colorClass = 'bg-gray-200'
            
            if (isSelected) {
              colorClass = 'bg-green-500'
            } else if (matchingZone) {
              if (matchingZone.isExactlyInZone) {
                colorClass = 'bg-blue-500'
              } else if (matchingZone.isOnBoundary) {
                colorClass = 'bg-yellow-500'
              } else if (matchingZone.isInZoneWithTolerance) {
                colorClass = 'bg-orange-500'
              }
            }
            
            return (
              <div
                key={zone.id}
                className={`absolute h-10 rounded-md ${colorClass} opacity-70 hover:opacity-100`}
                style={{
                  left: `${distanceToPixels(zone.minDistance)}%`,
                  width: `${distanceToPixels(zone.maxDistance - zone.minDistance)}%`,
                  top: '4px'
                }}
                title={`Zona: ${zone.minDistance}-${zone.maxDistance} km, Taxa: R$${zone.fee}`}
              >
                <span className="absolute left-1 top-1 text-xs font-bold text-white">
                  {zone.fee > 0 ? `R$${zone.fee}` : 'Grátis'}
                </span>
                <span className="absolute bottom-1 right-1 text-xs text-white">
                  {zone.minDistance}-{zone.maxDistance} km
                </span>
              </div>
            )
          })}
        
        {/* Tolerância */}
        {zones
          .filter(zone => zone.active)
          .map(zone => (
            <div key={`tolerance-${zone.id}`}>
              {/* Tolerância à esquerda */}
              <div
                className="absolute h-10 rounded-l-md bg-gray-400 opacity-20"
                style={{
                  left: `${distanceToPixels(Math.max(0, zone.minDistance - tolerance))}%`,
                  width: `${distanceToPixels(Math.min(tolerance, zone.minDistance))}%`,
                  top: '4px'
                }}
              />
              
              {/* Tolerância à direita */}
              <div
                className="absolute h-10 rounded-r-md bg-gray-400 opacity-20"
                style={{
                  left: `${distanceToPixels(zone.maxDistance)}%`,
                  width: `${distanceToPixels(tolerance)}%`,
                  top: '4px'
                }}
              />
            </div>
          ))}
        
        {/* Marcador de distância atual */}
        {distance !== undefined && (
          <div
            className="absolute h-16 w-px bg-red-500"
            style={{ left: `${distanceToPixels(distance)}%`, top: '0' }}
          >
            <div className="absolute -left-2 -top-5 rounded-md bg-red-500 px-1 py-0.5 text-xs text-white">
              {distance.toFixed(1)} km
            </div>
          </div>
        )}
      </div>
      
      {/* Legenda */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="flex items-center">
          <div className="mr-1 h-3 w-3 rounded-sm bg-blue-500" />
          <span>Exatamente na zona</span>
        </div>
        <div className="flex items-center">
          <div className="mr-1 h-3 w-3 rounded-sm bg-yellow-500" />
          <span>Na fronteira</span>
        </div>
        <div className="flex items-center">
          <div className="mr-1 h-3 w-3 rounded-sm bg-orange-500" />
          <span>Com tolerância</span>
        </div>
        <div className="flex items-center">
          <div className="mr-1 h-3 w-3 rounded-sm bg-green-500" />
          <span>Zona selecionada</span>
        </div>
      </div>
    </div>
  )
} 