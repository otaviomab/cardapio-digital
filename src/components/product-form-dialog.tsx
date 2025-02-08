'use client'

import { useState, useEffect, useMemo } from 'react'
import { Product, Category } from '@/types/restaurant'
import { ImageUpload } from './image-upload'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { NumericFormat } from 'react-number-format'

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
  categories: Category[]
  onSubmit: (data: Partial<Product>) => Promise<void>
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSubmit
}: ProductFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Filtra e prepara as categorias válidas uma única vez
  const validCategories = useMemo(() => {
    return categories
      .map((cat, index) => ({
        ...cat,
        // Garante um ID único mesmo se o _id e id forem undefined
        uniqueId: cat._id?.toString() || cat.id || `temp-${index}`,
        index // Mantém o índice original para ordenação
      }))
      .sort((a, b) => a.index - b.index) // Mantém a ordem original
  }, [categories])

  // Inicializa o estado do formulário
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    image: '',
    categoryId: '',
    available: true,
    featured: false,
    additions: []
  })

  // Atualiza o formData quando o produto ou categorias mudarem
  useEffect(() => {
    if (product) {
      // Se estiver editando um produto existente
      const categoryId = validCategories.find(
        cat => cat._id?.toString() === product.categoryId || cat.id === product.categoryId
      )?.uniqueId || ''

      setFormData({
        ...product,
        categoryId
      })
    } else {
      // Se estiver criando um novo produto
      const defaultCategory = validCategories[0]
      setFormData(prev => ({
        ...prev,
        categoryId: defaultCategory?.uniqueId || ''
      }))
    }
  }, [product, validCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      
      // Validações
      if (!formData.categoryId) {
        alert('Por favor, selecione uma categoria válida')
        return
      }

      if (!formData.name?.trim()) {
        alert('Por favor, insira um nome para o produto')
        return
      }

      if (!formData.description?.trim()) {
        alert('Por favor, insira uma descrição para o produto')
        return
      }

      if (typeof formData.price !== 'number' || formData.price <= 0) {
        alert('Por favor, insira um preço válido')
        return
      }

      // Encontra a categoria original para enviar o ID correto
      const selectedCategory = validCategories.find(cat => cat.uniqueId === formData.categoryId)
      if (!selectedCategory) {
        alert('Categoria selecionada é inválida')
        return
      }

      // Usa o ID original da categoria ao invés do uniqueId
      const dataToSubmit = {
        ...formData,
        categoryId: selectedCategory._id?.toString() || selectedCategory.id
      }
      
      await onSubmit(dataToSubmit)
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      alert('Erro ao salvar produto. Por favor, tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {product ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            {/* Imagem */}
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Imagem do Produto
              </label>
              <div className="mt-2">
                <ImageUpload
                  value={formData.image}
                  onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                  folder="products"
                  aspectRatio={16/9}
                  enforceAspectRatio={false}
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label 
                htmlFor="category"
                className="block text-sm font-medium text-zinc-900"
              >
                Categoria
              </label>
              <select
                id="category"
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                className="mt-2 block w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Selecione uma categoria</option>
                {validCategories.map((category) => (
                  <option key={category.uniqueId} value={category.uniqueId}>
                    {category.name}
                  </option>
                ))}
              </select>
              {validCategories.length === 0 && (
                <p className="mt-1 text-sm text-red-500">
                  Nenhuma categoria disponível. Por favor, crie uma categoria primeiro.
                </p>
              )}
            </div>

            {/* Nome */}
            <div>
              <label 
                htmlFor="name"
                className="block text-sm font-medium text-zinc-900"
              >
                Nome do Produto
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-2 block w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {/* Descrição */}
            <div>
              <label 
                htmlFor="description"
                className="block text-sm font-medium text-zinc-900"
              >
                Descrição
              </label>
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="mt-2 block w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {/* Preço */}
            <div>
              <label 
                htmlFor="price"
                className="block text-sm font-medium text-zinc-900"
              >
                Preço
              </label>
              <NumericFormat
                id="price"
                required
                value={formData.price}
                onValueChange={(values) => {
                  setFormData(prev => ({ ...prev, price: values.floatValue || 0 }))
                }}
                decimalScale={2}
                fixedDecimalScale
                prefix="R$ "
                decimalSeparator=","
                thousandSeparator="."
                className="mt-2 block w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {/* Disponibilidade e Destaque */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-zinc-900">Disponível</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-zinc-900">Destaque</span>
              </label>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || validCategories.length === 0}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 