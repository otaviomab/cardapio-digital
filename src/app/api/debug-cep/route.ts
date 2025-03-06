import { NextResponse } from 'next/server'
import { DeliveryZone } from '@/types/delivery'
import { findMatchingZones, findBestZone, DEFAULT_TOLERANCE_KM } from '@/services/zoneService'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cep = searchParams.get('cep') || '13053143'
    const toleranceParam = searchParams.get('tolerance')
    const toleranceKm = toleranceParam ? parseFloat(toleranceParam) : DEFAULT_TOLERANCE_KM
    
    console.log('🔍 API DEBUG-CEP: Iniciando teste para CEP:', cep, 'com tolerância de', toleranceKm, 'km')
    
    // Endereço do restaurante
    const restaurantAddress = {
      street: 'Rua Orlando Bortoletti',
      number: '54',
      neighborhood: 'Jardim Marisa',
      city: 'Campinas',
      state: 'SP',
      zipCode: '13053216'
    }
    
    // Zonas de entrega do restaurante Pizzaria Localizza
    const deliveryZones: DeliveryZone[] = [
      {
        id: "8c48d12f-57b7-4688-9f72-0c6b7f9aef5a",
        fee: 0,
        active: true,
        maxDistance: 2,
        minDistance: 0,
        estimatedTime: "35-40"
      },
      {
        id: "a3a6203f-5159-4662-9acf-7b7f0b6f6536",
        fee: 7,
        active: true,
        maxDistance: 20,
        minDistance: 2,
        estimatedTime: "35-45"
      }
    ]
    
    // Formata o endereço do restaurante
    const formattedRestaurantAddress = `${restaurantAddress.street}, ${restaurantAddress.number} - ${restaurantAddress.neighborhood}, ${restaurantAddress.city} - ${restaurantAddress.state}, ${restaurantAddress.zipCode}`
    
    // Formata o endereço de destino (apenas o CEP para teste)
    const destinationAddress = cep
    
    console.log('📍 Endereços para teste:', {
      restaurante: formattedRestaurantAddress,
      destino: destinationAddress
    })
    
    // Obter distância usando a API interna
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/calculate-distance?origin=${encodeURIComponent(formattedRestaurantAddress)}&destination=${encodeURIComponent(destinationAddress)}`
    )
    
    const data = await response.json()
    console.log('📊 Resposta da API de distância:', data)
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao calcular distância')
    }
    
    const distanceInKm = data.distance
    console.log('📏 Distância calculada:', distanceInKm, 'km')
    
    // Arredonda a distância para 2 casas decimais
    const roundedDistance = Math.round(distanceInKm * 100) / 100
    console.log('🔢 Distância arredondada:', roundedDistance, 'km')
    
    // Testa com diferentes margens de tolerância
    const toleranceMargins = [0, 0.1, 0.2, 0.3, 0.5, 1.0]
    const results = {}
    
    for (const toleranceMargin of toleranceMargins) {
      console.log(`\n🔍 Testando com margem de tolerância de ${toleranceMargin}km:`)
      
      // Encontra todas as zonas que poderiam atender com a tolerância
      const matchingZonesResult = findMatchingZones(roundedDistance, deliveryZones, toleranceMargin)
      
      console.log('🎯 Zonas correspondentes encontradas:', matchingZonesResult.length ? matchingZonesResult : 'Nenhuma')
      
      // Encontra a melhor zona
      const bestZone = findBestZone(roundedDistance, deliveryZones, toleranceMargin)
      
      if (bestZone) {
        console.log(`✅ Zona selecionada: ID: ${bestZone.id}, MIN: ${bestZone.minDistance}km, MAX: ${bestZone.maxDistance}km, TAXA: R$${bestZone.fee}`)
      } else {
        console.log('❌ Nenhuma zona correspondente encontrada para a distância calculada')
      }
      
      results[`tolerancia_${toleranceMargin}`] = {
        zonaEncontrada: !!bestZone,
        zona: bestZone,
        zonasFiltradas: matchingZonesResult.map(match => ({
          zone: match.zone,
          isExactlyInZone: match.isExactlyInZone,
          isInZoneWithTolerance: match.isInZoneWithTolerance,
          isOnBoundary: match.isOnBoundary
        }))
      }
    }
    
    return NextResponse.json({
      cep,
      distancia: distanceInKm,
      distanciaArredondada: roundedDistance,
      zonas: deliveryZones,
      resultados: results,
      toleranciaPadrao: DEFAULT_TOLERANCE_KM
    })
  } catch (error) {
    console.error('❌ Erro ao testar CEP:', error)
    return NextResponse.json(
      { error: 'Erro ao testar CEP', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
} 