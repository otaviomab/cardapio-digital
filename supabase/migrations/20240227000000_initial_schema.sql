-- Habilita a extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cria a tabela de configurações do restaurante
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  cover_url TEXT,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  opening_hours JSONB NOT NULL DEFAULT '[]'::jsonb,
  delivery_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cria índices para melhor performance
CREATE INDEX IF NOT EXISTS restaurant_settings_user_id_idx ON restaurant_settings(user_id);
CREATE INDEX IF NOT EXISTS restaurant_settings_slug_idx ON restaurant_settings(slug);

-- Habilita RLS (Row Level Security)
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Remove políticas existentes se existirem
DROP POLICY IF EXISTS "Configurações são públicas" ON restaurant_settings;
DROP POLICY IF EXISTS "Usuários podem editar suas próprias configurações" ON restaurant_settings;

-- Cria políticas de acesso
-- Qualquer um pode visualizar as configurações públicas
CREATE POLICY "Configurações são públicas"
  ON restaurant_settings FOR SELECT
  TO public
  USING (true);

-- Apenas o dono pode editar suas configurações
CREATE POLICY "Usuários podem editar suas próprias configurações"
  ON restaurant_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Cria a função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Cria o trigger para atualizar o updated_at
DROP TRIGGER IF EXISTS update_restaurant_settings_updated_at ON restaurant_settings;
CREATE TRIGGER update_restaurant_settings_updated_at
  BEFORE UPDATE ON restaurant_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 