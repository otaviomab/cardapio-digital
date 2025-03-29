/**
 * Formata um valor numérico para o formato de moeda brasileira (R$)
 * @param value Valor numérico a ser formatado
 * @returns String formatada (ex: R$ 1.234,56)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata um número de telefone no padrão brasileiro
 * @param phone Número de telefone (apenas dígitos)
 * @returns String formatada (ex: (11) 98765-4321)
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove caracteres não numéricos
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 11) {
    // Celular: (XX) XXXXX-XXXX
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (digits.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone; // Retorna original se não corresponder aos padrões
}

/**
 * Formata um CEP no padrão brasileiro
 * @param cep Número do CEP (apenas dígitos)
 * @returns String formatada (ex: 12345-678)
 */
export function formatCep(cep: string): string {
  if (!cep) return '';
  
  // Remove caracteres não numéricos
  const digits = cep.replace(/\D/g, '');
  
  if (digits.length === 8) {
    return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  return cep; // Retorna original se não corresponder ao padrão
} 