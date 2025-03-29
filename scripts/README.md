# Scripts do Cardápio Digital

Esta pasta contém todos os scripts utilizados para configuração, inicialização e manutenção do projeto de Cardápio Digital.

## Estrutura de Diretórios

- `/database` - Scripts relacionados ao banco de dados MongoDB
- `/supabase` - Scripts para configuração e manutenção do Supabase
- `/utils` - Scripts utilitários para desenvolvimento e operações

## Sumário de Funcionalidades

### Banco de Dados (MongoDB)
- Inicialização e configuração de coleções
- Criação de índices para otimização
- Configuração de dados iniciais (categorias, produtos, etc.)

### Supabase (Armazenamento e Autenticação)
- Configuração do ambiente local do Supabase
- Aplicação de alterações e migrações
- Inicialização do ambiente de armazenamento

### Utilitários
- Geração de dados de teste
- Ferramentas de limpeza e manutenção
- Scripts para desenvolvimento e debug

## Convenções

- Scripts TypeScript (`.ts`) - Para manipulação de dados e lógica complexa
- Scripts Bash (`.sh`) - Para automação e configuração de ambiente
- Scripts SQL (`.sql`) - Para definições de banco de dados relacional

## Como Usar

Consulte os README.md em cada subdiretório para instruções específicas sobre cada conjunto de scripts.

Para começar um novo ambiente:

```bash
# 1. Configure o ambiente Supabase
npm run setup-supabase

# 2. Inicialize o banco de dados MongoDB
npm run init-db

# 3. Configure categorias padrão
npm run setup-categories
```

## Notas de Desenvolvimento

- Todos os novos scripts devem ser documentados no README correspondente
- Mantenha a consistência de linguagem dentro de cada categoria de script
- Adicione novos scripts aos scripts do package.json para facilitar execução
- Prefira TypeScript para novos scripts para manter consistência e segurança de tipos 