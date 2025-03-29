# Scripts do Supabase

Este diretório contém scripts para configuração, inicialização e manutenção do ambiente Supabase, utilizado para autenticação e armazenamento de arquivos.

## Arquivos

- `init-supabase.sh` - Inicializa uma instância local do Supabase com Docker
- `setup-supabase.sh` - Configura o ambiente necessário para o Supabase funcionar
- `apply-supabase-changes.ts` - Aplica alterações ao Supabase (esquemas, tabelas, buckets)

## Responsabilidades

### Configuração de Ambiente
- Instalação e configuração do ambiente Supabase local
- Criação de buckets para armazenamento de imagens
- Configuração de autenticação e permissões

### Inicialização do Supabase
- Inicialização do ambiente Supabase via Docker
- Configuração de portas e serviços
- Preparação para conexão com a aplicação

### Manutenção e Atualizações
- Aplicação de alterações de esquema
- Gerenciamento de políticas de acesso
- Atualização de configurações

## Como Executar

```bash
# Configurar ambiente Supabase
npm run setup-supabase

# Inicializar Supabase local
npm run init-supabase

# Aplicar alterações ao Supabase
npm run apply-supabase
```

## Requisitos

- Docker instalado e em execução
- Node.js versão 14 ou superior
- Credenciais do Supabase configuradas no arquivo `.env.local`

## Acesso Local

Após inicializado, o Supabase estará disponível em:

- Dashboard: http://localhost:8000
- API: http://localhost:54321

## Notas Importantes

- O ambiente local do Supabase requer Docker em funcionamento
- As alterações feitas via `apply-supabase-changes.ts` são persistentes no ambiente local
- Para ambientes de produção, utilize o console web do Supabase para aplicar alterações 