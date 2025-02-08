'use client'

import { useState } from 'react'
import { Trash2, Plus, MapPin } from 'lucide-react'
import { NumericFormat } from 'react-number-format'

interface DeliveryZone {
  id: string
  minDistance: number
  maxDistance: number
  fee: number
  estimatedTime: string
  active: boolean
}

interface DeliveryZonesProps {
  zones: DeliveryZone[]
  onChange: (zones: DeliveryZone[]) => void
}

export function DeliveryZones({ zones, onChange }: DeliveryZonesProps) {
  const handleAddZone = () => {
    const newZone: DeliveryZone = {
      id: crypto.randomUUID(),
      minDistance: 0,
      maxDistance: 0,
      fee: 0,
      estimatedTime: '',
      active: true
    }
    onChange([...zones, newZone])
  }

  const handleRemoveZone = (id: string) => {
    onChange(zones.filter(zone => zone.id !== id))
  }

  const handleZoneChange = (id: string, field: keyof DeliveryZone, value: any) => {
    onChange(zones.map(zone => {
      if (zone.id === id) {
        return { ...zone, [field]: value }
      }
      return zone
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Zonas de Entrega
        </h3>
        <button
          type="button"
          onClick={handleAddZone}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Adicionar Zona
        </button>
      </div>

      <div className="space-y-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">
                  Zona de Entrega
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveZone(zone.id)}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Distância Mínima (km)
                </label>
                <NumericFormat
                  value={zone.minDistance}
                  onValueChange={(values) => {
                    handleZoneChange(zone.id, 'minDistance', values.floatValue || 0)
                  }}
                  decimalScale={1}
                  fixedDecimalScale
                  suffix=" km"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Distância Máxima (km)
                </label>
                <NumericFormat
                  value={zone.maxDistance}
                  onValueChange={(values) => {
                    handleZoneChange(zone.id, 'maxDistance', values.floatValue || 0)
                  }}
                  decimalScale={1}
                  fixedDecimalScale
                  suffix=" km"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Taxa de Entrega
                </label>
                <NumericFormat
                  value={zone.fee}
                  onValueChange={(values) => {
                    handleZoneChange(zone.id, 'fee', values.floatValue || 0)
                  }}
                  decimalScale={2}
                  fixedDecimalScale
                  prefix="R$ "
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tempo Estimado
                </label>
                <input
                  type="text"
                  value={zone.estimatedTime}
                  onChange={(e) => handleZoneChange(zone.id, 'estimatedTime', e.target.value)}
                  placeholder="Ex: 30-45 min"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={zone.active}
                    onChange={(e) => handleZoneChange(zone.id, 'active', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Zona ativa
                  </span>
                </label>
              </div>
            </div>
          </div>
        ))}

        {zones.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
            <MapPin className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-900">
              Nenhuma zona de entrega configurada
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Clique no botão acima para adicionar uma zona
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 