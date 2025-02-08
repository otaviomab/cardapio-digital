'use client'

import { useState, useEffect } from 'react'
import { 
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  DollarSign,
  Tag,
  ChevronDown,
  ChevronUp,
  Store
} from 'lucide-react'
import Image from 'next/image'
import { Product, Category } from '@/types/restaurant'
import { ProductFormDialog } from './components/product-form-dialog'
import { CategoryFormDialog } from './components/category-form-dialog'
import { useSupabase } from '@/contexts/SupabaseContext'
import { 
  getCategories, 
  getProducts, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct
} from '@/lib/api-services'

export default function MenuPage() {
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  
  // Estados para os modais
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCategoryToEdit, setSelectedCategoryToEdit] = useState<Category | null>(null)

  // Carrega os dados iniciais
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      console.log('Carregando dados para o usuário:', user.id)

      const [categoriesData, productsData] = await Promise.all([
        getCategories(user.id),
        getProducts(user.id)
      ])

      console.log('Categorias carregadas:', categoriesData)
      console.log('Produtos carregados:', productsData)

      setCategories(categoriesData)
      setProducts(productsData)

      // Expande todas as categorias por padrão
      setExpandedCategories(categoriesData.map(cat => cat.id))
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados. Por favor, tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtra os produtos baseado na busca e categoria
  const filteredProducts = products.filter(product => {
    console.log('Verificando produto:', {
      produto: product,
      categoryId: product.categoryId,
      selectedCategory,
      matchesCategory: !selectedCategory || product.categoryId === selectedCategory
    })

    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Verifica se o produto tem uma categoria válida
    const matchingCategory = categories.find(cat => 
      cat._id?.toString() === product.categoryId || 
      cat.id === product.categoryId || 
      product.categoryId === 'Burguer'
    )
    
    const matchesCategory = !selectedCategory || 
      product.categoryId === selectedCategory || 
      (matchingCategory && (matchingCategory._id?.toString() === selectedCategory || matchingCategory.id === selectedCategory))

    return matchesSearch && matchingCategory && matchesCategory
  })

  // Toggle para expandir/recolher categoria
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Handlers para os modais
  const handleNewProduct = () => {
    setSelectedProduct(null)
    setIsProductModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  const handleNewCategory = () => {
    setSelectedCategoryToEdit(null)
    setIsCategoryModalOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setSelectedCategoryToEdit(category)
    setIsCategoryModalOpen(true)
  }

  // Handlers para salvar
  const handleSaveProduct = async (data: Partial<Product>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      console.log('Dados do produto a ser criado:', data)

      if (selectedProduct) {
        await updateProduct(selectedProduct.id, data)
      } else {
        // Encontra a categoria selecionada
        const selectedCat = categories.find(cat => cat._id?.toString() === data.categoryId || cat.id === data.categoryId)
        console.log('Categoria selecionada:', selectedCat)

        // Garante que todos os campos obrigatórios estão presentes
        const newProductData = {
          ...data,
          restaurantId: user.id,
          image: data.image || data.imageUrl, // Aceita qualquer um dos campos
          available: data.available ?? true, // Valor padrão se não fornecido
          featured: data.featured ?? false, // Valor padrão se não fornecido
          additions: data.additions || [], // Garante que additions existe
          categoryId: selectedCat?._id?.toString() || selectedCat?.id || data.categoryId // Usa o ID correto da categoria
        }

        console.log('Dados normalizados do produto:', newProductData)
        console.log('Categorias disponíveis:', categories)

        const newProduct = await createProduct(user.id, newProductData as Product)
        console.log('Produto criado:', newProduct)
      }

      // Recarrega os dados e fecha o modal
      await loadData()
      setIsProductModalOpen(false)
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      alert('Erro ao salvar produto. Por favor, tente novamente.')
    }
  }

  const handleSaveCategory = async (data: Partial<Category>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      if (selectedCategoryToEdit) {
        await updateCategory(selectedCategoryToEdit.id, data)
      } else {
        await createCategory(user.id, data as Category)
      }

      await loadData()
      setIsCategoryModalOpen(false)
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      alert('Erro ao salvar categoria. Por favor, tente novamente.')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('ATENÇÃO: Ao excluir esta categoria, todos os produtos associados a ela também serão excluídos permanentemente, incluindo suas imagens. Deseja continuar?')) return

    try {
      // Encontra os produtos da categoria para mostrar quantos serão deletados
      const categoryProducts = products.filter(product => 
        product.categoryId === categoryId
      )

      setIsLoading(true)
      await deleteCategory(categoryId)
      
      // Feedback específico baseado na quantidade de produtos deletados
      if (categoryProducts.length > 0) {
        alert(`Categoria e ${categoryProducts.length} produto(s) foram excluídos com sucesso!`)
      } else {
        alert('Categoria excluída com sucesso!')
      }
      
      await loadData()
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      alert('Erro ao excluir categoria e seus produtos. Por favor, tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      await deleteProduct(productId)
      await loadData()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto. Por favor, tente novamente.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cardápio</h1>
          <p className="text-gray-600">Gerencie os produtos do seu cardápio</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleNewCategory}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </button>

          <button
            onClick={handleNewProduct}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produtos por nome ou descrição"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="" key="category-all">Todas as categorias</option>
            {categories.map((category) => (
              <option key={`category-option-${category._id || category.id}`} value={category._id?.toString() || category.id || 'Burguer'}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Categorias e Produtos */}
      <div className="space-y-6">
        {categories.map((category) => {
          console.log('Renderizando categoria:', category)
          
          const categoryProducts = filteredProducts.filter(product => {
            console.log('Comparando produto com categoria:', {
              produto: product,
              produtoCategoryId: product.categoryId,
              categoriaId: category._id,
              categoriaIdString: category._id?.toString(),
              match: product.categoryId === category._id?.toString() || product.categoryId === category.id || product.categoryId === 'Burguer'
            })
            return product.categoryId === category._id?.toString() || product.categoryId === category.id || product.categoryId === 'Burguer'
          })

          if (selectedCategory && selectedCategory !== category._id?.toString() && selectedCategory !== category.id) {
            return null
          }

          if (categoryProducts.length === 0 && searchTerm) {
            return null
          }

          const isExpanded = expandedCategories.includes(category._id?.toString() || category.id)

          return (
            <div
              key={`category-${category._id || category.id}`}
              className="rounded-lg border border-gray-200 bg-white overflow-hidden"
            >
              {/* Cabeçalho da Categoria */}
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleCategory(category._id?.toString() || category.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="text-sm text-gray-600">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id?.toString() || category.id)}
                      className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Produtos */}
              {isExpanded && (
                <div className="divide-y divide-gray-200">
                  {categoryProducts.map((product) => (
                    <div
                      key={`product-${product.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50"
                    >
                      {/* Imagem do Produto */}
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-100">
                            <Store className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Informações do Produto */}
                      <div className="flex flex-1 items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium text-gray-900">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {product.description}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <DollarSign className="h-4 w-4" />
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(product.price)}
                            </div>
                            {product.available ? (
                              <span key={`available-${product.id}`} className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-700" />
                                Disponível
                              </span>
                            ) : (
                              <span key={`unavailable-${product.id}`} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-700" />
                                Indisponível
                              </span>
                            )}
                            {product.featured && (
                              <span key={`featured-${product.id}`} className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
                                <Tag className="h-3 w-3" />
                                Destaque
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ações do Produto */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {categoryProducts.length === 0 && (
                    <div key={`empty-${category._id || category.id}`} className="p-6 text-center text-sm text-gray-600">
                      Nenhum produto encontrado nesta categoria.
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modais */}
      <ProductFormDialog
        key={`product-dialog-${selectedProduct?.id || 'new'}`}
        open={isProductModalOpen}
        onOpenChange={setIsProductModalOpen}
        product={selectedProduct || undefined}
        categories={categories}
        onSubmit={handleSaveProduct}
      />

      <CategoryFormDialog
        key={`category-dialog-${selectedCategoryToEdit?.id || 'new'}`}
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        category={selectedCategoryToEdit || undefined}
        onSubmit={handleSaveCategory}
      />
    </div>
  )
} 