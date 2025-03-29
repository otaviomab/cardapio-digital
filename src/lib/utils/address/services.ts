import { AddressData } from './index';

// Definição dos erros personalizados
export class InvalidCepError extends Error {
  constructor(message = 'CEP inválido') {
    super(message);
    this.name = 'InvalidCepError';
  }
}

export class AddressNotFoundError extends Error {
  constructor(message = 'Endereço não encontrado') {
    super(message);
    this.name = 'AddressNotFoundError';
  }
}

interface ViaCepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
  erro?: boolean
}

/**
 * Busca um endereço a partir do CEP utilizando a API ViaCEP
 * @param cep CEP a ser consultado
 * @returns Dados do endereço
 * @throws InvalidCepError se o CEP for inválido
 * @throws AddressNotFoundError se o endereço não for encontrado
 */
export async function fetchAddressByCep(cep: string): Promise<AddressData> {
  // Normaliza o CEP (remove caracteres não numéricos)
  const cleanCep = cep.replace(/\D/g, '');
  
  // Valida formato do CEP
  if (!/^\d{8}$/.test(cleanCep)) {
    throw new InvalidCepError(`CEP ${cep} inválido`);
  }
  
  try {
    // Consulta a API ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    
    if (!response.ok) {
      throw new AddressNotFoundError(`Erro ao consultar CEP ${cep}`);
    }
    
    const data: ViaCepResponse = await response.json();
    
    // Verifica se a resposta indica erro
    if (data.erro) {
      throw new AddressNotFoundError(`CEP ${cep} não encontrado`);
    }
    
    // Formata os dados no padrão da aplicação
    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
      zipCode: data.cep.replace(/\D/g, '')
    };
  } catch (error) {
    // Propaga erros conhecidos
    if (error instanceof InvalidCepError || error instanceof AddressNotFoundError) {
      throw error;
    }
    
    // Trata erros desconhecidos
    throw new Error(`Erro ao buscar endereço: ${(error as Error).message}`);
  }
} 