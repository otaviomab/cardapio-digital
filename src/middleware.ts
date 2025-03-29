import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas que devem ser protegidas em produção
const PROTECTED_ROUTES = [
  '/debug',
  '/debug/zones',
  '/debug/distance',
  '/debug/address-test',
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Verifica se é uma rota protegida
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Se for uma rota protegida e estiver em produção, redireciona para a página inicial
  if (isProtectedRoute && process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Se estiver logado e tentar acessar login ou signup, redireciona para dashboard
  if ((request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname === '/admin/signup') && session) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Se tentar acessar qualquer outra rota admin sem estar logado, redireciona para login
  // Exceto login e signup que são públicas
  if (
    request.nextUrl.pathname.startsWith('/admin') && 
    !session && 
    request.nextUrl.pathname !== '/admin/login' && 
    request.nextUrl.pathname !== '/admin/signup'
  ) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return response
}

// Ajustando o matcher para incluir apenas as rotas necessárias
// Importante: Não incluir rotas de restaurante aqui para evitar redirecionamentos indevidos
export const config = {
  matcher: ['/admin/:path*', '/debug/:path*'],
} 