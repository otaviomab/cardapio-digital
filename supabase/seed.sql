-- Cria o usuário demo se não existir
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  'e0dba73b-0870-4b0d-8026-7341db950c16',
  '00000000-0000-0000-0000-000000000000',
  'demo@restaurante.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Insere as configurações iniciais do restaurante demo
INSERT INTO restaurant_settings (
  user_id,
  name,
  description,
  slug,
  logo_url,
  cover_url,
  address,
  contact,
  opening_hours,
  delivery_info
) VALUES (
  'e0dba73b-0870-4b0d-8026-7341db950c16', -- ID fixo para desenvolvimento
  'Restaurante Demo',
  'O melhor restaurante da cidade',
  'restaurante-demo',
  '/images/logotipo-new2.png',
  '/images/hamburguer.png',
  '{
    "street": "Rua das Flores",
    "number": "123",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  }'::jsonb,
  '{
    "phone": "(11) 1234-5678",
    "whatsapp": "(11) 91234-5678",
    "email": "contato@restaurantedemo.com.br"
  }'::jsonb,
  '[
    {
      "days": "Segunda à Sexta",
      "hours": "11:00 às 14:00"
    },
    {
      "days": "Sábado e Domingo",
      "hours": "11:00 às 14:00"
    }
  ]'::jsonb,
  '{
    "minimumOrder": 20,
    "deliveryTime": "30-45 min",
    "deliveryFee": 5,
    "paymentMethods": ["Dinheiro", "Cartão de Crédito", "Cartão de Débito", "PIX"],
    "zones": [
      {
        "id": "1",
        "minDistance": 0,
        "maxDistance": 3,
        "fee": 5,
        "estimatedTime": "30-45 min",
        "active": true
      },
      {
        "id": "2",
        "minDistance": 3,
        "maxDistance": 6,
        "fee": 8,
        "estimatedTime": "45-60 min",
        "active": true
      }
    ]
  }'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  slug = EXCLUDED.slug,
  logo_url = EXCLUDED.logo_url,
  cover_url = EXCLUDED.cover_url,
  address = EXCLUDED.address,
  contact = EXCLUDED.contact,
  opening_hours = EXCLUDED.opening_hours,
  delivery_info = EXCLUDED.delivery_info,
  updated_at = NOW(); 