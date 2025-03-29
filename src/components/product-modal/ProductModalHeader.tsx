'use client'

import Image from 'next/image'
import { Product } from '@/types/restaurant'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ProductModalHeaderProps {
  product: Product
}

export function ProductModalHeader({ product }: ProductModalHeaderProps) {
  return (
    <DialogHeader>
      {product.image && (
        <div className="relative aspect-video w-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="rounded-lg object-cover"
          />
        </div>
      )}
      <DialogTitle className="text-xl text-zinc-900">{product.name}</DialogTitle>
      <p className="text-sm text-zinc-900">{product.description}</p>
    </DialogHeader>
  )
} 