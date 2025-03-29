# Atualização do Código para Usar o Campo restaurant_type

Após aplicar a migração `20240701000000_update_restaurant_type_column.sql`, é necessário atualizar o código da aplicação para usar o campo `restaurant_type` diretamente, em vez de armazená-lo dentro do objeto JSONB `delivery_info`.

## Estrutura Atual da Tabela

Antes da migração, a tabela `restaurant_settings` não possui uma coluna dedicada para o tipo de restaurante. O tipo de restaurante é armazenado dentro do campo JSONB `delivery_info` como `restaurantType`.

A migração adiciona uma nova coluna `restaurant_type` do tipo ENUM com os seguintes valores possíveis:
- 'restaurant'
- 'pizzaria'
- 'hamburgueria'
- 'cafeteria'

## Alterações Necessárias no Código

### 1. Arquivo `src/app/admin/settings/page.tsx`

#### Ao salvar as configurações:

```typescript
// Modificar o objeto settingsData:
const settingsData = {
  // ... outros campos existentes
  restaurant_type: settings.restaurantType, // Adicionar esta linha
  delivery_info: {
    // ... outros campos existentes de delivery_info
    // Manter restaurantType para compatibilidade com versões anteriores
    restaurantType: settings.restaurantType
  }
}
```

#### Ao carregar as configurações:

```typescript
// Modificar o objeto settings:
setSettings({
  // ... outros campos existentes
  restaurantType: data.restaurant_type || 'restaurant', // Priorizar o campo dedicado
  deliveryInfo: {
    // ... outros campos existentes
    // Manter a leitura do campo no JSONB para compatibilidade
    restaurantType: data.restaurant_type || data.delivery_info?.restaurantType || 'restaurant'
  }
})
```

### 2. Arquivo `src/types/restaurant.ts`

Verificar se o enum `RestaurantType` está alinhado com os valores do banco de dados:

```typescript
export enum RestaurantType {
  RESTAURANT = 'restaurant',
  PIZZARIA = 'pizzaria',
  HAMBURGUERIA = 'hamburgueria',
  CAFETERIA = 'cafeteria'
  // Outros valores conforme necessário
}
```

## Observações

- Esta abordagem mantém a compatibilidade com versões anteriores, continuando a armazenar o valor no campo JSONB `delivery_info.restaurantType`
- A prioridade de leitura é dada ao campo dedicado `restaurant_type`
- Após um período de transição, o campo no JSONB pode ser removido em uma migração futura 