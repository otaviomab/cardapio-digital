'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Store, Clock } from 'lucide-react'
import { Restaurant, Product, Category } from '@/types/restaurant'
import { ProductModal } from '@/components/product-modal'
import { CartButton } from '@/components/cart-button'
import { AddToCartDialog } from '@/components/add-to-cart-dialog'
import { AlertDialog } from '@/components/alert-dialog'
import { useRestaurantHours } from '@/hooks/useRestaurantHours'
import { getCategories, getProducts } from '@/lib/api-services'

interface RestaurantContentProps {
  restaurant: Restaurant
  initialCategories?: Category[]
  initialProducts?: Product[]
}

export function RestaurantContent({ 
  restaurant,
  initialCategories = [],
  initialProducts = []
}: RestaurantContentProps) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isLoadingData, setIsLoadingData] = useState(!initialCategories || !initialProducts)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  // Validação de horário de funcionamento
  const { isOpen, nextOpeningTime, currentSchedule, isLoading } = useRestaurantHours(restaurant.openingHours || [])

  // Carrega os dados do cardápio se não foram fornecidos
  useEffect(() => {
    const loadData = async () => {
      if (initialCategories && initialProducts) return

      try {
        setIsLoadingData(true)
        const [categoriesData, productsData] = await Promise.all([
          getCategories(restaurant.id),
          getProducts(restaurant.id)
        ])

        setCategories(categoriesData)
        setProducts(productsData)

        // Expande todas as categorias por padrão
        setExpandedCategories(categoriesData.map(cat => cat.id))
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [restaurant.id, initialCategories, initialProducts])

  // Scroll suave para a categoria quando clicada
  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`)
    if (element) {
      const navHeight = 120 // Altura aproximada do header + nav
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - navHeight

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      setActiveCategory(categoryId)
    }
  }

  // Observer para detectar qual categoria está visível
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const categoryId = entry.target.id.replace('category-', '')
            setActiveCategory(categoryId)
          }
        })
      },
      {
        rootMargin: '-50% 0px -50% 0px' // Considera elemento visível quando estiver no meio da tela
      }
    )

    // Observa todas as seções de categoria
    categories.forEach((category) => {
      const element = document.getElementById(`category-${category._id || category.id}`)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [categories])

  const selectedProductData = products.find(
    (product) => product.id === selectedProduct
  )

  const handleAddToCart = () => {
    // Não permite adicionar ao carrinho se estiver fechado
    if (!isOpen) {
      setShowAlert(true)
      return
    }

    setSelectedProduct(null)
    setShowConfirmation(true)
  }

  return (
    <div className="min-h-screen">
      {/* Alerta de Horário de Funcionamento */}
      {!isLoading && !isOpen && (
        <div className="fixed left-0 right-0 top-0 z-50 bg-red-50 shadow-sm" key="closed-alert">
          <div className="container mx-auto flex items-center justify-between p-4 text-red-700">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <div>
                <p className="font-medium">Restaurante fechado</p>
                {nextOpeningTime && (
                  <p className="text-sm" key="next-opening">Abriremos às {nextOpeningTime}</p>
                )}
                {currentSchedule && (
                  <p className="text-sm" key="current-schedule">Horário hoje: {currentSchedule}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header do Restaurante */}
      <header className={`relative h-64 ${!isLoading && !isOpen ? 'mt-[84px]' : ''}`}>
        {/* Imagem de Capa */}
        <div className="absolute inset-0">
          <Image
            src={restaurant.coverImage || '/images/default-cover.jpg'}
            alt={restaurant.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Informações do Restaurante */}
        <div className="container relative mx-auto flex h-full flex-col justify-end px-4 pb-8">
          <Image
            src={restaurant.logo || '/images/default-logo.jpg'}
            alt={`Logo ${restaurant.name}`}
            width={80}
            height={80}
            className="mb-4 rounded-lg border-4 border-white"
          />
          <h1 className="text-3xl font-bold text-white">{restaurant.name}</h1>
          <div className="mt-2 flex items-center gap-4 text-zinc-200">
            <span key="delivery-time">🕒 {restaurant.deliveryInfo.deliveryTime}</span>
            <span key="address">📍 {restaurant.address.city}, {restaurant.address.state}</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Categorias - Navegação Fixa */}
        <div className={`sticky ${!isLoading && !isOpen ? 'top-[84px]' : 'top-0'} z-40 -mx-4 bg-white shadow-sm`}>
          <nav className="px-4 py-3">
            <div className="no-scrollbar overflow-x-auto">
              <ul className="flex gap-4">
                {categories.map((category) => {
                  // Garante que temos um ID válido e único
                  const categoryId = category._id?.toString() || category.id
                  if (!categoryId) return null // Pula categorias sem ID

                  return (
                    <li key={`nav-category-${categoryId}`}>
                      <button 
                        onClick={() => scrollToCategory(categoryId)}
                        className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors
                          ${activeCategory === categoryId
                            ? 'border-green-600 bg-green-50 text-green-600'
                            : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                          }`}
                      >
                        {category.name}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>
        </div>

        {/* Lista de Produtos por Categoria */}
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12" key="loading">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
          </div>
        ) : (
          <div className="mt-8 space-y-12">
            {categories.map((category) => {
              // Garante que temos um ID válido e único
              const categoryId = category._id?.toString() || category.id
              if (!categoryId) return null // Pula categorias sem ID

              const categoryProducts = products.filter(
                product => product.categoryId === categoryId
              )

              if (categoryProducts.length === 0) return null

              return (
                <section 
                  key={`category-section-${categoryId}`}
                  id={`category-${categoryId}`}
                  className="scroll-mt-32"
                >
                  {/* Cabeçalho da Categoria */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-zinc-900">{category.name}</h2>
                    {category.description && (
                      <p className="mt-1 text-zinc-600">{category.description}</p>
                    )}
                  </div>

                  {/* Produtos da Categoria */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {categoryProducts.map((product) => {
                      // Garante que temos um ID válido e único para o produto
                      const productId = product._id?.toString() || product.id
                      if (!productId) return null // Pula produtos sem ID

                      return (
                        <div
                          key={`product-${productId}`}
                          onClick={() => {
                            if (!isLoading && !isOpen) {
                              setShowAlert(true)
                              return
                            }
                            setSelectedProduct(productId)
                          }}
                          className="cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm transition-transform hover:scale-[1.02]"
                        >
                          {product.image && (
                            <div className="relative aspect-video w-full">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                              />
                            </div>
                          )}

                          <div className="p-4">
                            <h3 className="font-medium text-gray-900">
                              {product.name}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                              {product.description}
                            </p>
                            <div className="mt-4">
                              <span className="text-lg font-bold text-gray-900">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(product.price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Divisória entre categorias */}
                  <div className="mt-12 border-b border-zinc-200" />
                </section>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal de Produto */}
      {selectedProductData && (
        <ProductModal
          product={selectedProductData}
          open={!!selectedProduct}
          onOpenChange={(isOpen) => {
            setSelectedProduct(isOpen ? selectedProductData.id : null)
          }}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Alerta de Restaurante Fechado */}
      <AlertDialog
        open={showAlert}
        onOpenChange={setShowAlert}
        title="Restaurante Fechado"
        description="O restaurante está fechado no momento. Volte no horário de funcionamento."
        confirmText="OK"
        variant="warning"
      />

      {/* Botão do Carrinho */}
      <CartButton />

      <AddToCartDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
      />
    </div>
  )
} 