'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancelar',
  variant = 'default'
}: AlertDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-50 text-red-900'
      case 'warning':
        return 'bg-yellow-50 text-yellow-900'
      default:
        return 'bg-white text-zinc-900'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[425px] ${getVariantStyles()}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-zinc-600">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
          {onConfirm ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-none"
              >
                {cancelText}
              </Button>
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                onClick={() => {
                  onConfirm()
                  onOpenChange(false)
                }}
                className="flex-1 sm:flex-none"
              >
                {confirmText}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none"
            >
              {confirmText}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 