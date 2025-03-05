# Guia de Deploy - Cardápio Digital

Este documento detalha o passo a passo para realizar o deploy da aplicação Cardápio Digital em uma VPS Ubuntu.

## Pré-requisitos

- VPS com Ubuntu 20.04 ou superior
- Acesso root à VPS
- Domínio apontado para a VPS (opcional)

## 0. Alterações Necessárias no Código

Antes de iniciar o deploy, é necessário fazer algumas alterações no código:

### 0.1. Configuração do Next.js
No arquivo `next.config.js`, certifique-se de ter estas configurações:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Importante para o deploy
  eslint: {
    ignoreDuringBuilds: true, // Evita erros de ESLint durante o build
  },
  typescript: {
    ignoreBuildErrors: true, // Evita erros de TypeScript durante o build
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vvwihgsstdfoszepafgp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}
```

### 0.2. Configuração do MongoDB
Em `src/lib/mongodb.ts`, verifique se a configuração está assim:
```typescript
import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Por favor, defina a variável de ambiente MONGODB_URI')
}

const uri = process.env.MONGODB_URI
const options = {}

let client
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise
```

### 0.3. Configuração do Supabase
Em `src/lib/supabase.ts`, confirme a configuração:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 0.5. Variáveis de Ambiente Necessárias
Crie um arquivo `.env` com todas as variáveis necessárias:
```bash
MONGODB_URI=mongodb://cardapio_user:cardapio123@localhost:27017/cardapio_digital
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_do_supabase
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_do_google_maps
```

### 0.6. Dependências do Package.json
Verifique se o `package.json` tem todas as dependências necessárias:
```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-switch": "^1.1.3",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.48.1",
    "mongodb": "^6.13.0",
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

## 1. Acessando a VPS

```bash
ssh root@seu_ip_da_vps
```

## 2. Instalação e Configuração do MongoDB

### 2.1. Instalação do MongoDB
```bash
# Importar a chave GPG do MongoDB
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Adicionar o repositório do MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Atualizar os pacotes e instalar o MongoDB
apt-get update
apt-get install -y mongodb-org
```

### 2.2. Configuração do MongoDB
```bash
# Criar diretórios necessários e definir permissões
mkdir -p /var/lib/mongodb
mkdir -p /var/log/mongodb
chown -R mongodb:mongodb /var/lib/mongodb
chown -R mongodb:mongodb /var/log/mongodb

# Criar arquivo de configuração do MongoDB
cat > /etc/mongod.conf << EOL
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 0.0.0.0

processManagement:
  timeZoneInfo: /usr/share/zoneinfo

security:
  authorization: enabled
EOL

# Iniciar o serviço do MongoDB
systemctl start mongod
systemctl enable mongod

# Criar usuário administrador
mongosh admin --eval 'db.createUser({ user: "admin", pwd: "admin123", roles: ["root"] })'

# Criar banco de dados e usuário da aplicação
mongosh admin -u admin -p admin123 --eval 'db = db.getSiblingDB("cardapio_digital"); db.createUser({ user: "cardapio_user", pwd: "cardapio123", roles: [{ role: "readWrite", db: "cardapio_digital" }] })'
```

## 3. Instalação do Node.js

```bash
# Instalar o Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Verificar a instalação
node -v
npm -v
```

## 4. Deploy da Aplicação

### 4.1. Preparação do Diretório
```bash
# Criar diretório da aplicação
cd /var/www
rm -rf cardapio-digital
git clone https://github.com/otaviomab/cardapio-digital.git
cd cardapio-digital
```

### 4.2. Configuração do Ambiente
```bash
# Criar arquivo .env com as configurações necessárias
cat > .env << EOL
MONGODB_URI=mongodb://cardapio_user:cardapio123@localhost:27017/cardapio_digital
NEXT_PUBLIC_SUPABASE_URL=https://vvwihgsstdfoszepafgp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2d2loZ3NzdGRmb3N6ZXBhZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3MjIyMTEsImV4cCI6MjA1NDI5ODIxMX0.orkmX9S4GRycZIQE_SilwIqD_Qxij2L85leHLLYYVs0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2d2loZ3NzdGRmb3N6ZXBhZmdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODcyMjIxMSwiZXhwIjoyMDU0Mjk4MjExfQ.uGXd8aS0DvyHT5RYVnNX7vH4ztnrir2crGK8unffcZ8
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCndqUvjj6Szbxd3eMo1EhCsJeaYb5OJeM
EOL
```

### 4.3. Instalação de Dependências e Build
```bash
# Instalar dependências
npm install

# Gerar build da aplicação
npm run build
```

## 5. Configuração do PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar a aplicação com PM2
pm2 start npm --name "cardapio-digital" -- start

# Configurar PM2 para iniciar com o sistema
pm2 startup
pm2 save
```

## 6. Configuração do Nginx

### 6.1. Instalação do Nginx
```bash
apt-get install -y nginx
```

### 6.2. Configuração do Proxy Reverso
```bash
# Criar configuração do Nginx
cat > /etc/nginx/sites-available/cardapio-digital << EOL
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Ativar a configuração
ln -sf /etc/nginx/sites-available/cardapio-digital /etc/nginx/sites-enabled/cardapio-digital
rm -f /etc/nginx/sites-enabled/default

