/**
 * SocketService - Serviço de comunicação em tempo real
 * 
 * Este serviço gerencia a comunicação em tempo real entre cliente e servidor
 * utilizando Socket.IO, permitindo atualizações instantâneas na interface.
 * 
 * Responsabilidades:
 * - Gerenciar a instância do Socket.IO
 * - Emitir eventos para salas específicas (restaurantes)
 * - Abstrair a comunicação em tempo real para o resto da aplicação
 * - Lidar com diferenças entre cliente e servidor
 * 
 * Uso típico:
 * - Notificações de novos pedidos
 * - Atualizações de status de pedidos
 * - Comunicação entre dashboard e cozinha
 */

// Reexportando as funções do arquivo socket.ts original
// No futuro, este arquivo pode substituir completamente o original
export * from '../socket';

// Funções adicionais específicas do serviço podem ser adicionadas aqui 