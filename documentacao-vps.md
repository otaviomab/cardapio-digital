# Documentação da VPS - Cardápio Digital

Este documento fornece uma visão detalhada da infraestrutura da VPS que hospeda o Cardápio Digital. Ele serve como guia para novos desenvolvedores entenderem a configuração atual do servidor.

## Informações Gerais

- **Sistema Operacional**: Ubuntu 20.04 LTS
- **IP**: 5.161.112.102
- **Hostname**: ubuntu-8gb-ash-2
- **Usuário principal**: root

## Serviços Instalados

### 1. Nginx
- **Versão**: 1.18.0
- **Status**: Ativo
- **Configuração**: `/etc/nginx/sites-available/cardapio-digital`
- **Logs**: 
  - `/var/log/nginx/error.log`
  - `/var/log/nginx/access.log`
- **Domínio configurado**: delivery.krato.ai
- **Certificado SSL**: Let's Encrypt (gerenciado pelo Certbot)

### 2. MongoDB
- **Versão**: 6.0
- **Status**: Ativo
- **Configuração**: `/etc/mongod.conf`
- **Diretório de dados**: `/var/lib/mongodb`
- **Logs**: `/var/log/mongodb/mongod.log`
- **Usuários**:
  - admin (usuário administrativo)
  - cardapio_user (usuário da aplicação)
- **Banco de dados**: cardapio_digital

### 3. Node.js
- **Versão**: 20.18.3
- **NPM Versão**: Correspondente ao Node.js 20.x
- **Gerenciador de processos**: PM2

### 4. PM2
- **Versão**: Mais recente
- **Aplicações gerenciadas**: cardapio-digital
- **Configuração**: Autostart habilitado
- **Logs**: 
  - `/root/.pm2/logs/cardapio-digital-out.log`
  - `/root/.pm2/logs/cardapio-digital-error.log`

### 5. Let's Encrypt (Certbot)
- **Certificados**: `/etc/letsencrypt/live/delivery.krato.ai/`
- **Renovação**: Automática via cron

## Estrutura de Diretórios

### Aplicação
- **Diretório principal**: `/var/www/cardapio-digital`
- **Estrutura**:
  ```
  /var/www/cardapio-digital/
  ├── .env                # Variáveis de ambiente
  ├── .next/              # Build do Next.js
  ├── node_modules/       # Dependências
  ├── public/             # Arquivos estáticos
  ├── src/                # Código-fonte
  ├── package.json        # Dependências e scripts
  └── next.config.js      # Configuração do Next.js
  ```

### Nginx
- **Configurações disponíveis**: `/etc/nginx/sites-available/`
- **Configurações ativas**: `/etc/nginx/sites-enabled/`
- **Configuração principal**: `/etc/nginx/nginx.conf`

### MongoDB
- **Dados**: `/var/lib/mongodb/`
- **Configuração**: `/etc/mongod.conf`

### Logs
- **Nginx**: `/var/log/nginx/`
- **MongoDB**: `/var/log/mongodb/`
- **PM2**: `/root/.pm2/logs/`
- **Sistema**: `/var/log/syslog`

## Variáveis de Ambiente

O arquivo `.env` em `/var/www/cardapio-digital/` contém as seguintes variáveis:

```
MONGODB_URI=mongodb://cardapio_user:cardapio123@localhost:27017/cardapio_digital
NEXT_PUBLIC_SUPABASE_URL=https://vvwihgsstdfoszepafgp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2d2loZ3NzdGRmb3N6ZXBhZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3MjIyMTEsImV4cCI6MjA1NDI5ODIxMX0.orkmX9S4GRycZIQE_SilwIqD_Qxij2L85leHLLYYVs0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2d2loZ3NzdGRmb3N6ZXBhZmdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODcyMjIxMSwiZXhwIjoyMDU0Mjk4MjExfQ.uGXd8aS0DvyHT5RYVnNX7vH4ztnrir2crGK8unffcZ8
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCndqUvjj6Szbxd3eMo1EhCsJeaYb5OJeM
NEXTAUTH_URL=https://delivery.krato.ai
NEXTAUTH_SECRET=[chave secreta gerada]
```

