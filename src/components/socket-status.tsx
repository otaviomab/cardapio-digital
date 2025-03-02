'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

interface SocketStatusProps {
  connected: boolean
  restaurantId: string
  onReconnect?: () => void
}

export function SocketStatus({ connected, restaurantId, onReconnect }: SocketStatusProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [statusDetails, setStatusDetails] = useState<any>(null)
  
  const checkStatus = async () => {
    try {
      setIsChecking(true)
      const response = await fetch('/api/socket-status')
      const data = await response.json()
      setStatusDetails(data)
    } catch (error) {
      console.error('Erro ao verificar status do Socket.IO:', error)
    } finally {
      setIsChecking(false)
    }
  }
  
  const handleReconnect = async () => {
    if (!restaurantId) {
      console.error('RestaurantId não disponível para reconexão')
      return
    }
    
    try {
      setIsChecking(true)
      
      // Tenta reconectar via API
      const response = await fetch('/api/socket-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restaurantId }),
      })
      
      const data = await response.json()
      setStatusDetails(data)
      
      // Se a reconexão foi bem-sucedida, chama o callback
      if (data.success && onReconnect) {
        onReconnect()
      }
    } catch (error) {
      console.error('Erro ao reconectar ao Socket.IO:', error)
    } finally {
      setIsChecking(false)
    }
  }
  
  // Verifica o status ao montar o componente
  useEffect(() => {
    checkStatus()
  }, [])
  
  return (
    <div className="flex items-center gap-2 text-sm">
      {connected ? (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-green-700">Conectado</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-700">Desconectado</span>
        </>
      )}
      
      <button
        onClick={connected ? checkStatus : handleReconnect}
        disabled={isChecking}
        className="ml-2 flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
      >
        <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
        {connected ? 'Verificar' : 'Reconectar'}
      </button>
      
      {statusDetails && !connected && (
        <div className="ml-2 text-xs text-gray-500">
          {statusDetails.error && `Erro: ${statusDetails.error}`}
        </div>
      )}
    </div>
  )
} 