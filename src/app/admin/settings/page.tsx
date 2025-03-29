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
  AlertTriangle,
  Printer
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useSupabase } from '@/contexts/SupabaseContext'
import { PatternFormat } from 'react-number-format'
import { DeliveryZones } from './components/delivery-zones'
import { getAddressCoordinates } from '@/services/distanceService'
import { DeliveryZone } from '@/types/delivery'
import { ImageUpload } from '@/components/image-upload'
import { fetchAddressByCep } from '@/lib/address'
import { RestaurantType } from '@/types/restaurant'
import { 
  validateHourFormat, 
  validateHourSequence, 
  checkConflicts, 
  normalizeHours,
  translateWeekDay,
  type WeekDay,
  type OpeningHour
} from '@/lib/hours-validation'
import { InvalidCepError, AddressNotFoundError } from '@/services/errors'
import { toast } from 'react-hot-toast'
import { fetchAddressWithValidation, formatCep } from '@/services/cepService'
import { createClient } from '@supabase/supabase-js'

// Função auxiliar para formatar datas no padrão brasileiro
const formatBrazilianDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return 'N/A';
  
  try {
    return new Date(dateString).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

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
    restaurantType: RestaurantType
  }
  restaurantType: RestaurantType
  whatsappConnection?: {
    instanceName: string
    instanceId: string
    status: string
    isConnected: boolean
    pairingCode: string
    lastConnected: string
    tempQrCode?: string
    tempQrCodeBase64?: string
    initialMessage?: string
  }
  phoneNumber?: string
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
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [isGeneratingQrCode, setIsGeneratingQrCode] = useState(false)
  const [isCheckingConnection, setIsCheckingConnection] = useState(false)
  const [error, setError] = useState<string>('');
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
      zones: [],
      restaurantType: RestaurantType.RESTAURANT
    },
    restaurantType: RestaurantType.RESTAURANT,
    whatsappConnection: {
      instanceName: '',
      instanceId: '',
      status: 'disconnected',
      isConnected: false,
      pairingCode: '',
      lastConnected: '',
      tempQrCode: '',
      tempQrCodeBase64: '',
      initialMessage: ''
    },
    phoneNumber: ''
  })

  // Carrega as configurações
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          // Não está autenticado, redirecionar
          return
        }

        const { data, error } = await supabase
          .from('restaurant_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Erro ao carregar configurações:', error)
          throw error
        }

        if (data) {
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
            openingHours: Array.isArray(data.opening_hours) && data.opening_hours.length > 0 ? 
              data.opening_hours : 
              [{ days: [], start: '', end: '', enabled: true }],
            deliveryInfo: {
              minimumOrder: data.delivery_info?.minimumOrder ?? 0,
              deliveryTime: data.delivery_info?.deliveryTime || '',
              paymentMethods: data.delivery_info?.paymentMethods || [],
              zones: data.delivery_info?.zones || [],
              restaurantType: data.restaurant_type || data.delivery_info?.restaurantType || RestaurantType.RESTAURANT
            },
            restaurantType: data.restaurant_type || data.delivery_info?.restaurantType || RestaurantType.RESTAURANT,
            whatsappConnection: {
              instanceName: data.whatsapp_connection?.instanceName || '',
              instanceId: data.whatsapp_connection?.instanceId || '',
              // Usar o campo whatsapp_status se estiver disponível, caso contrário, usar o status do whatsapp_connection
              status: data.whatsapp_status || data.whatsapp_connection?.status || 'disconnected',
              // Definir isConnected baseado no status
              isConnected: (data.whatsapp_status === 'open') || data.whatsapp_connection?.isConnected || false,
              pairingCode: data.whatsapp_connection?.pairingCode || '',
              lastConnected: data.whatsapp_connection?.lastConnected || '',
              tempQrCode: data.whatsapp_connection?.tempQrCode || '',
              tempQrCodeBase64: data.whatsapp_connection?.tempQrCodeBase64 || '',
              initialMessage: data.whatsapp_saudacao || ''
            }
          })
          
          console.log('Status do WhatsApp carregado do banco:', {
            whatsapp_status: data.whatsapp_status,
            status_from_connection: data.whatsapp_connection?.status,
            is_connected: (data.whatsapp_status === 'open') || data.whatsapp_connection?.isConnected
          });
          
          // Verifica o estado da conexão do WhatsApp se houver uma instância configurada
          if (data.whatsapp_connection?.instanceName) {
            handleCheckWhatsAppConnection();
          }
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

  // Função para verificar o estado da conexão do WhatsApp
  const handleCheckWhatsAppConnection = async () => {
    try {
      setIsCheckingConnection(true);
      setError('');
      
      // Obter o ID do restaurante
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        toast.error('Usuário não autenticado');
        return;
      }
      
      // Buscar o ID do restaurante
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurant_settings')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();
      
      if (restaurantError) {
        console.error('Erro ao buscar ID do restaurante:', restaurantError);
        toast.error('Erro ao identificar o restaurante');
        return;
      }
      
      const restaurantId = restaurantData?.id || '';
      
      if (!restaurantId) {
        toast.error('ID do restaurante não disponível');
        return;
      }
      
      console.log('Verificando status da conexão do WhatsApp para o restaurante:', restaurantId);
      
      // Fazer requisição para a API de verificação
      const response = await fetch(`https://api.krato.ai/webhook/8c251c10-7b30-448e-ab21-c11eb1d1f801?id=${restaurantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao verificar conexão com WhatsApp');
      }
      
      const responseData = await response.json();
      
      console.log('Resposta da verificação do WhatsApp:', responseData);
      
      // Processar resposta da API
      if (responseData && responseData.length > 0) {
        const status = responseData[0]?.response;
        
        // Atualizar o status no estado local
        setSettings(prev => ({
          ...prev,
          whatsappConnection: {
            instanceName: prev.whatsappConnection?.instanceName || '',
            instanceId: prev.whatsappConnection?.instanceId || '',
            status: status || 'unknown',
            isConnected: status === 'open',
            pairingCode: prev.whatsappConnection?.pairingCode || '',
            lastConnected: new Date().toISOString(),
            tempQrCode: prev.whatsappConnection?.tempQrCode || '',
            tempQrCodeBase64: prev.whatsappConnection?.tempQrCodeBase64 || '',
            initialMessage: prev.whatsappConnection?.initialMessage || ''
          }
        }));
        
        // Atualizar o status no banco de dados imediatamente
        try {
          const { error: updateError } = await supabase
            .from('restaurant_settings')
            .update({
              whatsapp_status: status
            })
            .eq('user_id', currentUser.id);
            
          if (updateError) {
            console.error('Erro ao atualizar status do WhatsApp no banco:', updateError);
          } else {
            console.log('Status do WhatsApp atualizado no banco:', status);
          }
        } catch (updateError) {
          console.error('Erro ao atualizar status do WhatsApp:', updateError);
        }
        
        // Mostrar mensagem de acordo com o status
        if (status === 'open') {
          toast.success('WhatsApp conectado com sucesso!');
        } else if (status === 'connecting') {
          toast.success('WhatsApp está em processo de conexão. Verifique novamente em 15 segundos.');
        } else if (status === 'close') {
          toast.error('WhatsApp desconectado. É necessário escanear o QR Code novamente.');
        } else {
          toast.error('Status desconhecido. Por favor, tente reconectar o WhatsApp.');
        }
      } else {
        toast.error('Resposta inválida da API. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao verificar status do WhatsApp:', error);
      setError(error instanceof Error ? error.message : 'Erro ao verificar conexão do WhatsApp');
      toast.error('Erro ao verificar conexão com WhatsApp. Por favor, tente novamente mais tarde.');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // Função auxiliar para processar a mensagem inicial substituindo variáveis
  // IMPORTANTE: Esta função deve ser chamada antes de enviar a mensagem ao WhatsApp
  // Exemplo de uso:
  // 1. Obter a mensagem salva: const savedMessage = settings.whatsapp_saudacao;
  // 2. Obter o slug do restaurante: const slug = settings.slug;
  // 3. Processar a mensagem: const processedMessage = processInitialMessage(savedMessage, slug);
  // 4. Enviar processedMessage para o WhatsApp API
  const processInitialMessage = (message: string, slug: string): string => {
    if (!message) return '';
    
    // Obtém o hostname atual, ou usa um padrão se não estiver disponível
    let baseUrl = '';
    if (typeof window !== 'undefined') {
      // Em ambiente de navegador, usamos a origem atual
      baseUrl = window.location.origin;
    } else {
      // Em ambiente de servidor, usamos um valor padrão
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cardapio.seudominio.com.br';
    }
    
    // Constrói o link completo do cardápio
    const cardapioUrl = `${baseUrl}/${slug}`;
    
    // Substitui a variável {cardapio} pelo link
    return message.replace(/\{cardapio\}/g, cardapioUrl);
  };

  // Função para salvar configurações
  const handleSave = async (showNotification = true) => {
    try {
      setIsSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Você precisa estar logado para salvar as configurações')
      }
      
      // Gera o slug a partir do nome
      let slug = settings.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-')
      
      // Verifica se já existe um restaurante com este slug
      const { data: existingSlugs, error: slugError } = await supabase
        .from('restaurant_settings')
        .select('id')
        .eq('slug', slug)
        .neq('user_id', user.id)
      
      // Se já existe um restaurante com este slug, adiciona um número incremental
      if (existingSlugs && existingSlugs.length > 0) {
        let counter = 1
        let newSlug = `${slug}-${counter}`
        
        while (true) {
          const { data: slugChecks } = await supabase
            .from('restaurant_settings')
            .select('id')
            .eq('slug', newSlug)
            .neq('user_id', user.id)
          
          if (!slugChecks || slugChecks.length === 0) {
            slug = newSlug
            break
          }
          
          counter++
          newSlug = `${slug}-${counter}`
        }
      }

      // Verifica se já existe configuração para este usuário
      const { data: existingSettingsArray } = await supabase
        .from('restaurant_settings')
        .select('id, whatsapp_saudacao')
        .eq('user_id', user.id)
      
      const existingSettings = existingSettingsArray && existingSettingsArray.length > 0 
        ? existingSettingsArray[0] 
        : null
        
      // Processa a mensagem inicial, substituindo a variável {cardapio}
      const processedInitialMessage = settings.whatsappConnection?.initialMessage 
        ? processInitialMessage(settings.whatsappConnection.initialMessage, slug)
        : '';

      // Log do estado atual das configurações de WhatsApp
      console.log('📱 Dados atuais do WhatsApp no state:', {
        instanceName: settings.whatsappConnection?.instanceName,
        instanceId: settings.whatsappConnection?.instanceId,
        status: settings.whatsappConnection?.status,
        isConnected: settings.whatsappConnection?.isConnected,
        pairingCode: settings.whatsappConnection?.pairingCode ? 'Disponível' : 'Não disponível',
        lastConnected: settings.whatsappConnection?.lastConnected ? 
          formatBrazilianDateTime(settings.whatsappConnection.lastConnected) : 'Não disponível',
        initialMessage: settings.whatsappConnection?.initialMessage || '',
        processedMessage: processedInitialMessage
      });
      
      // Log dos dados existentes no banco
      if (existingSettings) {
        console.log('📱 Dados atuais do WhatsApp no banco (saudação):', existingSettings.whatsapp_saudacao || 'Não disponível');
      }

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
        opening_hours: settings.openingHours
          .filter(hour => hour.enabled && hour.days.length > 0)
          .map(hour => {
            // Validar formato de horário apenas se estiver na aba de horários
            // ou se os horários estiverem sendo salvos
            if (activeTab !== 'hours' && (!validateHourFormat(hour.start) || !validateHourFormat(hour.end))) {
              // Se não estiver na aba de horários, não validar o formato
              return {
                days: hour.days.filter(day => VALID_WEEK_DAYS.includes(day)) as WeekDay[],
                start: hour.start,
                end: hour.end,
                enabled: hour.enabled
              }
            }
            
            return {
              days: hour.days.filter(day => VALID_WEEK_DAYS.includes(day)) as WeekDay[],
              start: hour.start.trim(),
              end: hour.end.trim(),
              enabled: hour.enabled
            }
          }),
        delivery_info: {
          minimumOrder: Number(settings.deliveryInfo.minimumOrder) || 0,
          deliveryTime: settings.deliveryInfo.deliveryTime?.trim() || '',
          paymentMethods: settings.deliveryInfo.paymentMethods || [],
          zones: settings.deliveryInfo.zones.map(zone => ({
            ...zone,
            minDistance: Number(zone.minDistance) || 0,
            maxDistance: Number(zone.maxDistance) || 0,
            fee: Number(zone.fee) || 0
          })),
          restaurantType: settings.restaurantType
        },
        restaurant_type: settings.restaurantType,
        whatsapp_status: settings.whatsappConnection?.status || 'disconnected',
        whatsapp_saudacao: settings.whatsappConnection?.initialMessage 
          ? processInitialMessage(settings.whatsappConnection.initialMessage, slug) 
          : ''
      }
      
      if (existingSettings) {
        // Atualiza as configurações existentes
        const { data, error } = await supabase
          .from('restaurant_settings')
          .update(settingsData)
          .eq('user_id', user.id)
          .select()

        if (error) {
          console.error('❌ Erro ao atualizar:', error)
          throw new Error('Erro ao atualizar as configurações')
        }
        
        console.log('✅ Configurações atualizadas com sucesso!', data);
      } else {
        // Cria novas configurações
        const { data, error } = await supabase
          .from('restaurant_settings')
          .insert([settingsData])
          .select()

        if (error) {
          console.error('❌ Erro ao criar:', error)
          throw new Error('Erro ao criar as configurações')
        }
        
        console.log('✅ Configurações criadas com sucesso!', data);
      }
      
      // Verificar se os dados foram realmente salvos
      const { data: verifyData, error: verifyError } = await supabase
        .from('restaurant_settings')
        .select('whatsapp_saudacao')
        .eq('user_id', user.id)
        .single();
        
        if (verifyError) {
          console.error('❌ Erro ao verificar dados salvos:', verifyError);
        } else {
          console.log('✅ Dados verificados após salvamento:', verifyData?.whatsapp_saudacao);
        }

      if (showNotification) {
        alert('Configurações salvas com sucesso!')
      }
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error)
      if (showNotification) {
        alert(error instanceof Error ? error.message : 'Erro ao salvar configurações. Tente novamente.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'Geral', icon: Store },
    { id: 'address', label: 'Endereço', icon: MapPin },
    { id: 'hours', label: 'Horários', icon: Clock },
    { id: 'delivery', label: 'Entregas', icon: Truck },
    { id: 'type', label: 'Tipo de Estabelecimento', icon: Store },
    { id: 'payment', label: 'Pagamentos', icon: CreditCard },
    { id: 'whatsapp', label: 'WhatsApp', icon: () => (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"></path>
        <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z"></path>
        <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z"></path>
        <path d="M9.5 13.5a5 5 0 0 0 5 0"></path>
      </svg>
    ) },
    { id: 'thermal-printing', label: 'Impressão Térmica', icon: Printer }
  ]

  // Função auxiliar para obter o token
  const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  const handleConnectWhatsApp = async (phoneNumber?: string) => {
    try {
      setIsGeneratingQrCode(true);
      setError('');
      
      // Obter o ID do restaurante
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        toast.error('Usuário não autenticado');
        return;
      }
      
      // Obter o token da sessão atual
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        toast.error('Erro de autenticação. Por favor, tente fazer login novamente.');
        return;
      }
      
      // Buscar o ID do restaurante
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurant_settings')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();
      
      if (restaurantError) {
        console.error('Erro ao buscar ID do restaurante:', restaurantError);
        toast.error('Erro ao identificar o restaurante');
        return;
      }
      
      const restaurantId = restaurantData?.id || '';
      
      if (!restaurantId) {
        toast.error('ID do restaurante não disponível');
        return;
      }
      
      // Formatar o número de telefone
      let formattedPhoneNumber = '';
      
      if (phoneNumber) {
        formattedPhoneNumber = phoneNumber.replace(/\D/g, '');
      } else if (settings.contact?.whatsapp) {
        formattedPhoneNumber = settings.contact.whatsapp.replace(/\D/g, '');
      }
      
      // Garantir que o número esteja no formato correto
      if (formattedPhoneNumber && !formattedPhoneNumber.startsWith('55')) {
        formattedPhoneNumber = `55${formattedPhoneNumber}`;
      }
      
      // Preparar payload para a API
      const payload = {
        instanceName: restaurantId,
        phoneNumber: formattedPhoneNumber || undefined
      };
      
      console.log('Enviando requisição para /api/whatsapp:', payload);
      
      // Fazer chamada à API com o token de autorização
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao conectar WhatsApp');
      }
      
      const responseData = await response.json();
      
      if (responseData.success) {
        console.log('Conexão com WhatsApp iniciada com sucesso!');
        
        // Atualizar apenas o QR code temporário na interface
        if (responseData.qrcode) {
          setSettings(prev => ({
            ...prev,
            whatsappConnection: {
              instanceName: prev.whatsappConnection?.instanceName || restaurantId,
              instanceId: prev.whatsappConnection?.instanceId || '',
              status: responseData.instance?.status || 'connecting',
              isConnected: prev.whatsappConnection?.isConnected || false,
              pairingCode: responseData.qrcode.pairingCode || '',
              lastConnected: prev.whatsappConnection?.lastConnected || new Date().toISOString(),
              tempQrCode: prev.whatsappConnection?.tempQrCode || '',
              tempQrCodeBase64: responseData.qrcode.base64 || '',
              initialMessage: prev.whatsappConnection?.initialMessage || ''
            }
          }));
          
          toast.success('QR Code gerado com sucesso! Escaneie-o com seu WhatsApp.');
        } else {
          toast.error('QR Code não disponível. Por favor, tente novamente.');
        }
      } else {
        toast.error(responseData.error || 'Erro ao gerar QR Code para WhatsApp');
      }
    } catch (error) {
      console.error('Erro ao conectar com WhatsApp:', error);
      setError(error instanceof Error ? error.message : 'Erro ao conectar WhatsApp');
      toast.error('Erro ao conectar com WhatsApp. Por favor, tente novamente mais tarde.');
    } finally {
      setIsGeneratingQrCode(false);
    }
  }

  return (
    <div className="min-h-screen space-y-6 pb-20">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">Configurações</h1>
        <p className="mt-2 text-sm text-gray-600 lg:text-base">Gerencie as configurações do seu restaurante</p>

        {/* Tabs */}
        <div className="mt-8">
          <div className="no-scrollbar -mb-px flex overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              
              // Para o tab de impressão térmica, usar um link em vez de botão
              if (tab.id === 'thermal-printing') {
                return (
                  <a
                    key={tab.id}
                    href="/admin/settings/thermal-printing"
                    className="flex min-w-fit items-center gap-2 border-b-2 border-transparent px-3 py-4 text-sm font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 sm:px-4"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </a>
                )
              }
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-w-fit items-center gap-2 border-b-2 px-3 py-4 text-sm font-medium transition-colors sm:px-4 ${
                    activeTab === tab.id
                      ? 'border-krato-500 text-krato-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Informações Gerais */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Nome do Restaurante
                  </label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={e => setSettings(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
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
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
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
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
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
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
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
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
                />
              </div>

              {/* Grid para Logo e Capa lado a lado */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col h-full">
                  <label className="block text-sm font-medium text-gray-700">
                    Logo do Restaurante
                  </label>
                  <div className="mt-1 flex-grow">
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

                <div className="flex flex-col h-full">
                  <label className="block text-sm font-medium text-gray-700">
                    Imagem de Capa
                  </label>
                  <div className="mt-1 flex-grow">
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
          )}

          {/* Endereço */}
          {activeTab === 'address' && (
            <div className="grid gap-4">
              <div className="col-span-full">
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
                          // Usa a função com validação completa
                          const result = await fetchAddressWithValidation(newCep)
                          
                          if (result.isValid && result.address) {
                            // Atualiza os dados do endereço
                            setSettings(prev => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                street: result.address?.street || '',
                                neighborhood: result.address?.neighborhood || '',
                                city: result.address?.city || '',
                                state: result.address?.state || '',
                                zipCode: result.address?.zipCode || ''
                              }
                            }))
                          } else {
                            // Exibe mensagem de erro
                            toast.error(result.error || 'Erro ao buscar CEP')
                            
                            // Limpa os campos de endereço para preenchimento manual
                            setSettings(prev => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                zipCode: formatCep(newCep), // Mantém o CEP formatado
                                street: '',
                                neighborhood: '',
                                city: '',
                                state: ''
                              }
                            }))
                          }
                        } catch (error) {
                          // Tratamento específico para cada tipo de erro
                          if (error instanceof InvalidCepError) {
                            toast.error('CEP inválido. Verifique o número informado.')
                          } else if (error instanceof AddressNotFoundError) {
                            toast.error('CEP não encontrado. Verifique o número ou preencha o endereço manualmente.')
                          } else {
                            toast.error('Erro ao buscar CEP. Tente novamente ou preencha o endereço manualmente.')
                          }
                          
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
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
                  />
                </div>
              </div>

              <div className="col-span-full">
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
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
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
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
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
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Horários */}
          {activeTab === 'hours' && (
            <div className="space-y-6">
              <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
                <div className="mb-4">
                  <h3 className="text-base font-medium text-gray-900 lg:text-lg">
                    Horários de Funcionamento
                  </h3>
                  <p className="text-sm text-gray-500">
                    Configure os horários de funcionamento do seu estabelecimento
                  </p>
                </div>

                <div className="space-y-4">
                  {settings.openingHours.map((hour, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
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

                      <div className="space-y-4">
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
                                      ? 'bg-krato-50 text-krato-700 border-2 border-krato-600'
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
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
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
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
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
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-krato-600 hover:text-krato-700"
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
                <h3 className="text-base font-medium text-gray-900 lg:text-lg">
                  Configurações Básicas de Entrega
                </h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
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
                        className="block w-full rounded-none rounded-r-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
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
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
                    />
                  </div>
                </div>
              </div>

              {/* Zonas de Entrega */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
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
                <h3 className="text-base font-medium text-gray-900 lg:text-lg">
                  Localização do Restaurante
                </h3>
                
                <div className="grid gap-4">
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700">
                      Endereço Completo
                    </label>
                    <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={`${settings.address.street}, ${settings.address.number} - ${settings.address.neighborhood}, ${settings.address.city} - ${settings.address.state}, ${settings.address.zipCode}`}
                        readOnly
                        className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
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
                        className="whitespace-nowrap rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                      >
                        Atualizar Coordenadas
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Este endereço será usado como ponto de partida para calcular as distâncias de entrega
                    </p>
                  </div>

                  {settings.address.coordinates && (
                    <div className="col-span-full">
                      <div className="rounded-lg border border-krato-200 bg-krato-50 p-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-krato-500" />
                          <span className="text-sm font-medium text-krato-900">
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

          {/* Tipo de Estabelecimento */}
          {activeTab === 'type' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-medium text-gray-900 lg:text-lg">
                  Tipo de Estabelecimento
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Selecione o tipo de estabelecimento para habilitar funcionalidades específicas.
                </p>

                <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {Object.entries(RestaurantType).map(([key, value]) => (
                    <div 
                      key={key}
                      className={`relative flex cursor-pointer flex-col rounded-lg border p-4 ${
                        settings.restaurantType === value 
                          ? 'border-krato-500 bg-krato-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        restaurantType: value as RestaurantType
                      }))}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            settings.restaurantType === value 
                              ? 'bg-krato-100 text-krato-600' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Store className="h-5 w-5" />
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-gray-900">
                              {value === 'restaurant' 
                                ? 'Restaurante' 
                                : value.charAt(0).toUpperCase() + value.slice(1)}
                            </h4>
                          </div>
                        </div>
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                          settings.restaurantType === value 
                            ? 'border-2 border-krato-500 bg-white' 
                            : 'border border-gray-300'
                        }`}>
                          {settings.restaurantType === value && (
                            <div className="h-2.5 w-2.5 rounded-full bg-krato-500"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {settings.restaurantType === RestaurantType.PIZZARIA && (
                  <div className="mt-6 rounded-lg border border-krato-200 bg-krato-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-krato-100 text-krato-600">
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-sm font-medium text-krato-900">
                          Funcionalidades de Pizzaria Habilitadas
                        </h4>
                        <p className="mt-1 text-sm text-krato-700">
                          Com esta opção, o sistema permitirá que seus clientes façam pedidos de pizza com sabores diferentes em cada metade.
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-krato-700">
                          <li className="flex items-center">
                            <div className="mr-2 h-1.5 w-1.5 rounded-full bg-krato-500"></div>
                            Opção de meia-a-meia nos produtos de pizza
                          </li>
                          <li className="flex items-center">
                            <div className="mr-2 h-1.5 w-1.5 rounded-full bg-krato-500"></div>
                            Interface especial para seleção de sabores
                          </li>
                          <li className="flex items-center">
                            <div className="mr-2 h-1.5 w-1.5 rounded-full bg-krato-500"></div>
                            Cálculo automático de preço para combinações
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
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
                        className="h-4 w-4 rounded border-gray-300 text-krato-500 focus:ring-krato-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">{method}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-8">
              {/* Status da Conexão */}
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 lg:text-lg">
                      Status da Conexão WhatsApp
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {settings.whatsappConnection?.isConnected 
                        ? "WhatsApp conectado e pronto para receber pedidos."
                        : "Conecte seu WhatsApp para receber pedidos diretamente no aplicativo."}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className={`mr-2 h-3 w-3 rounded-full ${
                      settings.whatsappConnection?.isConnected 
                        ? "bg-green-500" 
                        : settings.whatsappConnection?.status === 'connecting' 
                          ? "bg-yellow-500" 
                          : "bg-red-500"
                    }`}></div>
                    <span className={`text-sm font-medium ${
                      settings.whatsappConnection?.isConnected 
                        ? "text-green-700" 
                        : settings.whatsappConnection?.status === 'connecting' 
                          ? "text-yellow-700" 
                          : "text-red-700"
                    }`}>
                      {settings.whatsappConnection?.isConnected 
                        ? "Conectado" 
                        : settings.whatsappConnection?.status === 'connecting' 
                          ? "Conectando" 
                          : "Desconectado"}
                    </span>
                  </div>
                </div>
                
                {settings.whatsappConnection?.lastConnected && (
                  <div className="mt-4 text-xs text-gray-500">
                    Última atualização: {formatBrazilianDateTime(settings.whatsappConnection.lastConnected)}
                  </div>
                )}
              </div>

              {/* QR Code e Pairing Code */}
              <div className="space-y-6">
                <h3 className="text-base font-medium text-gray-900 lg:text-lg">
                  Conectar WhatsApp
                </h3>
                
                {settings.whatsappConnection?.status === 'open' ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"></path>
                          <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z"></path>
                          <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z"></path>
                          <path d="M9.5 13.5a5 5 0 0 0 5 0"></path>
                        </svg>
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-sm font-medium text-green-900">
                          WhatsApp Conectado
                        </h4>
                        <p className="mt-1 text-sm text-green-700">
                          Seu WhatsApp está conectado e pronto para receber pedidos. Não é necessário escanear o QR code novamente.
                        </p>
                        <div className="mt-4 flex">
                          <button
                            type="button"
                            onClick={handleCheckWhatsAppConnection}
                            className="rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isCheckingConnection}
                          >
                            {isCheckingConnection ? (
                              <>
                                <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                                Verificando...
                              </>
                            ) : (
                              'Verificar Status da Conexão'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* QR Code */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                      <h4 className="text-sm font-medium text-gray-900">
                        Conectar via QR Code
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        Escaneie o QR Code com seu WhatsApp para conectar.
                      </p>
                      
                      <div className="mt-5 flex flex-col items-center">
                        {settings.whatsappConnection?.tempQrCodeBase64 ? (
                          <div className="flex h-56 w-56 items-center justify-center overflow-hidden rounded border border-gray-300 bg-white p-2">
                            <img 
                              src={settings.whatsappConnection.tempQrCodeBase64.startsWith('data:') 
                                ? settings.whatsappConnection.tempQrCodeBase64 
                                : `data:image/png;base64,${settings.whatsappConnection.tempQrCodeBase64}`}
                              alt="QR Code para WhatsApp" 
                              className="h-full w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex h-56 w-56 flex-col items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50">
                            <p className="text-center text-sm text-gray-500">
                              Clique no botão abaixo para gerar um QR Code
                            </p>
                          </div>
                        )}
                        
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleConnectWhatsApp()}
                            className="rounded-md bg-krato-500 px-4 py-2 text-sm font-medium text-white hover:bg-krato-600 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isGeneratingQrCode}
                          >
                            {isGeneratingQrCode ? (
                              <>
                                <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                                Gerando QR Code...
                              </>
                            ) : settings.whatsappConnection?.tempQrCodeBase64 ? (
                              'Atualizar QR Code'
                            ) : (
                              'Gerar QR Code'
                            )}
                          </button>
                          
                          {settings.whatsappConnection?.tempQrCodeBase64 && (
                            <button
                              type="button"
                              onClick={handleCheckWhatsAppConnection}
                              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={isCheckingConnection}
                            >
                              {isCheckingConnection ? (
                                <>
                                  <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                                  Verificando...
                                </>
                              ) : (
                                'Verificar Conexão'
                              )}
                            </button>
                          )}
                        </div>
                        
                        {error && (
                          <div className="mt-2 rounded-md bg-red-50 p-2 text-sm text-red-600">
                            {error}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Pairing Code */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                      <h4 className="text-sm font-medium text-gray-900">
                        Conectar via Código de Pareamento
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        Digite o código no seu WhatsApp para conectar.
                      </p>
                      
                      <div className="mt-5 flex flex-col items-center">
                        {settings.whatsappConnection?.pairingCode ? (
                          <div className="w-full rounded-md bg-gray-100 p-4">
                            <h5 className="mb-2 text-center text-sm font-medium text-gray-700">
                              Código de Pareamento:
                            </h5>
                            <div className="mb-2 flex items-center justify-center space-x-2">
                              {settings.whatsappConnection.pairingCode.split('').map((char, index) => (
                                <div 
                                  key={index} 
                                  className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-bold text-krato-600"
                                >
                                  {char}
                                </div>
                              ))}
                            </div>
                            <p className="text-center text-xs text-gray-600">
                              Siga as instruções abaixo para conectar
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-100 rounded-md w-full">
                            <p className="text-sm text-center text-gray-600">
                              Gere o QR Code primeiro para receber o código de pareamento
                            </p>
                          </div>
                        )}
                        
                        {/* Campo para inserir número de telefone */}
                        <div className="mt-4 w-full">
                          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                            Número de Telefone do WhatsApp
                          </label>
                          <div className="mt-1">
                            <PatternFormat
                              format="+55 (##) #####-####"
                              id="phoneNumber"
                              name="phoneNumber"
                              placeholder="Ex: +55 (11) 99999-9999"
                              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
                              value={settings.phoneNumber || ''}
                              onValueChange={(values) => {
                                const value = values.value || '';
                                setSettings(prev => ({
                                  ...prev,
                                  phoneNumber: value
                                }));
                              }}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Digite o número com DDD que será usado para conectar o WhatsApp.
                            </p>
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => handleConnectWhatsApp(settings.phoneNumber)}
                          className="mt-4 rounded-md bg-krato-500 px-4 py-2 text-sm font-medium text-white hover:bg-krato-600 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isGeneratingQrCode || !settings.phoneNumber}
                        >
                          {isGeneratingQrCode ? (
                            <>
                              <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                              Conectando...
                            </>
                          ) : (
                            'Conectar com Número'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Como funciona */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="h-5 w-5 text-blue-600"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 16v-4"></path>
                      <path d="M12 8h.01"></path>
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">
                        Como funciona
                      </h4>
                      <ul className="mt-2 text-sm text-blue-700">
                        <li>• Escaneie o QR Code com o seu WhatsApp para conectar</li>
                        <li>• Ou use o código de pareamento nas configurações do WhatsApp</li>
                        <li>• O QR Code expira após alguns minutos, gere um novo se necessário</li>
                        <li>• Mantenha seu WhatsApp conectado para receber os pedidos</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Mensagem Inicial */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="text-base font-medium text-gray-900 lg:text-lg mb-2">
                    Mensagem Inicial
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Esta mensagem será enviada automaticamente quando um cliente entrar em contato pelo WhatsApp.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="initialMessage" className="block text-sm font-medium text-gray-700 mb-1">
                        Chamada mensagem inicial
                      </label>
                      <textarea
                        id="initialMessage"
                        rows={4}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-krato-500 focus:outline-none focus:ring-krato-500"
                        placeholder="Exemplo: Olá! Seja bem-vindo ao [nome do restaurante]. Como posso ajudar você hoje?"
                        value={settings.whatsappConnection?.initialMessage || ''}
                        onChange={(e) => {
                          setSettings(prev => ({
                            ...prev,
                            whatsappConnection: {
                              ...prev.whatsappConnection!,
                              initialMessage: e.target.value
                            }
                          }));
                        }}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Você pode usar variáveis como {"{cardapio}"} que serão substituídas pelo link do seu cardapio.
                        <br />
                        Exemplo: "Acesse nosso cardápio em {"{cardapio}"}" ficará "Acesse nosso cardápio em https://seudominio.com/seu-restaurante"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer com botão de salvar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white px-4 py-4 sm:px-6 lg:left-64 lg:px-8">
        <div className="flex justify-end">
          <button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-krato-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-krato-600 disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>
  )
} 