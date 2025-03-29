/**
 * Índice de Serviços - Ponto central de acesso para todos os serviços
 * 
 * Este arquivo mapeia os arquivos de serviço antigos para os novos,
 * permitindo uma migração gradual sem quebrar o código existente.
 * 
 * No futuro, os imports antigos podem ser depreciados e substituídos
 * pelos novos serviços mais bem organizados.
 */

// Importando em vez de reexportar para evitar conflitos de nomes
import * as databaseService from './DatabaseService';
import * as apiClientService from './ApiClientService';
import * as socketService from './SocketService';

// Exportando com namespaces separados para evitar conflitos
export const db = databaseService;
export const api = apiClientService;
export const socket = socketService;

// Para manter a compatibilidade com código legado
export {
  databaseService as mongodbServices,
  apiClientService as apiServices,
  socketService as socketServices,
}; 