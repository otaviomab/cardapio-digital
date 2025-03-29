import { RestaurantContent } from '@/components/restaurant-content'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import clientPromise from '@/lib/mongodb'
import { Category, Product, RestaurantType } from '@/types/restaurant'
import { ObjectId } from 'mongodb'

interface PageProps {
  params: {
    slug: string
  }
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function RestaurantPage({ params }: PageProps) {
  // Obter o slug como uma propriedade assíncrona
  const slug = params.slug

  // Usar cookies de forma assíncrona
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  // Busca as configurações do restaurante pelo slug
  const { data: settings } = await supabase
    .from('restaurant_settings')
    .select('*')
    .eq('slug', slug)
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

  // Log para verificar o tipo de restaurante
  console.log('Tipo de restaurante:', settings.restaurant_type)

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

  // Log para inspecionar alguns produtos antes da normalização
  console.log('Amostra de produtos do MongoDB:', products.slice(0, 2).map(p => ({
    id: p._id,
    name: p.name,
    allowHalfHalf: p.allowHalfHalf,
    isPizza: p.isPizza
  })))

  // Normaliza os dados antes de passar para o componente
  const normalizedCategories = categories.map(category => ({
    ...category,
    id: category._id.toString(),
    _id: undefined,
    name: category.name || '',
    active: typeof category.active === 'boolean' ? category.active : true
  })) as Category[]

  // Se for uma pizzaria, marca produtos em categorias de pizza como permitindo meia a meia
  let updatedProducts = [...products]
  if (settings.restaurant_type === RestaurantType.PIZZARIA) {
    const pizzaCategories = categories
      .filter(cat => 
        cat.name.toLowerCase().includes('pizza') || 
        cat.name.toLowerCase().includes('pizzas')
      )
      .map(cat => cat._id.toString())
    
    // Atualiza propriedades de meia a meia em produtos de pizza
    updatedProducts = products.map(product => {
      if (pizzaCategories.includes(product.categoryId?.toString())) {
        return {
          ...product,
          allowHalfHalf: true,
          isPizza: true
        }
      }
      return product
    })
  }

  const normalizedProducts = updatedProducts.map(product => ({
    ...product,
    id: product._id.toString(),
    _id: undefined,
    name: product.name || '',
    description: product.description || '',
    price: typeof product.price === 'number' ? product.price : 0,
    image: product.image || '',
    category: product.category || '',
    active: typeof product.active === 'boolean' ? product.active : true,
    categoryId: product.categoryId?.toString(),
    // Garantindo que as propriedades necessárias para pizza meia a meia estejam presentes
    allowHalfHalf: typeof product.allowHalfHalf === 'boolean' ? product.allowHalfHalf : false,
    isPizza: typeof product.isPizza === 'boolean' ? product.isPizza : false,
    additions: Array.isArray(product.additions) ? product.additions : []
  })) as Product[]

  // Log para depuração
  console.log('Produtos carregados:', normalizedProducts.length)
  console.log('Produtos habilitados para meia a meia:', normalizedProducts.filter(p => p.allowHalfHalf).length)
  console.log('Produtos meia a meia:', normalizedProducts.filter(p => p.allowHalfHalf).map(p => ({
    id: p.id,
    nome: p.name,
    categoria: p.category
  })))

  const restaurant = {
    id: settings.user_id,
    name: settings.name,
    description: settings.description || '',
    logo: settings.logo_url,
    coverImage: settings.cover_url,
    address: settings.address || {},
    contact: settings.contact || {},
    openingHours: settings.opening_hours || [],
    deliveryInfo: settings.delivery_info || {},
    restaurantType: settings.restaurant_type || 'restaurant',
    slug: settings.slug
  }

  return (
    <RestaurantContent 
      restaurant={restaurant}
      initialCategories={normalizedCategories}
      initialProducts={normalizedProducts}
    />
  )
} 