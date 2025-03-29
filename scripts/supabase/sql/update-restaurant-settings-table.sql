-- Adiciona novas colunas se não existirem
DO $$ 
BEGIN
    -- Verifica e adiciona a coluna opening_hours se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'restaurant_settings' 
                  AND column_name = 'opening_hours') THEN
        ALTER TABLE restaurant_settings 
        ADD COLUMN opening_hours JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;

    -- Verifica e adiciona a coluna delivery_info se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'restaurant_settings' 
                  AND column_name = 'delivery_info') THEN
        ALTER TABLE restaurant_settings 
        ADD COLUMN delivery_info JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    -- Verifica e adiciona a coluna address se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'restaurant_settings' 
                  AND column_name = 'address') THEN
        ALTER TABLE restaurant_settings 
        ADD COLUMN address JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    -- Verifica e adiciona a coluna contact se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'restaurant_settings' 
                  AND column_name = 'contact') THEN
        ALTER TABLE restaurant_settings 
        ADD COLUMN contact JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    -- Verifica e adiciona a coluna logo_url se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'restaurant_settings' 
                  AND column_name = 'logo_url') THEN
        ALTER TABLE restaurant_settings 
        ADD COLUMN logo_url TEXT;
    END IF;

    -- Verifica e adiciona a coluna cover_url se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'restaurant_settings' 
                  AND column_name = 'cover_url') THEN
        ALTER TABLE restaurant_settings 
        ADD COLUMN cover_url TEXT;
    END IF;

    -- Verifica e adiciona a coluna slug se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'restaurant_settings' 
                  AND column_name = 'slug') THEN
        ALTER TABLE restaurant_settings 
        ADD COLUMN slug TEXT UNIQUE;
    END IF;

    -- Verifica e adiciona a coluna description se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'restaurant_settings' 
                  AND column_name = 'description') THEN
        ALTER TABLE restaurant_settings 
        ADD COLUMN description TEXT;
    END IF;

    -- Verifica e adiciona a coluna name se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'restaurant_settings' 
                  AND column_name = 'name') THEN
        ALTER TABLE restaurant_settings 
        ADD COLUMN name TEXT NOT NULL DEFAULT 'Meu Restaurante';
    END IF;

    -- Verifica e adiciona a coluna user_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'restaurant_settings' 
                  AND column_name = 'user_id') THEN
        ALTER TABLE restaurant_settings 
        ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id);
    END IF;

    -- Verifica e adiciona as colunas de timestamp se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'restaurant_settings' 
                  AND column_name = 'created_at') THEN
        ALTER TABLE restaurant_settings 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'restaurant_settings' 
                  AND column_name = 'updated_at') THEN
        ALTER TABLE restaurant_settings 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Cria ou atualiza os índices
CREATE INDEX IF NOT EXISTS restaurant_settings_user_id_idx ON restaurant_settings(user_id);
CREATE INDEX IF NOT EXISTS restaurant_settings_slug_idx ON restaurant_settings(slug);

-- Habilita RLS (Row Level Security) se ainda não estiver habilitado
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Remove políticas existentes para recriar
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

-- Cria ou atualiza a função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Cria o trigger se não existir
DROP TRIGGER IF EXISTS update_restaurant_settings_updated_at ON restaurant_settings;
CREATE TRIGGER update_restaurant_settings_updated_at
  BEFORE UPDATE ON restaurant_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 