'use client'

import { Addition } from '@/types/restaurant'

interface AdditionsSelectorProps {
  additions?: Addition[]
  selectedAdditions: string[]
  setSelectedAdditions: (selectedAdditions: string[]) => void
  disabled?: boolean
}

export function AdditionsSelector({
  additions = [],
  selectedAdditions,
  setSelectedAdditions,
  disabled = false
}: AdditionsSelectorProps) {
  if (!additions || additions.length === 0) {
    return null
  }

  const handleToggleAddition = (additionId: string) => {
    if (disabled) return

    const isSelected = selectedAdditions.includes(additionId)
    
    if (isSelected) {
      setSelectedAdditions(selectedAdditions.filter(id => id !== additionId))
    } else {
      setSelectedAdditions([...selectedAdditions, additionId])
    }
  }

  return (
    <div className="mb-6 space-y-2">
      <p className="text-sm font-medium text-zinc-900">Adicionar complementos</p>
      <div className="space-y-2">
        {additions.map((addition) => (
          <label
            key={addition.id}
            className={`flex items-center ${disabled ? 'opacity-60' : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedAdditions.includes(addition.id)}
              onChange={() => handleToggleAddition(addition.id)}
              disabled={disabled}
              className="h-4 w-4 rounded border-zinc-300 text-krato-500 focus:ring-krato-500"
            />
            <span className="ml-2 flex w-full items-center justify-between">
              <span className="text-sm text-zinc-700">{addition.name}</span>
              <span className="text-sm font-medium text-zinc-900">
                +{' '}
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(addition.price)}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
} 