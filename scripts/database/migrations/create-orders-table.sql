-- Habilita a extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cria o tipo enum para status do pedido
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

-- Cria a tabela de pedidos
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES auth.users(id),
  status order_status NOT NULL DEFAULT 'pending',
  order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup')),
  customer JSONB NOT NULL,
  address JSONB,
  payment JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2),
  total DECIMAL(10,2) NOT NULL,
  status_updates JSONB[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cria índices para melhor performance
CREATE INDEX orders_restaurant_id_idx ON orders(restaurant_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_created_at_idx ON orders(created_at DESC);

-- Habilita RLS (Row Level Security)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Cria políticas de acesso
-- Restaurante pode ver apenas seus próprios pedidos
CREATE POLICY "Restaurantes podem ver seus próprios pedidos"
  ON orders FOR SELECT
  TO authenticated
  USING (restaurant_id = auth.uid());

-- Restaurante pode inserir pedidos para si mesmo
CREATE POLICY "Restaurantes podem criar pedidos"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (restaurant_id = auth.uid());

-- Restaurante pode atualizar seus próprios pedidos
CREATE POLICY "Restaurantes podem atualizar seus pedidos"
  ON orders FOR UPDATE
  TO authenticated
  USING (restaurant_id = auth.uid());

-- Função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar o updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 