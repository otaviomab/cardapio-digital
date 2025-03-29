'use client'

import { Minus, Plus } from 'lucide-react'

interface ProductQuantityControlProps {
  quantity: number
  setQuantity: (quantity: number) => void
  disabled?: boolean
}

export function ProductQuantityControl({ 
  quantity, 
  setQuantity, 
  disabled = false 
}: ProductQuantityControlProps) {
  const decreaseQuantity = () => {
    if (quantity > 1 && !disabled) {
      setQuantity(quantity - 1)
    }
  }

  const increaseQuantity = () => {
    if (!disabled) {
      setQuantity(quantity + 1)
    }
  }

  return (
    <div className="mb-6 space-y-2">
      <label className="text-sm font-medium text-zinc-900">
        Quantidade
      </label>
      <div className="flex items-center">
        <button
          type="button"
          onClick={decreaseQuantity}
          disabled={quantity <= 1 || disabled}
          className={`h-8 w-8 rounded-full ${
            quantity <= 1 || disabled ? 'bg-gray-200 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Minus className="mx-auto h-4 w-4" />
        </button>
        <span className="mx-4 w-8 text-center font-medium text-zinc-900">
          {quantity}
        </span>
        <button
          type="button"
          onClick={increaseQuantity}
          disabled={disabled}
          className={`h-8 w-8 rounded-full ${
            disabled ? 'bg-gray-200 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Plus className="mx-auto h-4 w-4" />
        </button>
      </div>
    </div>
  )
} 