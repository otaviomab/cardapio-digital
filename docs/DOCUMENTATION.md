# Documentação do Cardápio Digital

## Sumário
1. [Visão Geral](#visão-geral)
2. [Tecnologias Utilizadas](#tecnologias-utilizadas)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Bancos de Dados](#bancos-de-dados)
5. [Autenticação](#autenticação)
6. [Funcionalidades Implementadas](#funcionalidades-implementadas)
7. [APIs e Integrações](#apis-e-integrações)
8. [Arquitetura](#arquitetura)
9. [Otimizações Implementadas](#otimizações-implementadas)

## Visão Geral

O Cardápio Digital é uma plataforma completa para restaurantes gerenciarem seus cardápios online, pedidos e entregas. O sistema é dividido em duas partes principais:

1. **Área do Cliente**: Interface pública onde os clientes podem:
   - Visualizar o cardápio do restaurante
   - Fazer pedidos
   - Acompanhar status dos pedidos
   - Calcular taxa de entrega

2. **Painel Administrativo**: Interface protegida onde os restaurantes podem:
   - Gerenciar cardápio (categorias e produtos)
   - Gerenciar pedidos em tempo real
   - Configurar horários de funcionamento
   - Configurar zonas de entrega
   - Visualizar relatórios

## Tecnologias Utilizadas

### Frontend
- Next.js 14 (App Router)
- React 19
- TypeScript
- TailwindCSS
- Shadcn/UI (componentes)
- Zustand (gerenciamento de estado)

### Backend
- Supabase (Autenticação e Configurações)
- MongoDB (Pedidos, Produtos e Categorias)
- Next.js API Routes

### Infraestrutura
- Vercel (deploy)
- Docker (desenvolvimento local)
- Supabase (banco de dados e autenticação)
- MongoDB Atlas (banco de dados)

## Estrutura do Projeto

```
src/
├── app/                    # Rotas e páginas (Next.js App Router)
│   ├── admin/             # Painel administrativo
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── orders/        # Gestão de pedidos
│   │   ├── menu/          # Gestão do cardápio
│   │   ├── settings/      # Configurações
│   │   └── reports/       # Relatórios
│   ├── [restaurant-slug]/ # Cardápio público
│   ├── cart/             # Carrinho de compras
│   └── order-status/     # Status do pedido
├── components/            # Componentes React reutilizáveis
├── hooks/                # Hooks personalizados
├── lib/                  # Utilitários e serviços
├── stores/               # Estados globais (Zustand)
└── types/                # Definições de tipos TypeScript
```

## Bancos de Dados

### Supabase (PostgreSQL)

Utilizado para:
- Autenticação de usuários
- Configurações do restaurante
- Upload e armazenamento de imagens

#### Tabelas:

1. **restaurant_settings**
   ```sql
   - user_id: UUID (PK, FK -> auth.users)
   - name: TEXT
   - description: TEXT
   - slug: TEXT UNIQUE
   - logo_url: TEXT
   - cover_url: TEXT
   - address: JSONB
   - contact: JSONB
   - opening_hours: JSONB
   - delivery_info: JSONB
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP
   ```

### MongoDB

Utilizado para:
- Pedidos
- Cardápio (Categorias e Produtos)
- Relatórios

#### Coleções:

1. **categories**
   ```typescript
   {
     _id: ObjectId
     restaurantId: string
     name: string
     description?: string
     order: number
     active: boolean
   }
   ```

2. **products**
   ```typescript
   {
     _id: ObjectId
     restaurantId: string
     categoryId: string
     name: string
     description: string
     price: number
     image: string
     available: boolean
     featured: boolean
     additions?: Array<{
       name: string
       price: number
       available: boolean
     }>
   }
   ```

3. **orders**
   ```typescript
   {
     _id: ObjectId
     restaurantId: string
     status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
     orderType: 'delivery' | 'pickup'
     customer: {
       name: string
       phone: string
     }
     address?: {
       cep: string
       street: string
       number: string
       complement?: string
       neighborhood: string
       city: string
       state: string
     }
     payment: {
       method: string
       change?: string
     }
     items: Array<{
       id: string
       name: string
       price: number
       quantity: number
       observation?: string
       additions: Array<{
         name: string
         price: number
       }>
     }>
     subtotal: number
     deliveryFee?: number
     total: number
     statusUpdates: Array<{
       status: string
       timestamp: Date
       message: string
     }>
     createdAt: Date
     updatedAt: Date
   }
   ```

## Autenticação

- Implementada usando Supabase Auth
- Middleware para proteção de rotas administrativas
- Políticas de segurança (RLS) no Supabase
- Tokens JWT para autenticação

## Funcionalidades Implementadas

### Área do Cliente

1. **Cardápio**
   - Visualização de categorias e produtos
   - Filtros e busca
   - Adicionais para produtos
   - Carrinho de compras persistente

2. **Pedidos**
   - Fluxo completo de checkout
   - Cálculo automático de taxa de entrega
   - Validação de endereço
   - Múltiplas formas de pagamento

3. **Status do Pedido**
   - Acompanhamento em tempo real
   - Timeline de atualizações
   - Detalhes completos do pedido

### Painel Administrativo

1. **Dashboard**
   - Métricas em tempo real
   - Gráficos de vendas
   - Produtos mais vendidos

2. **Gestão de Pedidos**
   - Notificações em tempo real
   - Atualização de status
   - Histórico completo

3. **Gestão do Cardápio**
   - CRUD de categorias
   - CRUD de produtos
   - Upload de imagens
   - Gestão de adicionais

4. **Configurações**
   - Informações do restaurante
   - **Horários de Funcionamento**:
     - Interface intuitiva para configuração
     - Suporte a diferentes horários por dia da semana
     - Validação de períodos
     - Verificação em tempo real do status (aberto/fechado)
     - Exibição do próximo horário de abertura
   - **Zonas de Entrega**:
     - Configuração de múltiplas zonas
     - Definição de taxas por distância
     - Ativação/desativação de zonas
     - Tempos estimados por zona
     - Validação automática de área de entrega
   - Formas de pagamento

5. **Relatórios**
   - Vendas por período
   - Produtos mais vendidos
   - Horários de pico
   - Métricas de entrega

## APIs e Integrações

1. **Google Maps Platform**
   - **Geocoding API**: 
     - Converte endereços em coordenadas (latitude/longitude)
     - Chave: Configurada em `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
     - Uso: Obtenção de coordenadas do restaurante e clientes
   
   - **Distance Matrix API**:
     - Calcula distâncias reais entre endereços
     - Usa a mesma chave da Geocoding API
     - Uso: Cálculo de taxas de entrega baseadas em distância

   - **Configurações de Segurança**:
     - Restrições de domínio configuradas
     - Cotas de uso definidas
     - Alertas de orçamento ativos

2. **Funcionalidades de Entrega**
   - Zonas de entrega configuráveis:
     ```typescript
     interface DeliveryZone {
       id: string
       minDistance: number
       maxDistance: number
       fee: number
       estimatedTime: string
       active: boolean
     }
     ```
   - Cálculo automático de taxas baseado em distância
   - Validação de área de entrega
   - Tempo estimado por zona
   - Zona padrão para casos sem configuração

3. **Horário de Funcionamento**
   - Sistema inteligente de verificação:
     ```typescript
     interface OpeningHour {
       days: string // Ex: "Segunda à Sexta"
       hours: string // Ex: "11:00 às 00:00"
     }
     ```
   - Suporte a múltiplos períodos por dia
   - Tratamento especial para horários após meia-noite
   - Verificação em tempo real do status (aberto/fechado)
   - Exibição do próximo horário de abertura

4. **Upload de Imagens**
   - Armazenamento no Supabase Storage
   - Otimização automática
   - CDN para entrega

## Arquitetura

### Frontend

1. **Server Components**
   - Páginas principais
   - Busca de dados inicial
   - SEO otimizado

2. **Client Components**
   - Interações em tempo real
   - Formulários
   - Carrinho de compras

3. **Estado Global**
   - Carrinho (Zustand)
   - Autenticação (Supabase)
   - Notificações de pedidos

### Backend

1. **API Routes**
   - CRUD de produtos/categorias
   - Gestão de pedidos
   - Relatórios

2. **Middleware**
   - Autenticação
   - Proteção de rotas
   - Logging

3. **Serviços**
   - MongoDB (dados principais)
   - Supabase (auth e config)
   - Google Maps (delivery)

### Segurança

1. **Autenticação**
   - JWT via Supabase
   - Middleware de proteção
   - Refresh tokens

2. **Autorização**
   - RLS no Supabase
   - Validação de proprietário
   - Políticas por recurso

3. **Dados**
   - Validação de inputs
   - Sanitização
   - Rate limiting

### Performance

1. **Otimizações**
   - Server Components
   - Imagens otimizadas
   - Caching

2. **Real-time**
   - Polling otimizado
   - WebSockets (pedidos)
   - Estado local

## Otimizações Implementadas

### 1. Centralização da Lógica de Cálculo

Implementamos um serviço centralizado para cálculo de distância, evitando duplicação de código e facilitando a manutenção.

```typescript
// src/services/distanceService.ts
export async function calculateDistance(origin: string, destination: string): Promise<number> {
  // Implementação centralizada
}
```

**Benefícios:**
- Código mais organizado e fácil de manter
- Alterações futuras na lógica de cálculo só precisam ser feitas em um lugar
- Melhor tratamento de erros e consistência nas respostas

### 2. Tratamento de Erros Mais Robusto

Criamos classes de erros específicos para diferentes situações, permitindo um tratamento mais preciso e mensagens mais informativas.

```typescript
// src/services/errors.ts
export class AddressNotFoundError extends AppError {
  constructor(address: string) {
    super(`Endereço não encontrado: ${address}`);
    this.name = 'AddressNotFoundError';
  }
}
```

**Benefícios:**
- Mensagens de erro mais claras e específicas
- Tratamento diferenciado para cada tipo de erro
- Códigos HTTP apropriados nas respostas da API
- Melhor experiência para o usuário

### 3. Cache de Coordenadas Geográficas

Implementamos um sistema de cache para armazenar coordenadas e distâncias já consultadas, reduzindo o número de requisições à API do Google Maps.

```typescript
// src/services/cacheService.ts
export const coordinatesCache = new CoordinatesCache();
export const distanceCache = new DistanceCache();
```

**Benefícios:**
- Redução significativa de custos com a API do Google Maps
- Melhor desempenho para endereços frequentemente consultados
- Experiência offline parcial para dados já consultados
- Interface de gerenciamento de cache para desenvolvedores

### 4. Validação de CEP Mais Completa

Melhoramos a validação de CEP para verificar não apenas o formato, mas também se o CEP existe na base dos Correios.

```typescript
// src/services/cepService.ts
export async function validateCep(cep: string): Promise<{
  isValid: boolean;
  formattedCep?: string;
  error?: string;
}> {
  // Implementação completa
}
```

**Benefícios:**
- Validação mais precisa de CEPs
- Feedback imediato sobre a validade do CEP
- Redução de erros no preenchimento de endereços
- Componente reutilizável para entrada de CEP

### 5. Tolerância em Limites de Zonas

Implementamos um sistema de tolerância para lidar com endereços na fronteira entre zonas de entrega.

```typescript
// src/services/zoneService.ts
export function isInZone(
  distance: number,
  zone: DeliveryZone,
  toleranceKm: number = DEFAULT_TOLERANCE_KM
): {
  isInZone: boolean;
  isExactlyInZone: boolean;
  isInZoneWithTolerance: boolean;
  isOnBoundary: boolean;
} {
  // Implementação com tolerância
}
```

**Benefícios:**
- Classificação mais precisa de endereços na fronteira entre zonas
- Redução de casos de endereços incorretamente classificados como fora da área de entrega
- Visualização clara das zonas e da tolerância
- Configuração ajustável da tolerância

### 6. Algoritmos de Distância Mais Precisos

Implementamos diferentes algoritmos para cálculo de distância, desde aproximações rápidas até cálculos precisos.

```typescript
// src/services/distanceCalculationService.ts
export function calculateOptimalDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  // Escolhe o algoritmo mais adequado com base na distância estimada
}
```

**Benefícios:**
- Redução de custos com a API do Google Maps
- Cálculos mais rápidos para distâncias curtas
- Sistema continua funcionando mesmo se a API do Google estiver indisponível
- Página de debug para analisar e comparar os diferentes algoritmos

### 7. Proteção de Componentes e Rotas de Debug

Implementamos proteção para componentes e rotas de debug, garantindo que não sejam acessíveis em produção.

```typescript
// src/components/cache-manager.tsx
export function CacheManager() {
  const [isDev, setIsDev] = useState<boolean>(false);

  // Verifica se está em ambiente de desenvolvimento
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDevEnvironment = 
        process.env.NODE_ENV === 'development' || 
        window.location.hostname === 'localhost';
      
      setIsDev(isDevEnvironment);
    }
  }, []);

  // Se não estiver em ambiente de desenvolvimento, não renderiza nada
  if (!isDev) {
    return null;
  }

  // Resto do componente
}
```

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  // Verifica se é uma rota protegida
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Se for uma rota protegida e estiver em produção, redireciona para a página inicial
  if (isProtectedRoute && process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Resto do middleware
}
```

**Benefícios:**
- Componentes de debug não são exibidos para usuários finais
- Rotas de debug não são acessíveis em produção
- Sistema continua funcionando normalmente em ambiente de desenvolvimento
- Melhor segurança e experiência do usuário

## Próximos Passos

1. **Funcionalidades Planejadas**
   - Sistema de cupons
   - Fidelidade
   - Reviews
   - Multi-tenancy
   - **Melhorias no Sistema de Entrega**:
     - Integração com serviços de entrega
     - Rastreamento em tempo real
     - Otimização de rotas
   - **Expansão do Horário de Funcionamento**:
     - Horários especiais para feriados
     - Pausas durante o dia
     - Bloqueio de horários específicos

2. **Melhorias Técnicas**
   - Testes automatizados
   - CI/CD
   - Monitoramento
   - Analytics 