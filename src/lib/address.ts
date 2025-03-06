import { InvalidCepError, AddressNotFoundError } from '@/services/errors'
import { 
  fetchAddressByCep as fetchAddressByCepService, 
  AddressData 
} from '@/services/cepService'

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

interface AddressData {
  street: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

// Re-exporta a função do serviço para manter compatibilidade
export async function fetchAddressByCep(cep: string): Promise<AddressData> {
  return fetchAddressByCepService(cep)
} 