'use client'

import { useState } from 'react'
import { X, Upload, Trash2 } from 'lucide-react'
import { Product, Category } from '@/types/restaurant'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NumericFormat } from 'react-number-format'
import { ImageUpload } from '@/components/image-upload'

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
  onSubmit,
}: ProductFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Product>>(
    product || {
      name: '',
      description: '',
      price: 0,
      categoryId: '',
      available: true,
      featured: false,
      image: '',
      additions: [],
      isPizza: false,
      allowHalfHalf: false
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Log para depuração
    console.log('Enviando dados do produto:', {
      ...formData,
      isPizza: formData.isPizza,
      allowHalfHalf: formData.allowHalfHalf
    })

    try {
      await onSubmit(formData)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddAddition = () => {
    setFormData(prev => ({
      ...prev,
      additions: [
        ...(prev.additions || []),
        { id: crypto.randomUUID(), name: '', price: 0, available: true }
      ]
    }))
  }

  const handleRemoveAddition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additions: prev.additions?.filter((_, i) => i !== index)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Imagem do Produto */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Imagem do Produto
            </label>
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
              onError={(error) => setUploadError(error)}
              folder="products"
              aspectRatio={16/9}
              enforceAspectRatio={false}
            />
            {uploadError && (
              <p className="mt-1 text-sm text-red-600">{uploadError}</p>
            )}
          </div>

          {/* Informações Básicas */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-900"
              >
                Nome
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-900"
              >
                Categoria
              </label>
              <select
                id="category"
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, categoryId: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                required
              >
                <option value="" key="empty-category">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={`category-${category.id}`} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-900"
            >
              Descrição
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-900"
            >
              Preço
            </label>
            <NumericFormat
              id="price"
              value={formData.price}
              onValueChange={(values) =>
                setFormData((prev) => ({ ...prev, price: values.floatValue || 0 }))
              }
              decimalScale={2}
              fixedDecimalScale
              prefix="R$ "
              thousandSeparator="."
              decimalSeparator=","
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
              required
            />
          </div>

          {/* Opções */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      available: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-krato-500 focus:ring-krato-500"
                />
                <span className="text-sm text-gray-900">Disponível</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      featured: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-krato-500 focus:ring-krato-500"
                />
                <span className="text-sm text-gray-900">Destaque</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.allowHalfHalf || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      allowHalfHalf: e.target.checked,
                      isPizza: e.target.checked ? true : (prev.isPizza || false)
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-krato-500 focus:ring-krato-500"
                />
                <span className="text-sm text-gray-900">Permite Meia a Meia</span>
              </label>
            </div>
          </div>

          {/* Adicionais */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Adicionais</h3>
              <button
                type="button"
                onClick={handleAddAddition}
                className="text-sm font-medium text-krato-500 hover:text-krato-600"
              >
                Adicionar
              </button>
            </div>

            <div className="space-y-4">
              {formData.additions?.map((addition, index) => (
                <div key={addition.id || `new-addition-${index}`} className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={addition.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          additions: prev.additions?.map((a, i) =>
                            i === index ? { ...a, name: e.target.value } : a
                          ),
                        }))
                      }
                      placeholder="Nome do adicional"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500"
                    />
                  </div>

                  <div className="w-32">
                    <NumericFormat
                      value={addition.price}
                      onValueChange={(values) =>
                        setFormData((prev) => ({
                          ...prev,
                          additions: prev.additions?.map((a, i) =>
                            i === index
                              ? { ...a, price: values.floatValue || 0 }
                              : a
                          ),
                        }))
                      }
                      decimalScale={2}
                      fixedDecimalScale
                      prefix="R$ "
                      thousandSeparator="."
                      decimalSeparator=","
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAddition(index)}
                    className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-krato-500 px-4 py-2 text-sm font-medium text-white hover:bg-krato-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 