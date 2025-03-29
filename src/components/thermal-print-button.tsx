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
        // Verifica itens sem categoria
        const itemsWithoutCategory = order.items.filter(item => !item.category);
        
        if (itemsWithoutCategory.length > 0 && order.restaurantId) {
          console.log(`Encontrados ${itemsWithoutCategory.length} itens sem categoria. Tentando buscar...`);
          
          try {
            // Busca produtos para tentar encontrar categorias
            const response = await fetch(`/api/mongodb?action=getProducts&restaurantId=${order.restaurantId}`);
            if (response.ok) {
              const products = await response.json();
              
              if (products && Array.isArray(products)) {
                // Atualiza os itens com as categorias encontradas
                for (const item of order.items) {
                  if (!item.category) {
                    // Busca o produto correspondente
                    const matchingProduct = products.find(p => 
                      p._id === item.productId || 
                      p.id === item.productId || 
                      p.name === item.name
                    );
                    
                    if (matchingProduct && matchingProduct.category) {
                      console.log(`Categoria encontrada para impressão: ${item.name} -> ${matchingProduct.category}`);
                      item.category = matchingProduct.category;
                    } else if (matchingProduct && matchingProduct.categoryId) {
                      // Se tem categoryId, vamos buscar a categoria
                      try {
                        const catResponse = await fetch(`/api/mongodb?action=getCategories&restaurantId=${order.restaurantId}`);
                        if (catResponse.ok) {
                          const categories = await catResponse.json();
                          
                          const matchingCategory = categories.find(c => 
                            c._id === matchingProduct.categoryId || 
                            c.id === matchingProduct.categoryId
                          );
                          
                          if (matchingCategory) {
                            console.log(`Categoria encontrada via ID: ${matchingCategory.name}`);
                            item.category = matchingCategory.name;
                          } else {
                            item.category = 'Não categorizado';
                          }
                        }
                      } catch(e) {
                        console.error("Erro ao buscar categoria por ID:", e);
                        item.category = 'Não categorizado';
                      }
                    } else {
                      // Se não encontrar, cria uma categoria padrão
                      console.log(`Não foi possível encontrar categoria para: ${item.name}`);
                      item.category = 'Não categorizado';
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('Erro ao buscar categorias para impressão:', error);
            
            // Aplica categorias padrão para itens sem categoria
            for (const item of itemsWithoutCategory) {
              item.category = 'Não categorizado';
            }
          }
        }
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