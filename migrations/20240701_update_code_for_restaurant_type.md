# Atualização de Código para Usar o Campo restaurant_type

Após aplicar a migração SQL que adiciona o campo `restaurant_type` na tabela `restaurant_settings`, é necessário atualizar o código da aplicação para usar este novo campo em vez do campo dentro do objeto JSONB `delivery_info`.

## Arquivos a serem modificados:

### 1. src/app/admin/settings/page.tsx

Modificar o arquivo para:

1. Usar o campo `restaurant_type` diretamente em vez de armazená-lo dentro de `delivery_info`
2. Carregar o valor do campo `restaurant_type` ao inicializar as configurações

```typescript
// Ao salvar as configurações, modificar:
const settingsData = {
  // ... outros campos
  restaurant_type: settings.restaurantType,
  delivery_info: {
    // ... outros campos de delivery_info
    // Remover restaurantType daqui
  }
}

// Ao carregar as configurações, modificar:
setSettings({
  // ... outros campos
  restaurantType: data.restaurant_type || 'restaurant',
  deliveryInfo: {
    // ... outros campos
    // Não carregar restaurantType daqui
  }
})
```

### 2. src/types/restaurant.ts

Verificar se o tipo `RestaurantType` está definido corretamente:

```typescript
export enum RestaurantType {
  RESTAURANT = 'restaurant',
  PIZZARIA = 'pizzaria',
  HAMBURGUERIA = 'hamburgueria',
  CAFETERIA = 'cafeteria'
}
```

## Instruções para Aplicação da Migração

1. Execute o arquivo SQL `20240701_add_restaurant_type.sql` no banco de dados Supabase
2. Atualize o código conforme as instruções acima
3. Teste a aplicação para garantir que o tipo de restaurante está sendo salvo e carregado corretamente

## Observações

- Esta migração mantém a compatibilidade com versões anteriores, pois o campo `restaurantType` ainda existe no objeto `delivery_info`
- A migração SQL inclui um comando para atualizar os registros existentes, copiando o valor do campo JSONB para o novo campo dedicado 