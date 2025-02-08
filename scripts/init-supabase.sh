#!/bin/bash

# Verifica se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI não encontrado. Instalando..."
    brew install supabase/tap/supabase
fi

# Verifica se o Docker está rodando
if ! docker info &> /dev/null; then
    echo "Docker não está rodando. Por favor, inicie o Docker e tente novamente."
    exit 1
fi

# Inicializa o projeto Supabase se não existir
if [ ! -d "supabase" ]; then
    echo "Inicializando projeto Supabase..."
    supabase init
fi

# Para qualquer instância do Supabase que possa estar rodando
supabase stop || true

# Inicia o Supabase
echo "Iniciando Supabase..."
supabase start

# Reseta o banco de dados e aplica as migrations
echo "Resetando banco de dados e aplicando migrations..."
supabase db reset

echo "Supabase inicializado com sucesso!"
echo "Dashboard: http://localhost:54323"
echo "API URL: http://localhost:54321"
echo "DB URL: postgresql://postgres:postgres@localhost:54322/postgres" 