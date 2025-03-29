import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-zinc-900">404</h1>
        <h2 className="text-2xl font-semibold text-zinc-800">Página não encontrada</h2>
        <p className="text-zinc-600 max-w-md mx-auto">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="pt-6">
          <Link 
            href="/" 
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-krato-600 text-white hover:bg-krato-700 transition-colors"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  )
} 