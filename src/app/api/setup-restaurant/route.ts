import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('API setup-restaurant: Iniciando configuração do restaurante')
    
    // Tenta obter os dados do corpo da requisição
    let userData = null
    try {
      userData = await request.json()
      console.log('API setup-restaurant: Dados do usuário recebidos no corpo da requisição')
    } catch (e) {
      console.log('API setup-restaurant: Nenhum dado recebido no corpo da requisição')
    }
    
    // Verifica se há um token de autorização no cabeçalho
    const authHeader = request.headers.get('Authorization')
    let supabase
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extrai o token do cabeçalho
      const token = authHeader.substring(7)
      console.log('API setup-restaurant: Token de autorização encontrado no cabeçalho')
      
      // Cria o cliente Supabase com o token fornecido
      supabase = createRouteHandlerClient({ 
        cookies,
        options: {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      })
    } else {
      // Fallback para o método padrão usando cookies
      console.log('API setup-restaurant: Nenhum token encontrado, usando cookies para autenticação')
      supabase = createRouteHandlerClient({ cookies })
    }
    
    console.log('API setup-restaurant: Cliente Supabase criado')

    // Tenta obter o usuário da sessão do Supabase
    let user = null
    let userError = null
    
    try {
      const authResult = await supabase.auth.getUser()
      user = authResult.data.user
      userError = authResult.error
    } catch (e) {
      console.error('API setup-restaurant: Erro ao obter usuário da sessão:', e)
    }
    
    // Se não conseguiu obter o usuário da sessão, tenta usar os dados enviados no corpo
    if (userError || !user) {
      console.log('API setup-restaurant: Não foi possível obter usuário da sessão, tentando usar dados do corpo')
      
      if (!userData || !userData.userId) {
        console.error('API setup-restaurant: Dados do usuário não fornecidos ou incompletos')
        return NextResponse.json(
          { error: 'Dados do usuário não fornecidos ou incompletos' },
          { status: 400 }
        )
      }
      
      // Cria um objeto de usuário a partir dos dados enviados
      user = {
        id: userData.userId,
        email: userData.email,
        user_metadata: userData.userMetadata || {}
      }
      
      console.log('API setup-restaurant: Usando dados do usuário fornecidos no corpo:', user.id)
    } else {
      console.log('API setup-restaurant: Usuário autenticado via sessão:', user.id)
    }
    
    // Verifica se já existem configurações para este usuário
    const { data: existingSettings, error: settingsError } = await supabase
      .from('restaurant_settings')
      .select('id')
      .eq('user_id', user.id)
      .single()
      
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('API setup-restaurant: Erro ao verificar configurações existentes:', settingsError)
      return NextResponse.json(
        { error: 'Erro ao verificar configurações existentes', details: settingsError.message },
        { status: 500 }
      )
    }

    if (existingSettings) {
      console.log('API setup-restaurant: Configurações já existem para este usuário:', existingSettings)
      return NextResponse.json(
        { error: 'Configurações já existem para este usuário' },
        { status: 400 }
      )
    }
    
    console.log('API setup-restaurant: Nenhuma configuração existente encontrada, prosseguindo com a criação')

    // Recupera os dados pendentes dos metadados do usuário
    const pendingSettings = user.user_metadata.pending_settings
    console.log('API setup-restaurant: Dados pendentes:', pendingSettings ? 'Encontrados' : 'Não encontrados')
    
    // Se não houver dados pendentes, tenta usar outros dados dos metadados
    if (!pendingSettings) {
      console.log('API setup-restaurant: Dados pendentes não encontrados, tentando usar dados básicos dos metadados')
      
      // Verifica se há dados básicos nos metadados
      const name = user.user_metadata.restaurant_name || user.user_metadata.name || ''
      const email = user.email || ''
      const phone = user.user_metadata.phone || ''
      
      console.log('API setup-restaurant: Dados básicos:', { name, email, phone })
      
      if (!name) {
        console.error('API setup-restaurant: Dados insuficientes para configuração inicial')
        return NextResponse.json(
          { error: 'Dados insuficientes para configuração inicial' },
          { status: 400 }
        )
      }
      
      // Cria um objeto de configurações básicas com os dados disponíveis
      const basicSettings = {
        name: name,
        slug: name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, ''),
        contact: {
          name: user.user_metadata.name || '',
          email: email,
          phone: phone
        }
      }
      
      console.log('API setup-restaurant: Usando configurações básicas:', basicSettings)
      
      // Usa as configurações básicas em vez dos dados pendentes
      return await createRestaurantSettings(supabase, user, basicSettings)
    }

    console.log('API setup-restaurant: Usando dados pendentes para configuração')
    // Se houver dados pendentes, usa-os normalmente
    return await createRestaurantSettings(supabase, user, pendingSettings)
    
  } catch (error) {
    console.error('API setup-restaurant: Erro ao configurar restaurante:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

// Função auxiliar para criar as configurações do restaurante
async function createRestaurantSettings(supabase, user, settings) {
  console.log('API setup-restaurant: Iniciando criação das configurações do restaurante')
  
  try {
    // Verifica se o slug já existe
    const { data: existingSlug, error: slugError } = await supabase
      .from('restaurant_settings')
      .select('slug')
      .eq('slug', settings.slug)
      .single()
      
    if (slugError && slugError.code !== 'PGRST116') {
      console.error('API setup-restaurant: Erro ao verificar slug existente:', slugError)
      return NextResponse.json(
        { error: 'Erro ao verificar slug existente', details: slugError.message },
        { status: 500 }
      )
    }

    // Se o slug existir, adiciona um número aleatório
    const slug = existingSlug 
      ? `${settings.slug}-${Math.floor(Math.random() * 1000)}`
      : settings.slug
      
    console.log('API setup-restaurant: Slug final:', slug)

    // Cria as configurações do restaurante
    const { data: createdSettings, error: settingsError } = await supabase
      .from('restaurant_settings')
      .insert([
        {
          user_id: user.id,
          name: settings.name,
          slug,
          contact: settings.contact,
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
      console.error('API setup-restaurant: Erro ao criar configurações:', settingsError)
      return NextResponse.json(
        { error: 'Erro ao criar configurações do restaurante', details: settingsError.message },
        { status: 500 }
      )
    }
    
    console.log('API setup-restaurant: Configurações criadas com sucesso:', createdSettings.id)

    // Limpa os dados pendentes dos metadados
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        pending_settings: null,
        initial_setup: true
      }
    })
    
    if (updateError) {
      console.error('API setup-restaurant: Erro ao atualizar metadados do usuário:', updateError)
      // Não retorna erro aqui, pois as configurações já foram criadas
    } else {
      console.log('API setup-restaurant: Metadados do usuário atualizados com sucesso')
    }

    return NextResponse.json(createdSettings)
  } catch (error) {
    console.error('API setup-restaurant: Erro na função createRestaurantSettings:', error)
    return NextResponse.json(
      { error: 'Erro ao criar configurações do restaurante', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
} 