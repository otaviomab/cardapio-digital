/**
 * Dados de mock para desenvolvimento e testes
 * 
 * IMPORTANTE: Estes dados são apenas para desenvolvimento e teste.
 * NÃO devem ser importados em código de produção.
 * Use a variável de ambiente NODE_ENV para verificar o ambiente antes de usar.
 */

import { Restaurant, Category, Product, RestaurantType, Addition } from '../types/restaurant'

export const restaurantMock: Restaurant = {
  id: '1',
  slug: 'restaurante-demo',
  name: 'Restaurante Demo',
  description: 'O melhor restaurante da cidade',
  logo: '/images/logotipo-new2.png',
  coverImage: '/images/hamburguer.png',
  address: {
    street: 'Rua das Flores',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567'
  },
  contact: {
    phone: '(11) 1234-5678',
    whatsapp: '(11) 91234-5678',
    email: 'contato@restaurantedemo.com.br'
  },
  openingHours: [
    { 
      days: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
      start: '11:00',
      end: '23:00',
      enabled: true
    },
    { 
      days: ['Sábado', 'Domingo'],
      start: '11:00',
      end: '22:00',
      enabled: true
    }
  ],
  deliveryInfo: {
    minimumOrder: 20,
    deliveryTime: '30-45 min',
    paymentMethods: ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX'],
    zones: [
      {
        name: 'Zona 1 (até 3km)',
        minDistance: 0,
        maxDistance: 3,
        fee: 5
      },
      {
        name: 'Zona 2 (3-6km)',
        minDistance: 3,
        maxDistance: 6,
        fee: 8
      }
    ]
  },
  restaurantType: RestaurantType.RESTAURANT
}

export const categoriesMock: Category[] = [
  { id: '1', name: 'Destaques', active: true },
  { id: '2', name: 'Entradas', active: true },
  { id: '3', name: 'Principais', active: true },
  { id: '4', name: 'Sobremesas', active: true },
  { id: '5', name: 'Bebidas', active: true }
]

export const productsMock: Product[] = [
  {
    id: '1',
    name: 'Hambúrguer Clássico',
    description: 'Pão, hambúrguer 180g, queijo, alface, tomate e molho especial',
    price: 29.90,
    image: '/images/hamburguer.png',
    category: '1',
    active: true,
    additions: [
      {
        id: '1',
        name: 'Bacon',
        price: 4.90,
        active: true
      },
      {
        id: '2',
        name: 'Queijo Extra',
        price: 3.90,
        active: true
      },
      {
        id: '3',
        name: 'Cebola Caramelizada',
        price: 2.90,
        active: true
      }
    ]
  },
  {
    id: '2',
    name: 'Batata Frita',
    description: 'Porção de batata frita crocante',
    price: 19.90,
    image: '/images/batata.jpg',
    category: '2',
    active: true,
    additions: [
      {
        id: '4',
        name: 'Cheddar',
        price: 5.90,
        active: true
      },
      {
        id: '5',
        name: 'Bacon',
        price: 4.90,
        active: true
      }
    ]
  },
  {
    id: '3',
    name: 'Refrigerante',
    description: 'Lata 350ml',
    price: 6.90,
    image: '/images/coca cola.webp',
    category: '5',
    active: true
  },
  {
    id: '4',
    name: 'Pizza Margherita',
    description: 'Molho de tomate, mussarela, manjericão fresco e azeite',
    price: 49.90,
    image: '/images/pizza.jpg',
    category: '3',
    active: true,
    isPizza: true,
    allowHalfHalf: true,
    additions: [
      {
        id: '6',
        name: 'Borda Recheada',
        price: 8.90,
        active: true
      },
      {
        id: '7',
        name: 'Mussarela Extra',
        price: 6.90,
        active: true
      }
    ]
  }
] 