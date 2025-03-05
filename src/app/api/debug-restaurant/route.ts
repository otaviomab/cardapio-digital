import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('API debug-restaurant: Iniciando busca de informações do restaurante')
  
  try {
    // Obter o slug do restaurante da query string
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug') || 'pizzaria-localizza'
    
    console.log('API debug-restaurant: Parâmetros recebidos:', { slug })
    
    // Criar cliente Supabase
    const supabase = createRouteHandlerClient({ cookies })
    console.log('API debug-restaurant: Cliente Supabase criado')
    
    // Buscar restaurante pelo slug
    const { data: restaurant, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (error) {
      console.error('API debug-restaurant: Erro ao buscar restaurante:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar restaurante', details: error.message },
        { status: 500 }
      )
    }
    
    if (!restaurant) {
      console.error('API debug-restaurant: Restaurante não encontrado')
      return NextResponse.json(
        { error: 'Restaurante não encontrado' },
        { status: 404 }
      )
    }
    
    console.log('API debug-restaurant: Restaurante encontrado:', restaurant.name)
    
    // Formatar as zonas de entrega para facilitar a visualização
    const formattedZones = restaurant.delivery_info?.zones?.map(zone => ({
      ...zone,
      active: zone.active ? 'SIM' : 'NÃO',
      minDistance: `${zone.minDistance} km`,
      maxDistance: `${zone.maxDistance} km`,
      fee: `R$ ${zone.fee}`
    }))
    
    // Testar o cálculo de distância para o CEP 13053143
    const formattedRestaurantAddress = `${restaurant.address.street}, ${restaurant.address.number} - ${restaurant.address.neighborhood}, ${restaurant.address.city} - ${restaurant.address.state}, ${restaurant.address.zipCode}`
    
    console.log('API debug-restaurant: Testando cálculo de distância para CEP 13053143')
    
    const distanceResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/calculate-distance?origin=${encodeURIComponent(formattedRestaurantAddress)}&destination=13053143`
    )
    
    const distanceData = await distanceResponse.json()
    
    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        address: restaurant.address,
        delivery_info: {
          ...restaurant.delivery_info,
          zones: formattedZones
        }
      },
      distanceTest: {
        cep: '13053143',
        restaurantAddress: formattedRestaurantAddress,
        distance: distanceData.distance,
        isWithinRange: restaurant.delivery_info?.zones?.some(zone => 
          zone.active && 
          distanceData.distance >= zone.minDistance && 
          distanceData.distance <= zone.maxDistance
        )
      }
    })
  } catch (error) {
    console.error('API debug-restaurant: Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
} 