import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Carrega as variáveis de ambiente do arquivo .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2d2loZ3NzdGRmb3N6ZXBhZmdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODcyMjIxMSwiZXhwIjoyMDU0Mjk4MjExfQ.uGXd8aS0DvyHT5RYVnNX7vH4ztnrir2crGK8unffcZ8'

async function applyChanges() {
  try {
    console.log('Iniciando aplicação de mudanças no Supabase...')
    
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Dados do restaurante demo
    const restaurantData = {
      user_id: 'e0dba73b-0870-4b0d-8026-7341db950c16',
      name: 'Restaurante Demo',
      description: 'O melhor restaurante da cidade',
      slug: 'restaurante-demo',
      logo_url: '/images/logotipo-new2.png',
      cover_url: '/images/hamburguer.png',
      address: {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      },
      contact: {
        phone: '(11) 1234-5678',
        whatsapp: '(11) 91234-5678',
        email: 'contato@restaurantedemo.com.br'
      },
      opening_hours: [
        {
          days: 'Segunda à Sexta',
          hours: '11:00 às 14:00'
        },
        {
          days: 'Sábado e Domingo',
          hours: '11:00 às 14:00'
        }
      ],
      delivery_info: {
        minimumOrder: 20,
        deliveryTime: '30-45 min',
        deliveryFee: 5,
        paymentMethods: ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX'],
        zones: [
          {
            id: '1',
            minDistance: 0,
            maxDistance: 3,
            fee: 5,
            estimatedTime: '30-45 min',
            active: true
          },
          {
            id: '2',
            minDistance: 3,
            maxDistance: 6,
            fee: 8,
            estimatedTime: '45-60 min',
            active: true
          }
        ]
      }
    }

    // Insere os dados usando a API do Supabase
    console.log('Inserindo dados...')
    const { error } = await supabase
      .from('restaurant_settings')
      .upsert(restaurantData, {
        onConflict: 'user_id'
      })

    if (error) {
      throw error
    }

    console.log('Dados inseridos com sucesso!')
    process.exit(0)
  } catch (error) {
    console.error('Erro ao aplicar mudanças:', error)
    process.exit(1)
  }
}

applyChanges() 