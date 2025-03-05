import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('API debug-delivery-zones: Iniciando busca de zonas de entrega')
  
  try {
    // Obter o ID do restaurante da query string
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    
    console.log('API debug-delivery-zones: Parâmetros recebidos:', { restaurantId })
    
    // Criar cliente Supabase
    const supabase = createRouteHandlerClient({ cookies })
    console.log('API debug-delivery-zones: Cliente Supabase criado')
    
    // Buscar configurações do restaurante
    let query = supabase.from('restaurant_settings').select('*')
    
    // Se um ID específico foi fornecido, filtrar por ele
    if (restaurantId) {
      query = query.eq('user_id', restaurantId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('API debug-delivery-zones: Erro ao buscar configurações:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar configurações do restaurante', details: error.message },
        { status: 500 }
      )
    }
    
    console.log('API debug-delivery-zones: Configurações encontradas:', data?.length || 0)
    
    return NextResponse.json({ restaurants: data })
  } catch (error) {
    console.error('API debug-delivery-zones: Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
} 