import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verifica se o usuário está autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verifica se já existem configurações para este usuário
    const { data: existingSettings } = await supabase
      .from('restaurant_settings')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingSettings) {
      return NextResponse.json(
        { error: 'Configurações já existem para este usuário' },
        { status: 400 }
      )
    }

    // Recupera os dados pendentes dos metadados do usuário
    const pendingSettings = user.user_metadata.pending_settings
    if (!pendingSettings) {
      return NextResponse.json(
        { error: 'Dados pendentes não encontrados' },
        { status: 400 }
      )
    }

    // Verifica se o slug já existe
    const { data: existingSlug } = await supabase
      .from('restaurant_settings')
      .select('slug')
      .eq('slug', pendingSettings.slug)
      .single()

    // Se o slug existir, adiciona um número aleatório
    const slug = existingSlug 
      ? `${pendingSettings.slug}-${Math.floor(Math.random() * 1000)}`
      : pendingSettings.slug

    // Cria as configurações do restaurante
    const { data: settings, error: settingsError } = await supabase
      .from('restaurant_settings')
      .insert([
        {
          user_id: user.id,
          name: pendingSettings.name,
          slug,
          contact: pendingSettings.contact,
          status: 'pending_activation',
          address: {},
          opening_hours: [],
          delivery_info: {
            minimumOrder: 0,
            deliveryTime: '30-45 min',
            paymentMethods: ['credit_card', 'debit_card', 'pix', 'cash'],
            zones: [
              {
                id: '1',
                minDistance: 0,
                maxDistance: 3,
                fee: 5,
                estimatedTime: '30-45 min',
                active: true
              }
            ]
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (settingsError) {
      console.error('Erro ao criar configurações:', settingsError)
      return NextResponse.json(
        { error: 'Erro ao criar configurações do restaurante' },
        { status: 500 }
      )
    }

    // Limpa os dados pendentes dos metadados
    await supabase.auth.updateUser({
      data: {
        pending_settings: null,
        initial_setup: true
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erro ao configurar restaurante:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 