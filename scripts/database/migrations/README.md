# Migrações de Banco de Dados

Este diretório contém os scripts SQL para criação e alteração de esquemas de banco de dados.

## Arquivos

- `create-orders-table.sql` - Cria a tabela de pedidos, índices e políticas de acesso
- `create-restaurant-settings-table.sql` - Cria a tabela de configurações do restaurante
- `create-exec-sql-function.sql` - Função utilitária para execução de SQL no Supabase
- `create-service-role-token.sql` - Script para configuração de token de serviço

## Boas Práticas

1. **Nomenclatura**
   - Use prefixos como `create-`, `alter-` ou `update-` seguido do nome da tabela
   - Para migrações incrementais, considere adicionar data no formato YYYY-MM-DD

2. **Documentação**
   - Adicione comentários no início do arquivo explicando o propósito da migração
   - Documente possíveis efeitos colaterais ou dependências

3. **Idempotência**
   - Use declarações como `CREATE TABLE IF NOT EXISTS` ou `DROP TABLE IF EXISTS`
   - Verifique condições antes de alterar estruturas

4. **Rollback**
   - Quando possível, crie scripts de rollback correspondentes
   - Nomeie-os com o mesmo nome do script original, mas com o prefixo `rollback-`

## Exemplo de Uso

Para executar uma migração manualmente:

```bash
# No Supabase local
supabase db reset

# No ambiente de produção (via psql)
psql -h <host> -U <user> -d <database> -f create-orders-table.sql
``` 