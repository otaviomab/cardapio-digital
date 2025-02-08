'use client'

import Image from 'next/image'
import { Minus, Plus, Store } from 'lucide-react'
import { useState } from 'react'
import { Product } from '@/types/restaurant'
import { useCartStore } from '@/stores/cart-store'
import { AddToCartDialog } from '@/components/add-to-cart-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface ProductModalProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToCart: () => void
}

export function ProductModal({ product, open, onOpenChange, onAddToCart }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [observation, setObservation] = useState('')
  const [selectedAdditions, setSelectedAdditions] = useState<string[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = () => {
    addItem({
      product,
      quantity,
      observation,
      selectedAdditions:
        product.additions?.filter((addition) =>
          selectedAdditions.includes(addition.id),
        ) ?? [],
    })

    // Reseta os estados
    setQuantity(1)
    setObservation('')
    setSelectedAdditions([])

    // Fecha o modal e notifica o pai
    onOpenChange(false)
    onAddToCart()
  }

  const handleConfirmationClose = (open: boolean) => {
    setShowConfirmation(open)
    if (!open) {
      // Resetar o estado do modal do produto
      setQuantity(1)
      setObservation('')
      setSelectedAdditions([])
    }
  }

  // Reseta os estados quando o modal do produto é fechado
  const handleProductModalClose = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen && !showConfirmation) {
      setQuantity(1)
      setObservation('')
      setSelectedAdditions([])
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleProductModalClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            {product.image && (
              <div className="relative aspect-video w-full">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
            )}
            <DialogTitle className="text-xl text-zinc-900">{product.name}</DialogTitle>
            <p className="text-sm text-zinc-900">{product.description}</p>
          </DialogHeader>

          {/* Quantidade */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-zinc-900">Quantidade:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="rounded-full bg-zinc-100 p-1.5 text-zinc-900 hover:bg-zinc-200"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium text-zinc-900">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="rounded-full bg-zinc-100 p-1.5 text-zinc-900 hover:bg-zinc-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Adicionais */}
          {product.additions && product.additions.length > 0 && (
            <div className="space-y-4">
              <span className="text-sm font-medium text-zinc-900">Adicionais:</span>
              <div className="space-y-2">
                {product.additions.map((addition) => (
                  <label
                    key={addition.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedAdditions.includes(addition.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAdditions([...selectedAdditions, addition.id])
                          } else {
                            setSelectedAdditions(
                              selectedAdditions.filter((id) => id !== addition.id),
                            )
                          }
                        }}
                        className="h-4 w-4 rounded border-zinc-300 text-green-600 focus:ring-green-600"
                      />
                      <span className="text-sm text-zinc-900">{addition.name}</span>
                    </div>
                    <span className="text-sm font-medium text-zinc-900">
                      + {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(addition.price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <label htmlFor="observation" className="text-sm font-medium text-zinc-900">
              Alguma observação?
            </label>
            <textarea
              id="observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex: Sem cebola, molho à parte..."
              className="h-24 w-full resize-none rounded-lg border border-zinc-200 p-2 text-sm text-zinc-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>

          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              <div className="text-lg font-bold text-zinc-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(
                  product.price * quantity +
                    selectedAdditions.reduce((total, additionId) => {
                      const addition = product.additions?.find(
                        (a) => a.id === additionId,
                      )
                      return total + (addition?.price || 0)
                    }, 0),
                )}
              </div>
              <button
                onClick={handleAddToCart}
                className="rounded-full bg-green-600 px-8 py-3 font-medium text-white transition-colors hover:bg-green-700"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddToCartDialog
        open={showConfirmation}
        onOpenChange={handleConfirmationClose}
      />
    </>
  )
} 