import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')

    // Inicializa o cliente Supabase
    const supabase = createRouteHandlerClient({ cookies })

    // Ação para buscar configurações do restaurante por user_id
    if (action === 'getRestaurantSettings' && userId) {
      const { data: restaurantSettings, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Erro ao buscar configurações do restaurante:', error)
        return NextResponse.json(
          { error: 'Erro ao buscar configurações do restaurante', details: error.message },
          { status: 500 }
        )
      }

      if (!restaurantSettings) {
        return NextResponse.json(
          { error: 'Configurações do restaurante não encontradas' },
          { status: 404 }
        )
      }

      return NextResponse.json(restaurantSettings)
    }

    // Ação não reconhecida
    return NextResponse.json(
      { error: 'Ação não suportada' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
} 