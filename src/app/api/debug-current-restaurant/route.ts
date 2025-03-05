import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('API debug-current-restaurant: Iniciando verificação do restaurante atual')
  
  try {
    // Obter o ID do restaurante da query string
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    
    console.log('API debug-current-restaurant: Parâmetros recebidos:', { restaurantId })
    
    // Criar cliente Supabase
    const supabase = createRouteHandlerClient({ cookies })
    console.log('API debug-current-restaurant: Cliente Supabase criado')
    
    // Buscar configurações do restaurante
    let query = supabase.from('restaurant_settings').select('*')
    
    // Se um ID específico foi fornecido, filtrar por ele
    if (restaurantId) {
      query = query.eq('user_id', restaurantId)
    } else {
      // Se não foi fornecido ID, retorna erro
      return NextResponse.json(
        { error: 'ID do restaurante é obrigatório' },
        { status: 400 }
      )
    }
    
    const { data, error } = await query.single()
    
    if (error) {
      console.error('API debug-current-restaurant: Erro ao buscar configurações:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar configurações do restaurante', details: error.message },
        { status: 500 }
      )
    }
    
    console.log('API debug-current-restaurant: Configurações encontradas')
    
    // Formatar os dados para facilitar a visualização
    const formattedData = {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      slug: data.slug,
      address: data.address,
      delivery_info: {
        ...data.delivery_info,
        zones: data.delivery_info?.zones?.map(zone => ({
          ...zone,
          active: zone.active ? 'SIM' : 'NÃO',
          minDistance: `${zone.minDistance} km`,
          maxDistance: `${zone.maxDistance} km`,
          fee: `R$ ${zone.fee}`
        }))
      }
    }
    
    return NextResponse.json({ restaurant: formattedData })
  } catch (error) {
    console.error('API debug-current-restaurant: Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
} 