## Gerenciamento de Serviços

### Nginx
```bash
# Verificar status
systemctl status nginx

# Reiniciar
systemctl restart nginx

# Testar configuração
nginx -t

# Recarregar configuração sem reiniciar
systemctl reload nginx
```

### MongoDB
```bash
# Verificar status
systemctl status mongod

# Reiniciar
systemctl restart mongod

# Acessar shell do MongoDB
mongosh admin -u admin -p admin123
```

### PM2
```bash
# Listar aplicações
pm2 list

# Verificar logs
pm2 logs cardapio-digital

# Reiniciar aplicação
pm2 restart cardapio-digital

# Monitorar recursos
pm2 monit
```

## Backups

### MongoDB
- **Frequência**: Não configurado automaticamente
- **Comando manual**:
  ```bash
  mongodump --uri="mongodb://cardapio_user:cardapio123@localhost:27017/cardapio_digital" --out=/backup/mongodb/$(date +%Y-%m-%d)
  ```

### Arquivos da Aplicação
- **Frequência**: Não configurado automaticamente
- **Comando manual**:
  ```bash
  tar -czf /backup/app/cardapio-digital-$(date +%Y-%m-%d).tar.gz /var/www/cardapio-digital
  ```

## Firewall

- **Status**: Não verificado
- **Portas abertas**:
  - 22 (SSH)
  - 80 (HTTP)
  - 443 (HTTPS)
  - 27017 (MongoDB - apenas localhost)

## Atualizações e Manutenção

### Sistema Operacional
```bash
# Atualizar lista de pacotes
apt update

# Atualizar pacotes
apt upgrade
```

### Aplicação
```bash
# Navegar até o diretório da aplicação
cd /var/www/cardapio-digital

# Atualizar código (se usando git)
git pull

# Instalar dependências
npm install

# Gerar build
npm run build

# Reiniciar aplicação
pm2 restart cardapio-digital
```

### Certificados SSL
- Renovação automática via Certbot
- Verificar status:
  ```bash
  certbot certificates
  ```

## Solução de Problemas Comuns

### Erro 502 Bad Gateway
Consulte a seção 9.4 do arquivo `comoinstalar.md` para instruções detalhadas sobre como resolver este problema.

### Aplicação Offline
1. Verificar status do PM2: `pm2 list`
2. Verificar logs: `pm2 logs cardapio-digital`
3. Reiniciar aplicação: `pm2 restart cardapio-digital`

### Problemas com MongoDB
1. Verificar status: `systemctl status mongod`
2. Verificar logs: `tail -f /var/log/mongodb/mongod.log`
3. Reiniciar serviço: `systemctl restart mongod`

## Contatos e Suporte

- **Desenvolvedor principal**: [Seu nome/contato]
- **Hospedagem**: [Informações do provedor da VPS]
- **Suporte técnico**: [Contato para suporte]

## Observações Importantes

1. **Senhas e Chaves**:
   - Todas as senhas e chaves de API estão no arquivo `.env`
   - Considere usar um gerenciador de senhas para equipe

2. **Monitoramento**:
   - Não há sistema de monitoramento automatizado configurado
   - Considere implementar ferramentas como Grafana, Prometheus ou serviços como UptimeRobot

3. **Escalabilidade**:
   - Para maior tráfego, considere aumentar os recursos da VPS
   - Avalie a necessidade de um balanceador de carga para múltiplas instâncias

4. **Segurança**:
   - Implemente backups regulares
   - Configure um firewall adequado (UFW)
   - Considere adicionar proteção contra DDoS
   - Mantenha todos os pacotes atualizados 