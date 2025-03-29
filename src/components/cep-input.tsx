'use client'

import { useState, useEffect } from 'react'
import { PatternFormat } from 'react-number-format'
import { fetchAddressWithValidation, formatCep, isValidCepFormat } from '@/services/cepService'
import { toast } from 'react-hot-toast'

interface CepInputProps {
  value: string
  onChange: (value: string, isValid: boolean) => void
  onAddressFound?: (address: {
    street: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }) => void
  disabled?: boolean
  required?: boolean
  showValidation?: boolean
  className?: string
  placeholder?: string
  label?: string
  errorMessage?: string
}

export function CepInput({
  value,
  onChange,
  onAddressFound,
  disabled = false,
  required = false,
  showValidation = true,
  className = '',
  placeholder = 'CEP',
  label = 'CEP',
  errorMessage = 'CEP inválido'
}: CepInputProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isValid, setIsValid] = useState(true)
  const [isTouched, setIsTouched] = useState(false)
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null)

  // Limpa o timeout quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout)
      }
    }
  }, [validationTimeout])

  // Valida o CEP quando o valor muda
  const handleChange = (values: { value: string }) => {
    const newValue = values.value
    
    // Atualiza o valor
    onChange(newValue, isValidCepFormat(newValue))
    
    // Marca como tocado
    if (newValue && !isTouched) {
      setIsTouched(true)
    }
    
    // Limpa o timeout anterior
    if (validationTimeout) {
      clearTimeout(validationTimeout)
    }
    
    // Se o CEP tiver 8 dígitos, valida após um pequeno delay
    if (newValue.replace(/\D/g, '').length === 8) {
      const timeout = setTimeout(() => {
        validateAndFetchAddress(newValue)
      }, 500)
      
      setValidationTimeout(timeout)
    } else {
      // Se não tiver 8 dígitos e foi tocado, marca como inválido
      if (isTouched && showValidation) {
        setIsValid(false)
      }
    }
  }

  // Valida o CEP e busca o endereço
  const validateAndFetchAddress = async (cep: string) => {
    setIsLoading(true)
    
    try {
      const result = await fetchAddressWithValidation(cep)
      
      if (result.isValid && result.address) {
        setIsValid(true)
        
        // Notifica o componente pai sobre o endereço encontrado
        if (onAddressFound) {
          onAddressFound({
            street: result.address.street,
            neighborhood: result.address.neighborhood,
            city: result.address.city,
            state: result.address.state,
            zipCode: result.address.zipCode
          })
        }
      } else {
        setIsValid(false)
        
        // Exibe mensagem de erro
        if (showValidation) {
          toast.error(result.error || 'CEP inválido')
        }
      }
    } catch (error) {
      console.error('Erro ao validar CEP:', error)
      setIsValid(false)
      
      // Exibe mensagem de erro
      if (showValidation) {
        toast.error('Erro ao validar CEP')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <PatternFormat
          format="#####-###"
          value={value}
          onValueChange={handleChange}
          className={`w-full rounded-md border ${
            !isValid && isTouched && showValidation
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 sm:text-sm ${className}`}
          placeholder={placeholder}
          disabled={disabled || isLoading}
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="h-5 w-5 animate-spin text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}
      </div>
      
      {!isValid && isTouched && showValidation && (
        <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  )
} 