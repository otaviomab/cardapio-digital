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

      console.log('Login bem sucedido:', data)
      router.push('/admin/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('Erro capturado:', err)
      setError(err.message)
    } finally {
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
            <Image
              src="/images/logotipo.png"
              alt="Logo"
              width={180}
              height={48}
              className="h-12 w-auto"
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