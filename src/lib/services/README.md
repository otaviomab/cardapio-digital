# Arquitetura de Serviços

Este diretório contém os serviços utilizados pela aplicação, organizados por responsabilidade.

## Estrutura

```
services/
├── ApiClientService.ts   # Interface para componentes de UI acessarem a API
├── DatabaseService.ts    # Acesso direto ao MongoDB
├── SocketService.ts      # Comunicação em tempo real via Socket.IO
└── index.ts              # Ponto central de importação e mapeamento
```

## Conceitos

A arquitetura segue um padrão em camadas:

1. **Camada de UI**: Componentes React que utilizam o `ApiClientService` e `SocketService`
2. **Camada de API Client**: `ApiClientService` que faz chamadas HTTP para os endpoints
3. **Camada de API**: Endpoints da API que utilizam o `DatabaseService` e `SocketService`
4. **Camada de Banco de Dados**: `DatabaseService` que interage diretamente com o MongoDB

## Papel de cada Serviço

### ApiClientService

- **Responsabilidade**: Fornecer uma interface para componentes de UI acessarem o backend
- **Como usar**: Importando funções individuais ou o serviço completo

```typescript
import { getCategories } from '@/lib/services/api';
// ou
import { api } from '@/lib/services';
```

### DatabaseService

- **Responsabilidade**: Acesso direto ao banco de dados MongoDB
- **Como usar**: Este serviço deve ser usado apenas pelos endpoints da API

```typescript
import { getCategories } from '@/lib/services/db';
// ou
import { db } from '@/lib/services';
```

### SocketService

- **Responsabilidade**: Gerenciar comunicação em tempo real via Socket.IO
- **Como usar**: Para emitir eventos em tempo real

```typescript
import { emitToRestaurant } from '@/lib/services/socket';
// ou
import { socket } from '@/lib/services';
```

## Compatibilidade com Código Legado

Para manter compatibilidade com código existente, os seguintes aliases estão disponíveis:

```typescript
// Código antigo - ainda funciona
import { getCategories } from '@/lib/mongodb-services';
import { getProducts } from '@/lib/api-services';
import { emitToRestaurant } from '@/lib/socket';

// Código novo - recomendado
import { db, api, socket } from '@/lib/services';
// Uso: db.getCategories(), api.getProducts(), socket.emitToRestaurant()
```

## Evolução Futura

A intenção a longo prazo é:

1. Migrar todos os imports existentes para o novo formato
2. Adicionar testes unitários para cada serviço
3. Melhorar a documentação de cada função
4. Remover os arquivos antigos quando a migração estiver completa 