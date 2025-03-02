# Migrações para o Cardápio Digital

Este diretório contém migrações para o banco de dados e atualizações de código para o Cardápio Digital.

## Migração: Adicionar campo restaurant_type na tabela restaurant_settings

### Arquivos relacionados:
- `20240701_add_restaurant_type.sql`: Script SQL para adicionar o campo `restaurant_type` na tabela `restaurant_settings`
- `20240701_update_code_for_restaurant_type.md`: Instruções para atualizar o código da aplicação
- `20240701_update_settings_page.ts`: Exemplo de código atualizado para o arquivo `src/app/admin/settings/page.tsx`

### Como aplicar a migração:

1. **Aplicar a migração SQL no Supabase:**
   - Acesse o painel do Supabase
   - Vá para a seção "SQL Editor"
   - Crie um novo script SQL
   - Cole o conteúdo do arquivo `20240701_add_restaurant_type.sql`
   - Execute o script

2. **Atualizar o código da aplicação:**
   - Siga as instruções no arquivo `20240701_update_code_for_restaurant_type.md`
   - Use o arquivo `20240701_update_settings_page.ts` como referência para as alterações necessárias no arquivo `src/app/admin/settings/page.tsx`

3. **Testar a aplicação:**
   - Verifique se o tipo de restaurante está sendo salvo e carregado corretamente
   - Teste a funcionalidade de pizzaria (meio a meio) se o tipo de restaurante for "pizzaria"

## Observações

- A migração SQL inclui um comando para atualizar os registros existentes, copiando o valor do campo JSONB para o novo campo dedicado
- A migração mantém a compatibilidade com versões anteriores, pois o campo `restaurantType` ainda existe no objeto `delivery_info`
- Após confirmar que tudo está funcionando corretamente, você pode remover o campo `restaurantType` do objeto `delivery_info` em uma migração futura 