/**
 * Interface para dados de endereço
 */
export interface AddressData {
  street: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

/**
 * Valida um CEP brasileiro
 * @param cep CEP a ser validado
 * @returns true se o CEP for válido
 */
export function validateCep(cep: string): boolean {
  // Remove caracteres não numéricos
  const digits = cep.replace(/\D/g, '');
  
  // Valida o formato (8 dígitos)
  return /^\d{8}$/.test(digits);
}

/**
 * Normaliza um CEP removendo caracteres não numéricos
 * @param cep CEP a ser normalizado
 * @returns CEP apenas com dígitos
 */
export function normalizeCep(cep: string): string {
  if (!cep) return '';
  return cep.replace(/\D/g, '');
}

/**
 * Formata um endereço completo em uma única string
 * @param address Dados do endereço
 * @returns Endereço formatado
 */
export function formatFullAddress(address: AddressData): string {
  const { street, neighborhood, city, state, zipCode } = address;
  return `${street}, ${neighborhood}, ${city} - ${state}, ${zipCode}`;
} 