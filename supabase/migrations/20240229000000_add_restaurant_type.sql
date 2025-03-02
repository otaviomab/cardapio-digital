-- Adiciona a coluna restaurant_type à tabela restaurant_settings
ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS restaurant_type TEXT DEFAULT 'restaurant';

-- Cria um tipo ENUM para os tipos de restaurante
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'restaurant_type_enum') THEN
        CREATE TYPE restaurant_type_enum AS ENUM (
            'pizzaria',
            'lanchonete',
            'hamburgeria',
            'restaurante',
            'doceria',
            'cafeteria',
            'outro'
        );
    END IF;
END$$;

-- Adiciona comentário à coluna para documentação
COMMENT ON COLUMN restaurant_settings.restaurant_type IS 'Tipo de estabelecimento (pizzaria, lanchonete, etc.)'; 