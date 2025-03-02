-- Migration: Adicionar campo restaurant_type na tabela restaurant_settings
-- Data: 01/07/2024

-- Adiciona o campo restaurant_type como ENUM
DO $$
BEGIN
    -- Verifica se o tipo ENUM já existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'restaurant_type_enum') THEN
        -- Cria o tipo ENUM
        CREATE TYPE restaurant_type_enum AS ENUM ('restaurant', 'pizzaria', 'hamburgueria', 'cafeteria');
    END IF;
END$$;

-- Adiciona a coluna restaurant_type na tabela restaurant_settings
ALTER TABLE restaurant_settings 
ADD COLUMN IF NOT EXISTS restaurant_type restaurant_type_enum DEFAULT 'restaurant';

-- Atualiza os registros existentes para usar o valor do campo restaurantType do JSONB delivery_info
UPDATE restaurant_settings
SET restaurant_type = (delivery_info->>'restaurantType')::restaurant_type_enum
WHERE delivery_info->>'restaurantType' IS NOT NULL;

-- Comentário para documentação
COMMENT ON COLUMN restaurant_settings.restaurant_type IS 'Tipo de estabelecimento (restaurante, pizzaria, etc.)'; 