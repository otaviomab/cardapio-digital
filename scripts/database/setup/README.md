# Scripts de Configuração de Banco de Dados

Este diretório contém scripts para inicialização e configuração do banco de dados MongoDB.

## Arquivos

- `init-db.ts` - Script principal para inicialização do MongoDB com categorias e índices
- `setup-categories.ts` - Script para configuração das categorias no banco de dados

## Responsabilidades

Estes scripts são responsáveis por:

1. **Criação de Índices**
   - Configurar índices para melhor performance em consultas frequentes
   - Garantir a performance em consultas com filtros comuns

2. **Inserção de Dados Iniciais**
   - Cadastrar categorias padrão no sistema
   - Configurar dados de demonstração quando necessário

3. **Configuração de Relacionamentos**
   - Estabelecer relações entre categorias e produtos
   - Garantir integridade referencial

## Como Executar

Execute estes scripts através dos comandos NPM definidos no `package.json`:

```bash
# Inicializar banco de dados com dados padrão
npm run init-db

# Configurar apenas as categorias
npm run setup-categories
```

## Requisitos

- MongoDB em execução
- Variáveis de ambiente configuradas no `.env.local`
- Node.js v14 ou superior

## Notas Importantes

- Os scripts verificam a existência dos dados antes de inserir para evitar duplicações
- A execução destes scripts é segura em ambiente de desenvolvimento, mas deve ser feita com cautela em produção 