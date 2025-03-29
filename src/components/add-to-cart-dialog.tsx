'use client'

import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AddToCartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddToCartDialog({ open, onOpenChange }: AddToCartDialogProps) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md space-y-4 p-8">
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-krato-100">
            <Check className="h-6 w-6 text-krato-500" />
          </div>
          <DialogTitle className="text-xl font-medium text-zinc-900">
            Item adicionado ao carrinho
          </DialogTitle>
          <p className="text-zinc-900">
            Você pode continuar navegando pelo cardápio ou ir para o carrinho
            para finalizar seu pedido.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
          >
            Continuar navegando
          </button>

          <button 
            onClick={() => {
              router.push('/cart')
              onOpenChange(false)
            }}
            className="rounded-lg bg-krato-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-krato-600"
          >
            Ir para o carrinho
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 