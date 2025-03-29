import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { Product, Addition } from '@/types/restaurant'

interface CartItem {
  id: string
  product: Product
  quantity: number
  observation?: string
  selectedAdditions: Addition[]
  halfHalf?: {
    firstHalf: {
      product: Product
      selectedAdditions?: Addition[]
    }
    secondHalf: {
      product: Product
      selectedAdditions?: Addition[]
    }
  }
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  addHalfHalfItem: (item: Omit<CartItem, 'id'> & { halfHalf: { firstHalf: any, secondHalf: any } }) => void
  removeItem: (itemId: string) => void
  updateItemQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => ({
          items: [
            ...state.items,
            {
              ...item,
              id: uuidv4(),
            },
          ],
        }))
      },

      addHalfHalfItem: (item) => {
        set((state) => ({
          items: [
            ...state.items,
            {
              id: uuidv4(),
              product: item.product,
              quantity: item.quantity,
              observation: item.observation,
              selectedAdditions: item.selectedAdditions,
              halfHalf: item.halfHalf
            },
          ],
        }))
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }))
      },

      updateItemQuantity: (itemId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item,
          ),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      getTotalPrice: () => {
        const { items } = get()
        return items.reduce((total, item) => {
          if (item.halfHalf) {
            const firstHalfPrice = item.halfHalf.firstHalf.product.price / 2
            const secondHalfPrice = item.halfHalf.secondHalf.product.price / 2
            const basePrice = Math.max(firstHalfPrice, secondHalfPrice) * 2
            
            const firstHalfAdditionsPrice = item.halfHalf.firstHalf.selectedAdditions?.reduce(
              (acc, addition) => acc + addition.price, 0
            ) || 0
            
            const secondHalfAdditionsPrice = item.halfHalf.secondHalf.selectedAdditions?.reduce(
              (acc, addition) => acc + addition.price, 0
            ) || 0
            
            const commonAdditionsPrice = item.selectedAdditions.reduce(
              (acc, addition) => acc + addition.price, 0
            )
            
            const totalPrice = (basePrice + firstHalfAdditionsPrice + secondHalfAdditionsPrice + commonAdditionsPrice) * item.quantity
            
            return total + totalPrice
          }
          
          const itemTotal =
            item.product.price * item.quantity +
            item.selectedAdditions.reduce((acc, addition) => acc + addition.price, 0) * item.quantity
          return total + itemTotal
        }, 0)
      },

      getTotalItems: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    },
  ),
) 