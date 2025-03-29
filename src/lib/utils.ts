import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor como moeda brasileira (Real).
 * @param value O valor a ser formatado
 * @returns Uma string formatada (ex: R$ 10,50)
 */
export function formatCurrency(value?: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}
