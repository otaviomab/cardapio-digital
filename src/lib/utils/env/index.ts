/**
 * Utilitários para verificação de ambiente de execução
 */

/**
 * Verifica se a aplicação está sendo executada em modo de desenvolvimento
 * @returns true se estiver em ambiente de desenvolvimento
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || 
         process.env.NODE_ENV === 'test' ||
         (typeof window !== 'undefined' && window.location.hostname === 'localhost');
}

/**
 * Verifica se a aplicação está sendo executada em modo de produção
 * @returns true se estiver em ambiente de produção
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Verifica se está rodando no lado do servidor ou cliente
 * @returns 'server' se estiver no servidor, 'client' se estiver no cliente
 */
export function getRuntime(): 'server' | 'client' {
  return typeof window === 'undefined' ? 'server' : 'client';
}

/**
 * Executa ações seguras condicionalmente conforme o ambiente
 * @param devFn Função a ser executada em desenvolvimento
 * @param prodFn Função opcional a ser executada em produção
 * @returns O resultado da função apropriada para o ambiente
 */
export function envGuard<T>(devFn: () => T, prodFn?: () => T): T | undefined {
  if (isDevelopment()) {
    return devFn();
  } else if (prodFn) {
    return prodFn();
  }
  return undefined;
} 