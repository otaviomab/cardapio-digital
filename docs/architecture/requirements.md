**📌 Estrutura Completa da Plataforma**

**Áreas da Plataforma**

1. **Usuário (Cliente)**
    - Acessa o cardápio digital
    - Faz pedidos
    - Escolhe retirada ou entrega
    - Adiciona acompanhamentos e observações
    - Realiza pagamento apenas na entrega/retirada
2. **Administrador (Restaurante)**
    - Gerencia cardápio (categorias, itens, preços, fotos)
    - Configura horários de funcionamento
    - Recebe pedidos e gerencia status (pendente, em preparo, pronto, finalizado)
    - Configura taxas de entrega e locais atendidos
    - Gerencia relatórios de pedidos e faturamento

```markdown
/ (Root)
├── /home (Página inicial)
│   ├── /[restaurant-slug] (Cardápio do restaurante)
│   │   ├── /category/[id] (Lista de itens da categoria)
│   │   ├── /product/[id] (Página do item)
│   │   ├── /cart (Resumo do pedido)
│   │   ├── /checkout (Finalização do pedido)
│   │   ├── /order-confirmation (Confirmação do pedido)
│   │   ├── /track-order/[orderId] (Rastreamento do pedido)
│   │   ├── /login (Login do cliente - opcional)
│
├── /admin (Dashboard do restaurante)
│   ├── /login (Login do administrador)
│   ├── /dashboard (Visão geral)
│   ├── /orders (Lista de pedidos)
│   │   ├── /[orderId] (Detalhes do pedido)
│   ├── /menu (Gerenciamento do cardápio)
│   │   ├── /categories (Gerenciar categorias)
│   │   ├── /categories/new (Criar categoria)
│   │   ├── /categories/[id]/edit (Editar categoria)
│   │   ├── /products (Gerenciar produtos)
│   │   ├── /products/new (Adicionar produto)
│   │   ├── /products/[id]/edit (Editar produto)
│   ├── /settings (Configurações do restaurante)
│   │   ├── /delivery (Configuração de entrega e retirada)
│   │   ├── /hours (Horários de funcionamento)
│   │   ├── /payment (Métodos de pagamento)
│   │   ├── /profile (Editar informações do restaurante)
│   ├── /reports (Relatórios de vendas)
│
└── /api (Endpoints para comunicação)
```

---

## 📌 Funcionalidades do Usuário (Cliente)

### 🔹 Cardápio Online

- Exibição do restaurante com nome, foto, horário de funcionamento
- Lista de categorias (Massas, Pizzas, Bebidas, etc.)
- Produtos com:
    - Imagem, nome, descrição e preço
    - Botão para adicionar ao carrinho

### 🔹 Detalhes do Produto

- Escolha de **acompanhamentos** (opcional)
- Campo para **observações** (ex: "Sem cebola")
- Botão para **adicionar ao carrinho**

### 🔹 Carrinho de Compras

- Lista de itens adicionados
- Opção de **remover itens**
- Exibição do subtotal

### 🔹 Finalização do Pedido

- Escolha entre:
    - **Retirada no local**
    - **Entrega (se disponível)**
- Campos para endereço de entrega (caso necessário)
- Exibição do total do pedido
- Pagamento apenas **na retirada** ou **na entrega**
- Selecionar Dinheiro, Cartao ou pix

### 🔹 Confirmação e Rastreamento

- Número do pedido e status (Pendente, Em Preparo, Pronto, etc.)
- Tempo estimado para entrega ou retirada
- Tela para acompanhar atualização do status

---

## 📌 Funcionalidades do Administrador (Restaurante)

### 🔹 Gestão de Cardápio

- **Categorias**
    - Criar, editar e excluir categorias
- **Produtos**
    - Adicionar itens com foto, título, descrição, preço
    - Ativar/desativar produtos
    - Definir opções de **acompanhamentos**

### 🔹 Gestão de Pedidos

- Listagem de pedidos com status:
    - **Pendente → Em Preparo → Pronto → Finalizado**
- Tela de detalhes do pedido com:
    - Itens selecionados
    - Acompanhamentos
    - Observações do cliente
- Atualização do status do pedido (sincronizado com cliente)

### 🔹 Configurações do Restaurante

- **Horários de funcionamento**
- **Taxa de entrega** e bairros atendidos
- **Habilitar/desabilitar retirada**
- **Atualizar informações do restaurante (logo, nome, contato, endereco)**

### 🔹 Relatórios e Estatísticas

- Vendas diárias, semanais e mensais
- Pedidos cancelados e entregues
- Produtos mais vendidos

---

## 📌 Estrutura da API

A plataforma deve ter uma API para conectar o front-end com o banco de dados.

### 🔹 Endpoints Importantes

- **`POST /api/orders`** → Criar pedido
- **`GET /api/orders/{orderId}`** → Obter detalhes do pedido
- **`PATCH /api/orders/{orderId}/status`** → Atualizar status do pedido
- **`GET /api/menu/{restaurantId}`** → Obter cardápio
- **`POST /api/admin/products`** → Criar novo item no cardápio
- **`PATCH /api/admin/products/{id}`** → Atualizar item do cardápio
- **`DELETE /api/admin/products/{id}`** → Excluir item do cardápio

---

## 📌 Tecnologias Sugeridas

### **Front-end (Cliente & Admin)**

- **Next.js** (SSR para otimizar o carregamento do cardápio)
- **Tailwind CSS** (Estilização rápida e eficiente)
- **Redux ou Zustand** (Gerenciamento de estado)
- **Framer Motion** (Animações leves)

### **Back-end**

- **Node.js + Express.js** (API REST)
- **MongoDB com Mongoose** (Banco de dados NoSQL)
- Supabase para Autenticacao de Usuario

### **Outros**

- **Supabase** (para armazenamento de imagens)
- [**Socket.io**](http://socket.io/) (para atualização em tempo real dos pedidos)

---

## 📌 Fluxo do Pedido (Resumo)

1. Cliente acessa o cardápio (`/[restaurant-slug]`)
2. Seleciona itens, define acompanhamentos e observações
3. Finaliza pedido (`/checkout`) e escolhe retirada ou entrega
4. Restaurante recebe pedido no painel de admin
5. Restaurante atualiza status (ex: "Em preparo")
6. Cliente acompanha status em `/track-order/[orderId]`
7. Pedido finalizado → Cliente retira ou recebe entrega