'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, Trash2, CreditCard, Banknote, QrCode, Wallet, Store } from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'
import { getRestaurantMock } from '@/lib/mocks'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NumericFormat, PatternFormat } from 'react-number-format'
import { v4 as uuidv4 } from 'uuid'
import { useRestaurantHours } from '@/hooks/useRestaurantHours'
import { useDeliveryFee } from '@/hooks/useDeliveryFee'
import { useSupabase } from '@/contexts/SupabaseContext'
import { fetchAddressByCep } from '@/lib/address'
import { InvalidCepError, AddressNotFoundError } from '@/services/errors'
import { toast } from 'react-hot-toast'
import { fetchAddressWithValidation, formatCep } from '@/services/cepService'

type OrderType = 'delivery' | 'pickup' | null

interface CustomerData {
  name: string
  phone: string
  email?: string
}

interface AddressData {
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Helper para calcular o preço do item corretamente
const calculateItemPrice = (item: CartItem) => {
  if (item.halfHalf) {
    // Para pizza meio a meio, calcula o preço baseado no sabor mais caro
    const firstHalfPrice = item.halfHalf.firstHalf.product.price / 2;
    const secondHalfPrice = item.halfHalf.secondHalf.product.price / 2;
    const basePrice = Math.max(firstHalfPrice, secondHalfPrice) * 2;
    
    // Adicionais são calculados separadamente
    const firstHalfAdditionsPrice = item.halfHalf.firstHalf.selectedAdditions?.reduce(
      (acc, addition) => acc + addition.price, 0
    ) || 0;
    
    const secondHalfAdditionsPrice = item.halfHalf.secondHalf.selectedAdditions?.reduce(
      (acc, addition) => acc + addition.price, 0
    ) || 0;
    
    return basePrice + firstHalfAdditionsPrice + secondHalfAdditionsPrice;
  }
  
  // Para produtos normais, retorna o preço base + adicionais
  return item.product.price + 
    item.selectedAdditions.reduce((acc, addition) => acc + addition.price, 0);
};

export default function CartPage() {
  const router = useRouter()
  const {
    items,
    removeItem,
    updateItemQuantity,
    getTotalPrice,
    getTotalItems,
    clearCart,
  } = useCartStore()

  // Estado para controlar o carregamento inicial do carrinho
  const [isCartLoading, setIsCartLoading] = useState(true)
  // Estado para controlar o carregamento durante o envio do pedido
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderType, setOrderType] = useState<OrderType>(null)
  const [selectedPayment, setSelectedPayment] = useState<string>('')
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    phone: '',
  })
  const [changeFor, setChangeFor] = useState<string>('')
  const [addressData, setAddressData] = useState<AddressData>({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  })
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [restaurantData, setRestaurantData] = useState<any>(null)
  const { supabase } = useSupabase()
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  // Carrega dados do restaurante
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        // Tenta obter o restaurantId do localStorage
        const storedRestaurantId = localStorage.getItem('current_restaurant_id')
        
        if (storedRestaurantId) {
          console.log('RestaurantId obtido do localStorage:', storedRestaurantId)
          setRestaurantId(storedRestaurantId)
          
          const { data: restaurant, error } = await supabase
            .from('restaurant_settings')
            .select('*')
            .eq('user_id', storedRestaurantId)
            .single()

          if (error) {
            console.error('Erro ao buscar dados do restaurante:', error)
            return
          }

          console.log('Dados do restaurante carregados:', {
            address: restaurant?.address,
            openingHours: restaurant?.opening_hours,
            deliveryZones: restaurant?.delivery_info?.zones
          })

          setRestaurantData(restaurant)
        } else {
          console.error('RestaurantId não encontrado no localStorage')
        }
      } catch (error) {
        console.error('Erro ao buscar dados do restaurante:', error)
      } finally {
        // Marca que o carregamento inicial foi concluído
        setIsCartLoading(false)
      }
    }

    fetchRestaurant()
  }, [supabase])

  // Validação de horário de funcionamento
  const { isOpen, nextOpeningTime, currentSchedule, isLoading } = useRestaurantHours(
    restaurantData?.opening_hours || []
  )

  // Cálculo de taxa de entrega
  const { fee, isLoading: feeLoading, error, estimatedTime, isDeliverable, calculateFee } = useDeliveryFee(
    restaurantData ? {
      street: restaurantData.address.street,
      number: restaurantData.address.number,
      neighborhood: restaurantData.address.neighborhood,
      city: restaurantData.address.city,
      state: restaurantData.address.state,
      zipCode: restaurantData.address.zipCode
    } : '',
    restaurantData?.delivery_info?.zones || []
  )

  // Atualiza a taxa de entrega quando o endereço é alterado
  useEffect(() => {
    console.log('🏁 INICIO - Verificando condições para cálculo:', {
      orderType,
      cep: addressData.cep,
      isDeliverable,
      error
    })

    console.log('🔍 Verificando condições para cálculo:', {
      orderType,
      addressData,
      restaurantData: {
        address: restaurantData?.address,
        deliveryZones: restaurantData?.delivery_info?.zones
      }
    })

    if (orderType === 'delivery' && 
        addressData.cep && 
        addressData.street && 
        addressData.number && 
        addressData.neighborhood && 
        addressData.city && 
        addressData.state) {
      const fullAddress = `${addressData.street}, ${addressData.number} - ${addressData.neighborhood}, ${addressData.city} - ${addressData.state}, ${addressData.cep}`
      
      console.log('📬 Endereço completo para cálculo:', fullAddress)
      console.log('📬 CEP específico:', addressData.cep)
      
      // Cria uma função para executar o cálculo com debounce
      const debouncedCalculate = setTimeout(() => {
        console.log('⏱️ Executando cálculo após debounce')
        calculateFee(fullAddress)
      }, 500) // Espera 500ms antes de calcular

      // Limpa o timeout se o componente for desmontado ou o endereço mudar
      return () => {
        console.log('🧹 Limpando timeout anterior')
        clearTimeout(debouncedCalculate)
      }
    }
  }, [orderType, addressData.cep, addressData.street, addressData.number, addressData.neighborhood, addressData.city, addressData.state, calculateFee])

  // Verifica se pode finalizar o pedido
  const canFinishOrder = 
    isOpen && // Restaurante está aberto
    orderType && 
    selectedPayment && 
    customerData.name && 
    customerData.phone && 
    (selectedPayment !== 'cash' || changeFor) && // Se for dinheiro, precisa do troco
    (orderType === 'pickup' || (orderType === 'delivery' && isDeliverable)) // Se for delivery, precisa estar na área de entrega

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '')
    setAddressData(prev => ({ ...prev, cep }))

    if (cep.length === 8) {
      setIsLoadingCep(true)
      try {
        // Usa a função com validação completa
        const result = await fetchAddressWithValidation(cep)
        
        if (result.isValid && result.address) {
          // Atualiza os dados do endereço
          setAddressData(prev => ({
            ...prev,
            cep: result.address.zipCode,
            street: result.address.street,
            neighborhood: result.address.neighborhood,
            city: result.address.city,
            state: result.address.state
          }))
        } else {
          // Exibe mensagem de erro
          toast.error(result.error || 'Erro ao buscar CEP')
          
          // Limpa os campos de endereço para preenchimento manual
          setAddressData(prev => ({
            ...prev,
            cep: formatCep(cep), // Mantém o CEP formatado
            street: '',
            neighborhood: '',
            city: '',
            state: ''
          }))
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
        
        // Tratamento específico para cada tipo de erro
        if (error instanceof InvalidCepError) {
          toast.error('CEP inválido. Verifique o número informado.')
        } else if (error instanceof AddressNotFoundError) {
          toast.error('CEP não encontrado. Verifique o número ou preencha o endereço manualmente.')
        } else {
          toast.error('Erro ao buscar CEP. Tente novamente ou preencha o endereço manualmente.')
        }
        
        // Limpa os campos de endereço para preenchimento manual
        setAddressData(prev => ({
          ...prev,
          street: '',
          neighborhood: '',
          city: '',
          state: ''
        }))
      } finally {
        setIsLoadingCep(false)
      }
    }
  }

  const handleFinishOrder = async () => {
    try {
      if (!restaurantId) {
        throw new Error('ID do restaurante não encontrado')
      }
      
      // Indica que está processando o pedido
      setIsSubmitting(true)
      
      // Verificar a estrutura dos produtos no carrinho
      console.log("Produtos no carrinho:", items);
      items.forEach(item => {
        // Log detalhado de todas as propriedades do produto para debug
        console.log("Detalhes completos do produto:", item.product);
        console.log("Chaves disponíveis:", Object.keys(item.product));
        
        // Verificar propriedades específicas
        if (item.product.categoryId) console.log("categoryId:", item.product.categoryId);
        if (item.product.categoryName) console.log("categoryName:", item.product.categoryName);
        if (item.product.category) console.log("category:", item.product.category);
      });

      // Criar o objeto do pedido
      const orderItems = items.map(item => {
        // Determina a categoria com base no produto
        const categoria = item.product?.category || 'Não classificado';
        
        return {
          productId: item.product.id || item.product._id || '',
          name: item.product.name,
          price: calculateItemPrice(item),
          quantity: item.quantity,
          observations: item.observation || '', 
          category: categoria, 
          
          // Informações de meia a meia
          isHalfHalf: !!item.halfHalf,
          halfHalf: item.halfHalf ? {
            firstHalf: {
              name: item.halfHalf.firstHalf.product.name,
              category: item.halfHalf.firstHalf.product.category || (item.product.isPizza ? 'Pizza' : categoria),
              additions: item.halfHalf.firstHalf.selectedAdditions?.map(a => ({
                name: a.name,
                price: a.price
              })) || []
            },
            secondHalf: {
              name: item.halfHalf.secondHalf.product.name,
              category: item.halfHalf.secondHalf.product.category || (item.product.isPizza ? 'Pizza' : categoria),
              additions: item.halfHalf.secondHalf.selectedAdditions?.map(a => ({
                name: a.name,
                price: a.price
              })) || []
            }
          } : null
        };
      });
      
      // Adiciona logs específicos para depuração de itens meio a meio
      orderItems.forEach((item, index) => {
        if (item.isHalfHalf && item.halfHalf) {
          console.log(`[DEPURAÇÃO] Item #${index + 1} meio a meio:`);
          console.log(`Primeira metade - Nome: ${item.halfHalf.firstHalf.name}`);
          console.log(`Primeira metade - Categoria: ${item.halfHalf.firstHalf.category}`);
          console.log(`Segunda metade - Nome: ${item.halfHalf.secondHalf.name}`);
          console.log(`Segunda metade - Categoria: ${item.halfHalf.secondHalf.category}`);
        }
      });
      
      console.log('Items para enviar:', JSON.stringify(orderItems, null, 2));
      
      const orderData = {
        action: 'createOrder',
        restaurantId: restaurantId,
        customer: {
          name: customerData.name,
          email: customerData.email || '',
          phone: customerData.phone
        },
        items: orderItems,
        subtotal: getTotalPrice(),
        total: getTotalPrice() + (orderType === 'delivery' ? fee : 0),
        deliveryFee: orderType === 'delivery' ? fee : 0,
        status: 'pending',
        orderType: orderType,
        deliveryMethod: orderType as 'delivery' | 'pickup',
        address: orderType === 'delivery' ? {
          street: addressData.street,
          number: addressData.number,
          complement: addressData.complement || '',
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state,
          cep: addressData.cep
        } : undefined,
        deliveryAddress: orderType === 'delivery' ? {
          street: addressData.street,
          number: addressData.number,
          complement: addressData.complement || '',
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.cep
        } : undefined,
        paymentMethod: selectedPayment,
        // Adiciona o troco quando o pagamento é em dinheiro
        ...(selectedPayment === 'cash' && changeFor ? {
          change: parseFloat(changeFor.replace(/[^\d,]/g, '').replace(',', '.'))
        } : {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      console.log('Enviando pedido:', orderData)

      // Envia o pedido para a API do Next.js que salva no MongoDB
      const response = await fetch('/api/mongodb?action=createOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar pedido')
      }

      const data = await response.json()
      console.log('Pedido criado com sucesso:', data)

      // Verifica se temos um ID válido antes de redirecionar
      if (!data.id && !data._id) {
        throw new Error('ID do pedido não retornado pelo servidor')
      }

      // Usa o id ou _id, o que estiver disponível
      const orderId = data.id || data._id

      // Primeiro redireciona para a página de status
      // Isso garante que a navegação comece antes de limpar o carrinho
      router.push(`/order-status/${orderId}`);
      
      // Pequeno atraso antes de limpar o carrinho para garantir que a navegação já começou
      setTimeout(() => {
        clearCart();
      }, 100);
      
    } catch (error) {
      console.error('Erro completo:', error)
      if (error instanceof Error) {
        alert(`Erro ao finalizar pedido: ${error.message}`)
      } else {
        alert('Erro ao finalizar pedido. Por favor, tente novamente.')
      }
    } finally {
      // Marca que o carregamento foi concluído
      setIsSubmitting(false)
    }
  }

  // Componente de Loading
  if (isCartLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-krato-500"></div>
        <p className="text-zinc-900">Carregando carrinho...</p>
      </div>
    )
  }

  // Componente de Carrinho Vazio
  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold text-zinc-900">Seu carrinho está vazio</h1>
        <p className="text-zinc-900">Adicione itens para continuar</p>
        <Link
          href={`/${restaurantData?.slug || ''}`}
          className="mt-4 flex items-center gap-2 text-krato-500 hover:text-krato-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao cardápio
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-32">
      {/* Alerta de Horário de Funcionamento */}
      {!isLoading && !isOpen && (
        <div className="fixed left-0 right-0 top-16 z-50 bg-red-50 p-4">
          <div className="container mx-auto flex items-center justify-between px-4 text-red-700">
            <div>
              <p className="font-medium">Restaurante fechado</p>
              {nextOpeningTime && (
                <p className="text-sm" key="next-opening">Abriremos às {nextOpeningTime}</p>
              )}
              {currentSchedule && (
                <p className="text-sm" key="current-schedule">Horário hoje: {currentSchedule}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b bg-white">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link
            href={`/${restaurantData?.slug || ''}`}
            className="flex items-center gap-2 text-zinc-900 hover:text-zinc-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Link>

          <span className="text-lg font-medium text-zinc-900">
            Carrinho ({getTotalItems()} itens)
          </span>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-24">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Lista de Itens */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-zinc-900">Itens do Pedido</h2>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`cart-item-${item.id}`}
                  className="flex gap-4 rounded-lg border border-zinc-200 bg-white p-4"
                >
                  {item.product.image && (
                    <div className="relative aspect-square h-24 w-24 overflow-hidden rounded-lg">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="(max-width: 768px) 100px, 96px"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-zinc-900">
                          {item.halfHalf 
                            ? `${item.product.name} (Meio a Meio)` 
                            : item.product.name
                          }
                        </h3>
                        
                        {item.halfHalf ? (
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center gap-1">
                              <div className="h-3 w-3 rounded-full bg-krato-500"></div>
                              <p className="text-sm text-zinc-900">
                                <span className="font-medium">Primeira metade:</span> {item.halfHalf.firstHalf.product.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="h-3 w-3 rounded-full bg-krato-700"></div>
                              <p className="text-sm text-zinc-900">
                                <span className="font-medium">Segunda metade:</span> {item.halfHalf.secondHalf.product.name}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-600">{item.product.description}</p>
                        )}
                        
                        <span className="text-sm text-zinc-900">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(calculateItemPrice(item))}
                        </span>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="rounded-md p-1 hover:bg-zinc-50"
                      >
                        <Trash2 className="h-5 w-5 text-zinc-500" />
                      </button>
                    </div>

                    {/* Adicionais para pizza meio a meio */}
                    {item.halfHalf && (
                      <>
                        {/* Adicionais da primeira metade */}
                        {item.halfHalf.firstHalf.selectedAdditions && item.halfHalf.firstHalf.selectedAdditions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <span className="text-sm font-medium text-zinc-900">
                              Adicionais (Primeira metade):
                            </span>
                            {item.halfHalf.firstHalf.selectedAdditions.map((addition) => (
                              <div
                                key={`cart-addition-half1-${item.id}-${addition.id}`}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-zinc-900">
                                  {addition.name}
                                </span>
                                <span className="text-zinc-900">
                                  +{' '}
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(addition.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Adicionais da segunda metade */}
                        {item.halfHalf.secondHalf.selectedAdditions && item.halfHalf.secondHalf.selectedAdditions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <span className="text-sm font-medium text-zinc-900">
                              Adicionais (Segunda metade):
                            </span>
                            {item.halfHalf.secondHalf.selectedAdditions.map((addition) => (
                              <div
                                key={`cart-addition-half2-${item.id}-${addition.id}`}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-zinc-900">
                                  {addition.name}
                                </span>
                                <span className="text-zinc-900">
                                  +{' '}
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(addition.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* Adicionais normais */}
                    {!item.halfHalf && item.selectedAdditions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <span className="text-sm font-medium text-zinc-900">
                          Adicionais:
                        </span>
                        {item.selectedAdditions.map((addition) => (
                          <div
                            key={`cart-addition-${item.id}-${addition.id}`}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-zinc-900">
                              {addition.name}
                            </span>
                            <span className="text-zinc-900">
                              +{' '}
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(addition.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.observation && (
                      <div className="mt-2 space-y-1">
                        <span className="text-sm font-medium text-zinc-900">
                          Observação:
                        </span>
                        <p className="text-sm text-zinc-900">
                          {item.observation}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateItemQuantity(
                            item.id,
                            Math.max(1, item.quantity - 1),
                          )
                        }
                        className="rounded-full bg-zinc-100 p-1.5 text-zinc-900 hover:bg-zinc-200"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-zinc-900">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateItemQuantity(item.id, item.quantity + 1)
                        }
                        className="rounded-full bg-zinc-100 p-1.5 text-zinc-900 hover:bg-zinc-200"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {item.quantity > 1 && (
                      <div className="mt-2 text-sm font-medium text-zinc-900 text-right">
                        Total: {formatCurrency(calculateItemPrice(item) * item.quantity)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo e Checkout */}
          <div className="lg:pl-8">
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h2 className="text-lg font-medium text-zinc-900">Resumo do Pedido</h2>

              {/* Tipo de Pedido */}
              <div className="mt-6 space-y-4">
                <span className="text-sm font-medium text-zinc-900">
                  Como você quer receber seu pedido?
                </span>

                <div className="space-y-2">
                  <label
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 p-4"
                  >
                    <input
                      type="radio"
                      name="orderType"
                      value="delivery"
                      checked={orderType === 'delivery'}
                      onChange={(e) => setOrderType(e.target.value as OrderType)}
                      className="h-4 w-4 border-zinc-300 text-krato-500 focus:ring-krato-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900">Delivery</span>
                      <span className="text-sm text-zinc-600">Receba em casa</span>
                    </div>
                  </label>

                  <label
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 p-4"
                  >
                    <input
                      type="radio"
                      name="orderType"
                      value="pickup"
                      checked={orderType === 'pickup'}
                      onChange={(e) => setOrderType(e.target.value as OrderType)}
                      className="h-4 w-4 border-zinc-300 text-krato-500 focus:ring-krato-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900">Retirada</span>
                      <span className="text-sm text-zinc-600">Retire no local</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-zinc-900">
                  <span>Subtotal</span>
                  <span>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(getTotalPrice())}
                  </span>
                </div>

                {orderType === 'delivery' && (
                  <div className="flex items-center justify-between text-zinc-900">
                    <span>Taxa de Entrega</span>
                    <div className="text-right">
                      {feeLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-krato-600" />
                          <span className="text-zinc-600">Calculando...</span>
                        </div>
                      ) : error ? (
                        <div className="mt-2 text-red-500 text-sm">
                          {error === 'Endereço fora da área de entrega' ? (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                              <p className="font-medium">Endereço fora da área de entrega</p>
                              <p className="text-xs mt-1">
                                Verifique se o CEP está correto ou tente um endereço próximo.
                                Se você estiver muito próximo da nossa área de entrega, entre em contato conosco.
                              </p>
                            </div>
                          ) : (
                            error
                          )}
                        </div>
                      ) : (
                        <span>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(fee || 0)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t border-zinc-200 pt-4">
                  <div className="flex items-center justify-between font-medium text-zinc-900">
                    <span>Total</span>
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(getTotalPrice() + (orderType === 'delivery' ? fee : 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Endereço de Entrega */}
              {orderType === 'delivery' && (
                <div className="mt-8 space-y-4">
                  <h3 className="font-medium text-zinc-900">Endereço de Entrega</h3>

                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="CEP"
                        value={addressData.cep}
                        onChange={handleCepChange}
                        maxLength={9}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-krato-600 focus:outline-none focus:ring-1 focus:ring-krato-600"
                      />
                      {isLoadingCep && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-krato-600" />
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Rua"
                        value={addressData.street}
                        onChange={(e) => setAddressData(prev => ({ ...prev, street: e.target.value }))}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-krato-600 focus:outline-none focus:ring-1 focus:ring-krato-600"
                      />
                      <input
                        type="text"
                        placeholder="Número"
                        value={addressData.number}
                        onChange={(e) => setAddressData(prev => ({ ...prev, number: e.target.value }))}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-krato-600 focus:outline-none focus:ring-1 focus:ring-krato-600"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Complemento"
                      value={addressData.complement}
                      onChange={(e) => setAddressData(prev => ({ ...prev, complement: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-krato-600 focus:outline-none focus:ring-1 focus:ring-krato-600"
                    />

                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Bairro"
                        value={addressData.neighborhood}
                        onChange={(e) => setAddressData(prev => ({ ...prev, neighborhood: e.target.value }))}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-krato-600 focus:outline-none focus:ring-1 focus:ring-krato-600"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Cidade"
                          value={addressData.city}
                          onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-krato-600 focus:outline-none focus:ring-1 focus:ring-krato-600"
                        />
                        <input
                          type="text"
                          placeholder="UF"
                          value={addressData.state}
                          onChange={(e) => setAddressData(prev => ({ ...prev, state: e.target.value }))}
                          maxLength={2}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-krato-600 focus:outline-none focus:ring-1 focus:ring-krato-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dados do Cliente */}
              <div className="mt-8 space-y-4">
                <h3 className="font-medium text-zinc-900">Seus Dados</h3>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={customerData.name}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-krato-600 focus:outline-none focus:ring-1 focus:ring-krato-600"
                  />

                  <PatternFormat
                    format="(##) #####-####"
                    type="tel"
                    placeholder="Telefone (WhatsApp)"
                    value={customerData.phone}
                    onValueChange={(values) => {
                      setCustomerData(prev => ({ ...prev, phone: values.value }))
                    }}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-krato-600 focus:outline-none focus:ring-1 focus:ring-krato-600"
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              {orderType && customerData.name && customerData.phone && (
                <div className="mt-8 space-y-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-medium text-zinc-900">Forma de Pagamento</h3>
                    <p className="text-sm text-zinc-600">Pagamento na {orderType === 'delivery' ? 'Entrega' : 'Retirada'}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 rounded-lg border border-zinc-200 p-4">
                      <input
                        type="radio"
                        name="payment"
                        value="credit_card"
                        checked={selectedPayment === 'credit_card'}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="h-4 w-4 border-zinc-300 text-krato-500 focus:ring-krato-500"
                      />
                      <div className="flex flex-1 items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-zinc-500" />
                          <span className="text-sm text-zinc-900">Cartão de Crédito</span>
                        </div>
                        <span className="text-xs text-zinc-500">Visa, Mastercard, Elo, American Express</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 rounded-lg border border-zinc-200 p-4">
                      <input
                        type="radio"
                        name="payment"
                        value="debit_card"
                        checked={selectedPayment === 'debit_card'}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="h-4 w-4 border-zinc-300 text-krato-500 focus:ring-krato-500"
                      />
                      <div className="flex flex-1 items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-zinc-500" />
                          <span className="text-sm text-zinc-900">Cartão de Débito</span>
                        </div>
                        <span className="text-xs text-zinc-500">Visa, Mastercard, Elo</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 rounded-lg border border-zinc-200 p-4">
                      <input
                        type="radio"
                        name="payment"
                        value="pix"
                        checked={selectedPayment === 'pix'}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="h-4 w-4 border-zinc-300 text-krato-500 focus:ring-krato-500"
                      />
                      <div className="flex flex-1 items-center justify-between">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-zinc-500" />
                          <span className="text-sm text-zinc-900">PIX</span>
                        </div>
                        <span className="text-xs text-zinc-500">Pagamento instantâneo</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 rounded-lg border border-zinc-200 p-4">
                      <input
                        type="radio"
                        name="payment"
                        value="cash"
                        checked={selectedPayment === 'cash'}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="h-4 w-4 border-zinc-300 text-krato-500 focus:ring-krato-500"
                      />
                      <div className="flex flex-1 items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-zinc-500" />
                          <span className="text-sm text-zinc-900">Dinheiro</span>
                        </div>
                        <span className="text-xs text-zinc-500">Pagamento em espécie</span>
                      </div>
                    </label>

                    {selectedPayment === 'cash' && (
                      <div className="rounded-lg border border-zinc-200 p-4">
                        <label className="flex flex-col gap-2">
                          <span className="text-sm text-zinc-600">Precisa de troco para quanto?</span>
                          <NumericFormat
                            placeholder="R$ 0,00"
                            value={changeFor}
                            onValueChange={(values) => {
                              const formattedValue = new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(values.floatValue || 0)
                              setChangeFor(formattedValue)
                            }}
                            thousandSeparator="."
                            decimalSeparator=","
                            prefix="R$ "
                            decimalScale={2}
                            fixedDecimalScale
                            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-krato-600 focus:outline-none focus:ring-1 focus:ring-krato-600"
                          />
                        </label>
                      </div>
                    )}

                    <label className="flex items-center gap-2 rounded-lg border border-zinc-200 p-4">
                      <input
                        type="radio"
                        name="payment"
                        value="meal_voucher"
                        checked={selectedPayment === 'meal_voucher'}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="h-4 w-4 border-zinc-300 text-krato-500 focus:ring-krato-500"
                      />
                      <div className="flex flex-1 items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-zinc-500" />
                          <span className="text-sm text-zinc-900">Vale-Refeição</span>
                        </div>
                        <span className="text-xs text-zinc-500">Alelo, Sodexo, VR, Ticket</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Botão de Finalizar com espaçamento maior */}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleFinishOrder}
                  disabled={!canFinishOrder || isSubmitting}
                  className={`w-full rounded-lg px-4 py-3 text-center font-medium text-white transition-colors
                    ${canFinishOrder && !isSubmitting
                      ? 'bg-krato-500 hover:bg-krato-600'
                      : 'cursor-not-allowed bg-zinc-300'
                    }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Processando...</span>
                    </div>
                  ) : !isLoading && !feeLoading
                    ? canFinishOrder
                      ? 'Finalizar Pedido'
                      : !isOpen
                        ? 'Restaurante Fechado'
                        : orderType === 'delivery' && !isDeliverable && addressData.cep
                          ? 'Fora da Área de Entrega'
                          : 'Preencha Todos os Campos'
                    : 'Carregando...'}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 