'use client'

import { useState, useEffect } from 'react'
import { DeliveryZone } from '@/types/delivery'
import { DeliveryZoneVisualizer } from '@/components/delivery-zone-visualizer'
import { findMatchingZones, findBestZone, DEFAULT_TOLERANCE_KM } from '@/services/zoneService'

export default function DebugZonesPage() {
  const [distance, setDistance] = useState<number>(2)
  const [tolerance, setTolerance] = useState<number>(DEFAULT_TOLERANCE_KM)
  const [zones, setZones] = useState<DeliveryZone[]>([
    {
      id: "zona1",
      fee: 0,
      active: true,
      maxDistance: 2,
      minDistance: 0,
      estimatedTime: "30-40 min"
    },
    {
      id: "zona2",
      fee: 7,
      active: true,
      maxDistance: 5,
      minDistance: 2,
      estimatedTime: "40-50 min"
    },
    {
      id: "zona3",
      fee: 10,
      active: true,
      maxDistance: 10,
      minDistance: 5,
      estimatedTime: "50-60 min"
    }
  ])
  
  const [matchingZones, setMatchingZones] = useState<Array<{
    zone: DeliveryZone
    isExactlyInZone: boolean
    isInZoneWithTolerance: boolean
    isOnBoundary: boolean
  }>>([])
  
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null)
  
  // Atualiza as zonas correspondentes e a zona selecionada quando a distância ou tolerância mudam
  useEffect(() => {
    const newMatchingZones = findMatchingZones(distance, zones, tolerance)
    setMatchingZones(newMatchingZones)
    
    const newSelectedZone = findBestZone(distance, zones, tolerance)
    setSelectedZone(newSelectedZone)
  }, [distance, tolerance, zones])
  
  // Função para adicionar uma nova zona
  const handleAddZone = () => {
    const lastZone = zones[zones.length - 1]
    const newZone: DeliveryZone = {
      id: `zona${zones.length + 1}`,
      fee: lastZone.fee + 5,
      active: true,
      maxDistance: lastZone.maxDistance + 5,
      minDistance: lastZone.maxDistance,
      estimatedTime: "60-70 min"
    }
    
    setZones([...zones, newZone])
  }
  
  // Função para remover uma zona
  const handleRemoveZone = (id: string) => {
    setZones(zones.filter(zone => zone.id !== id))
  }
  
  // Função para atualizar uma zona
  const handleUpdateZone = (id: string, field: keyof DeliveryZone, value: any) => {
    setZones(zones.map(zone => {
      if (zone.id === id) {
        return { ...zone, [field]: value }
      }
      return zone
    }))
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Debug de Zonas de Entrega</h1>
      
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Configurações</h2>
          
          <div className="mb-4">
            <label htmlFor="distance" className="mb-1 block text-sm font-medium text-gray-700">
              Distância: {distance.toFixed(1)} km
            </label>
            <input
              type="range"
              id="distance"
              min="0"
              max="15"
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(parseFloat(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>0 km</span>
              <span>7.5 km</span>
              <span>15 km</span>
            </div>
          </div>
          
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
              onChange={(e) => setTolerance(parseFloat(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>0 km</span>
              <span>0.5 km</span>
              <span>1 km</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Resultado</h2>
          
          <div className="mb-2 rounded-md bg-gray-50 p-3">
            <p className="text-sm">
              <strong>Distância:</strong> {distance.toFixed(1)} km
            </p>
            <p className="text-sm">
              <strong>Tolerância:</strong> {tolerance.toFixed(1)} km
            </p>
            <p className="text-sm">
              <strong>Zonas correspondentes:</strong> {matchingZones.length}
            </p>
            <p className="text-sm">
              <strong>Zona selecionada:</strong>{' '}
              {selectedZone ? (
                <span className="rounded-md bg-green-100 px-2 py-1 text-green-800">
                  {selectedZone.minDistance}-{selectedZone.maxDistance} km (R${selectedZone.fee})
                </span>
              ) : (
                <span className="rounded-md bg-red-100 px-2 py-1 text-red-800">
                  Nenhuma
                </span>
              )}
            </p>
          </div>
          
          {matchingZones.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium">Zonas correspondentes:</h3>
              <div className="space-y-2">
                {matchingZones.map(match => (
                  <div
                    key={match.zone.id}
                    className={`rounded-md p-2 text-sm ${
                      match.zone.id === selectedZone?.id
                        ? 'bg-green-100 text-green-800'
                        : match.isExactlyInZone
                        ? 'bg-blue-100 text-blue-800'
                        : match.isOnBoundary
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    <p>
                      <strong>Zona:</strong> {match.zone.minDistance}-{match.zone.maxDistance} km (R${match.zone.fee})
                    </p>
                    <p>
                      <strong>Exatamente na zona:</strong> {match.isExactlyInZone ? 'Sim' : 'Não'}
                    </p>
                    <p>
                      <strong>Na fronteira:</strong> {match.isOnBoundary ? 'Sim' : 'Não'}
                    </p>
                    <p>
                      <strong>Com tolerância:</strong> {match.isInZoneWithTolerance ? 'Sim' : 'Não'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <DeliveryZoneVisualizer
        zones={zones}
        distance={distance}
        selectedZone={selectedZone}
        matchingZones={matchingZones}
        toleranceKm={tolerance}
        onToleranceChange={setTolerance}
      />
      
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Zonas de Entrega</h2>
          <button
            onClick={handleAddZone}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Adicionar Zona
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Distância Mín (km)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Distância Máx (km)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Taxa (R$)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tempo Estimado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ativa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {zones.map(zone => (
                <tr key={zone.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {zone.id}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={zone.minDistance}
                      onChange={(e) => handleUpdateZone(zone.id, 'minDistance', parseFloat(e.target.value))}
                      className="w-20 rounded-md border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <input
                      type="number"
                      min={zone.minDistance}
                      step="0.1"
                      value={zone.maxDistance}
                      onChange={(e) => handleUpdateZone(zone.id, 'maxDistance', parseFloat(e.target.value))}
                      className="w-20 rounded-md border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={zone.fee}
                      onChange={(e) => handleUpdateZone(zone.id, 'fee', parseFloat(e.target.value))}
                      className="w-20 rounded-md border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <input
                      type="text"
                      value={zone.estimatedTime}
                      onChange={(e) => handleUpdateZone(zone.id, 'estimatedTime', e.target.value)}
                      className="w-32 rounded-md border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <input
                      type="checkbox"
                      checked={zone.active}
                      onChange={(e) => handleUpdateZone(zone.id, 'active', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <button
                      onClick={() => handleRemoveZone(zone.id)}
                      className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 