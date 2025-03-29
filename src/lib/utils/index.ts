/**
 * Arquivo principal de exportação de utilidades
 * Organizado por domínio para facilitar o uso e manutenção
 */

// Exportações de UI
export * from './ui';

// Exportações de formatadores
export * from './formatters';

// Exportações de tempo
export * from './time';
export * from './time/validation';

// Exportações de endereço
export * from './address';
export * from './address/services';

// Exportações de ambiente
export * from './env';

// Outras exportações
export * from './validation';

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 