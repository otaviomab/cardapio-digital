'use client'

import { useState, useEffect } from 'react'
import { 
  Store,
  MapPin,
  Clock,
  Truck,
  CreditCard,
  Save,
  Loader2,
  Plus,
  AlertTriangle
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useSupabase } from '@/contexts/SupabaseContext'
import { PatternFormat } from 'react-number-format'
import { DeliveryZones } from './components/delivery-zones'
import { getAddressCoordinates } from '@/lib/delivery'
import { DeliveryZone } from '@/types/delivery'
import { ImageUpload } from '@/components/image-upload'
import { fetchAddressByCep } from '@/lib/address'
import { 
  validateHourFormat, 
  validateHourSequence, 
  checkConflicts, 
  normalizeHours,
  translateWeekDay,
  type WeekDay,
  type OpeningHour
} from '@/lib/hours-validation'

interface RestaurantSettings {
  name: string
  description: string
  logo: string
  coverImage: string
  address: {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  contact: {
    phone: string
    whatsapp: string
    email: string
  }
  openingHours: OpeningHour[]
  deliveryInfo: {
    minimumOrder: number
    deliveryTime: string
    paymentMethods: string[]
    zones: DeliveryZone[]
  }
}

// Adicionar constante com os dias válidos
const VALID_WEEK_DAYS: WeekDay[] = [
  'domingo',
  'segunda',
  'terca',
  'quarta',
  'quinta',
  'sexta',
  'sabado'
]

export default function SettingsPage() {
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<RestaurantSettings>({
    name: '',
    description: '',
    logo: '',
    coverImage: '',
    address: {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: undefined
    },
    contact: {
      phone: '',
      whatsapp: '',
      email: ''
    },
    openingHours: [
      { days: [], start: '', end: '', enabled: true }
    ],
    deliveryInfo: {
      minimumOrder: 0,
      deliveryTime: '',
      paymentMethods: [],
      zones: []
    }
  })

  // Carrega as configurações
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.log('Usuário não autenticado')
          return
        }

