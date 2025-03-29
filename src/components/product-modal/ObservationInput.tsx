'use client'

interface ObservationInputProps {
  observation: string
  setObservation: (observation: string) => void
  disabled?: boolean
}

export function ObservationInput({
  observation,
  setObservation,
  disabled = false
}: ObservationInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="observation" className="text-sm font-medium text-zinc-900">
        Alguma observação?
      </label>
      <textarea
        id="observation"
        value={observation}
        onChange={(e) => setObservation(e.target.value)}
        placeholder="Ex: Sem cebola, molho à parte..."
        disabled={disabled}
        className={`h-24 w-full resize-none rounded-lg border border-zinc-200 p-2 text-sm text-zinc-900 focus:border-krato-600 focus:outline-none focus:ring-1 focus:ring-krato-600 ${
          disabled ? 'bg-gray-100' : ''
        }`}
      />
    </div>
  )
} 