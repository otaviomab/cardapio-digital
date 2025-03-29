# Scripts de Utilitários

Este diretório contém scripts utilitários para desenvolvimento, testes e manutenção do Cardápio Digital.

## Scripts Disponíveis

- **clean-products.ts**: Remove produtos inválidos ou duplicados do banco de dados.
- **create-test-orders.js**: Gera pedidos de teste para desenvolvimento e QA.
- **generate-favicons.js**: Cria favicons em diferentes tamanhos a partir de uma imagem base.
- **initialize-menu.js**: Inicializa um cardápio de exemplo com produtos e categorias.

## Responsabilidades

### Dados de Teste
- Geração de dados fictícios para testes
- Criação de cenários específicos para QA
- Simulação de comportamentos de usuário

### Manutenção
- Limpeza de dados inconsistentes
- Correção de problemas estruturais
- Otimização de recursos

### Recursos Visuais
- Geração de assets (favicons, ícones)
- Processamento de imagens
- Preparação de recursos para produção

## Como Utilizar

```bash
# Para limpar produtos inválidos
npm run clean-products

# Para gerar pedidos de teste (executar diretamente)
node scripts/utils/create-test-orders.js

# Para gerar favicons
node scripts/utils/generate-favicons.js

# Para inicializar um cardápio de exemplo
node scripts/utils/initialize-menu.js
```

## Observações Importantes

1. **Ambiente de Desenvolvimento**: Estes scripts são destinados principalmente para uso em ambientes de desenvolvimento e teste, não em produção.

2. **Dados Sensíveis**: Tenha cuidado ao executar scripts que modificam dados. Sempre faça backup antes de executar scripts de limpeza ou modificação.

3. **Dependências**: Alguns scripts podem depender de serviços externos ou configurações específicas. Verifique os requisitos antes de executar.

4. **Extensibilidade**: Ao adicionar novos scripts utilitários, mantenha o padrão de documentação e organização. 