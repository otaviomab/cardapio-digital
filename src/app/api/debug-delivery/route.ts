import { NextResponse } from 'next/server'
import { DeliveryZone } from '@/types/delivery'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const origin = searchParams.get('origin') || 'Rua orlando bortoletti, 54 - Jardim Marisa, Campinas - SP, 13053216'
    const destination = searchParams.get('destination') || '13053143'

    console.log('🔍 API DEBUG-DELIVERY - Solicitação recebida:', {
      origin,
      destination
    })

    // Zonas de entrega de exemplo
    const deliveryZones: DeliveryZone[] = [
      {
        id: 'zona1',
        minDistance: 0,
        maxDistance: 2,
        fee: 0,
        estimatedTime: '30-45 min',
        active: true
      },
      {
        id: 'zona2',
        minDistance: 2,
        maxDistance: 20,
        fee: 7,
        estimatedTime: '45-60 min',
        active: true
      }
    ]

    // Obter distância usando a API de cálculo de distância
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/calculate-distance?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
    )
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Erro ao calcular distância' },
        { status: response.status }
      )
    }

    const distanceInKm = data.distance

    // Encontrar zona de entrega correspondente
    const matchingZones = deliveryZones.filter(
      zone => zone.active && distanceInKm >= zone.minDistance && distanceInKm <= zone.maxDistance
    )

    // Se encontrou múltiplas zonas, seleciona a mais favorável (menor taxa)
    let selectedZone = null
    if (matchingZones.length > 0) {
      selectedZone = matchingZones.sort((a, b) => a.fee - b.fee)[0]
    }

    return NextResponse.json({
      origin,
      destination,
      distance: distanceInKm,
      deliveryZones,
      matchingZones,
      selectedZone,
      isDeliverable: !!selectedZone,
      fee: selectedZone ? selectedZone.fee : null,
      estimatedTime: selectedZone ? selectedZone.estimatedTime : null
    })
  } catch (error) {
    console.error('❌ Erro na API de debug de entrega:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de debug' },
      { status: 500 }
    )
  }
} 