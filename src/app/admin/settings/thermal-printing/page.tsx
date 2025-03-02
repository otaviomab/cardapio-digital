'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Printer, Info, CheckCircle2, XCircle, HelpCircle, AlertTriangle } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useThermalPrinter } from '@/hooks/use-thermal-printer'
import { useToast } from '@/components/ui/use-toast'

export default function ThermalPrintingPage() {
  const {
    isSupported,
    hasPrinterAccess,
    printerName,
    requestPrinterAccess,
    print,
    error
  } = useThermalPrinter()
  const [isRequesting, setIsRequesting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const { toast } = useToast()

  const handleConnectPrinter = async () => {
    setIsRequesting(true)
    try {
      const granted = await requestPrinterAccess()
      if (granted) {
        toast({
          title: 'Dispositivo conectado',
          description: `O dispositivo "${printerName}" foi conectado com sucesso.`,
          variant: 'success'
        })
      } else {
        throw new Error(error || 'Não foi possível conectar ao dispositivo')
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao conectar dispositivo',
        description: err.message || 'Houve um problema ao tentar conectar ao dispositivo',
        variant: 'destructive'
      })
    } finally {
      setIsRequesting(false)
    }
  }

  const handleTestPrint = async () => {
    setIsTesting(true)
    try {
      if (!hasPrinterAccess) {
        await handleConnectPrinter()
        if (!hasPrinterAccess) {
          throw new Error('É necessário conectar a um dispositivo primeiro')
        }
      }

      // Comandos ESC/POS para impressão de teste
      const ESC = 0x1B
      const GS = 0x1D
      const INIT = [ESC, 0x40] // Inicializar impressora
      const CENTER = [ESC, 0x61, 0x01] // Centralizar
      const BOLD_ON = [ESC, 0x45, 0x01] // Negrito
      const BOLD_OFF = [ESC, 0x45, 0x00] // Desativar negrito
      const DOUBLE_HEIGHT = [ESC, 0x21, 0x10] // Texto grande
      const NORMAL = [ESC, 0x21, 0x00] // Texto normal
      const FEED = [0x0A] // Nova linha
      const CUT = [GS, 0x56, 0x41, 0x03] // Cortar papel

      // Criar o conteúdo do teste
      const testBytes = []
      testBytes.push(new Uint8Array(INIT))
      testBytes.push(new Uint8Array(CENTER))
      testBytes.push(new Uint8Array(BOLD_ON))
      testBytes.push(new Uint8Array(DOUBLE_HEIGHT))
      testBytes.push(new TextEncoder().encode("TESTE DE IMPRESSÃO\n"))
      testBytes.push(new Uint8Array(NORMAL))
      testBytes.push(new Uint8Array(BOLD_OFF))
      testBytes.push(new TextEncoder().encode("Krato Cardápio Digital\n\n"))
      testBytes.push(new TextEncoder().encode("Dispositivo conectado com sucesso!\n\n"))
      testBytes.push(new TextEncoder().encode("----------------------------------------\n"))
      testBytes.push(new TextEncoder().encode("Este é um teste de impressão térmica.\n"))
      testBytes.push(new TextEncoder().encode("Se você pode ver este texto, o dispositivo\n"))
      testBytes.push(new TextEncoder().encode("está funcionando corretamente.\n\n"))
      testBytes.push(new Uint8Array(FEED))
      testBytes.push(new Uint8Array(FEED))
      testBytes.push(new Uint8Array(CUT))

      // Combinar todos os arrays em um
      const totalLength = testBytes.reduce((acc, arr) => acc + arr.length, 0)
      const testData = new Uint8Array(totalLength)
      let offset = 0
      for (const arr of testBytes) {
        testData.set(arr, offset)
        offset += arr.length
      }

      const success = await print(testData)
      if (success) {
        toast({
          title: 'Teste enviado',
          description: 'O teste de impressão foi enviado com sucesso!',
          variant: 'success'
        })
      } else {
        throw new Error(error || 'Erro ao enviar teste de impressão')
      }
    } catch (err: any) {
      toast({
        title: 'Erro no teste',
        description: err.message || 'Não foi possível realizar o teste de impressão',
        variant: 'destructive'
      })
    } finally {
      setIsTesting(false)
    }
  }

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
          <CardTitle className="text-black">Status do Dispositivo</CardTitle>
          <CardDescription className="text-slate-800">
            Conecte e teste seu dispositivo USB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported ? (
            <Alert variant="destructive">
              <Info className="h-5 w-5" />
              <AlertTitle className="text-white">Navegador não compatível</AlertTitle>
              <AlertDescription className="text-white">
                Seu navegador não suporta WebUSB.
                Por favor, utilize Google Chrome ou Microsoft Edge para esta funcionalidade.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <Printer size={20} className="text-primary" />
                  <div>
                    <p className="font-medium text-black">Status de conexão</p>
                    <p className="text-sm text-black">
                      {hasPrinterAccess 
                        ? `Conectado a: ${printerName}` 
                        : "Nenhum dispositivo conectado"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {hasPrinterAccess ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full">
                      <CheckCircle2 size={16} />
                      <span className="text-sm font-medium">Conectado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full">
                      <XCircle size={16} />
                      <span className="text-sm font-medium">Desconectado</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="default" 
                  onClick={handleConnectPrinter}
                  disabled={isRequesting}
                >
                  {isRequesting 
                    ? "Conectando..." 
                    : hasPrinterAccess 
                      ? "Reconectar Dispositivo" 
                      : "Conectar Dispositivo"}
                </Button>
                <Button 
                  variant="default" 
                  onClick={handleTestPrint}
                  disabled={isTesting || !hasPrinterAccess}
                  className="bg-slate-200 hover:bg-slate-300 text-black"
                >
                  {isTesting ? "Testando..." : "Imprimir Teste"}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle>Erro de Conexão</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert variant="default" className="bg-amber-50 border-amber-200 mt-4">
                <HelpCircle className="h-5 w-5 text-amber-500" />
                <AlertTitle className="text-amber-800">Dica para macOS</AlertTitle>
                <AlertDescription className="text-amber-800">
                  Se o dispositivo não for detectado no macOS, tente:
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Desconectar e reconectar o dispositivo</li>
                    <li>Reiniciar o navegador Chrome</li>
                    <li>Verificar Preferências do Sistema &gt; Privacidade &gt; permitir que acessórios se conectem</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-black">Instruções de Uso</CardTitle>
          <CardDescription className="text-slate-800">
            Como usar dispositivos USB para impressão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2 text-black">Requisitos</h3>
            <ul className="list-disc pl-5 space-y-1 text-black">
              <li>Navegador Google Chrome ou Microsoft Edge</li>
              <li>Dispositivo conectado via USB</li>
              <li>Sistema operacional Windows ou macOS</li>
              <li>Conexão HTTPS (ou localhost para desenvolvimento)</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-lg mb-2 text-black">Processo de conexão</h3>
            <ol className="list-decimal pl-5 space-y-2 text-black">
              <li>
                <strong>Conecte o dispositivo USB</strong> ao computador
              </li>
              <li>
                <strong>Clique em "Conectar Dispositivo"</strong> e selecione sua impressora na lista que aparecerá
              </li>
              <li>
                Uma vez conectado, o <strong>ID do fabricante será exibido</strong> (importante para compatibilidade)
              </li>
              <li>
                Use o botão <strong>"Imprimir Teste"</strong> para verificar a comunicação
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-lg mb-2 text-black">Solução de problemas</h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-black">Não vejo meu dispositivo na lista</p>
                <p className="text-sm text-black">
                  Verifique se o dispositivo está ligado e conectado. No macOS, pode ser necessário autorizar o acesso nas Preferências do Sistema.
                </p>
              </div>
              <div>
                <p className="font-medium text-black">Erro ao comunicar com o dispositivo</p>
                <p className="text-sm text-black">
                  Após conectar, abra o Console do navegador (F12) para ver detalhes do erro. As informações exibidas podem ajudar a diagnosticar problemas.
                </p>
              </div>
              <div>
                <p className="font-medium text-black">Caracteres incorretos na impressão</p>
                <p className="text-sm text-black">
                  Isso pode indicar incompatibilidade com comandos ESC/POS. Envie detalhes do modelo de sua impressora para suporte.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 