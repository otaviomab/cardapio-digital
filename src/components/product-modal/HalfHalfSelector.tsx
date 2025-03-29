'use client'

import { Pizza } from 'lucide-react'
import { useEffect } from 'react'
import { Product, Addition } from '@/types/restaurant'

interface HalfHalfSelectorProps {
  isHalfHalf: boolean
  setIsHalfHalf: (isHalfHalf: boolean) => void
  products: Product[]
  secondHalfProduct: Product | null
  setSecondHalfProduct: (product: Product | null) => void
  firstHalfAdditions: Addition[]
  setFirstHalfAdditions: (additions: Addition[]) => void
  secondHalfAdditions: Addition[]
  setSecondHalfAdditions: (additions: Addition[]) => void
  mainProduct: Product
}

export function HalfHalfSelector({
  isHalfHalf,
  setIsHalfHalf,
  products,
  secondHalfProduct,
  setSecondHalfProduct,
  firstHalfAdditions,
  setFirstHalfAdditions,
  secondHalfAdditions,
  setSecondHalfAdditions,
  mainProduct
}: HalfHalfSelectorProps) {
  // Produtos que permitem meia a meia
  const halfHalfProducts = products.filter(p => p.allowHalfHalf || p.isPizza)
  
  // Log para verificar os produtos disponíveis para meia a meia
  useEffect(() => {
    console.log('HalfHalfSelector - Produtos:', {
      totalProdutos: products.length,
      totalProdutosMeiaAMeia: halfHalfProducts.length,
      produtosMeiaAMeiaDetalhes: halfHalfProducts.map(p => ({
        id: p.id,
        nome: p.name,
        allowHalfHalf: p.allowHalfHalf
      }))
    })
  }, [products, halfHalfProducts])

  const handleHalfHalfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setIsHalfHalf(checked)
    
    // Se desmarcar, limpa a segunda metade e os adicionais
    if (!checked) {
      setSecondHalfProduct(null)
      setFirstHalfAdditions([])
      setSecondHalfAdditions([])
    }
  }

  const handleSelectSecondHalf = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value
    const product = halfHalfProducts.find(p => p.id === productId) || null
    setSecondHalfProduct(product)
    setSecondHalfAdditions([])
  }

  const handleToggleFirstHalfAddition = (addition: Addition) => {
    const isSelected = firstHalfAdditions.some(a => a.id === addition.id)
    
    if (isSelected) {
      setFirstHalfAdditions(firstHalfAdditions.filter(a => a.id !== addition.id))
    } else {
      setFirstHalfAdditions([...firstHalfAdditions, addition])
    }
  }

  const handleToggleSecondHalfAddition = (addition: Addition) => {
    const isSelected = secondHalfAdditions.some(a => a.id === addition.id)
    
    if (isSelected) {
      setSecondHalfAdditions(secondHalfAdditions.filter(a => a.id !== addition.id))
    } else {
      setSecondHalfAdditions([...secondHalfAdditions, addition])
    }
  }

  return (
    <div className="mb-6">
      <label className="inline-flex items-center">
        <input
          type="checkbox"
          checked={isHalfHalf}
          onChange={handleHalfHalfChange}
          className="h-4 w-4 rounded border-zinc-300 text-krato-500 focus:ring-krato-500"
        />
        <span className="ml-2 flex items-center gap-1 text-sm font-medium text-zinc-900">
          <Pizza className="h-4 w-4" />
          Quero meia pizza com sabores diferentes
        </span>
      </label>

      {isHalfHalf && (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900">
              Primeira metade
            </label>
            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-sm font-medium text-zinc-900">{mainProduct.name}</p>
              
              {mainProduct.additions && mainProduct.additions.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs font-medium text-zinc-700">Adicionais para esta metade:</p>
                  <div className="space-y-2">
                    {mainProduct.additions.map((addition) => (
                      <label key={addition.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={firstHalfAdditions.some(a => a.id === addition.id)}
                          onChange={() => handleToggleFirstHalfAddition(addition)}
                          className="h-4 w-4 rounded border-zinc-300 text-krato-500 focus:ring-krato-500"
                        />
                        <span className="ml-2 flex items-center justify-between w-full">
                          <span className="text-xs text-zinc-700">{addition.name}</span>
                          <span className="text-xs font-medium text-zinc-900">
                            + {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(addition.price)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="secondHalf" className="text-sm font-medium text-zinc-900">
              Segunda metade
            </label>
            <select
              id="secondHalf"
              value={secondHalfProduct?.id || ''}
              onChange={handleSelectSecondHalf}
              className="w-full rounded-lg border border-zinc-200 p-2 text-sm focus:border-krato-600 focus:outline-none focus:ring-1 focus:ring-krato-600"
            >
              <option value="">Selecione o sabor</option>
              {halfHalfProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>

            {secondHalfProduct && secondHalfProduct.additions && secondHalfProduct.additions.length > 0 && (
              <div className="mt-4 rounded-lg border border-zinc-200 p-3">
                <p className="text-xs font-medium text-zinc-700">Adicionais para esta metade:</p>
                <div className="mt-2 space-y-2">
                  {secondHalfProduct.additions.map((addition) => (
                    <label key={addition.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={secondHalfAdditions.some(a => a.id === addition.id)}
                        onChange={() => handleToggleSecondHalfAddition(addition)}
                        className="h-4 w-4 rounded border-zinc-300 text-krato-500 focus:ring-krato-500"
                      />
                      <span className="ml-2 flex items-center justify-between w-full">
                        <span className="text-xs text-zinc-700">{addition.name}</span>
                        <span className="text-xs font-medium text-zinc-900">
                          + {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(addition.price)}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 