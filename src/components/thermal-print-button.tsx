'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useThermalPrinter } from '@/hooks/use-thermal-printer'
import { formatOrderForPrinting } from '@/services/thermal-printer-service'

interface ThermalPrintButtonProps {
  order: any // Substituir pelo tipo Order quando disponível
  restaurantName?: string
}

export function ThermalPrintButton({ 
  order, 
  restaurantName = "KRATO CARDÁPIO DIGITAL" 
}: ThermalPrintButtonProps) {
  const [isRequesting, setIsRequesting] = useState(false)
  const { toast } = useToast()
  const {
    isPrinting,
    isSupported,
    hasPrinterAccess,
    printerName,
    requestPrinterAccess,
    print,
    error
  } = useThermalPrinter()

  const handlePrint = async () => {
    try {
      // Se não tiver acesso à impressora, solicita
      if (!hasPrinterAccess) {
        setIsRequesting(true)
        const granted = await requestPrinterAccess()
        setIsRequesting(false)
        
        if (!granted) {
          throw new Error('Não foi possível obter acesso à impressora')
        }
      }
      
      // Formata o pedido para impressão
      const printData = formatOrderForPrinting(order, restaurantName)
      
      // Envia para impressão
      const success = await print(printData)
      
      if (success) {
        toast({
          title: 'Pedido enviado para impressão',
          description: 'O pedido foi enviado com sucesso para a impressora térmica.',
          variant: 'success'
        })
      } else {
        throw new Error(error || 'Erro desconhecido ao imprimir')
      }
    } catch (err: any) {
      console.error('Erro ao imprimir:', err)
      toast({
        title: 'Erro ao imprimir',
        description: err.message || 'Não foi possível comunicar com a impressora térmica.',
        variant: 'destructive'
      })
    }
  }

  // Se o WebUSB não for suportado, mostra botão desabilitado
  if (!isSupported) {
    return (
      <Button
        variant="default"
        size="sm"
        disabled
        title="WebUSB não é suportado neste navegador. Tente usar Chrome ou Edge."
        className="flex items-center gap-2 bg-slate-200 text-black"
      >
        <Printer size={16} />
        Impressão não suportada
      </Button>
    )
  }

  return (
    <Button 
      variant="default" 
      size="sm"
      onClick={handlePrint}
      disabled={isPrinting || isRequesting}
      className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-black"
    >
      <Printer size={16} />
      {isPrinting 
        ? 'Imprimindo...' 
        : isRequesting 
          ? 'Conectando...' 
          : hasPrinterAccess 
            ? `Imprimir (${printerName})` 
            : 'Imprimir via USB'
      }
    </Button>
  )
} 