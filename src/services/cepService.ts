/**
 * Serviço para validação e consulta de CEPs
 * Fornece funções para validar e consultar CEPs usando a API dos Correios (ViaCEP)
 */

import { InvalidCepError, AddressNotFoundError } from './errors';
import { coordinatesCache } from './cacheService';

// Interface para a resposta da API ViaCEP
export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

// Interface para os dados de endereço formatados
export interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  ibgeCode?: string;
  ddd?: string;
}

/**
 * Formata um CEP adicionando o hífen (ex: 12345-678)
 * @param cep CEP a ser formatado
 * @returns CEP formatado
 */
export function formatCep(cep: string): string {
  // Remove caracteres não numéricos
  const cleanCep = cep.replace(/\D/g, '');
  
  // Verifica se tem 8 dígitos
  if (cleanCep.length !== 8) {
    return cep;
  }
  
  // Formata com hífen
  return `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;
}

/**
 * Limpa um CEP removendo caracteres não numéricos
 * @param cep CEP a ser limpo
 * @returns CEP limpo (apenas números)
 */
export function cleanCep(cep: string): string {
  return cep.replace(/\D/g, '');
}

/**
 * Valida o formato de um CEP (8 dígitos numéricos)
 * @param cep CEP a ser validado
 * @returns true se o formato for válido, false caso contrário
 */
export function isValidCepFormat(cep: string): boolean {
  const cleanedCep = cleanCep(cep);
  return /^\d{8}$/.test(cleanedCep);
}

/**
 * Verifica se um CEP existe na base dos Correios
 * @param cep CEP a ser verificado
 * @returns Promise que resolve para true se o CEP existir, false caso contrário
 */
export async function validateCepExists(cep: string): Promise<boolean> {
  try {
    // Limpa o CEP
    const cleanedCep = cleanCep(cep);
    
    // Verifica o formato
    if (!isValidCepFormat(cleanedCep)) {
      return false;
    }
    
    // Consulta a API ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
    
    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json() as ViaCepResponse;
    
    // Verifica se a API retornou erro
    return !data.erro;
  } catch (error) {
    console.error('Erro ao validar CEP:', error);
    return false;
  }
}

/**
 * Valida um CEP completo (formato e existência)
 * @param cep CEP a ser validado
 * @returns Promise que resolve para um objeto com o resultado da validação
 */
export async function validateCep(cep: string): Promise<{
  isValid: boolean;
  formattedCep?: string;
  error?: string;
}> {
  try {
    // Limpa o CEP
    const cleanedCep = cleanCep(cep);
    
    // Verifica o formato
    if (!isValidCepFormat(cleanedCep)) {
      return {
        isValid: false,
        error: 'CEP deve conter 8 dígitos numéricos'
      };
    }
    
    // Verifica se o CEP existe
    const exists = await validateCepExists(cleanedCep);
    
    if (!exists) {
      return {
        isValid: false,
        error: 'CEP não encontrado na base dos Correios'
      };
    }
    
    // Formata o CEP
    const formattedCep = formatCep(cleanedCep);
    
    return {
      isValid: true,
      formattedCep
    };
  } catch (error) {
    console.error('Erro ao validar CEP:', error);
    return {
      isValid: false,
      error: 'Erro ao validar CEP'
    };
  }
}

/**
 * Busca um endereço pelo CEP
 * @param cep CEP a ser buscado
 * @returns Promise que resolve para os dados do endereço
 */
export async function fetchAddressByCep(cep: string): Promise<AddressData> {
  try {
    // Limpa o CEP
    const cleanedCep = cleanCep(cep);
    
    // Valida o formato do CEP
    if (!isValidCepFormat(cleanedCep)) {
      throw new InvalidCepError(cep);
    }
    
    // Faz a requisição para a API do ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
    
    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as ViaCepResponse;
    
    // Verifica se a API retornou erro
    if (data.erro) {
      throw new AddressNotFoundError(cep);
    }
    
    // Retorna os dados formatados
    const addressData: AddressData = {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
      zipCode: formatCep(data.cep),
      ibgeCode: data.ibge,
      ddd: data.ddd
    };
    
    return addressData;
  } catch (error) {
    // Se já for um erro específico, propaga
    if (error instanceof InvalidCepError || error instanceof AddressNotFoundError) {
      throw error;
    }
    
    // Caso contrário, converte para um erro específico
    if (error instanceof Error) {
      console.error(`Erro ao buscar CEP: ${error.message}`);
      
      // Se a mensagem indicar que o CEP não foi encontrado
      if (error.message.includes('não encontrado')) {
        throw new AddressNotFoundError(cep);
      }
    }
    
    // Erro genérico
    throw new InvalidCepError(cep);
  }
}

/**
 * Busca um endereço pelo CEP com validação completa
 * @param cep CEP a ser buscado
 * @returns Promise que resolve para um objeto com o resultado da busca
 */
export async function fetchAddressWithValidation(cep: string): Promise<{
  isValid: boolean;
  address?: AddressData;
  error?: string;
}> {
  try {
    // Valida o CEP
    const validation = await validateCep(cep);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        error: validation.error
      };
    }
    
    // Busca o endereço
    const address = await fetchAddressByCep(cep);
    
    return {
      isValid: true,
      address
    };
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    
    if (error instanceof InvalidCepError) {
      return {
        isValid: false,
        error: 'CEP inválido'
      };
    } else if (error instanceof AddressNotFoundError) {
      return {
        isValid: false,
        error: 'CEP não encontrado'
      };
    }
    
    return {
      isValid: false,
      error: 'Erro ao buscar endereço'
    };
  }
}

/**
 * Verifica se um CEP está dentro de uma região específica (por UF)
 * @param cep CEP a ser verificado
 * @param allowedUFs Lista de UFs permitidas
 * @returns Promise que resolve para um objeto com o resultado da verificação
 */
export async function validateCepRegion(cep: string, allowedUFs: string[]): Promise<{
  isValid: boolean;
  uf?: string;
  city?: string;
  error?: string;
}> {
  try {
    // Busca o endereço
    const address = await fetchAddressByCep(cep);
    
    // Verifica se a UF está na lista de UFs permitidas
    const isAllowed = allowedUFs.includes(address.state);
    
    return {
      isValid: isAllowed,
      uf: address.state,
      city: address.city,
      error: isAllowed ? undefined : `CEP fora da região permitida (${allowedUFs.join(', ')})`
    };
  } catch (error) {
    console.error('Erro ao validar região do CEP:', error);
    
    if (error instanceof InvalidCepError) {
      return {
        isValid: false,
        error: 'CEP inválido'
      };
    } else if (error instanceof AddressNotFoundError) {
      return {
        isValid: false,
        error: 'CEP não encontrado'
      };
    }
    
    return {
      isValid: false,
      error: 'Erro ao validar região do CEP'
    };
  }
} 