        const { data, error } = await supabase
          .from('restaurant_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('Nenhuma configuração encontrada para o usuário')
            return
          }
          throw error
        }

        if (data) {
          // Validar e converter os dias da semana ao carregar
          const validatedOpeningHours = data.opening_hours?.map((hour: any) => ({
            days: Array.isArray(hour.days) 
              ? hour.days.filter((day: unknown) => VALID_WEEK_DAYS.includes(day as WeekDay)) as WeekDay[]
              : [],
            start: hour.start || '',
            end: hour.end || '',
            enabled: hour.enabled ?? true
          })) || []

          setSettings({
            name: data.name || '',
            description: data.description || '',
            logo: data.logo_url || '',
            coverImage: data.cover_url || '',
            address: {
              street: data.address?.street || '',
              number: data.address?.number || '',
              neighborhood: data.address?.neighborhood || '',
              city: data.address?.city || '',
              state: data.address?.state || '',
              zipCode: data.address?.zipCode || '',
              coordinates: data.address?.coordinates
            },
            contact: {
              phone: data.contact?.phone || '',
              whatsapp: data.contact?.whatsapp || '',
              email: data.contact?.email || ''
            },
            openingHours: validatedOpeningHours.length > 0 
              ? validatedOpeningHours
              : [{ days: [], start: '', end: '', enabled: true }],
            deliveryInfo: {
              minimumOrder: data.delivery_info?.minimumOrder || 0,
              deliveryTime: data.delivery_info?.deliveryTime || '',
              paymentMethods: data.delivery_info?.paymentMethods || [],
              zones: data.delivery_info?.zones || []
            }
          })
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
        alert('Erro ao carregar configurações. Tente recarregar a página.')
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [supabase])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Validações básicas
      if (!settings.name?.trim()) {
        throw new Error('O nome do restaurante é obrigatório')
      }

      // Validar horários
      const normalizedHours = normalizeHours(settings.openingHours)
      
      // Verificar se há horários inválidos
      const invalidHours = settings.openingHours.filter((hour: OpeningHour) => 
        hour.enabled && (!validateHourFormat(hour.start) || !validateHourFormat(hour.end))
      )
      
      if (invalidHours.length > 0) {
        throw new Error('Existem horários em formato inválido. Use o formato HH:mm')
      }

      // Verificar sequência de horários
      const invalidSequences = settings.openingHours.filter((hour: OpeningHour) => 
        hour.enabled && !validateHourSequence(hour.start, hour.end)
      )

      if (invalidSequences.length > 0) {
        throw new Error('O horário final deve ser maior que o horário inicial')
      }

      // Verificar conflitos
      const { hasConflicts, conflicts } = checkConflicts(settings.openingHours)
      if (hasConflicts) {
        const conflictMessages = conflicts.map(conflict => {
          const days = conflict.days.map(translateWeekDay).join(', ')
          return `Conflito nos dias: ${days}`
        })
        throw new Error(`Existem horários sobrepostos:\n${conflictMessages.join('\n')}`)
      }

      // Se não tiver coordenadas do restaurante E o endereço foi alterado, tenta obtê-las
      if (!settings.address.coordinates && 
          settings.address.street && 
          settings.address.number && 
          settings.address.city) {
        const fullAddress = `${settings.address.street}, ${settings.address.number} - ${settings.address.neighborhood}, ${settings.address.city} - ${settings.address.state}, ${settings.address.zipCode}`
        try {
          const coordinates = await getAddressCoordinates(fullAddress)
          settings.address.coordinates = coordinates
        } catch (error) {
          console.error('Erro ao obter coordenadas:', error)
          // Não bloqueia o salvamento se não conseguir obter as coordenadas
        }
      }

      // Obtém o usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Gera o slug a partir do nome
      let slug = settings.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')

      // Verifica se já existe um restaurante com este slug
      const { data: existingSlug } = await supabase
        .from('restaurant_settings')
        .select('id')
        .eq('slug', slug)
        .neq('user_id', user.id)
        .single()

      // Se já existe um restaurante com este slug, adiciona um número incremental
      if (existingSlug) {
        let counter = 1
        let newSlug = `${slug}-${counter}`
        
        while (true) {
          const { data: slugCheck } = await supabase
            .from('restaurant_settings')
            .select('id')
            .eq('slug', newSlug)
            .neq('user_id', user.id)
            .single()
          
          if (!slugCheck) {
            slug = newSlug
            break
          }
          
          counter++
          newSlug = `${slug}-${counter}`
        }
      }

      // Verifica se já existe configuração para este usuário
      const { data: existingSettings } = await supabase
        .from('restaurant_settings')
        .select('id')
        .eq('user_id', user.id)
        .single()

      // Limpa e valida os dados antes de salvar
      const settingsData = {
        user_id: user.id,
        name: settings.name.trim(),
        description: settings.description?.trim() || '',
        slug,
        logo_url: settings.logo || '',
        cover_url: settings.coverImage || '',
        address: {
          street: settings.address.street?.trim() || '',
          number: settings.address.number?.trim() || '',
          neighborhood: settings.address.neighborhood?.trim() || '',
          city: settings.address.city?.trim() || '',
          state: settings.address.state?.trim() || '',
          zipCode: settings.address.zipCode?.replace(/\D/g, '') || '',
          coordinates: settings.address.coordinates
        },
        contact: {
          phone: settings.contact.phone?.replace(/\D/g, '') || '',
          whatsapp: settings.contact.whatsapp?.replace(/\D/g, '') || '',
          email: settings.contact.email?.trim().toLowerCase() || ''
        },
        opening_hours: normalizedHours
          .filter(hour => hour.enabled && hour.days.length > 0)
          .map(hour => ({
            days: hour.days.filter(day => VALID_WEEK_DAYS.includes(day)) as WeekDay[],
            start: hour.start.trim(),
            end: hour.end.trim(),
            enabled: hour.enabled
          })),
        delivery_info: {
          minimumOrder: Number(settings.deliveryInfo.minimumOrder) || 0,
          deliveryTime: settings.deliveryInfo.deliveryTime?.trim() || '',
          paymentMethods: settings.deliveryInfo.paymentMethods || [],
          zones: settings.deliveryInfo.zones.map(zone => ({
            ...zone,
            minDistance: Number(zone.minDistance) || 0,
            maxDistance: Number(zone.maxDistance) || 0,
            fee: Number(zone.fee) || 0
          }))
        }
      }

      if (existingSettings) {
        // Atualiza as configurações existentes
        const { error } = await supabase
          .from('restaurant_settings')
          .update(settingsData)
          .eq('user_id', user.id)

        if (error) {
          console.error('Erro ao atualizar:', error)
          throw new Error('Erro ao atualizar as configurações')
        }
      } else {
        // Cria novas configurações
        const { error } = await supabase
          .from('restaurant_settings')
          .insert([settingsData])

        if (error) {
          console.error('Erro ao criar:', error)
          throw new Error('Erro ao criar as configurações')
        }
      }

      alert('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert(error instanceof Error ? error.message : 'Erro ao salvar configurações. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'Geral', icon: Store },
    { id: 'address', label: 'Endereço', icon: MapPin },
    { id: 'hours', label: 'Horários', icon: Clock },
    { id: 'delivery', label: 'Entrega', icon: Truck },
    { id: 'payment', label: 'Pagamento', icon: CreditCard },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie as configurações do seu restaurante</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Conteúdo */}
      <div className="space-y-6">
        {/* Informações Gerais */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome do Restaurante
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={e => setSettings(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.contact.email}
                  onChange={e => setSettings(prev => ({
                    ...prev,
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <PatternFormat
                  format="(##) ####-####"
                  value={settings.contact?.phone || ''}
                  onValueChange={(values) => {
                    const value = values.value || ''
                    setSettings(prev => ({
                      ...prev,
                      contact: { ...prev.contact, phone: value }
                    }))
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  WhatsApp
                </label>
                <PatternFormat
                  format="(##) #####-####"
                  value={settings.contact?.whatsapp || ''}
                  onValueChange={(values) => {
                    const value = values.value || ''
                    setSettings(prev => ({
                      ...prev,
                      contact: { ...prev.contact, whatsapp: value }
                    }))
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <textarea
                value={settings.description}
                onChange={e => setSettings(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
              />
            </div>

            {/* Grid para Logo e Capa lado a lado */}
            <div className="max-w-3xl">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Logo do Restaurante
                  </label>
                  <div className="mt-1">
                    <ImageUpload
                      value={settings.logo}
                      onChange={(url) => setSettings(prev => ({ ...prev, logo: url }))}
                      folder="logos"
                      aspectRatio={1}
                      enforceAspectRatio={true}
                      maxWidth="w-full"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Recomendado: Imagem quadrada (1:1)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Imagem de Capa
                  </label>
                  <div className="mt-1">
                    <ImageUpload
                      value={settings.coverImage}
                      onChange={(url) => setSettings(prev => ({ ...prev, coverImage: url }))}
                      folder="covers"
                      aspectRatio={16/9}
                      enforceAspectRatio={false}
                      maxWidth="w-full"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Recomendado: Formato widescreen (16:9)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Endereço */}
        {activeTab === 'address' && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                CEP
              </label>
              <div className="relative mt-1">
                <PatternFormat
                  format="#####-###"
                  value={settings.address?.zipCode || ''}
                  onValueChange={async (values) => {
                    const newCep = values.value || ''
                    setSettings(prev => ({
                      ...prev,
                      address: { ...prev.address, zipCode: newCep }
                    }))

                    if (newCep.replace(/\D/g, '').length === 8) {
                      try {
                        const addressData = await fetchAddressByCep(newCep)
                        setSettings(prev => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            street: addressData.street || '',
                            neighborhood: addressData.neighborhood || '',
                            city: addressData.city || '',
                            state: addressData.state || '',
                            zipCode: addressData.zipCode || ''
                          }
                        }))
                      } catch (error) {
                        alert(error instanceof Error ? error.message : 'Erro ao buscar CEP')
                        setSettings(prev => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            street: '',
                            neighborhood: '',
                            city: '',
                            state: ''
                          }
                        }))
                      }
                    }
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Rua
              </label>
              <input
                type="text"
                value={settings.address.street}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  address: { ...prev.address, street: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Número
              </label>
              <input
                type="text"
                value={settings.address.number}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  address: { ...prev.address, number: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bairro
              </label>
              <input
                type="text"
                value={settings.address.neighborhood}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  address: { ...prev.address, neighborhood: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cidade
              </label>
              <input
                type="text"
                value={settings.address.city}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  address: { ...prev.address, city: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <input
                type="text"
                value={settings.address.state}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  address: { ...prev.address, state: e.target.value }
                }))}
                maxLength={2}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
              />
            </div>
          </div>
        )}

        {/* Horários */}
        {activeTab === 'hours' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Horários de Funcionamento
                </h3>
                <p className="text-sm text-gray-500">
                  Configure os horários de funcionamento do seu estabelecimento
                </p>
              </div>

              <div className="space-y-4">
                {settings.openingHours.map((hour, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={hour.enabled}
                          onCheckedChange={(checked) => {
                            const newHours = [...settings.openingHours]
                            newHours[index].enabled = checked
                            setSettings(prev => ({ ...prev, openingHours: newHours }))
                          }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {hour.enabled ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      {settings.openingHours.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newHours = settings.openingHours.filter((_, i) => i !== index)
                            setSettings(prev => ({ ...prev, openingHours: newHours }))
                          }}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Remover
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Dias da Semana
                        </label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {VALID_WEEK_DAYS.map((dayValue) => {
                            const dayLabel = {
                              domingo: 'Dom',
                              segunda: 'Seg',
                              terca: 'Ter',
                              quarta: 'Qua',
                              quinta: 'Qui',
                              sexta: 'Sex',
                              sabado: 'Sáb'
                            }[dayValue]

                            return (
                              <button
                                key={dayValue}
                                type="button"
                                onClick={() => {
                                  const newHours = [...settings.openingHours]
                                  const currentDays = newHours[index].days as WeekDay[]
                                  
                                  if (currentDays.includes(dayValue)) {
                                    // Remove o dia
                                    newHours[index].days = currentDays.filter(d => d !== dayValue)
                                  } else {
                                    // Adiciona o dia
                                    newHours[index].days = [...currentDays, dayValue]
                                  }
                                  
                                  setSettings(prev => ({ ...prev, openingHours: newHours }))
                                }}
                                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                                  hour.days.includes(dayValue)
                                    ? 'bg-green-50 text-green-700 border-2 border-green-600'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                              >
                                {dayLabel}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Horário Inicial
                          </label>
                          <input
                            type="time"
                            value={hour.start}
                            onChange={(e) => {
                              const newHours = [...settings.openingHours]
                              newHours[index].start = e.target.value
                              setSettings(prev => ({ ...prev, openingHours: newHours }))
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Horário Final
                          </label>
                          <input
                            type="time"
                            value={hour.end}
                            onChange={(e) => {
                              const newHours = [...settings.openingHours]
                              newHours[index].end = e.target.value
                              setSettings(prev => ({ ...prev, openingHours: newHours }))
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    openingHours: [
                      ...prev.openingHours,
                      { days: [], start: '', end: '', enabled: true }
                    ]
                  }))}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Horário
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-700" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Dicas para configurar os horários
                  </h4>
                  <ul className="mt-2 text-sm text-yellow-700">
                    <li>• Você pode criar diferentes horários para diferentes dias</li>
                    <li>• Para horários após meia-noite, crie dois períodos (ex: 18:00-23:59 e 00:00-02:00)</li>
                    <li>• Mantenha os horários atualizados para evitar pedidos fora do horário</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Entrega */}
        {activeTab === 'delivery' && (
          <div className="space-y-8">
            {/* Configurações Básicas */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Configurações Básicas de Entrega
              </h3>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pedido Mínimo
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                      R$
                    </span>
                    <input
                      type="number"
                      value={settings.deliveryInfo.minimumOrder}
                      onChange={e => setSettings(prev => ({
                        ...prev,
                        deliveryInfo: {
                          ...prev.deliveryInfo,
                          minimumOrder: Number(e.target.value)
                        }
                      }))}
                      className="block w-full rounded-none rounded-r-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tempo Médio de Entrega
                  </label>
                  <input
                    type="text"
                    value={settings.deliveryInfo.deliveryTime}
                    onChange={e => setSettings(prev => ({
                      ...prev,
                      deliveryInfo: {
                        ...prev.deliveryInfo,
                        deliveryTime: e.target.value
                      }
                    }))}
                    placeholder="Ex: 30-45 min"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Zonas de Entrega */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <DeliveryZones
                zones={settings.deliveryInfo.zones}
                onChange={(newZones) => {
                  setSettings(prev => ({
                    ...prev,
                    deliveryInfo: {
                      ...prev.deliveryInfo,
                      zones: newZones
                    }
                  }))
                }}
              />
            </div>

            {/* Coordenadas do Restaurante */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Localização do Restaurante
              </h3>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Endereço Completo
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={`${settings.address.street}, ${settings.address.number} - ${settings.address.neighborhood}, ${settings.address.city} - ${settings.address.state}, ${settings.address.zipCode}`}
                      readOnly
                      className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const fullAddress = `${settings.address.street}, ${settings.address.number} - ${settings.address.neighborhood}, ${settings.address.city} - ${settings.address.state}, ${settings.address.zipCode}`
                          const coordinates = await getAddressCoordinates(fullAddress)
                          
                          // Atualiza as coordenadas do restaurante
                          setSettings(prev => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              coordinates
                            }
                          }))

                          alert('Coordenadas atualizadas com sucesso!')
                        } catch (error) {
                          alert('Erro ao obter coordenadas. Verifique o endereço.')
                        }
                      }}
                      className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                    >
                      Atualizar Coordenadas
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Este endereço será usado como ponto de partida para calcular as distâncias de entrega
                  </p>
                </div>

                {settings.address.coordinates && (
                  <div className="sm:col-span-2">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium text-green-900">
                          Coordenadas: {settings.address.coordinates.lat}, {settings.address.coordinates.lng}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pagamento */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Formas de Pagamento
              </label>
              <div className="mt-4 space-y-2">
                {['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Vale-Refeição'].map(method => (
                  <label key={method} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.deliveryInfo.paymentMethods.includes(method)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSettings(prev => ({
                            ...prev,
                            deliveryInfo: {
                              ...prev.deliveryInfo,
                              paymentMethods: [...prev.deliveryInfo.paymentMethods, method]
                            }
                          }))
                        } else {
                          setSettings(prev => ({
                            ...prev,
                            deliveryInfo: {
                              ...prev.deliveryInfo,
                              paymentMethods: prev.deliveryInfo.paymentMethods.filter(m => m !== method)
                            }
                          }))
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-900">{method}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>
    </div>
  )
} 