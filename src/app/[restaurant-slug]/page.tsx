import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { RestaurantContent } from './restaurant-content'

interface PageProps {
  params: {
    'restaurant-slug': string
  }
}

export default async function RestaurantPage({ params }: PageProps) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const slug = params['restaurant-slug']

  try {
    console.log('Buscando restaurante com slug:', slug)

    // Busca os dados do restaurante no Supabase
    const { data: restaurant, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Erro ao buscar restaurante:', {
        error,
        slug,
        message: error.message,
        details: error.details
      })
      notFound()
    }

    if (!restaurant) {
      console.error('Restaurante não encontrado:', { slug })
      notFound()
    }

    console.log('Restaurante encontrado:', {
      id: restaurant.user_id,
      name: restaurant.name,
      slug: restaurant.slug
    })

    // Formata os dados para o formato esperado pelo componente
    const formattedRestaurant = {
      id: restaurant.user_id,
      slug: restaurant.slug,
      name: restaurant.name,
      description: restaurant.description || '',
      logo: restaurant.logo_url || '',
      coverImage: restaurant.cover_url || '',
      address: restaurant.address || {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: ''
      },
      contact: restaurant.contact || {
        phone: '',
        whatsapp: '',
        email: ''
      },
      openingHours: restaurant.opening_hours || [],
      deliveryInfo: restaurant.delivery_info || {
        minimumOrder: 0,
        deliveryTime: '',
        deliveryFee: 0,
        paymentMethods: [],
        zones: []
      }
    }

    console.log('Dados formatados do restaurante:', formattedRestaurant)

    return <RestaurantContent restaurant={formattedRestaurant} />
  } catch (error) {
    console.error('Erro não tratado ao buscar restaurante:', error)
    throw error
  }
} 