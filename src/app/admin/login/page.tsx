'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/contexts/SupabaseContext'
import { Button } from '@/components/ui/button'
import { AlertDialog } from '@/components/alert-dialog'
import { Mail, Lock, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function AdminLogin() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    console.log('Iniciando processo de login...')

    // Adiciona um timeout de segurança para garantir que o loading seja desativado
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.log('Timeout de segurança ativado: desativando estado de loading após 8 segundos')
        setLoading(false)
        setError('O login demorou mais do que o esperado. Por favor, tente novamente.')
      }
    }, 8000) // 8 segundos de timeout

    try {
      console.log('Tentando fazer login...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Erro no login:', error)
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos')
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Email ainda não foi confirmado. Por favor, verifique sua caixa de entrada.')
        } else {
          throw error
        }
      }

      console.log('Login bem sucedido:', {
        userId: data.user?.id,
        email: data.user?.email,
        isInitialSetup: data.user?.user_metadata?.initial_setup === false
      })
      
      // Verifica se é o primeiro login após confirmação de email
      const isInitialSetup = data.user?.user_metadata?.initial_setup === false
      
      if (isInitialSetup) {
        console.log('Primeiro login após confirmação de email, verificando configurações existentes')
        
        try {
          // Aguarda um pequeno intervalo para garantir que o token de autenticação seja processado
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Verifica se já existem configurações para este usuário
          const { data: existingSettings, error: settingsError } = await supabase
            .from('restaurant_settings')
            .select('id')
            .eq('user_id', data.user.id)
            .single()
          
          // Se já existem configurações, atualiza os metadados do usuário e pula a criação
          if (!settingsError && existingSettings) {
            console.log('Configurações já existem para este usuário, atualizando metadados')
            
            // Atualiza os metadados do usuário para indicar que a configuração inicial foi concluída
            await supabase.auth.updateUser({
              data: {
                pending_settings: null,
                initial_setup: true
              }
            })
            
            console.log('Metadados atualizados com sucesso')
          } else {
            console.log('Nenhuma configuração existente encontrada, prosseguindo com a criação')
            
            // Obtém o token da sessão atual para incluir no cabeçalho da requisição
            const { data: sessionData } = await supabase.auth.getSession()
            const accessToken = sessionData?.session?.access_token
            
            if (!accessToken) {
              console.error('Token de acesso não disponível')
              throw new Error('Erro de autenticação. Por favor, tente fazer login novamente.')
            }
            
            // Envia os dados do usuário junto com o token para a API
            const setupResponse = await fetch('/api/setup-restaurant', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              },
              body: JSON.stringify({
                userId: data.user.id,
                email: data.user.email,
                userMetadata: data.user.user_metadata
              })
            })
            
            if (!setupResponse.ok) {
              const errorText = await setupResponse.text()
              console.error('Erro na configuração inicial:', errorText)
              
              // Se o erro for de autenticação, tenta novamente após um intervalo maior
              if (setupResponse.status === 401) {
                console.log('Erro de autenticação, tentando novamente em 2 segundos...')
                
                // Aguarda mais tempo e tenta novamente
                await new Promise(resolve => setTimeout(resolve, 2000))
                
                // Obtém o token novamente para garantir que está atualizado
                const { data: refreshedSession } = await supabase.auth.getSession()
                const refreshedToken = refreshedSession?.session?.access_token
                
                if (!refreshedToken) {
                  throw new Error('Não foi possível obter o token de autenticação')
                }
                
                const retryResponse = await fetch('/api/setup-restaurant', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshedToken}`
                  },
                  body: JSON.stringify({
                    userId: data.user.id,
                    email: data.user.email,
                    userMetadata: data.user.user_metadata
                  })
                })
                
                if (!retryResponse.ok) {
                  // Se o erro for que as configurações já existem, não é um problema crítico
                  const retryErrorText = await retryResponse.text()
                  if (retryResponse.status === 400 && retryErrorText.includes('Configurações já existem')) {
                    console.log('Configurações já existem, continuando com o login')
                  } else {
                    console.error('Falha na segunda tentativa de configuração:', retryErrorText)
                  }
                } else {
                  console.log('Configuração inicial concluída com sucesso na segunda tentativa')
                }
              } else if (setupResponse.status === 400 && errorText.includes('Configurações já existem')) {
                // Se o erro for que as configurações já existem, não é um problema crítico
                console.log('Configurações já existem, continuando com o login')
              }
            } else {
              console.log('Configuração inicial concluída com sucesso')
            }
          }
        } catch (setupError) {
          console.error('Erro ao configurar restaurante:', setupError)
          // Continua com o login mesmo se houver erro na configuração
        }
      }
      
      // Limpa o timeout de segurança antes de redirecionar
      clearTimeout(safetyTimeout)
      
      console.log('Redirecionando para o dashboard...')
      
      // Simplificando a lógica de redirecionamento para evitar problemas
      try {
        console.log('Redirecionando diretamente para o dashboard')
        window.location.href = '/admin/dashboard'
      } catch (redirectError) {
        console.error('Erro ao redirecionar:', redirectError)
        // Fallback para router.push
        router.push('/admin/dashboard')
      }
    } catch (err: any) {
      console.error('Erro capturado:', err)
      setError(err.message)
    } finally {
      // Limpa o timeout de segurança
      clearTimeout(safetyTimeout)
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      })

      if (error) throw error

      setResetEmailSent(true)
    } catch (err: any) {
      console.error('Erro ao enviar email de recuperação:', err)
      setError('Erro ao enviar email de recuperação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo e Cabeçalho */}
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <img
              src="/images/logotipo-new2.png"
              alt="Logo"
              className="h-auto w-[180px]"
            />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Bem-vindo(a) de volta
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Faça login para acessar o painel administrativo
          </p>
        </div>

        {/* Formulário */}
        <div className="mt-8">
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-900/5">
            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Campo de Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                    Email
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-zinc-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-lg border border-zinc-200 pl-10 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {/* Campo de Senha */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                    Senha
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-zinc-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border border-zinc-200 pl-10 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="relative w-full justify-center py-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-zinc-600 hover:text-zinc-900"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Esqueci minha senha
                  </Button>

                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-zinc-600 hover:text-zinc-900"
                    onClick={() => router.push('/admin/signup')}
                  >
                    Criar conta
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Dialog de Esqueci Minha Senha */}
      <AlertDialog
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
        title="Recuperar Senha"
        description={
          resetEmailSent
            ? "Email de recuperação enviado! Verifique sua caixa de entrada."
            : "Digite seu email para receber as instruções de recuperação de senha."
        }
        confirmText={resetEmailSent ? "OK" : "Enviar"}
        onConfirm={resetEmailSent ? undefined : handleForgotPassword}
        variant="default"
      />
    </div>
  )
} 