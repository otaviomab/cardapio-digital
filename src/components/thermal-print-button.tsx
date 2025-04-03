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
      // Verificar categorias antes da impressão
      if (order && order.items && Array.isArray(order.items)) {
        // Processa itens meio a meio
        for (const item of order.items) {
          // Garante que itens meio a meio tenham categorias em ambas as partes
          if (item.isHalfHalf && item.halfHalf) {
            console.log('[IMPRESSÃO] Processando item meio a meio para impressão:', item.name);
            
            // Verifica se as categorias já existem
            const firstHalfHasCategory = !!(item.halfHalf.firstHalf && item.halfHalf.firstHalf.category);
            const secondHalfHasCategory = !!(item.halfHalf.secondHalf && item.halfHalf.secondHalf.category);
            
            console.log('[IMPRESSÃO] Status das categorias:', {
              firstHalf: firstHalfHasCategory ? item.halfHalf.firstHalf.category : 'ausente',
              secondHalf: secondHalfHasCategory ? item.halfHalf.secondHalf.category : 'ausente'
            });
            
            // Cria objetos se não existirem
            if (!item.halfHalf.firstHalf) item.halfHalf.firstHalf = {};
            if (!item.halfHalf.secondHalf) item.halfHalf.secondHalf = {};
            
            // Se a categoria principal existe, usa ela como fallback
            if (!firstHalfHasCategory) {
              if (item.category) {
                item.halfHalf.firstHalf.category = item.category;
                console.log('[IMPRESSÃO] Usando categoria principal para primeira metade:', item.category);
              } else {
                // Se nem a categoria principal existe, usa "Lanches" como fallback para pizzas
                item.halfHalf.firstHalf.category = 'Lanches';
                console.log('[IMPRESSÃO] Usando categoria Lanches para primeira metade');
              }
            }
            
            if (!secondHalfHasCategory) {
              if (item.category) {
                item.halfHalf.secondHalf.category = item.category;
                console.log('[IMPRESSÃO] Usando categoria principal para segunda metade:', item.category);
              } else {
                // Se nem a categoria principal existe, usa "Lanches" como fallback para pizzas
                item.halfHalf.secondHalf.category = 'Lanches';
                console.log('[IMPRESSÃO] Usando categoria Lanches para segunda metade');
              }
            }
          } else if (!item.category) {
            // Para itens normais sem categoria
            item.category = 'Lanches';
          }
        }
        
        // Log do objeto final para debug
        console.log('[IMPRESSÃO] Objeto final para impressão:', JSON.stringify(order, null, 2));
      }

      // Envia para impressão com categorias atualizadas
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