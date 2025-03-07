#!/bin/bash

# Script de deploy para o Cardápio Digital
# Este script atualiza o código na VPS sem mexer no MongoDB

echo "Iniciando deploy do Cardápio Digital..."

# Configurações
VPS_IP="5.161.112.102"
VPS_USER="root"
APP_DIR="/var/www/cardapio-digital"

# Função para exibir mensagens de status
function log_message() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Verificar se o SSH está funcionando
log_message "Verificando conexão SSH com a VPS..."
ssh -o BatchMode=yes -o ConnectTimeout=5 $VPS_USER@$VPS_IP echo "Conexão SSH OK" || {
  log_message "ERRO: Não foi possível conectar via SSH. Verifique suas credenciais e conexão."
  exit 1
}

# Atualizar o código na VPS
log_message "Atualizando o código na VPS..."
ssh $VPS_USER@$VPS_IP << 'EOF'
  cd /var/www/cardapio-digital
  
  # Backup do .env atual
  cp .env .env.backup
  
  # Parar a aplicação
  pm2 stop cardapio-digital
  
  # Atualizar o código
  git fetch origin
  git reset --hard origin/main
  
  # Restaurar o .env
  mv .env.backup .env
  
  # Instalar dependências
  npm install
  
  # Gerar build
  npm run build
  
  # Reiniciar a aplicação
  pm2 restart cardapio-digital
  
  # Verificar status
  pm2 status cardapio-digital
  
  # Reiniciar Nginx por precaução
  systemctl restart nginx
  
  echo "Deploy concluído com sucesso!"
EOF

log_message "Deploy finalizado. Verifique os logs acima para confirmar o sucesso." 