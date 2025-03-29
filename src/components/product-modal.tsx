'use client'

import { useState, useEffect } from 'react'
import { Product, RestaurantType, Addition } from '@/types/restaurant'
import { useCartStore } from '@/stores/cart-store'
import { AddToCartDialog } from '@/components/add-to-cart-dialog'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  ProductModalHeader,
  ProductQuantityControl,
  HalfHalfSelector,
  AdditionsSelector,
  ObservationInput,
  ProductModalFooter
} from '@/components/product-modal/index'

interface ProductModalProps {
  product: Product
  products?: Product[] // Lista completa de produtos para seleção de meia-pizza
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToCart: () => void
  restaurantType?: RestaurantType // Tipo do restaurante para verificar se é uma pizzaria
}

export function ProductModal({ 
  product, 
  products = [],
  open, 
  onOpenChange, 
  onAddToCart,
  restaurantType 
}: ProductModalProps) {
  // Estados
  const [quantity, setQuantity] = useState(1)
  const [observation, setObservation] = useState('')
  const [selectedAdditions, setSelectedAdditions] = useState<string[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isHalfHalf, setIsHalfHalf] = useState(false)
  const [secondHalfProduct, setSecondHalfProduct] = useState<Product | null>(null)
  const [firstHalfAdditions, setFirstHalfAdditions] = useState<Addition[]>([])
  const [secondHalfAdditions, setSecondHalfAdditions] = useState<Addition[]>([])
  
  // Store do carrinho
  const addItem = useCartStore((state) => state.addItem)
  const addHalfHalfItem = useCartStore((state) => state.addHalfHalfItem)

  // Verifica se o restaurante é uma pizzaria e se o produto permite meia a meia
  const isPizzeria = restaurantType === RestaurantType.PIZZARIA
  const canBeHalfHalf = isPizzeria && (product.allowHalfHalf || product.isPizza)

  // Log para verificação das condições que habilitam meia a meia
  useEffect(() => {
    if (open) {
      console.log('Meia a meia - debug:', {
        restaurantType,
        isPizzeria,
        productId: product.id,
        productName: product.name,
        allowHalfHalf: product.allowHalfHalf,
        isPizza: product.isPizza,
        canBeHalfHalf
      })
    }
  }, [open, product, restaurantType, isPizzeria, canBeHalfHalf])

  const handleAddToCart = () => {
    if (isHalfHalf && secondHalfProduct) {
      // Adiciona item meia a meia
      addHalfHalfItem({
        product,
        quantity: 1, // Meia a meia sempre é adicionado com quantidade 1
        observation,
        selectedAdditions: [],
        halfHalf: {
          firstHalf: {
            product,
            selectedAdditions: firstHalfAdditions
          },
          secondHalf: {
            product: secondHalfProduct,
            selectedAdditions: secondHalfAdditions
          }
        }
      })
    } else {
      // Adiciona item normal
      addItem({
        product,
        quantity,
        selectedAdditions: product.additions?.filter((addition) =>
          selectedAdditions.includes(addition.id)
        ) ?? [],
        observation
      })
    }
    
    // Mostra confirmação e depois fecha o modal
    setShowConfirmation(true)
  }

  const handleConfirmationClose = (open: boolean) => {
    setShowConfirmation(open)
    
    // Quando a confirmação for fechada, redefine o estado e fecha o modal principal
    if (!open) {
      setQuantity(1)
      setObservation('')
      setSelectedAdditions([])
      setIsHalfHalf(false)
      setSecondHalfProduct(null)
      setFirstHalfAdditions([])
      setSecondHalfAdditions([])
      onOpenChange(false)
      onAddToCart()
    }
  }

  const handleProductModalClose = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen && !showConfirmation) {
      setQuantity(1)
      setObservation('')
      setSelectedAdditions([])
      setIsHalfHalf(false)
      setSecondHalfProduct(null)
      setFirstHalfAdditions([])
      setSecondHalfAdditions([])
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleProductModalClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          {/* Cabeçalho do Modal */}
          <ProductModalHeader product={product} />
          
          {/* Controle de Quantidade */}
          {!isHalfHalf && (
            <ProductQuantityControl 
              quantity={quantity} 
              setQuantity={setQuantity} 
            />
          )}
          
          {/* Seletor de Meia-Pizza */}
          {canBeHalfHalf && (
            <HalfHalfSelector
              isHalfHalf={isHalfHalf}
              setIsHalfHalf={setIsHalfHalf}
              products={products.filter(p => p.allowHalfHalf || p.isPizza)}
              secondHalfProduct={secondHalfProduct}
              setSecondHalfProduct={setSecondHalfProduct}
              firstHalfAdditions={firstHalfAdditions}
              setFirstHalfAdditions={setFirstHalfAdditions}
              secondHalfAdditions={secondHalfAdditions}
              setSecondHalfAdditions={setSecondHalfAdditions}
              mainProduct={product}
            />
          )}
          
          {/* Seletor de Adicionais */}
          {!isHalfHalf && product.additions && product.additions.length > 0 && (
            <AdditionsSelector
              additions={product.additions}
              selectedAdditions={selectedAdditions}
              setSelectedAdditions={setSelectedAdditions}
              disabled={isHalfHalf}
            />
          )}
          
          {/* Campo de Observação */}
          <ObservationInput
            observation={observation}
            setObservation={setObservation}
          />
          
          {/* Rodapé do Modal */}
          <ProductModalFooter
            product={product}
            quantity={quantity}
            selectedAdditions={selectedAdditions}
            isHalfHalf={isHalfHalf}
            secondHalfProduct={secondHalfProduct}
            firstHalfAdditions={firstHalfAdditions}
            secondHalfAdditions={secondHalfAdditions}
            onAddToCart={handleAddToCart}
          />
        </DialogContent>
      </Dialog>

      <AddToCartDialog
        open={showConfirmation}
        onOpenChange={handleConfirmationClose}
      />
    </>
  )
} 