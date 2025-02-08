import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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

  // Se estiver logado e tentar acessar login, redireciona para dashboard
  if (request.nextUrl.pathname === '/admin/login' && session) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Se tentar acessar qualquer outra rota admin sem estar logado, redireciona para login
  if (request.nextUrl.pathname.startsWith('/admin') && !session && request.nextUrl.pathname !== '/admin/login') {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return response
}

// Ajustando o matcher para incluir apenas as rotas necessárias
export const config = {
  matcher: ['/admin/:path*'],
} 