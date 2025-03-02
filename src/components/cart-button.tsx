'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'
import { useEffect, useState } from 'react'

export function CartButton() {
  const { items, getTotalPrice } = useCartStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-8 left-1/2 z-50 w-full max-w-screen-sm -translate-x-1/2 px-4">
      <Link
        href="/cart"
        className="flex w-full items-center justify-between rounded-full bg-krato-500 px-5 py-3 text-white shadow-xl hover:bg-krato-600"
      >
        <div className="flex items-center gap-4">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-medium">Ver carrinho</span>
        </div>

        <span className="font-medium">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(getTotalPrice())}
        </span>
      </Link>
    </div>
  )
} 