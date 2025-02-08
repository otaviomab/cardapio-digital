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
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
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
          const itemTotal =
            item.product.price * item.quantity +
            item.selectedAdditions.reduce((acc, addition) => acc + addition.price, 0)
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