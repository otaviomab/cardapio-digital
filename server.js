const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  console.log('> Servidor Next.js preparado')
  
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // Inicializa o Socket.IO
  console.log('> Inicializando Socket.IO')
  const io = new Server(server, {
    cors: {
      origin: '*', // Em produção, você deve restringir isso
      methods: ['GET', 'POST'],
      credentials: true
    }
  })
  
  // Armazena a instância do Socket.IO globalmente
  global.io = io
  global.socketIO = io // Para compatibilidade com o código existente
  console.log('> Socket.IO armazenado globalmente')

  io.on('connection', (socket) => {
    console.log('Socket.IO: Cliente conectado:', socket.id)
    
    socket.on('join-restaurant', (restaurantId) => {
      if (!restaurantId) {
        console.error('Socket.IO: Tentativa de entrar em sala sem restaurantId', {
          socketId: socket.id
        })
        return
      }
      
      console.log(`Socket.IO: Cliente ${socket.id} entrou na sala do restaurante ${restaurantId}`)
      socket.join(restaurantId)
      
      // Envia confirmação para o cliente
      socket.emit('joined-restaurant', {
        restaurantId,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      })
      
      // Lista todas as salas para depuração
      const rooms = Array.from(socket.rooms)
      console.log(`Socket.IO: Cliente ${socket.id} está nas salas:`, rooms)
    })
    
    // Evento para testar notificações
    socket.on('test-notification', async (data) => {
      console.log('Solicitação de teste de notificação recebida:', data)
      
      const { restaurantId } = data
      
      if (!restaurantId) {
        console.error('Teste de notificação: restaurantId não fornecido')
        socket.emit('test-notification-error', { error: 'restaurantId não fornecido' })
        return
      }
      
      // Cria um pedido de teste
      const testOrder = {
        _id: `test-${Date.now()}`,
        restaurantId,
        customer: {
          name: 'Cliente de Teste',
          phone: '(11) 99999-9999'
        },
        items: [
          {
            name: 'Produto de Teste',
            price: 19.90,
            quantity: 1
          }
        ],
        // Usa o tipo fornecido ou 'delivery' como padrão
        orderType: data.orderType || 'delivery',
        deliveryMethod: data.orderType || 'delivery',
        total: 19.90,
        status: 'pending',
        createdAt: new Date().toISOString(),
        // Adiciona endereço se for delivery
        ...(data.orderType !== 'pickup' ? {
          address: {
            street: 'Rua de Teste',
            number: '123',
            complement: 'Apto 45',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            cep: '01001-000'
          },
          deliveryAddress: {
            street: 'Rua de Teste',
            number: '123',
            complement: 'Apto 45',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01001-000'
          }
        } : {})
      }
      
      // Emite o evento de novo pedido para a sala do restaurante
      console.log(`Enviando notificação de teste para a sala: ${restaurantId}`)
      io.to(restaurantId).emit('new-order', testOrder)
      
      // Confirma o envio para o cliente que solicitou o teste
      socket.emit('test-notification-sent', { 
        success: true, 
        message: 'Notificação de teste enviada com sucesso',
        order: testOrder
      })
    })
    
    socket.on('leave-restaurant', (restaurantId) => {
      if (!restaurantId) {
        console.error('Socket.IO: Tentativa de sair de sala sem restaurantId', {
          socketId: socket.id
        })
        return
      }
      
      console.log(`Socket.IO: Cliente ${socket.id} saiu da sala do restaurante ${restaurantId}`)
      socket.leave(restaurantId)
    })
    
    socket.on('disconnect', () => {
      console.log('Socket.IO: Cliente desconectado:', socket.id)
    })
  })

  // Função para processar um novo pedido
  async function processNewOrder(order) {
    try {
      console.log('Processando novo pedido:', order)
      
      const { restaurantId } = order
      
      if (!restaurantId) {
        console.error('Erro: pedido sem restaurantId')
        return { success: false, error: 'restaurantId não fornecido' }
      }
      
      // Emite o evento no formato antigo (com sufixo)
      io.to(restaurantId).emit(`new-order-${restaurantId}`, order)
      console.log(`Evento new-order-${restaurantId} enviado para a sala ${restaurantId}`)
      
      // Emite o evento no novo formato (sem sufixo)
      io.to(restaurantId).emit('new-order', order)
      console.log(`Evento new-order enviado para a sala ${restaurantId}`)
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao processar novo pedido:', error)
      return { success: false, error: error.message }
    }
  }

  // Configurar o servidor HTTP para lidar com a rota /api/orders
  server.on('request', async (req, res) => {
    // Verificar se é a rota /api/orders e o método POST
    if (req.url === '/api/orders' && req.method === 'POST') {
      try {
        // Ler o corpo da requisição
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            const order = JSON.parse(body);
            
            if (!order || !order.restaurantId) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Dados do pedido inválidos' }));
              return;
            }
            
            console.log('Novo pedido recebido via API:', order);
            
            // Adiciona timestamp de criação
            const newOrder = {
              ...order,
              createdAt: new Date().toISOString(),
              status: 'pending'
            };
            
            // Processa o pedido e envia notificações
            const result = await processNewOrder(newOrder);
            
            if (!result.success) {
              console.error('Erro ao processar pedido:', result.error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: result.error }));
              return;
            }
            
            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              success: true, 
              message: 'Pedido criado com sucesso',
              order: newOrder
            }));
          } catch (parseError) {
            console.error('Erro ao processar JSON:', parseError);
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'JSON inválido' }));
          }
        });
      } catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
      }
    }
  });

  server.listen(port, (err) => {
    if (err) {
      console.error('> Erro ao iniciar servidor:', err)
      throw err
    }
    console.log(`> Servidor pronto em http://${hostname}:${port}`)
    console.log('> Socket.IO inicializado')
  })
}) 