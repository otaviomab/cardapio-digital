#!/bin/bash

# Verifica se o Homebrew está instalado (macOS)
if ! command -v brew &> /dev/null; then
    echo "Instalando Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Instala o Supabase CLI
echo "Instalando Supabase CLI..."
brew install supabase/tap/supabase

# Verifica se a instalação foi bem sucedida
if ! command -v supabase &> /dev/null; then
    echo "Erro: Falha ao instalar Supabase CLI"
    exit 1
fi

# Configura o Supabase CLI com as credenciais do .env.local
echo "Configurando Supabase CLI..."
source .env.local

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "Erro: Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não encontradas no .env.local"
    exit 1
fi

# Inicializa o projeto Supabase
echo "Inicializando projeto Supabase..."
supabase init

# Faz login no Supabase
echo "Fazendo login no Supabase..."
supabase login

echo "Configuração concluída com sucesso!" 