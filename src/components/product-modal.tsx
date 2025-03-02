'use client'

import Image from 'next/image'
import { Minus, Plus, Pizza } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Product, RestaurantType, Addition } from '@/types/restaurant'
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
  const [quantity, setQuantity] = useState(1)
  const [observation, setObservation] = useState('')
  const [selectedAdditions, setSelectedAdditions] = useState<string[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isHalfHalf, setIsHalfHalf] = useState(false)
  
  // Inicializa os estados para meia a meia
  const [secondHalfProduct, setSecondHalfProduct] = useState<Product | null>(null)
  const [firstHalfAdditions, setFirstHalfAdditions] = useState<Addition[]>([])
  const [secondHalfAdditions, setSecondHalfAdditions] = useState<Addition[]>([])
  
  const addItem = useCartStore((state) => state.addItem)
  const addHalfHalfItem = useCartStore((state) => state.addHalfHalfItem)

  // Verifica se o restaurante é uma pizzaria e se o produto permite meia a meia
  const isPizzeria = restaurantType === RestaurantType.PIZZARIA
  const canBeHalfHalf = isPizzeria && product.allowHalfHalf
  
  // Quando o checkbox de meia a meia é alterado
  const handleHalfHalfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsHalfHalf(checked);
    
    if (!checked) {
      // Se desmarcado, limpa as seleções
      setSecondHalfProduct(null);
      setFirstHalfAdditions([]);
      setSecondHalfAdditions([]);
    }
  };

  // Função para selecionar o segundo sabor
  const handleSelectSecondHalf = (selectedProduct: Product) => {
    setSecondHalfProduct(selectedProduct);
  }

  // Função para alternar adicionais do primeiro sabor
  const handleToggleFirstHalfAddition = (addition: Addition) => {
    setFirstHalfAdditions(prev => 
      prev.find(a => a.id === addition.id)
        ? prev.filter(a => a.id !== addition.id)
        : [...prev, addition]
    );
  }

  // Função para alternar adicionais do segundo sabor
  const handleToggleSecondHalfAddition = (addition: Addition) => {
    setSecondHalfAdditions(prev => 
      prev.find(a => a.id === addition.id)
        ? prev.filter(a => a.id !== addition.id)
        : [...prev, addition]
    );
  }

  const handleAddToCart = () => {
    if (isHalfHalf && secondHalfProduct) {
      // Adiciona uma pizza meio a meio
      addHalfHalfItem({
        product,
        quantity,
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
      // Adiciona um produto normal
      addItem({
        product,
        quantity,
        observation,
        selectedAdditions:
          product.additions?.filter((addition) =>
            selectedAdditions.includes(addition.id),
          ) ?? [],
      })
    }

    // Reseta os estados
    setQuantity(1)
    setObservation('')
    setSelectedAdditions([])
    setIsHalfHalf(false)
    setSecondHalfProduct(null)
    setFirstHalfAdditions([])
    setSecondHalfAdditions([])

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
      setIsHalfHalf(false)
      setSecondHalfProduct(null)
      setFirstHalfAdditions([])
      setSecondHalfAdditions([])
    }
  }

  // Reseta os estados quando o modal do produto é fechado
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

  // Produtos que permitem meia a meia
  const halfHalfProducts = products.filter(p => p.allowHalfHalf)

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
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="rounded-lg object-cover"
                />
              </div>
            )}
            <DialogTitle className="text-xl text-zinc-900">{product.name}</DialogTitle>
            <p className="text-sm text-zinc-900">{product.description}</p>
          </DialogHeader>

          {/* Opção de Meia-Pizza para pizzarias */}
          {canBeHalfHalf && (
            <div className="mb-4">
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
                <div className="mt-4 rounded-lg border border-zinc-200 p-4 space-y-6">
                  {/* Informações da seleção */}
                  <div className="rounded-lg border border-zinc-200 p-4">
                    <h3 className="text-lg font-bold text-zinc-900">Sua pizza meio a meio</h3>
                    
                    <div className="mt-3">
                      <p className="text-sm font-medium text-zinc-700">Primeira metade:</p>
                      <p className="text-sm text-zinc-900">{product.name}</p>
                      
                      {firstHalfAdditions.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-zinc-500">Adicionais:</p>
                          <ul className="ml-2 text-xs text-zinc-700">
                            {firstHalfAdditions.map(addition => (
                              <li key={addition.id}>• {addition.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm font-medium text-zinc-700">Segunda metade:</p>
                      <p className="text-sm text-zinc-900">{secondHalfProduct?.name || 'Selecione abaixo'}</p>
                      
                      {secondHalfProduct && secondHalfAdditions.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-zinc-500">Adicionais:</p>
                          <ul className="ml-2 text-xs text-zinc-700">
                            {secondHalfAdditions.map(addition => (
                              <li key={addition.id}>• {addition.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 text-sm text-zinc-500">
                      <p>O valor será calculado com base no sabor mais caro.</p>
                    </div>
                  </div>
                  
                  {/* Primeira metade */}
                  <div className="space-y-2">
                    <h3 className="text-md font-medium text-zinc-900">Primeira metade (selecionada):</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="rounded-lg border p-2 border-krato-500 bg-krato-50">
                        <p className="text-sm font-medium text-zinc-900">{product.name}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Adicionais da primeira metade */}
                  {product.additions && product.additions.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-md font-medium text-zinc-900">Adicionais para a primeira metade:</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {product.additions.map(addition => (
                          <label
                            key={`first-addition-${addition.id}`}
                            className={`flex cursor-pointer items-center justify-between rounded-lg border p-2 ${
                              firstHalfAdditions.find(a => a.id === addition.id)
                                ? 'border-krato-500 bg-krato-50'
                                : 'border-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!firstHalfAdditions.find(a => a.id === addition.id)}
                                onChange={() => handleToggleFirstHalfAddition(addition)}
                                className="h-4 w-4 rounded border-zinc-300 text-krato-500 focus:ring-krato-500"
                              />
                              <span className="text-sm text-zinc-900">{addition.name}</span>
                            </div>
                            <span className="text-xs font-medium text-zinc-900">
                              + {(addition.price / 2).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Seleção da segunda metade */}
                  <div className="space-y-2">
                    <h3 className="text-md font-medium text-zinc-900">Selecione a segunda metade:</h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {halfHalfProducts.map(p => (
                        <div 
                          key={`second-half-${p.id}`}
                          onClick={() => handleSelectSecondHalf(p)}
                          className={`cursor-pointer rounded-lg border p-2 hover:border-krato-500 ${
                            secondHalfProduct?.id === p.id ? 'border-krato-500 bg-krato-50' : 'border-zinc-200'
                          }`}
                        >
                          <p className="text-center text-sm font-medium text-zinc-900">{p.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Adicionais da segunda metade */}
                  {secondHalfProduct?.additions && secondHalfProduct.additions.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-md font-medium text-zinc-900">Adicionais para a segunda metade:</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {secondHalfProduct.additions.map(addition => (
                          <label
                            key={`second-addition-${addition.id}`}
                            className={`flex cursor-pointer items-center justify-between rounded-lg border p-2 ${
                              secondHalfAdditions.find(a => a.id === addition.id)
                                ? 'border-krato-500 bg-krato-50'
                                : 'border-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!secondHalfAdditions.find(a => a.id === addition.id)}
                                onChange={() => handleToggleSecondHalfAddition(addition)}
                                className="h-4 w-4 rounded border-zinc-300 text-krato-500 focus:ring-krato-500"
                              />
                              <span className="text-sm text-zinc-900">{addition.name}</span>
                            </div>
                            <span className="text-xs font-medium text-zinc-900">
                              + {(addition.price / 2).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quantidade - Não mostrar se for meia-pizza */}
          {(!isHalfHalf || !canBeHalfHalf) && (
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
          )}

          {/* Adicionais - Não mostrar se for meia-pizza */}
          {(!isHalfHalf || !canBeHalfHalf) && product.additions && product.additions.length > 0 && (
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
                        className="h-4 w-4 rounded border-zinc-300 text-krato-500 focus:ring-krato-500"
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
              className="h-24 w-full resize-none rounded-lg border border-zinc-200 p-2 text-sm text-zinc-900 focus:border-krato-600 focus:outline-none focus:ring-1 focus:ring-krato-600"
            />
          </div>

          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              <div className="text-lg font-bold text-zinc-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(
                  isHalfHalf && secondHalfProduct
                    ? // Cálculo para meia-pizza
                      Math.max(
                        product.price / 2,
                        secondHalfProduct.price / 2
                      ) * 2
                    : // Cálculo para produto normal
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
        </DialogContent>
      </Dialog>

      <AddToCartDialog
        open={showConfirmation}
        onOpenChange={handleConfirmationClose}
      />
    </>
  )
} 