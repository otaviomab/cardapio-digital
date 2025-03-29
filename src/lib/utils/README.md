# Biblioteca de Utilidades

Esta diretório contém funções utilitárias organizadas por domínio para facilitar a manutenção e o uso.

## Estrutura de Diretórios

```
/utils
├── /address     # Utilidades relacionadas a endereços
├── /formatters  # Funções de formatação (moeda, telefone, etc.)
├── /time        # Utilidades de data e hora
├── /ui          # Utilidades para interface do usuário
├── /validation  # Funções genéricas de validação
└── index.ts     # Arquivo de exportação principal
```

## Como Usar

Importe as utilidades do módulo principal para garantir consistência:

```typescript
// Correto ✅
import { formatCurrency, isValidEmail, cn } from '@/lib/utils';
formatCurrency(12.99);

// Evite importar diretamente dos submódulos ❌
// import { formatCurrency } from '@/lib/utils/formatters';
```

## Categorias de Utilidades

### UI (`/ui`)
- `cn()` - Utilitário para combinar classes CSS com suporte ao Tailwind

### Formatadores (`/formatters`)
- `formatCurrency()` - Formata valores para moeda brasileira
- `formatPhone()` - Formata números de telefone
- `formatCep()` - Formata CEPs

### Tempo (`/time`)
- `timeToMinutes()` - Converte horário para minutos
- `formatTimeRange()` - Formata intervalos de tempo
- `translateWeekDay()` - Traduz dias da semana
- `getCurrentWeekDay()` - Obtém o dia da semana atual
- `getCurrentTime()` - Obtém a hora atual formatada

### Validação de Tempo (`/time/validation`)
- `validateHourFormat()` - Valida formato de horário
- `validateHourSequence()` - Valida sequência de horários
- `checkTimeOverlap()` - Verifica sobreposição de horários
- `checkConflicts()` - Verifica conflitos de horários
- `groupHoursByDay()` - Agrupa horários por dia
- `normalizeHours()` - Normaliza horários

### Endereço (`/address`)
- `validateCep()` - Valida formato de CEP
- `normalizeCep()` - Normaliza um CEP
- `formatFullAddress()` - Formata endereço completo

### Serviços de Endereço (`/address/services`)
- `fetchAddressByCep()` - Busca endereço por CEP

### Validações Genéricas (`/validation`)
- `isValidEmail()` - Valida formato de email
- `isNumeric()` - Verifica se uma string contém apenas números
- `isPresent()` - Verifica se um valor está presente
- `hasRequiredFields()` - Verifica campos obrigatórios em um objeto

## Desenvolvimento

Ao adicionar novas funções de utilidade:

1. Identifique o domínio correto para a função
2. Adicione ao submódulo apropriado
3. Exporte do arquivo `index.ts` do domínio
4. Documente a função com comentários JSDoc

## Manutenção

- Utilize testes para funções de utilidade
- Mantenha a documentação atualizada
- Evite duplicação de funcionalidades
- Siga os padrões de nomenclatura existentes 