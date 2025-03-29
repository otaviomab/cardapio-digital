'use client'

import { useState, useEffect } from 'react'
import { Product, Addition } from '@/types/restaurant'

interface PizzaHalfSelectorProps {
  products: Product[]
  currentProduct: Product
  onSelect: (firstHalf: {
    product: Product
    selectedAdditions: Addition[]
  }, secondHalf: {
    product: Product
    selectedAdditions: Addition[]
  }) => void
}

export function PizzaHalfSelector({ products, currentProduct, onSelect }: PizzaHalfSelectorProps) {
  // Inicializa o firstHalf com o produto atual
  const [firstHalf] = useState<Product>(currentProduct)
  const [secondHalf, setSecondHalf] = useState<Product | null>(null)
  const [firstHalfAdditions, setFirstHalfAdditions] = useState<Addition[]>([])
  const [secondHalfAdditions, setSecondHalfAdditions] = useState<Addition[]>([])
  
  // Filtra apenas produtos que permitem meia a meia
  const pizzaProducts = products.filter(product => product.allowHalfHalf)
  
  // Log para depuração
  console.log('PizzaHalfSelector - Produtos disponíveis:', {
    totalProdutos: products.length,
    produtosMeiaAMeia: pizzaProducts.length,
    produtosMeiaAMeiaDetalhes: pizzaProducts.map(p => ({
      id: p.id,
      name: p.name,
      allowHalfHalf: p.allowHalfHalf
    }))
  })
  
  // Notifica o componente pai quando a segunda metade é selecionada
  useEffect(() => {
    if (secondHalf) {
      onSelect(
        { product: firstHalf, selectedAdditions: firstHalfAdditions },
        { product: secondHalf, selectedAdditions: secondHalfAdditions }
      )
    }
  }, [secondHalf, firstHalf, firstHalfAdditions, secondHalfAdditions, onSelect])
  
  // Função para alternar a seleção de adicionais para a primeira metade
  const toggleFirstHalfAddition = (addition: Addition) => {
    setFirstHalfAdditions(prev => 
      prev.find(a => a.id === addition.id)
        ? prev.filter(a => a.id !== addition.id)
        : [...prev, addition]
    )
  }
  
  // Função para alternar a seleção de adicionais para a segunda metade
  const toggleSecondHalfAddition = (addition: Addition) => {
    setSecondHalfAdditions(prev => 
      prev.find(a => a.id === addition.id)
        ? prev.filter(a => a.id !== addition.id)
        : [...prev, addition]
    )
  }

  return (
    <div className="space-y-6">
      {/* Informações da seleção */}
      <div className="rounded-lg border border-zinc-200 p-4">
        <h3 className="text-lg font-bold text-zinc-900">Sua pizza meio a meio</h3>
        
        <div className="mt-3">
          <p className="text-sm font-medium text-zinc-700">Primeira metade:</p>
          <p className="text-sm text-zinc-900">{firstHalf?.name || 'Selecione abaixo'}</p>
          
          {firstHalf && firstHalfAdditions.length > 0 && (
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
          <p className="text-sm text-zinc-900">{secondHalf?.name || 'Selecione abaixo'}</p>
          
          {secondHalf && secondHalfAdditions.length > 0 && (
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
      
      {/* Seleção da primeira metade */}
      <div className="space-y-2">
        <h3 className="text-md font-medium text-zinc-900">Primeira metade (selecionada):</h3>
        <div className="grid grid-cols-1 gap-2">
          <div className="rounded-lg border p-2 border-krato-500 bg-krato-50">
            <p className="text-sm font-medium text-zinc-900">{currentProduct.name}</p>
          </div>
        </div>
      </div>
      
      {/* Adicionais da primeira metade */}
      {firstHalf?.additions && firstHalf.additions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-md font-medium text-zinc-900">Adicionais para a primeira metade:</h3>
          <div className="grid grid-cols-2 gap-2">
            {firstHalf.additions.map(addition => (
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
                    onChange={() => toggleFirstHalfAddition(addition)}
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
          {pizzaProducts.map(product => (
            <div 
              key={`second-${product.id}`}
              onClick={() => setSecondHalf(product)}
              className={`cursor-pointer rounded-lg border p-2 hover:border-krato-500 ${
                secondHalf?.id === product.id ? 'border-krato-500 bg-krato-50' : 'border-zinc-200'
              }`}
            >
              <p className="text-center text-sm font-medium text-zinc-900">{product.name}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Adicionais da segunda metade */}
      {secondHalf?.additions && secondHalf.additions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-md font-medium text-zinc-900">Adicionais para a segunda metade:</h3>
          <div className="grid grid-cols-2 gap-2">
            {secondHalf.additions.map(addition => (
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
                    onChange={() => toggleSecondHalfAddition(addition)}
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
  )
} 