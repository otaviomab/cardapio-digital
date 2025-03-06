/**
 * Classes de erros específicos para o sistema
 * Estas classes permitem um tratamento mais preciso dos erros
 * e mensagens mais informativas para o usuário
 */

/**
 * Erro base para todos os erros do sistema
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Erro lançado quando um endereço não é encontrado
 */
export class AddressNotFoundError extends AppError {
  constructor(address: string) {
    super(`Endereço não encontrado: ${address}`);
    this.name = 'AddressNotFoundError';
  }
}

/**
 * Erro lançado quando um CEP é inválido
 */
export class InvalidCepError extends AppError {
  constructor(cep: string) {
    super(`CEP inválido: ${cep}`);
    this.name = 'InvalidCepError';
  }
}

/**
 * Erro lançado quando não é possível calcular a distância entre dois endereços
 */
export class DistanceCalculationError extends AppError {
  constructor(origin: string, destination: string, details?: string) {
    super(`Não foi possível calcular a distância entre ${origin} e ${destination}${details ? `: ${details}` : ''}`);
    this.name = 'DistanceCalculationError';
  }
}

/**
 * Erro lançado quando um endereço está fora da área de entrega
 */
export class OutOfDeliveryAreaError extends AppError {
  constructor(address: string, distance: number) {
    super(`Endereço fora da área de entrega: ${address} (${distance.toFixed(2)} km)`);
    this.name = 'OutOfDeliveryAreaError';
  }
}

/**
 * Erro lançado quando a API do Google retorna um erro
 */
export class GoogleApiError extends AppError {
  status: string;
  
  constructor(status: string, details?: string) {
    super(`Erro na API do Google: ${status}${details ? ` - ${details}` : ''}`);
    this.name = 'GoogleApiError';
    this.status = status;
  }
}

/**
 * Erro lançado quando os parâmetros de entrada são inválidos
 */
export class InvalidParametersError extends AppError {
  constructor(details: string) {
    super(`Parâmetros inválidos: ${details}`);
    this.name = 'InvalidParametersError';
  }
} 