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
}

interface AddressData {
  street: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

export async function fetchAddressByCep(cep: string): Promise<AddressData> {
  try {
    // Remove caracteres não numéricos do CEP
    const cleanCep = cep.replace(/\D/g, '')

    // Valida o formato do CEP
    if (cleanCep.length !== 8) {
      throw new Error('CEP inválido')
    }

    // Faz a requisição para a API do ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
    const data = await response.json() as ViaCepResponse

    // Verifica se a API retornou erro
    if (data.erro) {
      throw new Error('CEP não encontrado')
    }

    // Retorna os dados formatados
    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
      zipCode: data.cep
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Erro ao buscar CEP: ${error.message}`)
    }
    throw new Error('Erro ao buscar CEP')
  }
} 