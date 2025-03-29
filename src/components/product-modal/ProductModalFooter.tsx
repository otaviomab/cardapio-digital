'use client'

import { DialogFooter } from '@/components/ui/dialog'
import { Product, Addition } from '@/types/restaurant'

interface ProductModalFooterProps {
  product: Product
  quantity: number
  selectedAdditions: string[]
  isHalfHalf: boolean
  secondHalfProduct: Product | null
  firstHalfAdditions: Addition[]
  secondHalfAdditions: Addition[]
  onAddToCart: () => void
}

export function ProductModalFooter({
  product,
  quantity,
  selectedAdditions,
  isHalfHalf,
  secondHalfProduct,
  firstHalfAdditions,
  secondHalfAdditions,
  onAddToCart
}: ProductModalFooterProps) {
  // Calcula o preço com base no tipo de produto (normal ou meia-a-meia)
  const calculatePrice = () => {
    if (isHalfHalf && secondHalfProduct) {
      // Cálculo para meia-pizza: média dos preços base + média dos adicionais
      const basePrice = Math.max(product.price / 2, secondHalfProduct.price / 2) * 2
      
      // Calcula o preço dos adicionais da primeira metade
      const firstHalfAdditionsPrice = firstHalfAdditions.reduce(
        (total, addition) => total + addition.price / 2,
        0
      )
      
      // Calcula o preço dos adicionais da segunda metade
      const secondHalfAdditionsPrice = secondHalfAdditions.reduce(
        (total, addition) => total + addition.price / 2,
        0
      )
      
      return basePrice + firstHalfAdditionsPrice + secondHalfAdditionsPrice
    } else {
      // Cálculo para produto normal
      const additionsPrice = selectedAdditions.reduce((total, additionId) => {
        const addition = product.additions?.find(a => a.id === additionId)
        return total + (addition?.price || 0)
      }, 0)
      
      return (product.price + additionsPrice) * quantity
    }
  }

  return (
    <DialogFooter>
      <div className="flex w-full items-center justify-between">
        <div className="text-lg font-bold text-zinc-900">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(calculatePrice())}
        </div>
        <button
          onClick={onAddToCart}
          disabled={isHalfHalf && (!secondHalfProduct)}
          className={`rounded-full px-8 py-3 font-medium text-white transition-colors ${
            isHalfHalf && (!secondHalfProduct)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-krato-500 hover:bg-krato-600'
          }`}
        >
          Adicionar ao Carrinho
        </button>
      </div>
    </DialogFooter>
  )
} 