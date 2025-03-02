'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/contexts/SupabaseContext'
import { Button } from '@/components/ui/button'
import { AlertDialog } from '@/components/alert-dialog'
import { Mail, Lock, User, Building2, Loader2, ArrowLeft, Phone } from 'lucide-react'
import Link from 'next/link'

export default function AdminSignup() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [formData, setFormData] = useState({
    name: '',
    restaurantName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [lastAttemptTime, setLastAttemptTime] = useState(0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificar o tempo desde a última tentativa
    const now = Date.now()
    const timeSinceLastAttempt = now - lastAttemptTime
    if (timeSinceLastAttempt < 23000) { // 23 segundos
      const timeToWait = Math.ceil((23000 - timeSinceLastAttempt) / 1000)
      setError(`Por favor, aguarde ${timeToWait} segundos antes de tentar novamente.`)
      return
    }

    setLoading(true)
    setError(null)
    setLastAttemptTime(now)

    try {
      // Validações básicas
      if (formData.password !== formData.confirmPassword) {
        throw new Error('As senhas não coincidem')
      }

      if (formData.password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres')
      }

      // Validação de email
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      if (!emailRegex.test(formData.email)) {
        throw new Error('Por favor, insira um email válido')
      }

      // Validação de telefone
      const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/
      if (!phoneRegex.test(formData.phone)) {
        throw new Error('Por favor, insira um telefone válido no formato (99) 99999-9999 ou (99) 9999-9999')
      }

      console.log('Iniciando criação do usuário...')

      // Verifica se o email já está em uso
      const checkResponse = await fetch('/api/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: formData.email.trim() })
      })

      if (!checkResponse.ok) {
        throw new Error('Erro ao verificar disponibilidade do email')
      }

      const { exists } = await checkResponse.json()
      
      if (exists) {
        setError('Este email já está cadastrado. Clique em "Voltar para login" para acessar sua conta.')
        return
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/login`,
          data: {
            name: formData.name,
            restaurant_name: formData.restaurantName,
            phone: formData.phone,
            initial_setup: false,
            // Armazena os dados para criar as configurações após confirmação
            pending_settings: {
              name: formData.restaurantName,
              slug: formData.restaurantName
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, ''),
              contact: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                whatsapp: formData.phone // Adicionando WhatsApp igual ao telefone por padrão
              }
            }
          }
        }
      })

      if (authError) {
        console.error('Erro ao criar usuário:', authError)
        
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          setError('Este email já está cadastrado. Clique em "Voltar para login" para acessar sua conta.')
          return
        }
        if (authError.message.includes('rate limit') || authError.message.includes('security purposes')) {
          const waitTime = authError.message.match(/\d+/)?.[0] || '23'
          setError(
            `Por favor, aguarde ${waitTime} segundos antes de tentar novamente. Esta é uma medida de segurança.`
          )
          return
        }
        if (authError.message.includes('invalid')) {
          setError('Email inválido. Por favor, use um email válido.')
          return
        }
        setError(`Erro no cadastro: ${authError.message}`)
        return
      }

      if (!authData.user) {
        setError('Erro ao criar usuário. Tente novamente.')
        return
      }

      console.log('Usuário criado com sucesso:', authData.user)
      setShowSuccessDialog(true)

    } catch (err: any) {
      console.error('Erro no cadastro:', err)
      setError(err.message || 'Erro ao criar conta. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Função para formatar o telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '') // Remove tudo que não é número
    
    if (value.length <= 11) {
      // Formata o número conforme vai digitando
      value = value.replace(/^(\d{2})(\d)/, '($1) $2')
      // Se tiver mais de 6 dígitos (DDD + 4 números), coloca o hífen
      value = value.length > 6 ? value.replace(/(\d{4,5})(\d{4})$/, '$1-$2') : value
      
      setFormData(prev => ({
        ...prev,
        phone: value
      }))
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
            Criar nova conta
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Preencha os dados abaixo para criar sua conta
          </p>
        </div>

        {/* Formulário */}
        <div className="mt-8">
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-900/5">
            <form className="space-y-6" onSubmit={handleSignup}>
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Nome do Responsável */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
                    Nome do Responsável
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-zinc-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-zinc-200 pl-10 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>

                {/* Nome do Restaurante */}
                <div>
                  <label htmlFor="restaurantName" className="block text-sm font-medium text-zinc-700">
                    Nome do Restaurante
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Building2 className="h-5 w-5 text-zinc-400" />
                    </div>
                    <input
                      id="restaurantName"
                      name="restaurantName"
                      type="text"
                      required
                      value={formData.restaurantName}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-zinc-200 pl-10 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      placeholder="Nome do seu estabelecimento"
                    />
                  </div>
                </div>

                {/* Email */}
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
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-zinc-200 pl-10 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {/* Telefone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">
                    Telefone
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Phone className="h-5 w-5 text-zinc-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className="block w-full rounded-lg border border-zinc-200 pl-10 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      placeholder="(99) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                </div>

                {/* Senha */}
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
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-zinc-200 pl-10 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700">
                    Confirmar Senha
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-zinc-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
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
                      Criando conta...
                    </>
                  ) : (
                    'Criar conta'
                  )}
                </Button>

                <div className="text-center">
                  <Link href="/admin/login">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-zinc-600 hover:text-zinc-900"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar para login
                    </Button>
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Dialog de Sucesso */}
      <AlertDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Conta criada com sucesso!"
        description={
          "Enviamos um email de confirmação para você. Por favor, verifique sua caixa de entrada e confirme seu email para acessar o sistema. Após a confirmação, você poderá fazer login e completar o cadastro do seu restaurante."
        }
        confirmText="Voltar para login"
        onConfirm={() => router.push('/admin/login')}
        variant="default"
      />
    </div>
  )
} 