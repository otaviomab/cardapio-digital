-- Migração: Adicionar coluna restaurant_type na tabela restaurant_settings
-- Data: 01/07/2024

-- Cria o tipo ENUM para os tipos de restaurante
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'restaurant_type_enum') THEN
        CREATE TYPE restaurant_type_enum AS ENUM (
            'restaurant',
            'pizzaria',
            'hamburgueria',
            'cafeteria'
        );
    END IF;
END$$;

-- Adiciona a coluna restaurant_type à tabela restaurant_settings
ALTER TABLE restaurant_settings 
ADD COLUMN IF NOT EXISTS restaurant_type restaurant_type_enum DEFAULT 'restaurant';

-- Atualiza os registros existentes para usar o valor do campo restaurantType do JSONB delivery_info
UPDATE restaurant_settings
SET restaurant_type = (
    CASE 
        WHEN delivery_info->>'restaurantType' = 'restaurant' THEN 'restaurant'::restaurant_type_enum
        WHEN delivery_info->>'restaurantType' = 'pizzaria' THEN 'pizzaria'::restaurant_type_enum
        WHEN delivery_info->>'restaurantType' = 'hamburgueria' THEN 'hamburgueria'::restaurant_type_enum
        WHEN delivery_info->>'restaurantType' = 'cafeteria' THEN 'cafeteria'::restaurant_type_enum
        ELSE 'restaurant'::restaurant_type_enum
    END
)
WHERE delivery_info->>'restaurantType' IS NOT NULL;

-- Adiciona comentário à coluna para documentação
COMMENT ON COLUMN restaurant_settings.restaurant_type IS 'Tipo de estabelecimento (restaurante, pizzaria, etc.)'; 