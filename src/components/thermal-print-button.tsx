'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useThermalPrinter } from '@/hooks/use-thermal-printer'

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
    print,
    error
  } = useThermalPrinter()

  const handlePrint = async () => {
    try {
      // Envia para impressão diretamente com o objeto de pedido
      const success = await print(order, restaurantName)
      
      if (success) {
        toast({
          title: 'Pedido enviado para impressão',
          description: 'O pedido foi enviado com sucesso para a impressora.',
          variant: 'success'
        })
      } else {
        throw new Error(error || 'Erro desconhecido ao imprimir')
      }
    } catch (err: any) {
      console.error('Erro ao imprimir:', err)
      toast({
        title: 'Erro ao imprimir',
        description: err.message || 'Não foi possível comunicar com a impressora.',
        variant: 'destructive'
      })
    }
  }

  return (
    <Button 
      variant="default" 
      size="sm"
      onClick={handlePrint}
      disabled={isPrinting}
      className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-black"
    >
      <Printer size={16} />
      {isPrinting 
        ? 'Imprimindo...' 
        : 'Imprimir'
      }
    </Button>
  )
} 