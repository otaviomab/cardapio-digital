import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    console.log('Verificando email:', email.trim())

    // Verifica se existe nas configurações do restaurante usando a sintaxe correta do PostgreSQL
    const { data: existingSettings, error: settingsError } = await supabase
      .from('restaurant_settings')
      .select('id, contact')
      .eq('contact->>email', email.trim())
      .maybeSingle()

    if (settingsError) {
      console.error('Erro ao verificar email nas configurações:', settingsError)
      return NextResponse.json(
        { error: 'Erro ao verificar disponibilidade do email' },
        { status: 500 }
      )
    }

    if (existingSettings) {
      console.log('Email encontrado nas configurações:', email)
      return NextResponse.json({ exists: true })
    }

    console.log('Email disponível:', email)
    return NextResponse.json({ exists: false })

  } catch (error) {
    console.error('Erro ao verificar email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 