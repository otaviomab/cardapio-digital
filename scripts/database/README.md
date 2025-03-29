# Scripts de Banco de Dados

Este diretório contém scripts para gerenciamento e inicialização do banco de dados MongoDB e suas coleções.

## Arquivos

- `init-db.ts` - Inicializa o banco de dados com coleções e índices necessários
- `setup-categories.ts` - Configura as categorias padrão para o menu
- `db-extensions.sql` - Extensões SQL para o banco de dados relacional

## Responsabilidades

### Inicialização do Banco de Dados
- Criação de coleções necessárias no MongoDB
- Configuração de índices para otimização de consultas
- Definição de estruturas base (esquemas)

### Configuração Inicial de Dados
- Criação de categorias padrão
- Configuração de valores iniciais
- Preparação do ambiente para uso imediato

### Manutenção e Migração
- Scripts para migração de dados entre versões
- Atualizações estruturais no banco

## Como Executar

```bash
# Inicializar banco de dados
npm run init-db

# Configurar categorias padrão
npm run setup-categories
```

## Notas Importantes

- Execute estes scripts na ordem correta para evitar dependências quebradas
- Certifique-se de que as variáveis de ambiente estão configuradas corretamente
  - `MONGODB_URI` - URI de conexão com o MongoDB
  - `MONGODB_DB` - Nome do banco de dados
- Os scripts são idempotentes (podem ser executados múltiplas vezes sem efeitos colaterais)
- Para ambientes de produção, faça backup antes de executar scripts de migração 