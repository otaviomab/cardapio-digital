# Scripts SQL do Supabase

Este diretório contém os arquivos SQL utilizados para configurar e manter o ambiente Supabase, incluindo tabelas, funções, políticas de acesso e configurações iniciais.

## Arquivos Disponíveis

- **create-exec-sql-function.sql**: Define funções SQL personalizadas para execução de comandos SQL dinâmicos.
- **create-orders-table.sql**: Cria e configura a tabela de pedidos no Supabase.
- **create-restaurant-settings-table.sql**: Cria a tabela de configurações do restaurante.
- **create-service-role-token.sql**: Configura tokens de serviço para acesso programático.
- **init-restaurant-settings.sql**: Inicializa as configurações padrão do restaurante.
- **update-restaurant-settings-table.sql**: Atualiza a estrutura da tabela de configurações.

## Responsabilidades

### Estrutura de Dados
- Criação de tabelas para armazenamento de dados (pedidos, configurações, etc.)
- Definição de relacionamentos e chaves estrangeiras
- Configuração de índices para otimização de consultas

### Funções e Procedimentos
- Implementação de funções SQL personalizadas
- Criação de gatilhos (triggers) para automação de processos
- Definição de procedimentos armazenados

### Segurança e Acesso
- Configuração de políticas de acesso (RLS - Row Level Security)
- Definição de funções e tokens de serviço
- Gerenciamento de permissões

## Como Utilizar

Estes arquivos SQL são aplicados automaticamente através do script `apply-supabase-changes.ts` ou podem ser executados manualmente no console SQL do Supabase.

```bash
# Para aplicar todas as alterações SQL
npm run apply-supabase
```

## Observações Importantes

1. **Ordem de Execução**: Alguns scripts dependem de outros. Por exemplo, a tabela de configurações deve ser criada antes de inicializar as configurações.

2. **Idempotência**: Os scripts devem ser idempotentes (podem ser executados múltiplas vezes sem efeitos colaterais), utilizando construções como `CREATE TABLE IF NOT EXISTS`.

3. **Versionamento**: Alterações estruturais significativas devem ser documentadas com comentários de versão no início do arquivo.

4. **Backup**: Sempre faça backup dos dados antes de executar scripts que modificam estruturas existentes. 