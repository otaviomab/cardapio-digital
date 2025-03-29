# Cardápio Digital

Sistema completo de cardápio digital para restaurantes, com áreas de cliente e administrador.

## Visão Geral

O Cardápio Digital é uma plataforma completa para restaurantes gerenciarem seus cardápios online, pedidos e entregas. O sistema é dividido em duas partes principais:

1. **Área do Cliente**: Interface pública onde os clientes podem visualizar o cardápio, fazer pedidos e acompanhar o status.
2. **Área do Administrador**: Painel para gerenciamento de cardápio, pedidos, configurações e relatórios.

## Documentação

A documentação do projeto está organizada nos seguintes diretórios:

### Arquitetura e Requisitos
- [Visão Geral do Sistema](docs/architecture/system-overview.md)
- [Requisitos do Sistema](docs/architecture/requirements.md)
- [Documentação Técnica](docs/DOCUMENTATION.md)

### Instalação e Configuração
- [Como Instalar](comoinstalar.md)
- [Documentação da VPS](documentacao-vps.md)

### Desenvolvimento
- [Log de Desenvolvimento](docs/development/development-log.md)
- [Plano de Implementação WhatsApp](whatsappdev.md)

### Manutenção
- [Melhorias Futuras](docs/maintenance/future-improvements.md)

## Tecnologias Principais

- **Framework**: Next.js (App Router)
- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Node.js com Socket.IO para comunicação em tempo real
- **Banco de Dados**: Supabase (PostgreSQL) e MongoDB
- **Autenticação**: Supabase Auth

## Iniciando o Projeto

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

## Deploy

O projeto está configurado para deploy em VPS com Docker. Consulte a [documentação de instalação](comoinstalar.md) para mais detalhes.

### Deploy na Vercel

O projeto também pode ser facilmente implantado na Vercel seguindo estes passos:

1. Crie uma conta na [Vercel](https://vercel.com/) caso ainda não tenha uma
2. Conecte sua conta GitHub à Vercel
3. Importe o repositório do projeto
4. Configure as seguintes variáveis de ambiente:
   - `MONGODB_URI`: URL de conexão ao MongoDB
   - Adicione outras variáveis presentes no arquivo `.env.local` conforme necessário
5. Clique em "Deploy"

A Vercel automaticamente configurará o projeto usando o arquivo `vercel.json` fornecido.

Para mais detalhes sobre o processo de deploy, consulte a [documentação oficial da Vercel](https://vercel.com/docs/deployments/overview).

## Licença

Este projeto é proprietário e não está licenciado para uso público.
