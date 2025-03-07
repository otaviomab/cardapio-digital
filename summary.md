# Resumo do Sistema de Cardápio Digital

## Visão Geral

O sistema é uma plataforma de cardápio digital para entregas (delivery) e retiradas (takeaway), desenvolvida com tecnologias modernas de front-end. A aplicação possui duas áreas principais:

1. **Área do Cliente**: Interface para visualização de cardápios, realização de pedidos e acompanhamento de status.
2. **Área do Administrador (Restaurante)**: Painel para gerenciamento de cardápio, pedidos, configurações e relatórios.

## Tecnologias Principais

- **Framework**: Next.js 15 (App Router)
- **Frontend**: React 19, TypeScript, TailwindCSS
- **Backend**: Node.js com Socket.IO para comunicação em tempo real
- **Banco de Dados**: Supabase (PostgreSQL) e MongoDB
- **Autenticação**: Supabase Auth
- **Estado Global**: Zustand
- **UI Components**: Radix UI, componentes customizados
- **Estilização**: TailwindCSS
- **Comunicação em Tempo Real**: Socket.IO
- **Processamento de Imagens**: Sharp
- **Formatação de Dados**: React Input Mask, React Number Format
- **Gráficos**: Recharts
- **Upload de Arquivos**: React Dropzone
- **Efeitos Sonoros**: use-sound

## Estrutura do Projeto

### Diretórios Principais

- `/src/app`: Rotas e páginas da aplicação (Next.js App Router)
- `/src/components`: Componentes reutilizáveis
- `/src/services`: Serviços para lógica de negócios
- `/src/hooks`: Hooks customizados
- `/src/contexts`: Contextos React
- `/src/types`: Definições de tipos TypeScript
- `/src/stores`: Gerenciamento de estado com Zustand
- `/src/lib`: Utilitários e configurações
- `/src/middleware.ts`: Middleware para autenticação e rotas protegidas
- `/server.js`: Servidor Node.js customizado com Socket.IO
- `/migrations`: Scripts de migração de banco de dados
- `/scripts`: Scripts utilitários para setup e manutenção
- `/public`: Arquivos estáticos
- `/docs`: Documentação do projeto

### Rotas Principais

#### Área do Cliente
- `/`: Página inicial
- `/[restaurant-slug]`: Cardápio do restaurante
- `/cart`: Carrinho de compras
- `/order-confirmation`: Confirmação do pedido
- `/order-status`: Status do pedido
- `/r`: Rota alternativa para restaurantes

#### Área do Administrador
- `/admin/login`: Login do administrador
- `/admin/dashboard`: Dashboard principal
- `/admin/menu`: Gerenciamento de cardápio
- `/admin/orders`: Gerenciamento de pedidos
- `/admin/reports`: Relatórios de vendas
- `/admin/settings`: Configurações do restaurante
- `/admin/signup`: Cadastro de novos restaurantes

### Funcionalidades Principais

#### Área do Cliente

- Visualização de cardápio por categorias
- Detalhes de produtos com opções e adicionais
- Funcionalidade de meia-pizza (para pizzarias)
- Carrinho de compras
- Cálculo de frete baseado em zonas e CEP
- Checkout com opções de pagamento
- Acompanhamento de status do pedido em tempo real

#### Área do Administrador

- Dashboard com métricas e pedidos recentes
- Gerenciamento de cardápio (produtos, categorias, adicionais)
- Gerenciamento de pedidos em tempo real
- Configurações do restaurante (horários, zonas de entrega, etc.)
- Relatórios de vendas e desempenho
- Impressão térmica de pedidos

## Modelos de Dados Principais

### Restaurante

```typescript
interface Restaurant {
  id: string
  slug: string
  name: string
  description: string
  logo: string
  coverImage: string
  address: {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  contact: {
    phone: string
    whatsapp: string
    email: string
  }
  openingHours: {
    days: string[]
    start: string
    end: string
    enabled: boolean
  }[]
  deliveryInfo: {
    minimumOrder: number
    deliveryTime: string
    paymentMethods: string[]
    zones: {
      name: string
      minDistance: number
      maxDistance: number
      fee: number
    }[]
  }
  restaurantType: RestaurantType
}
```

### Produto

```typescript
interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  active: boolean
  additions?: Addition[]
  isPizza?: boolean
  allowHalfHalf?: boolean
}
```

### Pedido

```typescript
interface Order {
  _id?: string
  restaurantId: string
  customer: {
    name: string
    email: string
    phone: string
  }
  items: {
    productId: string
    name: string
    price: number
    quantity: number
    observations?: string
  }[]
  total: number
  subtotal?: number
  status: OrderStatus
  statusUpdates?: OrderStatusUpdate[]
  deliveryMethod?: 'delivery' | 'pickup'
  deliveryAddress?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  paymentMethod: 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'meal_voucher'
  change?: number
  createdAt: string
  updatedAt: string
}
```

## Funcionalidades Especiais

### Comunicação em Tempo Real

O sistema utiliza Socket.IO para comunicação em tempo real entre cliente e restaurante, permitindo:
- Notificação instantânea de novos pedidos
- Atualização de status de pedidos em tempo real
- Feedback imediato para o cliente

### Cálculo de Entrega

- Serviço de CEP para validação de endereços
- Cálculo de distância para determinar zona de entrega
- Visualização de zonas de entrega em mapa
- Cálculo de taxa de entrega baseado em zonas

### Impressão Térmica

- Funcionalidade para impressão de pedidos em impressoras térmicas
- Formatação específica para tickets de pedido

### Funcionalidade de Meia-Pizza

- Seleção de sabores diferentes para cada metade da pizza
- Cálculo de preço baseado nos sabores selecionados
- Interface visual para seleção de metades

### Cache e Otimização

- Sistema de cache para otimização de performance
- Gerenciamento de cache para dados frequentemente acessados
- Estratégias de invalidação de cache

## Infraestrutura

- Servidor Node.js customizado com integração Next.js
- Suporte a Docker para containerização (Dockerfile e docker-compose.yml)
- Configuração para deploy em VPS (documentação disponível)
- Sistema de cache para otimização de performance
- Integração com serviços de CEP e geolocalização

## Processo de Desenvolvimento

O projeto segue um processo de desenvolvimento bem documentado, com:
- Log detalhado de desenvolvimento (DEVELOPMENT-LOG.md)
- Documentação de problemas e soluções
- Registro de decisões técnicas
- Lista de correções futuras (correcoesfuturas.md)

## Conclusão

O sistema de Cardápio Digital é uma solução completa para restaurantes gerenciarem seus cardápios online e receberem pedidos digitalmente. A arquitetura moderna e a comunicação em tempo real proporcionam uma experiência fluida tanto para clientes quanto para administradores de restaurantes. O projeto segue boas práticas de desenvolvimento, com foco em qualidade, manutenibilidade e experiência do usuário. 