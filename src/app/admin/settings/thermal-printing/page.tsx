'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Printer, Info, CheckCircle2 } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { useThermalPrinter } from '@/hooks/use-thermal-printer'
import { useToast } from '@/components/ui/use-toast'

export default function ThermalPrintingPage() {
  const { print } = useThermalPrinter()
  const [isTesting, setIsTesting] = useState(false)
  const { toast } = useToast()

  const handleTestPrint = async () => {
    setIsTesting(true)
    try {
      // Criar um objeto de pedido de teste
      const testOrder = {
        _id: "TESTE",
        customer: {
          name: "Cliente Teste",
          phone: "(00) 00000-0000"
        },
        orderType: "delivery",
        deliveryAddress: "Rua de Teste, 123, Bairro Teste, Cidade Teste",
        items: [
          {
            name: "Item de Teste 1",
            quantity: 1,
            price: 25.90,
            notes: "Sem observações"
          },
          {
            name: "Item de Teste 2",
            quantity: 2,
            price: 15.50,
            additions: [
              { name: "Adicional Teste" }
            ]
          }
        ],
        subtotal: 56.90,
        deliveryFee: 5.00,
        total: 61.90,
        paymentMethod: "credit_card",
        createdAt: new Date().toISOString()
      };

      // Enviar para impressão
      const success = await print(testOrder, "KRATO - TESTE DE IMPRESSÃO");

      if (success) {
        toast({
          title: 'Teste enviado',
          description: 'O teste de impressão foi enviado com sucesso!',
          variant: 'success'
        });
      } else {
        throw new Error('Erro ao enviar teste de impressão');
      }
    } catch (err: any) {
      toast({
        title: 'Erro no teste',
        description: err.message || 'Não foi possível realizar o teste de impressão',
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Impressão Térmica</h1>
        <p className="text-black">
          Configure e teste a impressão térmica de pedidos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-black">Status do Sistema</CardTitle>
          <CardDescription className="text-slate-800">
            Configuração para impressão térmica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center gap-3">
              <Printer size={20} className="text-primary" />
              <div>
                <p className="font-medium text-black">Status de impressão</p>
                <p className="text-sm text-black">
                  Sistema pronto para impressão
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">Disponível</span>
              </div>
            </div>
          </div>

          <Button
            variant="default" 
            onClick={handleTestPrint}
            disabled={isTesting}
            className="bg-slate-200 hover:bg-slate-300 text-black"
          >
            {isTesting ? "Testando..." : "Imprimir Teste"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 