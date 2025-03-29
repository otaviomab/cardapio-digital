/**
 * Funções de validação genéricas para toda a aplicação
 */

/**
 * Valida se uma string é um email válido
 * @param email Email a ser validado
 * @returns true se o email for válido
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida se uma string contém apenas números
 * @param value Valor a ser validado
 * @returns true se contiver apenas números
 */
export function isNumeric(value: string): boolean {
  if (!value) return false;
  return /^\d+$/.test(value);
}

/**
 * Valida se um valor está presente (não é null, undefined ou string vazia)
 * @param value Valor a ser validado
 * @returns true se o valor estiver presente
 */
export function isPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}

/**
 * Valida se um objeto possui todas as propriedades requeridas
 * @param obj Objeto a ser validado
 * @param requiredFields Array de nomes das propriedades requeridas
 * @returns true se todas as propriedades estiverem presentes
 */
export function hasRequiredFields<T>(obj: T, requiredFields: (keyof T)[]): boolean {
  if (!obj) return false;
  
  return requiredFields.every(field => {
    const value = obj[field];
    return isPresent(value);
  });
} 