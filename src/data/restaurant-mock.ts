import { Restaurant, Category, Product } from '../types/restaurant'

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
    { days: 'Segunda à Sexta', hours: '11:00 às 23:00' },
    { days: 'Sábado e Domingo', hours: '11:00 às 22:00' }
  ],
  deliveryInfo: {
    minimumOrder: 20,
    deliveryTime: '30-45 min',
    deliveryFee: 5,
    paymentMethods: ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX'],
    zones: [
      {
        id: '1',
        minDistance: 0,
        maxDistance: 3,
        fee: 5,
        estimatedTime: '30-45 min',
        active: true
      },
      {
        id: '2',
        minDistance: 3,
        maxDistance: 6,
        fee: 8,
        estimatedTime: '45-60 min',
        active: true
      }
    ]
  }
}

export const categoriesMock: Category[] = [
  { id: '1', name: 'Destaques', description: 'Os mais pedidos', order: 1 },
  { id: '2', name: 'Entradas', description: 'Para começar bem', order: 2 },
  { id: '3', name: 'Principais', description: 'Pratos principais', order: 3 },
  { id: '4', name: 'Sobremesas', description: 'Para finalizar', order: 4 },
  { id: '5', name: 'Bebidas', description: 'Para acompanhar', order: 5 }
]

export const productsMock: Product[] = [
  {
    id: '1',
    name: 'Hambúrguer Clássico',
    description: 'Pão, hambúrguer 180g, queijo, alface, tomate e molho especial',
    price: 29.90,
    image: '/images/hamburguer.png',
    categoryId: '1',
    available: true,
    featured: true,
    additions: [
      {
        id: '1',
        name: 'Bacon',
        price: 4.90,
        available: true
      },
      {
        id: '2',
        name: 'Queijo Extra',
        price: 3.90,
        available: true
      },
      {
        id: '3',
        name: 'Cebola Caramelizada',
        price: 2.90,
        available: true
      }
    ]
  },
  {
    id: '2',
    name: 'Batata Frita',
    description: 'Porção de batata frita crocante',
    price: 19.90,
    image: '/images/batata.jpg',
    categoryId: '2',
    available: true,
    featured: false,
    additions: [
      {
        id: '4',
        name: 'Cheddar',
        price: 5.90,
        available: true
      },
      {
        id: '5',
        name: 'Bacon',
        price: 4.90,
        available: true
      }
    ]
  },
  {
    id: '3',
    name: 'Refrigerante',
    description: 'Lata 350ml',
    price: 6.90,
    image: '/images/coca cola.webp',
    categoryId: '5',
    available: true,
    featured: false
  },
  {
    id: '4',
    name: 'Pizza Margherita',
    description: 'Molho de tomate, mussarela, manjericão fresco e azeite',
    price: 49.90,
    image: '/images/pizza.jpg',
    categoryId: '3',
    available: true,
    featured: true,
    additions: [
      {
        id: '6',
        name: 'Borda Recheada',
        price: 8.90,
        available: true
      },
      {
        id: '7',
        name: 'Mussarela Extra',
        price: 6.90,
        available: true
      }
    ]
  }
] 