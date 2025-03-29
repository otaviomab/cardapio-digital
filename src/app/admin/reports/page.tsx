'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { 
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  Users,
  Star,
  ArrowUp,
  ArrowDown,
  Filter
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateRangePicker } from '@/components/DateRangePicker'

interface ReportData {
  totalOrders: number
  totalRevenue: number
  averageTicket: number
  deliveryTime: number
  bestSellingProducts: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  revenueByDay: Array<{
    date: string
    value: number
  }>
  ordersByHour: Array<{
    hour: string
    quantity: number
  }>
}

export default function ReportsPage() {
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 7), // Últimos 7 dias por padrão
    endDate: new Date()
  })
  const [reportData, setReportData] = useState<ReportData>({
    totalOrders: 0,
    totalRevenue: 0,
    averageTicket: 0,
    deliveryTime: 0,
    bestSellingProducts: [],
    revenueByDay: [],
    ordersByHour: []
  })

  // Carrega os dados do relatório
  useEffect(() => {
    const loadReportData = async () => {
      try {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Usuário não autenticado')

        // Busca os dados do relatório da API
        const response = await fetch('/api/mongodb?action=getOrderStats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            restaurantId: user.id,
            startDate: startOfDay(dateRange.startDate).toISOString(),
            endDate: endOfDay(dateRange.endDate).toISOString()
          })
        })

        if (!response.ok) {
          throw new Error('Erro ao carregar dados do relatório')
        }

        const data = await response.json()

        // Agrupa produtos pelo nome
        const groupedProducts = data.bestSellingProducts.reduce((acc: any[], product: { name: string; quantity: number; revenue: number }) => {
          const existingProduct = acc.find(p => p.name === product.name)
          if (existingProduct) {
            existingProduct.quantity += product.quantity
            existingProduct.revenue += product.revenue
          } else {
            acc.push({ ...product })
          }
          return acc
        }, [])

        // Ordena por quantidade vendida
        groupedProducts.sort((a: { quantity: number }, b: { quantity: number }) => b.quantity - a.quantity)

        setReportData({
          ...data,
          bestSellingProducts: groupedProducts
        })
      } catch (error) {
        console.error('Erro ao carregar relatório:', error)
        alert('Erro ao carregar dados do relatório')
      } finally {
        setIsLoading(false)
      }
    }

    loadReportData()
  }, [supabase, dateRange])

  // Função para atualizar o intervalo de datas
  const updateDateRange = (startDate: Date, endDate: Date) => {
    setDateRange({ startDate, endDate })
  }

  // Navega entre períodos
  const navigatePeriod = (direction: 'prev' | 'next') => {
    const days = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    setDateRange(prev => {
      if (direction === 'prev') {
        return {
          startDate: subDays(prev.startDate, days),
          endDate: subDays(prev.endDate, days)
        }
      } else {
        // Não permite selecionar datas futuras
        const today = new Date()
        const newEndDate = new Date(Math.min(
          addDays(prev.endDate, days).getTime(),
          today.getTime()
        ))
        return {
          startDate: subDays(newEndDate, days - 1),
          endDate: newEndDate
        }
      }
    })
  }

  const stats = [
    {
      name: 'Total de Pedidos',
      value: reportData.totalOrders,
      icon: Package,
      trend: 'No período selecionado'
    },
    {
      name: 'Faturamento Total',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(reportData.totalRevenue),
      icon: DollarSign,
      trend: `${reportData.totalOrders} pedidos`
    },
    {
      name: 'Ticket Médio',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(reportData.averageTicket),
      icon: TrendingUp,
      trend: 'Média por pedido'
    }
  ]

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-krato-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden pb-20">
      <div className="flex flex-col gap-6 px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">Relatórios</h1>
            <p className="text-gray-600">Acompanhe as métricas do seu negócio</p>
          </div>

          {/* Novo Seletor de Período com Calendário */}
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={updateDateRange}
            onPreviousPeriod={() => navigatePeriod('prev')}
            onNextPeriod={() => navigatePeriod('next')}
            isNextDisabled={dateRange.endDate >= new Date()}
          />
        </div>

        {/* Cards de Métricas */}
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.name}
                className="rounded-lg border border-gray-200 bg-white p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-krato-50 p-3">
                    <Icon className="h-6 w-6 text-krato-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{stat.trend}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Produtos Mais Vendidos */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="font-semibold text-gray-900">
              Produtos Mais Vendidos
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {reportData.bestSellingProducts.map((product, index) => (
              <div
                key={`${index}-${product.name}`}
                className="flex items-center justify-between p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-krato-50">
                    <Star className="h-6 w-6 text-krato-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.quantity} unidades vendidas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(product.revenue)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(product.revenue / product.quantity)} por unidade
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Faturamento por Dia */}
        {reportData.revenueByDay.length > 0 && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                Faturamento por Dia
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-7 gap-4">
                {reportData.revenueByDay.map((day) => {
                  const maxValue = Math.max(...reportData.revenueByDay.map(d => d.value))
                  const height = maxValue > 0 ? (day.value / maxValue) * 150 : 0
                  
                  return (
                    <div key={day.date} className="flex flex-col items-center">
                      <div className="relative h-[150px] w-full">
                        <div
                          className="absolute bottom-0 w-full rounded-t-lg bg-krato-100"
                          style={{ height: `${height}px` }}
                        />
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-600">
                        {format(new Date(day.date), 'EEE', { locale: ptBR })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(day.value)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Pedidos por Horário */}
        {reportData.ordersByHour.length > 0 && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                Pedidos por Horário
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-6 gap-4">
                {reportData.ordersByHour.map((timeSlot) => {
                  const maxQuantity = Math.max(...reportData.ordersByHour.map(t => t.quantity))
                  const height = maxQuantity > 0 ? (timeSlot.quantity / maxQuantity) * 150 : 0
                  
                  return (
                    <div key={timeSlot.hour} className="flex flex-col items-center">
                      <div className="relative h-[150px] w-full">
                        <div
                          className="absolute bottom-0 w-full rounded-t-lg bg-krato-100"
                          style={{ height: `${height}px` }}
                        />
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-600">
                        {timeSlot.hour}
                      </p>
                      <p className="text-xs text-gray-500">
                        {timeSlot.quantity} pedidos
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 