import { RestaurantContent } from '@/components/restaurant-content'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function RestaurantPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const supabase = createServerComponentClient({ cookies })

  // Busca as configurações do restaurante pelo slug
  const { data: settings } = await supabase
    .from('restaurant_settings')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Restaurante não encontrado</h1>
          <p className="mt-2 text-gray-600">O restaurante que você procura não existe ou não está disponível.</p>
        </div>
      </div>
    )
  }

  // Busca as categorias e produtos diretamente do MongoDB
  const client = await clientPromise
  const db = client.db('cardapio_digital')

  const [categories, products] = await Promise.all([
    db.collection('categories')
      .find({ restaurantId: settings.user_id })
      .sort({ order: 1 })
      .toArray(),
    db.collection('products')
      .find({ restaurantId: settings.user_id })
      .toArray()
  ])

  // Normaliza os dados antes de passar para o componente
  const normalizedCategories = categories.map(category => ({
    ...category,
    id: category._id.toString(),
    _id: undefined
  }))

  const normalizedProducts = products.map(product => ({
    ...product,
    id: product._id.toString(),
    _id: undefined,
    categoryId: product.categoryId?.toString()
  }))

  const restaurant = {
    id: settings.user_id,
    name: settings.name,
    description: settings.description || '',
    logo: settings.logo_url,
    coverImage: settings.cover_url,
    address: settings.address || {},
    contact: settings.contact || {},
    openingHours: settings.opening_hours || [],
    deliveryInfo: settings.delivery_info || {}
  }

  return (
    <RestaurantContent 
      restaurant={restaurant}
      initialCategories={normalizedCategories}
      initialProducts={normalizedProducts}
    />
  )
} 