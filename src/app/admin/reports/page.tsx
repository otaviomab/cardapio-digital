'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { 
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  Users,
  Star,
  ArrowUp,
  ArrowDown,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
        setReportData(data)
      } catch (error) {
        console.error('Erro ao carregar relatório:', error)
        alert('Erro ao carregar dados do relatório')
      } finally {
        setIsLoading(false)
      }
    }

    loadReportData()
  }, [supabase, dateRange])

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Acompanhe as métricas do seu negócio</p>
        </div>

        {/* Seletor de Período */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
          <button
            onClick={() => navigatePeriod('prev')}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 text-gray-900">
            <Calendar className="h-5 w-5" />
            <span className="font-medium">
              {format(dateRange.startDate, "dd 'de' MMMM", { locale: ptBR })}
              {' - '}
              {format(dateRange.endDate, "dd 'de' MMMM", { locale: ptBR })}
            </span>
          </div>

          <button
            onClick={() => navigatePeriod('next')}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            disabled={dateRange.endDate >= new Date()}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="rounded-lg border border-gray-200 bg-white p-6"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-50 p-3">
                  <Icon className="h-6 w-6 text-green-600" />
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
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-gray-900">
            Produtos Mais Vendidos
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {reportData.bestSellingProducts.map((product, index) => (
            <div
              key={product.name}
              className="flex items-center justify-between px-6 py-4"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-900">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">
                    {product.quantity} unidades vendidas
                  </p>
                </div>
              </div>
              <p className="font-medium text-gray-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(product.revenue)}
              </p>
            </div>
          ))}

          {reportData.bestSellingProducts.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-600">
              Nenhum produto vendido no período selecionado.
            </div>
          )}
        </div>
      </div>

      {/* Faturamento por Dia */}
      {reportData.revenueByDay.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
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
                        className="absolute bottom-0 w-full rounded-t-lg bg-green-100"
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
        <div className="rounded-lg border border-gray-200 bg-white">
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
                        className="absolute bottom-0 w-full rounded-t-lg bg-green-100"
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
  )
} 