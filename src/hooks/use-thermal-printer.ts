'use client'

import { useState, useCallback, useEffect } from 'react'

// Lista de fabricantes comuns de impressoras térmicas
const PRINTER_VENDORS = [
  { id: 0x0483, name: 'Bematech' }, // Bematech
  { id: 0x0416, name: 'Elgin' }, // Elgin
  { id: 0x067b, name: 'Daruma' }, // Daruma
  { id: 0x04b8, name: 'Epson' }, // Epson
  { id: 0x0525, name: 'Tanca' }, // Tanca
  { id: 0x0dd4, name: 'Custom' }, // Custom
  // Adicionar outros fabricantes conforme necessário
]

interface UseThermalPrinterReturn {
  isPrinting: boolean;
  isSupported: boolean;
  hasPrinterAccess: boolean;
  printerName: string | null;
  requestPrinterAccess: () => Promise<boolean>;
  print: (data: Uint8Array) => Promise<boolean>;
  error: string | null;
}

export function useThermalPrinter(): UseThermalPrinterReturn {
  const [isPrinting, setIsPrinting] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [hasPrinterAccess, setHasPrinterAccess] = useState(false)
  const [printerName, setPrinterName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [device, setDevice] = useState<USBDevice | null>(null)

  // Verificar suporte à WebUSB API
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.usb) {
      setIsSupported(true)
      
      // Tentar recuperar dispositivos já autorizados
      navigator.usb.getDevices()
        .then((devices) => {
          if (devices.length > 0) {
            setDevice(devices[0])
            setHasPrinterAccess(true)
            setPrinterName(devices[0].productName || 'Impressora Térmica')
          }
        })
        .catch(err => {
          console.error('Erro ao buscar dispositivos USB:', err)
        })
    }
  }, [])

  // Solicitar acesso à impressora
  const requestPrinterAccess = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('WebUSB não é suportado neste navegador')
      return false
    }

    try {
      console.log("📋 Solicitando acesso a dispositivos USB...")
      
      // Solicitar qualquer dispositivo USB sem filtros
      // Isso mostrará todos os dispositivos USB disponíveis
      const selectedDevice = await navigator.usb.requestDevice({
        filters: [] // Lista vazia para mostrar todos os dispositivos
      })
      
      // Registrar informações do dispositivo para depuração
      console.log("✅ Dispositivo selecionado:", selectedDevice)
      console.log("📌 Nome do produto:", selectedDevice.productName)
      console.log("📌 Fabricante:", selectedDevice.manufacturerName)
      console.log("📌 ID do fabricante: 0x" + selectedDevice.vendorId.toString(16).padStart(4, '0'))
      console.log("📌 ID do produto: 0x" + selectedDevice.productId.toString(16).padStart(4, '0'))
      console.log("📌 Versão:", selectedDevice.deviceVersionMajor + "." + 
                 selectedDevice.deviceVersionMinor + "." + 
                 selectedDevice.deviceVersionSubminor)
      console.log("📌 Configurações:", selectedDevice.configurations)
      
      setDevice(selectedDevice)
      setHasPrinterAccess(true)
      setPrinterName(
        `${selectedDevice.manufacturerName || ''} ${selectedDevice.productName || 'Dispositivo USB'} (ID: 0x${selectedDevice.vendorId.toString(16).padStart(4, '0')})`
      )
      setError(null)
      return true
    } catch (err: any) {
      // Usuário cancelou a seleção (não é um erro real)
      if (err.name === 'NotFoundError') {
        setError('Nenhum dispositivo USB foi selecionado. Verifique se sua impressora está conectada corretamente.')
      } else {
        setError(`Erro ao acessar dispositivo: ${err.message}`)
        console.error('Erro ao acessar dispositivo USB:', err)
      }
      return false
    }
  }, [isSupported])

  // Imprimir dados
  const print = useCallback(async (data: Uint8Array): Promise<boolean> => {
    if (!device) {
      setError('Nenhum dispositivo conectado')
      return false
    }

    setIsPrinting(true)
    setError(null)

    try {
      // Abrir conexão se necessário
      if (!device.opened) {
        await device.open()
      }

      // Reivindicar interface
      try {
        await device.selectConfiguration(1)
        await device.claimInterface(0)
      } catch (e) {
        // Algumas impressoras podem usar configurações diferentes ou já ter a interface reivindicada
        try {
          await device.releaseInterface(0)
          await device.claimInterface(0)
        } catch (err) {
          console.log('Erro ao reivindicar interface, mas tentando continuar:', err)
        }
      }

      // Encontrar endpoint de saída
      const outEndpoint = device.configuration?.interfaces[0]?.alternate?.endpoints.find(
        ep => ep.direction === 'out'
      )
      
      if (!outEndpoint) {
        throw new Error('Não foi possível encontrar endpoint de saída do dispositivo')
      }
      
      // Enviar dados para o dispositivo
      await device.transferOut(outEndpoint.endpointNumber, data)
      
      return true
    } catch (err: any) {
      setError(`Erro ao imprimir: ${err.message}`)
      console.error('Erro ao imprimir:', err)
      return false
    } finally {
      // Tentar fechar o dispositivo após a impressão
      try {
        if (device.opened) {
          await device.close()
        }
      } catch (e) {
        console.log('Erro ao fechar conexão com o dispositivo:', e)
      }
      
      setIsPrinting(false)
    }
  }, [device])

  return {
    isPrinting,
    isSupported,
    hasPrinterAccess,
    printerName,
    requestPrinterAccess,
    print,
    error
  }
} 