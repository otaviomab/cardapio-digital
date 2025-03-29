/**
 * Socket.IO Server Wrapper
 * 
 * Este arquivo serve como um wrapper para inicializar o Socket.IO
 * compatível com o Node.js puro (sem transpilação de TypeScript).
 */

const { Server } = require('socket.io');

/**
 * Inicializa o Socket.IO com um servidor HTTP
 * @param {import('http').Server} server - O servidor HTTP para anexar o Socket.IO
 * @returns {import('socket.io').Server} A instância do Socket.IO
 */
function initializeSocket(server) {
  // Verifica se já existe uma instância global
  if (global.io) {
    console.log('Socket.IO: Usando instância existente');
    return global.io;
  }

  // Configura as origens permitidas para CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000'];

  console.log('Socket.IO: Inicializando com origens permitidas:', allowedOrigins);

  // Cria uma nova instância do Socket.IO
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Configura os manipuladores de eventos
  io.on('connection', (socket) => {
    console.log(`Socket.IO: Novo cliente conectado: ${socket.id}`);
    
    // Evento para entrar em uma sala (restaurante)
    socket.on('join-restaurant', (restaurantId) => {
      if (!restaurantId) {
        console.error('Socket.IO: ID do restaurante não fornecido');
        socket.emit('error', 'ID do restaurante não fornecido');
        return;
      }
      
      socket.join(restaurantId);
      console.log(`Socket.IO: Cliente ${socket.id} entrou na sala ${restaurantId}`);
      socket.emit('joined', { restaurantId, socketId: socket.id });
    });
    
    // Manipulador de eventos de desconexão
    socket.on('disconnect', () => {
      console.log(`Socket.IO: Cliente desconectado: ${socket.id}`);
    });
    
    // Manipulador de erros do socket
    socket.on('error', (error) => {
      console.error(`Socket.IO: Erro no socket ${socket.id}:`, error);
    });
  });

  // Armazena a instância na variável global
  global.io = io;
  console.log('Socket.IO: Servidor inicializado com sucesso');
  
  return io;
}

// Exporta a função de inicialização
module.exports = {
  initializeSocket
}; 