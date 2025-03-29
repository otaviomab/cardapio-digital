import { useState, useEffect } from 'react'
import { type WeekDay } from '@/lib/hours-validation'

interface OpeningHour {
  days: WeekDay[]
  start: string
  end: string
  enabled: boolean
}

interface UseRestaurantHoursResult {
  isOpen: boolean
  nextOpeningTime: string | null
  currentSchedule: string | null
  isLoading: boolean
}

// Mapeia os dias da semana para números (0 = Domingo, 1 = Segunda, etc)
const dayToNumber: Record<WeekDay, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6
}

// Mapeia números para nomes dos dias
const numberToDay: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado'
}

export function useRestaurantHours(openingHours: OpeningHour[]): UseRestaurantHoursResult {
  const [isOpen, setIsOpen] = useState(false)
  const [nextOpeningTime, setNextOpeningTime] = useState<string | null>(null)
  const [currentSchedule, setCurrentSchedule] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!openingHours || openingHours.length === 0) {
      console.warn('Nenhum horário de funcionamento fornecido')
      setIsLoading(false)
      return
    }

    const checkIsOpen = () => {
      const now = new Date()
      const currentDay = now.getDay() // 0 = Domingo, 1 = Segunda, ...
      const currentTime = now.getHours() * 60 + now.getMinutes() // Converte para minutos

      let isCurrentlyOpen = false
      let nextOpening: string | null = null
      let current: string | null = null

      // Filtra apenas horários ativos
      const activeHours = openingHours.filter(hour => hour.enabled)

      for (const schedule of activeHours) {
        // Converte os dias do horário para números
        const scheduleDays = schedule.days.map(day => dayToNumber[day])

        // Se o dia atual está incluído neste horário
        if (scheduleDays.includes(currentDay)) {
          // Formata o horário atual para exibição
          const daysFormatted = schedule.days
            .map(day => numberToDay[dayToNumber[day]])
            .join(', ')
          current = `${daysFormatted}: ${schedule.start} às ${schedule.end}`
          
          // Converte os horários para minutos
          const [startHours, startMinutes] = schedule.start.split(':').map(Number)
          const [endHours, endMinutes] = schedule.end.split(':').map(Number)
          const start = startHours * 60 + startMinutes
          const end = endHours * 60 + endMinutes

          // Verifica se o horário atual está dentro do período de funcionamento
          if (end < start) {
            // Caso especial: horário passa da meia-noite
            if (currentTime >= start || currentTime <= end) {
              isCurrentlyOpen = true
            }
          } else {
            // Caso normal: horário no mesmo dia
            if (currentTime >= start && currentTime <= end) {
              isCurrentlyOpen = true
            }
          }

          if (!isCurrentlyOpen && currentTime < start) {
            // Se ainda não abriu, este é o próximo horário de abertura
            nextOpening = schedule.start
          }
        }
      }

      setIsOpen(isCurrentlyOpen)
      setNextOpeningTime(nextOpening)
      setCurrentSchedule(current)
      setIsLoading(false)
    }

    // Verifica imediatamente
    checkIsOpen()

    // Configura o intervalo para verificar a cada minuto
    const interval = setInterval(checkIsOpen, 60000)

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(interval)
  }, [openingHours])

  return { 
    isOpen, 
    nextOpeningTime, 
    currentSchedule,
    isLoading 
  }
} 