# Testar e reiniciar o Nginx
nginx -t
systemctl restart nginx
```

## 7. Verificação do Deploy

Após concluir todos os passos, a aplicação estará disponível em:
```
http://seu_ip_da_vps
```

## 8. Comandos Úteis para Manutenção

### 8.1. Logs e Monitoramento
```bash
# Ver logs da aplicação
pm2 logs cardapio-digital

# Monitorar recursos
pm2 monit

# Status do MongoDB
systemctl status mongod

# Logs do Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### 8.2. Reiniciar Serviços
```bash
# Reiniciar aplicação
pm2 restart cardapio-digital

# Reiniciar MongoDB
systemctl restart mongod

# Reiniciar Nginx
systemctl restart nginx
```

### 8.3. Atualização da Aplicação
```bash
# Atualizar código
cd /var/www/cardapio-digital
git pull

# Reinstalar dependências
npm install

# Gerar novo build
npm run build

# Reiniciar aplicação
pm2 restart cardapio-digital
```

## 9. Solução de Problemas Comuns

### 9.1. Erro de Conexão com MongoDB
- Verificar se o serviço está rodando: `systemctl status mongod`
- Verificar logs: `tail -f /var/log/mongodb/mongod.log`
- Verificar configuração em `.env`

### 9.2. Erro no Build da Aplicação
- Limpar cache: `rm -rf .next`
- Verificar variáveis de ambiente no `.env`
- Verificar logs do build: `npm run build`

### 9.3. Aplicação Não Acessível
- Verificar status do PM2: `pm2 status`
- Verificar logs do Nginx: `tail -f /var/log/nginx/error.log`
- Verificar se as portas estão abertas: `netstat -tulpn`

### 9.4. Erro 502 Bad Gateway
- **Sintomas**: Página mostra "502 Bad Gateway" intermitentemente, com erros de "no live upstreams" ou "upstream sent too big header" nos logs do nginx.
- **Solução**:

  1. **Corrigir configuração do Nginx**:
  ```bash
  # Editar o arquivo de configuração do nginx
  sudo nano /etc/nginx/sites-available/cardapio-digital
  ```
  
  Substituir o conteúdo por:
  ```nginx
  server {
      listen 80;
      listen [::]:80;
      server_name delivery.krato.ai;
      
      # Redirecionar HTTP para HTTPS
      return 301 https://$host$request_uri;
  }
  
  server {
      listen 443 ssl;
      listen [::]:443 ssl;
      server_name delivery.krato.ai;
      
      # Configurações SSL (ajuste os caminhos conforme necessário)
      ssl_certificate /etc/letsencrypt/live/delivery.krato.ai/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/delivery.krato.ai/privkey.pem;
      include /etc/letsencrypt/options-ssl-nginx.conf;
      ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
      
      # Aumentar o buffer para cabeçalhos grandes
      proxy_buffer_size 128k;
      proxy_buffers 4 256k;
      proxy_busy_buffers_size 256k;
      
      # Configuração do proxy para o Next.js
      location / {
          proxy_pass http://127.0.0.1:3000;  # Use 127.0.0.1 em vez de localhost
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
          proxy_read_timeout 120s;
          proxy_connect_timeout 120s;
          
          # Aumentar o limite de tamanho do cabeçalho
          proxy_buffer_size 128k;
          proxy_buffers 4 256k;
          proxy_busy_buffers_size 256k;
          client_max_body_size 10M;
      }
  }
  ```
  
  2. **Testar e reiniciar o Nginx**:
  ```bash
  sudo nginx -t
  sudo systemctl restart nginx
  ```
  
  3. **Corrigir configuração do NextAuth**:
  
  Adicionar ao arquivo `.env`:
  ```
  NEXTAUTH_URL=https://delivery.krato.ai
  NEXTAUTH_SECRET=uma_chave_secreta_forte_e_aleatoria
  ```
  
  Você pode gerar uma chave secreta forte usando:
  ```bash
  openssl rand -base64 32
  ```
  
  4. **Corrigir múltiplas instâncias do PM2**:
  ```bash
  # Parar todas as instâncias
  pm2 stop all
  
  # Remover todas as instâncias
  pm2 delete all
  
  # Iniciar apenas uma instância com configurações otimizadas
  pm2 start npm --name "cardapio-digital" -- start --max-memory-restart 1G
  
  # Salvar a configuração
  pm2 save
  ```
  
  5. **Limpar o cache do Next.js**:
  ```bash
  rm -rf .next/cache/
  ```

## 10. Observações Importantes

1. **Segurança**: 
   - Altere todas as senhas usadas neste guia
   - Configure um firewall (UFW)
   - Mantenha o sistema atualizado

2. **Backup**:
   - Configure backups regulares do MongoDB
   - Mantenha cópias do arquivo `.env`

3. **Monitoramento**:
   - Configure alertas de monitoramento
   - Monitore o uso de recursos do servidor

4. **SSL/HTTPS**:
   - Para produção, configure SSL com Let's Encrypt
   - Atualize a configuração do Nginx para HTTPS 