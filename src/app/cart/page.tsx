'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, Trash2, CreditCard, Banknote, QrCode, Wallet, Store } from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'
import { restaurantMock } from '@/data/restaurant-mock'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NumericFormat, PatternFormat } from 'react-number-format'
import { v4 as uuidv4 } from 'uuid'
import { useRestaurantHours } from '@/hooks/useRestaurantHours'
import { useDeliveryFee } from '@/hooks/useDeliveryFee'
import { useSupabase } from '@/contexts/SupabaseContext'

type OrderType = 'delivery' | 'pickup' | null

interface CustomerData {
  name: string
  phone: string
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

  // Busca os dados do restaurante
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const { data: restaurant, error } = await supabase
          .from('restaurant_settings')
          .select('*')
          .eq('user_id', 'e0dba73b-0870-4b0d-8026-7341db950c16') // ID fixo do restaurante demo
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

        // Garante que as zonas de entrega existam
        const deliveryZones = restaurant?.delivery_info?.zones || [
          {
            id: '1',
            minDistance: 0,
            maxDistance: 3,
            fee: 5,
            estimatedTime: '30-45 min',
            active: true
          }
        ]

        setRestaurantData({
          ...restaurant,
          delivery_info: {
            ...restaurant?.delivery_info,
            zones: deliveryZones
          }
        })
      } catch (error) {
        console.error('Erro ao buscar dados do restaurante:', error)
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
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()

        if (!data.erro) {
          setAddressData(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }))
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      } finally {
        setIsLoadingCep(false)
      }
    }
  }

  const handleFinishOrder = async () => {
    try {
      // Cria o objeto do pedido
      const orderData = {
        restaurantId: restaurantData?.user_id, // Usa o ID real do restaurante
        status: 'pending',
        orderType,
        customer: customerData,
        address: orderType === 'delivery' ? addressData : null,
        payment: {
          method: selectedPayment,
          change: selectedPayment === 'cash' ? changeFor : null,
        },
        items: items.map(item => ({
          id: item.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          observation: item.observation || null,
          additions: item.selectedAdditions.map(addition => ({
            name: addition.name,
            price: addition.price,
          })),
        })),
        subtotal: getTotalPrice(),
        deliveryFee: orderType === 'delivery' ? fee : null,
        total: getTotalPrice() + (orderType === 'delivery' ? fee : 0),
        statusUpdates: [{
          status: 'pending',
          timestamp: new Date(),
          message: 'Pedido realizado'
        }]
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

      // Limpa o carrinho
      clearCart()

      // Redireciona para a página de status
      router.push(`/order-status/${data._id}`)
    } catch (error) {
      console.error('Erro completo:', error)
      if (error instanceof Error) {
        alert(`Erro ao finalizar pedido: ${error.message}`)
      } else {
        alert('Erro ao finalizar pedido. Por favor, tente novamente.')
      }
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold text-zinc-900">Seu carrinho está vazio</h1>
        <p className="text-zinc-900">Adicione itens para continuar</p>
        <Link
          href={`/${restaurantData?.slug || ''}`}
          className="mt-4 flex items-center gap-2 text-green-600 hover:text-green-700"
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
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-zinc-900">{item.product.name}</h3>
                        <p className="text-sm text-zinc-600">{item.product.description}</p>
                        <span className="text-sm text-zinc-900">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(item.product.price)}
                        </span>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="rounded-md p-1 hover:bg-zinc-50"
                      >
                        <Trash2 className="h-5 w-5 text-zinc-500" />
                      </button>
                    </div>

                    {item.selectedAdditions.length > 0 && (
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
                      className="h-4 w-4 border-zinc-300 text-green-600 focus:ring-green-600"
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
                      className="h-4 w-4 border-zinc-300 text-green-600 focus:ring-green-600"
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
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-green-600" />
                          <span className="text-zinc-600">Calculando...</span>
                        </div>
                      ) : error ? (
                        <span className="text-red-600">{error}</span>
                      ) : fee !== null ? (
                        <div>
                          <span className="text-zinc-900">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(fee)}
                          </span>
                          {estimatedTime && (
                            <p className="text-sm text-zinc-600">
                              Tempo estimado: {estimatedTime}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-600">Selecione um endereço válido</span>
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
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      />
                      {isLoadingCep && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-green-600" />
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Rua"
                        value={addressData.street}
                        onChange={(e) => setAddressData(prev => ({ ...prev, street: e.target.value }))}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      />
                      <input
                        type="text"
                        placeholder="Número"
                        value={addressData.number}
                        onChange={(e) => setAddressData(prev => ({ ...prev, number: e.target.value }))}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Complemento"
                      value={addressData.complement}
                      onChange={(e) => setAddressData(prev => ({ ...prev, complement: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                    />

                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Bairro"
                        value={addressData.neighborhood}
                        onChange={(e) => setAddressData(prev => ({ ...prev, neighborhood: e.target.value }))}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Cidade"
                          value={addressData.city}
                          onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                        />
                        <input
                          type="text"
                          placeholder="UF"
                          value={addressData.state}
                          onChange={(e) => setAddressData(prev => ({ ...prev, state: e.target.value }))}
                          maxLength={2}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
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
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  />

                  <PatternFormat
                    format="(##) #####-####"
                    type="tel"
                    placeholder="Telefone (WhatsApp)"
                    value={customerData.phone}
                    onValueChange={(values) => {
                      setCustomerData(prev => ({ ...prev, phone: values.value }))
                    }}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
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
                        value="credit"
                        checked={selectedPayment === 'credit'}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="h-4 w-4 border-zinc-300 text-green-600 focus:ring-green-600"
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
                        value="debit"
                        checked={selectedPayment === 'debit'}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="h-4 w-4 border-zinc-300 text-green-600 focus:ring-green-600"
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
                        className="h-4 w-4 border-zinc-300 text-green-600 focus:ring-green-600"
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
                        className="h-4 w-4 border-zinc-300 text-green-600 focus:ring-green-600"
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
                            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                          />
                        </label>
                      </div>
                    )}

                    <label className="flex items-center gap-2 rounded-lg border border-zinc-200 p-4">
                      <input
                        type="radio"
                        name="payment"
                        value="wallet"
                        checked={selectedPayment === 'wallet'}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="h-4 w-4 border-zinc-300 text-green-600 focus:ring-green-600"
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

              <button 
                disabled={!canFinishOrder}
                onClick={handleFinishOrder}
                className="mt-8 w-full rounded-full bg-green-600 px-4 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {!isLoading 
                  ? 'Restaurante fechado'
                  : !orderType 
                  ? 'Escolha como quer receber seu pedido'
                  : !customerData.name || !customerData.phone
                  ? 'Preencha seus dados'
                  : !selectedPayment
                  ? 'Escolha a forma de pagamento'
                  : selectedPayment === 'cash' && !changeFor
                  ? 'Informe o valor para troco'
                  : orderType === 'delivery' && !isDeliverable
                  ? 'Endereço fora da área de entrega'
                  : 'Finalizar Pedido'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 