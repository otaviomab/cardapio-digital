'use client'

import { useState, useEffect } from 'react'
import { Printer, RefreshCw, Save, TestTube } from 'lucide-react'
import { PrinterTypes, CharacterSet, PrinterConfig, PrinterStatus } from '@/types/printer'

const PRINTER_SERVER = process.env.NEXT_PUBLIC_PRINTER_SERVER || 'http://localhost:3002'

const defaultConfig: PrinterConfig = {
  type: PrinterTypes.EPSON,
  interface: 'GEZHI_micro_printer',
  characterSet: CharacterSet.PC860_PORTUGUESE,
  removeSpecialCharacters: false,
  timeout: 5000
}

export default function PrinterSettingsPage() {
  const [config, setConfig] = useState<PrinterConfig>(defaultConfig)
  const [status, setStatus] = useState<PrinterStatus>({
    connected: false,
    status: 'offline'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        // Tenta verificar se o servidor está online
        const response = await fetch(`${PRINTER_SERVER}/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error('Servidor da impressora não está respondendo')
        }
        
        // Se o servidor estiver online, carrega as configurações
        await loadConfig()
        await checkStatus()
      } catch (error) {
        console.error('Erro ao inicializar:', error)
        setError('Não foi possível conectar ao servidor da impressora. Verifique se o servidor está rodando.')
        setIsLoading(false)
      }
    }

    init()
  }, [])

  const loadConfig = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`${PRINTER_SERVER}/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Falha ao carregar configurações')
      }
      
      const data = await response.json()
      setConfig({
        ...defaultConfig,
        ...data
      })
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      setError('Não foi possível carregar as configurações da impressora')
    } finally {
      setIsLoading(false)
    }
  }

  const checkStatus = async () => {
    try {
      setIsRefreshing(true)
      setError(null)
      
      const response = await fetch(`${PRINTER_SERVER}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Falha ao verificar status')
      }
      
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Erro ao verificar status:', error)
      setStatus({
        connected: false,
        status: 'error',
        error: 'Falha ao verificar status da impressora'
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    try {
      setIsSaving(true)
      setError(null)
      
      const response = await fetch(`${PRINTER_SERVER}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao salvar configurações')
      }
      
      alert('Configurações salvas com sucesso!')
      await checkStatus()
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      setError(error instanceof Error ? error.message : 'Não foi possível salvar as configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    try {
      setIsTesting(true)
      setError(null)
      
      const response = await fetch(`${PRINTER_SERVER}/test-print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha no teste de impressão')
      }
      
      alert('Teste de impressão realizado com sucesso!')
    } catch (error) {
      console.error('Erro no teste de impressão:', error)
      setError(error instanceof Error ? error.message : 'Falha ao realizar teste de impressão')
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-green-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Configurações da Impressora</h1>
          <p className="text-sm text-zinc-600">Configure sua impressora térmica para impressão de pedidos</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={checkStatus}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar Status
          </button>
        </div>
      </div>

      {/* Status da Impressora */}
      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <Printer className="h-6 w-6 text-zinc-400" />
          <div>
            <h2 className="text-lg font-medium text-zinc-900">Status da Impressora</h2>
            <p className="text-sm text-zinc-600">
              {status?.connected ? 'Conectada' : 'Desconectada'} ·{' '}
              {status?.status === 'error' ? status.error : status?.status}
            </p>
          </div>
        </div>
      </div>

      {/* Formulário de Configuração */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 p-6">
          <h2 className="text-lg font-medium text-zinc-900">Configurações</h2>
          <p className="text-sm text-zinc-600">Ajuste as configurações da sua impressora térmica</p>
        </div>

        <div className="p-6">
          <div className="grid gap-6">
            {/* Tipo da Impressora */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-900">
                Tipo da Impressora
              </label>
              <select
                value={config.type}
                onChange={(e) => setConfig({ ...config, type: e.target.value as PrinterTypes })}
                className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-900"
              >
                {Object.values(PrinterTypes).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Interface */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-900">
                Interface (Nome/Caminho da Impressora)
              </label>
              <input
                type="text"
                value={config.interface}
                onChange={(e) => setConfig({ ...config, interface: e.target.value })}
                placeholder="Ex: GEZHI_micro_printer"
                className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-900"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Nome da impressora no CUPS: GEZHI_micro_printer
              </p>
            </div>

            {/* Conjunto de Caracteres */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-900">
                Conjunto de Caracteres
              </label>
              <select
                value={config.characterSet}
                onChange={(e) => setConfig({ ...config, characterSet: e.target.value as CharacterSet })}
                className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-900"
              >
                {Object.values(CharacterSet).map((charset) => (
                  <option key={charset} value={charset}>
                    {charset}
                  </option>
                ))}
              </select>
            </div>

            {/* Timeout */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-900">
                Timeout (ms)
              </label>
              <input
                type="number"
                value={config.timeout || 5000}
                onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
                placeholder="5000"
                className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-900"
              />
            </div>

            {/* Remover Caracteres Especiais */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="removeSpecialCharacters"
                checked={config.removeSpecialCharacters || false}
                onChange={(e) => setConfig({ ...config, removeSpecialCharacters: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-300 text-green-600"
              />
              <label htmlFor="removeSpecialCharacters" className="text-sm text-zinc-900">
                Remover caracteres especiais
              </label>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-200 p-6">
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
            >
              <TestTube className="h-4 w-4" />
              {isTesting ? 'Testando...' : 'Testar Impressão'}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 